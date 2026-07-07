// Project Atlas v2.83 — Auto Builder shared presets.
//
// Pure data only (no DOM, no network, no engine coupling). Both the product config
// (config.js) and the pure generators import from here so preset ids/labels never
// drift apart. Phase 1 covers an initial Arithmetic preset group for worksheets and
// a structure/blueprint preset group for question papers. Expanding to more
// classes / subjects / topics later means adding entries here — nothing else.

export const ARITHMETIC_OPERATIONS = [
  { id: 'addition', label: 'Addition', symbol: '+', topic: 'Addition' },
  { id: 'subtraction', label: 'Subtraction', symbol: '−', topic: 'Subtraction' },
  { id: 'multiplication', label: 'Multiplication', symbol: '×', topic: 'Multiplication' },
  { id: 'division', label: 'Division', symbol: '÷', topic: 'Division' },
  { id: 'mixed', label: 'Mixed operations', symbol: '±', topic: 'Mixed arithmetic' },
]

export const ARITHMETIC_OPERATION_IDS = ARITHMETIC_OPERATIONS.map((operation) => operation.id)

// The only worksheet patterns with a REAL generator in this phase. Anything else
// (a subject topic without a question bank) is honestly reported, not faked.
export const SUPPORTED_WORKSHEET_PATTERNS = ARITHMETIC_OPERATION_IDS

export const WORKSHEET_DIFFICULTIES = [
  { id: 'easy', label: 'Easy', defaultMin: 1, defaultMax: 10 },
  { id: 'medium', label: 'Medium', defaultMin: 1, defaultMax: 50 },
  { id: 'hard', label: 'Hard', defaultMin: 10, defaultMax: 100 },
]

export const WORKSHEET_DIFFICULTY_IDS = WORKSHEET_DIFFICULTIES.map((level) => level.id)

// Columns produced by the worksheet generator (kept in sync with worksheetBuilder.js).
export const WORKSHEET_GENERATED_COLUMNS = [
  'QuestionNo',
  'Class',
  'Subject',
  'Chapter',
  'Topic',
  'QuestionText',
  'Answer',
  'Difficulty',
  'Instructions',
]

// --- Question paper foundation presets ---

export const QUESTION_PAPER_PATTERNS = [
  { id: 'class-test', label: 'Class test', sections: 1, questionsPerSection: 5, marksPerQuestion: 2, questionType: 'Short answer' },
  { id: 'unit-test', label: 'Unit test', sections: 2, questionsPerSection: 5, marksPerQuestion: 3, questionType: 'Short answer' },
  { id: 'practice-test', label: 'Practice test', sections: 2, questionsPerSection: 6, marksPerQuestion: 2, questionType: 'Mixed' },
  { id: 'sectioned-paper', label: 'Section-based paper', sections: 3, questionsPerSection: 5, marksPerQuestion: 4, questionType: 'Mixed' },
]

export const QUESTION_VARIANTS = [
  { id: 'set-a', label: 'Set A', offset: 0 },
  { id: 'set-b', label: 'Set B', offset: 1 },
  { id: 'set-c', label: 'Set C', offset: 2 },
]

export const QUESTION_VARIANT_IDS = QUESTION_VARIANTS.map((variant) => variant.id)

export const QUESTION_REFRESH_VARIANTS = [
  { id: 'refresh-1', label: 'Refresh 1', offset: 0 },
  { id: 'refresh-2', label: 'Refresh 2', offset: 1 },
  { id: 'refresh-3', label: 'Refresh 3', offset: 2 },
  { id: 'refresh-4', label: 'Refresh 4', offset: 3 },
  { id: 'refresh-5', label: 'Refresh 5', offset: 4 },
]

export const QUESTION_REFRESH_VARIANT_IDS = QUESTION_REFRESH_VARIANTS.map((variant) => variant.id)

export const QUESTION_BLUEPRINT_MODES = [
  { id: 'pattern-preset', label: 'Pattern Preset' },
  { id: 'teacher-blueprint', label: 'Teacher Blueprint' },
]

export const QUESTION_BLUEPRINT_MODE_IDS = QUESTION_BLUEPRINT_MODES.map((mode) => mode.id)

// --- v2.92 Teacher Material Source foundation ---
//
// Where the question TEXT comes from. This is orthogonal to the blueprint
// structure (sections/marks/difficulty) — every mode still uses buildSections().
// 'pdf-upload' is reserved for a later version and is deliberately NOT offered in
// the UI selector below.
export const QUESTION_SOURCE_MODES = [
  { id: 'starter-bank', label: 'Starter Question Bank' },
  { id: 'pasted-material', label: 'Teacher Pasted Material' },
  { id: 'reference-topic', label: 'Teacher Reference / Topic' },
  { id: 'pdf-upload', label: 'PDF Upload (planned later)', reserved: true },
]

export const QUESTION_SOURCE_MODE_IDS = QUESTION_SOURCE_MODES.map((mode) => mode.id)

// UI selector options — reserved modes (e.g. pdf-upload) are filtered out so no
// dead/unsupported option is shown to teachers in v2.92.
export const QUESTION_SOURCE_MODE_OPTIONS = QUESTION_SOURCE_MODES
  .filter((mode) => !mode.reserved)
  .map((mode) => ({ value: mode.id, label: mode.label }))

export const DEFAULT_QUESTION_SOURCE_MODE = 'starter-bank'

export const QUESTION_TYPE_OPTIONS = ['MCQ', 'Fill in the blanks', 'True/False', 'Short answer', 'Long answer']

export const QUESTION_SECTION_PATTERNS = [
  {
    id: 'uniform',
    label: 'Simple / Current Pattern',
    description: 'Uses the current section count, question count, marks, question type, and difficulty mix fields.',
    sections: null,
  },
  {
    id: 'balanced-exam',
    label: 'Balanced Exam Pattern',
    description: 'Easy MCQ section, medium short-answer section, and hard long-answer section.',
    sections: [
      { name: 'Section A', questionType: 'MCQ', count: 5, marksPerQuestion: 1, difficulty: 'Easy' },
      { name: 'Section B', questionType: 'Short answer', count: 5, marksPerQuestion: 2, difficulty: 'Medium' },
      { name: 'Section C', questionType: 'Long answer', count: 3, marksPerQuestion: 3, difficulty: 'Hard' },
    ],
  },
  {
    id: 'mcq-short-long',
    label: 'MCQ + Short Answer + Long Answer',
    description: 'Larger MCQ section followed by short-answer and long-answer sections.',
    sections: [
      { name: 'Section A', questionType: 'MCQ', count: 6, marksPerQuestion: 1, difficulty: 'Easy' },
      { name: 'Section B', questionType: 'Short answer', count: 4, marksPerQuestion: 2, difficulty: 'Medium' },
      { name: 'Section C', questionType: 'Long answer', count: 3, marksPerQuestion: 3, difficulty: 'Hard' },
    ],
  },
  {
    id: 'short-long',
    label: 'Short Answer + Long Answer',
    description: 'Two-section paper with medium short-answer and hard long-answer questions.',
    sections: [
      { name: 'Section A', questionType: 'Short answer', count: 6, marksPerQuestion: 2, difficulty: 'Medium' },
      { name: 'Section B', questionType: 'Long answer', count: 4, marksPerQuestion: 3, difficulty: 'Hard' },
    ],
  },
]

export const QUESTION_SECTION_PATTERN_IDS = QUESTION_SECTION_PATTERNS.map((pattern) => pattern.id)

export const QUESTION_TYPES = ['Multiple choice', 'Short answer', 'Long answer', 'True/False', 'Mixed']

export const QUESTION_DIFFICULTY_DISTRIBUTIONS = [
  { id: 'balanced', label: 'Balanced', weights: { Easy: 1, Medium: 1, Hard: 1 } },
  { id: 'easy-lean', label: 'Mostly easy', weights: { Easy: 3, Medium: 2, Hard: 1 } },
  { id: 'hard-lean', label: 'Mostly hard', weights: { Easy: 1, Medium: 2, Hard: 3 } },
]

// Columns produced by the question paper generator (kept in sync with questionPaperBuilder.js).
export const QUESTION_PAPER_GENERATED_COLUMNS = [
  'Section',
  'SectionInstruction',
  'QuestionNo',
  'ProductId',
  'Class',
  'Board',
  'Subject',
  'Chapter',
  'Topic',
  'QuestionText',
  'Marks',
  'Difficulty',
  'QuestionType',
  'QuestionSource',
  'SourceLabel',
  'TeacherProvided',
  'QuestionBankId',
  'Answer',
]
