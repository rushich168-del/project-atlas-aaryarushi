-- Project Atlas v4.4 — backfill the missing AR-OFFER-LETTER-PRO catalog row.
--
-- WHY THIS MIGRATION EXISTS
--
-- AR-OFFER-LETTER-PRO shipped as an active shared-DOCX workspace product but was
-- never added to the catalog. It was therefore served only as a static-catalog
-- overlay (see mergeStaticProductPrepProducts in src/services/catalogService.js),
-- which carries no organization_id and no database product id. The workspace route
-- and copy resolved fine, but every upload calls ensureBaseUploadContext with
--   productId: workspace.product?.organizationId ? workspace.product.id : null
-- so productId was null and the upload failed with "No product is selected."
--
-- Same defect AR-WORKSHEET-PRO / AR-FEE-RECEIPT-PRO hit in v2.82
-- (202607060001_project_atlas_v282_seed_missing_products.sql). Same fix: give the
-- product a real catalog row for each existing organization.
--
--
-- WHY THE NEW-SIGNUP SEED FUNCTION IS NOT TOUCHED HERE
--
-- public.seed_project_atlas_catalog() runs only for newly created organizations
-- (via handle_new_user). Inspection of the LIVE function shows it is badly out of
-- date: it seeds only 9 products, places AR-IDCARD-PRO under 'education' and
-- AR-MAIL-PRO under 'office-business', still carries old demo/PDF/photo wording,
-- and is missing newer Atlas products including AR-WORKSHEET-PRO,
-- AR-FEE-RECEIPT-PRO, and AR-OFFER-LETTER-PRO.
--
-- Running `create or replace function` on it from this migration would mean
-- rewriting the whole body from a source of truth that does not currently exist in
-- one place — risking silent regressions to category placement, product wording,
-- and status for every product, for every future signup. That is a strictly larger
-- blast radius than the bug being fixed here.
--
-- Updating seed_project_atlas_catalog() is therefore DEFERRED to a separate catalog
-- reconciliation milestone, which must first reconcile the live function, the v0.6
-- seed migration, and src/data/products.js into one agreed catalog definition.
-- Until then, new organizations will not receive AR-OFFER-LETTER-PRO at signup and
-- will need this backfill (or that milestone) applied. Existing organizations are
-- fully fixed by this migration.
--
--
-- SCOPE
--
-- Read-only catalog data for exactly one product slug. No categories are created or
-- modified. No other product row is read or written. No templates, uploads,
-- generation, storage, RLS, admin, billing, delete logic, or email behaviour is
-- touched. AR-MAIL-PRO is unchanged and remains dry-run only.

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
  'AR-OFFER-LETTER-PRO',
  'AR-OFFER-LETTER-PRO',
  'ar-offer-letter-pro',
  'hr',
  'ready',
  'Prepare offer letters from Excel data and Word templates.',
  'HR teams, recruiters, admin offices, small businesses, consultants handling offer and appointment letters',
  'Shared DOCX workspace active for offer letter templates and candidate details Excel data.',
  '0.1',
  true,
  false,
  true,
  true,
  '["DOCX Output", "Excel to Offer Letters", "Product Workspace"]'::jsonb,
  '["Word offer letter template", "Excel candidate details data", "Candidate, role, joining, and salary field mapping"]'::jsonb,
  '["Generated DOCX offer letters", "History review", "Local fallback download"]'::jsonb,
  120
from public.organizations o
-- Inner join: an organization with no 'hr' category is skipped safely. This
-- migration never creates or edits a category.
join public.product_categories c
  on c.organization_id = o.id
 and c.slug = 'hr'
on conflict (organization_id, slug) do update
  set category_id = excluded.category_id,
      product_code = excluded.product_code,
      name = excluded.name,
      sector = excluded.sector,
      status = excluded.status,
      summary = excluded.summary,
      audience = excluded.audience,
      stage = excluded.stage,
      current_version = excluded.current_version,
      desktop_available = excluded.desktop_available,
      saas_available = excluded.saas_available,
      is_beta = excluded.is_beta,
      is_enabled = true,
      metrics = excluded.metrics,
      inputs = excluded.inputs,
      outputs = excluded.outputs,
      sort_order = excluded.sort_order;
