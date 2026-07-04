-- Project Atlas v2.17 failed-row resend logging fields.
-- Adds resend-specific row logs without enabling resend by default.

alter table public.email_delivery_outputs
  add column if not exists resend_status text null,
  add column if not exists resend_error_code text null,
  add column if not exists resend_error_message text null,
  add column if not exists resend_sent_at timestamptz null,
  add column if not exists resend_provider_message_id text null,
  add column if not exists resend_attempt_count integer not null default 0;

alter table public.email_delivery_outputs
  drop constraint if exists email_delivery_outputs_resend_status_check;

alter table public.email_delivery_outputs
  add constraint email_delivery_outputs_resend_status_check
  check (
    resend_status is null
    or resend_status in (
      'resend_blocked',
      'resend_confirmation_required',
      'resend_queued',
      'resend_sent',
      'resend_failed',
      'resend_skipped'
    )
  );

alter table public.email_delivery_outputs
  drop constraint if exists email_delivery_outputs_resend_attempt_count_check;

alter table public.email_delivery_outputs
  add constraint email_delivery_outputs_resend_attempt_count_check
  check (resend_attempt_count >= 0);
