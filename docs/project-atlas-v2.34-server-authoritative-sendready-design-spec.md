# Project Atlas v2.34 — Server-Authoritative SendReady Design Spec

**Document type:** Design specification (documentation only — no code, backend, or schema changes)
**Status:** DESIGN ONLY — nothing here is implemented, enabled, or sent.

> Specifies moving `sendReady` from frontend-trusted / client-fallback behavior to
> server-authoritative validation (hardening item **H4** from v2.32). Both safety
> flags remain `false`; no code changes in this milestone.

Required flags (unchanged):

```text
EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false
EMAIL_ALLOW_FAILED_ROW_RESEND=false
```

---

## 1. Purpose

Ensure that "this batch is ready to send" is decided **only** by the server, so no
client-computed or forged value can gate a real send. This removes the client-trust
risk in the current readiness flow before controlled batch sending is ever unlocked.

---

## 2. Current SendReady Risk

From the v2.31 audit (risk #2), observed in `EmailPreparationPanel.jsx`
(`handleCheckSendReadiness`):

- The primary path calls the `email-delivery-dry-run` Edge Function and uses its
  returned `edgeFunctionSummary.sendReady`.
- **But** an offline/undeployed **fallback** synthesizes a summary on the client:
  ```
  sendReady: validSavedRecipients > 0   // computed in the browser
  fallback: true
  ```
- Downstream gates (`sandboxValidationAvailable`, `ownerTestAvailable`,
  `controlledBatchGateAvailable`) all key off `edgeFunctionSummary.sendReady`.

Today this is safe because the real send flags are `false` and the backend gate is
independently authoritative. The risk is **future**: if a flag is flipped, a
client-derived `sendReady` (or a tampered response) must never be sufficient to
authorize dispatch. `sendReady` must mean the same thing everywhere, and only the
server may assert it.

---

## 3. Proposed Server-Authoritative Behavior

- **Single source of truth.** Only an Edge Function may compute and assert
  `sendReady`. The real-send gate recomputes readiness server-side at send time and
  ignores any client-supplied `sendReady` / `fallback` in the request body.
- **No client fallback for authorization.** The client fallback summary may still
  exist for *display* (so the UI degrades gracefully when a function is undeployed),
  but it must be clearly marked non-authoritative and can **never** unlock a real
  send.
- **Re-validation at dispatch.** Even if a prior readiness check returned ready, the
  controlled-batch / resend function re-derives readiness against current server
  state (job exists, rows prepared, recipients valid, allowlist satisfied, flag
  enabled) immediately before sending.
- **Fail-closed.** Any ambiguity, missing data, or mismatch → `sendReady = false`
  → blocked.

---

## 4. Required Backend Validation Fields

The authoritative readiness result (returned by the Edge Function, recomputed at
send time) should express, at minimum:

| Field | Meaning |
|-------|---------|
| `sendReady` | Server's final boolean; the only value any gate may trust |
| `authoritative` | `true` only when produced server-side (client fallback = `false`) |
| `emailDeliveryJobId` | Job the decision applies to (must match request) |
| `totalRecipients` | Count the server actually evaluated |
| `preparedCount` | Server-validated valid recipients |
| `flagState` | `EMAIL_ALLOW_CONTROLLED_BATCH_SEND` / resend flag as seen server-side |
| `allowlistState` | Result of the v2.33 allowlist gate (e.g. `enforced` / `off`, blocked count) |
| `blockedReasons[]` | Machine-readable reasons readiness is false (per stage) |
| `checkedAt` | Server timestamp of the evaluation |

The controlled-batch/resend gate must treat **its own** recomputation — not a
passed-in summary — as final.

---

## 5. Required Frontend Display Behavior

- The UI may display `sendReady` for information, but must visually distinguish
  **authoritative** (`authoritative: true`) from **fallback/degraded**
  (`authoritative: false`, undeployed path).
- A fallback/degraded readiness must **not** enable any real-send control; at most
  it enables sandbox/owner-test which are themselves independently gated
  server-side.
- The frontend never sends a `sendReady`/`fallback` value expecting the backend to
  trust it; if such fields are sent, the backend ignores them (documented contract).
- No secrets, flag values, or allowlist contents are rendered — only derived,
  safe status labels (consistent with existing "No emails were sent" copy).

---

## 6. Relationship With Sandbox Validation

- Sandbox validation continues to require a saved job and readiness, but its own
  Edge Function remains the authority for sandbox outcomes (`sandbox_validated` /
  `sandbox_failed` / `blocked`) and reports 0 real emails.
- A client-fallback `sendReady` may surface the "Validate Sandbox Send" affordance,
  but sandbox itself performs no real delivery, so this remains safe. Server-side,
  sandbox results feed the authoritative readiness (all prepared rows validated).

---

## 7. Relationship With Owner / Test Send

- Owner test stays gated on all prepared rows being sandbox-validated and on
  `window.confirm`, and sends one email to the owner/test address only.
- Under this spec, the owner-test function should also confirm authoritative
  readiness server-side before sending its single email, and honor the v2.33
  allowlist for the owner/test target. Client `sendReady` alone is not sufficient.

---

## 8. Relationship With Controlled Batch Send

- Remains **blocked** while `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false`; this spec
  does not unlock anything.
- When eventually staged: the controlled-batch function recomputes `sendReady`
  server-side (job/rows/recipients/allowlist/flag) and ignores any client value.
  If server `sendReady` is false → `batch_blocked` with a `blockedReasons` entry.
- Ordering: authoritative readiness sits alongside the existing gate sequence
  (flag → config → confirmation phrase → owner-test-required → allowlist → caps);
  it is the server's own precondition, never a client hand-off.

---

## 9. Relationship With Failed-Row Resend

- Remains **blocked** while `EMAIL_ALLOW_FAILED_ROW_RESEND=false`.
- Scope stays limited to `batch_send_status = 'batch_failed'` rows only.
- The resend function likewise recomputes readiness server-side for the eligible
  failed rows and applies the allowlist before any dispatch. Validated only after
  controlled batch send is proven in production.

---

## 10. Failure States and User Messages

Fail-closed; messages must be accurate and non-alarming (no fail-open copy on any
dispatch-capable path):

| State | Server outcome | Suggested message |
|-------|----------------|-------------------|
| No saved job | `sendReady=false` | "Save Email Prep first to check send readiness." |
| Function undeployed | fallback, `authoritative=false` | "Send readiness check is not deployed yet. Email prep is saved, and no emails were sent." |
| Rows not prepared / invalid | `sendReady=false`, `blockedReasons` | "Some rows are not ready. No emails were sent." |
| Flag disabled (expected) | `flagState=blocked` | "Real batch sending is locked by a safety flag. No emails were sent." |
| Allowlist blocks recipients | `allowlistState` blocked count | "Some recipients are not on the approved allowlist. No email sent to them." |
| Job/response mismatch | `sendReady=false` | "Readiness could not be confirmed. No emails were sent." |

---

## 11. Validation Checklist

Sign-off required before authoritative `sendReady` is relied upon for any unlock:

- [ ] Only Edge Functions can produce `authoritative: true` readiness.
- [ ] Controlled-batch/resend recompute `sendReady` server-side and ignore client value.
- [ ] A forged/elevated client `sendReady` or `fallback:true` cannot trigger a real send.
- [ ] Fallback/degraded readiness never enables a real-send control in the UI.
- [ ] `blockedReasons[]` correctly explains every false readiness.
- [ ] Flag `false` always yields blocked regardless of readiness value.
- [ ] Allowlist state is reflected in readiness (integrates v2.33).
- [ ] No secrets/flag values/allowlist contents rendered in frontend or logs.
- [ ] Dry-run end-to-end still reports `safetyFlagStatus: 'blocked'` with flags `false`.
- [ ] Build PASS; all 19 flows still PASS (no regression).
- [ ] Owner sign-off recorded.

---

## 12. Rollback Plan

- **Revert to prior readiness contract:** since this is additive server validation,
  rollback means the server simply stops requiring its own recomputation — but the
  ultimate backstop remains the send flags, which stay `false`.
- **Full send kill switch (unchanged):** `EMAIL_ALLOW_CONTROLLED_BATCH_SEND=false`
  and `EMAIL_ALLOW_FAILED_ROW_RESEND=false` block all sends regardless of readiness.
- Rollback is **flag/secret-only**: no schema change, no DOCX/batch/ZIP/History or
  frontend change required to revert.
- Preserve audit logs to reconcile readiness decisions vs. actual dispatch.

---

## 13. Recommended Next Single Milestone

**Milestone: v2.35 — Confirmation-Phrase & Pre-Req Flag Hardening Design Spec (H2 + H3), flags stay `false`.**

With allowlist (v2.33) and server-authoritative readiness (v2.34) designed, spec the
next hardening layer: enforce `EMAIL_BATCH_SEND_DRY_RUN_REQUIRED=true` and
`EMAIL_OWNER_TEST_REQUIRED=true` as hard preconditions, and require secret,
non-default confirmation phrases. Design only — no code change, no flag flip, no
email sent.

Out of scope for that milestone: implementing readiness/allowlist/phrase changes,
flipping either flag, real sends, OAuth, billing, PDF export, schema changes,
DOCX/batch/ZIP/History logic, and History scroll restoration.

---

*Documentation-only design spec. No application code, backend/Edge Function code,
Supabase schema, DOCX/batch/ZIP/History logic, or Email Prep behavior was changed.
No safety flags were enabled. No emails were sent. No secrets were exposed. No git
stash was applied or popped.*
