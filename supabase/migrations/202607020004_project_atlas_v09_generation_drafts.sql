-- Project Atlas v0.9 field mapping and preview drafts.
-- Stores pre-generation workspace state only. No generation jobs or generated documents.

create table if not exists public.generation_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  template_id uuid references public.templates(id) on delete set null,
  upload_id uuid references public.uploads(id) on delete set null,
  field_mapping jsonb not null default '{}'::jsonb,
  preview_row_index int not null default 0,
  preview_data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_generation_drafts_organization_id
  on public.generation_drafts(organization_id);

create index if not exists idx_generation_drafts_product_id
  on public.generation_drafts(product_id);

create index if not exists idx_generation_drafts_created_by
  on public.generation_drafts(created_by);

drop trigger if exists set_generation_drafts_updated_at on public.generation_drafts;
create trigger set_generation_drafts_updated_at
before update on public.generation_drafts
for each row execute function public.set_updated_at();

alter table public.generation_drafts enable row level security;

drop policy if exists "Members can read generation drafts" on public.generation_drafts;
create policy "Members can read generation drafts"
on public.generation_drafts for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can insert generation drafts" on public.generation_drafts;
create policy "Members can insert generation drafts"
on public.generation_drafts for insert
to authenticated
with check (
  public.is_org_member(organization_id)
  and created_by = auth.uid()
);

drop policy if exists "Draft creators and admins can update generation drafts" on public.generation_drafts;
create policy "Draft creators and admins can update generation drafts"
on public.generation_drafts for update
to authenticated
using (
  (created_by = auth.uid() and public.is_org_member(organization_id))
  or public.has_org_role(organization_id, array['owner', 'admin'])
)
with check (
  (created_by = auth.uid() and public.is_org_member(organization_id))
  or public.has_org_role(organization_id, array['owner', 'admin'])
);

drop policy if exists "Owners can delete generation drafts" on public.generation_drafts;
create policy "Owners can delete generation drafts"
on public.generation_drafts for delete
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']));
