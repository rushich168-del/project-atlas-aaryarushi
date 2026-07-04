# Project Atlas v2.5 — Real Email Delivery Architecture

## Current status

Project Atlas v2.4 already supports:

- Manual email preparation for generated documents
- Recipient column selection
- Subject and message template preview
- Copy recipient and copy message actions
- DOCX single generation
- DOCX batch generation
- ZIP download
- History re-download
- Delete operations where Supabase permissions allow

Automatic email sending is not implemented yet. The current panel is a manual preparation experience only.

## v2.5 goal

Define a safe future architecture for sending generated DOCX files by email without introducing insecure browser-side email behavior, secrets, or broken sending logic.

## Why browser email sending is not allowed

Frontend/browser code must never contain:

- SMTP password
- Gmail refresh token
- Outlook refresh token
- API keys for email providers
- Service role key

The browser should never be trusted with direct email delivery responsibilities. Real sending must happen from a secure backend layer such as Supabase Edge Functions.

## Recommended future architecture

Recommended flow:

1. User generates DOCX files
2. Files are stored in Supabase Storage
3. User opens the Email Delivery panel
4. User selects the recipient column
5. User previews the subject and message
6. User confirms send
7. Frontend calls a Supabase Edge Function
8. Edge Function checks the authenticated user
9. Edge Function validates job and output ownership
10. Edge Function downloads the generated DOCX from Supabase Storage
11. Edge Function sends the email through a trusted provider
12. Edge Function records the outcome in an audit log
13. Frontend shows sent or failed status

## Supabase Edge Function role

The Supabase Edge Function should be the secure execution boundary for email delivery.

Responsibilities:

- Verify the signed-in user
- Confirm access to the requested generation output or job
- Retrieve generated documents from Supabase Storage
- Build the provider payload
- Send the email through a trusted provider
- Record status and errors in application logs
- Enforce rate limits and retry policy

The Edge Function is the recommended place for all email-sending logic because it can safely hold provider credentials and enforce authorization rules.

## v2.10 provider selection

Project Atlas v2.10 selects SendGrid as the first MVP email provider for the next sandbox milestone.

- Selected provider: SendGrid
- Initial mode: sandbox only
- Planned Edge Function: email-delivery-sendgrid-sandbox
- Next implementation step: v2.11 SendGrid sandbox validation only

SendGrid is selected first because its sandbox mode validates the request without delivering real emails. Resend remains a later optional provider because it is simple but does not provide a true sandbox mode. Mailgun should not be first because test mode is charged and sandbox domains are limited. Gmail and Outlook should come later because OAuth is more complex.

No SendGrid API call is made in v2.10.

## Email provider role

A dedicated email provider such as Resend, SendGrid, Postmark, or a similar service should handle actual delivery.

The provider should be responsible for:

- SMTP or API-based delivery
- Delivery status callbacks where available
- Message ID tracking
- Bounce and complaint handling
- Reputation and retry behavior

Project Atlas should not attempt direct SMTP from the browser. It should delegate delivery to the backend edge function and provider.

## Storage attachment handling

Generated DOCX files should remain in Supabase Storage as the source of truth.

Recommended approach:

- Store the generated file once in Storage
- Keep a reference to the object path in the generation output record
- The Edge Function downloads the file securely when ready to send
- The file is attached from the backend layer only
- The browser never needs direct access to provider secrets or attachment upload credentials

This keeps the document lifecycle consistent with existing generation and history flows.

## Security rules

Security controls should include:

- Authentication required before any send request is accepted
- Authorization checks for organization, user, job, and output ownership
- No secrets in frontend code
- No provider credentials in browser bundles
- Short-lived signed URLs or server-side storage access for attachments
- Strict input validation for recipients and template values
- Avoid sending arbitrary file content from untrusted input

## Rate limits

Future email sending should be rate-limited to avoid abuse and provider throttling.

Recommended controls:

- Per-user daily send cap
- Per-organization rate limits
- Burst protection for repeated requests
- Queue-based sending for larger batches
- Graceful handling of provider throttling and retries

## Attachment size concerns

DOCX attachments may be small, but larger generated files and batch mailings should be planned carefully.

Considerations:

- Provider attachment size limits
- Message size limits for bulk campaigns
- Storage bandwidth and download cost
- Compression where appropriate
- Alternate delivery patterns for very large attachments if needed

The architecture should support both single-document delivery and batch delivery without assuming unlimited attachment size.

## Email logs and audit trail plan

A future email delivery system should maintain logs for operational visibility and support.

Recommended logging fields:

- Delivery job ID
- User ID
- Organization ID
- Generation output reference
- Recipient address
- Provider message ID
- Delivery status
- Error message
- Attempt count
- Timestamp

This audit trail will support troubleshooting, re-send review, and future compliance needs.

## Retry and failure handling

Email sending should not be treated as instantly successful.

Recommended behavior:

- Mark each delivery attempt as pending, sent, or failed
- Retry transient provider failures with backoff
- Stop after a bounded retry count
- Record detailed error information for each failed attempt
- Surface clear status to the user without exposing sensitive backend details

## User confirmation flow before sending

Before any real send, the UI should guide the user through a clear confirmation step:

1. Review recipient list
2. Review subject and message preview
3. Confirm the selected generation output or batch
4. Confirm the final send action
5. See a progress or success summary after the backend completes

This protects users from accidental sends and keeps manual preparation and future auto-send behavior aligned.

## Future database plan only

This milestone documents the future database shape only. No migration is applied in v2.5 unless a later milestone explicitly approves it.

Possible future tables:

### email_delivery_jobs

- id
- organization_id
- user_id
- generation_job_id
- status
- total_recipients
- sent_count
- failed_count
- created_at
- completed_at

### email_delivery_outputs

- id
- email_delivery_job_id
- generation_output_id
- recipient_email
- subject
- status
- provider_message_id
- error_message
- sent_at
- created_at

## Future environment variables needed

A future implementation will require provider configuration in Supabase Edge Function secrets only. Do not place these values in Vite frontend environment variables.

- EMAIL_PROVIDER=sendgrid
- EMAIL_MODE=sandbox
- SENDGRID_API_KEY
- SENDGRID_FROM_EMAIL
- SENDGRID_FROM_NAME
- EMAIL_MAX_RECIPIENTS_PER_JOB=5
- EMAIL_MAX_ATTACHMENT_MB=10
- EMAIL_REQUIRE_CONFIRMATION=true
- EMAIL_ALLOW_PRODUCTION_SEND=false
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (stored only on the server-side edge function environment)

Frontend code should never contain these values.

## v2.11 sandbox flow plan

The planned `email-delivery-sendgrid-sandbox` Edge Function should:

1. Validate the authenticated user
2. Validate the job belongs to the user and organization
3. Read `email_delivery_jobs`
4. Read `email_delivery_outputs`
5. Read `generation_outputs` row data and storage path
6. Download each generated DOCX from Supabase Storage server-side
7. Convert each DOCX to a Base64 attachment
8. Call SendGrid sandbox mode in v2.11 only
9. Update `email_delivery_outputs` row status
10. Return a summary

The first sandbox release should allow a maximum of 5 recipients per job, a maximum 10 MB attachment per email, DOCX attachments only, no ZIP email attachment, no PDF email attachment, and no production send.

Planned future statuses:

- draft
- readiness_checked
- confirmation_required
- sandbox_queued
- sandbox_validated
- sandbox_failed
- blocked

## v2.12 owner/test real email milestone

Project Atlas v2.12 adds one controlled real email path for owner/test validation only.

- Edge Function: `email-delivery-sendgrid-owner-test`
- Real delivery target: configured owner/test email only
- Row recipient usage: preview context only
- Attachment: one DOCX only
- ZIP/PDF attachments: blocked
- Customer row recipient delivery: still blocked
- Production batch sending: still blocked

Owner/test delivery logs must remain separate from normal production delivery counts.

## v2.13 controlled batch send design

Project Atlas v2.13 is documentation and UI design only for future controlled real batch sending.

The planned future Edge Function name is:

```text
email-delivery-sendgrid-controlled-batch
```

The detailed safety design is documented in:

```text
docs/controlled-real-batch-send-v213.md
```

Future controlled batch sending must remain disabled by default and require:

1. Sandbox validation success.
2. Owner/test email success.
3. Explicit final confirmation.
4. Typed confirmation phrase.
5. Maximum 5 recipients for the first controlled batch.
6. DOCX-only attachments under 10 MB each.
7. No ZIP/PDF attachments.
8. No CC/BCC.
9. A stop switch before and during sending.

Required future Edge Function secrets:

```text
EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false
EMAIL_MAX_CONTROLLED_BATCH_RECIPIENTS=5
EMAIL_BATCH_SEND_CONFIRMATION_PHRASE=SEND 5 TEST EMAILS
EMAIL_BATCH_SEND_DRY_RUN_REQUIRED=true
EMAIL_OWNER_TEST_REQUIRED=true
```

These values must not be placed in frontend code or browser-exposed environment variables.

Planned future statuses:

- batch_blocked
- batch_confirmation_required
- batch_queued
- batch_sent
- batch_failed
- batch_skipped
- batch_stopped

## v2.14 controlled batch implementation behind disabled flag

Project Atlas v2.14 adds the planned `email-delivery-sendgrid-controlled-batch` Edge Function and frontend gate integration, but real row-recipient delivery remains blocked unless the Supabase Edge Function secret `EMAIL_ALLOW_CONTROLLED_BATCH_SEND` is exactly `true`.

Default behavior:

- `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false` blocks before any SendGrid call.
- The frontend action is labeled "Check Controlled Batch Send Gate".
- The default blocked response reports planned recipients, sent, failed, blocked, skipped, safety flag status, and first error message.
- No normal production `sent_count` is incremented by a blocked gate check.
- No row-recipient emails are sent while the flag is disabled.

v2.14 adds nullable row-level batch log fields to `email_delivery_outputs`:

- batch_send_status
- batch_send_error_code
- batch_send_error_message
- batch_send_sent_at
- batch_send_provider_message_id
- batch_send_attempt_count

## v2.16 failed-row resend design

Project Atlas v2.16 documents a future failed-row resend path only. It does not implement resend sending.

The planned future Edge Function name is:

```text
email-delivery-sendgrid-resend-failed
```

Failed-row resend must:

- Resend only rows where `batch_send_status = 'batch_failed'`.
- Never resend rows where `batch_send_status = 'batch_sent'`.
- Require a safety flag and typed confirmation phrase.
- Limit resend rows to a maximum of 5.
- Send DOCX only.
- Block ZIP/PDF attachments.
- Block CC/BCC.
- Log resend-specific fields such as `resend_attempt_count`, `resend_status`, `resend_error_message`, and `resend_sent_at`.

Detailed design:

```text
docs/failed-row-resend-v216.md
```

## Recommended rollout phases

1. Architecture and documentation only
2. Secure server-side send endpoint with logging
3. Manual confirmation and single-recipient delivery
4. Batch delivery with status tracking
5. Optional retry, audit reports, and resend support

## Summary

Project Atlas v2.5 keeps the existing manual email preparation experience intact while clearly defining a safe future path for real email delivery through Supabase Edge Functions and a trusted email provider.
