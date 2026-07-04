# Project Atlas v2.13 - Controlled Real Batch Send Safety Design

## Purpose

Project Atlas v2.13 is a planning and UI/design milestone for future controlled real batch email sending.

This release does not implement real batch sending, does not call a controlled batch SendGrid path, and does not send real emails to row recipients.

## Current Safe Baseline

The current stable email delivery path is:

1. Save Email Prep.
2. Check Send Readiness.
3. Validate Sandbox Send through SendGrid sandbox mode.
4. Send exactly one owner/test real email to the configured owner/test address.

Row recipients do not receive real emails in v2.13.

## Future Edge Function Name

The planned future Edge Function name is:

```text
email-delivery-sendgrid-controlled-batch
```

This function must not be deployed as an active sender until a later implementation milestone explicitly enables it behind safety flags.

## Non-Goals For v2.13

- No real row-recipient sending.
- No controlled batch Edge Function implementation.
- No SendGrid controlled batch API calls.
- No production customer sending.
- No Gmail or Outlook OAuth.
- No billing.
- No ZIP email attachments.
- No PDF email attachments.
- No background sending.
- No auto-send.
- No retry system.

## Required Future Secrets

These values must live only in Supabase Edge Function secrets, never in frontend code:

```text
EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false
EMAIL_MAX_CONTROLLED_BATCH_RECIPIENTS=5
EMAIL_BATCH_SEND_CONFIRMATION_PHRASE=SEND 5 TEST EMAILS
EMAIL_BATCH_SEND_DRY_RUN_REQUIRED=true
EMAIL_OWNER_TEST_REQUIRED=true
```

`EMAIL_ALLOW_CONTROLLED_BATCH_SEND` must remain `false` by default. Setting it to `true` should be a deliberate operational step for a later controlled rollout.

## Batch Send Safety Rules

Future controlled real batch sending must follow these rules:

- Real batch sending is disabled by default.
- Sandbox validation success is required first.
- Owner/test email success is required first.
- Explicit final confirmation is required.
- The user must type the configured confirmation phrase.
- The first controlled batch limit is 5 recipients.
- Each DOCX attachment is limited to 10 MB.
- DOCX is the only allowed attachment type.
- ZIP attachments are blocked.
- PDF attachments are blocked until a later milestone.
- CC and BCC are blocked.
- Gmail and Outlook OAuth are not included yet.
- Billing is not included.
- Auto-send is blocked.
- Background sending without user action is blocked.
- Retry storms are blocked by bounded attempts and no automatic rapid retry.
- A stop switch must exist before any real controlled batch sending is enabled.

## Planned Database And Log Fields

v2.13 does not require a migration. A future migration can safely add nullable row-level fields to `email_delivery_outputs`:

- `batch_send_status`
- `batch_send_error_code`
- `batch_send_error_message`
- `batch_send_sent_at`
- `batch_send_provider_message_id`
- `batch_send_attempt_count`

Future job-level fields can be considered for `email_delivery_jobs`:

- `batch_send_status`
- `batch_send_started_at`
- `batch_send_completed_at`
- `batch_send_sent_count`
- `batch_send_failed_count`
- `batch_send_stopped_at`
- `batch_send_stop_reason`

These fields must stay separate from sandbox and owner/test fields. A controlled test batch must not be counted as normal production delivery.

## Future Statuses

Future row-level and job-level statuses:

- `batch_blocked`
- `batch_confirmation_required`
- `batch_queued`
- `batch_sent`
- `batch_failed`
- `batch_skipped`
- `batch_stopped`

## UI Design Only

v2.13 may show a disabled planning panel:

Title:

```text
Controlled Batch Send
```

Copy:

```text
Real batch sending is not enabled yet. This release only prepares the safety design.
```

Future button label:

```text
Confirm Controlled Batch Send
```

The v2.13 UI must not imply the feature is active. It must not expose a working real batch send button.

Do not use these labels:

- Send Emails
- Send Batch
- Production Send

## Future Confirmation Modal

Before any future controlled real batch send, the confirmation modal must show:

- Provider: SendGrid
- Mode: Controlled real batch
- Number of recipients
- Attachment type: DOCX only
- Total emails to be sent
- Warning that row recipients will receive real emails
- Confirmation phrase required

The modal must require the user to type the configured confirmation phrase before enabling the final action.

## Future Send Flow

The future `email-delivery-sendgrid-controlled-batch` function must:

1. Validate the authenticated user.
2. Validate job ownership or organization membership.
3. Confirm sandbox validation success.
4. Confirm owner/test email success.
5. Confirm `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=true`.
6. Confirm recipient count is less than or equal to the safety limit.
7. Confirm all row recipients are valid.
8. Confirm each DOCX exists in Supabase Storage.
9. Confirm each DOCX is under the size limit.
10. Confirm all attachments are DOCX only.
11. Send one email per recipient.
12. Update row-level logs after each send attempt.
13. Stop immediately on the global kill switch.
14. Return a clear summary.

## Error Handling

Future controlled batch sending must map provider and safety failures into clear error codes:

- `invalid_recipient`
- `attachment_missing`
- `attachment_too_large`
- `provider_401`
- `provider_403`
- `sender_not_verified`
- `rate_limited`
- `provider_temp_error`
- `stopped_by_user`
- `blocked_by_safety_limit`

Errors should be safe to display in the frontend and should not expose provider secrets, request tokens, or internal service role details.

## Stop Switch Requirements

A future stop switch must be checked before the batch begins and before each recipient send attempt.

The stop switch may be implemented as:

- An Edge Function secret or runtime configuration flag.
- A database field on `email_delivery_jobs`.
- Both, if operational control needs an application-level and environment-level block.

When the stop switch is active, the function must stop sending, mark remaining rows as `batch_stopped` or `batch_skipped`, and return a summary.

## Retry Policy

v2.13 does not implement retries.

Future retries must be bounded:

- No automatic rapid retry loop.
- No retry storm after provider throttling.
- Retry only provider-temporary failures.
- Never retry invalid recipient, missing attachment, oversized attachment, sender verification, or safety-limit blocks.
- Record every attempt count.

## Roadmap

- v2.13 - Controlled batch send safety design only.
- v2.14 - Controlled batch send implementation behind disabled flag.
- v2.15 - Controlled batch send to max 5 real recipients.
- v2.16 - Failed-row resend.
- v3.0 - Production email delivery.

## v2.14 Implementation Behind Disabled Flag

Project Atlas v2.14 adds the controlled batch Edge Function and frontend gate integration, but keeps real row-recipient sending blocked by default.

Function name:

```text
email-delivery-sendgrid-controlled-batch
```

Default safety behavior:

- `EMAIL_ALLOW_CONTROLLED_BATCH_SEND` must be exactly `true` before any row-recipient email can be sent.
- If the flag is absent, empty, or any value other than `true`, the function returns `batch_blocked`.
- The blocked result reports planned recipients, sent, failed, blocked, skipped, safety flag status, and first error message.
- The blocked result must not update `batch_send_sent_at`.
- The blocked result must not increment normal `sent_count`.
- Row recipients receive 0 real emails while the flag remains disabled.

v2.14 adds nullable row-level fields to `email_delivery_outputs`:

- `batch_send_status`
- `batch_send_error_code`
- `batch_send_error_message`
- `batch_send_sent_at`
- `batch_send_provider_message_id`
- `batch_send_attempt_count`

The frontend gate label is:

```text
Check Controlled Batch Send Gate
```

This is a safety gate check, not an active production sending control.

## Acceptance Summary

v2.13 is complete when the docs and UI clearly define the future controlled batch send plan while leaving real batch recipient sending unavailable.
