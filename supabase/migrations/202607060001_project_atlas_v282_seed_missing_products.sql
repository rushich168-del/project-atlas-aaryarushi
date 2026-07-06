-- Project Atlas v2.82 — backfill missing workspace products
--
-- AR-WORKSHEET-PRO and AR-FEE-RECEIPT-PRO shipped as active shared-DOCX workspace
-- products but were never added to the catalog seed. As a result they were served
-- from the static fallback only (no organization_id / no database product id), so
-- their uploads failed with "No product is selected" while the seeded products
-- (AR-CERT-PRO, AR-MARKSHEET-PRO, AR-INVOICE-PRO, ...) worked.
--
-- This migration backfills both products for EVERY existing organization that has
-- the 'education' category, idempotently (on conflict do update). New signups get
-- them through the updated seed_project_atlas_catalog() function. Read-only catalog
-- data only — no templates, uploads, generation, storage, billing, or delete logic
-- is touched.

insert into public.products (
  organization_id,
  category_id,
  product_code,
  name,
  slug,
  sector,
  status,
  summary,
  audience,
  stage,
  current_version,
  desktop_available,
  saas_available,
  is_beta,
  is_enabled,
  metrics,
  inputs,
  outputs,
  sort_order
)
select
  o.id,
  c.id,
  v.product_code,
  v.name,
  v.slug,
  'education',
  v.status,
  v.summary,
  v.audience,
  v.stage,
  '0.1',
  true,
  false,
  true,
  true,
  v.metrics,
  v.inputs,
  v.outputs,
  v.sort_order
from public.organizations o
join public.product_categories c
  on c.organization_id = o.id and c.slug = 'education'
cross join (
  values
    (
      'AR-WORKSHEET-PRO', 'AR-WORKSHEET-PRO', 'ar-worksheet-pro', 'ready',
      'Worksheet builder that fills a Word layout automatically from a structured Excel content sheet.',
      'Teachers, schools, coaching centers, training institutes',
      'Shared DOCX workspace active for worksheet layout templates and worksheet content Excel data.',
      '["Worksheet builder", "Structured content", "DOCX output"]'::jsonb,
      '["Worksheet layout template", "Worksheet content Excel", "Field mapping"]'::jsonb,
      '["Generated worksheet DOCX", "History review", "Local fallback download"]'::jsonb,
      100
    ),
    (
      'AR-FEE-RECEIPT-PRO', 'AR-FEE-RECEIPT-PRO', 'ar-fee-receipt-pro', 'ready',
      'Fee receipt generation from a Word template and student/payment Excel data.',
      'Schools, colleges, coaching centers, admin offices, accounts teams',
      'Shared DOCX workspace active for fee receipt templates and student/payment Excel data.',
      '["DOCX Output", "Excel to Fee Receipts", "Product Workspace"]'::jsonb,
      '["Word fee receipt template", "Excel fee/student data", "Receipt field mapping"]'::jsonb,
      '["Generated DOCX fee receipts", "History review", "Local fallback download"]'::jsonb,
      110
    )
) as v(product_code, name, slug, status, summary, audience, stage, metrics, inputs, outputs, sort_order)
on conflict (organization_id, slug) do update
  set category_id = excluded.category_id,
      product_code = excluded.product_code,
      name = excluded.name,
      sector = excluded.sector,
      status = excluded.status,
      summary = excluded.summary,
      audience = excluded.audience,
      stage = excluded.stage,
      is_enabled = true,
      metrics = excluded.metrics,
      inputs = excluded.inputs,
      outputs = excluded.outputs,
      sort_order = excluded.sort_order;
