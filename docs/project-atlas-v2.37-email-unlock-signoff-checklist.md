# Project Atlas v2.37 — Email Unlock Consolidation + Sign-Off Checklist

**Document type:** Master pre-unlock checklist (documentation only — no code, backend, or schema changes)
**Status:** GATE DOCUMENT — this is the single authoritative checklist the owner
signs **before** any real batch email sending is implemented or enabled. It does
not implement, enable, or send anything.

Required flags (unchanged, and remain so until every item below is signed off):

```text
EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false
EMAIL_ALLOW_FAILED_ROW_RESEND=false
```

---

## 1. Purpose

Consolidate the seven email-unlock planning documents into one gate. All six
hardening items must be implemented, validated, and signed off — and every "must
remain blocked" condition confirmed — before Stage 0 (dry-run verification) or any
real-send flag flip is even considered. If any single item is incomplete, the unlock
does not proceed.

**Source documents consolidated here:**

| Doc | Title |
|-----|-------|
| v2.30 | Email Send Unlock Plan |
| v2.31 | Email Dry-Run Audit Report |
| v2.32 | Email Safety Hardening Plan |
| v2.33 | Recipient Allowlist Design Spec |
| v2.34 | Server-Authoritative SendReady Design Spec |
| v2.35 | Confirmation Phrase + Pre-Req Flag Hardening Spec |
| v2.36 | Volume Caps + Audit Logging Spec |

> **Numbering note:** this checklist uses the H1–H6 numbering defined in the task.
> It differs from the internal numbering in v2.32; the mapping is given per item.

---

## 2. Current Locked Safety State

Confirmed by v2.31 audit and v2.23 QA:

- Provider SendGrid; secrets only in Supabase Edge Function secrets.
- `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false` — controlled batch send **blocked**.
- `EMAIL_ALLOW_FAILED_ROW_RESEND=false` — failed-row resend **blocked**.
- Flags read server-side only; sandbox reports 0 real emails; owner test = 1 email
  to owner/test address behind `window.confirm`.
- Build PASS; all 19 flows PASS; no bugs; no secrets exposed; no emails sent.

---

## 3. Consolidated Hardening Requirements

Each item must be **implemented + validated + signed off**. None unlocks sending on
its own; flags stay authoritative.

### H1 — Recipient Allowlist  *(source: v2.33; v2.32 H1)*
- [ ] Server-enforced, deny-by-default recipient allowlist (exact / domain modes).
- [ ] Enforced empty allowlist blocks all recipients (safe default).
- [ ] Per-row block (`recipient_not_allowlisted`); batch never silently dropped.
- [ ] Frontend cannot set/override; no allowlist contents rendered.

### H2 — Server-Authoritative sendReady  *(source: v2.34; v2.32 H4)*
- [ ] Only Edge Functions produce `authoritative: true` readiness.
- [ ] Controlled-batch/resend recompute `sendReady` server-side; ignore client value.
- [ ] Client fallback readiness never enables a real-send control.
- [ ] `blockedReasons[]` explains every false readiness; fail-closed.

### H3 — Non-Default Confirmation Phrases  *(source: v2.35; v2.32 H3)*
- [ ] Known defaults (`SEND 5 TEST EMAILS`, `RESEND FAILED ROWS`) rejected when a flag is on.
- [ ] Secret, non-guessable phrases; never rendered as the literal expected value.
- [ ] Distinct phrases for controlled batch vs. resend; empty/whitespace blocked.
- [ ] Exact-match, server-side only.

### H4 — Default-On Prerequisite Flags  *(source: v2.35; v2.32 H2)*
- [ ] `EMAIL_BATCH_SEND_DRY_RUN_REQUIRED` / `EMAIL_OWNER_TEST_REQUIRED` enforced by
      default (absence = enforce, fail-closed).
- [ ] Disabling a precondition requires an explicit, audited `=false`.
- [ ] Resend prerequisite (originating batch context) enforced.

### H5 — Volume / Rate Caps  *(source: v2.36; v2.32 H5)*
- [ ] Per-batch recipient cap (≤5) + DOCX-only ≤10 MB retained.
- [ ] Rolling per-hour and per-day real-send ceilings; over-window → `rate_limit_exceeded`.
- [ ] Resend counts toward the same window ceilings as batch.
- [ ] Server-authoritative counting; fail-closed when indeterminate.

### H6 — Audit Logging  *(source: v2.36; v2.32 H6)*
- [ ] Structured entry per attempt (blocked **and** sent) with reason codes.
- [ ] Recipients hashed with secret salt; no raw PII, phrases, secrets, or flag values.
- [ ] Durable audit/rate persistence (if chosen) approved in a **separate** schema
      milestone — not assumed here.

---

## 4. Required Validation Checklist

Cross-cutting validations (in addition to per-item checks in §3):

- [ ] A forged/elevated client `sendReady`/`fallback` cannot trigger a real send.
- [ ] A leaked confirmation phrase alone cannot send (allowlist + flag still block).
- [ ] Non-allowlisted recipient blocked server-side (proven by test) for batch + resend.
- [ ] Over-cap and over-window requests blocked (no partial/silent send).
- [ ] Flag `false` always yields blocked regardless of every other gate.
- [ ] Dry-run end-to-end still reports `safetyFlagStatus: 'blocked'` with flags `false`.
- [ ] No secrets / phrases / allowlist / raw PII in frontend or logs.
- [ ] Build PASS; all 19 flows still PASS (no regression).
- [ ] Full gate order verified end-to-end: `flag → config → phrase + prereqs →
      allowlist → server sendReady → per-batch cap → per-window cap → attachment →
      dispatch`.

---

## 5. Required Environment Variables / Secrets Checklist

All in Supabase Edge Function secrets only (never frontend, never repo):

- [ ] `EMAIL_ALLOW_CONTROLLED_BATCH_SEND` — stays `false` until sign-off.
- [ ] `EMAIL_ALLOW_FAILED_ROW_RESEND` — stays `false` until sign-off.
- [ ] `EMAIL_RECIPIENT_ALLOWLIST_MODE`, `EMAIL_RECIPIENT_ALLOWLIST`,
      `EMAIL_RECIPIENT_ALLOWLIST_DOMAINS`, `EMAIL_ALLOWLIST_ENFORCED` (H1).
- [ ] `EMAIL_BATCH_SEND_CONFIRMATION_PHRASE`, `EMAIL_RESEND_CONFIRMATION_PHRASE` —
      set + non-default (H3).
- [ ] `EMAIL_BATCH_SEND_DRY_RUN_REQUIRED`, `EMAIL_OWNER_TEST_REQUIRED`,
      `EMAIL_RESEND_DRY_RUN_REQUIRED` — default-on posture (H4).
- [ ] `EMAIL_MAX_CONTROLLED_BATCH_RECIPIENTS`, `EMAIL_MAX_ATTACHMENT_MB`,
      `EMAIL_MAX_RESEND_ROWS`, `EMAIL_MAX_REAL_SENDS_PER_HOUR`,
      `EMAIL_MAX_REAL_SENDS_PER_DAY`, `EMAIL_MIN_SEND_INTERVAL_MS`,
      `EMAIL_OWNER_TEST_MAX_PER_DAY` (H5).
- [ ] `EMAIL_AUDIT_LOG_ENABLED`, `EMAIL_AUDIT_RECIPIENT_HASH_SALT` (H6).
- [ ] `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` — present,
      server-only, never exposed.

---

## 6. Required Owner-Only Test Checklist

Before any wider send, testing restricted to the owner:

- [ ] Sandbox validation passes end-to-end (0 real emails).
- [ ] Owner test sends exactly 1 email to an owner-controlled, allowlisted address.
- [ ] Owner test blocked if owner/test address not allowlisted under enforced policy.
- [ ] Owner test bounded by `EMAIL_OWNER_TEST_MAX_PER_DAY`; blocks logged.
- [ ] Dry-run status/log trail matches a real send minus dispatch.
- [ ] Each owner test recorded (date, size, result); no row recipients targeted.

---

## 7. What Must Remain Blocked Before Sign-Off

Until every item above is complete and this document is signed:

- [ ] Controlled batch send — flag stays `false`.
- [ ] Failed-row resend — flag stays `false`.
- [ ] Any real (non-sandbox) delivery to row recipients.
- [ ] ZIP / PDF email attachments; PDF export.
- [ ] Gmail / Outlook OAuth; billing.
- [ ] Supabase schema changes (including any durable audit/rate store).
- [ ] DOCX / batch / ZIP / History logic changes.
- [ ] Parked History scroll restoration.

---

## 8. Rollback / Kill-Switch Checklist

- [ ] **Kill switch verified:** setting both flags `false` stops all sends
      immediately, regardless of every other gate.
- [ ] Rollback is **flag/secret-only** for H1–H5; no schema or frontend change
      needed to revert.
- [ ] If a durable audit store (H6) is added, its rollback is handled in that
      separate schema milestone.
- [ ] Audit logs preserved to reconcile sent vs. blocked after any rollback.
- [ ] On suspected secret exposure: rotate SendGrid keys, then re-run this checklist
      before resuming.

---

## 9. Sign-Off Table

Unlock proceeds only when every row is **Complete** and signed.

| Item | Requirement | Source | Status | Owner | Date |
|------|-------------|--------|--------|-------|------|
| H1 | Recipient allowlist | v2.33 | ☐ Not started / ☐ In progress / ☐ Complete | | |
| H2 | Server-authoritative sendReady | v2.34 | ☐ | | |
| H3 | Non-default confirmation phrases | v2.35 | ☐ | | |
| H4 | Default-on prerequisite flags | v2.35 | ☐ | | |
| H5 | Volume / rate caps | v2.36 | ☐ | | |
| H6 | Audit logging | v2.36 | ☐ | | |
| — | Cross-cutting validation (§4) | v2.37 | ☐ | | |
| — | Env/secrets checklist (§5) | v2.37 | ☐ | | |
| — | Owner-only test checklist (§6) | v2.37 | ☐ | | |
| — | Kill-switch verified (§8) | v2.37 | ☐ | | |
| — | **Final unlock authorization** | v2.37 | ☐ | | |

Flags remain `false` until **Final unlock authorization** is signed.

---

## 10. Recommended Next Single Milestone

**Milestone: v2.38 — H1 Recipient Allowlist Implementation (Edge Functions only, flags stay `false`).**

With the full gate consolidated and signed off in design, begin implementation with
the highest-leverage, lowest-risk item: the server-enforced recipient allowlist
(H1 / v2.33), inside the controlled-batch and resend Edge Functions only, with both
send flags remaining `false`. Ship it behind `EMAIL_ALLOWLIST_ENFORCED` and verify
via the H1 checklist (including enforced-empty-blocks-all) with **no** real send.

Out of scope for that milestone: flipping either flag, real sends, H2–H6
implementation (sequenced after H1), OAuth, billing, PDF export, Supabase schema
changes, DOCX/batch/ZIP/History logic, and History scroll restoration.

> Note: v2.38 would be the first **implementation** milestone in this track. It
> changes Edge Function code only, keeps both flags `false`, sends no email, and
> requires its own review — this v2.37 document remains docs-only.

---

*Documentation-only consolidation/checklist. No application code, backend/Edge
Function code, Supabase schema, DOCX/batch/ZIP/History logic, or Email Prep behavior
was changed. No safety flags were enabled. No emails were sent. No secrets were
exposed. No git stash was applied or popped.*
