import katex from 'katex'

const COMMAND_PATTERN = /\\(frac|sqrt|in|notin|cup|cap|le|ge|ne|neq|theta|pi|subset)/
const MATH_PATTERN = /\\(frac|sqrt|in|notin|cup|cap|le|ge|ne|neq|theta|pi|subset)|[\u2260\u2264\u2265\u2208\u2209\u222a\u2229\u221a\u00b2\u00b3]|\^\{[^}]+\}|_\{[^}]+\}|\^[A-Za-z0-9]/

function hasMath(text) {
  return MATH_PATTERN.test(String(text || ''))
}

function normalizeForKatex(value) {
  return String(value || '')
    .replace(/\u2260/g, '\\ne ')
    .replace(/\u2264/g, '\\le ')
    .replace(/\u2265/g, '\\ge ')
    .replace(/\u2208/g, '\\in ')
    .replace(/\u2209/g, '\\notin ')
    .replace(/\u222a/g, '\\cup ')
    .replace(/\u2229/g, '\\cap ')
    .replace(/\u00b2/g, '^2')
    .replace(/\u00b3/g, '^3')
    .replace(/\u221a\s*\{([^}]+)\}/g, '\\sqrt{$1}')
    .replace(/\u221a\s*([A-Za-z0-9]+(?:\^(?:\{[^}]*\}|[A-Za-z0-9]+))?)/g, '\\sqrt{$1}')
    .trim()
}

function renderKatex(expression) {
  const normalized = normalizeForKatex(expression)
  if (!normalized) {
    return null
  }
  try {
    return katex.renderToString(normalized, {
      displayMode: false,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
    })
  } catch {
    return null
  }
}

function findClose(text, openIndex, openChar, closeChar) {
  let depth = 0
  for (let index = openIndex; index < text.length; index += 1) {
    if (text[index] === openChar) {
      depth += 1
    } else if (text[index] === closeChar) {
      depth -= 1
      if (depth === 0) {
        const inside = text.slice(openIndex + 1, index)
        return hasMath(inside) ? index : -1
      }
    }
  }
  return -1
}

function pushText(tokens, text) {
  if (text) {
    tokens.push({ type: 'text', value: text })
  }
}

function tokenizeExplicit(text) {
  const tokens = []
  let index = 0

  while (index < text.length) {
    const inlineIndex = text.indexOf('\\(', index)
    const displayIndex = text.indexOf('\\[', index)
    const dollarIndex = text.indexOf('$', index)
    const parenIndex = text.indexOf('(', index)
    const bracketIndex = text.indexOf('[', index)
    const candidates = [inlineIndex, displayIndex, dollarIndex, parenIndex, bracketIndex].filter((item) => item >= 0)

    if (!candidates.length) {
      pushText(tokens, text.slice(index))
      break
    }

    const next = Math.min(...candidates)
    pushText(tokens, text.slice(index, next))

    if (next === inlineIndex) {
      const end = text.indexOf('\\)', next + 2)
      if (end > next) {
        tokens.push({ type: 'math', value: text.slice(next + 2, end) })
        index = end + 2
        continue
      }
    }

    if (next === displayIndex) {
      const end = text.indexOf('\\]', next + 2)
      if (end > next) {
        tokens.push({ type: 'math', value: text.slice(next + 2, end) })
        index = end + 2
        continue
      }
    }

    if (next === dollarIndex && !/\d/.test(text[next + 1] || '')) {
      const end = text.indexOf('$', next + 1)
      if (end > next + 1 && !/\d/.test(text[end - 1] || '')) {
        tokens.push({ type: 'math', value: text.slice(next + 1, end) })
        index = end + 1
        continue
      }
    }

    if (next === parenIndex) {
      const end = findClose(text, next, '(', ')')
      if (end > next) {
        tokens.push({ type: 'math', value: text.slice(next + 1, end) })
        index = end + 1
        continue
      }
    }

    if (next === bracketIndex) {
      const end = findClose(text, next, '[', ']')
      if (end > next) {
        tokens.push({ type: 'math', value: text.slice(next + 1, end) })
        index = end + 1
        continue
      }
    }

    pushText(tokens, text[next])
    index = next + 1
  }

  return tokens
}

function tokenizeAuto(text) {
  if (!hasMath(text)) {
    return [{ type: 'text', value: text }]
  }

  const commandMatch = text.match(COMMAND_PATTERN)
  const mathMatch = text.match(MATH_PATTERN)
  const firstIndex = Math.min(
    commandMatch?.index ?? Number.POSITIVE_INFINITY,
    mathMatch?.index ?? Number.POSITIVE_INFINITY,
  )

  if (!Number.isFinite(firstIndex)) {
    return [{ type: 'text', value: text }]
  }

  const prefix = text.slice(0, firstIndex)
  const start = prefix.trim().length <= 3 ? 0 : firstIndex
  return [
    { type: 'text', value: text.slice(0, start) },
    { type: 'math', value: text.slice(start) },
  ].filter((token) => token.value)
}

function tokenizeMathText(text) {
  const explicit = tokenizeExplicit(text)
  return explicit.some((token) => token.type === 'math') ? explicit : tokenizeAuto(text)
}

export default function MathText({ text, className = '' }) {
  const value = String(text || '')
  if (!value) {
    return null
  }

  return (
    <span className={className}>
      {tokenizeMathText(value).map((token, index) => {
        if (token.type !== 'math') {
          return <span key={index}>{token.value}</span>
        }
        const html = renderKatex(token.value)
        if (!html) {
          return <span key={index}>{token.value}</span>
        }
        return <span key={index} className="inline-block align-baseline" dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </span>
  )
}
