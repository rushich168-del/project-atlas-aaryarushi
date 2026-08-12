-- Project Atlas Database Migration
-- Career Suite — Phase 12B: Application Assistant Tables & RLS Security

-- 1. Career Application Assistant Table
create table if not exists public.career_application_assistant (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.career_applications(id) on delete cascade,
  job_analysis_id uuid references public.career_job_analysis(id) on delete set null,
  job_id uuid references public.career_jobs(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  application_strategy jsonb not null default '{}'::jsonb,
  bullet_suggestions jsonb not null default '[]'::jsonb,
  cover_letter text not null default '',
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'saved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for lookup
create index if not exists idx_career_application_assistant_user_id on public.career_application_assistant(user_id);
create index if not exists idx_career_application_assistant_job_id on public.career_application_assistant(job_id);
create index if not exists idx_career_application_assistant_app_id on public.career_application_assistant(application_id);

-- Triggers for updated_at timestamps
drop trigger if exists set_career_application_assistant_updated_at on public.career_application_assistant;
create trigger set_career_application_assistant_updated_at
before update on public.career_application_assistant
for each row execute function public.set_updated_at();

-- Row Level Security (RLS) Enablement
alter table public.career_application_assistant enable row level security;

-- Policies for career_application_assistant (Strict user isolation: only owning user can view, insert, update, delete)
drop policy if exists "Users can view own application assistant records" on public.career_application_assistant;
create policy "Users can view own application assistant records"
on public.career_application_assistant for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own application assistant records" on public.career_application_assistant;
create policy "Users can insert own application assistant records"
on public.career_application_assistant for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own application assistant records" on public.career_application_assistant;
create policy "Users can update own application assistant records"
on public.career_application_assistant for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own application assistant records" on public.career_application_assistant;
create policy "Users can delete own application assistant records"
on public.career_application_assistant for delete
to authenticated
using (user_id = auth.uid());
