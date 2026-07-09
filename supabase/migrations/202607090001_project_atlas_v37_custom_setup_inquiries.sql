-- Project Atlas v3.7 — Custom Setup Inquiries (public lead capture)
--
-- Standalone lead table for "Request Custom Setup" submissions from the public
-- site. Intentionally NOT foreign-keyed to products / product_categories: those
-- rows are organization-scoped and we do not want any cascade or coupling risk,
-- so the product reference is stored as plain text (product_id / product_name).
--
-- Security model:
--   * anon + authenticated may INSERT new leads only (status pinned to 'new').
--   * No SELECT / UPDATE / DELETE policies exist, so RLS denies all reads, edits,
--     and deletes to those roles. The service role (used by the v3.8 admin review
--     UI) bypasses RLS and can read/manage inquiries.

create extension if not exists pgcrypto;

create table if not exists public.custom_setup_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  organization_name text not null,
  role text,
  email text not null,
  phone_whatsapp text,
  product_id text,
  product_name text,
  product_interested text not null,
  document_needs text not null,
  approximate_monthly_documents text,
  message text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'setup_started', 'completed')),
  source text
);

create index if not exists idx_custom_setup_inquiries_status
  on public.custom_setup_inquiries(status);

create index if not exists idx_custom_setup_inquiries_created_at
  on public.custom_setup_inquiries(created_at desc);

-- Reuse the shared updated_at trigger function defined in the v0.4 core migration.
drop trigger if exists set_custom_setup_inquiries_updated_at on public.custom_setup_inquiries;
create trigger set_custom_setup_inquiries_updated_at
before update on public.custom_setup_inquiries
for each row execute function public.set_updated_at();

alter table public.custom_setup_inquiries enable row level security;

-- Public lead capture: anon + authenticated may INSERT new inquiries only.
-- WITH CHECK pins status to 'new' so a submission cannot arrive pre-marked as
-- contacted / setup_started / completed. No read/update/delete policy is defined,
-- so those actions are denied for anon/authenticated (service role bypasses RLS).
drop policy if exists "Anyone can submit a setup inquiry" on public.custom_setup_inquiries;
create policy "Anyone can submit a setup inquiry"
on public.custom_setup_inquiries for insert
to anon, authenticated
with check (status = 'new');
