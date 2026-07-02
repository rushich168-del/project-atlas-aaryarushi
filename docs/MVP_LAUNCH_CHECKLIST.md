# Project Atlas MVP Launch Checklist

Use this checklist before the first MVP demo or launch.

## Environment

- [ ] `VITE_SUPABASE_URL` is set in the deployment environment.
- [ ] `VITE_SUPABASE_ANON_KEY` is set in the deployment environment.
- [ ] No Supabase service role key is present in frontend code or frontend environment variables.
- [ ] `npm run build` passes locally.

## Supabase

- [ ] Supabase migrations are applied.
- [ ] `certificate-templates`, `certificate-inputs`, and `certificate-outputs` buckets exist.
- [ ] Storage buckets are private.
- [ ] RLS is enabled on launch tables.
- [ ] Cross-organization record reads are blocked by RLS.
- [ ] Cross-organization storage downloads are blocked by storage policies.

## Demo Data

- [ ] Demo account is created and can sign in.
- [ ] Organization exists for the demo account.
- [ ] Catalog is seeded.
- [ ] AR-CERT-PRO product exists and is enabled.
- [ ] Demo DOCX template is under 5 MB.
- [ ] Demo Excel file is under 1 MB.
- [ ] Demo DOCX contains valid `{{placeholder_name}}` tokens.
- [ ] Demo Excel first sheet has clear headers and at least one data row.

## Smoke Test

- [ ] Sign in.
- [ ] Open the dashboard.
- [ ] Open the AR-CERT-PRO workspace.
- [ ] Upload the DOCX template.
- [ ] Upload the Excel file.
- [ ] Auto-map fields.
- [ ] Select and review a preview row.
- [ ] Save workspace.
- [ ] Generate DOCX.
- [ ] Download the generated DOCX.
- [ ] Open History.
- [ ] Re-download the stored DOCX from History.

## Route Refresh Check

- [ ] `/login`
- [ ] `/signup`
- [ ] `/dashboard`
- [ ] `/dashboard/products`
- [ ] `/dashboard/products/ar-cert-pro`
- [ ] `/dashboard/products/ar-cert-pro/workspace`
- [ ] `/dashboard/history`
