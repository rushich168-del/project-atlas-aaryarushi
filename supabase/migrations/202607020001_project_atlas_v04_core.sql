-- Project Atlas Database v0.4
-- Core multi-tenant SaaS foundation only.
-- Intentionally excludes templates, uploads, generation jobs, documents, billing, and admin panels.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sector text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.product_categories(id) on delete set null,
  product_code text not null,
  name text not null,
  slug text not null,
  sector text not null,
  status text not null default 'planned' check (status in ('ready', 'in_progress', 'planned', 'concept')),
  summary text,
  audience text,
  stage text,
  current_version text not null default '0.1',
  desktop_available boolean not null default true,
  saas_available boolean not null default false,
  is_beta boolean not null default true,
  is_enabled boolean not null default true,
  metrics jsonb not null default '[]'::jsonb,
  inputs jsonb not null default '[]'::jsonb,
  outputs jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, product_code),
  unique (organization_id, slug)
);

create index if not exists idx_organization_members_user_id
  on public.organization_members(user_id);

create index if not exists idx_product_categories_organization_id
  on public.product_categories(organization_id);

create index if not exists idx_products_organization_id
  on public.products(organization_id);

create index if not exists idx_products_category_id
  on public.products(category_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists set_product_categories_updated_at on public.product_categories;
create trigger set_product_categories_updated_at
before update on public.product_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Members can read organizations" on public.organizations;
create policy "Members can read organizations"
on public.organizations for select
to authenticated
using (public.is_org_member(id));

drop policy if exists "Owners can update organizations" on public.organizations;
create policy "Owners can update organizations"
on public.organizations for update
to authenticated
using (public.has_org_role(id, array['owner', 'admin']))
with check (public.has_org_role(id, array['owner', 'admin']));

drop policy if exists "Members can read organization members" on public.organization_members;
create policy "Members can read organization members"
on public.organization_members for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Owners can manage organization members" on public.organization_members;
create policy "Owners can manage organization members"
on public.organization_members for all
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Members can read product categories" on public.product_categories;
create policy "Members can read product categories"
on public.product_categories for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Owners can manage product categories" on public.product_categories;
create policy "Owners can manage product categories"
on public.product_categories for all
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

drop policy if exists "Members can read products" on public.products;
create policy "Members can read products"
on public.products for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Owners can manage products" on public.products;
create policy "Owners can manage products"
on public.products for all
to authenticated
using (public.has_org_role(organization_id, array['owner', 'admin']))
with check (public.has_org_role(organization_id, array['owner', 'admin']));

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, 'workspace')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_base text;
  org_slug text;
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);

  org_base := coalesce(nullif(new.raw_user_meta_data->>'organization_name', ''), 'Project Atlas Workspace');
  org_slug := public.slugify(org_base) || '-' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.organizations (name, slug, created_by)
  values (org_base, org_slug, new.id)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Seed-ready catalog example:
-- Insert categories/products after replacing :organization_id with a real organization id.
--
-- insert into public.product_categories (organization_id, name, slug, description, sector, sort_order)
-- values
--   (:organization_id, 'Education', 'education', 'Automation products for schools and academic teams.', 'education', 10),
--   (:organization_id, 'HR', 'hr', 'Hiring and people operations workflows.', 'hr', 20),
--   (:organization_id, 'Office / Business', 'office-business', 'Daily office, document, and reporting automation.', 'office-business', 30);
