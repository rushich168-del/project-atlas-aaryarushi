# Project Atlas v2.38 — Recipient Allowlist Implementation Report

**Document type:** Implementation report (documentation only — no further code changes in this task)
**Milestone:** H1 — Server-side recipient allowlist enforcement (first code-changing email safety milestone)

> This report documents the H1 allowlist code change already made in the Edge
> Functions and the validation still pending before deploy. Both send safety flags
> remain `false`; no emails were sent.

---

## 1. Implementation Status

**Status: IMPLEMENTED (code) — VALIDATION PENDING (pre-deploy).**

Server-enforced recipient allowlist (H1 / design spec v2.33) added to all three
email dispatch Edge Functions. Enforcement is server-side only, deny-by-default,
and additive — it sits behind the existing safety-flag gates and does not enable
any sending. The Vite frontend build passes unchanged. Deno/Supabase validation has
not been run locally (neither CLI is installed here) and must be run before deploy.

---

## 2. Changed Files

Code changes (made in milestone v2.38 implementation, prior to this report):

- `supabase/functions/email-delivery-sendgrid-controlled-batch/index.ts`
  — added `parseAllowlistEntries()` + `isRecipientAllowlisted()` helpers and a
  per-batch allowlist gate (blocks with `recipient_not_allowlisted`).
- `supabase/functions/email-delivery-sendgrid-resend-failed/index.ts`
  — same helpers + allowlist gate on failed rows.
- `supabase/functions/email-delivery-sendgrid-owner-test/index.ts`
  — same helper + allowlist gate on the configured owner/test target.

No frontend, schema, DOCX/batch/ZIP/History, or Email Prep changes were made.

This report file (`docs/project-atlas-v2.38-recipient-allowlist-implementation-report.md`)
is the only file created by the current (docs-only) task.

---

## 3. Safety Behavior

- **Server-side only.** Allowlist config and decision live entirely in the Edge
  Functions; the frontend cannot set or override them.
- **Deny-by-default.** When `EMAIL_ALLOWLIST_ENFORCED=true` and mode ≠ `off`, an
  empty allowlist blocks every recipient. An empty/blank normalized email is also
  blocked.
- **Match modes.** `exact` (via `EMAIL_RECIPIENT_ALLOWLIST`), `domain` (via
  `EMAIL_RECIPIENT_ALLOWLIST_DOMAINS`), or `exact_or_domain`. Comparison is
  normalized (trim + lowercase), matching the existing `normalizeEmail()` behavior.
- **Blocked, not skipped.** Non-allowlisted recipients are blocked with status
  `recipient_not_allowlisted`:
  - controlled batch → rows marked `batch_blocked`;
  - failed-row resend → rows marked `resend_blocked`;
  - owner test → `owner_test_blocked`.
  No partial or silent send occurs.
- **Owner/test target covered.** The owner-test function checks its configured
  owner/test address against the allowlist under enforced policy (per v2.33 §6); it
  still only ever targets the owner/test address, never row recipients.
- **No-op when off.** With mode `off` or `EMAIL_ALLOWLIST_ENFORCED` unset, behavior
  is unchanged — no impact on the current demo posture.

---

## 4. Environment Variables Used

All read server-side only, from Supabase Edge Function secrets (never frontend,
never committed to repo):

| Variable | Purpose |
|----------|---------|
| `EMAIL_ALLOWLIST_ENFORCED` | Master toggle; `true` enables enforcement |
| `EMAIL_RECIPIENT_ALLOWLIST_MODE` | `off` \| `exact` \| `domain` \| `exact_or_domain` (default `off`) |
| `EMAIL_RECIPIENT_ALLOWLIST` | Comma-separated exact allowed addresses |
| `EMAIL_RECIPIENT_ALLOWLIST_DOMAINS` | Comma-separated allowed domains |

No new SendGrid or secret-bearing variables were introduced; these are policy
config only. Existing send safety flags are unchanged (see §8).

---

## 5. Gate Ordering Summary

The allowlist gate was inserted **after** each function's existing safety-flag gate
and **before** any SendGrid dispatch, so with the flags `false` sending is already
blocked before the allowlist logic is reached (defense in depth).

**Controlled batch:**
```
flag gate (EMAIL_ALLOW_CONTROLLED_BATCH_SEND) → config/secrets → sandbox-validated
→ owner-test-required → confirmation phrase → recipient count → max recipients
→ invalid-recipient → [NEW] allowlist gate → sandbox per-row → attachments → dispatch
```

**Failed-row resend:**
```
flag gate (EMAIL_ALLOW_FAILED_ROW_RESEND) → config/secrets → confirmation phrase
→ planned-rows → max rows → invalid-recipient → [NEW] allowlist gate
→ attachments → dispatch
```

**Owner test:**
```
config/secrets → valid owner/test email → [NEW] allowlist gate (owner/test target)
→ job auth → single-send limit → prepared output → attachment → dispatch
```

---

## 6. Build Result

- `npm run build` → **PASS.** 2183 modules transformed; asset hashes identical to the
  v2.23 baseline, confirming the frontend bundle is unchanged by this work.
- Only output: the pre-existing non-blocking >500 kB chunk-size advisory (not a
  regression, predates this milestone).

> Note: `npm run build` (Vite) compiles `src/` only and does **not** typecheck the
> Deno Edge Functions. Edge Function validation is tracked in §7.

---

## 7. Pending Validation

Must be completed in a Deno-capable / Supabase-CLI environment (e.g. CI) **before**
deploying the Edge Functions:

- [ ] **Deno type check not run locally** — `deno` is not installed in this
      environment. Run `deno check` (or `deno lint`) on all three functions.
- [ ] **Supabase CLI / function validation not run locally** — `supabase` CLI is not
      installed here. Validate/serve the functions (`supabase functions serve`) and
      exercise the allowlist paths.
- [ ] **Must validate before deploying Edge Functions.** Do not deploy until Deno
      check and Supabase function validation pass.
- [ ] Test deny-by-default: enforced + empty allowlist blocks all recipients.
- [ ] Test `recipient_not_allowlisted` returned for a non-allowlisted recipient in
      controlled batch, resend, and owner test.
- [ ] Confirm allowlisted recipient is still blocked while the send flag is `false`
      (flag remains the ultimate gate).

Until this validation passes, H1 is **implemented but not deploy-approved**.

---

## 8. Safety Confirmation

- `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false` — controlled batch send remains blocked
  (check still requires `=== 'true'`; no repo/env sets it true).
- `EMAIL_ALLOW_FAILED_ROW_RESEND=false` — failed-row resend remains blocked
  (check still requires `=== 'true'`; no repo/env sets it true).
- **No emails sent.**
- **No secrets exposed** — allowlist config is policy-only; no SendGrid credentials
  added or logged; recipients not exposed to the frontend.
- **No frontend or schema changes** — build hashes unchanged; no Supabase schema
  touched. Existing UI surfaces the `recipient_not_allowlisted` reason through
  existing error/status fields without modification.
- Parked History scroll restoration untouched. No git stash applied or popped.

---

## 9. Recommended Next Single Milestone

**Milestone: v2.39 — H1 Edge Function Validation & Deploy Gate (Deno check + Supabase function tests; flags stay `false`).**

Run the pending §7 validation in a Deno/Supabase-CLI environment: `deno check` on
all three functions, function-level tests of the allowlist gate (deny-by-default,
`recipient_not_allowlisted`, flag-still-blocks), and record the results as the
deploy-approval artifact for H1. No new feature code, no flag flip, no email sent.

Only after H1 is validated and deploy-approved should the next hardening item
(**H2 — server-authoritative `sendReady`, spec v2.34**) begin implementation.

Out of scope: flipping either flag, real sends, H2–H6 implementation, OAuth,
billing, PDF export, schema changes, DOCX/batch/ZIP/History logic, and History
scroll restoration.

---

*Documentation-only report. No application code, Edge Function code, Supabase schema,
DOCX/batch/ZIP/History logic, or Email Prep behavior was changed by this task. No
safety flags were enabled. No emails were sent. No secrets were exposed. No git
stash was applied or popped.*
