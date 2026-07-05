# Project Atlas v2.70 Office DOCX Workspace Activation

Date: 2026-07-05

## Products Activated

The Office / Business Suite now uses the shared DOCX workspace for:

- AR-INVOICE-PRO
- AR-FEE-RECEIPT-PRO

The shared DOCX workspace reuses the existing safe template upload, Excel upload, field mapping, preview, draft save, DOCX generation, batch generation, History, and download flow.

## Placeholder Examples

Use `{{ColumnName}}` placeholders in Word templates.

AR-INVOICE-PRO:

- `{{InvoiceNo}}`
- `{{InvoiceDate}}`
- `{{CustomerName}}`
- `{{CustomerAddress}}`
- `{{ItemName}}`
- `{{Quantity}}`
- `{{Rate}}`
- `{{Amount}}`
- `{{TotalAmount}}`

AR-FEE-RECEIPT-PRO:

- `{{ReceiptNo}}`
- `{{ReceiptDate}}`
- `{{StudentName}}`
- `{{RollNo}}`
- `{{Class}}`
- `{{FeeType}}`
- `{{AmountPaid}}`
- `{{PaymentMode}}`
- `{{Balance}}`

## Route Behavior

- AR-CERT-PRO: original real certificate workspace.
- AR-MARKSHEET-PRO: shared DOCX workspace.
- AR-INVOICE-PRO: shared DOCX workspace.
- AR-FEE-RECEIPT-PRO: shared DOCX workspace.
- AR-REPORT-PRO, AR-WORKSHEET-PRO, AR-QUESTION-PRO, and AR-IDCARD-PRO: guided starter.
- AR-MAIL-PRO: mail-prep/dry-run starter only.

## Regression Notes

- AR-CERT-PRO remains on the original `certificateWorkspaceConfig`.
- AR-MARKSHEET-PRO remains activated with the existing shared DOCX config.
- No new standalone workspace page was created.
- No engine rewrite was performed.

## Remaining Products Not Yet Activated

- AR-REPORT-PRO
- AR-WORKSHEET-PRO
- AR-QUESTION-PRO
- AR-IDCARD-PRO

## Safety Confirmation

- Output is DOCX only.
- No PDF export was added or claimed.
- No real email sending was added or claimed.
- AR-MAIL-PRO remains dry-run/safe only.
- Controlled batch sending remains disabled.
- Failed-row resend remains disabled.
- Gmail/Outlook OAuth was not added.
- No billing, checkout, pricing, subscription, secrets, storage delete, or database delete behavior was changed.
- `generatedDocumentsService.js` was not changed.
