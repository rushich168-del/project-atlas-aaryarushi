# Project Atlas v2.65 Product Workspace UX Readiness

Date: 2026-07-05

## Goal

Make each Project Atlas product feel easier to start, with clearer next actions and safer setup guidance.

## UX Improvements

- Product cards use clearer action labels:
  - AR-CERT-PRO: Open Workspace
  - AR-MAIL-PRO: Mail Prep
  - Setup products: Setup Workspace
- Product detail pages now include a shared readiness block:
  - What this product does
  - Before you start checklist
  - Expected output
  - Main action button
  - Safe setup message for products without a dedicated workspace
- Setup products continue to open their detail/setup pages instead of fake workspace routes.
- AR-MAIL-PRO remains a mail preparation workflow with dry-run validation only.

## Product Coverage

- AR-CERT-PRO opens the real workspace.
- AR-MARKSHEET-PRO uses the product workspace setup flow.
- AR-REPORT-PRO uses the product workspace setup flow.
- AR-WORKSHEET-PRO uses the product workspace setup flow.
- AR-QUESTION-PRO uses the product workspace setup flow.
- AR-IDCARD-PRO uses the product workspace setup flow.
- AR-MAIL-PRO uses mail preparation guidance and dry-run safety.
- AR-INVOICE-PRO uses the product workspace setup flow.
- AR-FEE-RECEIPT-PRO uses the product workspace setup flow.

## Safety Notes

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
- Product cards show clear action buttons.
- AR-CERT-PRO opens the real workspace.
- Setup products open detail/setup pages.
- Product detail pages show the Before you start checklist.
- Mail product detail keeps dry-run safety wording.
- No fake workspace opens for setup products.
- No unavailable-message appears for catalog products.
- History and Email Prep remain safe.
