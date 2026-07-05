# Project Atlas v2.68 Shared DOCX Workspace Activation Note

Date: 2026-07-05

## Status

This earlier broad activation note is superseded by:

`docs/project-atlas-v268-shared-docx-workspace-foundation.md`

The implemented v2.68 foundation activates only AR-MARKSHEET-PRO as the first shared DOCX product after AR-CERT-PRO.

## Active Shared DOCX Workspace Product

- AR-MARKSHEET-PRO

## Products Not Activated Yet

- AR-CERT-PRO remains on the original real certificate workspace.
- AR-REPORT-PRO remains on the guided starter.
- AR-WORKSHEET-PRO remains on the guided starter.
- AR-QUESTION-PRO remains on the guided starter.
- AR-IDCARD-PRO remains on the guided starter.
- AR-INVOICE-PRO remains on the guided starter.
- AR-FEE-RECEIPT-PRO remains on the guided starter.
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
- Other document products open guided starters.
- AR-MAIL-PRO opens mail preparation guidance only.
- AR-MARKSHEET-PRO shows marksheet-specific upload labels and preview copy.
