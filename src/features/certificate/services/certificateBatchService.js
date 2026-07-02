import { supabase } from '../../../lib/supabaseClient.js'

export const BATCH_ROW_LIMIT = 100
export const OUTPUT_BUCKET = 'certificate-outputs'

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function shortError(error) {
  return String(error?.message || error || 'Unknown error').slice(0, 500)
}

export function safeBatchFileName(value) {
  const baseName = String(value || 'certificate')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)

  return `${baseName || 'certificate'}.docx`
}

export function buildBatchStoragePath({ organizationId, workspaceId, jobId, rowNumber, fileName }) {
  const paddedRow = String(rowNumber).padStart(3, '0')
  const safeName = safeBatchFileName(fileName)
  const withoutPrefix = safeName.replace(/^\d+-/, '')

  return {
    fileName: `${paddedRow}-${withoutPrefix}`,
    storagePath: `${organizationId}/ar-cert-pro/${workspaceId}/${jobId}/${paddedRow}-${withoutPrefix}`,
  }
}

export function ensureBatchContext({ organizationId, productId, workspaceId, templateId, uploadId, userId }) {
  if (!organizationId) {
    throw new Error('No organization is selected.')
  }

  if (!productId) {
    throw new Error('No product is selected.')
  }

  if (!workspaceId) {
    throw new Error('Save the workspace draft before generating a batch.')
  }

  if (!templateId || !uploadId) {
    throw new Error('Template and Excel upload are required.')
  }

  if (!userId) {
    throw new Error('No authenticated user is available.')
  }
}

export async function createGenerationJob({
  organizationId,
  productId,
  workspaceId,
  templateId,
  uploadId,
  totalRows,
  validRows,
  userId,
}) {
  ensureBatchContext({ organizationId, productId, workspaceId, templateId, uploadId, userId })

  const { data, error } = await supabase
    .from('generation_jobs')
    .insert({
      organization_id: organizationId,
      product_id: productId,
      generation_draft_id: workspaceId,
      template_id: templateId,
      upload_id: uploadId,
      status: 'running',
      total_rows: totalRows,
      valid_rows: validRows,
      success_count: 0,
      failure_count: Math.max(0, totalRows - validRows),
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function saveGenerationOutput({
  jobId,
  organizationId,
  productId,
  workspaceId,
  rowIndex,
  displayName,
  fileName,
  storagePath,
  status,
  errorMessage,
}) {
  const { data, error } = await supabase
    .from('generation_outputs')
    .insert({
      job_id: jobId,
      organization_id: organizationId,
      product_id: productId,
      generation_draft_id: workspaceId,
      row_index: rowIndex,
      display_name: displayName || null,
      file_name: fileName || null,
      storage_bucket: OUTPUT_BUCKET,
      storage_path: storagePath || null,
      status,
      error_message: errorMessage ? shortError(errorMessage) : null,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function uploadBatchDocx({ storagePath, blob }) {
  const { error } = await supabase.storage
    .from(OUTPUT_BUCKET)
    .upload(storagePath, blob, {
      contentType: blob.type || DOCX_MIME_TYPE,
      upsert: false,
    })

  if (error) {
    throw error
  }
}

export async function completeGenerationJob({ jobId, successCount, failureCount, status, errorMessage }) {
  const { data, error } = await supabase
    .from('generation_jobs')
    .update({
      success_count: successCount,
      failure_count: failureCount,
      status,
      error_message: errorMessage ? shortError(errorMessage) : null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
