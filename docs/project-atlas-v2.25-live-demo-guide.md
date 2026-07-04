# Project Atlas v2.25 Live Demo Guide

## Demo Objective

Show Project Atlas as a working SaaS workflow for AR-CERT-PRO: upload a DOCX certificate template, upload Excel participant data, map fields, preview one row, generate DOCX files, review History, download outputs, download a batch ZIP, and show Email Prep safety/readiness without sending real batch emails.

## Demo Prerequisites

- Supabase Auth demo user is ready.
- Supabase project is configured for the deployed frontend.
- AR-CERT-PRO product is visible in the dashboard.
- A sample DOCX certificate template is ready.
- A sample Excel workbook is ready with 5-10 participant rows.
- Browser downloads are allowed.
- Do not use private or sensitive recipient data in the demo workbook.

## Sample DOCX Template Placeholders

Use simple double-curly placeholders in the DOCX template:

```text
{{name}}
{{course}}
{{date}}
{{certificate_id}}
{{trainer}}
```

Recommended certificate sentence:

```text
This certificate is awarded to {{name}} for completing {{course}} on {{date}}.
Certificate ID: {{certificate_id}}
Trainer: {{trainer}}
```

## Sample Excel Columns

Use these column headers so auto-mapping is easy to demonstrate:

```text
Name
Course
Date
Certificate ID
Trainer
Email
```

Example rows:

```text
Name,Course,Date,Certificate ID,Trainer,Email
Aarya Rushi,Office Automation Foundations,05 Jul 2026,CERT-001,Automation Labs,demo.owner@example.com
Priya Sharma,Excel Workflow Basics,05 Jul 2026,CERT-002,Automation Labs,demo.owner@example.com
Rahul Mehta,DOCX Template Automation,05 Jul 2026,CERT-003,Automation Labs,demo.owner@example.com
```

## Step-by-Step Live Demo Script

1. Open the landing page.
   - Point out the Word + Excel automation promise.
   - Click `Start Generating` or open the dashboard route.

2. Login.
   - Use the prepared Supabase Auth demo account.
   - Avoid showing credentials on screen longer than needed.

3. Open the dashboard.
   - Highlight the product suite layout.
   - Point out AR-CERT-PRO as the released/live workflow.

4. Open AR-CERT-PRO workspace.
   - Click `Open AR-CERT-PRO` or `Open Workspace`.
   - Briefly show the six-step workflow.

5. Upload DOCX.
   - In `Upload Template`, choose the prepared `.docx` file.
   - Confirm the template shows as ready.

6. Upload Excel.
   - Move to `Upload Excel`.
   - Choose the prepared workbook.
   - Confirm row and column counts appear.

7. Check auto-mapping.
   - Open `Review Mapping`.
   - Click `Auto-map`.
   - Confirm required fields are mapped.

8. Preview row.
   - Open `Preview Row`.
   - Show the generated preview values and row status.

9. Generate single DOCX.
   - Open `Generate DOCX`.
   - Click `Save workspace` if required.
   - Click `Generate one DOCX`.
   - Show the generated DOCX result and download option.

10. Generate batch DOCX.
    - Click `Generate batch DOCX files`.
    - Show batch progress and the completed batch summary.

11. Open History.
    - Click `Open History` or use the sidebar.
    - Show generated records and batch records.

12. Download one output.
    - Download one generated DOCX from History.
    - Mention that output files are stored in Supabase Storage.

13. Open batch details.
    - Expand the batch details row/card.
    - Show generated/skipped counts and individual outputs.

14. Download ZIP.
    - Click `Download Batch ZIP`.
    - Explain it packages generated DOCX files from the batch.

15. Open Email Prep safety/readiness panel.
    - In batch details, open Email Preparation.
    - Show provider, sandbox, owner test, and locked real batch status.
    - Save Email Prep and check readiness only if demo data and backend setup are ready.
    - Do not trigger any real batch send.

## What Not To Demo Yet

- PDF export.
- Gmail/Outlook OAuth.
- Billing.
- Controlled real batch send.
- Failed-row resend.
- Real row-recipient email delivery.

## 60-90 Second Demo Narration

Project Atlas is a focused automation dashboard for turning office document work into repeatable workflows. In this demo, I am using AR-CERT-PRO, our certificate generation product.

I start from the dashboard, open the AR-CERT-PRO workspace, and follow a six-step process. First, I upload a Word certificate template with placeholders like name, course, date, and certificate ID. Then I upload an Excel file with participant rows. Project Atlas detects the columns, lets me auto-map them to the template fields, and gives me a preview before generation.

Once the workspace is valid, I save it and generate a single DOCX certificate. I can also run batch generation for the Excel rows, producing individual DOCX outputs and a batch record. In History, I can re-download one output, inspect batch details, and download all generated DOCX files as a ZIP.

Finally, I can open Email Prep to show the safety-first email workflow. It supports dry-run preparation, readiness checks, sandbox validation, and owner/test email gating. Real batch sending, failed-row resend, PDF export, OAuth, and billing are intentionally not part of this demo yet.

## Demo Safety Notes

- Use demo-only data.
- Do not show real secrets or environment variables.
- Do not send real row-recipient emails.
- Keep the demo focused on DOCX generation, History, ZIP download, and email safety visibility.
