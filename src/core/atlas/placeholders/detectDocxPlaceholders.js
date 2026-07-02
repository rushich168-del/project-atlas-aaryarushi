import { extractDocxTextParts } from '../adapters/docxTextExtractor.js'
import { normalizePlaceholder } from './normalizePlaceholder.js'
import { PLACEHOLDER_PATTERN } from './placeholderRules.js'

function detectPlaceholdersInText(text, source) {
  const placeholders = []
  const invalidTokens = []

  for (const match of String(text || '').matchAll(PLACEHOLDER_PATTERN)) {
    const raw = match[0]
    const normalized = normalizePlaceholder(match[1])
    const item = {
      raw,
      key: normalized.key,
      source,
    }

    if (normalized.valid) {
      placeholders.push(item)
    } else {
      invalidTokens.push({
        ...item,
        reason: normalized.reason,
        suggestion: normalized.suggestion,
      })
    }
  }

  return { placeholders, invalidTokens }
}

export async function detectDocxPlaceholders(file) {
  const parts = await extractDocxTextParts(file)
  const detected = parts.reduce(
    (result, part) => {
      const partResult = detectPlaceholdersInText(part.text, part.source)
      result.placeholders.push(...partResult.placeholders)
      result.invalidTokens.push(...partResult.invalidTokens)
      return result
    },
    { placeholders: [], invalidTokens: [] },
  )

  const duplicateCounts = detected.placeholders.reduce((counts, placeholder) => {
    counts[placeholder.key] = (counts[placeholder.key] || 0) + 1
    return counts
  }, {})

  return {
    placeholders: detected.placeholders,
    invalidTokens: detected.invalidTokens,
    uniqueKeys: Object.keys(duplicateCounts),
    duplicateCounts,
    sources: parts.map((part) => part.source),
  }
}
