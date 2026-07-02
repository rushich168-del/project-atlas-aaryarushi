import { getPlaceholderSuggestion, PLACEHOLDER_KEY_PATTERN } from './placeholderRules.js'

export function normalizePlaceholder(rawValue) {
  const original = String(rawValue || '')
  const key = original.trim().toLowerCase()
  const valid = PLACEHOLDER_KEY_PATTERN.test(key)

  return {
    key,
    valid,
    reason: valid ? '' : 'Use letters, numbers, and underscores only. The first character must be a letter.',
    suggestion: valid ? key : getPlaceholderSuggestion(original),
  }
}

export function normalizePlaceholderToken(rawToken) {
  const innerValue = String(rawToken || '').replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '')
  return normalizePlaceholder(innerValue)
}
