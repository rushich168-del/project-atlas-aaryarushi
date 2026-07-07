# Project Atlas v2.92 — Teacher Material Source Foundation

AR-QUESTION-PRO now lets a teacher choose **where the question text comes from**,
separately from the paper structure (sections, marks, difficulty). This is an
additive foundation: the Starter Question Bank remains the default and behaves
exactly as in v2.91.

## Source modes added

The question source is chosen with the new **Question source** selector, placed
near the top of the Question Paper setup (before Blueprint Mode):

1. **Starter Question Bank** (default) — uses the available built-in starter
   questions, with the existing Question Set (A/B/C) and Refresh Variant (1–5)
   controls. Unchanged from v2.91.
2. **Teacher Pasted Material** — uses questions the teacher pastes, one per line.
3. **Teacher Reference / Topic** — creates original practice placeholders based on
   the selected topic/chapter and blueprint, for teacher review.

`pdf-upload` exists in the data model as a **reserved** mode only. It is **not**
shown in the UI in v2.92 (see "Why PDF upload is deferred").

### Row/column additions

Every generated row now carries:

- `QuestionSource` — now one of `question-bank`, `placeholder`, `teacher-material`,
  `reference-topic`.
- `SourceLabel` — human label: `Starter bank`, `Placeholder`, `Teacher material`,
  `Practice`.
- `TeacherProvided` — `Yes` / `No`.

## Pasted material behavior

- Parsed by `parseTeacherPastedQuestions(text)` in
  `src/features/document-workspace/question-bank/teacherMaterialSource.js`.
- Pure and deterministic: no dependencies, no Supabase, no network, no browser
  storage, no secrets. The same pasted text always yields the same questions.
- One line = one question. Blank lines are dropped.
- Common numbering prefixes are stripped: `1.`, `1)`, `(1)`, `Q1.`, `Q1)`,
  `Question 1:`.
- Questions fill section slots in **paste order**. When the teacher runs out of
  pasted questions, remaining slots use labelled placeholders.
- **Answers are not parsed in v2.92.** With an answer key enabled, teacher rows
  show `[Teacher to add answer]`.
- Pasted text is treated strictly as teacher-provided content and is **not stored
  anywhere** — it lives only in the form value for the current session.

## Reference / topic behavior

- Optional inputs: reference/book name, reference chapter/unit, and personal
  notes/instructions. These are labels/notes only.
- Generates original practice placeholder rows, e.g.
  *"Original practice question - based on Integers. Review and finalize before
  classroom use."*
- If reference metadata is missing, honest practice placeholders are still created
  from the selected topic/chapter.
- The app never copies or reproduces book/reference-book questions and makes no
  claim of AI or full-syllabus understanding.

## Why PDF upload is deferred

- Browser PDF text extraction requires a large dependency (`pdfjs-dist`) plus
  worker/build configuration — build-size and build-risk we are avoiding now.
- Extraction quality on scanned or multi-column papers is unreliable.
- Uploaded PDFs are frequently protected material; a permission gate is required
  first.
- Planned for a later version, feeding extracted text into the same pasted-material
  pipeline, with a clear "upload only material you have permission to use" gate.

## Copyright-safe wording

- No "random questions" language anywhere in the teacher-facing UI.
- Reference mode always presents **original practice** questions for **teacher
  review**, never copied book content.
- No claims of AI syllabus intelligence or board coverage beyond the actual starter
  bank.

## Limitations

- Only the existing Class 6 Mathematics — Integers starter bank has real questions.
- Pasted material is line-based; multi-line questions and answer parsing are not
  supported yet.
- Reference/topic output is intentionally placeholder-style for teacher review.
- The DOCX composer/layout is unchanged; source labels appear in the on-screen
  preview badges and the Data view, not printed into the DOCX.

## Validation commands

```
npm run validate:samples
npm run validate:storage
npm run build
```

Manual smoke check: Starter Question Bank still works; Teacher Pasted Material uses
pasted lines; Reference / Topic creates labelled original practice placeholders;
Teacher Blueprint and Pattern Preset still work; preview badges show correctly;
DOCX download still works.
