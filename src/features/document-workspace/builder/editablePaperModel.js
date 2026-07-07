// Project Atlas v2.95 — Editable question paper model (pure, browser-safe).
//
// Bridges the v2.94 prepared-paper parser into an in-memory model a teacher can
// edit directly, and converts that model BACK into the same generated-row shape
// the existing PaperPreview + question paper DOCX composer already consume. That
// keeps preview and download in sync with the teacher's edits WITHOUT changing
// the composer or the preview.
//
// Deliberately minimal + honest:
//   - No storage, no Supabase, no network, no secrets. State lives in the browser.
//   - Deterministic conversion: same model always yields the same rows.
//   - Teacher question text is preserved exactly — never rewritten or invented.
//   - IDs come from a simple incrementing counter and are used ONLY as React keys.
//     They are never persisted anywhere.

import { QUESTION_PAPER_GENERATED_COLUMNS, QUESTION_TYPE_OPTIONS } from './builderPresets.js'
import { parsePreparedQuestionPaper, parseTeacherPastedQuestions } from '../question-bank/teacherMaterialSource.js'

const SOURCE_LABEL = 'Your question'
const QUESTION_SOURCE = 'teacher-material'
const DEFAULT_QUESTION_TYPE = 'Short answer'
const DEFAULT_INSTRUCTION = 'Answer all questions.'

let idCounter = 0
function nextId(prefix) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

function str(value, fallback = '') {
  return String(value ?? fallback)
}

// A number-of-marks reader that tolerates an empty/invalid field mid-edit.
function marksOf(section) {
  const marks = Number(section?.marksPerQuestion)
  return Number.isFinite(marks) && marks > 0 ? marks : 0
}

function makeQuestion(text = '', answer = '') {
  return {
    id: nextId('q'),
    text: str(text), // teacher text kept as-is; never trimmed or rewritten
    answer: str(answer),
    source: QUESTION_SOURCE,
    sourceLabel: SOURCE_LABEL,
  }
}

function makeSection({ title, instruction, questionType, marksPerQuestion, questions } = {}) {
  const type = QUESTION_TYPE_OPTIONS.includes(questionType) ? questionType : DEFAULT_QUESTION_TYPE
  const marks = Number(marksPerQuestion)
  return {
    id: nextId('s'),
    title: str(title, 'Section').trim() || 'Section',
    instruction: str(instruction, DEFAULT_INSTRUCTION),
    questionType: type,
    marksPerQuestion: Number.isFinite(marks) && marks > 0 ? marks : 1,
    questions: (questions || []).map((q) => makeQuestion(q.text, q.answer)),
  }
}

function headerFromForm(form = {}) {
  return {
    institution: str(form.institution).trim(),
    title: str(form.title, 'Question Paper').trim() || 'Question Paper',
    grade: str(form.grade).trim(),
    subject: str(form.subject).trim(),
    examType: str(form.examType).trim(),
    duration: str(form.duration).trim(),
    instructions: str(form.instructions).trim(),
  }
}

function nextSectionTitle(count) {
  if (count < 26) {
    return `Section ${String.fromCharCode(65 + count)}`
  }
  return `Section ${count + 1}`
}

function preparedNotice(parsed) {
  const plural = (n) => (n === 1 ? '' : 's')
  const s = parsed.sections.length
  const q = parsed.totalQuestions
  let notice = `Detected ${s} section${plural(s)} and ${q} question${plural(q)} from your prepared paper. Edit anything below — your question text is used exactly as pasted.`
  if (parsed.warnings.length) {
    notice += ` ${parsed.warnings.slice(0, 2).join(' ')}`
  }
  return notice
}

// Build an editable model from the current builder form. Structure comes from the
// v2.94 prepared-paper parser; if no SECTION headers are present, every line is
// kept as one question in a single Section A (teacher text is never lost).
export function createEditableModelFromForm(form = {}) {
  const pasted = typeof form.teacherPastedMaterial === 'string' ? form.teacherPastedMaterial : ''
  const header = headerFromForm(form)
  const parsed = parsePreparedQuestionPaper(pasted)

  if (parsed.ok && parsed.sections.length) {
    const sections = parsed.sections.map((section) => makeSection({
      title: section.name,
      instruction: DEFAULT_INSTRUCTION,
      questionType: section.questionType,
      marksPerQuestion: section.marks,
      questions: section.questions.map((q) => ({ text: q.text })),
    }))
    return { header, sections, source: 'prepared-paper', notice: preparedNotice(parsed) }
  }

  // Fallback: no SECTION headings — keep every question line in a single section.
  const plain = parseTeacherPastedQuestions(pasted)
  const sections = [makeSection({
    title: 'Section A',
    instruction: DEFAULT_INSTRUCTION,
    questionType: DEFAULT_QUESTION_TYPE,
    marksPerQuestion: 1,
    questions: plain.map((q) => ({ text: q.text })),
  })]
  const notice = plain.length
    ? 'No SECTION headers found — your questions were placed in a single Section A. Add sections and set marks/type below, or start over and add headers like "SECTION A | 1 MARK | MCQ".'
    : 'No questions detected yet. An empty Section A was added so you can start typing, or start over and paste your paper first.'
  return { header, sections, source: 'plain-list', notice }
}

// --- Immutable updater helpers (each returns a NEW model for React state) ------

function mapSections(model, sectionId, updater) {
  return {
    ...model,
    sections: model.sections.map((section) => (section.id === sectionId ? updater(section) : section)),
  }
}

export function updateHeaderField(model, field, value) {
  if (!(field in model.header)) {
    return model
  }
  return { ...model, header: { ...model.header, [field]: str(value) } }
}

export function updateSectionField(model, sectionId, field, value) {
  return mapSections(model, sectionId, (section) => {
    if (field === 'marksPerQuestion') {
      // Allow an empty field mid-edit; coerce to a number when one is present.
      const next = value === '' ? '' : Number(value)
      return { ...section, marksPerQuestion: next }
    }
    if (field === 'questionType') {
      return { ...section, questionType: QUESTION_TYPE_OPTIONS.includes(value) ? value : section.questionType }
    }
    if (field === 'title' || field === 'instruction') {
      return { ...section, [field]: str(value) }
    }
    return section
  })
}

export function updateQuestionField(model, sectionId, questionId, field, value) {
  if (field !== 'text' && field !== 'answer') {
    return model
  }
  return mapSections(model, sectionId, (section) => ({
    ...section,
    questions: section.questions.map((question) => (
      question.id === questionId ? { ...question, [field]: str(value) } : question
    )),
  }))
}

export function addQuestion(model, sectionId) {
  return mapSections(model, sectionId, (section) => ({
    ...section,
    questions: [...section.questions, makeQuestion('', '')],
  }))
}

export function deleteQuestion(model, sectionId, questionId) {
  return mapSections(model, sectionId, (section) => ({
    ...section,
    questions: section.questions.filter((question) => question.id !== questionId),
  }))
}

export function addSection(model) {
  const section = makeSection({
    title: nextSectionTitle(model.sections.length),
    instruction: DEFAULT_INSTRUCTION,
    questionType: DEFAULT_QUESTION_TYPE,
    marksPerQuestion: 1,
    questions: [{ text: '' }],
  })
  return { ...model, sections: [...model.sections, section] }
}

export function removeSection(model, sectionId) {
  // Keep at least one section so the paper never becomes structureless.
  if (model.sections.length <= 1) {
    return model
  }
  return { ...model, sections: model.sections.filter((section) => section.id !== sectionId) }
}

// --- Conversion back to the existing generated-row / blueprint shape -----------

// Convert the editable model into the SAME rows the prepared-paper generator
// produced in v2.94, so PaperPreview and the DOCX composer stay unchanged.
export function editableModelToRows(model) {
  const rows = []
  model.sections.forEach((section) => {
    const marks = marksOf(section)
    section.questions.forEach((question, index) => {
      rows.push({
        Section: section.title || 'Section',
        SectionInstruction: section.instruction || '',
        QuestionNo: `Q${index + 1}`,
        ProductId: 'AR-QUESTION-PRO',
        Class: model.header.grade,
        Board: '',
        Subject: model.header.subject,
        Chapter: '',
        Topic: '',
        QuestionText: question.text,
        Marks: marks > 0 ? String(marks) : '',
        Difficulty: '',
        QuestionType: section.questionType,
        QuestionSource: question.source || QUESTION_SOURCE,
        SourceLabel: question.sourceLabel || SOURCE_LABEL,
        TeacherProvided: 'Yes',
        QuestionBankId: '',
        Answer: question.answer || '',
      })
    })
  })
  return rows
}

export function editableModelToBlueprint(model) {
  const totalQuestions = model.sections.reduce((sum, section) => sum + section.questions.length, 0)
  const totalMarks = model.sections.reduce((sum, section) => sum + (marksOf(section) * section.questions.length), 0)
  return {
    numSections: model.sections.length,
    questionsPerSection: '',
    marksPerQuestion: '',
    totalQuestions,
    totalMarks,
    difficultySpread: {},
    questionType: '',
    questionSourceMode: 'pasted-material',
    pastedInputMode: 'prepared-paper',
    preparedPaper: true,
    editable: true,
    questionBankCount: 0,
    placeholderCount: 0,
    teacherMaterialCount: totalQuestions,
    sections: model.sections.map((section) => ({
      name: section.title,
      instruction: section.instruction,
      questionType: section.questionType,
      count: section.questions.length,
      marksPerQuestion: marksOf(section),
    })),
  }
}

// A drop-in replacement for a generator result ({ columns, rows, blueprint, notice }).
export function buildEditableResult(model) {
  return {
    columns: QUESTION_PAPER_GENERATED_COLUMNS,
    rows: editableModelToRows(model),
    blueprint: editableModelToBlueprint(model),
    notice: '',
  }
}

// Merge the editable header back over the builder form so the composer + preview
// (which read the paper header from the form, not the rows) reflect header edits.
export function editableModelToForm(model, baseForm = {}) {
  return {
    ...baseForm,
    institution: model.header.institution,
    title: model.header.title,
    grade: model.header.grade,
    subject: model.header.subject,
    examType: model.header.examType,
    duration: model.header.duration,
    instructions: model.header.instructions,
  }
}
