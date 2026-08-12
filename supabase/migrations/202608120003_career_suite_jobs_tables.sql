-- Project Atlas Database Migration
-- Career Suite — Phase 7: Jobs & Opportunities Tables & RLS Security

-- 1. Career Jobs Table (User-discovered, saved, or manually entered job/internship opportunities)
create table if not exists public.career_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  company text not null,
  location text default 'Remote / Hybrid',
  work_type text not null default 'Full-time' check (work_type in ('Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance')),
  employment_type text not null default 'Remote' check (employment_type in ('Remote', 'On-site', 'Hybrid')),
  description text default '',
  skills jsonb not null default '[]'::jsonb,
  salary_range text default '',
  source text not null default 'Manual Entry',
  source_url text default '',
  deadline text default '',
  status text not null default 'active' check (status in ('active', 'archived', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Career Applications Table (Application lifecycle tracking referencing jobs and resumes)
create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.career_jobs(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  status text not null default 'saved' check (status in ('saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn')),
  applied_at timestamptz,
  deadline text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for fast lookup and relational integrity
create index if not exists idx_career_jobs_user_id on public.career_jobs(user_id);
create index if not exists idx_career_applications_user_id on public.career_applications(user_id);
create index if not exists idx_career_applications_job_id on public.career_applications(job_id);
create index if not exists idx_career_applications_resume_id on public.career_applications(resume_id);

-- Triggers for updated_at timestamps
drop trigger if exists set_career_jobs_updated_at on public.career_jobs;
create trigger set_career_jobs_updated_at
before update on public.career_jobs
for each row execute function public.set_updated_at();

drop trigger if exists set_career_applications_updated_at on public.career_applications;
create trigger set_career_applications_updated_at
before update on public.career_applications
for each row execute function public.set_updated_at();

-- Row Level Security (RLS) Enablement
alter table public.career_jobs enable row level security;
alter table public.career_applications enable row level security;

-- RLS Policies for career_jobs
drop policy if exists "Users can view own career jobs" on public.career_jobs;
create policy "Users can view own career jobs"
on public.career_jobs for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own career jobs" on public.career_jobs;
create policy "Users can insert own career jobs"
on public.career_jobs for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own career jobs" on public.career_jobs;
create policy "Users can update own career jobs"
on public.career_jobs for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own career jobs" on public.career_jobs;
create policy "Users can delete own career jobs"
on public.career_jobs for delete
to authenticated
using (user_id = auth.uid());

-- RLS Policies for career_applications
drop policy if exists "Users can view own career applications" on public.career_applications;
create policy "Users can view own career applications"
on public.career_applications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own career applications" on public.career_applications;
create policy "Users can insert own career applications"
on public.career_applications for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own career applications" on public.career_applications;
create policy "Users can update own career applications"
on public.career_applications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own career applications" on public.career_applications;
create policy "Users can delete own career applications"
on public.career_applications for delete
to authenticated
using (user_id = auth.uid());
