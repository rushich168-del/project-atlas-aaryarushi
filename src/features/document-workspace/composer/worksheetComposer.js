// Project Atlas v2.85 — Worksheet document composer.
//
// Turns the builder's form + generated question rows into ONE complete worksheet
// .docx (many rows -> a single document), the piece the old row-per-document
// engine could not do. Pure + isolated; no network, no engine coupling.

import {
  blank,
  buildDocxBlob,
  centeredTitle,
  keyValueRow,
  pageBreak,
  paragraph,
  rule,
  run,
  twoColumnTable,
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
    answerKeyLocation: form.answerKeyLocation === 'newpage' ? 'newpage' : 'end',
    showAnswerKey,
    questions,
  }
}

export function composeWorksheetDocx(form = {}, rows = []) {
  const model = buildWorksheetModel(form, rows)
  // Layout style makes a basic, real difference in the DOCX: 'simple' keeps a plain
  // header; 'boxed'/'exam' add rule lines that frame the header block.
  const framed = model.layoutStyle === 'boxed' || model.layoutStyle === 'exam'
  const parts = []

  // 1) School / College name centered (if given). 2) Worksheet title centered.
  if (model.institution) {
    parts.push(centeredTitle(model.institution, { size: 16, spacingAfter: 40 }))
  }
  parts.push(centeredTitle(model.title, { size: 14, spacingAfter: 40 }))

  // 3) Horizontal rule.
  parts.push(rule({ spacingAfter: 80 }))

  // 4) Compact detail rows (matches the preview grid, not a long vertical list).
  //    Empty Section / Name / Roll No / Date show fill-in lines automatically.
  parts.push(keyValueRow([
    { label: 'Class', value: model.grade },
    { label: 'Section', value: model.section },
    { label: 'Name', value: model.studentName },
    { label: 'Roll No', value: model.rollNo },
  ]))
  parts.push(keyValueRow([
    { label: 'Subject', value: model.subject },
    { label: 'Chapter', value: model.chapter },
    { label: 'Topic', value: model.topic },
    { label: 'Date', value: model.date },
  ], { spacingAfter: framed ? 40 : 80 }))

  // Close the framed header with a rule line under the details block.
  if (framed) {
    parts.push(rule({ spacingAfter: 80 }))
  }

  if (model.instructions) {
    parts.push(blank(40))
    parts.push(paragraph([run('Instructions: ', { bold: true }), run(model.instructions)], { spacingAfter: 80 }))
  }

  parts.push(blank(40))
  parts.push(paragraph('Questions', { bold: true, size: 12, spacingAfter: 80 }))

  const working = model.answerSpace === 'working'
  // Cell/paragraph content for one question (plus a writing line when working space).
  const questionBlock = (q) => {
    const q1 = paragraph(`${q.number}. ${q.text}`, { spacingAfter: working ? 40 : 80 })
    if (!working) {
      return q1
    }
    // A dashed-ish writing line under the question (bottom-bordered empty paragraph).
    return q1 + paragraph('', { spacingAfter: 120, border: true })
  }

  if (model.questionLayout === 'two') {
    // Two visible columns; Word paginates the table naturally on long worksheets.
    parts.push(twoColumnTable(model.questions.map(questionBlock)))
    parts.push(blank(40))
  } else {
    model.questions.forEach((q) => {
      parts.push(questionBlock(q))
    })
  }

  if (model.showAnswerKey) {
    // P1/P2: answer key on a new page when requested, else separated by a rule.
    if (model.answerKeyLocation === 'newpage') {
      parts.push(pageBreak())
    } else {
      parts.push(blank(80))
    }
    parts.push(paragraph('Answer Key', { bold: true, size: 12, spacingAfter: 80, border: true }))

    // Compact two-column key for two-column layouts or many questions.
    const twoColKey = model.questionLayout === 'two' || model.questions.length > 8
    if (twoColKey) {
      parts.push(twoColumnTable(model.questions.map((q) => paragraph(`${q.number}. ${q.answer || '—'}`, { spacingAfter: 20 }))))
      parts.push(blank(20))
    } else {
      model.questions.forEach((q) => {
        parts.push(paragraph(`${q.number}. ${q.answer || '—'}`, { spacingAfter: 40 }))
      })
    }
  }

  return buildDocxBlob(parts.join(''))
}
