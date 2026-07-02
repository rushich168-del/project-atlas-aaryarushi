-- Optional seed script for Project Atlas v0.4.
-- Replace :organization_id with the target organization id before running.

with categories as (
  insert into public.product_categories (organization_id, name, slug, description, sector, sort_order)
  values
    (:organization_id, 'Education', 'education', 'Automation products for schools, colleges, training institutes, and academic teams.', 'education', 10),
    (:organization_id, 'HR', 'hr', 'Hiring, employee document, and people operations workflows for lean HR teams.', 'hr', 20),
    (:organization_id, 'Office / Business', 'office-business', 'Practical document, Excel, PDF, and reporting automation for daily office work.', 'office-business', 30)
  on conflict (organization_id, slug) do update
    set name = excluded.name,
        description = excluded.description,
        sector = excluded.sector,
        sort_order = excluded.sort_order
  returning id, slug
)
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
  (:organization_id, (select id from categories where slug = 'education'), 'AR-CERT-PRO', 'AR-CERT-PRO', 'ar-cert-pro', 'education', 'ready', 'Single DOCX certificate generation from Excel data and Word templates for the MVP demo.', 'Schools, colleges, training institutes, event teams', 'MVP-ready SaaS workflow for single DOCX generation and History.', '1.5', true, false, false, true, '["One DOCX at a time", "Stored History", "Browser workflow"]', '["Excel participant list", "Word certificate template", "Selected preview row"]', '["Generated DOCX", "Stored DOCX history", "Local fallback download"]', 10),
  (:organization_id, (select id from categories where slug = 'education'), 'AR-MARKSHEET-PRO', 'AR-MARKSHEET-PRO', 'ar-marksheet-pro', 'education', 'in_progress', 'Structured marksheet preparation with student records, grade calculations, and exports.', 'Schools, colleges, coaching centers', 'Core flow defined; template and grading variations need refinement.', '0.1', true, false, true, true, '["Grade logic", "Student records", "Template output"]', '["Student data", "Subject marks", "Grade rules"]', '["Marksheet documents", "PDF exports", "Class summaries"]', 20),
  (:organization_id, (select id from categories where slug = 'education'), 'AR-QUESTION-PRO', 'AR-QUESTION-PRO', 'ar-question-pro', 'education', 'planned', 'Question paper assembly support for reusable banks, formatting, and print-ready files.', 'Teachers, exam coordinators, training institutes', 'Planned module for later education suite expansion.', '0.1', true, false, true, true, '["Question bank", "Paper sets", "Print-ready"]', '["Question bank", "Chapter tags", "Exam pattern"]', '["Question papers", "Answer keys", "Print files"]', 30),
  (:organization_id, (select id from categories where slug = 'education'), 'AR-IDCARD-PRO', 'AR-IDCARD-PRO', 'ar-idcard-pro', 'education', 'in_progress', 'ID card generation for student and staff lists using approved layouts and photos.', 'Schools, colleges, offices, events', 'Design and photo mapping workflow in progress.', '0.1', true, false, true, true, '["Photo mapping", "Batch cards", "PDF sheets"]', '["Profile data", "Photos", "ID card template"]', '["ID card sheets", "Individual cards", "Print-ready PDFs"]', 40),
  (:organization_id, (select id from categories where slug = 'hr'), 'AR-RESUME-SCREEN', 'AR-RESUME-SCREEN', 'ar-resume-screen', 'hr', 'planned', 'Resume intake and shortlist tracking for recruitment teams handling repeated screening.', 'Recruiters, HR agencies, small hiring teams', 'Planned HR workflow for candidate pipeline review.', '0.1', false, true, true, true, '["Candidate lists", "Shortlist tags", "Review queue"]', '["Resume files", "Role criteria", "Candidate tracker"]', '["Shortlist views", "Screening notes", "Candidate status list"]', 50),
  (:organization_id, (select id from categories where slug = 'hr'), 'AR-JOINING-KIT', 'AR-JOINING-KIT', 'ar-joining-kit', 'hr', 'concept', 'Joining letters, forms, checklists, and employee document packets from one source.', 'HR teams, consultants, growing offices', 'Concept module for onboarding document automation.', '0.1', false, true, true, true, '["Offer docs", "Checklist", "Employee packet"]', '["Employee details", "Policy templates", "Joining checklist"]', '["Joining kit", "HR checklist", "Document packet"]', 60),
  (:organization_id, (select id from categories where slug = 'office-business'), 'AR-INVOICE-PRO', 'AR-INVOICE-PRO', 'ar-invoice-pro', 'office-business', 'ready', 'Invoice preparation and PDF export for small businesses using repeatable templates.', 'Small businesses, freelancers, consultants', 'Ready for lightweight invoice automation demos.', '0.2', true, false, false, true, '["Invoice PDFs", "Client data", "Payment records"]', '["Client data", "Line items", "Invoice template"]', '["Invoice PDFs", "Payment sheet", "Client copies"]', 70),
  (:organization_id, (select id from categories where slug = 'office-business'), 'AR-REPORT-PRO', 'AR-REPORT-PRO', 'ar-report-pro', 'office-business', 'in_progress', 'Recurring business reports assembled from Excel data, summaries, and branded templates.', 'Office teams, managers, consultants', 'In progress for repeat report pack generation.', '0.1', true, false, true, true, '["Excel inputs", "Report packs", "Executive summary"]', '["Excel reports", "Summary notes", "Report template"]', '["Business report", "PDF pack", "Summary page"]', 80),
  (:organization_id, (select id from categories where slug = 'office-business'), 'AR-MAIL-PRO', 'AR-MAIL-PRO', 'ar-mail-pro', 'office-business', 'planned', 'Mail merge and follow-up workflows for operational communication at scale.', 'Sales, operations, admin, event teams', 'Planned communication automation module.', '0.1', true, false, true, true, '["Mail merge", "Follow-ups", "Contact lists"]', '["Contact list", "Message template", "Follow-up rules"]', '["Prepared emails", "Follow-up list", "Delivery tracker"]', 90)
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
