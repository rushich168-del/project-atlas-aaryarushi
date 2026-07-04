# Project Atlas v2.30 — Email Send Unlock Plan

**Document type:** Safety-first planning document (documentation only — no code, backend, or schema changes)
**Status:** PLAN ONLY — nothing in this document is implemented or enabled by it.

> This document describes how controlled real batch email sending *could* be
> unlocked in the future. It does **not** unlock anything. All send paths remain
> blocked. No emails are sent as a result of this document.

---

## 1. Current Email Safety State

The app is demo-ready and in a locked-down, safe email posture (carried from
v2.19 safety status and v2.29 demo release snapshot):

- Provider: SendGrid.
- Sandbox validation: Available.
- Owner test send: Available.
- Controlled batch send: **Protected by backend safety flag (blocked).**
- Failed-row resend: **Protected by backend safety flag (blocked).**
- ZIP email attachment: Disabled.
- PDF email attachment: Disabled.
- Gmail/Outlook OAuth: Not enabled.
- Secrets: Stored in Supabase Edge Function secrets only; never read or exposed
  in frontend code.
- Email Prep exposes read-only safety/readiness panels only.
- No real batch emails are sent.

---

## 2. Current Disabled Flags

These backend safety flags are currently **false** and gate all real batch send
behavior. They remain false in this milestone.

```text
EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false
EMAIL_ALLOW_FAILED_ROW_RESEND=false
```

- Both flags live in backend / Supabase Edge Function secrets.
- Frontend code must never read these flag values.
- Neither flag is changed by this document.

---

## 3. What Must Stay Blocked For Now

Until the full pre-unlock checklist (Section 4) is complete and signed off, the
following stay blocked:

- Controlled batch send (`EMAIL_ALLOW_CONTROLLED_BATCH_SEND` stays `false`).
- Failed-row resend (`EMAIL_ALLOW_FAILED_ROW_RESEND` stays `false`).
- Any real (non-sandbox) email delivery to real recipients.
- ZIP email attachments.
- PDF email attachments / PDF export.
- Gmail / Outlook OAuth.
- Billing.
- Any change to Supabase schema.
- Any change to DOCX / batch / ZIP generation logic.
- History scroll restoration (parked — untouched).

---

## 4. Required Pre-Unlock Checklist

All items must be verified and signed off **before** either flag is flipped:

- [ ] SendGrid sandbox validation passing end-to-end.
- [ ] Owner test send (Section 5) confirmed working to an owner-controlled inbox.
- [ ] Secrets confirmed present only in Supabase Edge Function secrets; no secret
      readable from frontend or repo.
- [ ] Recipient allowlist defined and enforced (owner/test addresses only at first).
- [ ] Dry-run mode confirmed: batch send path executes without dispatching real mail.
- [ ] Per-batch explicit confirmation gate in place (no silent/auto send).
- [ ] Rate / volume caps defined (max recipients per batch, max batches per window).
- [ ] Failure handling verified: `batch_failed` rows recorded correctly, no partial
      double-send.
- [ ] Audit logging verified: each send attempt logged (row, status, timestamp).
- [ ] Rollback procedure (Section 7) tested and documented.
- [ ] Sign-off recorded by owner.

Resend (`EMAIL_ALLOW_FAILED_ROW_RESEND`) stays blocked until controlled batch
send has been validated in production first.

---

## 5. Owner-Only Test Requirements

Before any broader send, testing is restricted to the owner:

- Send only to owner-controlled test inboxes (allowlist enforced).
- Use SendGrid sandbox / test mode where possible before any real dispatch.
- Verify: correct DOCX association per row, correct recipient mapping, correct
  status transitions, no unintended recipients.
- Verify no secrets appear in logs, network payloads visible to frontend, or UI.
- Confirm dry-run produces the same status/log trail as a real send minus dispatch.
- Keep a record of each owner test (date, batch size, result).

---

## 6. Suggested Safe Rollout Stages

Staged, reversible, one gate at a time:

1. **Stage 0 — Dry-run only.** Flags stay `false`. Exercise the full batch path
   in dry-run; confirm status/logging with zero dispatch.
2. **Stage 1 — Owner sandbox send.** SendGrid sandbox mode, owner allowlist only.
3. **Stage 2 — Owner real send (tiny).** Flip `EMAIL_ALLOW_CONTROLLED_BATCH_SEND`
   in a test/staging environment only; owner allowlist; smallest possible batch.
4. **Stage 3 — Controlled limited batch.** Small real batch to a vetted, opted-in
   recipient set, with per-batch confirmation and volume caps.
5. **Stage 4 — Failed-row resend.** Only after Stage 3 is stable, evaluate
   flipping `EMAIL_ALLOW_FAILED_ROW_RESEND`, limited to `batch_failed` rows only.

Do not advance a stage until the previous stage's checklist items pass.

---

## 7. Risks and Rollback Plan

**Key risks:**

- Unintended recipients (mapping / allowlist error).
- Duplicate or double-send on retry.
- Secret exposure in logs, frontend, or repo.
- Volume spike / provider rate limiting or reputation damage.
- Partial batch failure leaving inconsistent row statuses.

**Rollback plan:**

- Immediate kill switch: set `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false` and
  `EMAIL_ALLOW_FAILED_ROW_RESEND=false` in Edge Function secrets — this returns
  the app to the current safe posture with no further sends.
- No schema changes are required to roll back, so rollback is flag-only.
- Preserve audit logs to reconcile which rows were actually dispatched.
- If secret exposure is suspected: rotate SendGrid keys, then re-run the
  pre-unlock checklist before resuming.

Because unlock is gated purely by backend flags, rollback is a single flag flip
and does not touch DOCX/batch/ZIP logic, schema, or the frontend.

---

## 8. Recommended Next Single Milestone

**Milestone: v2.31 — Dry-Run Controlled Batch Send (Stage 0), flags still `false`.**

Build/validate the dry-run path only: exercise the controlled batch send flow
end-to-end with **no real dispatch**, producing the full status transition and
audit-log trail while both safety flags remain `false`. This proves the pipeline
and logging are correct before any real-send flag is ever considered.

Explicitly out of scope for that next milestone: flipping either flag, sending
real email, resend, OAuth, billing, PDF export, schema changes, and History
scroll restoration.

---

*This is a documentation-only planning file. No application code, backend logic,
Supabase schema, DOCX/batch/ZIP logic, Email Prep behavior, or safety flags were
changed to produce it. No git stash was applied or popped. No emails were sent.*
