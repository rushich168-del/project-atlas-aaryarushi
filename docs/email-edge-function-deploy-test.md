# Project Atlas v2.9 — Edge function deploy and test notes

## Deploy the function

1. Sign in to the Supabase CLI.
2. Link the target Supabase project.
3. Deploy the function with:

```bash
supabase functions deploy email-delivery-dry-run
```

Do not include any real secrets in the frontend or documentation.

## Local test flow

1. Generate 5 DOCX files.
2. Open the Email Preparation panel.
3. Choose the email column.
4. Click Save Email Prep.
5. Click Check Send Readiness.

Expected behavior:

- The app shows a dry-run readiness summary.
- The message says: "No emails were sent."
- No real email provider is called.
- No real email is sent.

## Expected response

When the function is deployed and the job belongs to the signed-in user, the app should receive a response similar to:

```json
{
  "ok": true,
  "mode": "dry_run",
  "message": "Dry-run checked successfully. No emails were sent.",
  "emailDeliveryJobId": "...",
  "totalRecipients": 5,
  "preparedCount": 5,
  "sendReady": true
}
```

## If the function is not deployed yet

The app should show:

- "Send readiness check is not deployed yet. Email prep is saved, and no emails were sent."

This is expected before deployment and should not crash the app.
