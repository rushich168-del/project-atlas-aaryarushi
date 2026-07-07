# Project Atlas v2.96 — Paper Editor Canvas UX

**Product:** AR-QUESTION-PRO (Education Suite)
**Direction:** AR-QUESTION-PRO's main flow is now a **direct paper editor**, not a setup form.

## The problem this fixes

Through v2.95.1 the main AR-QUESTION-PRO screen still *felt* like the old
"Question paper setup" grid with a placeholder preview. v2.96 removes the
setup-first experience from the teacher-facing main flow entirely and replaces it
with a single-column **Paper Editor Canvas**.

## Editor-first main flow

For `builderType === 'question-paper'` with the main source (`pasted-material` +
`prepared-paper`), BuilderWorkspace now renders the canvas instead of the classic
two-column setup/preview:

- An **empty editable paper is created up-front** (one Section A, Short answer, 2
  marks, one blank question, default instruction points) so the teacher can start
  editing immediately — no "Create Editable Paper" step, no placeholder preview.
- **Edit Paper / Preview Paper** mode toggle, a **preview style** selector, an
  **Include answer key** toggle, and **Download DOCX / Download Excel** live in a
  compact toolbar.
- **Paste an existing question paper (optional)** is a collapsible import action
  *inside* the editor — paste a section-wise paper and click **Import into
  editor** to replace the current content (teacher text kept exactly as pasted).
- **Advanced options** (collapsed) hold the question-source selector and technical
  fields, so Reference / Notes, the ready question library (starter bank) and the
  Advanced plain-list mode remain reachable — switching source drops back to the
  classic layout for those modes, unchanged.

The old setup grid, placeholder preview, Blueprint Mode, Pattern Preset, Question
Set, Refresh Variant and Question Bank Content are **not shown** in the main flow.

## A. Paper header editor
Editable fields: School / College Name, Paper Title, Class / Grade, Subject, Exam
Type, Duration, **Date**.

## B. Instructions editor
General instructions are now an **array of points** (not one text box). Defaults:
1. Answer all questions.
2. Marks are shown against each question.

Controls: **Add instruction point**, edit each line, **delete** a point. The
points flow into the preview and the DOCX via `blueprint.generalInstructions`.

## C. Section editor
Each section is a card with: title, instruction, **question type**, marks per
question, and a question list (add / edit / delete question, optional answer field
when the answer key is enabled, remove section). One selected question type applies
to all questions in that section.

**Question type options:** MCQ, Fill in the blanks, True/False, Very short answer,
Short answer, Long answer, Case study, Numerical / Problem.

## D. Add section
**Add section** appends a card with safe defaults: next title (Section B/C/D…),
instruction "Answer all questions.", type Short answer, marks 2, one empty question.

## E. Preview styles
- **Classic Exam** — current paper style.
- **Compact** — tighter spacing, more per page.
- **Formal Board** — more formal header (subject line, double rule, wider section
  spacing, boxed instructions).

Preview styles are **preview-only in v2.96** — DOCX output is unchanged. (DOCX
style selection can be added later without risk to the current composer.)

## F. Preview mode
**Edit Paper** to prepare, **Preview Paper** to see the final paper, **Download
DOCX** when ready. Download uses the edited content (rows built from the model).

## Implementation

- `editablePaperModel.js` — added `header.date`, top-level `instructions` array,
  `addInstruction` / `updateInstruction` / `removeInstruction`,
  `createEmptyEditableModel`, expanded `EDITABLE_QUESTION_TYPE_OPTIONS`,
  `PREVIEW_STYLES`, and `blueprint.generalInstructions` in the conversion.
- `EditableQuestionPaper.jsx` — paper header card (with Date), instruction-points
  editor, section cards using the expanded type list.
- `PaperPreview.jsx` — `previewStyle` prop (classic / compact / formal),
  preview-only class presets.
- `questionPaperComposer.js` — **one** additive, backward-compatible change:
  `buildQuestionPaperModel` uses `blueprint.generalInstructions` when present,
  else the legacy computed defaults (every existing caller is unaffected).
- `BuilderWorkspace.jsx` — editor-first canvas branch for the main flow; classic
  layout retained for all other sources and worksheets.

## Limitations (intentional for v2.96)

- Preview styles do not yet change the DOCX (preview-only).
- Question type is per-section (question-level type can come later).
- Reference / Notes and starter-bank modes are reachable via Advanced and are
  unchanged; they still use the classic layout.
- The editable paper is browser-only and not persisted across navigation/restore.

## Validation

```
npm run validate:samples
npm run validate:storage
npm run build
```
All pass. A model↔composer round-trip check confirms edited header, instruction
points, section type/marks and imported paste all flow into the preview/DOCX model,
and that the composer stays backward-compatible when no instruction points are set.
