# Project Atlas v2.50 Final Demo Snapshot

- **Version:** Project Atlas v2.50 Final Demo Snapshot
- **Date:** 2026-07-05
- **Live site:** https://aaryarushi.vercel.app
- **GitHub repo:** https://github.com/rushich168-del/project-atlas-aaryarushi
- **Latest `main` commit:** `146294e` — Merge branch 'v2.49-history-scroll-restore' (`146294eb2b9066fa35a303289f1546fbfed897c3`)

This is a demo-readiness snapshot, not a feature sprint. No new sending, billing,
OAuth, or destructive logic was enabled while producing it.

## Completed Milestones (v2.38 → v2.49)

| Milestone | Summary |
|-----------|---------|
| v2.38 | Recipient allowlist safety gate |
| v2.39 | Edge Function allowlist validation checks |
| v2.40 | Server-authoritative `sendReady` gate |
| v2.41 | Non-default confirmation-phrase hardening |
| v2.42 | Failed-row resend prerequisite parity |
| v2.43 | Shared real-send hourly/daily rate caps |
| v2.44 | Structured email audit logs with PII redaction |
| v2.45 | Email safety final validation snapshot |
| v2.46–v2.47 | Safe workspace UI polish (header, grid, stepper sizing) |
| v2.48 | Dashboard left/right panel layout polish |
| v2.49 | History scroll restoration (fix → repair → stabilize on browser-level return) |

v2.49 History scroll work is merged into `main` (`cbd3c2f` → `6b34491` →
`6edce80`, merge `146294e`).

## Current Demo-Ready Features

- Landing page and marketing shell
- Auth flow (login / signup) via Supabase, protected dashboard routes
- Dashboard with left/right panel layout
- Products / Workspace product pages
- Template (DOCX) upload
- Excel (data source) upload
- Field mapping and preview
- Clear-files button resets local upload state only
- Single DOCX generation
- Batch DOCX generation
- History: list, filters, re-download, batch ZIP, delete
- History scroll restoration across internal nav **and** browser back/forward,
  tab/window switch, and post-reload remount
- Email Preparation dry-run (manual prep preview only)

## Email Safety Status

- Dry-run only. The Email Preparation panel prepares a preview of recipients from
  saved row data and performs **no** real send.
- `sendReady` is computed **server-side** in
  `supabase/functions/email-delivery-dry-run/index.ts`
  (`sendReady = totalRecipients > 0 && preparedCount === totalRecipients`); the
  client cannot self-authorize a send.
- Dry-run prepares the valid recipients present in the dataset (the demo dataset
  contains 5 recipients) and reports `preparedCount` / `sendReady`; zero emails
  are dispatched.
- No frontend SendGrid/secret material; no Gmail/Outlook OAuth.

### Disabled Real-Send Flags (default OFF)

```text
EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false
EMAIL_ALLOW_FAILED_ROW_RESEND=false
```

- Controlled batch real send is gated in
  `supabase/functions/email-delivery-sendgrid-controlled-batch/index.ts`
  (`Deno.env.get('EMAIL_ALLOW_CONTROLLED_BATCH_SEND') === 'true'`) and remains
  disabled.
- Failed-row resend is gated in
  `supabase/functions/email-delivery-sendgrid-resend-failed/index.ts`
  (`Deno.env.get('EMAIL_ALLOW_FAILED_ROW_RESEND') === 'true'`) and remains
  disabled.

## Supabase Edge Functions Deployed

- `email-delivery-dry-run` (safe preview; server-authoritative `sendReady`)
- `email-delivery-sendgrid-controlled-batch` (real send — **gated, disabled**)
- `email-delivery-sendgrid-owner-test` (owner-only test — gated)
- `email-delivery-sendgrid-resend-failed` (failed-row resend — **gated, disabled**)
- `email-delivery-sendgrid-sandbox` (SendGrid sandbox)

## Confirmed Build Result

`npm run build` — **PASS**

- Vite v7.3.6 production build completed successfully.
- 2183 modules transformed; output generated under `dist/`.
- Working tree clean after build.
- Pre-existing >500 kB main-bundle chunk-size warning only (not a v2.50 failure).

## Confirmed Manual Test Result

**Automated/static verification performed in this snapshot (PASS):**

- Production build passes; working tree clean.
- Live site https://aaryarushi.vercel.app responds `HTTP 200` and serves the app shell.
- Controlled batch real send gate present and disabled by default (code-verified).
- Failed-row resend gate present and disabled by default (code-verified).
- Dry-run `sendReady` is server-authoritative (code-verified); dry-run path
  dispatches no emails.
- No email/secret/sending flags were changed by this snapshot.

**Interactive UI flows requiring an authenticated session — to be confirmed by
the operator on the live/local app (not driven in this snapshot):**

- Landing loads; login/auth reachable; Dashboard loads with left/right panels
- Workspace/product page loads
- Template upload / Excel upload / field mapping + preview
- Clear-files resets local upload state only
- Single DOCX generation; Batch DOCX generation
- History loads; re-download works; scroll restoration restores position
- Email Prep dry-run prepares 5 recipients, says server-authoritative, sends nothing

These flows are auth-gated (Supabase login) and depend on live backend/storage;
they should be walked through once by the operator before the demo. All
supporting logic is present and unchanged in `main` at `146294e`.

## Known Parked Items

- Gmail/Outlook OAuth **not** added.
- Billing **not** added.
- Real controlled batch sending **disabled**.
- Failed-row resend **disabled**.
- PDF export **not** faked (no fake export path introduced).
- Risky stashes still parked (not applied/popped).
- `generatedDocumentsService.js` destructive-delete changes **not** recovered
  (intentionally left parked; not modified).

## Final Conclusion

Project Atlas is demo-ready with **safe email dry-run only**. No real
row-recipient emails are sent. All real-send paths remain gated and disabled, and
no secrets, sending flags, or destructive logic were changed to produce this
snapshot.
