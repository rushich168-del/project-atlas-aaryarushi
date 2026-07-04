# Project Atlas v2.29 — Demo Release Snapshot

**Snapshot date:** 2026-07-05
**Document type:** Official demo release snapshot (documentation only — no code, backend, or schema changes)

---

## 1. Release Status

**Status: DEMO-READY ✅**

Project Atlas v2.29 is a documentation snapshot of the demo-ready build carried
forward from v2.28 / v2.28.1.

- v2.28 — manual browser demo passed.
- v2.28.1 — polished the highlighted teal button sizing.
- Build passed after the button-sizing polish.
- No application, backend, or schema changes were made for v2.29; this release
  captures the current verified state as an official snapshot.

---

## 2. Completed Working Features

All of the following are confirmed working in the current build:

| # | Feature | Status |
|---|---------|--------|
| 1 | Landing page | ✅ Working |
| 2 | Login / dashboard | ✅ Working |
| 3 | Product suite dashboard | ✅ Working |
| 4 | AR-CERT-PRO workspace | ✅ Working |
| 5 | Demo CSV upload | ✅ Working |
| 6 | Field auto-mapping | ✅ Working |
| 7 | Preview row | ✅ Working |
| 8 | Single DOCX generation | ✅ Working |
| 9 | Batch DOCX generation (5 rows) | ✅ Working |
| 10 | History download | ✅ Working |
| 11 | Batch details | ✅ Working |
| 12 | Batch ZIP download | ✅ Working |
| 13 | Email Prep safety / readiness panels | ✅ Working |

---

## 3. Demo Validation Result

**Result: PASSED ✅**

- The v2.28 manual browser demo passed end-to-end.
- The v2.28.1 UI polish (highlighted teal button sizing) was applied and the
  build passed afterward.
- The full demo path was exercised: landing → login/dashboard → product suite →
  AR-CERT-PRO workspace → CSV upload → auto-mapping → preview → single DOCX →
  batch DOCX (5 rows) → History download → batch details → batch ZIP download →
  Email Prep panels.
- The current app is demo-ready.

---

## 4. Safety State

The build is in a **safe, locked-down demo posture**:

- Controlled batch send is **blocked**.
- Failed-row resend is **blocked**.
- **No real batch emails are sent** during the demo.
- Email Prep exposes only the safety / readiness panels — sending remains disabled.
- No secrets are exposed.

---

## 5. Known Parked Issue

- **History scroll restoration** — parked. Scroll position on the History view is
  not restored on return. This is a known, intentionally deferred item and does
  not affect demo functionality. It is left untouched in this release.

---

## 6. What Is Intentionally Not Included Yet

The following are deliberately **out of scope** for this snapshot:

- Controlled batch sending (kept disabled).
- Failed-row resend (kept disabled).
- Real email delivery of any kind.
- PDF export.
- OAuth.
- Billing.
- History scroll restoration fix (parked).

---

## 7. Recommended Next Milestone

**Milestone: Controlled Batch Send — gated enablement (behind explicit safety controls).**

Rationale: the demo has proven the full generation-and-packaging path (CSV →
mapping → preview → single/batch DOCX → ZIP → History) and the Email Prep
safety/readiness panels. The natural next step is to move Email Prep from
"panels only" toward an actual controlled send — but only behind explicit
safeguards, staged rollout, and confirmation gating, so the current safe posture
is preserved until sending is deliberately and verifiably enabled.

Suggested sequencing for the next milestone:
1. Define send guardrails (dry-run mode, per-batch confirmation, recipient allowlist).
2. Enable controlled batch send in a gated/test-only environment first.
3. Add failed-row resend only after controlled send is validated.
4. Address the parked History scroll restoration as a low-risk UX cleanup.

---

*This is a documentation-only snapshot. No application code, backend logic,
Supabase schema, DOCX/batch/ZIP/History logic, or Email Prep behavior was
changed to produce it.*
