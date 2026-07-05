# Project Atlas v2.68 Shared DOCX Workspace Activation

Date: 2026-07-05

## Goal

Route non-email document products into a shared DOCX workspace so they can use the existing safe template, Excel, mapping, preview, DOCX generation, History, and download workflow where supported.

## Shared DOCX Workspace Products

These products now use the shared DOCX workspace route:

- AR-MARKSHEET-PRO
- AR-REPORT-PRO
- AR-WORKSHEET-PRO
- AR-QUESTION-PRO
- AR-IDCARD-PRO
- AR-INVOICE-PRO
- AR-FEE-RECEIPT-PRO

Each product uses product-specific labels, guidance, preview copy, and field examples while reusing the existing safe DOCX workspace engine.

## Products Not Routed To Shared DOCX

- AR-CERT-PRO remains on the original real certificate workspace.
- AR-MAIL-PRO remains on the guided mail preparation starter. It does not route to document generation and does not imply real sending.

## Workspace Behavior

- Upload DOCX template.
- Upload Excel data.
- Map detected template placeholders to Excel columns.
- Preview one row.
- Save workspace draft.
- Generate one DOCX or batch DOCX files where the shared workflow is valid.
- Use existing History/download behavior through the established generation flow.

## Safety Notes

- No PDF export was added or claimed.
- No real email sending was added or claimed.
- AR-MAIL-PRO remains dry-run/safe only.
- Controlled batch sending remains disabled.
- Failed-row resend remains disabled.
- Gmail/Outlook OAuth was not added.
- No billing, checkout, pricing, subscription, payment, secrets, storage delete, or database delete behavior was changed.
- `generatedDocumentsService.js` was not changed.

## Manual Test Checklist

- AR-CERT-PRO opens the original real workspace.
- AR-MARKSHEET-PRO opens the shared DOCX workspace.
- AR-REPORT-PRO opens the shared DOCX workspace.
- AR-WORKSHEET-PRO opens the shared DOCX workspace.
- AR-QUESTION-PRO opens the shared DOCX workspace.
- AR-IDCARD-PRO opens the shared DOCX workspace.
- AR-INVOICE-PRO opens the shared DOCX workspace.
- AR-FEE-RECEIPT-PRO opens the shared DOCX workspace.
- AR-MAIL-PRO opens mail preparation guidance only.
- Shared document products show product-specific upload labels and preview copy.
- No unavailable workspace message appears for shared document products.
