# Project Atlas v2.68 Shared DOCX Workspace Foundation

Date: 2026-07-05

## What Was Inspected

- AR-CERT-PRO route: `/dashboard/products/ar-cert-pro/workspace`
- `ProductWorkspacePage.jsx` workspace routing and fallback behavior
- `WorkspaceLayout` step engine
- Certificate template upload and Excel upload steps
- Field mapping, row preview, draft save, DOCX generation, batch generation, History/download paths
- Certificate generation services and storage touchpoints

## What Was Reused

- Existing workspace step engine
- Existing DOCX template placeholder detection
- Existing Excel parsing and column detection
- Existing field mapping UI
- Existing preview row UI
- Existing DOCX generation and batch DOCX generation path
- Existing History/download behavior

## What Was Extracted

Added a reusable shared document workspace config factory:

`src/features/document-workspace/config.js`

The config lets a product define:

- `productSlug`
- workspace title and labels
- template fields
- required mappings
- upload copy
- preview copy
- generated document label

## AR-CERT-PRO Regression Safety Notes

AR-CERT-PRO remains connected to the original `certificateWorkspaceConfig`. Its route, generation flow, draft behavior, History, and download behavior are unchanged.

## AR-MARKSHEET-PRO Activation Status

AR-MARKSHEET-PRO is activated on the shared DOCX workspace.

Route:

`/dashboard/products/ar-marksheet-pro/workspace`

Labels:

- Template: Marksheet template
- Excel: Student marks Excel
- Output: Marksheets

The current engine-supported placeholders are:

- `{{StudentName}}`
- `{{RollNo}}`
- `{{Maths}}`
- `{{Physics}}`
- `{{Chemistry}}`
- `{{Total}}`
- `{{Grade}}`

The supported placeholder contract is `{{FieldName}}`. User-facing setup guidance should use this format consistently.

## What Still Blocks Other Products

Other document products remain on the guided starter until each product has reviewed field definitions, expected output labels, and product-specific template examples.

AR-MAIL-PRO remains mail-prep/dry-run only and is not routed into DOCX generation.

## Recommended Next Product

Recommended next activation after AR-MARKSHEET-PRO:

AR-REPORT-PRO, because it follows the same education document pattern and can likely reuse the shared DOCX workspace with student report-specific fields.

## Safety Notes

- No PDF export was added or claimed.
- No real email sending was added or claimed.
- Controlled batch sending remains disabled.
- Failed-row resend remains disabled.
- Gmail/Outlook OAuth was not added.
- No billing, checkout, pricing, subscription, payment, secrets, storage delete, or database delete behavior was changed.
- `generatedDocumentsService.js` was not changed.
