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

export async function getGenerationJobsHistory(organizationId, limit = HISTORY_LIMIT) {
  if (!isSupabaseConfigured) {
    return {
      jobs: [],
      metadataWarning: 'Connect Supabase to load stored batch jobs from History.',
    }
  }

  if (!organizationId) {
    return {
      jobs: [],
      metadataWarning: '',
    }
  }

  const { data, error } = await supabase
    .from('generation_jobs')
    .select(`
      id,
      organization_id,
      product_id,
      generation_draft_id,
      template_id,
      upload_id,
      status,
      total_rows,
      valid_rows,
      success_count,
      failure_count,
      created_by,
      created_at,
      completed_at,
      error_message
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  const jobs = data || []

  if (jobs.length === 0) {
    return {
      jobs: [],
      metadataWarning: '',
    }
  }

  const relatedResults = await Promise.allSettled([
    fetchRelated('products', organizationId, uniqueIds(jobs, 'product_id'), 'id, product_code, name, slug'),
    fetchRelated('templates', organizationId, uniqueIds(jobs, 'template_id'), 'id, name, file_name, version'),
    fetchRelated('uploads', organizationId, uniqueIds(jobs, 'upload_id'), 'id, file_name, row_count, detected_columns, created_at'),
    fetchRelated('generation_drafts', organizationId, uniqueIds(jobs, 'generation_draft_id'), 'id, status, preview_row_index, updated_at'),
  ])

  const { data: outputs, error: outputsError } = await supabase
    .from('generation_outputs')
    .select(`
      id,
      job_id,
      organization_id,
      product_id,
      generation_draft_id,
      row_index,
      display_name,
      file_name,
      storage_bucket,
      storage_path,
      status,
      error_message,
      created_at
    `)
    .eq('organization_id', organizationId)
    .in('job_id', jobs.map((job) => job.id))
    .order('row_index', { ascending: true })

  if (outputsError) {
    throw outputsError
  }

  const outputsByJob = new Map()
  ;(outputs || []).forEach((output) => {
    const current = outputsByJob.get(output.job_id) || []
    current.push(output)
    outputsByJob.set(output.job_id, current)
  })

  const related = {
    products: mapById(relatedResults[0].status === 'fulfilled' ? relatedResults[0].value : []),
    templates: mapById(relatedResults[1].status === 'fulfilled' ? relatedResults[1].value : []),
    uploads: mapById(relatedResults[2].status === 'fulfilled' ? relatedResults[2].value : []),
    drafts: mapById(relatedResults[3].status === 'fulfilled' ? relatedResults[3].value : []),
  }

  const failedLookups = relatedResults.filter((result) => result.status === 'rejected')

  return {
    jobs: jobs.map((job) => ({
      ...enrichDocument({
        ...job,
        preview_row_index: null,
        file_name: `Batch ${job.id}`,
        file_size: 0,
        document_type: 'docx',
      }, related),
      outputs: outputsByJob.get(job.id) || [],
    })),
    metadataWarning: failedLookups.length > 0 ? 'Some related product, template, upload, or draft details could not be loaded.' : '',
  }
}
