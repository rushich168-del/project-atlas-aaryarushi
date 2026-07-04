-- Project Atlas v2.14 controlled batch send logging fields.
-- Adds row-level batch send logs without enabling production/customer delivery.

alter table public.email_delivery_outputs
  add column if not exists batch_send_status text null,
  add column if not exists batch_send_error_code text null,
  add column if not exists batch_send_error_message text null,
  add column if not exists batch_send_sent_at timestamptz null,
  add column if not exists batch_send_provider_message_id text null,
  add column if not exists batch_send_attempt_count integer not null default 0;

alter table public.email_delivery_outputs
  drop constraint if exists email_delivery_outputs_batch_send_status_check;

alter table public.email_delivery_outputs
  add constraint email_delivery_outputs_batch_send_status_check
  check (
    batch_send_status is null
    or batch_send_status in (
      'batch_blocked',
      'batch_confirmation_required',
      'batch_queued',
      'batch_sent',
      'batch_failed',
      'batch_skipped',
      'batch_stopped'
    )
  );

alter table public.email_delivery_outputs
  drop constraint if exists email_delivery_outputs_batch_send_attempt_count_check;

alter table public.email_delivery_outputs
  add constraint email_delivery_outputs_batch_send_attempt_count_check
  check (batch_send_attempt_count >= 0);
