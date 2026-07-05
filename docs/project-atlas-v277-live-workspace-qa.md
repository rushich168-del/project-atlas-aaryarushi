# Project Atlas v2.77 Live Workspace QA and Bug Fix Pass

## Version

v2.77 - Live Workspace QA and Bug Fix Pass

Date: 2026-07-06

## Goal

Verify the real user flow after the v2.74–v2.76 work (generation fix, sample
starter packs, first-run guide) and fix only actual issues found.

## Products Tested

- AR-CERT-PRO (original certificate workspace config)
- AR-MARKSHEET-PRO, AR-REPORT-PRO, AR-WORKSHEET-PRO, AR-QUESTION-PRO,
  AR-IDCARD-PRO (text-only), AR-INVOICE-PRO, AR-FEE-RECEIPT-PRO (shared DOCX config)
- AR-MAIL-PRO (guided mail-prep / dry-run starter)

The focused first-run flow was examined in depth for AR-CERT-PRO,
AR-MARKSHEET-PRO, AR-INVOICE-PRO, and AR-IDCARD-PRO.

## Browser / Local QA Status

- `npm run validate:samples` → PASS (8 products, 0 failing checks).
- `npm run build` → success (only the pre-existing single-chunk size warning).
- Local dev server (`npm run dev`) booted cleanly (Vite ready in ~0.4s) and served
  the app root (HTTP 200) and the full module graph, including the v2.76 additions
  `FirstRunGuide.jsx`, `SampleStarterPanel.jsx`, `sampleFileGenerators.js`, and the
  shared `steps.jsx` (each transformed by Vite with HTTP 200 — JSX compiles and all
  imports resolve, so there are no syntax/import regressions).

Full authenticated, in-browser generation could not be exercised end-to-end in this
environment because the workspace is behind Supabase auth (`ProtectedRoute`), and no
interactive login/account could be performed here safely. All client-side steps and
the offline generation chain were verified instead (see below).

## What Passed

Route wiring (`src/App.jsx`, `ProductWorkspacePage.jsx`):

- AR-CERT-PRO `.../workspace` resolves to the original `certificateWorkspaceConfig`.
- The 7 shared DOCX products resolve to `sharedDocumentWorkspaceConfigs` (shared
  workspace engine).
- AR-MAIL-PRO has no workspace config, so it resolves to the guided mail-prep
  starter — dry-run only, no DOCX generation.
- Unknown slug renders "Product not found" with a dashboard link (no crash).

First-run workspace UI (shared `TemplateStep`, used by all 8 DOCX products):

- The First-run guide appears with the correct 7-step flow and product-aware
  labels.
- The Sample Starter Pack panel appears with placeholders, columns, example rows,
  the "Need a quick start?" section, and both download buttons.
- Sample XLSX and sample DOCX are generated locally from existing dependencies
  (`xlsx`, `pizzip`); validated via `npm run validate:samples`.

Sample re-upload path (client-side):

- The generated sample DOCX (`.docx`) passes `validateTemplateFile` (extension +
  size only; no minimum-size trap) and the sample XLSX (`.xlsx`) passes
  `validateExcelFile`.
- `parseExcelColumns` parses the generated XLSX and returns the exact sample
  columns and rows.
- `MappingStep` Auto-map matches every sample column to its field
  (via `normalizeName` on field id/label/placeholder), so mapping succeeds.
- `PreviewStep` reads values by `field.id`, consistent with the merge output.

Generation correctness (offline, real modules):

- `generateDocxFromTemplate` renders the sample templates with real row values for
  all 8 products and produces no literal `undefined` (the `nullGetter` returns
  blank for any unmapped/unknown tag). This is the same per-row call the batch path
  uses.

Safety-specific UI:

- AR-IDCARD-PRO clearly states text placeholders only and manual/static photo area
  (First-run guide warning + sample note + config placeholder help).
- AR-MAIL-PRO guided starter states mail data is prepared/validated only and that
  real row-recipient sending is not enabled; no "will send / send email" wording
  exists in its UI.

## Bugs Found / Fixed

None. No confirmed functional bug was found during this QA pass, so no source code
was changed. Per the instruction to fix only confirmed bugs and avoid cosmetic
polish, this release is documentation-only.

## What Could Not Be Tested and Why

- Authenticated, end-to-end DOCX generation with real Supabase storage and the
  History/download persistence path. Reason: the workspace requires an
  authenticated session, and no interactive login could be performed in this
  environment. The generation logic itself is verified offline (values render, no
  `undefined`); only the storage/History round-trip is unverified, and it was
  intentionally not touched.
- Full batch generation orchestration (job creation + storage upload). The per-row
  render it depends on is verified; the storage-backed orchestration was not run to
  avoid touching storage/delete logic.

## Quality Checks

- `<<` / `>>` in `src`: none. (The only matches are quality-check summary lines
  inside these v2.73–v2.77 docs quoting the search pattern in backticks.)
- "Communication Suite" in `src`: none.
- pricing / payment / checkout / subscription / free / demo / trial in user-facing
  `src`: none. (The `subscription` references are the Supabase auth-state listener;
  `PaymentMode` is a fee-receipt domain field, not billing.)
- PDF claims: none introduced; all PDF references remain "not available".
- Photo automation claims: none introduced; ID-card wording restates the existing
  manual/static, not-automated limitation.
- Real sending implication in AR-MAIL-PRO UI: none.

## Safety Confirmation

- No billing, payment, checkout, pricing, or subscription page/logic was added.
- No real email sending was enabled; AR-MAIL-PRO remains dry-run / safe only.
- No controlled batch sending or failed-row resend was added.
- No Gmail/Outlook OAuth was added.
- No secrets were changed, exposed, or printed.
- `generatedDocumentsService.js` destructive delete logic was not touched.
- No storage/database delete logic was added or modified.
- No PDF export was faked or claimed.
- No photo/image automation was added.
- No old stashes were applied or popped.
- No source code and no dependencies were changed in this QA pass.
