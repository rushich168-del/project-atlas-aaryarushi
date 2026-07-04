# Project Atlas v2.31 — Email Dry-Run Audit Report

**Document type:** Read-only code audit (documentation only — no code, backend, or schema changes)
**Scope:** Existing Email Prep UI, send-readiness flow, and backend safety gates.
**Required safety flags (must remain):**

```text
EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false
EMAIL_ALLOW_FAILED_ROW_RESEND=false
```

> This report only reviews and documents existing code. It does not enable
> sending, does not deploy anything, and does not send any email.

---

## Files Reviewed

| Layer | Path |
|-------|------|
| UI | `src/components/email/EmailPreparationPanel.jsx` |
| Client service | `src/services/emailDeliveryDryRunService.js` |
| Client helpers | `src/services/emailDeliveryService.js` |
| Edge: readiness | `supabase/functions/email-delivery-dry-run/index.ts` |
| Edge: sandbox | `supabase/functions/email-delivery-sendgrid-sandbox/index.ts` |
| Edge: owner test | `supabase/functions/email-delivery-sendgrid-owner-test/index.ts` |
| Edge: controlled batch | `supabase/functions/email-delivery-sendgrid-controlled-batch/index.ts` |
| Edge: resend failed | `supabase/functions/email-delivery-sendgrid-resend-failed/index.ts` |

---

## 1. Email Prep Current UI Flow

`EmailPreparationPanel.jsx` drives a staged, gated flow. Each stage only unlocks
the next when its own success condition is met:

1. **Compose** — recipient column, subject template, message template, preview
   row selector. Live preview via `renderTemplate()`; recipient validated by
   `validateEmailRecipient()`.
2. **Save Email Prep** (`handleSaveDryRun`) — writes a `dry_run` job +
   per-row outputs to `email_delivery_jobs` / `email_delivery_outputs` via
   `prepareBatchEmailDryRun()`. Feedback: *"Email preparation saved. No emails were sent."*
3. **Check Send Readiness** (`handleCheckSendReadiness`) — appears only after a
   saved job exists. Calls the `email-delivery-dry-run` Edge Function.
4. **Validate Sandbox Send** — appears only when `edgeFunctionSummary.sendReady`.
5. **Send Owner Test Email** — appears only when all prepared rows are
   sandbox-validated and no owner test was already sent; requires a
   `window.confirm()`.
6. **Controlled Batch Send gate** — panel appears only after readiness + sandbox
   + owner test; requires confirmation phrase `SEND 5 TEST EMAILS`.
7. **Failed Row Resend gate** — panel appears when saved outputs exist; requires
   phrase `RESEND FAILED ROWS`.

The panel also shows a static **"Safety lock status"** block and an always-present
disabled **"Auto Send Coming Soon"** button. Preview/Prepared-Rows overlays are
UI-only.

**Gating chain (each step is a precondition for the next):**
`Save → Readiness (sendReady) → Sandbox (all rows validated) → Owner test (sent) → Controlled batch gate → Resend gate`

---

## 2. Check Send Readiness Behavior

- `handleCheckSendReadiness()` requires a saved `dry_run` job id; otherwise it
  prompts *"Save Email Prep first…"*.
- Invokes Edge Function `email-delivery-dry-run` with `{ emailDeliveryJobId }`.
- On success sets `edgeFunctionSummary` (mode, totalRecipients, preparedCount,
  `sendReady`) and clears downstream summaries.
- **Offline/undeployed fallback:** if the function errors with
  network/function/not-deployed patterns and a saved prep exists, it synthesizes
  a `fallback: true` summary from saved rows so the flow degrades gracefully —
  still **no send**.
- Mode is `dry_run` throughout; every message asserts no emails were sent.

---

## 3. SendGrid Sandbox Validation Behavior

- `handleValidateSandboxSend()` requires `edgeFunctionSummary.sendReady` and a
  `generationJobId`.
- Invokes `email-delivery-sendgrid-sandbox`; results tracked as row statuses
  `sandbox_validated` / `sandbox_failed` / `blocked`.
- The UI computes `sandboxAllPreparedRowsValidated` (all prepared rows validated,
  zero failed, zero blocked) as the precondition for owner test.
- Result card explicitly reports **"Real emails delivered: 0"** — sandbox mode
  validates the SendGrid request path without real delivery.

---

## 4. Owner / Test Send Behavior

- Unlocks only when `sandboxAllPreparedRowsValidated` is true and no owner test
  was previously sent (`ownerTestSent`).
- Requires explicit `window.confirm('Send 1 real test email to the configured
  owner/test email?')`.
- Invokes `email-delivery-sendgrid-owner-test`; sends **one** real email to the
  backend-configured owner/test address only — never to row recipients (UI
  note: *"It will not send to row recipients."*).
- Result card shows owner target, a preview of the original row recipient (not a
  live send), attachment filename, and status.

---

## 5. Controlled Batch Send — Blocked State

- Gate panel visible only after readiness + sandbox + owner test succeed.
- UI copy states real batch sending is **locked** and *"can deliver to row
  recipients"* only if the backend flag is enabled.
- `handleCheckControlledBatchGate()` invokes
  `email-delivery-sendgrid-controlled-batch` with the confirmation phrase.
- **Backend authority (controlled-batch `index.ts`):**
  - `allowControlledBatchSend = Deno.env.get('EMAIL_ALLOW_CONTROLLED_BATCH_SEND') === 'true'` → `safetyFlagStatus = 'blocked'` when false.
  - Pre-checks block CC/BCC and ZIP/PDF attachments first, then the flag gate
    returns a blocked summary; rows are marked `batch_send_status = 'batch_blocked'`.
  - Additional guards: max recipients (default 5), DOCX-only attachment, required
    confirmation phrase, optional `EMAIL_BATCH_SEND_DRY_RUN_REQUIRED` and
    `EMAIL_OWNER_TEST_REQUIRED`.
- **With the flag `false`, expected result: 0 real emails to row recipients.**

---

## 6. Failed-Row Resend — Blocked State

- Gate panel visible when saved outputs exist; only rows with
  `batch_send_status = 'batch_failed'` are eligible.
- `handleCheckResendFailedGate()` invokes `email-delivery-sendgrid-resend-failed`
  with phrase `RESEND FAILED ROWS`.
- **Backend authority (resend-failed `index.ts`):**
  - `allowFailedRowResend = Deno.env.get('EMAIL_ALLOW_FAILED_ROW_RESEND') === 'true'` → `safetyFlagStatus = 'blocked'` when false.
  - Order of guards: CC/BCC blocked → ZIP/PDF blocked → **flag gate**
    (`failed_row_resend_safety_flag_disabled`) → secret config → confirmation
    phrase → max rows (default 5) → recipient/attachment validation.
  - Scope hard-limited to `batch_failed` rows; `batch_sent` rows are never resent.
- **With the flag `false`, expected result: 0 resend emails.**

---

## 7. Where Backend Safety Flags Are Checked

Both flags are read **server-side only**, inside the Edge Functions — never in
frontend code, and never returned as raw values to the client.

| Flag | Enforced in | Read as | Blocked status |
|------|-------------|---------|----------------|
| `EMAIL_ALLOW_CONTROLLED_BATCH_SEND` | `email-delivery-sendgrid-controlled-batch/index.ts` | `Deno.env.get(...) === 'true'` | `safetyFlagStatus: 'blocked'`, rows `batch_blocked` |
| `EMAIL_ALLOW_FAILED_ROW_RESEND` | `email-delivery-sendgrid-resend-failed/index.ts` | `Deno.env.get(...) === 'true'` | `safetyFlagStatus: 'blocked'`, error `failed_row_resend_safety_flag_disabled` |

The frontend only reads the *derived* `safetyFlagStatus` label in the response
summary — it never reads the flag value, `SENDGRID_API_KEY`, or sender secrets.
Secrets (`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`) live in
Supabase Edge Function secrets and are read only server-side.

---

## 8. Visible Risks Before Unlocking Real Send

Observations from the audit (documentation only — nothing changed):

1. **Fail-open perception on undeployed functions.** Readiness/sandbox/owner-test
   error handlers report reassuring "not deployed / no emails sent" messages. This
   is correct today, but before unlock, confirm those fallbacks can never mask a
   *real* dispatch path.
2. **`sendReady` derives partly from client-side counts.** The readiness fallback
   computes `sendReady` from saved rows on the client. The **authoritative** gate
   is server-side, but ensure no future change lets the client-side `sendReady`
   alone trigger a real send.
3. **Confirmation phrases are hardcoded defaults** (`SEND 5 TEST EMAILS`,
   `RESEND FAILED ROWS`) with env overrides. Before unlock, set non-default
   phrases via `EMAIL_BATCH_SEND_CONFIRMATION_PHRASE`.
4. **Recipient allowlist not evident in reviewed code.** Controlled batch limits
   count (5) and attachment type (DOCX) but no explicit recipient allowlist was
   observed; add one before any real send.
5. **`window.confirm` is the only client dispatch guard** for owner test and
   controlled batch. Backend flags are the real guard — keep them as the source
   of truth.
6. **Optional pre-req flags default off.** `EMAIL_BATCH_SEND_DRY_RUN_REQUIRED`
   and `EMAIL_OWNER_TEST_REQUIRED` are only enforced if set to `true`; recommend
   setting both before unlock.

None of these require action now; they are the checklist items to verify when the
v2.30 unlock plan is eventually executed.

---

## 9. Recommended Next Single Milestone

**Milestone: v2.32 — Dry-Run Gate Verification Report (flags stay `false`).**

Exercise Save → Check Send Readiness → Validate Sandbox Send → (owner test to an
owner inbox only, if desired) and capture the exact `safetyFlagStatus: 'blocked'`
responses from both gate functions as evidence that the controlled-batch and
resend paths deny delivery while both flags remain `false`. This produces the
signed evidence artifact the v2.30 pre-unlock checklist requires — with **zero**
row-recipient sends.

Out of scope for that milestone: flipping either flag, real batch/ resend
sends, OAuth, billing, PDF export, schema changes, DOCX/batch/ZIP/History logic,
and History scroll restoration.

---

*Documentation-only audit. No application code, backend/Edge Function code,
Supabase schema, DOCX/batch/ZIP/History logic, or Email Prep behavior was
changed. No safety flags were enabled. No emails were sent. No secrets were
exposed. No git stash was applied or popped.*
