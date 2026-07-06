// Project Atlas v2.85 — Question paper document composer.
//
// Turns the builder's form + generated blueprint rows into ONE complete question
// paper .docx (sections, marks, instructions, optional answer key). Pure +
// isolated. Question text stays a clearly-labelled placeholder — no faked subject
// content — until real question banks exist.

import {
  blank,
  buildDocxBlob,
  centeredTitle,
  keyValueRow,
  pageBreak,
  paragraph,
  rule,
  sectionHeading,
} from './documentLayout.js'

function groupBySection(rows) {
  const order = []
  const map = new Map()
  rows.forEach((row) => {
    const key = row.Section || 'Section A'
    if (!map.has(key)) {
      map.set(key, [])
      order.push(key)
    }
    map.get(key).push(row)
  })
  return order.map((name) => ({ name, rows: map.get(name) }))
}

// Shared model for both the DOCX composer and the on-screen paper preview.
export function buildQuestionPaperModel(form = {}, rows = [], blueprint = null) {
  const showMarks = form.showMarks !== false
  const sections = groupBySection(rows).map((section) => ({
    name: section.name,
    questions: section.rows.map((row, index) => ({
      number: index + 1,
      text: row.QuestionText || '',
      marks: row.Marks || '',
      answer: row.Answer || '',
      source: row.QuestionSource || '',
      questionBankId: row.QuestionBankId || '',
      questionType: row.QuestionType || '',
    })),
  }))
  const showAnswerKey = form.includeAnswerKey === true

  const generalInstructions = [
    'Answer all questions.',
    showMarks ? 'Marks are shown against each question.' : null,
    (form.instructions || '').trim() || null,
  ].filter(Boolean)

  return {
    institution: (form.institution || '').trim(),
    title: (form.title || 'Question Paper').trim(),
    grade: (form.grade || '').trim(),
    subject: (form.subject || '').trim(),
    examType: (form.examType || '').trim(),
    duration: (form.duration || '').trim(),
    date: (form.date || '').trim(),
    totalMarks: blueprint?.totalMarks ?? '',
    showMarks,
    showAnswerKey,
    sectionLayout: form.sectionLayout === 'newpage' ? 'newpage' : 'continuous',
    generalInstructions,
    sections,
  }
}

function examTypeLabel(value) {
  if (!value) return ''
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function composeQuestionPaperDocx(form = {}, rows = [], blueprint = null) {
  const model = buildQuestionPaperModel(form, rows, blueprint)
  const parts = []

  // 1) School / College name centered (if given). 2) Test / Paper title centered.
  if (model.institution) {
    parts.push(centeredTitle(model.institution, { size: 16, spacingAfter: 40 }))
  }
  parts.push(centeredTitle(model.title, { size: 14, spacingAfter: 40 }))

  // 3) Horizontal rule.
  parts.push(rule({ spacingAfter: 80 }))

  // 4) Compact detail rows (matches the preview grid).
  parts.push(keyValueRow([
    { label: 'Class', value: model.grade },
    { label: 'Subject', value: model.subject },
    { label: 'Exam', value: model.examType ? examTypeLabel(model.examType) : '' },
  ]))
  parts.push(keyValueRow([
    { label: 'Time', value: model.duration },
    { label: 'Total Marks', value: model.totalMarks === '' ? '' : String(model.totalMarks) },
    { label: 'Date', value: model.date },
  ], { spacingAfter: 80 }))

  // 5) General instructions, clearly separated.
  if (model.generalInstructions.length) {
    parts.push(blank(40))
    parts.push(paragraph('General Instructions', { bold: true, size: 12, spacingAfter: 40 }))
    model.generalInstructions.forEach((line, index) => {
      parts.push(paragraph(`${index + 1}. ${line}`, { spacingAfter: 40 }))
    })
  }

  // 6) Sections: centered + bold heading. Optionally start each on a new page.
  model.sections.forEach((section, index) => {
    if (index > 0 && model.sectionLayout === 'newpage') {
      parts.push(pageBreak())
    } else {
      parts.push(blank(80))
    }
    parts.push(sectionHeading(section.name, { size: 13, spacingAfter: 60 }))
    section.questions.forEach((q) => {
      const marksSuffix = model.showMarks && q.marks ? `  (${q.marks} marks)` : ''
      parts.push(paragraph(`${q.number}. ${q.text}${marksSuffix}`, { spacingAfter: 100 }))
    })
  })

  if (model.showAnswerKey) {
    // Answer key clearly separated on its own page after all questions.
    parts.push(pageBreak())
    parts.push(paragraph('Answer Key', { bold: true, size: 12, spacingAfter: 80, border: true }))
    model.sections.forEach((section) => {
      parts.push(paragraph(section.name, { bold: true, spacingAfter: 40 }))
      section.questions.forEach((q) => {
        parts.push(paragraph(`${q.number}. ${q.answer || '[Answer key placeholder]'}`, { spacingAfter: 40 }))
      })
    })
  }

  return buildDocxBlob(parts.join(''))
}
