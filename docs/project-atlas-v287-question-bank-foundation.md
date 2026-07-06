# Project Atlas v2.87 - Real Question Bank and Syllabus Foundation

## What Was Added

Project Atlas v2.87 adds a small local/static question-bank foundation for AR-QUESTION-PRO.

The question paper builder can now:

- Use real starter-bank questions when a supported bank scope is selected.
- Keep the existing paper blueprint behavior when placeholder-only mode is selected.
- Fill any shortage with clearly labelled placeholder questions.
- Preserve sections, marks, difficulty spread, answer-key options, section layout, and DOCX compatibility.
- Export question metadata in the generated data rows.

## Starter Bank Scope

The only real starter bank included in v2.87 is:

- Product: AR-QUESTION-PRO
- Scope ID: `class-6-mathematics-arithmetic-integers`
- Class: Class 6
- Subject: Mathematics
- Board: CBSE or General
- Chapter: Arithmetic
- Topic: Integers

The questions are original starter questions written for this product foundation. They are not copied from NCERT or another question source.

## Metadata Foundation

Question-bank rows include:

- `ProductId`
- `Class`
- `Board`
- `Subject`
- `Chapter`
- `Topic`
- `Difficulty`
- `QuestionType`
- `QuestionSource`
- `QuestionBankId`
- `Marks`
- `Answer`

`QuestionSource` is either:

- `question-bank`
- `placeholder`

## What Is Not Included Yet

v2.87 does not add:

- Full syllabus coverage
- Board-specific syllabus intelligence
- Database-backed question banks
- Question randomization
- Question duplication
- PDF export
- Billing, subscriptions, or checkout
- Email sending
- Photo/image automation

AR-WORKSHEET-PRO arithmetic generation is unchanged in this release.

## Placeholder Fallback

If the teacher selects placeholder-only mode, or if the selected starter bank does not have enough matching questions, the generator fills the remaining rows with honest placeholder text:

`Placeholder question - add a real Mathematics question for Integers.`

The app does not pretend that unsupported class/subject/topic content exists.

## Validation Commands

Run:

```bash
npm run validate:samples
npm run validate:storage
npm run build
```
