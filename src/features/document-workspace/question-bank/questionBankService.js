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
  marksPerQuestion = null,
  excludeIds = [],
} = {}) {
  const requestedCount = Math.max(0, Math.round(Number(count) || 0))
  if (requestedCount === 0) {
    return []
  }

  const excluded = new Set(excludeIds)
  const normalizedDifficulty = normalizeDifficulty(difficulty)
  const normalizedMarks = normalizeMarks(marksPerQuestion)
  const scopedQuestions = findQuestionsForScope(scopeId).filter((question) => !excluded.has(question.id))
  const difficultyMatches = normalizedDifficulty
    ? scopedQuestions.filter((question) => question.difficulty === normalizedDifficulty)
    : scopedQuestions

  if (!difficultyMatches.length) {
    return []
  }

  const marksMatches = normalizedMarks === null
    ? difficultyMatches
    : difficultyMatches.filter((question) => normalizeMarks(question.marks) === normalizedMarks)
  const candidates = marksMatches.length >= requestedCount ? marksMatches : difficultyMatches

  return candidates.slice(0, requestedCount).map((question) => ({ ...question }))
}

export { PLACEHOLDER_ONLY_SCOPE_ID }
