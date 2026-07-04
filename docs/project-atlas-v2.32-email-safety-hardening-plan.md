# Project Atlas v2.32 — Email Safety Hardening Plan

**Document type:** Safety-first planning document (documentation only — no code, backend, or schema changes)
**Status:** PLAN ONLY — this document does not implement, enable, or send anything.

> Builds on the v2.31 dry-run audit and the v2.23 static/stability pass. It defines
> the hardening required *before* real email sending is ever unlocked. All send
> paths remain blocked; both safety flags stay `false`.

---

## 1. Purpose

Define the concrete safety hardening work that must be completed and verified
before controlled real batch email sending (or failed-row resend) is enabled. This
converts the risks surfaced in the v2.31 audit into an actionable, ordered plan with
a validation checklist and a rollback path — without changing any code now.

---

## 2. Current Safety State

Confirmed by v2.31 audit and v2.23 QA:

- Provider: SendGrid; secrets stored only in Supabase Edge Function secrets.
- `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false` — controlled batch send **blocked**.
- `EMAIL_ALLOW_FAILED_ROW_RESEND=false` — failed-row resend **blocked**.
- Flags are read **server-side only** (`Deno.env.get(...) === 'true'`) inside the
  controlled-batch and resend Edge Functions; never read in frontend.
- Sandbox validation reports 0 real emails; owner test sends 1 email to an
  owner/test address only, behind `window.confirm`.
- Build PASS; all 19 flows PASS; no bugs; no secrets exposed; no emails sent.

---

## 3. Risks Found in v2.31 Audit

Carried forward verbatim as the hardening backlog:

1. **Fail-open perception on undeployed functions** — readiness/sandbox/owner-test
   error handlers return reassuring "not deployed / no emails sent" messages.
   Correct today, but must be proven to never mask a real dispatch path.
2. **`sendReady` partly derived client-side** — the readiness fallback computes
   `sendReady` from saved rows on the client. Authoritative gate is server-side;
   ensure client `sendReady` alone can never trigger a real send.
3. **Hardcoded default confirmation phrases** — `SEND 5 TEST EMAILS` /
   `RESEND FAILED ROWS` with env overrides; non-default phrases must be set
   before unlock.
4. **No explicit recipient allowlist observed** — controlled batch limits count
   (5) and attachment type (DOCX) but no allowlist enforcement was seen.
5. **`window.confirm` is the only client dispatch guard** — backend flags must
   remain the true source of truth.
6. **Optional pre-req flags default off** — `EMAIL_BATCH_SEND_DRY_RUN_REQUIRED`
   and `EMAIL_OWNER_TEST_REQUIRED` are only enforced when `true`.

---

## 4. Required Hardening Changes Before Unlock

Each item is a *future* change (not done here). Grouped by layer.

**Backend / Edge Function safety (highest priority):**
- **H1 — Recipient allowlist gate.** Add a server-enforced allowlist
  (e.g. `EMAIL_RECIPIENT_ALLOWLIST`) so early unlock stages can only deliver to
  vetted owner/test addresses; non-allowlisted recipients → blocked.
- **H2 — Enforce pre-req flags by default.** Require
  `EMAIL_BATCH_SEND_DRY_RUN_REQUIRED=true` and `EMAIL_OWNER_TEST_REQUIRED=true`
  as preconditions in the controlled-batch gate.
- **H3 — Non-default confirmation phrases.** Set
  `EMAIL_BATCH_SEND_CONFIRMATION_PHRASE` (and resend equivalent) to secret,
  non-guessable values via Edge Function secrets.
- **H4 — Server-authoritative `sendReady`.** Ensure the real-send gate recomputes
  readiness server-side and ignores any client-provided `sendReady`/`fallback`.
- **H5 — Volume + rate caps.** Confirm/lower max recipients per batch and add a
  per-window batch cap; reject over-cap requests as blocked.
- **H6 — Structured audit logging.** Every attempt logs row id, recipient hash,
  status, timestamp, and flag state — without logging secrets or full PII.

**Frontend safety (supporting):**
- **H7 — No fail-open messaging near dispatch.** Verify undeployed/error copy
  cannot appear on a path that could also dispatch; keep messages accurate.
- **H8 — Explicit "real send" labeling.** Any future real-send control must be
  visibly distinct from sandbox/owner-test, with an unambiguous confirmation.

**Secrets / config:**
- **H9 — Secret hygiene review.** Re-confirm `SENDGRID_API_KEY`,
  `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, and both flags exist only in Edge
  Function secrets and never reach the client or repo.

---

## 5. What Should Remain Blocked

Until every hardening item is implemented, validated, and signed off:

- Controlled batch send — flag stays `false`.
- Failed-row resend — flag stays `false`.
- Any real (non-sandbox) delivery to real recipients.
- ZIP / PDF email attachments; PDF export.
- Gmail / Outlook OAuth; billing.
- Supabase schema changes.
- DOCX / batch / ZIP / History logic changes.
- Parked History scroll restoration.

---

## 6. Suggested Implementation Order

1. **H9** secret hygiene review (cheapest, gates everything).
2. **H1** recipient allowlist (biggest blast-radius reducer).
3. **H4** server-authoritative `sendReady` (removes client-trust risk).
4. **H2 + H3** enforce pre-req flags + non-default phrases.
5. **H5** volume/rate caps.
6. **H6** structured audit logging.
7. **H7 + H8** frontend messaging/labeling hardening.
8. Only then consider staged unlock (owner allowlist → tiny real batch), per the
   v2.30 rollout stages.

Resend (`EMAIL_ALLOW_FAILED_ROW_RESEND`) is hardened and unlocked **only after**
controlled batch send is validated in production.

---

## 7. Validation Checklist

Sign-off required on all before any flag flip:

- [ ] H9: no secret readable from frontend or repo; flags server-only.
- [ ] H1: non-allowlisted recipient is blocked server-side (test proves it).
- [ ] H4: forged/elevated client `sendReady` cannot trigger a real send.
- [ ] H2: controlled-batch gate refuses to send when dry-run/owner-test pre-reqs off.
- [ ] H3: default confirmation phrases no longer accepted; new phrases enforced.
- [ ] H5: over-cap batch and over-window batch are rejected as blocked.
- [ ] H6: audit log captures each attempt with no secret/full-PII leakage.
- [ ] H7/H8: no fail-open copy on any dispatch-capable path; real-send clearly labeled.
- [ ] Dry-run end-to-end still reports `safetyFlagStatus: 'blocked'` with flags `false`.
- [ ] Owner test still limited to owner/test address only.
- [ ] Build PASS; all 19 flows still PASS (no regression).
- [ ] Owner sign-off recorded.

---

## 8. Rollback Plan

- **Immediate kill switch:** set `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false` and
  `EMAIL_ALLOW_FAILED_ROW_RESEND=false` in Edge Function secrets — returns the app
  to the current safe posture with no further sends.
- Rollback is **flag-only**: no schema change is needed to revert, and
  DOCX/batch/ZIP/History logic and the frontend are untouched.
- Preserve audit logs (H6) to reconcile which rows were actually dispatched.
- On suspected secret exposure: rotate SendGrid keys, then re-run this checklist
  before resuming.

---

## 9. Recommended Next Single Milestone

**Milestone: v2.33 — Recipient Allowlist Design Spec (H1), flags stay `false`.**

Produce a design-only spec for the server-enforced recipient allowlist: secret
name/format, where the check sits in the controlled-batch and resend gate order
(before any dispatch), blocked-status/error-code behavior, and its test plan. This
is the single highest-leverage hardening item and unblocks the rest of the order in
Section 6 — with no code change, no flag flip, and no email sent.

Out of scope for that milestone: implementing the allowlist, flipping either flag,
real sends, OAuth, billing, PDF export, schema changes, DOCX/batch/ZIP/History
logic, and History scroll restoration.

---

*Documentation-only hardening plan. No application code, backend/Edge Function
code, Supabase schema, DOCX/batch/ZIP/History logic, or Email Prep behavior was
changed. No safety flags were enabled. No emails were sent. No secrets were
exposed. No git stash was applied or popped.*
