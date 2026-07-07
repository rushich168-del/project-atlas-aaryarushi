# Project Atlas v2.93 — Material-to-Draft Question Generator

AR-QUESTION-PRO's **Teacher Reference / Topic** mode now turns a teacher's pasted
chapter notes/material into **varied draft practice questions for teacher review**,
instead of one repeated generic line.

## What changed

- **New pure helper** `createDraftQuestionsFromMaterial(...)` in
  `src/features/document-workspace/question-bank/teacherMaterialSource.js`.
  Deterministic, rule-based, no dependencies/AI/network/storage/secrets.
- **New dedicated input** `referenceMaterial` — *"Paste chapter notes / material"* —
  is the primary source. If empty, the generator falls back to the existing
  *"Notes / instructions for yourself"* box so a teacher who pasted there still gets
  drafts.
- Reference-topic rows are now labelled **Draft** (`QuestionSource: reference-topic`,
  `SourceLabel: Draft`, `TeacherProvided: No`).
- Preview badge for reference-topic changed from **Practice** to **Draft**.
- The setup summary now shows **Draft questions: N** and **Fallback drafts: M** for
  reference-topic mode, instead of Bank/Placeholder counts.

## How Teacher Reference / Topic works now

1. The teacher selects **Teacher Reference / Topic** and pastes notes/material
   (one point per line works best). Optional reference book/chapter and self-notes
   are labels only.
2. The blueprint (sections, marks, difficulty, question types) is built exactly as
   before — Pattern Preset and Teacher Blueprint both work.
3. One draft is generated per question slot, aligned to that slot's question type:
   - **Short answer:** "Define {term}.", "Write a short note on {term}.",
     "Explain the meaning of '{term}' with one example.", or a factual
     "Who introduced the concept of {topic}?" when a name is present.
   - **Long answer:** "Explain {term} in detail with suitable examples." /
     "Discuss {topic} with examples."
   - **Fill in the blanks:** a statement with an important word replaced by ______.
   - **True/False:** "State whether the following statement is true or false:
     {statement}."
   - **MCQ:** "Which of the following best describes {term}? (Teacher to complete
     options.)"
4. Terms/statements are rotated by question type and immediate duplicates are
   avoided. When the material can't supply a real draft, an honest fallback draft is
   used.

## What "draft questions" mean

Draft practice questions are **starting points for teacher review**, generated from
the teacher's own material. They are **not** claimed to be final, perfect, or
board-aligned, and they are **not** copied from any book.

## Answer-key limitation

Answers are conservative and draft-only:

- Fill in the blanks → the removed word (when safely extracted).
- True/False → "True" only when taken directly from a source statement.
- Who/date factual → an extracted name/year when available.
- MCQ / Short / Long / anything uncertain → **"[Teacher to add/verify answer]"**.

The app does not claim answer correctness. Verify every answer before use.

## MCQ limitation

MCQ options are **not** auto-generated in v2.93. MCQ drafts end with
"(Teacher to complete options.)".

## Copyright-safe wording

- Draft practice questions, based on teacher-provided material.
- Teacher review required; original questions for review.
- Not copied book questions. Reference book name is context/label only.
- No claims of AI, full-syllabus intelligence, or board/book coverage.

## What remains limited

- Rule-based extraction: quality depends on the pasted material; short material
  yields fallback drafts.
- One draft per slot; no cross-question deduplication of concepts beyond immediate
  repeats.
- MCQ options and most answers are left for the teacher.
- DOCX composer/layout is unchanged; draft text/answers flow through the existing
  `QuestionText`/`Answer` fields. No PDF upload, no AI/backend.

## Validation commands

```
npm run validate:samples
npm run validate:storage
npm run build
```
