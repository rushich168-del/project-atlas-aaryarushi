-- Project Atlas v2.0 batch DOCX generation history for AR-CERT-PRO.
-- Browser-side batch jobs only. No PDF, ZIP, background workers, or server-side generation.

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  generation_draft_id uuid references public.generation_drafts(id) on delete set null,
  template_id uuid references public.templates(id) on delete set null,
  upload_id uuid references public.uploads(id) on delete set null,
  status text not null default 'running' check (status in ('running', 'completed', 'completed_with_errors', 'failed')),
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

create index if not exists idx_generation_jobs_organization_id
  on public.generation_jobs(organization_id);

create index if not exists idx_generation_jobs_product_id
  on public.generation_jobs(product_id);

create index if not exists idx_generation_jobs_draft_id
  on public.generation_jobs(generation_draft_id);

create index if not exists idx_generation_jobs_created_by
  on public.generation_jobs(created_by);

create table if not exists public.generation_outputs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.generation_jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  generation_draft_id uuid references public.generation_drafts(id) on delete set null,
  row_index integer not null,
  display_name text,
  file_name text,
  storage_bucket text not null default 'certificate-outputs',
  storage_path text,
  status text not null check (status in ('generated', 'failed', 'upload_failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_generation_outputs_job_id
  on public.generation_outputs(job_id);

create index if not exists idx_generation_outputs_organization_id
  on public.generation_outputs(organization_id);

create index if not exists idx_generation_outputs_product_id
  on public.generation_outputs(product_id);

alter table public.generation_jobs enable row level security;
alter table public.generation_outputs enable row level security;

drop policy if exists "Members can read generation jobs" on public.generation_jobs;
create policy "Members can read generation jobs"
on public.generation_jobs for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can insert generation jobs" on public.generation_jobs;
create policy "Members can insert generation jobs"
on public.generation_jobs for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and created_by = auth.uid()
);

drop policy if exists "Creators and admins can update generation jobs" on public.generation_jobs;
create policy "Creators and admins can update generation jobs"
on public.generation_jobs for update
to authenticated
using (
  (created_by = auth.uid() and public.is_org_member(organization_id))
  or public.has_org_role(organization_id, array['owner', 'admin'])
)
with check (
  (created_by = auth.uid() and public.is_org_member(organization_id))
  or public.has_org_role(organization_id, array['owner', 'admin'])
);

drop policy if exists "Owners can delete generation jobs" on public.generation_jobs;
create policy "Owners can delete generation jobs"
on public.generation_jobs for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Members can read generation outputs" on public.generation_outputs;
create policy "Members can read generation outputs"
on public.generation_outputs for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can insert generation outputs" on public.generation_outputs;
create policy "Members can insert generation outputs"
on public.generation_outputs for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and exists (
    select 1
    from public.generation_jobs
    where generation_jobs.id = job_id
      and generation_jobs.organization_id = organization_id
      and (
        generation_jobs.created_by = auth.uid()
        or public.has_org_role(organization_id, array['owner', 'admin'])
      )
  )
);

drop policy if exists "Owners can delete generation outputs" on public.generation_outputs;
create policy "Owners can delete generation outputs"
on public.generation_outputs for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']));
