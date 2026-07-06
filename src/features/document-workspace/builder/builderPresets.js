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

export const QUESTION_TYPES = ['Multiple choice', 'Short answer', 'Long answer', 'True/False', 'Mixed']

export const QUESTION_DIFFICULTY_DISTRIBUTIONS = [
  { id: 'balanced', label: 'Balanced', weights: { Easy: 1, Medium: 1, Hard: 1 } },
  { id: 'easy-lean', label: 'Mostly easy', weights: { Easy: 3, Medium: 2, Hard: 1 } },
  { id: 'hard-lean', label: 'Mostly hard', weights: { Easy: 1, Medium: 2, Hard: 3 } },
]

// Columns produced by the question paper generator (kept in sync with questionPaperBuilder.js).
export const QUESTION_PAPER_GENERATED_COLUMNS = [
  'Section',
  'QuestionNo',
  'Class',
  'Subject',
  'Chapter',
  'Topic',
  'QuestionText',
  'Marks',
  'Difficulty',
  'Answer',
]
