-- Project Atlas v2.12 owner/test SendGrid delivery logging.
-- Keeps one-real-email owner tests separate from production/customer delivery counts.

alter table public.email_delivery_outputs
  add column if not exists owner_test_status text null,
  add column if not exists owner_test_error_code text null,
  add column if not exists owner_test_error_message text null,
  add column if not exists owner_test_sent_at timestamptz null,
  add column if not exists owner_test_provider_message_id text null;

alter table public.email_delivery_outputs
  drop constraint if exists email_delivery_outputs_owner_test_status_check;

alter table public.email_delivery_outputs
  add constraint email_delivery_outputs_owner_test_status_check
  check (
    owner_test_status is null
    or owner_test_status in (
      'owner_test_queued',
      'owner_test_sent',
      'owner_test_failed',
      'owner_test_blocked'
    )
  );

alter table public.email_delivery_jobs
  add column if not exists owner_test_status text null,
  add column if not exists owner_test_sent_count integer not null default 0,
  add column if not exists owner_test_failed_count integer not null default 0,
  add column if not exists owner_test_last_sent_at timestamptz null;

alter table public.email_delivery_jobs
  drop constraint if exists email_delivery_jobs_owner_test_status_check;

alter table public.email_delivery_jobs
  add constraint email_delivery_jobs_owner_test_status_check
  check (
    owner_test_status is null
    or owner_test_status in (
      'owner_test_queued',
      'owner_test_sent',
      'owner_test_failed',
      'owner_test_blocked'
    )
  );

alter table public.email_delivery_jobs
  drop constraint if exists email_delivery_jobs_owner_test_counts_check;

alter table public.email_delivery_jobs
  add constraint email_delivery_jobs_owner_test_counts_check
  check (
    owner_test_sent_count >= 0
    and owner_test_sent_count <= 1
    and owner_test_failed_count >= 0
  );
