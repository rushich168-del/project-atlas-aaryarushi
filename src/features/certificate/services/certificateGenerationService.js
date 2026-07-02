import { generateDocxFromTemplate } from '../../../core/atlas/index.js'
import { supabase } from '../../../lib/supabaseClient.js'

function buildGeneratedFileName({ templateRecord, mergeResult }) {
  const certificateId = mergeResult?.values?.certificate_id
  const recipient = mergeResult?.values?.name
  const baseName = [certificateId, recipient, 'certificate']
    .filter(Boolean)
    .join('-')

  return baseName || templateRecord?.file_name || 'certificate'
}

export async function generateCertificateDocx({ templateRecord, mergeResult }) {
  if (!templateRecord?.storage_bucket || !templateRecord?.storage_path) {
    throw new Error('Template storage location is missing.')
  }

  const { data, error } = await supabase.storage
    .from(templateRecord.storage_bucket)
    .download(templateRecord.storage_path)

  if (error) {
    throw error
  }

  const templateArrayBuffer = await data.arrayBuffer()

  return generateDocxFromTemplate({
    templateArrayBuffer,
    mergeResult,
    options: {
      fileName: buildGeneratedFileName({ templateRecord, mergeResult }),
    },
  })
}
