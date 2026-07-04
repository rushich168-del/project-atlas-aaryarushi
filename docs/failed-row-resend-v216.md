# Project Atlas v2.16 - Failed Row Resend Safety Design

## Purpose

Project Atlas v2.16 is a design-only milestone for future failed-row resend.

This milestone does not implement a resend Edge Function, does not call SendGrid, and does not send any email.

## Future Function Name

The planned future Supabase Edge Function name is:

```text
email-delivery-sendgrid-resend-failed
```

## Resend Scope

Future resend must be limited to failed controlled-batch rows only.

Allowed:

- Rows where `batch_send_status = 'batch_failed'`

Blocked:

- Rows where `batch_send_status = 'batch_sent'`
- Rows where `batch_send_status = 'batch_queued'`
- Rows where `batch_send_status = 'batch_blocked'`
- Rows where `batch_send_status = 'batch_skipped'`
- Rows where no controlled batch attempt exists

Never resend successful rows.

## Safety Rules

Future failed-row resend must:

- Require authenticated user.
- Require job ownership or organization membership.
- Require the controlled batch safety flag.
- Require a typed confirmation phrase.
- Limit resend rows to a maximum of 5.
- Send only DOCX attachments.
- Block ZIP attachments.
- Block PDF attachments.
- Block CC and BCC.
- Download the row DOCX from Supabase Storage server-side.
- Revalidate each recipient before sending.
- Revalidate each attachment before sending.
- Never increment normal production `sent_count`.
- Keep resend logs separate from initial controlled batch logs.

## Planned Logging Fields

A future migration can add nullable resend fields to `email_delivery_outputs`:

- `resend_status`
- `resend_error_code`
- `resend_error_message`
- `resend_sent_at`
- `resend_provider_message_id`
- `resend_attempt_count`

`resend_attempt_count` should start at 0 and increment only when the resend function attempts a provider call for that row.

## Planned Statuses

Future resend statuses:

- `resend_blocked`
- `resend_confirmation_required`
- `resend_queued`
- `resend_sent`
- `resend_failed`
- `resend_skipped`

## Future Flow

1. Validate authenticated user.
2. Validate email prep job ownership or organization membership.
3. Load `email_delivery_outputs` for the job.
4. Select only rows where `batch_send_status = 'batch_failed'`.
5. Block if there are 0 failed rows.
6. Block if failed rows exceed 5.
7. Require safety flag.
8. Require exact confirmation phrase.
9. Revalidate each recipient.
10. Revalidate each DOCX storage path.
11. Download each DOCX from Supabase Storage.
12. Block non-DOCX, ZIP, PDF, empty, or over-limit attachments.
13. Send one email per failed row.
14. Update row-level resend logs.
15. Return a summary.

## UI Design Only

v2.16 adds only a disabled UI note:

```text
Failed Row Resend - Coming Soon
```

The note must not include a working button or any frontend service call.

## Non-Goals

- No resend Edge Function implementation.
- No resend service method.
- No SendGrid resend call.
- No real resend emails.
- No retry automation.
- No background sending.
- No Gmail or Outlook OAuth.
- No billing.

## Acceptance Summary

v2.16 is complete when the failed-row resend plan is documented and the UI clearly indicates resend is coming later, while all existing email flows remain unchanged.
