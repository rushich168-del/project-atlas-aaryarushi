-- Project Atlas v2.6 email delivery dry-run foundation.
-- This migration creates the tables needed for future email delivery planning.
-- It is intentionally dry-run focused and does not send any email.

create extension if not exists pgcrypto;

create table if not exists public.email_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid not null,
  generation_job_id uuid references public.generation_jobs(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'prepared', 'sending', 'sent', 'failed')),
  mode text not null default 'dry_run' check (mode in ('dry_run', 'live')),
  total_recipients integer default 0,
  prepared_count integer default 0,
  sent_count integer default 0,
  failed_count integer default 0,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists public.email_delivery_outputs (
  id uuid primary key default gen_random_uuid(),
  email_delivery_job_id uuid references public.email_delivery_jobs(id) on delete cascade,
  generation_output_id uuid references public.generation_outputs(id) on delete set null,
  row_number integer,
  recipient_email text,
  subject text,
  message text,
  status text not null default 'prepared' check (status in ('prepared', 'sent', 'failed')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz default now()
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

drop policy if exists "Users can read own email delivery jobs" on public.email_delivery_jobs;
create policy "Users can read own email delivery jobs"
on public.email_delivery_jobs for select
to authenticated
using (
  user_id = auth.uid()
  and (organization_id is null or public.is_org_member(organization_id))
);

drop policy if exists "Users can insert own email delivery jobs" on public.email_delivery_jobs;
create policy "Users can insert own email delivery jobs"
on public.email_delivery_jobs for insert
to authenticated
with check (
  user_id = auth.uid()
  and (organization_id is null or public.is_org_member(organization_id))
);

drop policy if exists "Users can update own email delivery jobs" on public.email_delivery_jobs;
create policy "Users can update own email delivery jobs"
on public.email_delivery_jobs for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own email delivery jobs" on public.email_delivery_jobs;
create policy "Users can delete own email delivery jobs"
on public.email_delivery_jobs for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read own email delivery outputs" on public.email_delivery_outputs;
create policy "Users can read own email delivery outputs"
on public.email_delivery_outputs for select
to authenticated
using (
  exists (
    select 1
    from public.email_delivery_jobs as jobs
    where jobs.id = email_delivery_job_id
      and jobs.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own email delivery outputs" on public.email_delivery_outputs;
create policy "Users can insert own email delivery outputs"
on public.email_delivery_outputs for insert
to authenticated
with check (
  exists (
    select 1
    from public.email_delivery_jobs as jobs
    where jobs.id = email_delivery_job_id
      and jobs.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own email delivery outputs" on public.email_delivery_outputs;
create policy "Users can update own email delivery outputs"
on public.email_delivery_outputs for update
to authenticated
using (
  exists (
    select 1
    from public.email_delivery_jobs as jobs
    where jobs.id = email_delivery_job_id
      and jobs.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.email_delivery_jobs as jobs
    where jobs.id = email_delivery_job_id
      and jobs.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own email delivery outputs" on public.email_delivery_outputs;
create policy "Users can delete own email delivery outputs"
on public.email_delivery_outputs for delete
to authenticated
using (
  exists (
    select 1
    from public.email_delivery_jobs as jobs
    where jobs.id = email_delivery_job_id
      and jobs.user_id = auth.uid()
  )
);
