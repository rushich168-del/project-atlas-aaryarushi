# AR-CERT-PRO Demo Assets

Use these files to run a repeatable Project Atlas AR-CERT-PRO demo.

## Files

- `sample-certificate-data.csv` - five sample certificate rows for Excel upload, aligned to the current AR-CERT-PRO fields.
- `certificate-template-placeholders.md` - placeholder reference for creating a DOCX certificate template.

## How To Use

1. Open `certificate-template-placeholders.md`.
2. Create a Word `.docx` certificate template using the listed placeholders.
3. Open Project Atlas and sign in.
4. Go to `Dashboard` -> `Open AR-CERT-PRO`.
5. Upload the DOCX template in `Upload Template`.
6. Upload `sample-certificate-data.csv` in `Upload Excel`.
7. Go to `Review Mapping` and click `Auto-map`.
8. Confirm required fields are mapped.
9. Go to `Preview Row`.
10. Save the workspace.
11. Generate one DOCX.
12. Generate batch DOCX files.
13. Open History, inspect batch details, download one output, and download the batch ZIP.

## Safety Notes

- The sample email addresses are fake/example addresses.
- Do not use real student, customer, or recipient data in demos.
- Do not demonstrate controlled real batch send or failed-row resend.
- Email Prep may be shown for readiness/safety visibility only.
