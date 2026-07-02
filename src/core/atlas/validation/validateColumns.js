import { getColumnSet, normalizeColumnName } from '../adapters/excelColumnsAdapter.js'

export function getUnusedColumns(columns = [], fieldMapping = {}) {
  const usedColumns = getColumnSet(Object.values(fieldMapping).filter(Boolean))
  return columns.filter((column) => !usedColumns.has(normalizeColumnName(column)))
}
