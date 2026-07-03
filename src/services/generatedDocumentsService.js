import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import * as XLSX from 'xlsx'

const HISTORY_LIMIT = 50

function uniqueIds(rows, key) {
  return [...new Set((rows || []).map((row) => row[key]).filter(Boolean))]
}

function mapById(rows) {
  return new Map((rows || []).map((row) => [row.id, row]))
}

function rowHasValue(row) {
  return row.some((cell) => String(cell ?? '').trim().length > 0)
}

function normalizeCellValue(value) {
  if (value instanceof Date) {
    return value.toLocaleDateString()
  }

  return String(value ?? '').trim()
}

function dedupeHeaders(headers) {
  const seen = new Map()

  return headers.map((header) => {
    const count = seen.get(header) || 0
    seen.set(header, count + 1)
    return count === 0 ? header : `${header} ${count + 1}`
  })
}

function parseRowDataValue(rowData) {
  if (!rowData) {
    return {}
  }

  if (typeof rowData === 'string') {
    try {
      const parsed = JSON.parse(rowData)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  return typeof rowData === 'object' && !Array.isArray(rowData) ? rowData : {}
}

function hasUsefulRowData(rowData) {
  return Object.keys(parseRowDataValue(rowData)).length > 0
}

function parseExcelRowsFromBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) {
    return []
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    header: 1,
    blankrows: false,
    defval: '',
    raw: false,
  })
  const headerRowIndex = rows.findIndex(rowHasValue)

  if (headerRowIndex === -1) {
    return []
  }

  const rawHeaders = rows[headerRowIndex].map((cell) => String(cell ?? '').trim())
  const headerEntries = rawHeaders
    .map((header, index) => ({ header, index }))
    .filter((entry) => Boolean(entry.header))
  const headers = dedupeHeaders(headerEntries.map((entry) => entry.header))

  return rows
    .slice(headerRowIndex + 1)
    .filter(rowHasValue)
    .map((row) =>
      headerEntries.reduce((rowData, entry, entryIndex) => {
        rowData[headers[entryIndex]] = normalizeCellValue(row[entry.index])
        return rowData
      }, {}),
    )
}

async function loadRowsFromUpload(upload) {
  if (!upload?.storage_bucket || !upload?.storage_path) {
    return []
  }

  const { data, error } = await supabase.storage
    .from(upload.storage_bucket)
    .download(upload.storage_path)

  if (error || !data) {
    throw error || new Error('Upload file could not be downloaded.')
  }

  return parseExcelRowsFromBuffer(await data.arrayBuffer())
}

async function hydrateOutputRowDataFromUploads({ jobs, outputsByJob, uploadsById }) {
  const uploadRowsCache = new Map()
  let recoveredCount = 0

  for (const job of jobs) {
    const outputs = outputsByJob.get(job.id) || []
    const needsRecovery = outputs.some((output) => !hasUsefulRowData(output.row_data))

    if (!needsRecovery) {
      continue
    }

    const upload = uploadsById.get(job.upload_id)

    if (!upload) {
      continue
    }

    if (!uploadRowsCache.has(upload.id)) {
      uploadRowsCache.set(upload.id, await loadRowsFromUpload(upload))
    }

    const excelRows = uploadRowsCache.get(upload.id) || []

    outputs.forEach((output) => {
      if (hasUsefulRowData(output.row_data)) {
        return
      }

      const recoveredRow = excelRows[(output.row_index || 0) - 1]

      if (recoveredRow) {
        output.row_data = recoveredRow
        recoveredCount += 1
      }
    })
  }

  if (import.meta.env.DEV && recoveredCount > 0) {
    console.debug('[Project Atlas] recovered History row_data from uploaded Excel', { recoveredCount })
  }

  return recoveredCount
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
    fetchRelated('uploads', organizationId, uniqueIds(documents, 'upload_id'), 'id, file_name, row_count, detected_columns, storage_bucket, storage_path, created_at'),
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
    fetchRelated('uploads', organizationId, uniqueIds(jobs, 'upload_id'), 'id, file_name, row_count, detected_columns, storage_bucket, storage_path, created_at'),
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
      row_data,
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
  const rowDataRecoveryResult = await Promise.allSettled([
    hydrateOutputRowDataFromUploads({
      jobs,
      outputsByJob,
      uploadsById: related.uploads,
    }),
  ])
  const rowDataRecoveryFailed = rowDataRecoveryResult.some((result) => result.status === 'rejected')

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
    metadataWarning: [
      failedLookups.length > 0 ? 'Some related product, template, upload, or draft details could not be loaded.' : '',
      rowDataRecoveryFailed ? 'Some older batch row data could not be recovered from the uploaded Excel file.' : '',
    ].filter(Boolean).join(' '),
  }
}

async function removeStorageFile(storageBucket, storagePath) {
  if (!storageBucket || !storagePath) {
    return
  }

  const { error } = await supabase.storage.from(storageBucket).remove([storagePath])

  if (error && error.message && !error.message.includes('The resource was not found')) {
    throw error
  }
}

export async function deleteGeneratedDocument({ organizationId, documentId, storageBucket, storagePath }) {
  try {
    await removeStorageFile(storageBucket, storagePath)
  } catch (storageError) {
    throw storageError
  }

  const { error } = await supabase
    .from('generated_documents')
    .delete()
    .eq('organization_id', organizationId)
    .eq('id', documentId)

  if (error) {
    throw error
  }
}

export async function deleteGenerationOutput({ organizationId, outputId, storageBucket, storagePath }) {
  try {
    await removeStorageFile(storageBucket, storagePath)
  } catch (storageError) {
    throw storageError
  }

  const { error } = await supabase
    .from('generation_outputs')
    .delete()
    .eq('organization_id', organizationId)
    .eq('id', outputId)

  if (error) {
    throw error
  }
}
