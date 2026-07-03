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

A future implementation will likely require environment variables such as:

- EMAIL_PROVIDER_API_KEY
- EMAIL_PROVIDER_FROM_ADDRESS
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (stored only on the server-side edge function environment)
- EMAIL_PROVIDER_BASE_URL or equivalent provider settings
- Optional retry and rate-limit configuration values

Frontend code should never contain these values.

## Recommended rollout phases

1. Architecture and documentation only
2. Secure server-side send endpoint with logging
3. Manual confirmation and single-recipient delivery
4. Batch delivery with status tracking
5. Optional retry, audit reports, and resend support

## Summary

Project Atlas v2.5 keeps the existing manual email preparation experience intact while clearly defining a safe future path for real email delivery through Supabase Edge Functions and a trusted email provider.
