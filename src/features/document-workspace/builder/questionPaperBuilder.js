// Project Atlas v2.84 — Question paper auto builder (pure, browser-safe).
//
// Phase-1 foundation: builds a CORRECT paper structure / blueprint (sections,
// question counts, marks, difficulty spread) plus clearly-labelled sample question
// placeholders. It deliberately does NOT invent real subject content — until a
// class/subject/topic question bank exists, every QuestionText is a visible
// placeholder. No eval, no network, no DOM.

import {
  QUESTION_DIFFICULTY_DISTRIBUTIONS,
  QUESTION_PAPER_GENERATED_COLUMNS,
} from './builderPresets.js'
import { sectionDisplayName } from './educationPresets.js'
import {
  findQuestionBankScope,
  PLACEHOLDER_ONLY_SCOPE_ID,
  selectQuestionBankQuestions,
} from '../question-bank/questionBankService.js'

export const QUESTION_PAPER_COLUMNS = QUESTION_PAPER_GENERATED_COLUMNS

function clampInt(value, lo, hi, fallback) {
  const num = Math.round(Number(value))
  if (!Number.isFinite(num)) {
    return fallback
  }
  return Math.min(hi, Math.max(lo, num))
}

function text(value, fallback, limit = 80) {
  return String(value ?? fallback ?? '').trim().slice(0, limit)
}


// Deterministic difficulty spread from a named distribution's integer weights.
function buildDifficultySequence(distributionId, total) {
  const distribution = QUESTION_DIFFICULTY_DISTRIBUTIONS.find((item) => item.id === distributionId)
    || QUESTION_DIFFICULTY_DISTRIBUTIONS[0]
  const weighted = []
  Object.entries(distribution.weights).forEach(([level, weight]) => {
    for (let i = 0; i < weight; i += 1) {
      weighted.push(level)
    }
  })
  const sequence = []
  for (let i = 0; i < total; i += 1) {
    sequence.push(weighted[i % weighted.length])
  }
  return sequence
}

export function normalizeQuestionPaperConfig(rawConfig = {}) {
  const numSections = clampInt(rawConfig.numSections, 1, 10, 2)
  const questionsPerSection = clampInt(rawConfig.questionsPerSection, 1, 50, 5)
  const marksPerQuestion = clampInt(rawConfig.marksPerQuestion, 1, 100, 2)
  const includeAnswerKey = rawConfig.includeAnswerKey === true
  const questionType = text(rawConfig.questionType, 'Short answer', 40)
  const difficultyDistribution = rawConfig.difficultyDistribution || 'balanced'
  const sectionNamingStyle = rawConfig.sectionNamingStyle === 'part' ? 'part' : 'section'

  return {
    numSections,
    questionsPerSection,
    marksPerQuestion,
    includeAnswerKey,
    questionType,
    difficultyDistribution,
    sectionNamingStyle,
    questionBankScopeId: text(rawConfig.questionBankScopeId, PLACEHOLDER_ONLY_SCOPE_ID, 120) || PLACEHOLDER_ONLY_SCOPE_ID,
    board: text(rawConfig.board, ''),
    grade: text(rawConfig.grade, ''),
    subject: text(rawConfig.subject, 'the subject'),
    chapter: text(rawConfig.chapterRange ?? rawConfig.chapter, ''),
    topic: text(rawConfig.topicRange ?? rawConfig.topic, ''),
  }
}

function createPlaceholderQuestion(config, scopeLabel) {
  return {
    ProductId: 'AR-QUESTION-PRO',
    Class: config.grade,
    Board: config.board,
    Subject: config.subject,
    Chapter: config.chapter,
    Topic: config.topic,
    QuestionText: `Placeholder question - add a real ${config.subject} question for ${scopeLabel}.`,
    Answer: config.includeAnswerKey ? '[Answer key placeholder]' : '',
    QuestionBankId: '',
    QuestionType: config.questionType,
    QuestionSource: 'placeholder',
  }
}

function createQuestionBankQuestion(bankQuestion, config) {
  return {
    ProductId: bankQuestion.productId,
    Class: bankQuestion.grade,
    Board: bankQuestion.board,
    Subject: bankQuestion.subject,
    Chapter: bankQuestion.chapter,
    Topic: bankQuestion.topic,
    QuestionText: bankQuestion.question,
    Answer: config.includeAnswerKey ? bankQuestion.answer : '',
    QuestionBankId: bankQuestion.id,
    QuestionType: bankQuestion.questionType,
    QuestionSource: 'question-bank',
  }
}

// Generate the blueprint rows. Returns { columns, rows, blueprint }.
export function generateQuestionPaperRows(rawConfig = {}) {
  const config = normalizeQuestionPaperConfig(rawConfig)
  const totalQuestions = config.numSections * config.questionsPerSection
  const difficulties = buildDifficultySequence(config.difficultyDistribution, totalQuestions)
  const scopeLabel = config.topic || config.chapter || 'this topic'
  const selectedScope = findQuestionBankScope(config.questionBankScopeId)
  const useQuestionBank = Boolean(selectedScope && config.questionBankScopeId !== PLACEHOLDER_ONLY_SCOPE_ID)
  const rows = []
  const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 }
  const usedQuestionBankIds = []
  let questionBankCount = 0
  let placeholderCount = 0
  let questionIndex = 0

  for (let section = 0; section < config.numSections; section += 1) {
    const name = sectionDisplayName(section, config.sectionNamingStyle)
    for (let q = 0; q < config.questionsPerSection; q += 1) {
      const difficulty = difficulties[questionIndex] || 'Medium'
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1
      const bankQuestion = useQuestionBank
        ? selectQuestionBankQuestions({
          scopeId: config.questionBankScopeId,
          count: 1,
          difficulty,
          marksPerQuestion: config.marksPerQuestion,
          excludeIds: usedQuestionBankIds,
        })[0]
        : null
      const questionData = bankQuestion
        ? createQuestionBankQuestion(bankQuestion, config)
        : createPlaceholderQuestion(config, scopeLabel)

      if (bankQuestion) {
        usedQuestionBankIds.push(bankQuestion.id)
        questionBankCount += 1
      } else {
        placeholderCount += 1
      }

      rows.push({
        Section: name,
        QuestionNo: `Q${q + 1}`,
        ProductId: questionData.ProductId,
        Class: questionData.Class,
        Board: questionData.Board,
        Subject: questionData.Subject,
        Chapter: questionData.Chapter,
        Topic: questionData.Topic,
        QuestionText: questionData.QuestionText,
        Marks: String(config.marksPerQuestion),
        Difficulty: difficulty,
        QuestionType: questionData.QuestionType,
        QuestionSource: questionData.QuestionSource,
        QuestionBankId: questionData.QuestionBankId,
        Answer: questionData.Answer,
      })
      questionIndex += 1
    }
  }

  const blueprint = {
    numSections: config.numSections,
    questionsPerSection: config.questionsPerSection,
    marksPerQuestion: config.marksPerQuestion,
    totalQuestions,
    marksPerSection: config.questionsPerSection * config.marksPerQuestion,
    totalMarks: totalQuestions * config.marksPerQuestion,
    difficultySpread: difficultyCounts,
    questionType: config.questionType,
    questionBankScopeId: config.questionBankScopeId,
    questionBankLabel: selectedScope?.label || '',
    questionBankCount,
    placeholderCount,
  }

  const notice = useQuestionBank
    ? `${questionBankCount} question bank question${questionBankCount === 1 ? '' : 's'} used. ${placeholderCount} placeholder question${placeholderCount === 1 ? '' : 's'} added where the starter bank did not have enough matches.`
    : ''

  return { columns: QUESTION_PAPER_COLUMNS, rows, blueprint, notice }
}
