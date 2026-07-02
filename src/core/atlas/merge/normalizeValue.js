import { formatDate } from './dateFormatter.js'
import { mergeWarning } from './mergeMessages.js'

function isEmpty(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

export function normalizeValue(value, field, options = {}) {
  const warnings = []
  const emptyValue = options.emptyValue ?? ''

  if (isEmpty(value)) {
    return {
      value: field.defaultValue ?? emptyValue,
      rawValue: value ?? '',
      empty: true,
      warnings,
    }
  }

  if (field.type === 'date') {
    const formattedDate = formatDate(value, field.format, options.locale || 'en-IN')

    if (!formattedDate) {
      warnings.push(mergeWarning(`${field.label} has an invalid date value.`, { fieldId: field.id, rawValue: value }))
      return {
        value: String(value).trim(),
        rawValue: value,
        empty: false,
        warnings,
      }
    }

    return {
      value: formattedDate,
      rawValue: value,
      empty: false,
      warnings,
    }
  }

  if (field.type === 'number') {
    const normalized = String(value).trim()

    if (Number.isNaN(Number(normalized))) {
      warnings.push(mergeWarning(`${field.label} has a value that is not a valid number.`, { fieldId: field.id, rawValue: value }))
    }

    return {
      value: normalized,
      rawValue: value,
      empty: false,
      warnings,
    }
  }

  return {
    value: options.trimText === false ? String(value) : String(value).trim(),
    rawValue: value,
    empty: false,
    warnings,
  }
}
