# Project Atlas v2.11 - SendGrid Sandbox Validation

## Purpose

Project Atlas v2.11 adds a Supabase Edge Function that validates prepared email jobs against SendGrid Mail Send sandbox mode.

This milestone does not deliver real emails. The frontend action is named "Validate Sandbox Send" and production sending remains blocked.

## Edge Function

Function name:

```text
email-delivery-sendgrid-sandbox
```

Deploy with:

```bash
supabase functions deploy email-delivery-sendgrid-sandbox
```

## Required Supabase Edge Function Secrets

Configure these only as Supabase Edge Function secrets:

```text
SENDGRID_API_KEY
SENDGRID_FROM_EMAIL
SENDGRID_FROM_NAME
EMAIL_PROVIDER=sendgrid
EMAIL_MODE=sandbox
EMAIL_MAX_RECIPIENTS_PER_JOB=5
EMAIL_MAX_ATTACHMENT_MB=10
EMAIL_ALLOW_PRODUCTION_SEND=false
```

Do not place any `SENDGRID_*` value in `src/`, `.env.local`, Vite config, or browser-exposed code.

## Safety Behavior

- SendGrid payloads always include `mail_settings.sandbox_mode.enable: true`.
- The function rejects non-`sendgrid` providers.
- The function rejects non-`sandbox` mode.
- The function rejects `EMAIL_ALLOW_PRODUCTION_SEND=true`.
- The function limits each job to 5 prepared recipients by default.
- The function limits each DOCX attachment to 10 MB by default.
- The function accepts DOCX attachments only.
- The function never attaches ZIP files.
- The function never attaches PDF files.
- The frontend never receives provider secrets.

## Validation Flow

1. Validate the authenticated Supabase user.
2. Load `email_delivery_jobs`.
3. Confirm the job belongs to the user or the user's organization.
4. Load `email_delivery_outputs`.
5. Load matching `generation_outputs`.
6. Confirm each recipient can be found in `generation_outputs.row_data`.
7. Confirm each generated output has a DOCX storage path.
8. Download the DOCX from Supabase Storage server-side.
9. Check attachment size.
10. Convert the DOCX to Base64.
11. Call SendGrid Mail Send API in sandbox mode.
12. Update each `email_delivery_outputs` row.
13. Return a summary to the frontend.

## Output Statuses

The v2.11 migration adds safe sandbox statuses:

- sandbox_queued
- sandbox_validated
- sandbox_failed
- blocked

It also adds these logging fields to `email_delivery_outputs`:

- error_code
- error_message
- provider
- provider_mode
- provider_message_id
- updated_at

## Expected Frontend Result

After Save Email Prep and Check Send Readiness pass, the UI shows "Validate Sandbox Send".

The result summary includes:

- Prepared recipients
- Sandbox validated
- Sandbox failed
- Blocked

The UI must continue to state:

```text
Sandbox validation only. No real emails will be delivered.
```
