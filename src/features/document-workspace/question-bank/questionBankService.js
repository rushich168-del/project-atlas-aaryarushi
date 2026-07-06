import {
  PLACEHOLDER_ONLY_SCOPE_ID,
  STARTER_QUESTION_BANK,
  STARTER_QUESTION_BANK_SCOPES,
} from './starterQuestionBank.js'

function normalizeDifficulty(value) {
  const text = String(value || '').trim().toLowerCase()
  if (text === 'easy') return 'Easy'
  if (text === 'medium') return 'Medium'
  if (text === 'hard') return 'Hard'
  return ''
}

function normalizeMarks(value) {
  const marks = Number(value)
  return Number.isFinite(marks) ? Math.round(marks) : null
}

function normalizeQuestionType(value) {
  return String(value || '').trim().toLowerCase()
}

function variantOffset(variantId) {
  if (variantId === 'set-b') return 1
  if (variantId === 'set-c') return 2
  return 0
}

function refreshOffset(refreshVariant) {
  const match = String(refreshVariant || '').match(/^refresh-(\d+)$/)
  if (!match) {
    return 0
  }
  return Math.max(0, Number(match[1]) - 1)
}

function rotate(items, offset) {
  if (!items.length) {
    return []
  }
  const safeOffset = ((offset % items.length) + items.length) % items.length
  return [...items.slice(safeOffset), ...items.slice(0, safeOffset)]
}

function uniqueById(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false
    }
    seen.add(item.id)
    return true
  })
}

export function getQuestionBankScopes() {
  return STARTER_QUESTION_BANK_SCOPES.map((scope) => ({ ...scope }))
}

export function findQuestionBankScope(scopeId) {
  return STARTER_QUESTION_BANK_SCOPES.find((scope) => scope.id === scopeId) || null
}

export function findQuestionsForScope(scopeId) {
  if (!scopeId || scopeId === PLACEHOLDER_ONLY_SCOPE_ID) {
    return []
  }

  return STARTER_QUESTION_BANK
    .filter((question) => question.scopeId === scopeId)
    .map((question) => ({ ...question }))
}

export function selectQuestionBankQuestions({
  scopeId,
  count,
  difficulty = '',
  questionType = '',
  marksPerQuestion = null,
  variantId = 'set-a',
  refreshVariant = 'refresh-1',
  excludeIds = [],
} = {}) {
  const requestedCount = Math.max(0, Math.round(Number(count) || 0))
  if (requestedCount === 0) {
    return []
  }

  const excluded = new Set(excludeIds)
  const normalizedDifficulty = normalizeDifficulty(difficulty)
  const normalizedQuestionType = normalizeQuestionType(questionType)
  const normalizedMarks = normalizeMarks(marksPerQuestion)
  const scopedQuestions = findQuestionsForScope(scopeId).filter((question) => !excluded.has(question.id))

  if (!scopedQuestions.length) {
    return []
  }

  const typeMatches = normalizedQuestionType
    ? scopedQuestions.filter((question) => normalizeQuestionType(question.questionType) === normalizedQuestionType)
    : scopedQuestions
  const typeMarksMatches = typeMatches.filter((question) => normalizedMarks === null || normalizeMarks(question.marks) === normalizedMarks)
  const exactMatches = scopedQuestions.filter((question) => {
    const typeOk = !normalizedQuestionType || normalizeQuestionType(question.questionType) === normalizedQuestionType
    const difficultyOk = !normalizedDifficulty || question.difficulty === normalizedDifficulty
    const marksOk = normalizedMarks === null || normalizeMarks(question.marks) === normalizedMarks
    return typeOk && difficultyOk && marksOk
  })

  const offset = variantOffset(variantId) + (refreshOffset(refreshVariant) * 3)
  const candidates = uniqueById([
    ...rotate(exactMatches, offset),
    ...rotate(typeMarksMatches, offset),
    ...rotate(typeMatches, offset),
    ...rotate(scopedQuestions, offset),
  ])

  return candidates
    .slice(0, requestedCount)
    .map((question) => ({ ...question }))
}

export { PLACEHOLDER_ONLY_SCOPE_ID }
