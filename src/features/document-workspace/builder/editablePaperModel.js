// Project Atlas v2.96 — Editable question paper model (pure, browser-safe).
//
// Backs the AR-QUESTION-PRO Paper Editor Canvas. A teacher edits the paper header,
// general-instruction points, sections and questions directly; this module converts
// that model BACK into the same generated-row + blueprint shape the existing
// PaperPreview and DOCX composer already consume, so preview and download stay in
// sync with edits.
//
// Deliberately minimal + honest:
//   - No storage, no Supabase, no network, no secrets. State lives in the browser.
//   - Deterministic conversion: same model always yields the same rows.
//   - Teacher question text is preserved exactly — never rewritten or invented.
//   - IDs come from a simple incrementing counter and are used ONLY as React keys.
//     They are never persisted anywhere.

import { QUESTION_PAPER_GENERATED_COLUMNS } from './builderPresets.js'
import { parsePreparedQuestionPaper, parseTeacherPastedQuestions } from '../question-bank/teacherMaterialSource.js'

const SOURCE_LABEL = 'Your question'
const QUESTION_SOURCE = 'teacher-material'
const DEFAULT_QUESTION_TYPE = 'Short answer'
const DEFAULT_INSTRUCTION = 'Answer all questions.'

// v2.96 — expanded, editor-only question type list. Kept separate from the parser's
// detection list so importing a pasted paper (which only detects a subset) still
// yields valid types, and adding types here never affects the parser/generator.
export const EDITABLE_QUESTION_TYPE_OPTIONS = [
  'MCQ',
  'Fill in the blanks',
  'True/False',
  'Very short answer',
  'Short answer',
  'Long answer',
  'Case study',
  'Numerical / Problem',
]

// Default general-instruction points for a new paper.
export const DEFAULT_INSTRUCTIONS = [
  'Answer all questions.',
  'Marks are shown against each question.',
]

// Preview styles offered by the canvas (preview-only in v2.96; DOCX unaffected).
export const PREVIEW_STYLES = [
  { id: 'classic', label: 'Classic Exam' },
  { id: 'compact', label: 'Compact' },
  { id: 'formal', label: 'Formal Board' },
]
export const PREVIEW_STYLE_IDS = PREVIEW_STYLES.map((style) => style.id)
export const DEFAULT_PREVIEW_STYLE = 'classic'

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
  const type = EDITABLE_QUESTION_TYPE_OPTIONS.includes(questionType) ? questionType : DEFAULT_QUESTION_TYPE
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
    date: str(form.date).trim(),
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
  let notice = `Imported ${s} section${plural(s)} and ${q} question${plural(q)} from your pasted paper. Edit anything below — your question text is used exactly as pasted.`
  if (parsed.warnings.length) {
    notice += ` ${parsed.warnings.slice(0, 2).join(' ')}`
  }
  return notice
}

// A blank starter paper so the teacher can begin editing immediately — one
// Section A with a single empty question and the default instruction points.
export function createEmptyEditableModel(form = {}) {
  return {
    header: headerFromForm(form),
    instructions: [...DEFAULT_INSTRUCTIONS],
    sections: [makeSection({
      title: 'Section A',
      instruction: DEFAULT_INSTRUCTION,
      questionType: DEFAULT_QUESTION_TYPE,
      marksPerQuestion: 2,
      questions: [{ text: '' }],
    })],
    source: 'empty',
    notice: '',
  }
}

// Build an editable model from a pasted paper (the "Import into editor" action).
// Structure comes from the v2.94 prepared-paper parser; if no SECTION headers are
// present, every line is kept as one question in a single Section A (teacher text
// is never lost). Instruction points always start from the sensible defaults.
export function createEditableModelFromForm(form = {}) {
  const pasted = typeof form.teacherPastedMaterial === 'string' ? form.teacherPastedMaterial : ''
  const header = headerFromForm(form)
  const instructions = [...DEFAULT_INSTRUCTIONS]
  const parsed = parsePreparedQuestionPaper(pasted)

  if (parsed.ok && parsed.sections.length) {
    const sections = parsed.sections.map((section) => makeSection({
      title: section.name,
      instruction: DEFAULT_INSTRUCTION,
      questionType: section.questionType,
      marksPerQuestion: section.marks,
      questions: section.questions.map((q) => ({ text: q.text })),
    }))
    return { header, instructions, sections, source: 'prepared-paper', notice: preparedNotice(parsed) }
  }

  // Fallback: no SECTION headings — keep every question line in a single section.
  const plain = parseTeacherPastedQuestions(pasted)
  const sections = [makeSection({
    title: 'Section A',
    instruction: DEFAULT_INSTRUCTION,
    questionType: DEFAULT_QUESTION_TYPE,
    marksPerQuestion: 2,
    questions: plain.length ? plain.map((q) => ({ text: q.text })) : [{ text: '' }],
  })]
  const notice = plain.length
    ? 'No SECTION headers found — your questions were placed in a single Section A. Add sections and set marks/type below, or add headers like "SECTION A | 1 MARK | MCQ" and import again.'
    : 'No questions detected in the pasted text. An empty Section A was kept so you can start typing.'
  return { header, instructions, sections, source: 'plain-list', notice }
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

// --- Instruction points (general instructions) --------------------------------

export function addInstruction(model) {
  return { ...model, instructions: [...(model.instructions || []), ''] }
}

export function updateInstruction(model, index, value) {
  return {
    ...model,
    instructions: (model.instructions || []).map((line, i) => (i === index ? str(value) : line)),
  }
}

export function removeInstruction(model, index) {
  return { ...model, instructions: (model.instructions || []).filter((_, i) => i !== index) }
}

// --- Sections + questions ------------------------------------------------------

export function updateSectionField(model, sectionId, field, value) {
  return mapSections(model, sectionId, (section) => {
    if (field === 'marksPerQuestion') {
      // Allow an empty field mid-edit; coerce to a number when one is present.
      const next = value === '' ? '' : Number(value)
      return { ...section, marksPerQuestion: next }
    }
    if (field === 'questionType') {
      return { ...section, questionType: EDITABLE_QUESTION_TYPE_OPTIONS.includes(value) ? value : section.questionType }
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
  // Safe defaults for a new section: next letter, Short answer, 2 marks, one blank Q.
  const section = makeSection({
    title: nextSectionTitle(model.sections.length),
    instruction: DEFAULT_INSTRUCTION,
    questionType: DEFAULT_QUESTION_TYPE,
    marksPerQuestion: 2,
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

function cleanInstructions(model) {
  return (model.instructions || []).map((line) => str(line).trim()).filter(Boolean)
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
    // The composer + preview read general instructions from here when present, so
    // the teacher's edited instruction points flow into both.
    generalInstructions: cleanInstructions(model),
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
// Instruction points are carried via the blueprint, so form.instructions is cleared
// to avoid the composer's legacy single-line append.
export function editableModelToForm(model, baseForm = {}) {
  return {
    ...baseForm,
    institution: model.header.institution,
    title: model.header.title,
    grade: model.header.grade,
    subject: model.header.subject,
    examType: model.header.examType,
    duration: model.header.duration,
    date: model.header.date,
    instructions: '',
  }
}
