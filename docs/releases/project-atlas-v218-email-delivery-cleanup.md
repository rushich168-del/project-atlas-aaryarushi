# Project Atlas v2.18 - Email Delivery Release Cleanup

## Purpose

Project Atlas v2.18 is a cleanup and release-note milestone for the email delivery workstream.

No new email sending logic is introduced in this release. No Edge Functions are added or changed.

## Current Safety Posture

- Controlled batch sending must remain disabled unless `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=true` is explicitly set in Supabase Edge Function secrets.
- Failed-row resend must remain disabled unless `EMAIL_ALLOW_FAILED_ROW_RESEND=true` is explicitly set in Supabase Edge Function secrets.
- Default project posture is safe: controlled batch and failed-row resend flags should be `false`.
- SendGrid secrets remain server-side only.
- No ZIP/PDF email attachments are enabled.
- Gmail and Outlook OAuth are not part of this release.

## Completed Email Milestones

### v2.10 - Provider Selection

Selected SendGrid as the first MVP email provider because SendGrid sandbox mode can validate payloads without delivering real emails.

### v2.11 - SendGrid Sandbox Validation

Added `email-delivery-sendgrid-sandbox`.

The function validates prepared email rows through SendGrid sandbox mode and sends 0 real emails.

### v2.12 - Owner/Test Real Email

Added `email-delivery-sendgrid-owner-test`.

This milestone sends exactly one real email to the configured owner/test email only. Row recipients are used only as preview context.

### v2.13 - Controlled Batch Design

Added the safety design for controlled real batch delivery.

Defined future function name:

```text
email-delivery-sendgrid-controlled-batch
```

### v2.14 - Controlled Batch Disabled Gate

Added controlled batch infrastructure behind a disabled backend flag.

Default behavior: blocked before any SendGrid call when `EMAIL_ALLOW_CONTROLLED_BATCH_SEND` is not exactly `true`.

### v2.15 - Controlled Real Batch Max 5 Test

Verified controlled real batch sending for a maximum of 5 owned test recipients.

Safety rules remained in force:

- Max 5 recipients.
- DOCX only.
- No ZIP/PDF.
- No CC/BCC.
- Row-level `batch_send_status` logging.

After the test, `EMAIL_ALLOW_CONTROLLED_BATCH_SEND` must be returned to `false`.

### v2.16 - Failed Resend Design

Added design documentation for failed-row resend only.

Defined future function name:

```text
email-delivery-sendgrid-resend-failed
```

### v2.17 - Failed Resend Disabled Gate

Added failed-row resend infrastructure behind a disabled backend flag.

Default behavior: blocked before any SendGrid call when `EMAIL_ALLOW_FAILED_ROW_RESEND` is not exactly `true`.

Only rows with `batch_send_status = 'batch_failed'` are eligible. Rows with `batch_send_status = 'batch_sent'` must never be resent.

## UI Cleanup

Current gate labels remain:

- `Check Controlled Batch Send Gate`
- `Check Failed Row Resend Gate`

Confirmation phrase placeholders remain uppercase:

- `SEND 5 TEST EMAILS`
- `RESEND FAILED ROWS`

The UI must not use active production-style wording such as:

- `Send Emails`
- `Send Batch`
- `Production Send`

## Verification Checklist

- Build passes.
- Frontend secret scan passes.
- No real emails are sent by this cleanup milestone.
- Existing DOCX generation, batch generation, ZIP download, History downloads, delete, Email Prep, sandbox validation, owner-test send, controlled batch gate, and failed-row resend gate remain unchanged.
