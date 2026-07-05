# Project Atlas v2.56 AR-IDCARD-PRO Launch Readiness

## Version

Project Atlas v2.56 AR-IDCARD-PRO Launch Readiness

## Product

AR-IDCARD-PRO

## Target Users

- Schools
- Colleges
- Coaching centers
- Training institutes
- HR teams
- Admin offices
- Small organizations

## Main Workflow

1. Upload ID card Word template
2. Upload Excel student/employee data
3. Map name, ID, class/department, and photo-related fields if applicable
4. Preview one row
5. Generate DOCX ID cards
6. Review outputs in History

## Demo / Readiness Status

AR-IDCARD-PRO is in launch prep. The product card and product detail page are ready for product-lineup demos, but AR-IDCARD-PRO does not yet have a separate live workspace.

## Enabled Features

- Launch-ready product positioning
- Dashboard product card
- Product detail page copy
- DOCX-oriented workflow description
- Accurate target-user and use-case messaging

## Disabled / Not-Yet Features

- Separate AR-IDCARD-PRO workspace is not live yet
- Photo automation is not fully live inside Project Atlas
- PDF export is not available
- Gmail/Outlook OAuth is not available
- Billing and payment collection are not available
- Real email sending is disabled

## Safety Status

- Controlled batch real send remains disabled
- Failed-row resend remains disabled
- Email dry-run remains the safe verification path where supported
- No real emails were sent during this launch-readiness update
- No Supabase secrets were touched
- No email Edge Functions were changed
- No generatedDocumentsService destructive delete logic was changed

## Manual Test Checklist

- Dashboard loads
- AR-CERT-PRO still appears as Demo Ready
- AR-MARKSHEET-PRO still appears as Launch Prep
- AR-INVOICE-PRO still appears as Launch Prep
- AR-IDCARD-PRO card appears as Launch Prep
- AR-IDCARD-PRO detail page loads
- CTA behavior is accurate and does not open a nonexistent ID card workspace
- No PDF export claim appears for AR-IDCARD-PRO
- No fully-live photo automation claim appears for AR-IDCARD-PRO
- No real-email sending claim appears for AR-IDCARD-PRO
- Existing AR-CERT-PRO DOCX generation still works
- History loads
- Scroll restoration still works
- Email Prep dry-run remains safe
- No real-send controls become enabled

## Product Launch Notes

AR-IDCARD-PRO extends the Project Atlas education and HR launch lineup into repeatable ID card document generation. This milestone prepares the product story, dashboard presence, and detail page while keeping the implementation honest: the separate ID card workspace is not live yet, photo automation is not fully live, PDF export is not available, and real email sending remains disabled.
