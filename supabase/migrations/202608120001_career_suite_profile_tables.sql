-- Project Atlas Database Migration
-- Career Suite — Phase 5: Career Profile Tables & RLS Security

-- 1. Career Identity Profile Table
create table if not exists public.career_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  headline text,
  summary text,
  location text,
  phone text,
  email text,
  target_role text,
  career_level text default 'Mid',
  target_roles jsonb not null default '[]'::jsonb,
  career_interests jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Education History Table
create table if not exists public.career_education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution text not null,
  degree text,
  field_of_study text,
  start_date text,
  end_date text,
  grade text,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Experience & Work History Table
create table if not exists public.career_experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  job_title text not null,
  start_date text,
  end_date text,
  currently_working boolean not null default false,
  description text,
  achievements text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Skills Matrix Table
create table if not exists public.career_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Technical',
  proficiency text not null default 'Intermediate',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for efficient querying by user_id
create index if not exists idx_career_education_user_id on public.career_education(user_id);
create index if not exists idx_career_experience_user_id on public.career_experience(user_id);
create index if not exists idx_career_skills_user_id on public.career_skills(user_id);

-- Updated_at triggers
drop trigger if exists set_career_profiles_updated_at on public.career_profiles;
create trigger set_career_profiles_updated_at
before update on public.career_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_career_education_updated_at on public.career_education;
create trigger set_career_education_updated_at
before update on public.career_education
for each row execute function public.set_updated_at();

drop trigger if exists set_career_experience_updated_at on public.career_experience;
create trigger set_career_experience_updated_at
before update on public.career_experience
for each row execute function public.set_updated_at();

drop trigger if exists set_career_skills_updated_at on public.career_skills;
create trigger set_career_skills_updated_at
before update on public.career_skills
for each row execute function public.set_updated_at();

-- Row Level Security (RLS) Enablement
alter table public.career_profiles enable row level security;
alter table public.career_education enable row level security;
alter table public.career_experience enable row level security;
alter table public.career_skills enable row level security;

-- RLS Policies for career_profiles
drop policy if exists "Users can view own career profile" on public.career_profiles;
create policy "Users can view own career profile"
on public.career_profiles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own career profile" on public.career_profiles;
create policy "Users can insert own career profile"
on public.career_profiles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own career profile" on public.career_profiles;
create policy "Users can update own career profile"
on public.career_profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own career profile" on public.career_profiles;
create policy "Users can delete own career profile"
on public.career_profiles for delete
to authenticated
using (user_id = auth.uid());

-- RLS Policies for career_education
drop policy if exists "Users can view own career education" on public.career_education;
create policy "Users can view own career education"
on public.career_education for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own career education" on public.career_education;
create policy "Users can insert own career education"
on public.career_education for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own career education" on public.career_education;
create policy "Users can update own career education"
on public.career_education for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own career education" on public.career_education;
create policy "Users can delete own career education"
on public.career_education for delete
to authenticated
using (user_id = auth.uid());

-- RLS Policies for career_experience
drop policy if exists "Users can view own career experience" on public.career_experience;
create policy "Users can view own career experience"
on public.career_experience for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own career experience" on public.career_experience;
create policy "Users can insert own career experience"
on public.career_experience for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own career experience" on public.career_experience;
create policy "Users can update own career experience"
on public.career_experience for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own career experience" on public.career_experience;
create policy "Users can delete own career experience"
on public.career_experience for delete
to authenticated
using (user_id = auth.uid());

-- RLS Policies for career_skills
drop policy if exists "Users can view own career skills" on public.career_skills;
create policy "Users can view own career skills"
on public.career_skills for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own career skills" on public.career_skills;
create policy "Users can insert own career skills"
on public.career_skills for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own career skills" on public.career_skills;
create policy "Users can update own career skills"
on public.career_skills for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own career skills" on public.career_skills;
create policy "Users can delete own career skills"
on public.career_skills for delete
to authenticated
using (user_id = auth.uid());
