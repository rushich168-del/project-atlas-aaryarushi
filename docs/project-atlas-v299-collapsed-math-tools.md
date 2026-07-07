# Project Atlas v2.99 - Collapsed Math Tools

## What Math Tools Do

AR-QUESTION-PRO now gives teachers an optional way to insert readable maths symbols and plain-text equation templates into question fields.

Math tools are collapsed by default so non-math teachers still see the normal clean question editor.

## Supported Symbols

- π
- √
- ≤
- ≥
- ≠
- ∈
- ∉
- ⊂
- ∪
- ∩
- ²
- ³
- θ

## Supported Templates

- `\frac{}{}`
- `x^{}`
- `\sqrt{}`
- `{x : }`
- `f(x)=`

These remain plain readable text in preview and DOCX for now.

## Paste Handling

The editor lightly normalizes pasted text in math-enabled fields:

- smart quotes become straight quotes
- long dash variants become normal hyphen
- non-breaking spaces become normal spaces
- repeated spaces are reduced safely

It does not block paste and does not aggressively rewrite equations.

## DOCX Limitation

v2.99 does not generate true Word equations or OMML. DOCX output preserves readable Unicode symbols and LaTeX-style text.

## Future Plan

A later version can add preview-only rendering with KaTeX or true Word equation output after the plain-text math input model is proven safe.

## Validation

Run:

```bash
npm run validate:samples
npm run validate:storage
npm run build
```
