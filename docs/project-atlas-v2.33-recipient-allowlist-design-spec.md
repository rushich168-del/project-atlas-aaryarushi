# Project Atlas v2.33 — Recipient Allowlist Design Spec

**Document type:** Design specification (documentation only — no code, backend, or schema changes)
**Status:** DESIGN ONLY — nothing here is implemented, enabled, or sent.

> Specifies a server-enforced recipient allowlist to be built *before* any
> controlled batch send unlock (hardening item **H1** from v2.32). Both safety
> flags remain `false`; no code changes in this milestone.

Required flags (unchanged):

```text
EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false
EMAIL_ALLOW_FAILED_ROW_RESEND=false
```

---

## 1. Purpose

Define a safe, server-enforced recipient allowlist so that when real sending is
eventually staged, delivery is restricted to explicitly vetted addresses. The
allowlist is a blast-radius limiter: even if a flag is flipped or a confirmation
phrase leaks, non-allowlisted recipients must never receive mail.

---

## 2. Current Risk Without Allowlist

From the v2.31 audit (risk #4): the controlled-batch gate enforces a recipient
**count** cap (default 5) and **DOCX-only** attachments, but no check on *who* the
recipients are. Consequently, in an early or mistaken unlock:

- Real customer/row recipients could receive mail directly from spreadsheet data.
- A leaked confirmation phrase + flipped flag would have no address-level backstop.
- Test batches could accidentally target production recipients.

An allowlist closes this by making the recipient *identity* an independent gate.

---

## 3. Proposed Allowlist Behavior

- **Deny-by-default.** If allowlist enforcement is active and a recipient is not on
  the allowlist, that row is **blocked** (never sent).
- **Server-authoritative.** The allowlist and the decision live entirely in the
  Edge Functions; the frontend never supplies or overrides it.
- **Normalization.** Compare on a normalized form (trim + lowercase), matching the
  existing `normalizeEmail()` behavior in the send functions.
- **Match modes (config-selectable):**
  - Exact address match (default for early stages), and/or
  - Domain match (e.g. `@ourcompany.com`) for later, wider stages.
- **Per-row outcome, not all-or-nothing.** Each row is evaluated independently;
  allowlisted rows may proceed (once flags allow), non-allowlisted rows are blocked
  and recorded with a distinct error code — the batch is never silently dropped.
- **Enforcement toggle.** An explicit mode controls whether the allowlist is
  enforced, so staged rollout can widen scope deliberately.

---

## 4. Where Allowlist Should Be Enforced

Server-side only, inside both send Edge Functions, positioned **after** the
safety-flag/config gates and **before** any SendGrid dispatch. Using the guard
order observed in v2.31:

**`email-delivery-sendgrid-controlled-batch/index.ts`:**
```
CC/BCC block → ZIP/PDF block → safety-flag gate (EMAIL_ALLOW_CONTROLLED_BATCH_SEND)
→ provider/secret config → confirmation phrase → owner-test-required
→ [NEW] recipient allowlist gate  ← insert here, per row
→ max recipients → per-row attachment/recipient validation → dispatch
```

**`email-delivery-sendgrid-resend-failed/index.ts`:**
```
CC/BCC block → ZIP/PDF block → safety-flag gate (EMAIL_ALLOW_FAILED_ROW_RESEND)
→ secret config → confirmation phrase
→ [NEW] recipient allowlist gate  ← insert here, per row
→ max rows → invalid-recipient check → per-row attachment → dispatch
```

Rationale: place it after the flag/phrase gates (so blocked stays blocked with no
extra work) but before dispatch and before count/attachment checks, so an
off-allowlist recipient is rejected on identity regardless of other row validity.
The **owner test** function enforces its own owner-only rule (see §6) and is not
governed by this batch allowlist.

---

## 5. Suggested Environment Variables / Secrets

Stored **only** in Supabase Edge Function secrets (never frontend, never repo):

| Secret | Purpose | Example |
|--------|---------|---------|
| `EMAIL_RECIPIENT_ALLOWLIST_MODE` | `off` \| `exact` \| `domain` \| `exact_or_domain` | `exact` |
| `EMAIL_RECIPIENT_ALLOWLIST` | Comma-separated allowed addresses | `owner@lab.com,test@lab.com` |
| `EMAIL_RECIPIENT_ALLOWLIST_DOMAINS` | Comma-separated allowed domains | `lab.com` |
| `EMAIL_ALLOWLIST_ENFORCED` | Master enforce toggle (`true` to enforce) | `true` |

Notes:
- During hardening, recommended posture is `EMAIL_ALLOWLIST_ENFORCED=true` +
  `mode=exact` with only owner/test addresses — even while send flags stay `false`.
- Empty allowlist while enforced = block everything (safe default).
- No new secret exposes SendGrid credentials; these are policy config only.

---

## 6. Owner / Test Send Behavior

- Unchanged in intent: owner test sends **one** email to the configured
  owner/test address only, behind `window.confirm`.
- The allowlist should **reinforce** (not replace) this: the owner/test target must
  itself be on the allowlist (or implicitly trusted as the configured owner
  address). If the owner/test address is not allowlisted under an enforced policy,
  the owner test is blocked with a clear config error.
- Owner test never targets row recipients — the batch allowlist gate does not widen
  its scope.

---

## 7. Controlled Batch Send Behavior

- Remains **blocked** while `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false` — the
  allowlist gate is additive and does not unlock anything.
- When eventually staged: each planned recipient is checked against the allowlist
  **before** dispatch. Non-allowlisted rows → `batch_send_status = 'batch_blocked'`
  with a dedicated error code (e.g. `recipient_not_allowlisted`); allowlisted rows
  proceed only if the flag is enabled.
- Count cap (default 5) and DOCX-only attachment rules still apply on top.

---

## 8. Failed-Row Resend Behavior

- Remains **blocked** while `EMAIL_ALLOW_FAILED_ROW_RESEND=false`.
- Scope stays limited to `batch_send_status = 'batch_failed'` rows only;
  `batch_sent` rows are never resent.
- The same allowlist gate applies before any resend dispatch; a previously-failed
  row whose recipient is not allowlisted is blocked with `recipient_not_allowlisted`
  rather than resent.
- Resend allowlist enforcement is validated **after** controlled batch send is
  proven in production.

---

## 9. UI Messaging Requirements

- The Email Prep safety panel should state that recipient delivery is restricted by
  a server-side allowlist (explanatory only — no allowlist values shown in UI).
- Blocked-by-allowlist results must render a clear, non-alarming message
  (e.g. "Recipient not on the approved allowlist — no email sent"), consistent with
  existing "No emails were sent" copy.
- **No secrets or full allowlist contents** may be rendered in the frontend; only
  per-row block status/reason.
- Real-send controls (future) must stay visibly distinct from sandbox/owner-test,
  and must not present fail-open ("not deployed / no emails sent") copy on any path
  that could also dispatch.

---

## 10. Validation Checklist

Sign-off required before the allowlist is relied upon for any unlock:

- [ ] Allowlist + decision live only in Edge Functions; frontend cannot set/override.
- [ ] Enforced + empty allowlist blocks all recipients (safe default).
- [ ] Non-allowlisted recipient is blocked server-side with `recipient_not_allowlisted`
      (proven by test) — for both controlled batch and resend.
- [ ] Allowlisted recipient still blocked while the send flag is `false`.
- [ ] Normalization (trim/lowercase) matches existing `normalizeEmail()` behavior.
- [ ] Domain mode matches only intended domains; no over-broad match.
- [ ] Owner test blocked if owner/test address not allowlisted under enforced policy.
- [ ] No allowlist value or SendGrid secret appears in frontend or logs.
- [ ] Dry-run end-to-end still reports `safetyFlagStatus: 'blocked'` with flags `false`.
- [ ] Build PASS; all 19 flows still PASS (no regression).
- [ ] Owner sign-off recorded.

---

## 11. Rollback Plan

- **Disable enforcement change:** set `EMAIL_ALLOWLIST_ENFORCED=false` (or
  `MODE=off`) to revert to prior behavior — but note the primary safety backstop
  remains the send flags, which stay `false`.
- **Full send kill switch (unchanged):** `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false`
  and `EMAIL_ALLOW_FAILED_ROW_RESEND=false` stop all sends regardless of allowlist.
- Rollback is **secret/flag-only**: no schema change, no DOCX/batch/ZIP/History or
  frontend change required to revert.
- Preserve audit logs to reconcile which rows were blocked vs. allowed.

---

## 12. Recommended Next Single Milestone

**Milestone: v2.34 — Server-Authoritative `sendReady` Design Spec (H4), flags stay `false`.**

With the allowlist designed, the next highest-leverage hardening item is removing
client trust from readiness: spec how the real-send gate recomputes `sendReady`
entirely server-side and ignores any client-supplied `sendReady`/`fallback`. Design
only — no code change, no flag flip, no email sent.

Out of scope for that milestone: implementing the allowlist or `sendReady` change,
flipping either flag, real sends, OAuth, billing, PDF export, schema changes,
DOCX/batch/ZIP/History logic, and History scroll restoration.

---

*Documentation-only design spec. No application code, backend/Edge Function code,
Supabase schema, DOCX/batch/ZIP/History logic, or Email Prep behavior was changed.
No safety flags were enabled. No emails were sent. No secrets were exposed. No git
stash was applied or popped.*
