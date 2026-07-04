# Project Atlas v2.35 — Confirmation Phrase + Pre-Req Flag Hardening Spec

**Document type:** Design specification (documentation only — no code, backend, or schema changes)
**Status:** DESIGN ONLY — nothing here is implemented, enabled, or sent.

> Specifies stricter confirmation-phrase and prerequisite-flag design (hardening
> items **H2 + H3** from v2.32), building on the v2.33 allowlist and v2.34
> server-authoritative readiness specs. Both safety flags remain `false`; no code
> changes in this milestone.

Required flags (unchanged):

```text
EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false
EMAIL_ALLOW_FAILED_ROW_RESEND=false
```

---

## 1. Purpose

Make the human-confirmation and prerequisite gates strong, explicit, and
non-guessable before any real send is unlocked. Confirmation phrases should not be
predictable defaults, and the safety prerequisites (dry-run completed, owner test
completed) should be **required by default**, not optional toggles.

---

## 2. Current Confirmation Phrase Risk

From the v2.31 audit (risk #3), observed in the send Edge Functions:

- Controlled batch uses `DEFAULT_CONFIRMATION_PHRASE = 'SEND 5 TEST EMAILS'`.
- Failed-row resend uses the phrase `RESEND FAILED ROWS`.
- Both are overridable via env (`EMAIL_BATCH_SEND_CONFIRMATION_PHRASE`), but the
  **defaults are hardcoded and publicly knowable** (they appear as UI placeholders
  and in the repo).

Risk (future): if a send flag were flipped while the default phrase is still in
effect, the phrase gate adds little protection because the phrase is guessable.

---

## 3. Current Prerequisite Flag Risk

From the v2.31 audit (risk #6):

- `EMAIL_BATCH_SEND_DRY_RUN_REQUIRED` and `EMAIL_OWNER_TEST_REQUIRED` are only
  enforced when explicitly set to `'true'`.
- If unset, the corresponding precondition is **not** enforced by the backend —
  the safety expectation ("must dry-run first", "must owner-test first") is
  opt-in rather than default-on.

Risk (future): an unlock performed without these set could bypass the intended
dry-run-then-owner-test-then-batch sequence.

---

## 4. Proposed Non-Default Confirmation Phrase Behavior

- **Reject known defaults.** When a send flag is enabled, the backend must refuse
  to send if the active confirmation phrase equals a known default
  (`SEND 5 TEST EMAILS`, `RESEND FAILED ROWS`) — force operators to set a custom one.
- **Secret, non-guessable phrases.** Real phrases live only in Edge Function
  secrets (`EMAIL_BATCH_SEND_CONFIRMATION_PHRASE`, resend equivalent), are not shown
  in the UI as the literal expected value, and are not committed to the repo.
- **Exact match, normalized.** Compare after trim; require exact match (case
  policy documented). Empty/whitespace phrase → blocked.
- **Distinct phrases per action.** Controlled batch and resend must use different
  phrases so one cannot authorize the other.
- **No client trust.** The phrase is validated server-side; the client only submits
  the operator's typed input.

---

## 5. Proposed Prerequisite Flags

Preconditions become **required by default** (fail-closed if unset):

| Flag | Proposed default posture | Meaning |
|------|--------------------------|---------|
| `EMAIL_BATCH_SEND_DRY_RUN_REQUIRED` | treated as `true` unless explicitly `false` | A saved dry-run must exist before controlled batch send |
| `EMAIL_OWNER_TEST_REQUIRED` | treated as `true` unless explicitly `false` | A successful owner test must precede controlled batch send |
| `EMAIL_RESEND_DRY_RUN_REQUIRED` (new) | `true` by default | Resend requires the originating batch context |
| `EMAIL_BATCH_SEND_CONFIRMATION_PHRASE` | must be set + non-default | Custom phrase required to send |
| `EMAIL_RESEND_CONFIRMATION_PHRASE` (new/explicit) | must be set + non-default | Custom resend phrase required |

Design intent: the **absence** of a prerequisite flag means "enforce the safe
precondition", never "skip it". Disabling a precondition must be an explicit,
audited `=false`.

---

## 6. Owner / Test Send Requirements

- Owner test continues to send one email to the owner/test address only, behind
  `window.confirm`, and (per v2.33) the owner/test target must be allowlisted.
- Owner test does **not** require the controlled-batch confirmation phrase, but its
  success is a **prerequisite** for controlled batch when `EMAIL_OWNER_TEST_REQUIRED`
  is in effect (now default-on).
- Server-authoritative readiness (v2.34) must hold before the owner test dispatches.

---

## 7. Controlled Batch Send Requirements

Remains **blocked** while `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false`. When staged,
the controlled-batch gate must require, server-side, in order:

1. `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=true` (flag).
2. Provider/secret config present.
3. **Non-default** confirmation phrase, exact match.
4. Dry-run prerequisite satisfied (default-on).
5. Owner-test prerequisite satisfied (default-on).
6. Recipient allowlist satisfied (v2.33).
7. Server-authoritative `sendReady` (v2.34).
8. Count/attachment caps (≤5, DOCX only).

Any failure → `batch_blocked` with a specific `blockedReasons` entry; no dispatch.

---

## 8. Failed-Row Resend Requirements

Remains **blocked** while `EMAIL_ALLOW_FAILED_ROW_RESEND=false`. When staged:

- Scope stays limited to `batch_send_status = 'batch_failed'` rows only.
- Requires its own **non-default** resend confirmation phrase (distinct from batch).
- Requires resend prerequisites (originating batch context), allowlist, and
  server-authoritative readiness before any dispatch.
- Validated only **after** controlled batch send is proven in production.

---

## 9. UI Messaging Requirements

- The UI must **not** display the literal expected confirmation phrase as the
  authoritative value; placeholder hints (if any) must be clearly non-binding and
  must not reveal the secret phrase.
- Blocked-by-default-phrase and missing-prerequisite results render clear,
  non-alarming messages consistent with existing "No emails were sent" copy.
- No secrets, flag values, phrases, or allowlist contents are rendered in the
  frontend or logs.
- Real-send controls stay visibly distinct from sandbox/owner-test; no fail-open
  copy on any dispatch-capable path.

---

## 10. Backend Validation Requirements

- Phrase and prerequisite checks run **server-side only**, inside the send Edge
  Functions, before any SendGrid dispatch.
- Reject-default-phrase, prerequisite-default-on, and exact-match logic are
  authoritative; client-supplied claims are ignored.
- Emit machine-readable error codes (e.g. `confirmation_phrase_default_blocked`,
  `dry_run_required`, `owner_test_required`, `confirmation_phrase_required`) into
  the summary and audit log — without logging the phrase itself.
- Integrates with the existing guard order (flag → config → **phrase/prereqs** →
  allowlist → readiness → caps → dispatch).

---

## 11. Validation Checklist

Sign-off required before relying on these gates for any unlock:

- [ ] Known default phrases are rejected when a send flag is enabled.
- [ ] Custom phrases live only in Edge Function secrets; never rendered as the
      literal expected value; never in repo.
- [ ] Empty/whitespace phrase is blocked.
- [ ] Controlled batch and resend use distinct phrases; neither authorizes the other.
- [ ] Missing `EMAIL_BATCH_SEND_DRY_RUN_REQUIRED` / `EMAIL_OWNER_TEST_REQUIRED`
      enforces the precondition (fail-closed), not skips it.
- [ ] Disabling a precondition requires an explicit, audited `=false`.
- [ ] Phrase/prereq checks are server-side; forged client input cannot bypass them.
- [ ] Error codes/messages emitted without leaking the phrase.
- [ ] Flag `false` always yields blocked regardless of phrase/prereqs.
- [ ] Dry-run end-to-end still reports `safetyFlagStatus: 'blocked'` with flags `false`.
- [ ] Build PASS; all 19 flows still PASS (no regression).
- [ ] Owner sign-off recorded.

---

## 12. Rollback Plan

- **Relax prerequisite enforcement:** an explicit, audited `=false` on a
  precondition reverts to prior behavior — but the send flags remain the ultimate
  backstop and stay `false`.
- **Full send kill switch (unchanged):** `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false`
  and `EMAIL_ALLOW_FAILED_ROW_RESEND=false` block all sends regardless of phrase or
  prerequisites.
- Rollback is **flag/secret-only**: no schema change, no DOCX/batch/ZIP/History or
  frontend change required to revert.
- Preserve audit logs to reconcile phrase/prereq decisions vs. actual dispatch.

---

## 13. Recommended Next Single Milestone

**Milestone: v2.36 — Volume/Rate Caps + Audit Logging Design Spec (H5 + H6), flags stay `false`.**

With allowlist (v2.33), server-authoritative readiness (v2.34), and phrase/prereq
hardening (v2.35) designed, spec the remaining backend safety layer: explicit
per-batch and per-window volume/rate caps, plus structured audit logging (row id,
recipient hash, status, flag state, timestamp) with no secret/full-PII leakage.
Design only — no code change, no flag flip, no email sent.

Out of scope for that milestone: implementing any hardening item, flipping either
flag, real sends, OAuth, billing, PDF export, schema changes, DOCX/batch/ZIP/History
logic, and History scroll restoration.

---

*Documentation-only design spec. No application code, backend/Edge Function code,
Supabase schema, DOCX/batch/ZIP/History logic, or Email Prep behavior was changed.
No safety flags were enabled. No emails were sent. No secrets were exposed. No git
stash was applied or popped.*
