# Project Atlas v2.27 Demo Run Validation Report

Date: 2026-07-05

## Local Run Result

- Local dev server: Pass
- Command: `npm run dev -- --host 127.0.0.1 --port 5173`
- `http://127.0.0.1:5173/`: HTTP 200, SPA shell loaded.
- `http://127.0.0.1:5173/dashboard`: HTTP 200, SPA shell loaded.
- Dev server cleanup: stopped after validation; port 5173 is free.
- Production build: Pass. `npm run build` completed successfully. Existing Vite large chunk warning remains.

## Demo Assets Validation

- `docs/demo-assets/sample-certificate-data.csv`: Pass after correction.
- `docs/demo-assets/certificate-template-placeholders.md`: Pass after correction.
- `docs/demo-assets/README.md`: Pass after correction.
- Issue fixed during validation: the v2.26 asset pack used `Grade` / `{{grade}}`, but the current AR-CERT-PRO app fields are `Name`, `Course`, `Date`, `Certificate_ID`, and optional `Trainer`. The assets now use `Trainer` / `{{trainer}}`, so Auto-map has a clean demo path.

## Demo Flow Checklist

| Step | Status | Notes |
| --- | --- | --- |
| 1. Landing page opens | Pass | Local `/` returned HTTP 200 and loaded the app shell. |
| 2. Login / protected dashboard works | Not fully executed | Local `/dashboard` returned HTTP 200 app shell. Full auth validation requires an interactive browser session and Supabase demo credentials. |
| 3. Product suite dashboard opens | Static pass | Route and dashboard wiring are present; full visual verification requires authenticated browser session. |
| 4. AR-CERT-PRO workspace opens | Static pass | Workspace route and certificate config wiring are present. |
| 5. Upload DOCX template manually | Not executed | Requires interactive browser file upload and a manually created DOCX binary. Placeholder guide is now aligned to app fields. |
| 6. Upload sample certificate CSV | Static pass | CSV has five rows and app-supported columns. Interactive upload was not executed in this environment. |
| 7. Field auto-mapping works | Static pass | Asset headers now match supported field ids/labels after normalization. |
| 8. Preview row works | Static pass | Preview uses mapped CSV values through existing merge flow. Not interactively executed. |
| 9. Generate single DOCX | Not executed | Requires authenticated Supabase session and uploaded DOCX/CSV. No product logic was changed. |
| 10. Generate batch DOCX for 5 rows | Not executed | Requires authenticated Supabase session and uploaded files. CSV row count is correct for the demo. |
| 11. History shows outputs | Not executed | Requires generated records in Supabase. History route and fetch wiring were inspected previously and not changed. |
| 12. Download one generated DOCX | Not executed | Requires generated History record. Download logic was not changed. |
| 13. Open batch details | Not executed | Requires generated batch record. Batch details logic was not changed. |
| 14. Download Batch ZIP | Not executed | Requires generated batch outputs. ZIP logic was not changed. |
| 15. Email Prep safety/readiness panels | Static pass | Email Prep still shows dry-run/readiness/sandbox/owner-test safety states; controlled batch and failed-row resend remain gated. No emails were sent. |

## Issues Found

- Fixed: Demo assets referenced unsupported `Grade` / `{{grade}}`, which would have made the demo less smooth and could show an unknown placeholder warning. Updated assets to use supported `Trainer` / `{{trainer}}`.
- Limitation: This environment did not have an interactive authenticated browser session, Supabase demo credentials, or a generated DOCX template binary, so upload/generation/download steps were not fully executed end-to-end.
- Existing non-blocking warning: Vite reports the main JS chunk is larger than 500 kB after minification.

## Recommended Next Single Task

Run one human-in-the-browser demo rehearsal with the corrected demo assets and a real DOCX template created from `certificate-template-placeholders.md`. Record whether each upload, generation, History download, ZIP download, and Email Prep readiness step passes with the deployed Supabase environment.
