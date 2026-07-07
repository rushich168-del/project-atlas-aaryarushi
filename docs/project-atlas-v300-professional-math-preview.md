# Project Atlas v3.0 - Professional Math Preview Rendering

## What Changed

AR-QUESTION-PRO preview now renders readable LaTeX-style math using KaTeX. The editor stays simple: math tools remain collapsed behind `+ Math tools`, and non-math teachers still see normal question fields by default.

## Supported Preview Syntax

Examples that render in preview:

- `\sqrt{x^{3}-2}`
- `\frac{x}{y}`
- `x \in A`
- `A \cup B`
- `x \ne 2`
- `x \ge 2`

The preview also supports explicit inline and display-style delimiters:

- `\( x^2 + 1 \)`
- `\[ \frac{x+1}{x-2} \]`
- Simple `$ x^2 + 1 $` expressions, avoiding currency-like text where possible.

Parentheses or square brackets that contain math commands also render as math, for example:

- `Find domain of ( f(x)=\frac{x+1}{x-2} )`

## Square Roots

Expressions such as `\sqrt{x^{3}-2}` render with the root bar covering the full braced expression `x³ - 2`. Teachers should put the whole intended expression inside braces after `\sqrt`.

## DOCX Limitation

v3.0 does not create true Word equation objects or OMML. Downloaded DOCX files continue to preserve readable math text such as `\sqrt{x^{3}-2}` and `\frac{x}{y}`.

## Future

A later v3.1+ version can explore Word OMML equation output after the preview rendering path is stable.

## Validation

Run:

```bash
npm run validate:samples
npm run validate:storage
npm run build
```
