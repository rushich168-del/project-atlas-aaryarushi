import { generateDocxFromTemplate } from '../../../core/atlas/index.js'
import { supabase } from '../../../lib/supabaseClient.js'

// PDF export is intentionally not implemented in the browser-only DOCX workflow.
// Reliable DOCX-to-PDF conversion that preserves Word layout, formatting, tables,
// images, page size, and margins typically requires a dedicated server-side
// conversion service or external document conversion engine.
// Implementing a browser-side PDF converter here would risk producing broken or
// low-fidelity PDFs, which is not acceptable for Project Atlas v2.3.

function buildGeneratedFileName({ templateRecord, mergeResult }) {
  const certificateId = mergeResult?.values?.certificate_id
  const recipient = mergeResult?.values?.name
  const baseName = [certificateId, recipient, 'certificate']
    .filter(Boolean)
    .join('-')

  return baseName || templateRecord?.file_name || 'certificate'
}

export function generateCertificateDocxForRow({ templateArrayBuffer, templateRecord, mergeResult, outputFileName }) {
  return generateDocxFromTemplate({
    templateArrayBuffer,
    mergeResult,
    options: {
      fileName: outputFileName || buildGeneratedFileName({ templateRecord, mergeResult }),
    },
  })
}

export async function downloadCertificateTemplateArrayBuffer(templateRecord) {
  if (!templateRecord?.storage_bucket || !templateRecord?.storage_path) {
    throw new Error('Template storage location is missing.')
  }

  const { data, error } = await supabase.storage
    .from(templateRecord.storage_bucket)
    .download(templateRecord.storage_path)

  if (error) {
    throw error
  }

  return data.arrayBuffer()
}

export async function generateCertificateDocx({ templateRecord, mergeResult }) {
  const templateArrayBuffer = await downloadCertificateTemplateArrayBuffer(templateRecord)

  return generateCertificateDocxForRow({
    templateArrayBuffer,
    templateRecord,
    mergeResult,
  })
}
