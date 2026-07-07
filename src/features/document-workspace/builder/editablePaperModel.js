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

// Preview styles offered by the canvas (preview-only; DOCX unaffected).
export const PREVIEW_STYLES = [
  { id: 'classic', label: 'Classic' },
  { id: 'compact', label: 'Compact' },
  { id: 'formal', label: 'Formal Board' },
]
export const PREVIEW_STYLE_IDS = PREVIEW_STYLES.map((style) => style.id)
export const DEFAULT_PREVIEW_STYLE = 'classic'

// v2.97 — per-question-type editing helpers.
export const MCQ_OPTION_KEYS = ['A', 'B', 'C', 'D']
export const MCQ_LAYOUTS = ['vertical', 'horizontal']
export const BLANK_SIZES = ['small', 'medium', 'large']
// Underscore runs used to render the blank in QuestionText (DOCX + data view).
export const BLANK_UNDERSCORES = {
  small: '______',
  medium: '____________',
  large: '____________________',
}

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

function normalizeOptions(options) {
  const source = options || {}
  return MCQ_OPTION_KEYS.reduce((out, key) => {
    out[key] = str(source[key])
    return out
  }, {})
}

// Split a line into { before, after } around the first run of 2+ underscores.
function splitBlank(text) {
  const value = str(text)
  const match = value.match(/_{2,}/)
  if (match) {
    const index = value.indexOf(match[0])
    return { before: value.slice(0, index).trim(), after: value.slice(index + match[0].length).trim() }
  }
  return { before: value.trim(), after: '' }
}

// A question object with all optional per-type fields present but empty by default,
// so old (text-only) questions keep working and every editor has a field to bind to.
function makeQuestion(input = {}) {
  const source = typeof input === 'string' ? { text: input } : (input || {})
  return {
    id: nextId('q'),
    text: str(source.text), // teacher text kept as-is; never trimmed or rewritten
    answer: str(source.answer),
    // MCQ
    options: normalizeOptions(source.options),
    mcqLayout: source.mcqLayout === 'horizontal' ? 'horizontal' : 'vertical',
    // Fill in the blanks
    blankBefore: str(source.blankBefore),
    blankAfter: str(source.blankAfter),
    blankSize: BLANK_SIZES.includes(source.blankSize) ? source.blankSize : 'medium',
    source: QUESTION_SOURCE,
    sourceLabel: SOURCE_LABEL,
  }
}

// Pre-split imported "Fill in the blanks" questions so the before/after editors are
// populated from the pasted text (nothing is lost).
function seedBlankParts(question) {
  if (question.blankBefore || question.blankAfter) {
    return question
  }
  const { before, after } = splitBlank(question.text)
  return { ...question, blankBefore: before, blankAfter: after }
}

function makeSection({ title, instruction, questionType, marksPerQuestion, questions } = {}) {
  const type = EDITABLE_QUESTION_TYPE_OPTIONS.includes(questionType) ? questionType : DEFAULT_QUESTION_TYPE
  const marks = Number(marksPerQuestion)
  let built = (questions || []).map((q) => makeQuestion(q))
  if (type === 'Fill in the blanks') {
    built = built.map(seedBlankParts)
  }
  return {
    id: nextId('s'),
    title: str(title, 'Section').trim() || 'Section',
    instruction: str(instruction, DEFAULT_INSTRUCTION),
    questionType: type,
    marksPerQuestion: Number.isFinite(marks) && marks > 0 ? marks : 1,
    questions: built,
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
      const nextType = EDITABLE_QUESTION_TYPE_OPTIONS.includes(value) ? value : section.questionType
      // Switching to "Fill in the blanks" seeds the before/after editors from the
      // existing question text so nothing is lost on the type change.
      const questions = nextType === 'Fill in the blanks'
        ? section.questions.map(seedBlankParts)
        : section.questions
      return { ...section, questionType: nextType, questions }
    }
    if (field === 'title' || field === 'instruction') {
      return { ...section, [field]: str(value) }
    }
    return section
  })
}

const QUESTION_TEXT_FIELDS = ['text', 'answer', 'blankBefore', 'blankAfter']

export function updateQuestionField(model, sectionId, questionId, field, value) {
  return mapSections(model, sectionId, (section) => ({
    ...section,
    questions: section.questions.map((question) => {
      if (question.id !== questionId) {
        return question
      }
      if (field === 'mcqLayout') {
        return { ...question, mcqLayout: value === 'horizontal' ? 'horizontal' : 'vertical' }
      }
      if (field === 'blankSize') {
        return { ...question, blankSize: BLANK_SIZES.includes(value) ? value : question.blankSize }
      }
      if (QUESTION_TEXT_FIELDS.includes(field)) {
        return { ...question, [field]: str(value) }
      }
      return question
    }),
  }))
}

export function updateQuestionOption(model, sectionId, questionId, optionKey, value) {
  if (!MCQ_OPTION_KEYS.includes(optionKey)) {
    return model
  }
  return mapSections(model, sectionId, (section) => ({
    ...section,
    questions: section.questions.map((question) => (
      question.id === questionId
        ? { ...question, options: { ...question.options, [optionKey]: str(value) } }
        : question
    )),
  }))
}

export function addQuestion(model, sectionId) {
  return mapSections(model, sectionId, (section) => ({
    ...section,
    questions: [...section.questions, makeQuestion({})],
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

function filledOptions(question) {
  return MCQ_OPTION_KEYS
    .map((key) => ({ key, value: str(question.options?.[key]).trim() }))
    .filter((option) => option.value)
}

// Compose a single-line, DOCX-safe QuestionText from a typed question. The DOCX
// composer only reads QuestionText, so options / blanks / true-false must be baked
// in here (inline — the DOCX renders one paragraph per question).
function composeQuestionText(type, question) {
  if (type === 'MCQ') {
    const options = filledOptions(question)
    if (!options.length) {
      return str(question.text)
    }
    const rendered = options.map((option) => `(${option.key}) ${option.value}`).join('   ')
    const stem = str(question.text).trim()
    return stem ? `${stem}   ${rendered}` : rendered
  }
  if (type === 'Fill in the blanks') {
    const before = str(question.blankBefore).trim()
    const after = str(question.blankAfter).trim()
    const blank = BLANK_UNDERSCORES[question.blankSize] || BLANK_UNDERSCORES.medium
    if (!before && !after) {
      const stem = str(question.text).trim()
      return stem ? `${stem} ${blank}` : blank
    }
    return `${before} ${blank} ${after}`.replace(/\s+/g, ' ').trim()
  }
  if (type === 'True/False') {
    const statement = str(question.text).trim()
    return statement ? `${statement} (True / False)` : '(True / False)'
  }
  return str(question.text)
}

// Structured payload the preview can render richly. Null for plain types (or empty
// structured content) so the preview falls back to QuestionText.
function buildStructured(type, question) {
  if (type === 'MCQ') {
    const options = filledOptions(question)
    if (!options.length) {
      return null
    }
    return {
      type: 'mcq',
      stem: str(question.text),
      options,
      layout: question.mcqLayout === 'horizontal' ? 'horizontal' : 'vertical',
    }
  }
  if (type === 'Fill in the blanks') {
    const before = str(question.blankBefore).trim()
    const after = str(question.blankAfter).trim()
    if (!before && !after) {
      return null
    }
    return { type: 'blank', before, after, size: BLANK_SIZES.includes(question.blankSize) ? question.blankSize : 'medium' }
  }
  if (type === 'True/False') {
    return { type: 'truefalse', statement: str(question.text) }
  }
  return null
}

// Convert the editable model into the generated-row shape PaperPreview + the DOCX
// composer consume. QuestionText is the composed single-line text (DOCX-safe); the
// extra `structured` field lets the preview render options / blanks / true-false
// nicely and is ignored by the composer and the Excel/data view.
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
        QuestionText: composeQuestionText(section.questionType, question),
        Marks: marks > 0 ? String(marks) : '',
        Difficulty: '',
        QuestionType: section.questionType,
        QuestionSource: question.source || QUESTION_SOURCE,
        SourceLabel: question.sourceLabel || SOURCE_LABEL,
        TeacherProvided: 'Yes',
        QuestionBankId: '',
        Answer: question.answer || '',
        structured: buildStructured(section.questionType, question),
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
