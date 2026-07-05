# Project Atlas v2.74 Product Sample Starter Packs

## Version

v2.74 - Product Sample Starter Packs

Date: 2026-07-06

## Goal

Make every active DOCX product easier to start by showing the exact required
placeholders, Excel columns, and example rows inside the workspace, plus safe,
locally generated downloadable sample files.

## Products Covered

Sample starter packs were added for all eight active DOCX products:

- AR-CERT-PRO
- AR-MARKSHEET-PRO
- AR-REPORT-PRO
- AR-WORKSHEET-PRO
- AR-QUESTION-PRO
- AR-IDCARD-PRO (text-only, no photo/image placement)
- AR-INVOICE-PRO
- AR-FEE-RECEIPT-PRO

AR-MAIL-PRO is unchanged: it continues to use the guided mail-prep starter with
recipient/data preparation guidance only. No sending was added.

## Downloadable Files vs. In-App Guidance

Both were added — the downloads are genuine, not faked:

- **Sample Excel (.xlsx): real downloadable file.** Generated locally in the
  browser with the project's existing SheetJS (`xlsx`) dependency, which writes
  valid OOXML spreadsheets. Columns and 2-3 example rows per product.
- **Sample Word template (.docx): real downloadable file.** Assembled locally in
  the browser with the project's existing `pizzip` dependency as a minimal, valid
  Word Open XML document containing the product's `{{ColumnName}}` placeholders,
  each in its own text run so the placeholder detector and generator read them
  cleanly.
- **In-app sample tables:** every product also shows the placeholders, columns,
  and example rows directly in the workspace, so the structure is usable even
  without downloading anything.

No sample binaries are committed to the repository. Files are produced on demand
at download time, which avoids shipping any broken/stale binary artifacts. The
suggested `public/samples/...` static-file layout was therefore intentionally not
used; runtime generation from existing dependencies is safer and reuses the same
engine the products already ship.

Each generated pack was validated end-to-end (columns match, all placeholders
detected with zero invalid tokens, and a generated document renders every value
with no blank/"undefined" output) for all eight products before commit.

## Placeholder / Excel Column Contract

- Word placeholders use the `{{ColumnName}}` format only.
- The sample Excel column headers are identical to the placeholder inner text, so
  the template, the spreadsheet, and the field mapping line up 1:1.
- Example (AR-MARKSHEET-PRO): placeholders `{{StudentName}}`, `{{RollNo}}`,
  `{{Maths}}`, `{{Physics}}`, `{{Chemistry}}`, `{{Total}}`, `{{Grade}}`; columns
  `StudentName`, `RollNo`, `Maths`, `Physics`, `Chemistry`, `Total`, `Grade`.
- AR-CERT-PRO keeps its original lowercase placeholders (`{{name}}`, `{{course}}`,
  `{{date}}`, `{{certificate_id}}`, `{{trainer}}`) to match its existing engine
  field ids.

## Generation Correctness Fix (required for the samples to work)

While validating the sample templates end-to-end, the shared DOCX generator was
found to render the advertised `{{ColumnName}}` placeholders as the literal text
`undefined`. Cause: `generateDocxFromTemplate` rendered with `mergeResult.values`,
which is keyed by lowercase field id (e.g. `studentname`), while templates use the
documented case (e.g. `{{StudentName}}`), and docxtemplater resolves tags
case-sensitively. AR-CERT-PRO was unaffected because its field ids are already
lowercase.

Minimal, additive fix (no architecture change, no new dependency):

- `generateDocxFromTemplate` now builds its render data from BOTH
  `mergeResult.values` (field-id keys — keeps AR-CERT-PRO working) and
  `mergeResult.placeholders` (the exact `{{...}}` tag text). This makes templates
  written with the documented placeholders render the mapped values.
- A `nullGetter` returning an empty string was added so a tag with no value never
  renders the literal word `undefined` into a user document.

This change is confined to the render-data assembly. It does not touch storage,
database, delete, email, secrets, or PDF logic.

## Known Limitations

- Sample Word templates are intentionally plain (title + labelled placeholder
  lines). They are a correct starting structure, not a finished visual design.
- PDF export remains unavailable and is not claimed anywhere.
- AR-IDCARD-PRO samples are text-only; no automated photo/image placement.
- Downloads are generated in the browser; if a browser blocks the generated
  download the panel shows a message and the in-app tables remain fully usable.
- The single-chunk bundle-size warning is pre-existing (`xlsx` was already a
  project dependency; it is now also imported by the sample generator).

## Quality Checks

- `<<` / `>>` in `src` / docs / public samples: none (no `public/samples` files
  were created; runtime generation is used).
- "Communication Suite" in `src`: none.
- No pricing / payment / checkout / subscription / free / demo / trial wording was
  introduced. ("PaymentMode" in the fee-receipt sample is a domain field, e.g.
  UPI / Cash, not billing.)
- No PDF claims were added.
- AR-MAIL-PRO still does not imply real sending; it was not modified.
- No secrets, storage-delete, or database-delete files were touched.
  `generatedDocumentsService.js` was not changed.

## Safety Confirmation

- No billing, payment, checkout, pricing, or subscription page/logic was added.
- No real email sending was enabled; AR-MAIL-PRO remains dry-run / safe only.
- No controlled batch sending or failed-row resend was added.
- No Gmail/Outlook OAuth was added.
- No secrets were changed, exposed, or printed.
- `generatedDocumentsService.js` destructive delete logic was not touched.
- No storage/database delete logic was added or modified.
- No PDF export was faked or claimed.
- No photo/image automation was added (AR-IDCARD-PRO stays text-only).
- No old stashes were applied or popped.
- Only existing dependencies (`xlsx`, `pizzip`) were used; no new dependency added.
