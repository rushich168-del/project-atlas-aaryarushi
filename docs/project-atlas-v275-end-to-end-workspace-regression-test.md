# Project Atlas v2.75 End-to-End Workspace Regression Test

## Version

v2.75 - End-to-End Workspace Regression Test

Date: 2026-07-06

## Goal

Verify the real workspace flow after the v2.74 sample starter packs and the
`generateDocxFromTemplate.js` rendering fix. Fix only confirmed bugs; add no new
product features.

## What Was Tested

A committed, offline regression script exercises the full generation chain for
every active DOCX product:

`scripts/validate-sample-starters.mjs` (run with `npm run validate:samples`)

It imports only the pure engine + sample modules (`sampleStarters`,
`sampleFileGenerators`, `detectDocxPlaceholders`, `mergeRow`,
`generateDocxFromTemplate`, plus `xlsx` / `pizzip`). It does not import Supabase,
storage, history, delete, or email code, so it is safe to run anywhere and touches
none of the protected logic. Field definitions are reconstructed the same way the
shared workspace config builds them (field id = lowercased column, placeholder =
`{{Column}}`), which matches both the shared products and AR-CERT-PRO's real field
ids (`name`, `course`, `date`, `certificate_id`, `trainer`).

## Products Tested

All eight active DOCX products:

- AR-CERT-PRO
- AR-MARKSHEET-PRO
- AR-REPORT-PRO
- AR-WORKSHEET-PRO
- AR-QUESTION-PRO
- AR-IDCARD-PRO (text-only)
- AR-INVOICE-PRO
- AR-FEE-RECEIPT-PRO

AR-MAIL-PRO was not exercised by the generator because it has no DOCX workspace
config; it remains guided mail-prep / dry-run only and was not modified.

## Sample Starter Validation Results

For every product (`PASS`, 0 failing checks):

- Generated sample **XLSX** column headers exactly match the product placeholders.
- Generated sample **XLSX** row count matches the defined example rows.
- Generated sample **DOCX** contains exactly the expected `{{ColumnName}}`
  placeholders (detected keys equal the columns) with **zero** invalid tokens.

## Generation Validation Results

- **Download + re-upload path is valid.** The generated sample XLSX and sample
  DOCX were fed back through `detectDocxPlaceholders` → `mergeRow` →
  `generateDocxFromTemplate` (the same chain the workspace uses after upload), and
  the output document contains the real row values for every product.
- **Placeholder replacement works.** Every example row renders its mapped values
  in the output DOCX. This per-row rendering is the same call the batch path makes,
  so batch generation logic is covered as well.
- **Unmapped / unknown placeholders render blank, never `undefined`.** A template
  tag with no corresponding field renders empty via the `nullGetter`, and no output
  contains the literal string `undefined`. An optional trailing field was included
  in the field set to also exercise the optional/blank path.
- **AR-CERT-PRO regression passed** with its original lowercase placeholder
  contract (`{{name}}`, `{{certificate_id}}`, …) and its sample structure.
- **Shared workspace regression passed** for AR-MARKSHEET-PRO, AR-INVOICE-PRO, and
  every other shared DOCX product using the exact `{{ColumnName}}` contract.

## Bugs Found and Fixed

None. The v2.74 rendering fix behaves correctly across all products and edge cases.
No source generation/merge/rendering code was changed in v2.75.

## Bugs Deferred

None identified.

## Batch / History / Download Notes

- Batch generation calls `generateDocxFromTemplate` once per row; the regression
  renders every sample row through that same function, so the render behaviour used
  by batch is verified. Full batch orchestration and History/download persistence
  run through Supabase storage and were intentionally **not** invoked, to avoid
  touching storage or delete logic. No storage/history/delete code was modified.
- The download helper (`downloadBlob`) uses browser APIs only and is unchanged.

## Quality Checks

- Literal `undefined` risk in generated output paths: none. The only `undefined`
  occurrences in `src/core/atlas` are the safety comment and a legitimate null
  check in `normalizeValue`; the generator sets `nullGetter: () => ''`.
- `<<` / `>>` in `src` / docs: none.
- "Communication Suite" in `src`: none.
- Pricing / free / demo / trial wording in user-facing `src`: none. (The
  `subscription` references are the Supabase auth-state listener, not billing.)
- No PDF claims were introduced.
- No photo/image automation was introduced (AR-IDCARD-PRO stays text-only).

## Validation

- `npm run validate:samples` → PASS (8 products, 0 failing checks).
- `npm run build` → success (only the pre-existing single-chunk size warning).

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
- No new dependency was added; the regression script uses existing deps only.
