create extension if not exists pgcrypto;

create table if not exists public.email_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null,
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_job_id uuid null,
  status text not null default 'draft',
  mode text not null default 'dry_run',
  total_recipients integer not null default 0,
  prepared_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,

  constraint email_delivery_jobs_mode_check
    check (mode in ('dry_run', 'live')),

  constraint email_delivery_jobs_status_check
    check (status in ('draft', 'prepared', 'ready', 'checking', 'sent', 'partial', 'failed', 'cancelled')),

  constraint email_delivery_jobs_counts_check
    check (
      total_recipients >= 0
      and prepared_count >= 0
      and sent_count >= 0
      and failed_count >= 0
    )
);

create table if not exists public.email_delivery_outputs (
  id uuid primary key default gen_random_uuid(),
  email_delivery_job_id uuid not null references public.email_delivery_jobs(id) on delete cascade,
  generation_output_id uuid null,
  row_number integer null,
  recipient_email text null,
  subject text null,
  message text null,
  status text not null default 'prepared',
  provider_message_id text null,
  error_message text null,
  sent_at timestamptz null,
  created_at timestamptz not null default now(),

  constraint email_delivery_outputs_status_check
    check (status in ('prepared', 'ready', 'sent', 'failed', 'skipped'))
);

create index if not exists idx_email_delivery_jobs_user_id
  on public.email_delivery_jobs(user_id);

create index if not exists idx_email_delivery_jobs_generation_job_id
  on public.email_delivery_jobs(generation_job_id);

create index if not exists idx_email_delivery_outputs_email_delivery_job_id
  on public.email_delivery_outputs(email_delivery_job_id);

create index if not exists idx_email_delivery_outputs_generation_output_id
  on public.email_delivery_outputs(generation_output_id);

alter table public.email_delivery_jobs enable row level security;
alter table public.email_delivery_outputs enable row level security;

grant select, insert, update, delete on public.email_delivery_jobs to authenticated;
grant select, insert, update, delete on public.email_delivery_outputs to authenticated;

drop policy if exists "Users can select their own email delivery jobs"
on public.email_delivery_jobs;

create policy "Users can select their own email delivery jobs"
on public.email_delivery_jobs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own email delivery jobs"
on public.email_delivery_jobs;

create policy "Users can insert their own email delivery jobs"
on public.email_delivery_jobs
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own email delivery jobs"
on public.email_delivery_jobs;

create policy "Users can update their own email delivery jobs"
on public.email_delivery_jobs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own email delivery jobs"
on public.email_delivery_jobs;

create policy "Users can delete their own email delivery jobs"
on public.email_delivery_jobs
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can select outputs from their own email delivery jobs"
on public.email_delivery_outputs;

create policy "Users can select outputs from their own email delivery jobs"
on public.email_delivery_outputs
for select
to authenticated
using (
  exists (
    select 1
    from public.email_delivery_jobs jobs
    where jobs.id = email_delivery_outputs.email_delivery_job_id
      and jobs.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can insert outputs into their own email delivery jobs"
on public.email_delivery_outputs;

create policy "Users can insert outputs into their own email delivery jobs"
on public.email_delivery_outputs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.email_delivery_jobs jobs
    where jobs.id = email_delivery_outputs.email_delivery_job_id
      and jobs.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update outputs from their own email delivery jobs"
on public.email_delivery_outputs;

create policy "Users can update outputs from their own email delivery jobs"
on public.email_delivery_outputs
for update
to authenticated
using (
  exists (
    select 1
    from public.email_delivery_jobs jobs
    where jobs.id = email_delivery_outputs.email_delivery_job_id
      and jobs.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.email_delivery_jobs jobs
    where jobs.id = email_delivery_outputs.email_delivery_job_id
      and jobs.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete outputs from their own email delivery jobs"
on public.email_delivery_outputs;

create policy "Users can delete outputs from their own email delivery jobs"
on public.email_delivery_outputs
for delete
to authenticated
using (
  exists (
    select 1
    from public.email_delivery_jobs jobs
    where jobs.id = email_delivery_outputs.email_delivery_job_id
      and jobs.user_id = (select auth.uid())
  )
);