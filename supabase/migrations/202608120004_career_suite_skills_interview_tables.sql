-- Project Atlas Database Migration
-- Career Suite — Phase 8: Skills & Interview Prep Tables & RLS Security

-- 1. Role Skill Requirements (Reference taxonomy for target roles)
create table if not exists public.career_role_requirements (
  id uuid primary key default gen_random_uuid(),
  role_name text not null,
  skill_name text not null,
  category text not null default 'Technical',
  required_proficiency text not null default 'Intermediate' check (required_proficiency in ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  importance text not null default 'High' check (importance in ('Critical', 'High', 'Medium', 'Nice-to-have')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Career Roadmaps Table (User-specific learning roadmaps for target roles)
create table if not exists public.career_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null,
  title text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  target_date text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Career Roadmap Items Table (Sequential learning milestones)
create table if not exists public.career_roadmap_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null references public.career_roadmaps(id) on delete cascade,
  skill_name text not null,
  title text not null,
  description text default '',
  sequence int not null default 1,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  target_date text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Career Interview Practice Table (Questions and user practice sessions)
create table if not exists public.career_interview_practice (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_name text not null default 'General',
  category text not null default 'technical' check (category in ('technical', 'hr', 'behavioral', 'system_design')),
  question text not null,
  difficulty text not null default 'Medium' check (difficulty in ('Easy', 'Medium', 'Hard')),
  related_skill text default '',
  answer text default '',
  status text not null default 'practiced' check (status in ('practiced', 'needs_review', 'bookmarked')),
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_career_role_requirements_role on public.career_role_requirements(role_name);
create index if not exists idx_career_roadmaps_user_id on public.career_roadmaps(user_id);
create index if not exists idx_career_roadmap_items_user_id on public.career_roadmap_items(user_id);
create index if not exists idx_career_roadmap_items_roadmap_id on public.career_roadmap_items(roadmap_id);
create index if not exists idx_career_interview_practice_user_id on public.career_interview_practice(user_id);

-- Triggers for updated_at timestamps
drop trigger if exists set_career_role_req_updated_at on public.career_role_requirements;
create trigger set_career_role_req_updated_at
before update on public.career_role_requirements
for each row execute function public.set_updated_at();

drop trigger if exists set_career_roadmaps_updated_at on public.career_roadmaps;
create trigger set_career_roadmaps_updated_at
before update on public.career_roadmaps
for each row execute function public.set_updated_at();

drop trigger if exists set_career_roadmap_items_updated_at on public.career_roadmap_items;
create trigger set_career_roadmap_items_updated_at
before update on public.career_roadmap_items
for each row execute function public.set_updated_at();

drop trigger if exists set_career_interview_practice_updated_at on public.career_interview_practice;
create trigger set_career_interview_practice_updated_at
before update on public.career_interview_practice
for each row execute function public.set_updated_at();

-- Row Level Security (RLS) Enablement
alter table public.career_role_requirements enable row level security;
alter table public.career_roadmaps enable row level security;
alter table public.career_roadmap_items enable row level security;
alter table public.career_interview_practice enable row level security;

-- Policies for career_role_requirements (Read-only for authenticated users)
drop policy if exists "Authenticated users can view role requirements" on public.career_role_requirements;
create policy "Authenticated users can view role requirements"
on public.career_role_requirements for select
to authenticated
using (true);

-- Policies for career_roadmaps
drop policy if exists "Users can view own roadmaps" on public.career_roadmaps;
create policy "Users can view own roadmaps"
on public.career_roadmaps for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own roadmaps" on public.career_roadmaps;
create policy "Users can insert own roadmaps"
on public.career_roadmaps for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own roadmaps" on public.career_roadmaps;
create policy "Users can update own roadmaps"
on public.career_roadmaps for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own roadmaps" on public.career_roadmaps;
create policy "Users can delete own roadmaps"
on public.career_roadmaps for delete
to authenticated
using (user_id = auth.uid());

-- Policies for career_roadmap_items
drop policy if exists "Users can view own roadmap items" on public.career_roadmap_items;
create policy "Users can view own roadmap items"
on public.career_roadmap_items for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own roadmap items" on public.career_roadmap_items;
create policy "Users can insert own roadmap items"
on public.career_roadmap_items for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own roadmap items" on public.career_roadmap_items;
create policy "Users can update own roadmap items"
on public.career_roadmap_items for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own roadmap items" on public.career_roadmap_items;
create policy "Users can delete own roadmap items"
on public.career_roadmap_items for delete
to authenticated
using (user_id = auth.uid());

-- Policies for career_interview_practice
drop policy if exists "Users can view own interview practice" on public.career_interview_practice;
create policy "Users can view own interview practice"
on public.career_interview_practice for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own interview practice" on public.career_interview_practice;
create policy "Users can insert own interview practice"
on public.career_interview_practice for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own interview practice" on public.career_interview_practice;
create policy "Users can update own interview practice"
on public.career_interview_practice for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own interview practice" on public.career_interview_practice;
create policy "Users can delete own interview practice"
on public.career_interview_practice for delete
to authenticated
using (user_id = auth.uid());
