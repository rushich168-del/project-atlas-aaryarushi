# Project Atlas v2.10 - Email Provider Selection and Sandbox Sending Plan

## Status

Project Atlas v2.10 is a planning-level milestone only.

No real email sending is implemented in this release. No SendGrid API call is made in this release. Existing v2.9.1 dry-run preparation and readiness checks remain the active behavior.

## Provider Decision

Selected first MVP provider:

- Provider: SendGrid
- Initial mode: sandbox only
- Planned Edge Function: email-delivery-sendgrid-sandbox

SendGrid is selected first because its sandbox mode validates the request without delivering real emails. This fits the current Project Atlas safety requirement: prove the request shape, attachments, ownership checks, and status updates before any production delivery exists.

Later provider options:

- Resend remains a later optional provider because it is simple, but it does not provide a true sandbox mode.
- Mailgun should not be first because test mode is charged and sandbox domains are limited.
- Gmail and Outlook should come later because OAuth, refresh-token handling, and mailbox-provider rules are more complex.

## Required Edge Function Secrets

These values must be configured only as Supabase Edge Function secrets or server-side environment values. They must not be added to Vite frontend environment variables and must not appear in browser code.

```text
EMAIL_PROVIDER=sendgrid
EMAIL_MODE=sandbox
SENDGRID_API_KEY
SENDGRID_FROM_EMAIL
SENDGRID_FROM_NAME
EMAIL_MAX_RECIPIENTS_PER_JOB=5
EMAIL_MAX_ATTACHMENT_MB=10
EMAIL_REQUIRE_CONFIRMATION=true
EMAIL_ALLOW_PRODUCTION_SEND=false
```

Frontend-safe variables should not include SendGrid credentials. The browser may display provider and mode labels, but it must never receive `SENDGRID_API_KEY` or any provider secret.

## Planned v2.11 Flow

The v2.11 implementation should add sandbox validation only through `email-delivery-sendgrid-sandbox`.

Planned flow:

1. Validate the authenticated user from the Supabase auth context.
2. Validate the email delivery job belongs to the current user and organization.
3. Read `email_delivery_jobs`.
4. Read `email_delivery_outputs`.
5. Read matching `generation_outputs` records, including `row_data`, `storage_bucket`, and `storage_path`.
6. Download each generated DOCX from Supabase Storage server-side.
7. Convert each DOCX to a Base64 attachment.
8. Call SendGrid sandbox mode in v2.11 only.
9. Update each `email_delivery_outputs` row status.
10. Return a summary to the frontend.

The v2.10 release does not perform steps 6 through 9 in production code.

## Safe First-Release Limits

The first sandbox validation release must enforce:

- Max 5 recipients per sandbox job
- Max 10 MB attachment per email
- DOCX attachments only
- No ZIP email attachment
- No PDF email attachment yet
- No production send
- Confirmation required before any future live send mode exists
- `EMAIL_ALLOW_PRODUCTION_SEND=false`

## Planned Statuses

Future SendGrid sandbox validation can use these job or output statuses:

- draft
- readiness_checked
- confirmation_required
- sandbox_queued
- sandbox_validated
- sandbox_failed
- blocked

Current dry-run statuses should not be broken while these are planned. Add database migrations only when v2.11 implements the sandbox validation function.

## Email Prep Panel Copy

The Email Prep panel may show planning copy only:

- Provider: SendGrid
- Mode: Sandbox Validation Only
- Real emails will be sent: No
- Next release action label: Validate Sandbox Send

Do not add a real "Send Emails" button in v2.10.

## Safety Rules

- No provider secrets in frontend code.
- No provider secrets in Vite environment variables.
- No SendGrid API call in v2.10.
- No SMTP or OAuth implementation in v2.10.
- No production send mode.
- No service role key in frontend code.
- Attachments must be read server-side by the Edge Function when v2.11 is implemented.

## Acceptance Notes

v2.10 is complete when Project Atlas clearly documents SendGrid sandbox as the first provider path, the frontend communicates the planned sandbox-only mode, and all existing v2.9.1 behavior remains unchanged.
