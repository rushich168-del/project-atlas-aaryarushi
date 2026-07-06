// Project Atlas v2.84 — Education-domain presets for the teacher builders.
//
// Pure data only (no DOM, no network). These describe the syllabus-aware
// foundation shared by the Worksheet Builder and the Question Paper Builder.
// IMPORTANT honesty rule: this is metadata/scaffolding only. The app does NOT
// yet understand any full syllabus — board / syllabus name / chapter / topic and
// the free-text "custom syllabus notes" are teacher-provided context that we
// store and display, nothing more. Real class/subject/topic question banks and
// board-specific rules are a future expansion.

export const SYLLABUS_SOURCES = [
  { id: 'builtin', label: 'Built-in starter' },
  { id: 'custom', label: 'Teacher custom syllabus' },
]

export const SYLLABUS_SOURCE_IDS = SYLLABUS_SOURCES.map((source) => source.id)

// Free-text board field examples (kept here so worksheet + paper stay in sync).
export const BOARD_EXAMPLES = 'CBSE, State Board, ICSE, Custom'

export const EXAM_TYPES = [
  { id: 'class-test', label: 'Class test' },
  { id: 'unit-test', label: 'Unit test' },
  { id: 'practice-test', label: 'Practice test' },
  { id: 'term-paper', label: 'Term paper' },
  { id: 'custom', label: 'Custom' },
]

export const EXAM_TYPE_IDS = EXAM_TYPES.map((type) => type.id)

// Question types for the paper builder (MCQ added in v2.84).
export const PAPER_QUESTION_TYPES = ['Short answer', 'Long answer', 'MCQ', 'Mixed']

// --- v2.85 document layout options (worksheet / question paper composer) ---

export const WORKSHEET_LAYOUT_STYLES = [
  { id: 'simple', label: 'Simple' },
  { id: 'boxed', label: 'Boxed header' },
  { id: 'exam', label: 'Exam style' },
]

export const WORKSHEET_QUESTION_LAYOUTS = [
  { id: 'one', label: 'One column' },
  { id: 'two', label: 'Two column' },
]

export const WORKSHEET_ANSWER_SPACES = [
  { id: 'short', label: 'Short blank' },
  { id: 'working', label: 'Working space' },
  { id: 'none', label: 'None' },
]

export const SECTION_NAMING_STYLES = [
  { id: 'section', label: 'Section A / B / C' },
  { id: 'part', label: 'Part I / II / III' },
]

// v2.86 patch 2 — pagination options.
export const ANSWER_KEY_LOCATIONS = [
  { id: 'end', label: 'End of worksheet' },
  { id: 'newpage', label: 'New page' },
]

export const SECTION_LAYOUTS = [
  { id: 'continuous', label: 'Continuous' },
  { id: 'newpage', label: 'Start each section on new page' },
]

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

// Display name for the Nth (0-based) section given the chosen naming style.
export function sectionDisplayName(index, style) {
  if (style === 'part') {
    return `Part ${ROMAN[index] || index + 1}`
  }
  return `Section ${index < 26 ? String.fromCharCode(65 + index) : index + 1}`
}
