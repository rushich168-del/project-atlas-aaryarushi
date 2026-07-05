# Project Atlas v2.72 AR-IDCARD-PRO Text DOCX Workspace Activation

## Version

v2.72 - AR-IDCARD-PRO Text DOCX Workspace Activation

## Activation Scope

AR-IDCARD-PRO now uses the shared DOCX workspace for text-based ID card documents.

The activated workflow supports:

1. Upload an ID card DOCX template.
2. Upload student/staff details Excel data.
3. Match Word placeholders to Excel column names.
4. Preview one text-based ID card row.
5. Generate DOCX ID card documents through the shared workspace.

## Text Placeholders Supported

AR-IDCARD-PRO uses the existing `{{ColumnName}}` placeholder contract.

Supported examples:

- `{{FullName}}`
- `{{IDNumber}}`
- `{{Class}}`
- `{{Section}}`
- `{{Role}}`
- `{{AcademicYear}}`
- `{{BloodGroup}}`
- `{{ContactNumber}}`

Example:

- Word placeholder `{{FullName}}` matches Excel column `FullName`.
- Word placeholder `{{IDNumber}}` matches Excel column `IDNumber`.

## Photo/Image Limitation

Photo/image placement is not automated in this workspace yet.

For photo-based ID cards, keep a static or manual photo area inside the Word template for now. The shared DOCX workspace only replaces text placeholders with Excel values. It does not insert, crop, position, or map per-person photos.

## Route Behavior

- AR-CERT-PRO continues to open the original real certificate workspace.
- AR-MARKSHEET-PRO continues to open the shared DOCX workspace.
- AR-INVOICE-PRO continues to open the shared DOCX workspace.
- AR-FEE-RECEIPT-PRO continues to open the shared DOCX workspace.
- AR-REPORT-PRO continues to open the shared DOCX workspace.
- AR-WORKSHEET-PRO continues to open the shared DOCX workspace.
- AR-QUESTION-PRO continues to open the shared DOCX workspace.
- AR-IDCARD-PRO now opens the shared DOCX workspace for text placeholders.
- AR-MAIL-PRO remains mail preparation and dry-run safe only.

## Regression Notes

- Existing active DOCX products were not refactored.
- AR-CERT-PRO was not moved or changed.
- AR-MAIL-PRO was not connected to DOCX generation or real email sending.
- No PDF export claim was added.
- No automated photo/image placement claim was added.

## Remaining Product Status

- AR-MAIL-PRO remains mail-prep/dry-run only.
- ID-card photo automation remains future work and is not enabled in Project Atlas.

## Safety Confirmation

- No billing, payment, checkout, pricing, or subscription logic was added.
- No real email sending was enabled.
- Controlled batch sending remains disabled.
- Failed-row resend remains disabled.
- Gmail/Outlook OAuth was not added.
- Supabase secrets were not touched.
- Storage/database delete logic was not added or modified.
- `generatedDocumentsService.js` was not changed.
- PDF export was not added or claimed.
- Photo/image automation logic was not added or claimed.
