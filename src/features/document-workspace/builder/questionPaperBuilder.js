// Project Atlas v2.84 — Question paper auto builder (pure, browser-safe).
//
// Phase-1 foundation: builds a CORRECT paper structure / blueprint (sections,
// question counts, marks, difficulty spread) plus clearly-labelled sample question
// placeholders. It deliberately does NOT invent real subject content — until a
// class/subject/topic question bank exists, every QuestionText is a visible
// placeholder. No eval, no network, no DOM.

import {
  DEFAULT_QUESTION_SOURCE_MODE,
  QUESTION_BLUEPRINT_MODE_IDS,
  QUESTION_DIFFICULTY_DISTRIBUTIONS,
  QUESTION_PAPER_GENERATED_COLUMNS,
  QUESTION_REFRESH_VARIANT_IDS,
  QUESTION_SECTION_PATTERN_IDS,
  QUESTION_SECTION_PATTERNS,
  QUESTION_SOURCE_MODE_IDS,
  QUESTION_VARIANT_IDS,
} from './builderPresets.js'
import { sectionDisplayName } from './educationPresets.js'
import {
  estimateQuestionAvailability,
  findQuestionBankScope,
  PLACEHOLDER_ONLY_SCOPE_ID,
  selectQuestionBankQuestions,
} from '../question-bank/questionBankService.js'
import {
  countTeacherPastedQuestions,
  createDraftQuestionsFromMaterial,
  estimateDraftCoverage,
  parseTeacherPastedQuestions,
} from '../question-bank/teacherMaterialSource.js'

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

const BLUEPRINT_SECTION_DEFAULTS = {
  A: {
    title: 'Section A',
    instruction: 'Answer all questions.',
    marks: 1,
    totalQuestions: 5,
    mcqCount: 2,
    fillBlankCount: 2,
    trueFalseCount: 1,
    shortAnswerCount: 0,
    longAnswerCount: 0,
    easyCount: 3,
    mediumCount: 2,
    hardCount: 0,
  },
  B: {
    title: 'Section B',
    instruction: 'Answer all questions.',
    marks: 2,
    totalQuestions: 4,
    mcqCount: 0,
    fillBlankCount: 0,
    trueFalseCount: 0,
    shortAnswerCount: 4,
    longAnswerCount: 0,
    easyCount: 1,
    mediumCount: 2,
    hardCount: 1,
  },
  C: {
    title: 'Section C',
    instruction: 'Answer all questions.',
    marks: 3,
    totalQuestions: 3,
    mcqCount: 0,
    fillBlankCount: 0,
    trueFalseCount: 0,
    shortAnswerCount: 0,
    longAnswerCount: 3,
    easyCount: 0,
    mediumCount: 1,
    hardCount: 2,
  },
  D: {
    title: 'Section D',
    instruction: 'Answer all questions.',
    marks: 4,
    totalQuestions: 2,
    mcqCount: 0,
    fillBlankCount: 0,
    trueFalseCount: 0,
    shortAnswerCount: 0,
    longAnswerCount: 2,
    easyCount: 0,
    mediumCount: 1,
    hardCount: 1,
  },
  E: {
    title: 'Section E',
    instruction: 'Answer any one question.',
    marks: 5,
    totalQuestions: 2,
    mcqCount: 0,
    fillBlankCount: 0,
    trueFalseCount: 0,
    shortAnswerCount: 0,
    longAnswerCount: 2,
    easyCount: 0,
    mediumCount: 1,
    hardCount: 1,
  },
  F: {
    title: 'Section F',
    instruction: 'Higher-order thinking questions.',
    marks: 5,
    totalQuestions: 1,
    mcqCount: 0,
    fillBlankCount: 0,
    trueFalseCount: 0,
    shortAnswerCount: 0,
    longAnswerCount: 1,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 1,
  },
}

const MIN_BLUEPRINT_SECTIONS = 3
const MAX_BLUEPRINT_SECTIONS = 6
const BLUEPRINT_SECTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F']
const QUESTION_TYPE_COUNT_FIELDS = ['mcqCount', 'fillBlankCount', 'trueFalseCount', 'shortAnswerCount', 'longAnswerCount']
const DIFFICULTY_COUNT_FIELDS = ['easyCount', 'mediumCount', 'hardCount']

function blueprintField(sectionKey, field) {
  return `section${sectionKey}${field.charAt(0).toUpperCase()}${field.slice(1)}`
}

function boolValue(value, fallback) {
  return value === undefined ? fallback : value !== false
}

function sectionInt(rawConfig, sectionKey, field, lo, hi) {
  const defaults = BLUEPRINT_SECTION_DEFAULTS[sectionKey]
  return clampInt(rawConfig[blueprintField(sectionKey, field)], lo, hi, defaults[field])
}

function sectionText(rawConfig, sectionKey, field, limit = 120) {
  const defaults = BLUEPRINT_SECTION_DEFAULTS[sectionKey]
  return text(rawConfig[blueprintField(sectionKey, field)], defaults[field], limit)
}

function expandCounts(items, total, fallback) {
  const output = []
  items.forEach((item) => {
    const count = Math.max(0, Math.round(Number(item.count) || 0))
    for (let i = 0; i < count; i += 1) {
      output.push(item.value)
    }
  })

  if (output.length >= total) {
    return output.slice(0, total)
  }

  while (output.length < total) {
    output.push(fallback)
  }

  return output
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
  const sectionPatternId = QUESTION_SECTION_PATTERN_IDS.includes(rawConfig.sectionPatternId) ? rawConfig.sectionPatternId : 'uniform'
  const questionVariant = QUESTION_VARIANT_IDS.includes(rawConfig.questionVariant) ? rawConfig.questionVariant : 'set-a'
  const refreshVariant = QUESTION_REFRESH_VARIANT_IDS.includes(rawConfig.refreshVariant) ? rawConfig.refreshVariant : 'refresh-1'
  const blueprintMode = QUESTION_BLUEPRINT_MODE_IDS.includes(rawConfig.blueprintMode) ? rawConfig.blueprintMode : 'pattern-preset'
  const questionSourceMode = QUESTION_SOURCE_MODE_IDS.includes(rawConfig.questionSourceMode)
    ? rawConfig.questionSourceMode
    : DEFAULT_QUESTION_SOURCE_MODE

  return {
    numSections,
    questionsPerSection,
    marksPerQuestion,
    includeAnswerKey,
    questionType,
    difficultyDistribution,
    sectionNamingStyle,
    sectionPatternId,
    questionVariant,
    refreshVariant,
    blueprintMode,
    questionSourceMode,
    // Teacher material source metadata. Pasted text is kept verbatim (never
    // truncated) and is NOT persisted anywhere — it only lives in this form value.
    sourceMetadata: {
      pastedText: typeof rawConfig.teacherPastedMaterial === 'string' ? rawConfig.teacherPastedMaterial : '',
      referenceMaterial: typeof rawConfig.referenceMaterial === 'string' ? rawConfig.referenceMaterial : '',
      referenceBook: text(rawConfig.referenceBook, '', 160),
      referenceChapter: text(rawConfig.referenceChapter, '', 160),
      teacherInstructions: typeof rawConfig.teacherInstructions === 'string' ? rawConfig.teacherInstructions : '',
      uploadedFileName: text(rawConfig.uploadedFileName, '', 200),
    },
    rawConfig,
    questionBankScopeId: text(rawConfig.questionBankScopeId, PLACEHOLDER_ONLY_SCOPE_ID, 120) || PLACEHOLDER_ONLY_SCOPE_ID,
    board: text(rawConfig.board, ''),
    grade: text(rawConfig.grade, ''),
    subject: text(rawConfig.subject, 'the subject'),
    chapter: text(rawConfig.chapterRange ?? rawConfig.chapter, ''),
    topic: text(rawConfig.topicRange ?? rawConfig.topic, ''),
  }
}

function createPlaceholderQuestion(config, sectionConfig, scopeLabel) {
  return {
    ProductId: 'AR-QUESTION-PRO',
    Class: config.grade,
    Board: config.board,
    Subject: config.subject,
    Chapter: config.chapter,
    Topic: config.topic,
    QuestionText: `Placeholder question - add a real question for this syllabus/topic (${scopeLabel}).`,
    Answer: config.includeAnswerKey ? '[Answer key placeholder]' : '',
    QuestionBankId: '',
    QuestionType: sectionConfig.questionType,
    QuestionSource: 'placeholder',
    SourceLabel: 'Placeholder',
    TeacherProvided: false,
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
    SourceLabel: 'Starter bank',
    TeacherProvided: false,
  }
}

// A row built from the teacher's own pasted text. The text is used as-is; no
// answer is parsed in v2.92, so the answer stays a clear teacher-review note.
function createTeacherMaterialQuestion(teacherQuestion, config, sectionConfig) {
  return {
    ProductId: 'AR-QUESTION-PRO',
    Class: config.grade,
    Board: config.board,
    Subject: config.subject,
    Chapter: config.chapter,
    Topic: config.topic,
    QuestionText: teacherQuestion.text,
    Answer: config.includeAnswerKey ? '[Teacher to add answer]' : '',
    QuestionBankId: '',
    QuestionType: sectionConfig.questionType,
    QuestionSource: 'teacher-material',
    SourceLabel: 'Teacher material',
    TeacherProvided: true,
  }
}

// The material a teacher pasted for reference-topic drafting. The dedicated
// "Paste chapter notes / material" field is primary; the self-notes box is used
// only as a fallback so a teacher who pasted there still gets drafts.
function referenceMaterialText(config) {
  const material = config.sourceMetadata.referenceMaterial
  if (typeof material === 'string' && material.trim()) {
    return material
  }
  return config.sourceMetadata.teacherInstructions || ''
}

// Flatten the built sections into an ordered list of draft targets, matching the
// exact order the fill loop iterates so drafts align 1:1 with question slots.
function buildBlueprintTargets(sections) {
  const targets = []
  sections.forEach((section) => {
    for (let q = 0; q < section.count; q += 1) {
      targets.push({
        questionType: section.questionTypes?.[q] || section.questionType || 'Short answer',
        difficulty: section.difficulties?.[q] || 'Medium',
        marksPerQuestion: section.marksPerQuestion,
        section: section.name,
      })
    }
  })
  return targets
}

// A DRAFT practice question built from the teacher's own pasted material. The
// text/answer come from the deterministic material-to-draft generator; nothing
// is copied from a book and no correctness is claimed.
function createReferenceDraftQuestion(config, sectionConfig, draft) {
  return {
    ProductId: 'AR-QUESTION-PRO',
    Class: config.grade,
    Board: config.board,
    Subject: config.subject,
    Chapter: config.chapter,
    Topic: config.topic,
    QuestionText: draft.text,
    Answer: config.includeAnswerKey ? (draft.answer || '[Teacher to add/verify answer]') : '',
    QuestionBankId: '',
    QuestionType: draft.questionType || sectionConfig.questionType,
    QuestionSource: 'reference-topic',
    SourceLabel: 'Draft',
    TeacherProvided: false,
  }
}

function getSectionPattern(patternId) {
  return QUESTION_SECTION_PATTERNS.find((pattern) => pattern.id === patternId) || QUESTION_SECTION_PATTERNS[0]
}

function buildUniformSections(config) {
  const difficulties = buildDifficultySequence(config.difficultyDistribution, config.numSections * config.questionsPerSection)
  let offset = 0

  return Array.from({ length: config.numSections }, (_, index) => {
    const sectionDifficulties = difficulties.slice(offset, offset + config.questionsPerSection)
    offset += config.questionsPerSection

    return {
      name: sectionDisplayName(index, config.sectionNamingStyle),
      questionType: config.questionType,
      instruction: 'Answer all questions.',
      count: config.questionsPerSection,
      marksPerQuestion: config.marksPerQuestion,
      difficulties: sectionDifficulties,
      patternId: 'uniform',
    }
  })
}

function buildPresetSections(config) {
  const pattern = getSectionPattern(config.sectionPatternId)
  if (!pattern.sections) {
    return buildUniformSections(config)
  }

  return pattern.sections.map((section) => ({
    name: section.name,
    questionType: section.questionType,
    instruction: 'Answer all questions.',
    count: section.count,
    marksPerQuestion: section.marksPerQuestion,
    difficulties: Array.from({ length: section.count }, () => section.difficulty),
    patternId: pattern.id,
  }))
}

export function normalizeTeacherBlueprintSections(rawConfig = {}) {
  const sectionCount = clampInt(rawConfig.teacherBlueprintSectionCount, MIN_BLUEPRINT_SECTIONS, MAX_BLUEPRINT_SECTIONS, MIN_BLUEPRINT_SECTIONS)
  const sectionKeys = BLUEPRINT_SECTION_KEYS.slice(0, sectionCount)
  const sections = sectionKeys
    .filter((sectionKey) => boolValue(rawConfig[blueprintField(sectionKey, 'enabled')], true))
    .map((sectionKey) => {
      const totalQuestions = sectionInt(rawConfig, sectionKey, 'totalQuestions', 1, 50)
      const questionTypes = expandCounts([
        { value: 'MCQ', count: sectionInt(rawConfig, sectionKey, 'mcqCount', 0, 50) },
        { value: 'Fill in the blanks', count: sectionInt(rawConfig, sectionKey, 'fillBlankCount', 0, 50) },
        { value: 'True/False', count: sectionInt(rawConfig, sectionKey, 'trueFalseCount', 0, 50) },
        { value: 'Short answer', count: sectionInt(rawConfig, sectionKey, 'shortAnswerCount', 0, 50) },
        { value: 'Long answer', count: sectionInt(rawConfig, sectionKey, 'longAnswerCount', 0, 50) },
      ], totalQuestions, 'Short answer')
      const difficulties = expandCounts([
        { value: 'Easy', count: sectionInt(rawConfig, sectionKey, 'easyCount', 0, 50) },
        { value: 'Medium', count: sectionInt(rawConfig, sectionKey, 'mediumCount', 0, 50) },
        { value: 'Hard', count: sectionInt(rawConfig, sectionKey, 'hardCount', 0, 50) },
      ], totalQuestions, 'Medium')

      return {
        name: sectionText(rawConfig, sectionKey, 'title'),
        instruction: sectionText(rawConfig, sectionKey, 'instruction', 200),
        count: totalQuestions,
        marksPerQuestion: sectionInt(rawConfig, sectionKey, 'marks', 1, 100),
        questionTypes,
        difficulties,
        patternId: 'teacher-blueprint',
      }
    })

  return sections
}

function buildSections(config) {
  if (config.blueprintMode === 'teacher-blueprint') {
    return normalizeTeacherBlueprintSections(config.rawConfig)
  }
  return config.sectionPatternId === 'uniform' ? buildUniformSections(config) : buildPresetSections(config)
}

function countSectionFields(rawConfig, sectionKey, fields) {
  return fields.reduce((sum, field) => sum + sectionInt(rawConfig, sectionKey, field, 0, 50), 0)
}

function analyzeSectionAvailability(section, config, useQuestionBank, usedQuestionBankIds) {
  let estimatedRealQuestionCount = 0
  const targets = []

  for (let q = 0; q < section.count; q += 1) {
    const difficulty = section.difficulties[q] || 'Medium'
    const questionType = section.questionTypes?.[q] || section.questionType || 'Short answer'
    targets.push({ difficulty, questionType, marksPerQuestion: section.marksPerQuestion })

    if (!useQuestionBank) {
      continue
    }

    const availability = estimateQuestionAvailability({
      scopeId: config.questionBankScopeId,
      difficulty,
      questionType,
      marksPerQuestion: section.marksPerQuestion,
      excludeIds: usedQuestionBankIds,
    })

    if (availability.estimatedAvailable > 0) {
      estimatedRealQuestionCount += 1
      usedQuestionBankIds.push(availability.candidateIds[0])
    }
  }

  return {
    targets,
    estimatedRealQuestionCount,
    estimatedPlaceholderCount: Math.max(0, section.count - estimatedRealQuestionCount),
  }
}

function createPatternSectionSummary(section, config, useQuestionBank, usedQuestionBankIds) {
  const availability = analyzeSectionAvailability(section, config, useQuestionBank, usedQuestionBankIds)
  const totalMarks = section.count * section.marksPerQuestion
  const warnings = availability.estimatedPlaceholderCount > 0 && useQuestionBank
    ? [`Only ${availability.estimatedRealQuestionCount} usable real question${availability.estimatedRealQuestionCount === 1 ? '' : 's'} are estimated for ${section.name}. Remaining questions may use labelled placeholders.`]
    : []

  return {
    key: section.name,
    title: section.name,
    enabled: true,
    totalQuestions: section.count,
    marksPerQuestion: section.marksPerQuestion,
    totalMarks,
    questionTypeTotal: section.count,
    difficultyTotal: section.count,
    estimatedRealQuestionCount: availability.estimatedRealQuestionCount,
    estimatedPlaceholderCount: availability.estimatedPlaceholderCount,
    warnings,
  }
}

function createTeacherSectionSummary(rawConfig, sectionKey, config, useQuestionBank, usedQuestionBankIds) {
  const enabled = boolValue(rawConfig[blueprintField(sectionKey, 'enabled')], true)
  const totalQuestions = sectionInt(rawConfig, sectionKey, 'totalQuestions', 1, 50)
  const marksPerQuestion = sectionInt(rawConfig, sectionKey, 'marks', 1, 100)
  const title = sectionText(rawConfig, sectionKey, 'title')
  const questionTypeTotal = countSectionFields(rawConfig, sectionKey, QUESTION_TYPE_COUNT_FIELDS)
  const difficultyTotal = countSectionFields(rawConfig, sectionKey, DIFFICULTY_COUNT_FIELDS)
  const totalMarks = enabled ? totalQuestions * marksPerQuestion : 0
  const warnings = []

  if (enabled && questionTypeTotal !== totalQuestions) {
    warnings.push(`${title} has ${totalQuestions} question${totalQuestions === 1 ? '' : 's'}, but question type counts add up to ${questionTypeTotal}.`)
  }

  if (enabled && difficultyTotal !== totalQuestions) {
    warnings.push(`${title} has ${totalQuestions} question${totalQuestions === 1 ? '' : 's'}, but difficulty counts add up to ${difficultyTotal}.`)
  }

  if (!enabled) {
    return {
      key: sectionKey,
      title,
      enabled,
      totalQuestions: 0,
      marksPerQuestion,
      totalMarks: 0,
      questionTypeTotal,
      difficultyTotal,
      estimatedRealQuestionCount: 0,
      estimatedPlaceholderCount: 0,
      warnings,
    }
  }

  const [section] = normalizeTeacherBlueprintSections({
    ...rawConfig,
    teacherBlueprintSectionCount: 1,
    sectionAEnabled: true,
    sectionATitle: title,
    sectionAInstruction: sectionText(rawConfig, sectionKey, 'instruction', 200),
    sectionAMarks: marksPerQuestion,
    sectionATotalQuestions: totalQuestions,
    sectionAMcqCount: sectionInt(rawConfig, sectionKey, 'mcqCount', 0, 50),
    sectionAFillBlankCount: sectionInt(rawConfig, sectionKey, 'fillBlankCount', 0, 50),
    sectionATrueFalseCount: sectionInt(rawConfig, sectionKey, 'trueFalseCount', 0, 50),
    sectionAShortAnswerCount: sectionInt(rawConfig, sectionKey, 'shortAnswerCount', 0, 50),
    sectionALongAnswerCount: sectionInt(rawConfig, sectionKey, 'longAnswerCount', 0, 50),
    sectionAEasyCount: sectionInt(rawConfig, sectionKey, 'easyCount', 0, 50),
    sectionAMediumCount: sectionInt(rawConfig, sectionKey, 'mediumCount', 0, 50),
    sectionAHardCount: sectionInt(rawConfig, sectionKey, 'hardCount', 0, 50),
  })
  const availability = analyzeSectionAvailability(section, config, useQuestionBank, usedQuestionBankIds)

  if (availability.estimatedPlaceholderCount > 0 && useQuestionBank) {
    warnings.push(`Only ${availability.estimatedRealQuestionCount} usable real question${availability.estimatedRealQuestionCount === 1 ? '' : 's'} are estimated for ${title}. Remaining questions may use labelled placeholders.`)
  }

  return {
    key: sectionKey,
    title,
    enabled,
    totalQuestions,
    marksPerQuestion,
    totalMarks,
    questionTypeTotal,
    difficultyTotal,
    estimatedRealQuestionCount: availability.estimatedRealQuestionCount,
    estimatedPlaceholderCount: availability.estimatedPlaceholderCount,
    warnings,
  }
}

export function analyzeQuestionPaperBlueprint(rawConfig = {}) {
  const config = normalizeQuestionPaperConfig(rawConfig)
  const selectedScope = findQuestionBankScope(config.questionBankScopeId)
  const sourceMode = config.questionSourceMode
  // Only the Starter Question Bank mode draws real bank estimates. Pasted and
  // reference modes must not claim bank availability.
  const useQuestionBank = Boolean(
    sourceMode === 'starter-bank'
    && selectedScope
    && config.questionBankScopeId !== PLACEHOLDER_ONLY_SCOPE_ID,
  )
  const usedQuestionBankIds = []
  const warnings = []
  const blockingWarnings = []
  let sectionSummaries = []

  if (config.blueprintMode === 'teacher-blueprint') {
    const sectionCount = clampInt(rawConfig.teacherBlueprintSectionCount, MIN_BLUEPRINT_SECTIONS, MAX_BLUEPRINT_SECTIONS, MIN_BLUEPRINT_SECTIONS)
    sectionSummaries = BLUEPRINT_SECTION_KEYS
      .slice(0, sectionCount)
      .map((sectionKey) => createTeacherSectionSummary(rawConfig, sectionKey, config, useQuestionBank, usedQuestionBankIds))
  } else {
    sectionSummaries = buildSections(config).map((section) => createPatternSectionSummary(section, config, useQuestionBank, usedQuestionBankIds))
  }

  sectionSummaries.forEach((section) => {
    warnings.push(...section.warnings)
  })

  const enabledSections = sectionSummaries.filter((section) => section.enabled && section.totalQuestions > 0)
  if (!enabledSections.length) {
    blockingWarnings.push('No enabled section has questions. Add at least one question to generate a paper.')
  }

  const totalQuestions = enabledSections.reduce((sum, section) => sum + section.totalQuestions, 0)
  const totalMarks = enabledSections.reduce((sum, section) => sum + section.totalMarks, 0)
  let estimatedRealQuestionCount = enabledSections.reduce((sum, section) => sum + section.estimatedRealQuestionCount, 0)
  let estimatedPlaceholderCount = enabledSections.reduce((sum, section) => sum + section.estimatedPlaceholderCount, 0)

  if (sourceMode === 'pasted-material') {
    // Estimate how many slots the pasted questions can cover, from the parsed
    // line count. The rest fall back to labelled placeholders.
    const pastedCount = countTeacherPastedQuestions(config.sourceMetadata.pastedText)
    estimatedRealQuestionCount = Math.min(totalQuestions, pastedCount)
    estimatedPlaceholderCount = Math.max(0, totalQuestions - estimatedRealQuestionCount)
    if (totalQuestions > 0) {
      warnings.push(pastedCount === 0
        ? 'No pasted questions detected yet. Paste your questions (one per line); labelled placeholders are used until then. Review before classroom use.'
        : `About ${estimatedRealQuestionCount} of ${totalQuestions} question${totalQuestions === 1 ? '' : 's'} will use your pasted material; the rest use labelled placeholders. Review before classroom use.`)
    }
  } else if (sourceMode === 'reference-topic') {
    // Estimate how many DRAFT questions the pasted material can supply from real
    // content; the rest are honest fallback drafts.
    const materialText = config.sourceMetadata.referenceMaterial?.trim()
      ? config.sourceMetadata.referenceMaterial
      : config.sourceMetadata.teacherInstructions
    estimatedRealQuestionCount = estimateDraftCoverage(materialText, totalQuestions)
    estimatedPlaceholderCount = Math.max(0, totalQuestions - estimatedRealQuestionCount)
    if (totalQuestions > 0) {
      warnings.push('Reference / Topic mode creates draft practice questions from your material. Teacher review required — not copied book questions.')
      if (estimatedRealQuestionCount === 0) {
        warnings.push('Add more chapter notes / material to create richer draft questions. Fallback drafts are used until then.')
      }
    }
  } else if (sourceMode === 'pdf-upload') {
    estimatedRealQuestionCount = 0
    estimatedPlaceholderCount = totalQuestions
    if (totalQuestions > 0) {
      warnings.push('PDF upload is planned for a later version. Labelled placeholders are used for now.')
    }
  } else if (!useQuestionBank && totalQuestions > 0) {
    warnings.push('This setup is using placeholder-only content. Generated questions will be clearly labelled placeholders.')
  }

  return {
    totalQuestions,
    totalMarks,
    sectionSummaries,
    warnings,
    blockingWarnings,
    canGenerate: blockingWarnings.length === 0,
    estimatedRealQuestionCount,
    estimatedPlaceholderCount,
    questionSourceMode: sourceMode,
    questionBankScopeId: config.questionBankScopeId,
    questionBankLabel: selectedScope?.label || '',
    isEstimated: true,
  }
}

// Generate the blueprint rows. Returns { columns, rows, blueprint }.
export function generateQuestionPaperRows(rawConfig = {}) {
  const config = normalizeQuestionPaperConfig(rawConfig)
  const scopeLabel = config.topic || config.chapter || 'this topic'
  const selectedScope = findQuestionBankScope(config.questionBankScopeId)
  const sourceMode = config.questionSourceMode
  const isPasted = sourceMode === 'pasted-material'
  const isReference = sourceMode === 'reference-topic'
  // 'pdf-upload' is reserved and not offered in the UI; if it ever reaches here it
  // falls back to honest placeholder behavior (handled by leaving useQuestionBank
  // false and reporting it in the notice below). Only 'starter-bank' reads the bank.
  const useQuestionBank = Boolean(
    sourceMode === 'starter-bank'
    && selectedScope
    && config.questionBankScopeId !== PLACEHOLDER_ONLY_SCOPE_ID,
  )
  const teacherQuestions = isPasted ? parseTeacherPastedQuestions(config.sourceMetadata.pastedText) : []
  const sections = buildSections(config)
  // Reference / Topic: build one draft practice question per slot from the
  // teacher's pasted material, aligned 1:1 with the loop's iteration order.
  const referenceDrafts = isReference
    ? createDraftQuestionsFromMaterial({
      materialText: referenceMaterialText(config),
      topic: config.topic,
      chapter: config.chapter,
      referenceBook: config.sourceMetadata.referenceBook,
      blueprintTargets: buildBlueprintTargets(sections),
    })
    : []
  const rows = []
  const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 }
  const usedQuestionBankIds = []
  let questionBankCount = 0
  let placeholderCount = 0
  let teacherMaterialCount = 0
  let draftQuestionCount = 0
  let fallbackDraftCount = 0
  let teacherIndex = 0
  let referenceIndex = 0

  sections.forEach((sectionConfig) => {
    for (let q = 0; q < sectionConfig.count; q += 1) {
      const difficulty = sectionConfig.difficulties[q] || 'Medium'
      const questionType = sectionConfig.questionTypes?.[q] || sectionConfig.questionType || 'Short answer'
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1
      const rowSectionConfig = { ...sectionConfig, questionType }

      let questionData
      if (isPasted) {
        // Fill slots with pasted questions in paste order; fall back to labelled
        // placeholders once the teacher's questions run out.
        const teacherQuestion = teacherQuestions[teacherIndex]
        if (teacherQuestion) {
          teacherIndex += 1
          teacherMaterialCount += 1
          questionData = createTeacherMaterialQuestion(teacherQuestion, config, rowSectionConfig)
        } else {
          placeholderCount += 1
          questionData = createPlaceholderQuestion(config, rowSectionConfig, scopeLabel)
        }
      } else if (isReference) {
        const draft = referenceDrafts[referenceIndex] || {
          text: `Draft practice question — based on ${scopeLabel}. Teacher review required.`,
          answer: '[Teacher to add/verify answer]',
          questionType,
          isFallback: true,
        }
        referenceIndex += 1
        draftQuestionCount += 1
        if (draft.isFallback) {
          fallbackDraftCount += 1
        }
        questionData = createReferenceDraftQuestion(config, rowSectionConfig, draft)
      } else {
        const bankQuestion = useQuestionBank
          ? selectQuestionBankQuestions({
            scopeId: config.questionBankScopeId,
            count: 1,
            difficulty,
            questionType,
            marksPerQuestion: sectionConfig.marksPerQuestion,
            variantId: config.questionVariant,
            refreshVariant: config.refreshVariant,
            excludeIds: usedQuestionBankIds,
          })[0]
          : null
        if (bankQuestion) {
          usedQuestionBankIds.push(bankQuestion.id)
          questionBankCount += 1
          questionData = createQuestionBankQuestion(bankQuestion, config)
        } else {
          placeholderCount += 1
          questionData = createPlaceholderQuestion(config, rowSectionConfig, scopeLabel)
        }
      }

      rows.push({
        Section: sectionConfig.name,
        SectionInstruction: sectionConfig.instruction,
        QuestionNo: `Q${q + 1}`,
        ProductId: questionData.ProductId,
        Class: questionData.Class,
        Board: questionData.Board,
        Subject: questionData.Subject,
        Chapter: questionData.Chapter,
        Topic: questionData.Topic,
        QuestionText: questionData.QuestionText,
        Marks: String(sectionConfig.marksPerQuestion),
        Difficulty: difficulty,
        QuestionType: questionData.QuestionType,
        QuestionSource: questionData.QuestionSource,
        SourceLabel: questionData.SourceLabel,
        TeacherProvided: questionData.TeacherProvided ? 'Yes' : 'No',
        QuestionBankId: questionData.QuestionBankId,
        Answer: questionData.Answer,
      })
    }
  })

  const totalQuestions = rows.length
  const totalMarks = rows.reduce((sum, row) => sum + (Number(row.Marks) || 0), 0)

  const blueprint = {
    numSections: sections.length,
    questionsPerSection: config.sectionPatternId === 'uniform' ? config.questionsPerSection : '',
    marksPerQuestion: config.sectionPatternId === 'uniform' ? config.marksPerQuestion : '',
    totalQuestions,
    marksPerSection: config.sectionPatternId === 'uniform' ? config.questionsPerSection * config.marksPerQuestion : '',
    totalMarks,
    difficultySpread: difficultyCounts,
    questionType: config.questionType,
    questionVariant: config.questionVariant,
    refreshVariant: config.refreshVariant,
    blueprintMode: config.blueprintMode,
    sectionPatternId: config.sectionPatternId,
    sections: sections.map((section) => ({
      name: section.name,
      instruction: section.instruction,
      questionType: section.questionType || 'Mixed',
      count: section.count,
      marksPerQuestion: section.marksPerQuestion,
    })),
    questionBankScopeId: config.questionBankScopeId,
    questionBankLabel: selectedScope?.label || '',
    questionSourceMode: sourceMode,
    questionBankCount,
    placeholderCount,
    teacherMaterialCount,
    draftQuestionCount,
    fallbackDraftCount,
  }

  const plural = (count) => (count === 1 ? '' : 's')
  let notice = ''
  if (isPasted) {
    notice = `${teacherMaterialCount} teacher question${plural(teacherMaterialCount)} used from your pasted material`
      + (placeholderCount > 0
        ? `, and ${placeholderCount} labelled placeholder${plural(placeholderCount)} added where more questions were needed.`
        : '.')
      + ' Review before classroom use.'
  } else if (isReference) {
    notice = `${draftQuestionCount} draft practice question${plural(draftQuestionCount)} created from your material for teacher review. Original questions — not copied book questions. Teacher review required.`
    if (fallbackDraftCount > 0) {
      notice += ' Some fallback drafts were used because the material was limited.'
    }
  } else if (sourceMode === 'pdf-upload') {
    notice = 'PDF upload is planned for a later version. This paper uses labelled placeholders for now. Review before classroom use.'
  } else if (useQuestionBank) {
    notice = `${questionBankCount} question bank question${plural(questionBankCount)} used from ${config.questionVariant.toUpperCase().replace('-', ' ')} / ${config.refreshVariant.replace('-', ' ')}. ${placeholderCount} placeholder question${plural(placeholderCount)} added where the starter bank did not have enough matches.`
  }

  return { columns: QUESTION_PAPER_COLUMNS, rows, blueprint, notice }
}
