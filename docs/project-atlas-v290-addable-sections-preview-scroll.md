# Project Atlas v2.90 - Addable Blueprint Sections and Preview Scroll

## What Was Added

Project Atlas v2.90 improves AR-QUESTION-PRO Teacher Blueprint mode with:

- Addable blueprint sections.
- A maximum 6-section limit.
- A scrollable on-screen paper preview.

This keeps the blueprint editor controlled and predictable. It does not add drag-and-drop or unlimited section editing.

## Add Section Behavior

Teacher Blueprint mode still starts with:

- Section A
- Section B
- Section C

Teachers can add:

- Section D
- Section E
- Section F

The editor shows `Sections: n / 6`.

The Add Section button is disabled after 6 sections. Optional added sections can be removed using Remove Last. Core Section A/B/C behavior remains compatible with v2.89.

## Added Section Defaults

Added sections use safe editable defaults:

- Section D: 2 long-answer questions, 4 marks each.
- Section E: 2 long-answer questions, 5 marks each.
- Section F: 1 long-answer question, 5 marks.

Teachers can edit the title, instruction, marks, total questions, question type mix, and difficulty mix for each visible section.

## Generator Behavior

The question paper generator now reads Section A through Section F based on `teacherBlueprintSectionCount`.

It still:

- Preserves section instructions.
- Computes total marks from generated rows.
- Avoids duplicate real question-bank questions.
- Uses deterministic Question Set and Refresh Variant selection.
- Falls back to labelled placeholders when the starter bank does not contain enough matching questions.
- Preserves Pattern Preset mode from v2.88/v2.89.

## Preview Scroll Behavior

The on-screen paper preview now has a maximum height and vertical scrolling. Long papers and answer keys remain usable without stretching the page.

This is preview-only. DOCX output is unchanged.

## What Remains Limited

v2.90 does not include:

- Unlimited section editing
- Drag-and-drop section ordering
- New question banks
- New syllabus topics or classes
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
