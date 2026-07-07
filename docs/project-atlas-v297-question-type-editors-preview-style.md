# Project Atlas v2.97 — Question Type Editors and Preview Style Fix

**Product:** AR-QUESTION-PRO (Education Suite)
**Type:** Editor polish on top of the v2.96 Paper Editor Canvas (no rewrite).

## What was fixed / built

### 1. MCQ editor
When a section's type is **MCQ**, the question shows:
- a question-stem box,
- separate **Option A / B / C / D** inputs,
- an **Options layout** toggle: **Vertical** (default) or **Horizontal**.

The preview reflects the layout: vertical = options stacked one per line; horizontal
= options in a wrapping inline row. A plain imported MCQ keeps its text with blank
options (falls back to plain text until options are filled).

### 2. Fill in the blanks editor
When a section's type is **Fill in the blanks**, the question shows:
- **Text before the blank**,
- **Blank size** toggle: Small / Medium / Large,
- **Text after the blank**.

The preview shows a real underline blank (width by size) between the before/after
text. Switching a section to this type **seeds** before/after from the existing
question text (splitting on the first `______` run) so nothing is lost; imported
blanks are split the same way.

### 3. True/False editor
When a section's type is **True/False**, the question shows a statement box and a
hint. The preview shows the statement with **True / False** beneath it.

### 4. Short / Very short / Long / Case study / Numerical
Keep the simple text box, plus the optional answer field when the answer key is on.

### 5. Preview style fix
- The **Classic / Compact / Formal Board** selector now sits in the **Preview
  Paper** panel header, directly above the rendered paper, so its effect is
  obvious (it was previously easy to miss in the top toolbar).
- The three styles are now clearly distinct:
  - **Classic** — current exam style.
  - **Compact** — smaller text, tighter leading, reduced spacing/padding.
  - **Formal Board** — serif typography, centered subject line, double header rule,
    wider section-title tracking, more section spacing.

## Model changes (backward-compatible)

`editablePaperModel.js` — each question now carries optional per-type fields:
`options {A,B,C,D}`, `mcqLayout`, `blankBefore`, `blankAfter`, `blankSize`. Old
text-only questions still work (fields default to empty / sensible values). New
helpers: `updateQuestionOption`, expanded `updateQuestionField`, plus exports
`MCQ_OPTION_KEYS`, `MCQ_LAYOUTS`, `BLANK_SIZES`, `BLANK_UNDERSCORES`.

## Conversion → rows (DOCX-safe)

`editableModelToRows` composes a single-line, DOCX-safe `QuestionText`:
- **MCQ:** `stem   (A) …   (B) …   (C) …   (D) …` (inline — the DOCX renders one
  paragraph per question, so options are baked in and always readable).
- **Fill in the blanks:** `before ______ after` with underscore length by size
  (small `______`, medium `____________`, large `____________________`).
- **True/False:** `statement (True / False)`.

Each row also carries an optional `structured` payload (options / blank / true-false)
used **only by the on-screen preview**. The DOCX composer ignores it and renders
`QuestionText`, so the DOCX is correct without composer logic changes.

## DOCX safety

`questionPaperComposer.js` received **one** additive, backward-compatible line:
`buildQuestionPaperModel` passes `row.structured` through to the preview question
object. The DOCX generation path is unchanged and still renders `QuestionText`.

## Limitations (intentional for v2.97)

- The DOCX shows MCQ options **inline** (the composer renders one paragraph per
  question); vertical/horizontal layout affects the **preview only**.
- Preview styles remain **preview-only**; the DOCX styling is unchanged.
- MCQ "correct option" uses the shared optional answer field (shown when the answer
  key is enabled); there is no separate correct-option picker yet.
- Question type is per-section (all questions in a section share its type).

## Validation

```
npm run validate:samples
npm run validate:storage
npm run build
```
All pass. A model↔composer round-trip check confirms MCQ (inline text + structured
layout), Fill-in-the-blank (before/size/after + real underscores), True/False
(suffix + structured), import splitting, the no-options fallback, and the composer
passthrough.
