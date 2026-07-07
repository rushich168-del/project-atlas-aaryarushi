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
