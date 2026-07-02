export const PLACEHOLDER_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g
export const PLACEHOLDER_KEY_PATTERN = /^[a-z][a-z0-9_]*$/

export function getPlaceholderSuggestion(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[0-9]+/, '')
}
