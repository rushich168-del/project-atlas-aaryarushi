# Project Atlas v2.76 First-Run Workspace Guide

## Version

v2.76 - First-Run Workspace Guide

Date: 2026-07-06

## Goal

Make every active DOCX workspace easy for a first-time user to operate
successfully, without changing the generation engine or any storage/history logic.

## What Guide Was Added

A new compact, collapsible **First-run guide** (`FirstRunGuide.jsx`) now renders at
the top of the first workspace step (Upload Template), directly above the existing
Sample Starter Pack panel. It is product-aware: it reads the product's template,
Excel, and output labels from the existing sample-starter config, with safe generic
fallbacks for any unknown slug (no crash).

The guide shows the exact recommended flow:

1. Download the sample Excel and Word template (buttons below).
2. Edit the sample files with your real data — keep the placeholder names.
3. Upload your Word template (.docx).
4. Upload your Excel data (.xlsx).
5. Check the detected fields and column mapping.
6. Preview one row to confirm it looks right.
7. Generate the product output as DOCX.

It also shows a compact "Before you upload" warning block:

- Use `{{ColumnName}}` placeholders only.
- Excel column names must match the template placeholders.
- Output is DOCX only.
- For AR-IDCARD-PRO: text placeholders only; photo placement stays manual/static
  in your template for now.

In addition, a **"Need a quick start?"** section was added to the Sample Starter
Pack panel, immediately above the sample download buttons, explaining that the two
sample files already line up so generation works on the first try.

## Products Covered

The guide appears in every active DOCX workspace (it is wired into the shared
`TemplateStep`, which all of these products use):

- AR-CERT-PRO
- AR-MARKSHEET-PRO
- AR-REPORT-PRO
- AR-WORKSHEET-PRO
- AR-QUESTION-PRO
- AR-IDCARD-PRO (text-only warning shown)
- AR-INVOICE-PRO
- AR-FEE-RECEIPT-PRO

AR-MAIL-PRO is unaffected: it uses the guided mail-prep starter and never renders
the DOCX `TemplateStep`, so it stays outside the DOCX workspace flow, dry-run only.

## User Flow

Download samples → edit with real data → upload template → upload Excel → check
detected fields → preview one row → generate DOCX. The guide mirrors the actual
workspace steps and links conceptually to the sample downloads that sit just below
it, so a first-time user has a single, clear path to a working document.

## Engine / Data Safety

- The generation engine (`generateDocxFromTemplate.js`) was not changed. No
  confirmed bug was found, so no engine change was made.
- No storage, history, or delete logic was touched.
- This release is UI-only: two presentational components/edits plus documentation.

## Validation Results

- `npm run validate:samples` → PASS (8 products, 0 failing checks).
- `npm run build` → success (only the pre-existing single-chunk size warning).
- `<<` / `>>` in `src`: none.
- "Communication Suite" in `src`: none.
- No pricing / payment / checkout / subscription / free / demo / trial wording was
  introduced.
- No PDF claims were introduced.
- No photo/image automation was introduced. The only "photo" wording restates the
  existing safe limitation (photo placement is manual/static, not automated).

## Safety Confirmation

- No billing, payment, checkout, pricing, or subscription page/logic was added.
- No real email sending was enabled; AR-MAIL-PRO remains dry-run / safe only.
- No controlled batch sending or failed-row resend was added.
- No Gmail/Outlook OAuth was added.
- No secrets were changed, exposed, or printed.
- `generatedDocumentsService.js` destructive delete logic was not touched.
- No storage/database delete logic was added or modified.
- No PDF export was faked or claimed.
- No photo/image automation was added (AR-IDCARD-PRO stays text-only).
- No old stashes were applied or popped.
- No new dependency was added.
