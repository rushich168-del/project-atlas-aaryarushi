-- Project Atlas v3.8 — Admin access for Custom Setup Inquiries
--
-- Adds a small global admin allowlist (app_admin_users) and admin-only RLS
-- policies so approved admins can read and update lead inquiries. There is NO
-- public/anon read, no broad authenticated read, and no delete policy anywhere.
--
-- Design notes:
--   * app_admin_users has RLS enabled with NO policies, so anon/authenticated
--     cannot read or write it at all. Only the service role (Supabase SQL editor)
--     and the SECURITY DEFINER helper below can touch it.
--   * is_app_admin() is SECURITY DEFINER, so it can check the locked allowlist and
--     return only a boolean to the client. The client never reads admin rows.
--   * custom_setup_inquiries (created in v3.7) keeps its anon INSERT policy. We add
--     admin-only SELECT and UPDATE. RLS cannot restrict UPDATE to specific columns,
--     so a BEFORE UPDATE trigger (below) rejects changes to every lead-data column
--     and allows only `status` (plus the DB-managed `updated_at`) to change. The
--     frontend also limits the payload to `status`; the trigger is the real guard.

create extension if not exists pgcrypto;

-- Global admin allowlist (independent of organization membership).
create table if not exists public.app_admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  role text not null default 'admin' check (role in ('admin', 'owner')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.app_admin_users enable row level security;
-- Intentionally no policies: anon/authenticated get no access. The service role
-- (SQL editor) bypasses RLS to manage admins; is_app_admin() reads it via SECURITY DEFINER.

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admin_users
    where user_id = auth.uid()
      and active = true
  );
$$;

-- Lock down execution: functions are granted to PUBLIC by default. Revoke that
-- blanket grant (which would let anon call it too) and grant EXECUTE only to
-- authenticated. is_app_admin() returns just a boolean and never exposes rows.
revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

-- Admin-only SELECT on inquiries (no anon, no broad authenticated read).
drop policy if exists "Admins can read setup inquiries" on public.custom_setup_inquiries;
create policy "Admins can read setup inquiries"
on public.custom_setup_inquiries for select
to authenticated
using (public.is_app_admin());

-- Admin-only UPDATE on inquiries, restricted to the four allowed status values.
-- (Column-level restriction is enforced by the BEFORE UPDATE trigger below.)
drop policy if exists "Admins can update setup inquiries" on public.custom_setup_inquiries;
create policy "Admins can update setup inquiries"
on public.custom_setup_inquiries for update
to authenticated
using (public.is_app_admin())
with check (
  public.is_app_admin()
  and status in ('new', 'contacted', 'setup_started', 'completed')
);

-- Column-level UPDATE guard (defense in depth beyond RLS).
--
-- RLS controls WHO may update and constrains the FINAL status value, but it
-- cannot stop an authenticated admin from also rewriting lead-data columns
-- (name, email, message, ...). This BEFORE UPDATE trigger enforces that an
-- UPDATE may change ONLY `status`; the DB-managed `updated_at` is also allowed
-- (it is bumped by set_custom_setup_inquiries_updated_at). Any change to id,
-- created_at, or any lead-data column is rejected. It also re-checks that status
-- stays within the four allowed values, matching the column CHECK constraint.
--
-- SECURITY INVOKER (the default): the function inspects only NEW/OLD and touches
-- no tables, so it needs no elevated privileges. search_path is pinned for lint
-- cleanliness and to avoid any name-resolution surprises.
create or replace function public.enforce_inquiry_status_only_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.created_at is distinct from old.created_at
     or new.name is distinct from old.name
     or new.organization_name is distinct from old.organization_name
     or new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.phone_whatsapp is distinct from old.phone_whatsapp
     or new.product_id is distinct from old.product_id
     or new.product_name is distinct from old.product_name
     or new.product_interested is distinct from old.product_interested
     or new.document_needs is distinct from old.document_needs
     or new.approximate_monthly_documents is distinct from old.approximate_monthly_documents
     or new.message is distinct from old.message
     or new.source is distinct from old.source
  then
    raise exception 'custom_setup_inquiries: only the status column may be updated'
      using errcode = 'check_violation';
  end if;

  if new.status is null
     or new.status not in ('new', 'contacted', 'setup_started', 'completed')
  then
    raise exception 'custom_setup_inquiries: invalid status %', new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- Fires before the shared updated_at trigger (name sorts first), so a rejected
-- edit never reaches the timestamp bump. The v3.7 updated_at trigger is left
-- untouched and keeps working.
drop trigger if exists enforce_custom_setup_inquiries_status_only on public.custom_setup_inquiries;
create trigger enforce_custom_setup_inquiries_status_only
before update on public.custom_setup_inquiries
for each row execute function public.enforce_inquiry_status_only_update();

-- No DELETE policy is defined, so no one (except the service role) can delete
-- inquiries. This is intentional — the dashboard never deletes leads.

-- =====================================================================
-- Adding the FIRST admin (run once AFTER deployment, in the Supabase SQL
-- Editor, which uses the service role and bypasses RLS). Replace the email:
--
--   insert into public.app_admin_users (user_id, email, role)
--   select id, email, 'owner'
--   from auth.users
--   where email = 'owner@aaryarushi.example'
--   on conflict (user_id) do update set active = true;
--
-- The user must have signed up / logged in at least once so a row exists in
-- auth.users. To revoke access later without deleting history:
--   update public.app_admin_users set active = false where email = '...';
-- =====================================================================
