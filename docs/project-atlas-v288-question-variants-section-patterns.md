# Project Atlas v2.88 - Question Variants and Section Pattern Foundation

## What Was Added

Project Atlas v2.88 improves AR-QUESTION-PRO with two controlled foundations:

- Deterministic question sets: Set A, Set B, and Set C.
- Section pattern presets for more exam-like papers.

The feature stays local/static and browser-safe. It does not add network calls, database question banks, or hidden random behavior.

## Question Set Behavior

Teachers can choose:

- Set A
- Set B
- Set C

The same setup with the same set produces the same paper. A different set rotates the available starter-bank questions in a deterministic way when enough matching questions exist.

The generator does not duplicate real starter-bank questions in v2.88. If the bank does not contain enough unique matches, the remaining rows use labelled placeholders.

## Section Pattern Behavior

Teachers can choose:

- Simple / Current Pattern
- Balanced Exam Pattern
- MCQ + Short Answer + Long Answer
- Short Answer + Long Answer

Simple / Current Pattern preserves the v2.87 global paper controls:

- Number of sections
- Questions per section
- Marks per question
- Question type
- Difficulty mix

The other presets use fixed section-level settings for question type, count, marks, and difficulty. The generator computes total marks from the actual generated rows.

## Starter Bank Update

The only real starter bank remains:

- Class 6
- Mathematics
- CBSE or General
- Arithmetic
- Integers

v2.88 adds original same-topic MCQ, fill-in, and long-answer style questions so the section presets can use more realistic question types.

## Placeholder Fallback

If the selected bank, question set, section type, marks, or difficulty does not have enough real questions, the generator uses available unique same-scope questions first and then adds honest placeholders.

Placeholder rows remain labelled with:

- `QuestionSource: placeholder`
- blank `QuestionBankId`
- visible placeholder question text

## What Remains Limited

v2.88 does not include:

- Full syllabus coverage
- Board-specific syllabus intelligence
- Custom section editor
- Drag-and-drop paper structure editing
- Database-backed question banks
- Question quality scoring
- PDF export
- Real email sending
- Photo/image automation

AR-WORKSHEET-PRO behavior is unchanged.

## Validation Commands

Run:

```bash
npm run validate:samples
npm run validate:storage
npm run build
```
