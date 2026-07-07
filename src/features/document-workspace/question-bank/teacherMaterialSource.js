// Project Atlas v2.92 — Teacher pasted material parser (pure, browser-safe).
//
// Turns a teacher's pasted block of text into a clean, ordered list of question
// objects. Everything here is DELIBERATELY minimal and honest:
//   - No dependencies, no Supabase, no network, no browser storage, no secrets.
//   - Deterministic: the same pasted text always yields the same questions.
//   - Line-based only. One line = one question. Blank lines are dropped.
//   - Strips common numbering prefixes so a teacher can paste a numbered list.
//   - It does NOT parse answers in v2.92, and it does NOT persist anything.
//
// The pasted text is treated strictly as teacher-provided content. This module
// never invents, rewrites, or "understands" the material — it only tidies it.

// Common numbering / labelling prefixes teachers paste in front of a question.
// Ordered so the most specific ("Question 1:") is tried before the generic ones.
const NUMBERING_PREFIXES = [
  /^question\s*\d+\s*[.):-]\s*/i, // "Question 1:", "Question 2)" , "Question 3 -"
  /^q\s*\d+\s*[.):-]\s*/i, //         "Q1.", "Q1)", "Q 2 :"
  /^\(?\d+\)\s*/, //                  "(1) ", "1) "
  /^\d+\s*[.):-]\s*/, //             "1.", "2 :", "3 -"
]

function stripNumberingPrefix(line) {
  let text = line
  for (const pattern of NUMBERING_PREFIXES) {
    const next = text.replace(pattern, '')
    if (next !== text) {
      // Only one prefix is stripped — a question body should keep its own content.
      return next.trim()
    }
  }
  return text.trim()
}

// Parse a block of pasted text into ordered { id, text } question objects.
// Returns [] for empty / non-string input so callers can safely fall back.
export function parseTeacherPastedQuestions(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return []
  }

  const questions = []
  const lines = text.split(/\r?\n/)

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      continue
    }
    const cleaned = stripNumberingPrefix(trimmed)
    if (!cleaned) {
      continue
    }
    questions.push({
      id: `teacher-material-${questions.length + 1}`,
      text: cleaned,
    })
  }

  return questions
}

// Convenience count used by the blueprint analysis so it can estimate how many
// slots teacher-provided questions can cover before placeholders are needed.
export function countTeacherPastedQuestions(text) {
  return parseTeacherPastedQuestions(text).length
}

// ---------------------------------------------------------------------------
// v2.93 — Material-to-draft question generator (pure, local, deterministic).
//
// Turns a teacher's pasted chapter notes / material into VARIED DRAFT practice
// questions for teacher review. It never claims final quality, never uses AI,
// and never reproduces book content — it only rearranges the teacher's own words
// into question-shaped prompts using simple rules. Same input -> same output.
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'is', 'are', 'to', 'and', 'or', 'in', 'on', 'for', 'with',
  'as', 'by', 'be', 'it', 'its', 'that', 'this', 'these', 'those', 'was', 'were',
  'at', 'from', 'into', 'than', 'then', 'we', 'you', 'they', 'he', 'she', 'their',
  'his', 'her', 'our', 'your', 'which', 'who', 'whom', 'what', 'when', 'where',
  'can', 'may', 'will', 'shall', 'such', 'also', 'not', 'but', 'if', 'so', 'each',
])

const STATEMENT_KEYWORDS = ['is', 'are', 'means', 'defined', 'collection', 'representation']

// Strip bullets / list markers a teacher may paste in front of a note line.
function stripBullet(line) {
  return line.replace(/^[\s]*[-*•▪◦·]+\s*/, '').trim()
}

function cleanToken(token) {
  return token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')
}

function wordCount(value) {
  return value.split(/\s+/).filter(Boolean).length
}

function titleTrim(value) {
  return value.replace(/\s+/g, ' ').replace(/[.;:]+$/, '').trim()
}

// A tiny rotating cursor so the same pool is reused in order without immediate
// repeats and without any randomness.
function makeCursor(items) {
  let index = 0
  return {
    size: items.length,
    next() {
      if (!items.length) {
        return null
      }
      const value = items[index % items.length]
      index += 1
      return value
    },
  }
}

// Break the pasted material into ordered, de-duplicated pools of terms,
// statements, proper names and years. All extraction is rule-based.
function extractMaterial(materialText) {
  const rawLines = String(materialText || '')
    .split(/\r?\n/)
    .map((line) => stripBullet(line))
    .filter(Boolean)

  const sentences = []
  rawLines.forEach((line) => {
    line
      .split(/(?<=[.;])\s+|[.;]/)
      .map((part) => titleTrim(part))
      .filter(Boolean)
      .forEach((part) => sentences.push(part))
  })

  const terms = []
  const seenTerms = new Set()
  rawLines.forEach((line) => {
    const term = titleTrim(line)
    const words = wordCount(term)
    if (words >= 1 && words <= 6 && term.length <= 60 && !/^\d[\d\s–-]*$/.test(term)) {
      const key = term.toLowerCase()
      if (!seenTerms.has(key)) {
        seenTerms.add(key)
        terms.push(term)
      }
    }
  })

  const statements = []
  const seenStatements = new Set()
  sentences.forEach((sentence) => {
    const words = wordCount(sentence)
    const lower = ` ${sentence.toLowerCase()} `
    const hasKeyword = STATEMENT_KEYWORDS.some((keyword) => lower.includes(` ${keyword} `) || sentence.toLowerCase().includes(keyword))
    if (words >= 4 && words <= 24 && hasKeyword) {
      const key = sentence.toLowerCase()
      if (!seenStatements.has(key)) {
        seenStatements.add(key)
        statements.push(sentence)
      }
    }
  })

  const names = []
  const seenNames = new Set()
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g
  rawLines.forEach((line) => {
    let match
    while ((match = namePattern.exec(line)) !== null) {
      const name = match[1].trim()
      const key = name.toLowerCase()
      if (!seenNames.has(key)) {
        seenNames.add(key)
        names.push(name)
      }
    }
  })

  const years = []
  const seenYears = new Set()
  const yearPattern = /\b\d{3,4}\s*[–-]\s*\d{3,4}\b|\b\d{3,4}\b/g
  rawLines.forEach((line) => {
    let match
    while ((match = yearPattern.exec(line)) !== null) {
      const year = match[0].replace(/\s*[–-]\s*/, '–')
      if (!seenYears.has(year)) {
        seenYears.add(year)
        years.push(year)
      }
    }
  })

  return { terms, statements, names, years, lineCount: rawLines.length }
}

const REVIEW_ANSWER = '[Teacher to add/verify answer]'

// Blank the last meaningful word out of a statement for a fill-in-the-blank
// draft. Returns null when no safe word is available.
function makeFillBlank(statement) {
  const tokens = statement.split(/\s+/)
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const word = cleanToken(tokens[i])
    if (word.length > 3 && !STOPWORDS.has(word.toLowerCase()) && /^[A-Za-z-]+$/.test(word)) {
      const blanked = tokens
        .map((token, index) => (index === i ? token.replace(word, '______') : token))
        .join(' ')
      return { text: `Fill in the blank: ${titleTrim(blanked)}.`, answer: word }
    }
  }
  return null
}

const SHORT_TEMPLATES = [
  (term) => `Define ${term}.`,
  (term) => `Write a short note on ${term}.`,
  (term) => `Explain the meaning of '${term}' with one example.`,
]

const LONG_TEMPLATES = [
  (term) => `Explain ${term} in detail with suitable examples.`,
  (term, topic) => `Discuss ${topic} with examples.`,
]

function fallbackScope(topic, chapter, referenceBook) {
  return titleTrim(topic) || titleTrim(chapter) || titleTrim(referenceBook) || 'this topic'
}

// Varied, honest fallback used when the material cannot supply a real draft.
function makeFallbackDraft(questionType, scope, fallbackIndex) {
  const variants = [
    `Draft practice question — based on ${scope}. Teacher review required.`,
    `Draft practice question for ${scope} — teacher review required.`,
    `Draft practice question on ${scope}. Original question for review.`,
  ]
  return {
    text: variants[fallbackIndex % variants.length],
    answer: REVIEW_ANSWER,
    questionType,
    isFallback: true,
  }
}

// Build ONE typed draft. Returns null when the pools cannot supply this type so
// the caller can fall back honestly.
function buildTypedDraft({ questionType, cursors, topicWord, shortIndex, longIndex }) {
  const type = String(questionType || 'Short answer')

  if (type === 'Fill in the blanks') {
    const statement = cursors.statements.next()
    const fill = statement ? makeFillBlank(statement) : null
    if (fill) {
      return { text: fill.text, answer: fill.answer, questionType: type, isFallback: false }
    }
    return null
  }

  if (type === 'True/False') {
    const statement = cursors.statements.next()
    if (statement) {
      return {
        text: `State whether the following statement is true or false: ${titleTrim(statement)}.`,
        answer: 'True',
        questionType: type,
        isFallback: false,
      }
    }
    return null
  }

  if (type === 'MCQ') {
    const term = cursors.terms.next() || topicWord
    if (term) {
      return {
        text: `Which of the following best describes ${term}? (Teacher to complete options.)`,
        answer: REVIEW_ANSWER,
        questionType: type,
        isFallback: false,
      }
    }
    return null
  }

  if (type === 'Long answer') {
    const term = cursors.terms.next()
    if (term) {
      const template = LONG_TEMPLATES[longIndex % LONG_TEMPLATES.length]
      return { text: template(term, topicWord), answer: REVIEW_ANSWER, questionType: type, isFallback: false }
    }
    return null
  }

  // Short answer (default). Offer a factual "Who introduced…" draft when a name
  // is available, otherwise rotate the term templates.
  if (shortIndex === 0 && cursors.names.size > 0) {
    const name = cursors.names.next()
    if (name) {
      return { text: `Who introduced the concept of ${topicWord}?`, answer: name, questionType: type, isFallback: false }
    }
  }
  const term = cursors.terms.next()
  if (term) {
    const template = SHORT_TEMPLATES[shortIndex % SHORT_TEMPLATES.length]
    return { text: template(term), answer: REVIEW_ANSWER, questionType: type, isFallback: false }
  }
  return null
}

// Public entry: produce one draft per blueprint target, in order.
export function createDraftQuestionsFromMaterial({
  materialText = '',
  topic = '',
  chapter = '',
  referenceBook = '',
  blueprintTargets = [],
} = {}) {
  const material = extractMaterial(materialText)
  const cursors = {
    terms: makeCursor(material.terms),
    statements: makeCursor(material.statements),
    names: makeCursor(material.names),
    years: makeCursor(material.years),
  }
  const topicWord = titleTrim(topic) || titleTrim(chapter) || titleTrim(referenceBook) || 'this topic'
  const scope = fallbackScope(topic, chapter, referenceBook)

  const perTypeIndex = {}
  let fallbackIndex = 0
  let previousText = ''
  const drafts = []

  blueprintTargets.forEach((target) => {
    const questionType = target?.questionType || 'Short answer'
    const typeKey = questionType
    perTypeIndex[typeKey] = perTypeIndex[typeKey] || 0
    const rotation = perTypeIndex[typeKey]

    let draft = buildTypedDraft({
      questionType,
      cursors,
      topicWord,
      shortIndex: rotation,
      longIndex: rotation,
    })

    // One retry to dodge an immediate duplicate before falling back.
    if (draft && draft.text === previousText) {
      const retry = buildTypedDraft({
        questionType,
        cursors,
        topicWord,
        shortIndex: rotation + 1,
        longIndex: rotation + 1,
      })
      if (retry && retry.text !== previousText) {
        draft = retry
      }
    }

    if (!draft || draft.text === previousText) {
      draft = makeFallbackDraft(questionType, scope, fallbackIndex)
      fallbackIndex += 1
    }

    perTypeIndex[typeKey] += 1
    previousText = draft.text
    drafts.push(draft)
  })

  return drafts
}

// Lightweight estimate for the blueprint analysis: roughly how many DRAFT
// questions the material can supply from real content (not fallback), capped at
// the requested total.
export function estimateDraftCoverage(materialText, totalQuestions) {
  const material = extractMaterial(materialText)
  const supply = material.terms.length + material.statements.length + material.names.length
  return Math.max(0, Math.min(Number(totalQuestions) || 0, supply))
}
