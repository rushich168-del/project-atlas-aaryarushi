// Project Atlas v2.79 — offline validation of product-aware storage path/metadata
// builders. Imports only the pure builder module (no Supabase, no writes), so it is
// safe to run anywhere. Asserts that every active DOCX product produces
// product-aware storage paths and metadata, and that no product other than
// AR-CERT-PRO leaks the old hard-coded "ar-cert-pro" folder.
//
// Run: npm run validate:storage

import {
  buildBatchStoragePath,
  buildInputStoragePath,
  buildOutputMetadata,
  buildOutputStoragePath,
  buildTemplateStoragePath,
  safeProductFolder,
} from '../src/features/certificate/services/storagePaths.js'

const SLUGS = [
  'ar-cert-pro',
  'ar-marksheet-pro',
  'ar-report-pro',
  'ar-worksheet-pro',
  'ar-question-pro',
  'ar-idcard-pro',
  'ar-invoice-pro',
  'ar-fee-receipt-pro',
]

const ORG = 'org-1234'
let failures = 0
const lines = []

function check(label, condition, detail = '') {
  if (!condition) {
    failures += 1
    lines.push(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

for (const slug of SLUGS) {
  lines.push(`\n[${slug}]`)
  const templatePath = buildTemplateStoragePath({ organizationId: ORG, productSlug: slug, templateId: 'tid', fileName: 'a.docx' })
  const inputPath = buildInputStoragePath({ organizationId: ORG, productSlug: slug, uploadId: 'uid', fileName: 'a.xlsx' })
  const outputPath = buildOutputStoragePath({ organizationId: ORG, productSlug: slug, generatedDocumentId: 'gid', fileName: 'a.docx' })
  const batch = buildBatchStoragePath({ organizationId: ORG, productSlug: slug, workspaceId: 'wid', jobId: 'jid', rowNumber: 3, fileName: 'Row Name.docx' })
  const metadata = buildOutputMetadata({ productSlug: slug })

  check('template path is product-aware', templatePath === `${ORG}/${slug}/templates/tid/a.docx`, templatePath)
  check('input path is product-aware', inputPath === `${ORG}/${slug}/inputs/uid/a.xlsx`, inputPath)
  check('output path is product-aware', outputPath === `${ORG}/${slug}/outputs/gid/a.docx`, outputPath)
  check('batch path is product-aware', batch.storagePath === `${ORG}/${slug}/wid/jid/003-row-name.docx`, batch.storagePath)
  check('batch fileName is zero-padded', batch.fileName === '003-row-name.docx', batch.fileName)
  check('metadata.product is the productSlug', metadata.product === slug, JSON.stringify(metadata))

  // Only AR-CERT-PRO may reference the ar-cert-pro folder.
  const leaks = [templatePath, inputPath, outputPath, batch.storagePath].filter((p) => p.includes('/ar-cert-pro/'))
  check('no non-cert product leaks the ar-cert-pro folder', slug === 'ar-cert-pro' ? true : leaks.length === 0, leaks.join(' '))
}

// Sanitization / fallback behaviour.
lines.push('\n[safeProductFolder]')
check('sanitizes unexpected characters', safeProductFolder('AR Cert!/Pro') === 'ar-cert--pro' || safeProductFolder('AR Cert!/Pro') === 'ar-cert-pro', safeProductFolder('AR Cert!/Pro'))
check('empty slug falls back to "product", never a hard-coded product', safeProductFolder('') === 'product')
check('null slug falls back to "product"', safeProductFolder(null) === 'product')

console.log(lines.join('\n'))
console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${SLUGS.length} products, ${failures} failing checks`)
process.exit(failures === 0 ? 0 : 1)
