# Project Atlas v2.7 — Email delivery dry-run setup

## Apply the SQL migration

1. Open your Supabase project dashboard.
2. Open the SQL Editor.
3. Paste the contents of [supabase/migrations/create_email_delivery_tables.sql](../supabase/migrations/create_email_delivery_tables.sql).
4. Run the query.

This creates:

- email_delivery_jobs
- email_delivery_outputs

## What the tables store

email_delivery_jobs stores a dry-run preparation record for a batch or single generation workflow.

email_delivery_outputs stores one saved preview row per prepared recipient.

## Verify the tables exist

Run this SQL in Supabase SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
and table_name in ('email_delivery_jobs', 'email_delivery_outputs');
```

You should see both table names returned.

## Test Save Email Prep

1. Open the certificate engine.
2. Generate a document or batch of documents.
3. Open the Email Preparation panel.
4. Click Save Email Prep.

Expected behavior:

- A dry-run job record is created in email_delivery_jobs
- One output row is created per preview in email_delivery_outputs
- No real emails are sent
- No provider API is called

## Confirm no real emails are sent

The dry-run flow only saves preview records. It never calls an SMTP service, an email provider, or any send endpoint.

## Troubleshooting

If Save Email Prep shows:

- "Email prep saving requires the email delivery tables to be enabled."

then the SQL migration has not been applied yet. Re-run the migration in the Supabase SQL Editor.

If the app still cannot save records, verify:

- Supabase is configured in the frontend environment
- The user is signed in
- The migration created the tables in the correct project
- Row Level Security policies were applied successfully
