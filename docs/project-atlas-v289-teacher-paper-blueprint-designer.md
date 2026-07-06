# Project Atlas v2.89 - Teacher Paper Blueprint Designer

## What Was Added

Project Atlas v2.89 adds a controlled Teacher Blueprint mode for AR-QUESTION-PRO.

Teachers can now define up to 3 sections with:

- Section title
- Section instruction
- Marks per question
- Total questions
- Question type mix
- Difficulty mix

This is not a drag-and-drop editor. It is a compact section blueprint designer intended to make real teacher paper setup safer and more useful.

## Blueprint Modes

AR-QUESTION-PRO now supports:

- Pattern Preset: uses the v2.88 ready-made section patterns.
- Teacher Blueprint: lets the teacher control Section A, Section B, and Section C.

Pattern Preset remains the default to preserve v2.88 behavior.

## Refresh Variant

Teachers can choose Refresh 1 through Refresh 5.

Question selection remains deterministic:

- Same settings + same Question Set + same Refresh Variant produce the same paper.
- Changing Refresh Variant rotates available question-bank choices where enough content exists.
- No hidden random behavior is used.

## Question Matching

The generator uses the selected starter-bank scope and prefers:

1. Same scope + question type + difficulty + marks
2. Same scope + question type + marks
3. Same scope + question type
4. Same scope
5. Labelled placeholder

Real starter-bank questions are not duplicated in v2.89. If the bank does not contain enough matching questions, remaining rows use placeholders.

## Starter Bank Update

The only real starter bank remains:

- Class 6
- Mathematics
- CBSE or General
- Arithmetic
- Integers

v2.89 adds original same-topic True/False, fill-in, medium MCQ, and long-answer questions to better support teacher blueprints.

## Section Instructions

Section instructions are carried into:

- Paper preview
- DOCX output
- Generated row data

Answer keys, section page breaks, and Bank/Placeholder badges remain supported.

## What Remains Limited

v2.89 does not include:

- Full syllabus coverage
- Board-specific syllabus intelligence
- Unlimited section editing
- Drag-and-drop paper design
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
