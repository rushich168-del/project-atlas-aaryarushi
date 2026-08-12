-- Project Atlas Database Migration
-- Career Suite — Phase 12A: ATS / Job Match Analysis Tables & RLS Security

-- 1. Career Job Analysis Table (Stores deterministic ATS match calculations)
create table if not exists public.career_job_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.career_jobs(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  match_score int not null default 0 check (match_score >= 0 and match_score <= 100),
  skill_score int not null default 0 check (skill_score >= 0 and skill_score <= 100),
  experience_score int not null default 0 check (experience_score >= 0 and experience_score <= 100),
  keyword_score int not null default 0 check (keyword_score >= 0 and keyword_score <= 100),
  education_score int not null default 0 check (education_score >= 0 and education_score <= 100),
  matched_skills jsonb not null default '[]'::jsonb,
  missing_skills jsonb not null default '[]'::jsonb,
  matched_keywords jsonb not null default '[]'::jsonb,
  missing_keywords jsonb not null default '[]'::jsonb,
  recommended_resume_id text default '',
  recommendations jsonb not null default '[]'::jsonb,
  analysis_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_career_job_analysis_user_id on public.career_job_analysis(user_id);
create index if not exists idx_career_job_analysis_job_id on public.career_job_analysis(job_id);

-- Triggers for updated_at timestamps
drop trigger if exists set_career_job_analysis_updated_at on public.career_job_analysis;
create trigger set_career_job_analysis_updated_at
before update on public.career_job_analysis
for each row execute function public.set_updated_at();

-- Row Level Security (RLS) Enablement
alter table public.career_job_analysis enable row level security;

-- Policies for career_job_analysis (Strict user isolation: only owning user can view, insert, update, delete)
drop policy if exists "Users can view own job analysis" on public.career_job_analysis;
create policy "Users can view own job analysis"
on public.career_job_analysis for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own job analysis" on public.career_job_analysis;
create policy "Users can insert own job analysis"
on public.career_job_analysis for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own job analysis" on public.career_job_analysis;
create policy "Users can update own job analysis"
on public.career_job_analysis for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own job analysis" on public.career_job_analysis;
create policy "Users can delete own job analysis"
on public.career_job_analysis for delete
to authenticated
using (user_id = auth.uid());
