// Project Atlas v2.85 — Question paper document composer.
//
// Turns the builder's form + generated blueprint rows into ONE complete question
// paper .docx (sections, marks, instructions, optional answer key). Pure +
// isolated. Question text stays a clearly-labelled placeholder — no faked subject
// content — until real question banks exist.

import {
  blank,
  buildDocxBlob,
  labelValue,
  paragraph,
  run,
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

  if (model.institution) {
    parts.push(paragraph(model.institution, { align: 'center', bold: true, size: 16, spacingAfter: 40 }))
  }
  parts.push(paragraph(model.title, { align: 'center', bold: true, size: 14, spacingAfter: 80, border: true }))

  parts.push(labelValue('Class', model.grade))
  parts.push(labelValue('Subject', model.subject))
  if (model.examType) parts.push(labelValue('Exam Type', examTypeLabel(model.examType)))
  parts.push(labelValue('Time', model.duration))
  parts.push(labelValue('Total Marks', model.totalMarks === '' ? '' : String(model.totalMarks)))
  parts.push(labelValue('Date', model.date))

  if (model.generalInstructions.length) {
    parts.push(blank(40))
    parts.push(paragraph('General Instructions', { bold: true, size: 12, spacingAfter: 40 }))
    model.generalInstructions.forEach((line, index) => {
      parts.push(paragraph(`${index + 1}. ${line}`, { spacingAfter: 40 }))
    })
  }

  model.sections.forEach((section) => {
    parts.push(blank(80))
    parts.push(paragraph(section.name, { bold: true, size: 13, spacingAfter: 80, border: true }))
    section.questions.forEach((q) => {
      const marksSuffix = model.showMarks && q.marks ? `  (${q.marks} marks)` : ''
      parts.push(paragraph(`${q.number}. ${q.text}${marksSuffix}`, { spacingAfter: 80 }))
    })
  })

  if (model.showAnswerKey) {
    parts.push(blank(80))
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
