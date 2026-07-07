# Project Atlas v2.94 — Simple Question Paper UX and Prepared Paper Pattern

AR-QUESTION-PRO now leads with a simple, teacher-first flow and detects a
teacher's own section-wise question paper. All previous power stays available
under **Advanced options**.

## New teacher-first flow

1. **I already have questions** (default) — paste your section-wise paper.
2. **Generate / Update Preview**.
3. **Download DOCX**.

Source modes (internal values unchanged for backward compatibility):

| Internal value | New label |
|---|---|
| `pasted-material` | **I already have questions** (default) |
| `reference-topic` | **I have notes / reference material** |
| `starter-bank` | **Use built-in starter bank** |
| `pdf-upload` | *(reserved, hidden)* |

Paper Setup (`blueprintMode`) now defaults to **Custom Section Setup**
(`teacher-blueprint`); **Advanced: Quick Pattern** (`pattern-preset`) stays under
Advanced.

## Prepared paper paste pattern

Paste a heading before each part, then the questions:

```
SECTION A | 1 MARK | MCQ

1. Who introduced set theory?
2. Which of the following is a set?

SECTION B | 1 MARK | FILL IN THE BLANKS

1. A set is a well-defined collection of ______.

SECTION C | 2 MARKS | SHORT ANSWER

1. Define a set.

SECTION D | 5 MARKS | LONG ANSWER

1. Explain roster form and set-builder form with examples.
```

`parsePreparedQuestionPaper(text)` (pure, deterministic, no deps/AI/network/storage)
detects:

- **Section name** — the part before the first `|`, `:` or ` - `.
- **Marks** — `N MARK(S)`; defaults to 1 with a note if missing.
- **Question type** — MCQ, Fill in the blanks, True/False, Short answer, Long
  answer; defaults to Short answer with a note if missing.
- **Questions** — numbering (`1.`, `Q1)`, etc.) is stripped; the teacher's text is
  kept exactly.

Tolerant of `Section A`, `SECTION A`, `Section A - 1 mark - MCQ`, and
`SECTION A | 1 MARK | MCQ`. Questions before the first heading are placed in a
synthesized Section A with a warning. Teacher text is never dropped silently.

Prepared rows are labelled **Your question** (`QuestionSource: teacher-material`),
with `Answer` = `[Teacher to add answer]` when the answer key is enabled.

## Plain-list fallback

If no `SECTION` heading is found, the paste is treated as a plain question list
(the v2.93 behavior) and a notice appears:
*"No SECTION headers found — treated as a plain question list. Add SECTION headers
to detect section-wise paper structure."* Old saved plain pastes keep working.

Plain-list can also be chosen explicitly under **Advanced → Paste format →
Advanced: Plain question list**.

## Advanced options

Collapsed by default. Contains: plain-list paste format, built-in starter-bank
selector, Question Set, Refresh Variant, Advanced: Quick Pattern, board/syllabus
fields, chapters/topics, extra draft instructions, reference book/chapter, and the
numeric pattern fields (sections/questions/marks/type/difficulty/naming/layout).
Nothing was removed.

## Backward compatibility

Internal values preserved: `pasted-material`, `reference-topic`, `starter-bank`,
`placeholder-only`, `teacher-blueprint`, `pattern-preset`, `sectionPatternId`,
`questionVariant`, `refreshVariant`. New `pastedInputMode` defaults to
`prepared-paper`; saved forms without it behave as prepared, and any header-less
paste falls back to plain-list automatically. `blueprintMode` absent → normalizes
to `teacher-blueprint`.

## Limitations

- Answer parsing is not done; answers stay `[Teacher to add answer]`.
- Detection is heading-based; papers without SECTION headings use the plain-list
  fallback.
- Marks/type default when not written in the heading.
- DOCX composer/layout unchanged; prepared rows flow through the existing
  `Section`/`Marks`/`QuestionText`/`Answer` fields. No PDF, no AI/backend.

## Validation commands

```
npm run validate:samples
npm run validate:storage
npm run build
```
