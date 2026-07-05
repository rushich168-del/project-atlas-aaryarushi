# Project Atlas v2.53 AR-CERT-PRO Launch Readiness

Date: 2026-07-05

Launch product: AR-CERT-PRO

## Target Users

AR-CERT-PRO is prepared for schools, colleges, coaching centers, and training institutes that need to generate personalized certificates from existing Excel student data and Word certificate templates.

## Main Workflow

1. Upload Word certificate template.
2. Upload Excel student data.
3. Map template placeholders to spreadsheet columns.
4. Preview a generated certificate.
5. Generate a single DOCX or batch DOCX files.
6. Review generated files in History.
7. Use Email Prep dry-run/readiness checks only.

## Demo Script

1. Open Project Atlas and sign in.
2. Open the Product Dashboard.
3. Select AR-CERT-PRO / Start Demo.
4. Upload a DOCX certificate template.
5. Upload an Excel file with student data.
6. Map fields and confirm the preview.
7. Generate one DOCX certificate.
8. Generate a batch of DOCX certificates.
9. Open History and confirm generated files are listed.
10. Open Email Prep and run safe dry-run/readiness checks.

## Current Enabled Features

- Product catalog and dashboard launch labels.
- AR-CERT-PRO workspace.
- DOCX template upload.
- Excel data upload.
- Field mapping.
- Preview.
- Single DOCX generation.
- Batch DOCX generation.
- History listing and downloads.
- History scroll restoration.
- Email Prep dry-run/readiness path.

## Current Disabled Features

- PDF export is not available yet.
- Controlled real batch email sending remains disabled.
- Failed-row resend remains disabled.
- Gmail/Outlook OAuth is not included.
- Billing/payment is not included.

## Safety Status

- Email dry-run only.
- No real emails sent during this milestone.
- Controlled batch real send remains disabled.
- Failed-row resend remains disabled.
- No Supabase secrets changed or exposed.
- No Storage/DB delete logic changed.
- No `generatedDocumentsService.js` destructive delete changes.
- No stash apply/pop used.

## Manual Test Checklist

- Dashboard loads.
- AR-CERT-PRO product card looks launch-ready.
- AR-CERT-PRO workspace loads.
- Template upload works.
- Excel upload works.
- Preview works.
- Single DOCX generation works.
- Batch DOCX generation works.
- History loads.
- History scroll restoration still works.
- Email Prep dry-run remains safe.
- No real-send controls become enabled.
