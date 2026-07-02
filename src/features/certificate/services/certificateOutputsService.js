import { supabase } from '../../../lib/supabaseClient.js'

const OUTPUT_BUCKET = 'certificate-outputs'
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function getExtension(fileName) {
  const parts = String(fileName || '').toLowerCase().split('.')
  return parts.length > 1 ? `.${parts.pop()}` : ''
}

function safeFileName(fileName) {
  const extension = getExtension(fileName) || '.docx'
  const baseName = String(fileName || 'certificate')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)

  return `${baseName || 'certificate'}${extension}`
}

function ensureOutputContext({ organizationId, productId, draftId, blob, fileName, userId }) {
  if (!organizationId) {
    throw new Error('No organization is selected.')
  }

  if (!productId) {
    throw new Error('No product is selected.')
  }

  if (!draftId) {
    throw new Error('Save the workspace draft before storing the output.')
  }

  if (!blob) {
    throw new Error('No generated DOCX is available to store.')
  }

  if (!fileName) {
    throw new Error('Generated DOCX file name is missing.')
  }

  if (!userId) {
    throw new Error('No authenticated user is available.')
  }
}

export async function uploadGeneratedCertificateDocx({
  organizationId,
  productId,
  templateId,
  uploadId,
  draftId,
  previewRowIndex,
  mergeData,
  blob,
  fileName,
  userId,
}) {
  ensureOutputContext({ organizationId, productId, draftId, blob, fileName, userId })

  const generatedDocumentId = crypto.randomUUID()
  const storedFileName = safeFileName(fileName)
  const storagePath = `${organizationId}/ar-cert-pro/outputs/${generatedDocumentId}/${storedFileName}`

  const { error: storageError } = await supabase.storage
    .from(OUTPUT_BUCKET)
    .upload(storagePath, blob, {
      contentType: blob.type || DOCX_MIME_TYPE,
      upsert: false,
    })

  if (storageError) {
    throw storageError
  }

  const { data, error } = await supabase
    .from('generated_documents')
    .insert({
      id: generatedDocumentId,
      organization_id: organizationId,
      product_id: productId,
      template_id: templateId,
      upload_id: uploadId,
      generation_draft_id: draftId,
      file_name: storedFileName,
      file_type: blob.type || DOCX_MIME_TYPE,
      file_size: blob.size,
      storage_bucket: OUTPUT_BUCKET,
      storage_path: storagePath,
      document_type: 'docx',
      status: 'ready',
      preview_row_index: previewRowIndex,
      merge_data: mergeData || {},
      metadata: {
        source: 'browser',
        product: 'ar-cert-pro',
      },
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function downloadGeneratedCertificateDocx(generatedDocument) {
  if (!generatedDocument?.storage_bucket || !generatedDocument?.storage_path) {
    throw new Error('Stored DOCX location is missing.')
  }

  const { data, error } = await supabase.storage
    .from(generatedDocument.storage_bucket)
    .download(generatedDocument.storage_path)

  if (error) {
    throw error
  }

  return data
}
