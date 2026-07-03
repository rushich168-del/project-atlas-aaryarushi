# Project Atlas v2.8 — Email edge function dry-run contract

## Purpose

This milestone adds a Supabase Edge Function placeholder contract for future email delivery readiness checks.

The function is intentionally dry-run only. It does not send emails and does not call any real email provider.

## Function name

The expected Supabase Edge Function name is:

- email-delivery-dry-run

## Request body

The frontend sends:

```json
{
  "emailDeliveryJobId": "uuid"
}
```

## Expected response

On success, the function returns a summary such as:

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

## Security notes

- The function reads the Authorization header.
- It uses the authenticated user context from Supabase.
- It verifies that the requested email delivery job belongs to the authenticated user.
- It never trusts the frontend user id directly.
- It never exposes secrets to the browser.

## Deployment later

When the function is deployed, the frontend can call it through the Supabase client using the same dry-run contract.

## Future real-send path

The future real-send implementation will reuse the same authorization and ownership checks, then move the actual provider call into the backend layer only.
