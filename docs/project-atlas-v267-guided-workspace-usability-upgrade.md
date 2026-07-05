# Project Atlas v2.67 Guided Workspace Usability Upgrade

Date: 2026-07-05

## Goal

Make the guided workspace starter more useful and user-friendly without adding fake generation, storage uploads, database persistence, or unsupported product-specific workflows.

## UX Improvements

- Added local-only template file selection for setup products.
- Added local-only Excel/data file selection.
- Selected files show name, size, validation status, and a clear action.
- Wrong file types show an inline error.
- Empty states explain what template and Excel data mean.
- AR-MAIL-PRO uses recipient-data selection only and keeps mail preparation dry-run safe.
- Workspace progress now distinguishes:
  - Done steps
  - Current step
  - Guidance-only field checking
  - Locked preview/generation steps
- Added a field matching guide:
  - Word placeholders should look like `{{Name}}`
  - Excel columns should match placeholder names
  - Example: `{{StudentName}}` matches the `StudentName` column

## Product-Specific Guidance

- AR-MARKSHEET-PRO: marksheet template plus student marks Excel.
- AR-REPORT-PRO: report template plus student performance Excel.
- AR-WORKSHEET-PRO: worksheet template plus worksheet content Excel.
- AR-QUESTION-PRO: question paper template plus question bank Excel.
- AR-IDCARD-PRO: ID card template plus student/staff details Excel.
- AR-INVOICE-PRO: invoice template plus customer/item Excel.
- AR-FEE-RECEIPT-PRO: fee receipt template plus fee/student Excel.
- AR-MAIL-PRO: recipient list/data file only; mail preparation remains dry-run safe.

## Route Behavior

- AR-CERT-PRO continues to open the real workspace engine.
- Setup products continue to open the guided workspace starter at `/dashboard/products/:productSlug/workspace`.
- AR-MAIL-PRO opens the guided mail preparation starter and does not imply real sending.

## Safety Notes

- No files are uploaded to Supabase from the guided starter.
- No files are persisted.
- No storage or database records are deleted.
- No document generation was added for setup products.
- No PDF export claim was added.
- No real email sending was added or claimed.
- Controlled batch sending remains disabled.
- Failed-row resend remains disabled.
- Gmail/Outlook OAuth was not added.
- No billing, checkout, pricing, subscription, payment, storage delete, database delete, or secrets behavior was changed.
- `generatedDocumentsService.js` was not changed.

## Manual Test Checklist

- AR-CERT-PRO opens the real workspace.
- Setup products open the guided workspace starter.
- AR-MAIL-PRO opens mail preparation guidance only.
- Selecting a valid template file shows name, size, and Ready status.
- Selecting a valid Excel/data file shows name, size, and Ready status.
- Wrong file types show an inline unsupported type message.
- Clear removes only the local selection.
- Field matching guide is visible.
- Preview and Generate/Setup remain locked/guidance-only for setup products.
