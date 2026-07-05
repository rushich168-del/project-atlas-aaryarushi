# Project Atlas v2.78 Authenticated Storage and History E2E QA

## Version

v2.78 - Authenticated Storage and History E2E QA

Date: 2026-07-06

## Goal

Verify the real logged-in workspace flow from generation to History/download using
the existing Supabase configuration only, and fix only confirmed bugs.

## Environment Check (no secrets printed)

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present in `.env.local`
  (presence confirmed by variable name only; no values were read or printed).
- No test-credential variables (e.g. a test email/password) are defined anywhere in
  the environment or repo.

## Authenticated QA Status: NOT PERFORMED (honestly reported)

The authenticated end-to-end flow could not be executed, for a concrete reason:

- The workspace, generation, storage upload, and History are all behind Supabase
  authentication (`ProtectedRoute` → login). Reaching them requires a logged-in
  user with an organization.
- **No existing test credentials are available** in this environment (the task
  permits login "only if available"). None were provided or discoverable.
- Creating a new account via the Signup page was deliberately **not** done: that
  would authenticate against and write rows/files into the live Supabase project
  (auth users, organizations, templates, uploads, drafts, generated_documents,
  storage objects). That is production, outward-facing, hard-to-reverse data, it is
  not "existing test credentials," and it was not authorized. Per the task's
  no-faking rule, no synthetic or fabricated result is reported.

Because of this, the following were **not** exercised live and are reported as
untested (not passed, not failed):

- Authenticated single DOCX generation with storage upload.
- Generation job creation and batch orchestration/storage persistence.
- History page population, re-download from storage, and product labeling with real
  data.

## What Was Verified Instead (static / offline)

Client-side and offline checks that do not require authentication:

- `npm run validate:samples` → PASS (8 products, 0 failing checks).
- `npm run build` → success (only the pre-existing single-chunk size warning).
- Offline generation chain (real modules): sample XLSX → parse → merge → DOCX render
  fills real values with no literal `undefined` for all 8 products (v2.75 regression
  script, still green).

Code-level review of the authenticated path (inspection only — no changes made):

- `certificateOutputsService.uploadGeneratedCertificateDocx` uploads the DOCX to the
  `certificate-outputs` bucket and inserts a `generated_documents` row with
  `organization_id`, `product_id`, `template_id`, `upload_id`,
  `generation_draft_id`, `storage_path`, and `document_type = 'docx'`. Coherent.
- `certificateBatchService` (createGenerationJob / saveGenerationOutput /
  completeGenerationJob / uploadBatchDocx) writes `generation_jobs` and
  `generation_outputs` and uploads per-row DOCX. The per-row render uses the same
  `generateDocxFromTemplate` verified offline.
- `generatedDocumentsService.getGeneratedDocumentsHistory` / `getGenerationJobsHistory`
  query by `organization_id`, enrich with products/templates/uploads/drafts, and
  label via `product_id → products` (graceful "Unknown product" fallback if the
  product row is not resolvable). Re-download uses the stored `storage_bucket` /
  `storage_path` via `downloadGeneratedCertificateDocx`. Batch ZIP re-download uses
  `createBatchDocxZip` over generated outputs. Logic is consistent and does not
  crash on missing relations.
- `generatedDocumentsService.js` destructive delete logic was read but **not
  modified**.

Observation (not a confirmed user-facing bug, not changed): output storage paths and
the `metadata.product` field are hard-coded to `ar-cert-pro` for all products in the
shared write path. This does not affect the History product label, which is derived
from `product_id → products`, and changing storage-write logic is out of scope for
this QA pass and could not be safely validated without a live authenticated run.

## Products Tested

Intended set: AR-CERT-PRO, AR-MARKSHEET-PRO, AR-INVOICE-PRO, AR-IDCARD-PRO.
For each, the offline/client-side steps (sample generation, structure, render
correctness) were verified; the authenticated storage/History steps were not
performable (see above).

## Generation Result

Offline generation: PASS (values render, no `undefined`). Authenticated generation
with storage: NOT TESTED (no credentials).

## Batch Result

Per-row render logic verified offline (same function path). Authenticated batch job
creation + storage persistence: NOT TESTED (no credentials).

## History / Download Result

Code path reviewed and coherent. Live History population, re-download, and labeling:
NOT TESTED (no credentials).

## Bugs Found / Fixed

None. No confirmed bug was found; the offline chain is correct and the authenticated
code path is coherent. No source code was changed in this QA pass.

## What Could Not Be Tested and Why

- Any authenticated Supabase behavior (generation storage upload, job creation, batch
  persistence, History load, re-download). Reason: no existing test credentials, and
  creating a live account/writing production data was intentionally avoided.

## AR-MAIL-PRO Safety

AR-MAIL-PRO was not tested for sending and remains guided mail-prep / dry-run only.
Its UI states: "This workspace prepares and validates mail data only. Real
row-recipient sending, controlled batch sending, failed-row resend, and
Gmail/Outlook OAuth are not enabled." No real-sending implication exists.

## Quality Checks

- `<<` / `>>` in `src`: none. (Matches exist only in v2.73–v2.78 docs as
  quality-check summary lines quoting the pattern in backticks.)
- "Communication Suite" in `src`: none.
- pricing / payment / checkout / subscription / free / demo / trial in user-facing
  `src`: none. (The `subscription` references are the Supabase auth-state listener;
  `PaymentMode` is a fee-receipt domain field.)
- PDF claims: none; all PDF references remain "not available".
- Photo automation claims: none; ID-card wording restates the manual/static,
  not-automated limitation.
- Real sending implication in AR-MAIL-PRO UI: none.

## Safety Confirmation

- No billing, payment, checkout, pricing, or subscription page/logic was added.
- No real email sending was enabled; AR-MAIL-PRO remains dry-run / safe only.
- No controlled batch sending or failed-row resend was added.
- No Gmail/Outlook OAuth was added.
- No secrets were changed, exposed, or printed (only variable presence was checked).
- `generatedDocumentsService.js` destructive delete logic was not touched.
- No storage/database delete logic was added or modified.
- No PDF export was faked or claimed.
- No photo/image automation was added.
- No old stashes were applied or popped.
- No source code and no dependencies were changed in this QA pass.
- No live Supabase data was created, modified, or deleted.
