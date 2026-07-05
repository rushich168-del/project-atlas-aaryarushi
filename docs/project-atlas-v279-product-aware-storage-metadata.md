# Project Atlas v2.79 Product-Aware Storage Metadata Hardening

## Version

v2.79 - Product-Aware Storage Metadata Hardening

Date: 2026-07-06

## Hard-Coded Issue Found

The shared DOCX generation write path (used by all 8 active DOCX products, not just
AR-CERT-PRO) hard-coded the `ar-cert-pro` product identity in five places:

- `certificateFilesService.uploadCertificateTemplate` — template storage path
  `${organizationId}/ar-cert-pro/templates/...`
- `certificateFilesService.uploadCertificateInput` — Excel storage path
  `${organizationId}/ar-cert-pro/inputs/...`
- `certificateOutputsService.uploadGeneratedCertificateDocx` — output storage path
  `${organizationId}/ar-cert-pro/outputs/...`
- `certificateOutputsService.uploadGeneratedCertificateDocx` — row metadata
  `metadata.product: 'ar-cert-pro'`
- `certificateBatchService.buildBatchStoragePath` — batch output storage path
  `${organizationId}/ar-cert-pro/...`

Because these are shared by AR-MARKSHEET-PRO, AR-REPORT-PRO, AR-WORKSHEET-PRO,
AR-QUESTION-PRO, AR-IDCARD-PRO, AR-INVOICE-PRO, and AR-FEE-RECEIPT-PRO, every
product's templates, Excel uploads, and generated DOCX were being written under the
`ar-cert-pro` folder and stamped with `metadata.product = ar-cert-pro`. History
labeling itself uses `product_id → products`, so the visible label was already
correct, but the storage layout and metadata were not multi-product ready.

Two History display strings also hard-coded the identity: the batch-card label
fallback `job.productName || 'AR-CERT-PRO'` and the batch ZIP download filename
`AR-CERT-PRO-batch-<id>.zip`.

## What Was Changed

A new pure, offline-testable module `src/features/certificate/services/storagePaths.js`
now owns all storage path + metadata assembly and takes a `productSlug`:

- `safeProductFolder(productSlug)` — sanitized folder segment; falls back to the
  neutral `product` (never a hard-coded product) when a slug is absent.
- `buildTemplateStoragePath`, `buildInputStoragePath`, `buildOutputStoragePath` —
  `${organizationId}/${productSlug}/{templates|inputs|outputs}/{id}/{fileName}`.
- `buildBatchStoragePath` — `${organizationId}/${productSlug}/{workspaceId}/{jobId}/...`
  (moved out of the batch service, which now re-exports it so existing imports keep
  working). `safeBatchFileName` moved with it.
- `buildOutputMetadata({ productSlug })` — `{ source: 'browser', product: productSlug }`.

`productSlug` is threaded from the callers, always product-aware:

- `steps.jsx` template/Excel uploads pass `workspace.product?.slug || config.productSlug`.
- Shared `document-workspace/config.js` (single + batch) passes
  `workspace.product?.slug || options.productSlug`.
- AR-CERT-PRO `certificate/config.js` (single + batch) passes
  `workspace.product?.slug || 'ar-cert-pro'`.

History display made product-aware:

- Batch-card label fallback changed to `'Unknown product'` (consistent with the
  enrichment's own fallback; the old value was an incorrect cert assumption).
- Batch ZIP filename now uses the job's `productCode` (`AR-MARKSHEET-PRO-batch-<id>.zip`,
  etc.), with a safe `batch-<id>.zip` fallback when no code is available.

Storage bucket names (`certificate-templates`, `certificate-inputs`,
`certificate-outputs`) are shared infrastructure and were intentionally left
unchanged; only the per-product folder segment inside each bucket is now
product-aware. No product features were added.

## Backward Compatibility Notes

- Fully backward compatible. Existing generated documents, uploads, templates, and
  batch outputs are read/downloaded/deleted using the `storage_path` value stored on
  their database rows — never a reconstructed path — so previously written objects
  (under the old `ar-cert-pro` folder) continue to resolve exactly as before.
- Only newly written objects use the product-aware folder. AR-CERT-PRO's new paths
  remain `${organizationId}/ar-cert-pro/...` (its slug is `ar-cert-pro`), so cert
  records old and new stay in the same place.
- No migration is required and none was performed.

## Offline Validation Added

`scripts/validate-storage-paths.mjs` (`npm run validate:storage`) imports only the
pure builder module (no Supabase, no writes) and asserts, for all 8 products, that
template/input/output/batch paths and `metadata.product` are product-aware and that
no non-cert product leaks the `ar-cert-pro` folder. It also checks
`safeProductFolder` sanitization and the neutral empty-slug fallback.

## What Was Not Tested Live

The authenticated Supabase round-trip (actual object upload to buckets, row inserts,
History load, and re-download) was not executed, because no existing test
credentials are available and creating live accounts/data was intentionally avoided.
The path/metadata builders are verified offline; the async upload functions are thin
wrappers that pass the builder output straight to `supabase.storage.upload` and the
table insert, unchanged except for the now product-aware path/metadata values.

## Remaining Need

A controlled set of authenticated test credentials (a dedicated test organization
and login) is still required to run the full authenticated storage/History E2E and
confirm the product-aware folders in the live project end to end.

## Safety Confirmation

- No billing, payment, checkout, pricing, or subscription page/logic was added.
- No real email sending was enabled; AR-MAIL-PRO remains dry-run / safe only and
  stays entirely outside the DOCX generation/storage write path.
- No controlled batch sending or failed-row resend was added.
- No Gmail/Outlook OAuth was added.
- No secrets were changed, exposed, or printed.
- `generatedDocumentsService.js` destructive delete logic was not touched.
- No delete behavior was added, removed, or modified. No storage deletion logic was
  changed.
- No PDF export was faked or claimed.
- No photo/image automation was added.
- No old stashes were applied or popped.
- No new dependency was added. No live Supabase data was created, modified, or
  deleted.
