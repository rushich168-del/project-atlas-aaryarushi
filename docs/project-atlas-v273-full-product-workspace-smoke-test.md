# Project Atlas v2.73 Full Product Workspace Smoke Test

## Version

v2.73 - Full Product Workspace Smoke Test and UX Hardening

Date: 2026-07-06

## Goal

Verify every product route/workspace and fix only real UX or routing problems.
No new product features were added. No architecture was refactored.

## Products Tested

Active DOCX / workspace products:

- AR-CERT-PRO — original certificate workspace
- AR-MARKSHEET-PRO — shared DOCX workspace
- AR-REPORT-PRO — shared DOCX workspace
- AR-WORKSHEET-PRO — shared DOCX workspace
- AR-QUESTION-PRO — shared DOCX workspace
- AR-IDCARD-PRO — shared DOCX workspace (text placeholders only)
- AR-INVOICE-PRO — shared DOCX workspace
- AR-FEE-RECEIPT-PRO — shared DOCX workspace

Special safe product:

- AR-MAIL-PRO — mail-prep / dry-run only, no real sending

Routes inspected: landing page product suite links, dashboard suite cards,
product detail page primary action, products grid card actions, and the direct
`/dashboard/products/<slug>/workspace` route resolution in `App.jsx` /
`ProductWorkspacePage.jsx`.

## Route Behavior Table

| Product | Workspace route | Resolves to | Correct? |
| --- | --- | --- | --- |
| AR-CERT-PRO | `/dashboard/products/ar-cert-pro/workspace` | Original certificate workspace (`certificateWorkspaceConfig`) | Yes |
| AR-MARKSHEET-PRO | `.../ar-marksheet-pro/workspace` | Shared DOCX workspace | Yes |
| AR-REPORT-PRO | `.../ar-report-pro/workspace` | Shared DOCX workspace | Yes |
| AR-WORKSHEET-PRO | `.../ar-worksheet-pro/workspace` | Shared DOCX workspace | Yes |
| AR-QUESTION-PRO | `.../ar-question-pro/workspace` | Shared DOCX workspace | Yes |
| AR-IDCARD-PRO | `.../ar-idcard-pro/workspace` | Shared DOCX workspace (text only) | Yes |
| AR-INVOICE-PRO | `.../ar-invoice-pro/workspace` | Shared DOCX workspace | Yes |
| AR-FEE-RECEIPT-PRO | `.../ar-fee-receipt-pro/workspace` | Shared DOCX workspace | Yes |
| AR-MAIL-PRO | `.../ar-mail-pro/workspace` | Guided mail-prep starter (no config, no DOCX generation, dry-run wording only) | Yes |
| Unknown slug | `.../<unknown>/workspace` | "Product not found" screen with "Back to dashboard" (no crash) | Yes (hardened) |

All eight DOCX products already routed to the correct workspace engine
(`certificateWorkspaceConfig` + `sharedDocumentWorkspaceConfigs`). The routing
itself was correct; the defects were stale/contradictory presentation copy.

## Issues Found and Fixed

The shared DOCX workspace was activated for AR-MARKSHEET-PRO / AR-INVOICE-PRO /
AR-FEE-RECEIPT-PRO in v2.70 and for AR-REPORT-PRO / AR-WORKSHEET-PRO /
AR-QUESTION-PRO in v2.71, but several presentation surfaces were never updated
in lockstep. They still described live workspaces as "planned / requires setup /
not yet live." `ProductCard` (products grid) and `config.js` were already
correct, so the surfaces disagreed with each other.

1. **products.js** — AR-MARKSHEET-PRO, AR-INVOICE-PRO, AR-FEE-RECEIPT-PRO stage
   text said "requires setup", outputs said "Planned DOCX ...", and metrics said
   "Setup Workspace" / "Planned DOCX" / "Request setup". Updated to reflect the
   live shared DOCX workspace ("Generated DOCX ...", "Product Workspace").
   AR-FEE-RECEIPT-PRO `desktopAvailable` was `false` while it has a live desktop
   workspace and its inputs were prefixed "Planned"; corrected both.

2. **DashboardPage.jsx** — suite cards for AR-MARKSHEET-PRO, AR-INVOICE-PRO,
   AR-FEE-RECEIPT-PRO showed status "Workspace setup" / "Request setup" and a
   "Setup Workspace" button. Aligned to "Product workspace" + "Open Workspace"
   to match the live routing and the other shared DOCX cards.

3. **ProductDetailPage.jsx** — AR-MARKSHEET-PRO and AR-INVOICE-PRO sections
   claimed the product "does not yet have a separate live workspace";
   AR-FEE-RECEIPT-PRO showed "Planned:" workflow steps and "requires workspace
   setup before use ... not available inside Project Atlas yet." Rewrote these to
   the honest "now uses the shared DOCX workspace" language. Also fixed the
   readiness lists and label chips for MARKSHEET / INVOICE / FEE-RECEIPT and for
   REPORT / WORKSHEET / QUESTION (which still read "DOCX output planned" /
   "Workspace setup path ready" / "Setup Workspace" despite live workspaces).
   AR-FEE-RECEIPT-PRO's "Suggested future placeholders" listed names that did not
   match the live config (ReceiptNumber, Course, ReceiptMode, AuthorizedBy, ...);
   replaced with the actually supported placeholders (ReceiptNo, ReceiptDate,
   StudentName, RollNo, Class, FeeType, AmountPaid, PaymentMode, Balance) and the
   "Before you start" checklist was aligned to the same fields.

4. **LandingPage.jsx** — public product suite showed AR-MARKSHEET-PRO,
   AR-REPORT-PRO, AR-WORKSHEET-PRO, AR-QUESTION-PRO, AR-INVOICE-PRO,
   AR-FEE-RECEIPT-PRO as "Workspace setup" / "Request Setup" linking to the
   detail page. Updated to "Product workspace" / "Open Workspace" linking directly
   to `/workspace`, matching AR-IDCARD-PRO. Added a `Product workspace` case to
   `getStatusClass` so the badge renders blue instead of falling through to amber.

5. **ProductWorkspacePage.jsx (item 10 — defensive fallback)** — the unknown-slug
   fallback said "This product workspace is not configured yet. AR-CERT-PRO is the
   first product wired into the generic workspace engine." and routed back to a
   dead product detail page. Replaced with a clear "Product not found" message and
   a direct "Back to dashboard" action. The app does not crash on unknown slugs.

6. **productFilters.js** — the Products page status filter bucketed the seven
   shared DOCX products under "Workspace setup" / "Request setup" (derived from
   the internal status enum), so selecting the "Product workspace" filter hid the
   very products whose cards read "Product workspace". Added a shared-DOCX slug
   set so the derived filter status matches the card.

## Checklist Verification

- Every active DOCX product opens the correct workspace: confirmed.
- AR-MAIL-PRO does not open DOCX generation and does not imply real sending:
  confirmed (guided starter, `isMailProduct` dry-run wording, no config).
- Shared DOCX products have correct product name, suite/category, template label,
  Excel label, output label, placeholder examples, `{{ColumnName}}` guidance, and
  DOCX-only output wording: confirmed in `document-workspace/config.js`.
- AR-IDCARD-PRO clearly states text placeholders only and no automated photo
  placement: confirmed (products.js, config.js, detail page honesty note).
- No product claims PDF export unless supported: confirmed — every DOCX product
  states "PDF export not available"; the only "PDF" mentions are disabled/unavailable.
- No product action mentions pricing / payment / free / demo / trial: confirmed.
  "Demo Ready" / "Safe Demo" are internal status enums surfaced to users as
  "Ready to use" / "Mail preparation" via StatusBadge; no billing wording exists.

## Quality Searches

- "Communication Suite" in `src`: not rendered as a suite. The `communication`
  category still exists only as plumbing for AR-MAIL-PRO's `categoryId`; both
  `ProductCard` and `DashboardPage` map it into the HR / Admin Suite, so the suite
  grouping remains Education / HR-Admin / Office-Business. Not re-added.
- `<<` / `>>` in `src/docs`: directory does not exist; no stray angle-bracket
  placeholders were found in source.
- pricing / payment / checkout / subscription / free demo / trial in user-facing
  `src`: none found.
- PDF claims in product UI: all are "not available" / "disabled" statements.
- Email sending implication in AR-MAIL-PRO UI: none — dry-run wording only.

## Issues Intentionally Deferred

- The dashboard "Stable checkpoint" label still reads "v2.64 product readiness".
  This is a cosmetic version string, not a workspace routing/UX defect, so it was
  left untouched to avoid scope creep beyond the smoke test.
- The AR-FEE-RECEIPT-PRO detail "Readiness and limitations" card retains its amber
  styling (a leftover of its former "plan" card). The wording is now accurate;
  only the accent color differs from the other shared products. Left as-is to avoid
  cosmetic-only churn.
- Bundle size warning (single >500 kB chunk) is pre-existing and unrelated.

## Safety Confirmation

- No billing, payment, checkout, pricing, or subscription page/logic was added.
- No real email sending was enabled; AR-MAIL-PRO remains dry-run / safe only.
- Controlled batch sending and failed-row resend remain disabled.
- No Gmail/Outlook OAuth was added.
- No secrets were changed, exposed, or printed.
- `generatedDocumentsService.js` destructive delete logic was not touched.
- No storage/database delete logic was added or modified.
- No PDF export was faked or claimed.
- No photo/image automation was added (AR-IDCARD-PRO stays text-only).
- No old stashes were applied or popped.
- Output remains DOCX-only where generation exists.
