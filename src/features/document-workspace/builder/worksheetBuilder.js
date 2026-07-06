// Project Atlas v2.84 — Worksheet auto builder (pure, browser-safe).
//
// Generates mathematically-correct arithmetic practice rows from a teacher config
// (class, subject, chapter, topic, pattern, difficulty, range, count). No eval, no
// network, no DOM. A tiny seeded PRNG makes the same config reproduce the same
// worksheet (stable previews, restore-friendly, testable).
//
// Honesty: only arithmetic patterns have a real generator. Any other requested
// pattern returns an explicit notice instead of fabricated questions.

import {
  ARITHMETIC_OPERATIONS,
  ARITHMETIC_OPERATION_IDS,
  SUPPORTED_WORKSHEET_PATTERNS,
  WORKSHEET_DIFFICULTY_IDS,
  WORKSHEET_GENERATED_COLUMNS,
} from './builderPresets.js'

export const WORKSHEET_COLUMNS = WORKSHEET_GENERATED_COLUMNS

const OPERATION_SYMBOLS = Object.fromEntries(ARITHMETIC_OPERATIONS.map((op) => [op.id, op.symbol]))
const CONCRETE_OPERATIONS = ['addition', 'subtraction', 'multiplication', 'division']

// Difficulty caps the effective factor range for multiplication/division so an
// "easy" sheet never asks for 97 × 83. Addition/subtraction use the raw range.
const DIFFICULTY_FACTOR_CAP = { easy: 10, medium: 20, hard: Infinity }

// Deterministic PRNG (mulberry32) + string hash, so previews are reproducible.
function hashSeed(value) {
  let hash = 2166136261
  const text = String(value)
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randInt(rng, lo, hi) {
  if (hi < lo) {
    return lo
  }
  return lo + Math.floor(rng() * (hi - lo + 1))
}

function clampInt(value, lo, hi, fallback) {
  const num = Math.round(Number(value))
  if (!Number.isFinite(num)) {
    return fallback
  }
  return Math.min(hi, Math.max(lo, num))
}

function capitalize(value) {
  const text = String(value || '')
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

// Build one problem for a concrete operation. Returns { text, answer }.
// Subtraction keeps a >= b (no negative answers by default). Division is always
// clean: pick divisor and quotient in range, dividend = divisor * quotient.
function buildProblem(operation, rng, min, max, factorMax) {
  switch (operation) {
    case 'subtraction': {
      let a = randInt(rng, min, max)
      let b = randInt(rng, min, max)
      if (b > a) {
        const swap = a
        a = b
        b = swap
      }
      return { text: `${a} ${OPERATION_SYMBOLS.subtraction} ${b} = ____`, answer: a - b }
    }
    case 'multiplication': {
      const hi = Math.min(max, factorMax)
      const a = randInt(rng, min, hi)
      const b = randInt(rng, min, hi)
      return { text: `${a} ${OPERATION_SYMBOLS.multiplication} ${b} = ____`, answer: a * b }
    }
    case 'division': {
      const hi = Math.min(max, factorMax)
      const divisor = randInt(rng, Math.max(1, min), Math.max(1, hi))
      const quotient = randInt(rng, Math.max(1, min), Math.max(1, hi))
      const dividend = divisor * quotient
      return { text: `${dividend} ${OPERATION_SYMBOLS.division} ${divisor} = ____`, answer: quotient }
    }
    case 'addition':
    default: {
      const a = randInt(rng, min, max)
      const b = randInt(rng, min, max)
      return { text: `${a} ${OPERATION_SYMBOLS.addition} ${b} = ____`, answer: a + b }
    }
  }
}

// Normalize + clamp a raw builder config into safe generation inputs. Metadata
// (class/subject/chapter/topic/instructions) is passed through as trimmed text.
export function normalizeWorksheetConfig(rawConfig = {}) {
  const operation = ARITHMETIC_OPERATION_IDS.includes(rawConfig.operation) ? rawConfig.operation : 'addition'
  const difficulty = WORKSHEET_DIFFICULTY_IDS.includes(rawConfig.difficulty) ? rawConfig.difficulty : 'easy'
  const count = clampInt(rawConfig.count, 1, 100, 10)

  let min = clampInt(rawConfig.min, 0, 100000, 1)
  let max = clampInt(rawConfig.max, 0, 100000, 10)
  if (min > max) {
    const swap = min
    min = max
    max = swap
  }
  if (max < 1) {
    max = 1
  }

  const includeAnswerKey = rawConfig.includeAnswerKey !== false
  const operationMeta = ARITHMETIC_OPERATIONS.find((op) => op.id === operation)
  const text = (value, fallback, limit = 80) => String(value ?? fallback ?? '').trim().slice(0, limit)

  return {
    operation,
    difficulty,
    count,
    min,
    max,
    includeAnswerKey,
    grade: text(rawConfig.grade, ''),
    subject: text(rawConfig.subject, ''),
    chapter: text(rawConfig.chapter, ''),
    topic: text(rawConfig.topic, operationMeta?.topic || 'Arithmetic'),
    instructions: text(rawConfig.instructions, '', 200),
    seed: rawConfig.seed,
  }
}

// Generate the worksheet question rows. Returns { columns, rows, notice, meta }.
// When the requested pattern has no real generator, rows is empty and notice
// carries an honest message the UI can surface.
export function generateWorksheetRows(rawConfig = {}) {
  if (rawConfig.operation && !SUPPORTED_WORKSHEET_PATTERNS.includes(rawConfig.operation)) {
    return {
      columns: WORKSHEET_COLUMNS,
      rows: [],
      notice: 'This topic needs a question bank. For now, use arithmetic patterns or upload your own content.',
      meta: null,
    }
  }

  const config = normalizeWorksheetConfig(rawConfig)
  const seedString = `${config.operation}|${config.difficulty}|${config.count}|${config.min}|${config.max}|${config.seed ?? ''}`
  const rng = mulberry32(hashSeed(seedString))
  const factorMax = DIFFICULTY_FACTOR_CAP[config.difficulty] ?? Infinity
  const rows = []

  for (let index = 0; index < config.count; index += 1) {
    const operation = config.operation === 'mixed'
      ? CONCRETE_OPERATIONS[randInt(rng, 0, CONCRETE_OPERATIONS.length - 1)]
      : config.operation
    const { text, answer } = buildProblem(operation, rng, config.min, config.max, factorMax)

    rows.push({
      QuestionNo: `Q${index + 1}`,
      Class: config.grade,
      Subject: config.subject,
      Chapter: config.chapter,
      Topic: config.topic,
      QuestionText: text,
      Answer: config.includeAnswerKey ? String(answer) : '',
      Difficulty: capitalize(config.difficulty),
      Instructions: config.instructions,
    })
  }

  return {
    columns: WORKSHEET_COLUMNS,
    rows,
    notice: '',
    meta: {
      count: config.count,
      operation: config.operation,
      difficulty: capitalize(config.difficulty),
      range: `${config.min}–${config.max}`,
      includeAnswerKey: config.includeAnswerKey,
    },
  }
}
