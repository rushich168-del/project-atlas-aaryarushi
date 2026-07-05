import { productCategories as staticCategories, products as staticProducts } from '../data/products.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const statusLabels = {
  demo_ready: 'Demo Ready',
  launch_prep: 'Launch Prep',
  product_prep: 'Product Prep',
  ready: 'Ready',
  in_progress: 'In progress',
  planned: 'Planned',
  concept: 'Concept',
}

const staticCatalogOverlayStatuses = new Set(['Launch Prep', 'Product Prep'])

function normalizeDbCategory(category) {
  return {
    id: category.id,
    organizationId: category.organization_id,
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    sector: category.sector,
    sortOrder: category.sort_order || 0,
  }
}

function normalizeDbProduct(product) {
  return {
    id: product.id,
    organizationId: product.organization_id,
    categoryId: product.category_id,
    productCode: product.product_code,
    name: product.name,
    slug: product.slug,
    sector: product.sector,
    status: statusLabels[product.status] || product.status,
    summary: product.summary || '',
    audience: product.audience || '',
    stage: product.stage || '',
    currentVersion: product.current_version,
    desktopAvailable: product.desktop_available,
    saasAvailable: product.saas_available,
    isBeta: product.is_beta,
    isEnabled: product.is_enabled,
    metrics: Array.isArray(product.metrics) ? product.metrics : [],
    inputs: Array.isArray(product.inputs) ? product.inputs : [],
    outputs: Array.isArray(product.outputs) ? product.outputs : [],
    sortOrder: product.sort_order || 0,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }
}

function staticFallback(reason = '', status = 'static', organization = null) {
  return {
    organization,
    categories: staticCategories,
    products: staticProducts,
    source: 'static',
    status,
    message: reason,
  }
}

function findCategoryForStaticProduct(categories, staticProduct) {
  return categories.find((category) => (
    category.id === staticProduct.categoryId
    || category.slug === staticProduct.categoryId
    || category.sector === staticProduct.sector
  ))
}

function mergeStaticProductPrepProducts(categories, products) {
  const prepProducts = staticProducts.filter((product) => staticCatalogOverlayStatuses.has(product.status))
  const prepProductBySlug = new Map(prepProducts.map((product) => [product.slug, product]))
  const mergedProducts = products.map((product) => {
    const staticProduct = prepProductBySlug.get(product.slug)

    if (!staticProduct) {
      return product
    }

    return {
      ...staticProduct,
      id: product.id,
      organizationId: product.organizationId,
      categoryId: product.categoryId,
      sortOrder: product.sortOrder,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }
  })
  const productSlugs = new Set(mergedProducts.map((product) => product.slug))
  const categoryIds = new Set(categories.map((category) => category.id))
  const mergedCategories = [...categories]

  prepProducts
    .filter((product) => !productSlugs.has(product.slug))
    .forEach((product, index) => {
      const matchingCategory = findCategoryForStaticProduct(mergedCategories, product)
      const staticCategory = staticCategories.find((category) => category.id === product.categoryId)
      const categoryId = matchingCategory?.id || product.categoryId

      if (!matchingCategory && staticCategory && !categoryIds.has(staticCategory.id)) {
        mergedCategories.push(staticCategory)
        categoryIds.add(staticCategory.id)
      }

      mergedProducts.push({
        ...product,
        categoryId,
        sortOrder: products.length + index + 1,
      })
      productSlugs.add(product.slug)
    })

  return {
    categories: mergedCategories,
    products: mergedProducts,
  }
}

export async function getProductCategories(organizationId) {
  if (!isSupabaseConfigured || !organizationId) {
    return []
  }

  const { data, error } = await supabase
    .from('product_categories')
    .select('id, organization_id, name, slug, description, sector, sort_order, created_at, updated_at')
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []).map(normalizeDbCategory)
}

export async function getProducts(organizationId) {
  if (!isSupabaseConfigured || !organizationId) {
    return []
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      organization_id,
      category_id,
      product_code,
      name,
      slug,
      sector,
      status,
      summary,
      audience,
      stage,
      current_version,
      desktop_available,
      saas_available,
      is_beta,
      is_enabled,
      metrics,
      inputs,
      outputs,
      sort_order,
      created_at,
      updated_at
    `)
    .eq('organization_id', organizationId)
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []).map(normalizeDbProduct)
}

export async function getProductBySlug(organizationId, slug) {
  if (!isSupabaseConfigured || !organizationId || !slug) {
    return null
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      organization_id,
      category_id,
      product_code,
      name,
      slug,
      sector,
      status,
      summary,
      audience,
      stage,
      current_version,
      desktop_available,
      saas_available,
      is_beta,
      is_enabled,
      metrics,
      inputs,
      outputs,
      sort_order,
      created_at,
      updated_at
    `)
    .eq('organization_id', organizationId)
    .eq('slug', slug)
    .eq('is_enabled', true)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? normalizeDbProduct(data) : null
}

export async function getCatalogData(organizationId, organization = null) {
  if (!isSupabaseConfigured) {
    return staticFallback('Connect Supabase to use the live dashboard. A sample catalog is shown for review.', 'not_configured')
  }

  if (!organizationId) {
    return staticFallback('No workspace is linked to this account yet. A sample catalog is shown for review.', 'no_organization')
  }

  try {
    const [categories, products] = await Promise.all([
      getProductCategories(organizationId),
      getProducts(organizationId),
    ])

    if (categories.length === 0 || products.length === 0) {
      return staticFallback('The live catalog is ready for setup. A sample catalog is shown until products are seeded.', 'empty_catalog', organization)
    }

    const mergedCatalog = mergeStaticProductPrepProducts(categories, products)

    return {
      organization,
      categories: mergedCatalog.categories,
      products: mergedCatalog.products,
      source: 'supabase',
      status: 'connected',
      message: '',
    }
  } catch (error) {
    return staticFallback('The live catalog could not be loaded. A sample catalog is shown so the dashboard remains reviewable.', 'error', organization)
  }
}
