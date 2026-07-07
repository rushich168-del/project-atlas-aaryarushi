# Project Atlas v2.95 — Editable Question Paper Preview Foundation

**Product:** AR-QUESTION-PRO (Education Suite)
**Scope:** Foundation only. First working version of a directly-editable question paper for the "I already have questions" flow.

## Goal

Give teachers who already have a section-wise paper the simplest possible path:

1. Paste your section-wise question paper.
2. Click **Create Editable Paper**.
3. Edit the header, sections, and questions directly.
4. Download the DOCX from the live preview.

No blueprint setup, no confusing form-first screen. The editor feels like editing
the actual paper, not filling in a configuration form.

## What was built

- **New model helper** `src/features/document-workspace/builder/editablePaperModel.js`
  - `createEditableModelFromForm(form)` — builds an editable model from the pasted
    paper using the existing v2.94 `parsePreparedQuestionPaper`. If no `SECTION`
    headers exist, every line is kept as one question in a single Section A
    (teacher text is never lost) and an honest notice is returned.
  - Immutable updaters: `updateHeaderField`, `updateSectionField`,
    `updateQuestionField`, `addQuestion`, `deleteQuestion`, `addSection`,
    `removeSection` (keeps at least one section).
  - Conversion back to the **existing generated-row shape**:
    `editableModelToRows`, `editableModelToBlueprint`, `buildEditableResult`,
    and `editableModelToForm` (merges the edited header over the builder form).
  - Question source stays `teacher-material` / **"Your question"** for every row.
- **New editor component** `src/features/document-workspace/builder/EditableQuestionPaper.jsx`
  - Paper details card (school/college, title, class, subject, exam type,
    duration, general instructions).
  - One card per section: title, instruction, question type, marks per question,
    a numbered editable-question list, **+ Add question**, **Remove section**, and
    per-question **delete**.
  - **+ Add section** at the bottom.
  - Optional per-question answer field, shown only when "Add answer key" is on.
- **Wiring** in `src/features/document-workspace/builder/BuilderWorkspace.jsx`
  - New local state `editableModel` (browser-only; not persisted).
  - **Create Editable Paper** button in the prepared-paper simple flow, and
    **Start over (re-paste)** while editing.
  - When the editable paper is active it becomes the single source for the
    preview and both DOCX/Excel downloads via `buildEditableResult` +
    `editableModelToForm`. The `PaperPreview` and `questionPaperComposer` are
    **unchanged** — they consume the same rows/header they always did.

## Design decision: least-risky path

The DOCX composer reads the **header from the form** and the **questions from the
rows**. So the editable model is converted back into (a) the same rows shape the
v2.94 prepared-paper generator produced, and (b) a form-like header object. This
keeps `PaperPreview.jsx` and `questionPaperComposer.js` untouched while edits flow
into both the on-screen preview and the downloaded `.docx`.

## Behavior notes / limitations (intentional for the foundation)

- Only the **"I already have questions" + Section-wise paper** combination opens
  the editor. Plain-question-list (Advanced) and Reference / Notes flows are
  **unchanged**.
- No drag/drop, no question reordering, no PDF upload, no AI, no backend, no
  storage. Editable state lives only in the browser and is discarded on
  **Start over** or when the question source changes.
- Editing the paste box after creating a paper does not auto-re-parse; use
  **Start over (re-paste)** to rebuild from the paste.
- Reference / Notes mode does **not** yet open the editor (deferred to keep v2.95
  safe and focused).

## Validation

- `npm run validate:samples` → PASS (8 products, 0 failing checks)
- `npm run validate:storage` → PASS (8 products, 0 failing checks)
- `npm run build` → success
- Model round-trip smoke test: parse → edit text / add / delete / change
  marks+type / add section / edit header → rows, totals, and "Your question"
  labels all reflect the edits; fallback (no headers) preserves all text; the
  remove-section guard keeps at least one section.
