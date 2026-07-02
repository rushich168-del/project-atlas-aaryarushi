export function normalizeColumnName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function getColumnSet(columns = []) {
  return new Set(columns.map(normalizeColumnName))
}
