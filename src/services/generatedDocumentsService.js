import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const HISTORY_LIMIT = 50

function uniqueIds(rows, key) {
  return [...new Set((rows || []).map((row) => row[key]).filter(Boolean))]
}

function mapById(rows) {
  return new Map((rows || []).map((row) => [row.id, row]))
}

async function fetchRelated(table, organizationId, ids, columns) {
  if (ids.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq('organization_id', organizationId)
    .in('id', ids)

  if (error) {
    throw error
  }

  return data || []
}

function enrichDocument(document, related) {
  const product = related.products.get(document.product_id) || null
  const template = related.templates.get(document.template_id) || null
  const upload = related.uploads.get(document.upload_id) || null
  const draft = related.drafts.get(document.generation_draft_id) || null

  return {
    ...document,
    product,
    template,
    upload,
    draft,
    productLabel: product ? `${product.product_code || product.name}${product.name && product.product_code ? ` - ${product.name}` : ''}` : 'Unknown product',
    productName: product?.name || 'Unknown product',
    productCode: product?.product_code || '',
    templateLabel: template?.name || template?.file_name || 'Template unavailable',
    templateFileName: template?.file_name || '',
    uploadLabel: upload?.file_name || 'Upload unavailable',
    uploadRowCount: upload?.row_count ?? null,
    draftStatus: draft?.status || 'Unavailable',
  }
}

export async function getGeneratedDocumentsHistory(organizationId, limit = HISTORY_LIMIT) {
  if (!isSupabaseConfigured) {
    return {
      documents: [],
      metadataWarning: 'Connect Supabase to load stored generated documents from History.',
    }
  }

  if (!organizationId) {
    return {
      documents: [],
      metadataWarning: '',
    }
  }

  const { data, error } = await supabase
    .from('generated_documents')
    .select(`
      id,
      organization_id,
      product_id,
      template_id,
      upload_id,
      generation_draft_id,
      file_name,
      file_type,
      file_size,
      storage_bucket,
      storage_path,
      document_type,
      status,
      preview_row_index,
      merge_data,
      metadata,
      created_by,
      created_at,
      updated_at
    `)
    .eq('organization_id', organizationId)
    .eq('document_type', 'docx')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  const documents = data || []

  if (documents.length === 0) {
    return {
      documents: [],
      metadataWarning: '',
    }
  }

  const relatedResults = await Promise.allSettled([
    fetchRelated('products', organizationId, uniqueIds(documents, 'product_id'), 'id, product_code, name, slug'),
    fetchRelated('templates', organizationId, uniqueIds(documents, 'template_id'), 'id, name, file_name, version'),
    fetchRelated('uploads', organizationId, uniqueIds(documents, 'upload_id'), 'id, file_name, row_count, detected_columns, created_at'),
    fetchRelated('generation_drafts', organizationId, uniqueIds(documents, 'generation_draft_id'), 'id, status, preview_row_index, updated_at'),
  ])

  const related = {
    products: mapById(relatedResults[0].status === 'fulfilled' ? relatedResults[0].value : []),
    templates: mapById(relatedResults[1].status === 'fulfilled' ? relatedResults[1].value : []),
    uploads: mapById(relatedResults[2].status === 'fulfilled' ? relatedResults[2].value : []),
    drafts: mapById(relatedResults[3].status === 'fulfilled' ? relatedResults[3].value : []),
  }

  const failedLookups = relatedResults.filter((result) => result.status === 'rejected')

  return {
    documents: documents.map((document) => enrichDocument(document, related)),
    metadataWarning: failedLookups.length > 0 ? 'Some related product, template, upload, or draft details could not be loaded.' : '',
  }
}
