# Project Atlas v2.91 - Blueprint Validation and Teacher Warnings

## What changed

- Added teacher-friendly question paper blueprint analysis for AR-QUESTION-PRO.
- Added section-wise summaries for total questions, marks, estimated real bank questions, and estimated placeholders.
- Added paper-level summaries for total questions, total marks, estimated real questions, and estimated placeholders.
- Added generated-paper summary above the preview using existing generated metadata.

## Warning behavior

- Question type count mismatches are soft warnings.
- Difficulty count mismatches are soft warnings.
- Question bank shortages are soft warnings.
- Placeholder fallback remains allowed and clearly labelled.
- Generation is blocked only when no enabled section can produce question rows.

## Question bank estimates

- Estimates are local and deterministic.
- Estimates use the selected starter question bank scope and current blueprint targets.
- Estimates are not syllabus intelligence. They only reflect the static starter bank currently shipped with the app.
- If a bank does not have enough matching questions, the app still generates with labelled placeholders.

## Limits that remain

- The starter bank is intentionally small.
- Full class, subject, board, and chapter coverage is not claimed.
- DOCX output is unchanged in this version.
- AR-WORKSHEET-PRO behavior is unchanged.

## Validation commands

```bash
npm run validate:samples
npm run validate:storage
npm run build
```
