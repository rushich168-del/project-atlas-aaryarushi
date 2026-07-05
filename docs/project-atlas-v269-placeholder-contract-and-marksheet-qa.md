# Project Atlas v2.69 Placeholder Contract and AR-MARKSHEET-PRO QA

Date: 2026-07-05

## Goal

Make placeholder guidance consistent with the real DOCX engine before activating more products.

## Supported Placeholder Contract

Project Atlas currently supports Word template placeholders in this format:

`{{ColumnName}}`

The Excel column name should match the placeholder name.

Examples:

- `{{StudentName}}` matches the `StudentName` Excel column.
- `{{RollNo}}` matches the `RollNo` Excel column.
- `{{Maths}}` matches the `Maths` Excel column.

## AR-MARKSHEET-PRO QA

AR-MARKSHEET-PRO remains activated on the shared DOCX workspace.

Workspace labels:

- Template: Marksheet template
- Excel: Student marks Excel
- Output: Marksheets

Supported marksheet placeholders:

- `{{StudentName}}`
- `{{RollNo}}`
- `{{Maths}}`
- `{{Physics}}`
- `{{Chemistry}}`
- `{{Total}}`
- `{{Grade}}`

## AR-CERT-PRO Regression Safety

AR-CERT-PRO remains on the original certificate workspace config and continues to use the existing engine-supported `{{field}}` placeholders.

## Routing Check

- AR-CERT-PRO opens the original real workspace.
- AR-MARKSHEET-PRO opens the shared DOCX workspace.
- Other document products remain on the guided starter.
- AR-MAIL-PRO remains mail-prep/dry-run only.

## Safety Notes

- No parser change was made.
- No PDF export was added or claimed.
- No real email sending was added or claimed.
- Controlled batch sending remains disabled.
- Failed-row resend remains disabled.
- Gmail/Outlook OAuth was not added.
- No billing, checkout, pricing, subscription, payment, secrets, storage delete, or database delete behavior was changed.
- `generatedDocumentsService.js` was not changed.
