-- Project Atlas v0.8 real file handling for AR-CERT-PRO.
-- Adds private storage buckets and metadata tables only.
-- No document generation, output bucket, generation jobs, billing, or admin panel.

insert into storage.buckets (id, name, public)
values
  ('certificate-templates', 'certificate-templates', false),
  ('certificate-inputs', 'certificate-inputs', false)
on conflict (id) do update
  set public = false;

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  storage_bucket text not null default 'certificate-templates',
  storage_path text not null,
  version int not null default 1,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  storage_bucket text not null default 'certificate-inputs',
  storage_path text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'parsed', 'failed')),
  detected_columns jsonb not null default '[]'::jsonb,
  row_count int,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_templates_organization_id
  on public.templates(organization_id);

create index if not exists idx_templates_product_id
  on public.templates(product_id);

create index if not exists idx_uploads_organization_id
  on public.uploads(organization_id);

create index if not exists idx_uploads_product_id
  on public.uploads(product_id);

drop trigger if exists set_templates_updated_at on public.templates;
create trigger set_templates_updated_at
before update on public.templates
for each row execute function public.set_updated_at();

alter table public.templates enable row level security;
alter table public.uploads enable row level security;

drop policy if exists "Members can read templates" on public.templates;
create policy "Members can read templates"
on public.templates for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can insert templates" on public.templates;
create policy "Members can insert templates"
on public.templates for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "Owners can update templates" on public.templates;
create policy "Owners can update templates"
on public.templates for update
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Owners can delete templates" on public.templates;
create policy "Owners can delete templates"
on public.templates for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Members can read uploads" on public.uploads;
create policy "Members can read uploads"
on public.uploads for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can insert uploads" on public.uploads;
create policy "Members can insert uploads"
on public.uploads for insert
to authenticated
with check (public.is_org_member(organization_id));

drop policy if exists "Owners can update uploads" on public.uploads;
create policy "Owners can update uploads"
on public.uploads for update
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Owners can delete uploads" on public.uploads;
create policy "Owners can delete uploads"
on public.uploads for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Members can read certificate templates" on storage.objects;
create policy "Members can read certificate templates"
on storage.objects for select
to authenticated
using (
  bucket_id = 'certificate-templates'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Members can upload certificate templates" on storage.objects;
create policy "Members can upload certificate templates"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'certificate-templates'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Owners can delete certificate templates" on storage.objects;
create policy "Owners can delete certificate templates"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'certificate-templates'
  and public.has_org_role(((storage.foldername(name))[1])::uuid, array['owner', 'admin'])
);

drop policy if exists "Members can read certificate inputs" on storage.objects;
create policy "Members can read certificate inputs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'certificate-inputs'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Members can upload certificate inputs" on storage.objects;
create policy "Members can upload certificate inputs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'certificate-inputs'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Owners can delete certificate inputs" on storage.objects;
create policy "Owners can delete certificate inputs"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'certificate-inputs'
  and public.has_org_role(((storage.foldername(name))[1])::uuid, array['owner', 'admin'])
);
