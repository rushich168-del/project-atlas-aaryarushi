// Project Atlas v2.99 - small, dependency-free math text helpers.
//
// This is intentionally plain text: no KaTeX, no MathJax, no OMML. The goal is to
// help teachers enter and preserve readable math notation in the editor, preview
// and DOCX without changing the document pipeline.

export const MATH_SYMBOLS = [
  { label: 'pi', value: 'π' },
  { label: 'sqrt', value: '√' },
  { label: '<=', value: '≤' },
  { label: '>=', value: '≥' },
  { label: '!=', value: '≠' },
  { label: 'in', value: '∈' },
  { label: 'not in', value: '∉' },
  { label: 'subset', value: '⊂' },
  { label: 'union', value: '∪' },
  { label: 'intersect', value: '∩' },
  { label: '^2', value: '²' },
  { label: '^3', value: '³' },
  { label: 'theta', value: 'θ' },
]

export const MATH_TEMPLATES = [
  { label: 'Fraction', value: '\\frac{}{}' },
  { label: 'Power', value: 'x^{}' },
  { label: 'Root', value: '\\sqrt{}' },
  { label: 'Set-builder', value: '{x : }' },
  { label: 'Function', value: 'f(x)=' },
]

export function normalizeMathText(text) {
  return String(text ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2012\u2013\u2014\u2212]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
}

export function insertTextAtCursor(currentValue, insertValue, selectionStart, selectionEnd) {
  const value = String(currentValue ?? '')
  const insert = String(insertValue ?? '')
  const start = Number.isInteger(selectionStart) ? selectionStart : value.length
  const end = Number.isInteger(selectionEnd) ? selectionEnd : start
  const nextValue = normalizeMathText(`${value.slice(0, start)}${insert}${value.slice(end)}`)
  return {
    value: nextValue,
    selectionStart: start + insert.length,
    selectionEnd: start + insert.length,
  }
}
