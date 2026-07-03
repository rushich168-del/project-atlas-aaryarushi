-- Project Atlas v2.11 SendGrid sandbox validation logging.
-- Expands dry-run email tables for sandbox-only provider validation.

alter table public.email_delivery_outputs
  add column if not exists error_code text null,
  add column if not exists provider text null,
  add column if not exists provider_mode text null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.email_delivery_outputs
  drop constraint if exists email_delivery_outputs_status_check;

alter table public.email_delivery_outputs
  add constraint email_delivery_outputs_status_check
  check (status in (
    'prepared',
    'ready',
    'sent',
    'failed',
    'skipped',
    'sandbox_queued',
    'sandbox_validated',
    'sandbox_failed',
    'blocked'
  ));

alter table public.email_delivery_jobs
  drop constraint if exists email_delivery_jobs_status_check;

alter table public.email_delivery_jobs
  add constraint email_delivery_jobs_status_check
  check (status in (
    'draft',
    'prepared',
    'ready',
    'checking',
    'sent',
    'partial',
    'failed',
    'cancelled',
    'readiness_checked',
    'confirmation_required',
    'sandbox_queued',
    'sandbox_validated',
    'sandbox_failed',
    'blocked'
  ));

drop trigger if exists set_email_delivery_outputs_updated_at on public.email_delivery_outputs;
create trigger set_email_delivery_outputs_updated_at
before update on public.email_delivery_outputs
for each row execute function public.set_updated_at();
