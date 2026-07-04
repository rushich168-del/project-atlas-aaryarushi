# Project Atlas v2.36 — Volume Caps + Audit Logging Spec

**Document type:** Design specification (documentation only — no code, backend, or schema changes)
**Status:** DESIGN ONLY — nothing here is implemented, enabled, or sent.

> Specifies volume/rate caps and audit logging (hardening items **H5 + H6** from
> v2.32), completing the pre-unlock hardening backlog alongside the v2.33 allowlist,
> v2.34 server-authoritative readiness, and v2.35 phrase/prereq specs. Both safety
> flags remain `false`; no code changes in this milestone.

Required flags (unchanged):

```text
EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false
EMAIL_ALLOW_FAILED_ROW_RESEND=false
```

---

## 1. Purpose

Bound the maximum possible impact of a real send (how many, how fast) and make
every send attempt observable and reconstructable. Caps limit blast radius; audit
logging provides the evidence trail needed for staged rollout, incident response,
and rollback reconciliation — all designed before any real send is unlocked.

---

## 2. Current Risk Without Caps / Logging

From the v2.31 audit, the send Edge Functions today have:

- **Partial caps only.** Controlled batch uses `DEFAULT_MAX_RECIPIENTS = 5`
  (override `EMAIL_MAX_CONTROLLED_BATCH_RECIPIENTS`) and `DEFAULT_MAX_ATTACHMENT_MB
  = 10` (override `EMAIL_MAX_ATTACHMENT_MB`); resend uses `DEFAULT_MAX_RESEND_ROWS`.
  There is a **per-batch count cap but no per-window / per-day rate cap**, so
  repeated batches could compound.
- **Minimal logging.** Blocks are surfaced via `console.warn` and response
  summaries; there is **no structured, persistent audit trail** of attempts,
  outcomes, flag state, or who/what was blocked vs. sent.

Risk (future): after unlock, without a rate cap repeated sends could exceed intended
volume, and without an audit trail it would be hard to prove what was actually
dispatched or to reconcile a rollback.

---

## 3. Proposed Volume Cap Behavior

- **Keep per-batch recipient cap** (default 5), configurable, enforced server-side;
  over-cap batch → blocked (`blocked_by_safety_limit`), no partial send.
- **Add per-window volume cap** — a maximum number of *real* recipients across a
  rolling window (e.g. per hour and per day) regardless of batch count.
- **Attachment cap retained** (DOCX-only, ≤10 MB) as-is.
- **Fail-closed on ambiguity.** If the window count cannot be determined, treat as
  over-cap → blocked.
- **Caps are independent of flags.** Caps apply whenever a real send would occur;
  they never *enable* sending (flags stay authoritative).

---

## 4. Proposed Rate Limit Behavior

- **Minimum inter-send spacing** (optional) and **per-window ceilings** (per-hour,
  per-day) on real dispatches.
- **Counted at the server**, keyed by a stable scope (e.g. per organization / per
  owner), evaluated immediately before dispatch.
- **Over-limit → blocked**, not queued, with a distinct error code
  (`rate_limit_exceeded`) and a "try later" message — no silent deferral that could
  send unexpectedly later.
- **Owner test** counts toward its own small ceiling so repeated test sends are also
  bounded.

> Note: durable per-window counting may require a persistence decision (see §5 and
> §10). This spec does **not** create schema now; it documents the options and
> defers the choice to implementation.

---

## 5. Proposed Audit Logging Behavior

Every send-path attempt (blocked or dispatched) should record a structured entry:

| Field | Purpose |
|-------|---------|
| `timestamp` | Server time of the attempt |
| `action` | `owner_test` \| `controlled_batch` \| `failed_row_resend` |
| `emailDeliveryJobId` | Job context |
| `rowId` / `rowNumber` | Which row |
| `recipientHash` | Salted hash of recipient (not the raw address / not full PII) |
| `outcome` | `sent` \| `blocked` \| `failed` \| `skipped` |
| `reasonCode` | e.g. `recipient_not_allowlisted`, `rate_limit_exceeded`, flag blocked |
| `flagState` | Relevant send flag as seen server-side |
| `allowlistState` / `capState` | Gate outcomes |

Rules:
- **No secrets, no phrases, no raw full-PII** in logs (hash or redact recipients).
- **Both blocked and sent** are logged (blocked-only or sent-only trails are
  insufficient for reconciliation).
- **Persistence choice is deferred:** minimum viable = structured Edge Function logs;
  durable = a dedicated audit store. A durable store would need a schema addition —
  **explicitly out of scope for this doc** and to be decided at implementation time.

---

## 6. Owner / Test Send Requirements

- Owner test still sends one email to the owner/test address only, behind
  `window.confirm`, allowlisted (v2.33), with server-authoritative readiness (v2.34).
- Owner test is bounded by its own small rate ceiling and is fully audit-logged
  (including blocks).

---

## 7. Controlled Batch Send Requirements

Remains **blocked** while `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false`. When staged, in
server-side gate order:

```
flag → config → non-default phrase + prereqs (v2.35) → allowlist (v2.33)
→ server-authoritative sendReady (v2.34) → per-batch cap (≤5)
→ [NEW] per-window volume/rate cap → attachment cap → dispatch
```

- Every row's outcome (sent/blocked/failed/skipped) is audit-logged with reason.
- Over-window or over-cap → `batch_blocked` with the specific reason code; no
  partial or silent send.

---

## 8. Failed-Row Resend Requirements

Remains **blocked** while `EMAIL_ALLOW_FAILED_ROW_RESEND=false`.

- Scope stays limited to `batch_send_status = 'batch_failed'` rows only.
- Subject to the same per-window volume/rate caps and full audit logging.
- Resend real sends count toward the same window ceilings as controlled batch (so
  resend cannot be used to exceed the overall volume budget).
- Validated only **after** controlled batch send is proven in production.

---

## 9. UI Messaging Requirements

- Cap/rate blocks render clear, non-alarming messages (e.g. "Sending limit reached —
  no email sent. Please try later.") consistent with existing "No emails were sent"
  copy.
- The UI may show *that* a limit applies, but **must not** expose exact secret cap
  values, recipient hashes, flag values, phrases, or allowlist contents.
- Real-send controls remain visibly distinct from sandbox/owner-test; no fail-open
  copy on any dispatch-capable path.

---

## 10. Backend Validation Requirements

- Cap and rate checks run **server-side only**, inside the send Edge Functions,
  before any SendGrid dispatch, after allowlist + readiness.
- Window counting must be authoritative server-side; client-supplied counts are
  ignored.
- Audit entries are written for **every** attempt (blocked and sent) with redacted
  recipients and machine-readable reason codes.
- If durable audit/rate persistence is later chosen, its schema is proposed and
  approved in a **separate** milestone — not assumed here (no schema change now).

---

## 11. Suggested Environment Variables / Secrets

Edge Function secrets only (never frontend, never repo):

| Secret | Purpose | Example |
|--------|---------|---------|
| `EMAIL_MAX_CONTROLLED_BATCH_RECIPIENTS` | Per-batch recipient cap (existing) | `5` |
| `EMAIL_MAX_ATTACHMENT_MB` | Attachment size cap (existing) | `10` |
| `EMAIL_MAX_RESEND_ROWS` | Per-resend row cap (existing) | `5` |
| `EMAIL_MAX_REAL_SENDS_PER_HOUR` | Rolling hourly real-send ceiling | `20` |
| `EMAIL_MAX_REAL_SENDS_PER_DAY` | Rolling daily real-send ceiling | `50` |
| `EMAIL_MIN_SEND_INTERVAL_MS` | Optional minimum spacing between sends | `1000` |
| `EMAIL_OWNER_TEST_MAX_PER_DAY` | Owner-test ceiling | `10` |
| `EMAIL_AUDIT_LOG_ENABLED` | Toggle structured audit logging | `true` |
| `EMAIL_AUDIT_RECIPIENT_HASH_SALT` | Salt for recipient hashing | (secret) |

---

## 12. Validation Checklist

Sign-off required before relying on caps/logging for any unlock:

- [ ] Over-batch-cap request is blocked server-side (`blocked_by_safety_limit`).
- [ ] Over-hour and over-day windows are blocked (`rate_limit_exceeded`).
- [ ] Window counting is server-authoritative; client counts ignored.
- [ ] Fail-closed when window count is indeterminate.
- [ ] Resend real sends count toward the same window ceilings as batch.
- [ ] Owner test bounded by its own ceiling; blocks logged.
- [ ] Audit entry written for every attempt (blocked and sent).
- [ ] No raw recipient/full-PII, secret, phrase, or flag value in logs.
- [ ] Recipient hashing uses a secret salt; not reversible from logs.
- [ ] Flag `false` always yields blocked regardless of caps.
- [ ] Dry-run end-to-end still reports `safetyFlagStatus: 'blocked'` with flags `false`.
- [ ] Build PASS; all 19 flows still PASS (no regression).
- [ ] Owner sign-off recorded.

---

## 13. Rollback Plan

- **Tighten or disable via secrets:** lower ceilings or set
  `EMAIL_AUDIT_LOG_ENABLED=false` / cap values to safe minimums to revert behavior —
  but send flags remain the ultimate backstop and stay `false`.
- **Full send kill switch (unchanged):** `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false`
  and `EMAIL_ALLOW_FAILED_ROW_RESEND=false` block all sends regardless of caps.
- Rollback is **flag/secret-only** for caps; if a durable audit store is later
  added, its rollback is handled in that milestone. No DOCX/batch/ZIP/History or
  frontend change required to revert this design.
- Preserve existing audit logs to reconcile what was sent vs. blocked.

---

## 14. Recommended Next Single Milestone

**Milestone: v2.37 — Pre-Unlock Hardening Consolidation & Sign-Off Checklist (no flag flip).**

All six hardening items are now designed (H1 allowlist v2.33, H4 readiness v2.34,
H2/H3 phrase+prereqs v2.35, H5/H6 caps+logging v2.36). The next milestone
consolidates them into a single pre-unlock sign-off checklist and dependency order
(including the deferred audit/rate persistence decision), producing the one
authoritative gate document the owner signs before Stage 0 dry-run verification.
Design/consolidation only — no code change, no flag flip, no email sent.

Out of scope for that milestone: implementing any hardening item, flipping either
flag, real sends, OAuth, billing, PDF export, schema changes, DOCX/batch/ZIP/History
logic, and History scroll restoration.

---

*Documentation-only design spec. No application code, backend/Edge Function code,
Supabase schema, DOCX/batch/ZIP/History logic, or Email Prep behavior was changed.
No safety flags were enabled. No emails were sent. No secrets were exposed. No git
stash was applied or popped.*
