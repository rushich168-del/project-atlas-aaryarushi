# Project Atlas v2.98 - Per-Question Editor, Autosave, Scroll Restore, and A4 Preview

## What changed

- AR-QUESTION-PRO editable sections keep a section-level question type only as the default for new questions.
- Each question now stores and edits its own `questionType`, so one section can mix MCQ, fill in the blanks, true/false, short answer, and other supported types.
- Fill in the blanks uses a numeric blank-length slider from 6 to 30 characters. Older `blankSize` drafts migrate to numeric widths.
- Editable-paper rows now compose DOCX-safe `QuestionText` per question type, including MCQ options, underscores for blanks, and `(True / False)` hints.
- The browser saves an AR-QUESTION-PRO editable draft locally with the model, preview style, editor/preview mode, answer-key setting, and related form values.
- Start Over and starting a fresh blank paper clear the saved local draft.
- Editor scroll position and preview scroll position are restored where browser storage is available.
- Paper preview uses an A4-like white page surface with readable width, minimum height, padding, border, shadow, and responsive containment.

## Limits

- Draft save is browser-local only. It does not use Supabase, a backend, or any network storage.
- Scroll restore is best-effort and may not apply if browser storage is blocked.
- DOCX composition still uses the existing composer path; structured preview data is additive and ignored by DOCX output.
- No PDF export, billing, email sending, image automation, or worksheet changes were added.

## Validation

Run:

```bash
npm run validate:samples
npm run validate:storage
npm run build
```

Manual smoke:

- In AR-QUESTION-PRO, create a section with Q1 MCQ, Q2 Fill in the blanks, Q3 True/False, and Q4 Short answer.
- Confirm preview renders the mixed question types in the same section.
- Confirm DOCX text includes MCQ options, blank underscores, and True/False hints.
- Change the section default type and confirm existing question types stay unchanged.
- Refresh or navigate away and return; confirm the local draft and scroll position restore.
- Use Start Over and confirm the restored draft note does not reappear.
- Check Classic, Compact, and Formal Board preview styles on the A4-like page.
