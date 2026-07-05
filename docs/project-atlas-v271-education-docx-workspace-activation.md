# Project Atlas v2.71 Education DOCX Workspace Activation

## Version

v2.71 - Education DOCX Workspace Activation

## Products Activated

The following text-based Education Suite products now use the shared DOCX workspace foundation:

- AR-REPORT-PRO
- AR-WORKSHEET-PRO
- AR-QUESTION-PRO

These products reuse the same safe DOCX workflow already used by AR-MARKSHEET-PRO, AR-INVOICE-PRO, and AR-FEE-RECEIPT-PRO:

1. Upload a DOCX Word template.
2. Upload an Excel data file.
3. Match Word placeholders to Excel column names.
4. Preview one row.
5. Generate DOCX output where the shared engine supports it.

## Placeholder Contract

All activated shared DOCX products use the engine-supported placeholder format:

- `{{ColumnName}}`

Examples:

- Word placeholder `{{StudentName}}` matches Excel column `StudentName`.
- Word placeholder `{{QuestionText}}` matches Excel column `QuestionText`.
- Word placeholder `{{WorksheetTitle}}` matches Excel column `WorksheetTitle`.

## Activated Product Examples

### AR-REPORT-PRO

- Template label: Student report template
- Excel label: Student performance Excel
- Output label: Reports
- Placeholder examples: `{{StudentName}}`, `{{RollNo}}`, `{{Class}}`, `{{Section}}`, `{{Attendance}}`, `{{Performance}}`, `{{TeacherRemarks}}`, `{{Result}}`

### AR-WORKSHEET-PRO

- Template label: Worksheet template
- Excel label: Worksheet content Excel
- Output label: Worksheets
- Placeholder examples: `{{WorksheetTitle}}`, `{{Class}}`, `{{Subject}}`, `{{Topic}}`, `{{Question1}}`, `{{Question2}}`, `{{Question3}}`, `{{Instructions}}`

### AR-QUESTION-PRO

- Template label: Question paper template
- Excel label: Question bank Excel
- Output label: Question papers
- Placeholder examples: `{{ExamName}}`, `{{Class}}`, `{{Subject}}`, `{{Chapter}}`, `{{QuestionNo}}`, `{{QuestionText}}`, `{{Marks}}`, `{{TimeAllowed}}`

## Route Behavior

- AR-CERT-PRO continues to open the original real certificate workspace.
- AR-MARKSHEET-PRO continues to open the shared DOCX workspace.
- AR-INVOICE-PRO continues to open the shared DOCX workspace.
- AR-FEE-RECEIPT-PRO continues to open the shared DOCX workspace.
- AR-REPORT-PRO now opens the shared DOCX workspace.
- AR-WORKSHEET-PRO now opens the shared DOCX workspace.
- AR-QUESTION-PRO now opens the shared DOCX workspace.
- AR-IDCARD-PRO remains on the guided starter.
- AR-MAIL-PRO remains on the mail preparation path with dry-run safe behavior only.

## AR-IDCARD-PRO Decision

AR-IDCARD-PRO was not activated in v2.71. The current reusable DOCX engine is safe for text placeholder replacement, but ID-card workflows commonly require photo/image placement. Photo/image support was not verified as safely available in the existing shared engine, so AR-IDCARD-PRO remains guided starter only to avoid fake claims.

## Regression Notes

- AR-CERT-PRO was not moved or refactored.
- AR-MARKSHEET-PRO shared DOCX configuration remains active.
- AR-INVOICE-PRO and AR-FEE-RECEIPT-PRO shared DOCX configurations remain active.
- AR-MAIL-PRO was not connected to DOCX generation or real email sending.
- No PDF export claim was added.

## Remaining Products Not Activated

- AR-IDCARD-PRO: kept guided because photo/image placement is not safely supported by the current shared text-placeholder DOCX workflow.
- AR-MAIL-PRO: intentionally excluded from document generation; mail preparation remains dry-run safe only.

## Safety Confirmation

- No billing, payment, checkout, pricing, or subscription logic was added.
- No real email sending was enabled.
- Controlled batch sending remains disabled.
- Failed-row resend remains disabled.
- Gmail/Outlook OAuth was not added.
- Supabase secrets were not touched.
- Storage/database delete logic was not added or modified.
- `generatedDocumentsService.js` was not changed.
- Output remains DOCX only unless another product already has real support elsewhere.
