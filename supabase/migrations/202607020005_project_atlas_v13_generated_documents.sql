-- Project Atlas v1.3 single DOCX output persistence for AR-CERT-PRO.
-- Stores one generated DOCX output at a time. No PDF, batch jobs, ZIP export, or background workers.

insert into storage.buckets (id, name, public)
values ('certificate-outputs', 'certificate-outputs', false)
on conflict (id) do update
  set public = false;

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  template_id uuid not null references public.templates(id) on delete cascade,
  upload_id uuid not null references public.uploads(id) on delete cascade,
  generation_draft_id uuid not null references public.generation_drafts(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  storage_bucket text not null default 'certificate-outputs',
  storage_path text not null,
  document_type text not null default 'docx' check (document_type in ('docx')),
  status text not null default 'ready' check (status in ('ready', 'failed')),
  preview_row_index int,
  merge_data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_generated_documents_organization_id
  on public.generated_documents(organization_id);

create index if not exists idx_generated_documents_product_id
  on public.generated_documents(product_id);

create index if not exists idx_generated_documents_draft_id
  on public.generated_documents(generation_draft_id);

create index if not exists idx_generated_documents_created_by
  on public.generated_documents(created_by);

drop trigger if exists set_generated_documents_updated_at on public.generated_documents;
create trigger set_generated_documents_updated_at
before update on public.generated_documents
for each row execute function public.set_updated_at();

alter table public.generated_documents enable row level security;

drop policy if exists "Members can read generated documents" on public.generated_documents;
create policy "Members can read generated documents"
on public.generated_documents for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can insert generated documents" on public.generated_documents;
create policy "Members can insert generated documents"
on public.generated_documents for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and created_by = auth.uid()
);

drop policy if exists "Creators and admins can update generated documents" on public.generated_documents;
create policy "Creators and admins can update generated documents"
on public.generated_documents for update
to authenticated
using (
  (created_by = auth.uid() and public.is_org_member(organization_id))
  or public.has_org_role(organization_id, array['owner', 'admin'])
)
with check (
  (created_by = auth.uid() and public.is_org_member(organization_id))
  or public.has_org_role(organization_id, array['owner', 'admin'])
);

drop policy if exists "Owners can delete generated documents" on public.generated_documents;
create policy "Owners can delete generated documents"
on public.generated_documents for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Members can read certificate outputs" on storage.objects;
create policy "Members can read certificate outputs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'certificate-outputs'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Members can upload certificate outputs" on storage.objects;
create policy "Members can upload certificate outputs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'certificate-outputs'
  and public.is_org_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "Owners can delete certificate outputs" on storage.objects;
create policy "Owners can delete certificate outputs"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'certificate-outputs'
  and public.has_org_role(((storage.foldername(name))[1])::uuid, array['owner', 'admin'])
);
