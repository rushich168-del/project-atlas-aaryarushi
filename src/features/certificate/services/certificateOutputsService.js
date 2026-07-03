import JSZip from 'jszip'
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

function safeZipEntryName(fileName, rowIndex) {
  const baseName = String(fileName || `row-${rowIndex}-certificate.docx`)
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_ ]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)

  return `${baseName || `row-${rowIndex}-certificate`}.docx`
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

export async function createBatchDocxZip(outputs, zipFileName, onProgress) {
  if (!Array.isArray(outputs)) {
    throw new Error('Batch outputs must be provided for ZIP creation.')
  }

  const generatedFiles = outputs.filter(
    (output) => output?.status === 'generated' && output?.storage_bucket && output?.storage_path,
  )

  if (generatedFiles.length === 0) {
    throw new Error('No generated DOCX files available for ZIP download.')
  }

  const zip = new JSZip()
  const warnings = []

  for (let index = 0; index < generatedFiles.length; index += 1) {
    const output = generatedFiles[index]
    const current = index + 1

    onProgress?.({
      type: 'download',
      current,
      total: generatedFiles.length,
      message: `Downloading ${current} of ${generatedFiles.length} files...`,
    })

    try {
      const blob = await downloadGeneratedCertificateDocx(output)
      const entryName = safeZipEntryName(output.file_name, output.row_index)
      zip.file(entryName, blob)
    } catch (error) {
      warnings.push({ output, error })
    }
  }

  if (Object.keys(zip.files).length === 0) {
    throw new Error('Unable to download any generated files for the ZIP.')
  }

  onProgress?.({ type: 'compress', message: 'Compressing files...' })

  const zipBlob = await zip.generateAsync(
    { type: 'blob' },
    ({ percent }) => {
      onProgress?.({ type: 'compress', percent, message: `Compressing ${Math.round(percent)}%...` })
    },
  )

  return { zipBlob, warnings }
}
