// Pure, product-aware storage path + metadata builders for the shared DOCX write
// path. No Supabase / browser imports so these can be unit-validated offline.
//
// Storage bucket names (certificate-templates / certificate-inputs /
// certificate-outputs) are shared infrastructure and intentionally unchanged — only
// the per-product FOLDER segment inside each bucket is made product-aware. This is
// backward compatible: existing rows keep their stored `storage_path`, which the
// read/download/delete paths use verbatim; only newly written objects use the
// product-aware folder.

export function safeProductFolder(productSlug) {
  const cleaned = String(productSlug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return cleaned || 'product'
}

export function safeBatchFileName(value) {
  const baseName = String(value || 'document')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)

  return `${baseName || 'document'}.docx`
}

export function buildTemplateStoragePath({ organizationId, productSlug, templateId, fileName }) {
  return `${organizationId}/${safeProductFolder(productSlug)}/templates/${templateId}/${fileName}`
}

export function buildInputStoragePath({ organizationId, productSlug, uploadId, fileName }) {
  return `${organizationId}/${safeProductFolder(productSlug)}/inputs/${uploadId}/${fileName}`
}

export function buildOutputStoragePath({ organizationId, productSlug, generatedDocumentId, fileName }) {
  return `${organizationId}/${safeProductFolder(productSlug)}/outputs/${generatedDocumentId}/${fileName}`
}

export function buildBatchStoragePath({ organizationId, productSlug, workspaceId, jobId, rowNumber, fileName }) {
  const paddedRow = String(rowNumber).padStart(3, '0')
  const safeName = safeBatchFileName(fileName)
  const withoutPrefix = safeName.replace(/^\d+-/, '')

  return {
    fileName: `${paddedRow}-${withoutPrefix}`,
    storagePath: `${organizationId}/${safeProductFolder(productSlug)}/${workspaceId}/${jobId}/${paddedRow}-${withoutPrefix}`,
  }
}

export function buildOutputMetadata({ productSlug, source = 'browser' }) {
  return {
    source,
    product: safeProductFolder(productSlug),
  }
}
