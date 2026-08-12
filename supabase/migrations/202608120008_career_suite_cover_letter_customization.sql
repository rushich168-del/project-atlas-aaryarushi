-- Project Atlas Database Migration
-- Career Suite — Phase 12C: Cover Letter Customization Schema Extension & RLS

-- 1. Extend career_application_assistant with tone, template, and customization metadata
alter table if exists public.career_application_assistant
  add column if not exists tone text not null default 'Executive',
  add column if not exists template text not null default 'Standard',
  add column if not exists word_count int not null default 0,
  add column if not exists character_count int not null default 0,
  add column if not exists customization_metadata jsonb not null default '{}'::jsonb;
