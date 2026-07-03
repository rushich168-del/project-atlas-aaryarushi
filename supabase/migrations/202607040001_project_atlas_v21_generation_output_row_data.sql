-- Project Atlas v2.9.1 preserve row-level Excel data for email preparation.

alter table public.generation_outputs
  add column if not exists row_data jsonb null;

comment on column public.generation_outputs.row_data is 'Raw Excel row values used to generate the output for later email preparation and history reuse.';
