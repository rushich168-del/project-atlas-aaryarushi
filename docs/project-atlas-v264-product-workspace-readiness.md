# Project Atlas v2.64 Product Workspace Readiness

Date: 2026-07-05

## Goal

Present AaryaRushi Automation Labs products as real usable product/service entries with clear next actions, while keeping feature claims honest and safe.

## Public Suite Grouping

- Education Suite: AR-CERT-PRO, AR-MARKSHEET-PRO, AR-REPORT-PRO, AR-WORKSHEET-PRO, AR-QUESTION-PRO, AR-IDCARD-PRO
- HR / Admin Suite: AR-IDCARD-PRO, AR-MAIL-PRO
- Office / Business Suite: AR-INVOICE-PRO, AR-FEE-RECEIPT-PRO

No Communication Suite is shown.

## Readiness Language

- AR-CERT-PRO is presented as Ready to use with Open Workspace.
- Products without a dedicated workspace are presented with Workspace setup or Request setup.
- AR-MAIL-PRO is presented as a Mail preparation workspace with dry-run validation only.
- Product cards use direct actions such as Open Workspace, Open Product, and Request Setup.

## Workspace Routing

- AR-CERT-PRO routes to `/dashboard/products/ar-cert-pro/workspace`.
- Setup products route to their product detail/setup pages.
- No fake workspace route was added for products that do not have a dedicated workspace.

## Safety Status

- Email Prep remains dry-run only.
- No real row-recipient emails are sent.
- Controlled batch sending remains disabled.
- Failed-row resend remains disabled.
- Gmail/Outlook OAuth is not added.
- PDF export is not claimed as available inside Project Atlas.
- No billing, checkout, pricing, subscription, or payment-gateway surface was added.
- `generatedDocumentsService.js` was not changed.

## Manual Test Checklist

- Public landing page loads.
- Landing page keeps Education Suite, HR / Admin Suite, and Office / Business Suite.
- Communication Suite does not appear.
- Landing product cards show clear actions.
- AR-MAIL-PRO appears under HR / Admin Suite as Mail preparation.
- Products page loads.
- Product cards show service-like readiness labels.
- AR-CERT-PRO opens the real workspace.
- Workspace setup products open detail/setup pages, not fake workspaces.
- Dashboard loads and uses ready-to-use/setup wording.
- Product detail pages do not show unavailable messages for catalog products.
- No false PDF claim appears.
- No real-email claim appears.
- Email Prep remains safe dry-run only.

## Conclusion

Project Atlas v2.64 presents the product suite as ready-to-use where a workspace exists and setup-ready where a dedicated workspace still needs scoping, without adding unsupported commercial, email-sending, OAuth, PDF, storage, or database-delete behavior.
