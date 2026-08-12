-- Project Atlas Database Migration
-- Career Suite — Phase 6: Resume & Applications Tables & RLS Security

-- 1. Resumes Master Table
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_role text,
  template_id text not null default 'modern_tech',
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  custom_headline text,
  custom_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Resume Sections Configuration Table
create table if not exists public.resume_sections (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  section_type text not null check (section_type in ('summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'custom')),
  title text not null,
  sort_order int not null default 0,
  is_enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for fast lookup
create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_resume_sections_resume_id on public.resume_sections(resume_id);
create index if not exists idx_resume_sections_user_id on public.resume_sections(user_id);

-- Triggers for updated_at
drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

drop trigger if exists set_resume_sections_updated_at on public.resume_sections;
create trigger set_resume_sections_updated_at
before update on public.resume_sections
for each row execute function public.set_updated_at();

-- Row Level Security (RLS) Enablement
alter table public.resumes enable row level security;
alter table public.resume_sections enable row level security;

-- RLS Policies for resumes
drop policy if exists "Users can view own resumes" on public.resumes;
create policy "Users can view own resumes"
on public.resumes for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own resumes" on public.resumes;
create policy "Users can insert own resumes"
on public.resumes for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own resumes" on public.resumes;
create policy "Users can update own resumes"
on public.resumes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own resumes" on public.resumes;
create policy "Users can delete own resumes"
on public.resumes for delete
to authenticated
using (user_id = auth.uid());

-- RLS Policies for resume_sections
drop policy if exists "Users can view own resume sections" on public.resume_sections;
create policy "Users can view own resume sections"
on public.resume_sections for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own resume sections" on public.resume_sections;
create policy "Users can insert own resume sections"
on public.resume_sections for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own resume sections" on public.resume_sections;
create policy "Users can update own resume sections"
on public.resume_sections for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own resume sections" on public.resume_sections;
create policy "Users can delete own resume sections"
on public.resume_sections for delete
to authenticated
using (user_id = auth.uid());
