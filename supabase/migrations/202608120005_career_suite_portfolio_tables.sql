-- Project Atlas Database Migration
-- Career Suite — Phase 9: Career Portfolio Tables & Public/Private RLS Security

-- 1. Portfolio Projects Table
create table if not exists public.career_portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  short_description text not null default '',
  detailed_description text default '',
  project_type text not null default 'Full Stack App' check (project_type in ('Full Stack App', 'Frontend UI', 'Backend API', 'Automation Tool', 'Open Source', 'System Architecture', 'Case Study')),
  role text default 'Lead Developer',
  technologies jsonb not null default '[]'::jsonb,
  start_date text default '',
  end_date text default '',
  currently_active boolean not null default false,
  project_url text default '',
  repository_url text default '',
  image_url text default '',
  achievements text default '',
  featured boolean not null default false,
  is_public boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Public Profiles & Publishing Settings Table
create table if not exists public.career_public_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique,
  is_published boolean not null default false,
  headline text default '',
  bio text default '',
  location text default '',
  custom_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_career_portfolio_projects_user_id on public.career_portfolio_projects(user_id);
create index if not exists idx_career_portfolio_projects_featured on public.career_portfolio_projects(featured);
create index if not exists idx_career_public_profiles_slug on public.career_public_profiles(slug);
create index if not exists idx_career_public_profiles_user_id on public.career_public_profiles(user_id);

-- Triggers for updated_at timestamps
drop trigger if exists set_career_portfolio_projects_updated_at on public.career_portfolio_projects;
create trigger set_career_portfolio_projects_updated_at
before update on public.career_portfolio_projects
for each row execute function public.set_updated_at();

drop trigger if exists set_career_public_profiles_updated_at on public.career_public_profiles;
create trigger set_career_public_profiles_updated_at
before update on public.career_public_profiles
for each row execute function public.set_updated_at();

-- Row Level Security (RLS) Enablement
alter table public.career_portfolio_projects enable row level security;
alter table public.career_public_profiles enable row level security;

-- Policies for career_portfolio_projects
-- 1. Owners have full SELECT, INSERT, UPDATE, DELETE access
drop policy if exists "Users can view own portfolio projects" on public.career_portfolio_projects;
create policy "Users can view own portfolio projects"
on public.career_portfolio_projects for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own portfolio projects" on public.career_portfolio_projects;
create policy "Users can insert own portfolio projects"
on public.career_portfolio_projects for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own portfolio projects" on public.career_portfolio_projects;
create policy "Users can update own portfolio projects"
on public.career_portfolio_projects for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own portfolio projects" on public.career_portfolio_projects;
create policy "Users can delete own portfolio projects"
on public.career_portfolio_projects for delete
to authenticated
using (user_id = auth.uid());

-- 2. Public read access to published projects (ONLY when user has an active published public profile)
drop policy if exists "Anyone can view explicitly public projects of published profiles" on public.career_portfolio_projects;
create policy "Anyone can view explicitly public projects of published profiles"
on public.career_portfolio_projects for select
to anon, authenticated
using (
  is_public = true and user_id in (
    select user_id from public.career_public_profiles where is_published = true
  )
);

-- Policies for career_public_profiles
-- 1. Owners have full management
drop policy if exists "Users can view own public profile settings" on public.career_public_profiles;
create policy "Users can view own public profile settings"
on public.career_public_profiles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own public profile settings" on public.career_public_profiles;
create policy "Users can insert own public profile settings"
on public.career_public_profiles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own public profile settings" on public.career_public_profiles;
create policy "Users can update own public profile settings"
on public.career_public_profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own public profile settings" on public.career_public_profiles;
create policy "Users can delete own public profile settings"
on public.career_public_profiles for delete
to authenticated
using (user_id = auth.uid());

-- 2. Public can view ONLY if explicitly is_published = true
drop policy if exists "Anyone can view published public profiles" on public.career_public_profiles;
create policy "Anyone can view published public profiles"
on public.career_public_profiles for select
to anon, authenticated
using (is_published = true);
