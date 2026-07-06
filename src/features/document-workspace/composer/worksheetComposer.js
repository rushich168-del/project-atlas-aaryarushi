// Project Atlas v2.85 — Worksheet document composer.
//
// Turns the builder's form + generated question rows into ONE complete worksheet
// .docx (many rows -> a single document), the piece the old row-per-document
// engine could not do. Pure + isolated; no network, no engine coupling.

import {
  blank,
  buildDocxBlob,
  labelValue,
  paragraph,
  run,
} from './documentLayout.js'

// Shared structure used by both the DOCX composer and the on-screen paper preview
// so what the teacher sees matches the download exactly.
export function buildWorksheetModel(form = {}, rows = []) {
  const answerSpace = form.answerSpace || 'short'
  const questions = rows.map((row, index) => ({
    number: index + 1,
    text: row.QuestionText || '',
    answer: row.Answer || '',
  }))
  const showAnswerKey = form.includeAnswerKey !== false && questions.some((q) => q.answer !== '')

  return {
    institution: (form.institution || '').trim(),
    title: (form.title || 'Worksheet').trim(),
    grade: (form.grade || '').trim(),
    section: (form.section || '').trim(),
    studentName: (form.studentName || '').trim(),
    rollNo: (form.rollNo || '').trim(),
    subject: (form.subject || '').trim(),
    chapter: (form.chapter || '').trim(),
    topic: (form.topic || '').trim(),
    date: (form.date || '').trim(),
    instructions: (form.instructions || '').trim(),
    layoutStyle: form.layoutStyle || 'exam',
    questionLayout: form.questionLayout || 'one',
    answerSpace,
    showAnswerKey,
    questions,
  }
}

export function composeWorksheetDocx(form = {}, rows = []) {
  const model = buildWorksheetModel(form, rows)
  const parts = []

  if (model.institution) {
    parts.push(paragraph(model.institution, { align: 'center', bold: true, size: 16, spacingAfter: 40 }))
  }
  parts.push(paragraph(model.title, { align: 'center', bold: true, size: 14, spacingAfter: 80, border: true }))

  // Detail lines — pack two per line where it reads naturally.
  parts.push(labelValue('Class', model.grade))
  parts.push(labelValue('Section', model.section))
  parts.push(labelValue('Name', model.studentName))
  parts.push(labelValue('Roll No', model.rollNo))
  parts.push(labelValue('Subject', model.subject))
  if (model.chapter) parts.push(labelValue('Chapter', model.chapter))
  if (model.topic) parts.push(labelValue('Topic', model.topic))
  parts.push(labelValue('Date', model.date))

  if (model.instructions) {
    parts.push(blank(40))
    parts.push(paragraph([run('Instructions: ', { bold: true }), run(model.instructions)], { spacingAfter: 80 }))
  }

  parts.push(blank(40))
  parts.push(paragraph('Questions', { bold: true, size: 12, spacingAfter: 80 }))

  model.questions.forEach((q) => {
    parts.push(paragraph(`${q.number}. ${q.text}`, { spacingAfter: model.answerSpace === 'working' ? 40 : 80 }))
    if (model.answerSpace === 'working') {
      // Add two blank ruled-ish lines of working space.
      parts.push(blank(160))
      parts.push(blank(160))
    }
  })

  if (model.showAnswerKey) {
    parts.push(blank(80))
    parts.push(paragraph('Answer Key', { bold: true, size: 12, spacingAfter: 80, border: true }))
    model.questions.forEach((q) => {
      parts.push(paragraph(`${q.number}. ${q.answer || '—'}`, { spacingAfter: 40 }))
    })
  }

  return buildDocxBlob(parts.join(''))
}
