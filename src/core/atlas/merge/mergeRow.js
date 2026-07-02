import { mergeError, mergeWarning } from './mergeMessages.js'
import { normalizeValue } from './normalizeValue.js'

function hasColumn(row, column) {
  return Object.prototype.hasOwnProperty.call(row || {}, column)
}

export function mergeRow({ fieldDefinitions = [], fieldMapping = {}, row = {}, options = {} }) {
  const values = {}
  const placeholders = {}
  const rawValues = {}
  const errors = []
  const warnings = []
  const missingValues = []
  const missingColumns = []

  fieldDefinitions.forEach((field) => {
    const column = fieldMapping[field.id]
    const placeholder = field.placeholder || `{{${field.id}}}`

    if (!column) {
      const fallbackValue = field.defaultValue ?? options.emptyValue ?? ''
      values[field.id] = fallbackValue
      placeholders[placeholder] = fallbackValue
      rawValues[field.id] = ''

      if (field.required) {
        missingColumns.push({ fieldId: field.id, label: field.label, column: '', placeholder })
        errors.push(mergeError(`${field.label} is required but has no mapped column.`, { fieldId: field.id }))
      }

      return
    }

    if (!hasColumn(row, column)) {
      const fallbackValue = field.defaultValue ?? options.emptyValue ?? ''
      values[field.id] = fallbackValue
      placeholders[placeholder] = fallbackValue
      rawValues[field.id] = ''

      const missingColumn = { fieldId: field.id, label: field.label, column, placeholder }
      missingColumns.push(missingColumn)

      if (field.required) {
        errors.push(mergeError(`${field.label} is mapped to missing column "${column}".`, missingColumn))
      } else {
        warnings.push(mergeWarning(`${field.label} is mapped to missing optional column "${column}".`, missingColumn))
      }

      return
    }

    const normalized = normalizeValue(row[column], field, options)
    values[field.id] = normalized.value
    placeholders[placeholder] = normalized.value
    rawValues[field.id] = normalized.rawValue
    warnings.push(...normalized.warnings)

    if (normalized.empty && field.required) {
      const missingValue = { fieldId: field.id, label: field.label, column, placeholder }
      missingValues.push(missingValue)
      errors.push(mergeError(`${field.label} is required but empty.`, missingValue))
    }
  })

  return {
    valid: errors.length === 0,
    values,
    placeholders,
    rawValues,
    errors,
    warnings,
    missingValues,
    missingColumns,
  }
}
