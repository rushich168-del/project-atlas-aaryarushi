# Project Atlas v2.66 Guided Product Workspace UX

Date: 2026-07-05

## Goal

Give each product a clearer workspace journey without creating fake generation or unsupported product-specific workflows.

## UX Flow Added

Setup products now open a guided workspace starter at the existing product workspace route:

`/dashboard/products/:productSlug/workspace`

The starter guides the user through:

- Product purpose
- Template preparation
- Excel/data preparation
- Placeholder and column guidance
- Local-only template and Excel file selection placeholders
- Workspace progress stepper
- Safe next action

The starter does not upload, store, delete, permanently process, or generate files.

## Route Behavior

- AR-CERT-PRO: opens the real AR-CERT-PRO workspace engine.
- AR-MARKSHEET-PRO: opens guided workspace starter.
- AR-REPORT-PRO: opens guided workspace starter.
- AR-WORKSHEET-PRO: opens guided workspace starter.
- AR-QUESTION-PRO: opens guided workspace starter.
- AR-IDCARD-PRO: opens guided workspace starter.
- AR-INVOICE-PRO: opens guided workspace starter.
- AR-FEE-RECEIPT-PRO: opens guided workspace starter.
- AR-MAIL-PRO: opens guided mail preparation starter; dry-run/safe positioning remains.

## Product-Specific Guidance

- AR-MARKSHEET-PRO: student marks Excel and marksheet template guidance.
- AR-REPORT-PRO: student report Excel and report template guidance.
- AR-WORKSHEET-PRO: worksheet content/data and worksheet template guidance.
- AR-QUESTION-PRO: question data and question paper template guidance.
- AR-IDCARD-PRO: student/staff details and ID card template guidance.
- AR-INVOICE-PRO: invoice data and invoice template guidance.
- AR-FEE-RECEIPT-PRO: fee receipt data and receipt template guidance.
- AR-MAIL-PRO: recipient data and message template guidance, dry-run only.

## Safety Notes

- No fake generation was added.
- No PDF export claim was added.
- No real email sending was added or claimed.
- Controlled batch sending remains disabled.
- Failed-row resend remains disabled.
- Gmail/Outlook OAuth was not added.
- No billing, checkout, pricing, subscription, storage delete, database delete, or secrets behavior was changed.
- `generatedDocumentsService.js` was not changed.

## Manual Test Checklist

- Dashboard loads.
- Products page loads.
- AR-CERT-PRO opens `/dashboard/products/ar-cert-pro/workspace` and shows the real workspace.
- Setup products open `/dashboard/products/<slug>/workspace` and show the guided starter.
- AR-MAIL-PRO opens guided mail preparation and does not imply real sending.
- Guided starter shows workspace progress.
- Guided starter shows empty states for template and Excel files.
- Guided starter explains placeholder/column matching.
- Clear local selections does not delete any stored data.
- No unavailable workspace message appears for catalog setup products.
