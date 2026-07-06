-- Project Atlas Product Catalog v0.6
-- Read-only launch catalog seed function. No templates, uploads, generation, billing, or admin UI.

create or replace function public.seed_project_atlas_catalog(target_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.product_categories (organization_id, name, slug, description, sector, sort_order)
  values
    (target_organization_id, 'Education', 'education', 'Automation products for schools, colleges, training institutes, and academic teams.', 'education', 10),
    (target_organization_id, 'HR', 'hr', 'Hiring, employee document, and people operations workflows for lean HR teams.', 'hr', 20),
    (target_organization_id, 'Office / Business', 'office-business', 'Practical document, Excel, PDF, and reporting automation for daily office work.', 'office-business', 30)
  on conflict (organization_id, slug) do update
    set name = excluded.name,
        description = excluded.description,
        sector = excluded.sector,
        sort_order = excluded.sort_order;

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
  values
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'education'), 'AR-CERT-PRO', 'AR-CERT-PRO', 'ar-cert-pro', 'education', 'ready', 'Single DOCX certificate generation from Excel data and Word templates for the MVP demo.', 'Schools, colleges, training institutes, event teams', 'MVP-ready SaaS workflow for single DOCX generation and History.', '1.5', true, false, false, true, '["One DOCX at a time", "Stored History", "Browser workflow"]'::jsonb, '["Excel participant list", "Word certificate template", "Selected preview row"]'::jsonb, '["Generated DOCX", "Stored DOCX history", "Local fallback download"]'::jsonb, 10),
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'education'), 'AR-MARKSHEET-PRO', 'AR-MARKSHEET-PRO', 'ar-marksheet-pro', 'education', 'in_progress', 'Structured marksheet preparation with student records, grade calculations, and exports.', 'Schools, colleges, coaching centers', 'Core flow defined; template and grading variations need refinement.', '0.1', true, false, true, true, '["Grade logic", "Student records", "Template output"]'::jsonb, '["Student data", "Subject marks", "Grade rules"]'::jsonb, '["Marksheet documents", "PDF exports", "Class summaries"]'::jsonb, 20),
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'education'), 'AR-QUESTION-PRO', 'AR-QUESTION-PRO', 'ar-question-pro', 'education', 'planned', 'Question paper assembly support for reusable banks, formatting, and print-ready files.', 'Teachers, exam coordinators, training institutes', 'Planned module for later education suite expansion.', '0.1', true, false, true, true, '["Question bank", "Paper sets", "Print-ready"]'::jsonb, '["Question bank", "Chapter tags", "Exam pattern"]'::jsonb, '["Question papers", "Answer keys", "Print files"]'::jsonb, 30),
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'education'), 'AR-IDCARD-PRO', 'AR-IDCARD-PRO', 'ar-idcard-pro', 'education', 'in_progress', 'ID card generation for student and staff lists using approved layouts and photos.', 'Schools, colleges, offices, events', 'Design and photo mapping workflow in progress.', '0.1', true, false, true, true, '["Photo mapping", "Batch cards", "PDF sheets"]'::jsonb, '["Profile data", "Photos", "ID card template"]'::jsonb, '["ID card sheets", "Individual cards", "Print-ready PDFs"]'::jsonb, 40),
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'hr'), 'AR-RESUME-SCREEN', 'AR-RESUME-SCREEN', 'ar-resume-screen', 'hr', 'planned', 'Resume intake and shortlist tracking for recruitment teams handling repeated screening.', 'Recruiters, HR agencies, small hiring teams', 'Planned HR workflow for candidate pipeline review.', '0.1', false, true, true, true, '["Candidate lists", "Shortlist tags", "Review queue"]'::jsonb, '["Resume files", "Role criteria", "Candidate tracker"]'::jsonb, '["Shortlist views", "Screening notes", "Candidate status list"]'::jsonb, 50),
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'hr'), 'AR-JOINING-KIT', 'AR-JOINING-KIT', 'ar-joining-kit', 'hr', 'concept', 'Joining letters, forms, checklists, and employee document packets from one source.', 'HR teams, consultants, growing offices', 'Concept module for onboarding document automation.', '0.1', false, true, true, true, '["Offer docs", "Checklist", "Employee packet"]'::jsonb, '["Employee details", "Policy templates", "Joining checklist"]'::jsonb, '["Joining kit", "HR checklist", "Document packet"]'::jsonb, 60),
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'office-business'), 'AR-INVOICE-PRO', 'AR-INVOICE-PRO', 'ar-invoice-pro', 'office-business', 'ready', 'Invoice preparation and PDF export for small businesses using repeatable templates.', 'Small businesses, freelancers, consultants', 'Ready for lightweight invoice automation demos.', '0.2', true, false, false, true, '["Invoice PDFs", "Client data", "Payment records"]'::jsonb, '["Client data", "Line items", "Invoice template"]'::jsonb, '["Invoice PDFs", "Payment sheet", "Client copies"]'::jsonb, 70),
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'office-business'), 'AR-REPORT-PRO', 'AR-REPORT-PRO', 'ar-report-pro', 'office-business', 'in_progress', 'Recurring business reports assembled from Excel data, summaries, and branded templates.', 'Office teams, managers, consultants', 'In progress for repeat report pack generation.', '0.1', true, false, true, true, '["Excel inputs", "Report packs", "Executive summary"]'::jsonb, '["Excel reports", "Summary notes", "Report template"]'::jsonb, '["Business report", "PDF pack", "Summary page"]'::jsonb, 80),
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'office-business'), 'AR-MAIL-PRO', 'AR-MAIL-PRO', 'ar-mail-pro', 'office-business', 'planned', 'Mail merge and follow-up workflows for operational communication at scale.', 'Sales, operations, admin, event teams', 'Planned communication automation module.', '0.1', true, false, true, true, '["Mail merge", "Follow-ups", "Contact lists"]'::jsonb, '["Contact list", "Message template", "Follow-up rules"]'::jsonb, '["Prepared emails", "Follow-up list", "Delivery tracker"]'::jsonb, 90),
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'education'), 'AR-WORKSHEET-PRO', 'AR-WORKSHEET-PRO', 'ar-worksheet-pro', 'education', 'ready', 'Worksheet builder that fills a Word layout automatically from a structured Excel content sheet.', 'Teachers, schools, coaching centers, training institutes', 'Shared DOCX workspace active for worksheet layout templates and worksheet content Excel data.', '0.1', true, false, true, true, '["Worksheet builder", "Structured content", "DOCX output"]'::jsonb, '["Worksheet layout template", "Worksheet content Excel", "Field mapping"]'::jsonb, '["Generated worksheet DOCX", "History review", "Local fallback download"]'::jsonb, 100),
    (target_organization_id, (select id from public.product_categories where organization_id = target_organization_id and slug = 'education'), 'AR-FEE-RECEIPT-PRO', 'AR-FEE-RECEIPT-PRO', 'ar-fee-receipt-pro', 'education', 'ready', 'Fee receipt generation from a Word template and student/payment Excel data.', 'Schools, colleges, coaching centers, admin offices, accounts teams', 'Shared DOCX workspace active for fee receipt templates and student/payment Excel data.', '0.1', true, false, true, true, '["DOCX Output", "Excel to Fee Receipts", "Product Workspace"]'::jsonb, '["Word fee receipt template", "Excel fee/student data", "Receipt field mapping"]'::jsonb, '["Generated DOCX fee receipts", "History review", "Local fallback download"]'::jsonb, 110)
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
        is_enabled = excluded.is_enabled,
        metrics = excluded.metrics,
        inputs = excluded.inputs,
        outputs = excluded.outputs,
        sort_order = excluded.sort_order;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_base text;
  org_slug text;
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);

  org_base := coalesce(nullif(new.raw_user_meta_data->>'organization_name', ''), 'Project Atlas Workspace');
  org_slug := public.slugify(org_base) || '-' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.organizations (name, slug, created_by)
  values (org_base, org_slug, new.id)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  begin
    perform public.seed_project_atlas_catalog(new_org_id);
  exception when others then
    raise warning 'Project Atlas catalog seed failed for organization %: %', new_org_id, sqlerrm;
  end;

  return new;
end;
$$;
