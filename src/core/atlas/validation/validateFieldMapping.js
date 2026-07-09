import { normalizeColumnName } from '../adapters/excelColumnsAdapter.js'
import { error, info, warning } from './validationMessages.js'
import { getUnusedColumns } from './validateColumns.js'

function normalizeFieldId(value) {
  return String(value || '').trim().toLowerCase()
}

export function validateFieldMapping({
  detectedPlaceholders = [],
  invalidPlaceholders = [],
  fieldDefinitions = [],
  detectedColumns = [],
  fieldMapping = {},
}) {
  const errors = []
  const warnings = []
  const infoMessages = []
  const fieldIds = new Set(fieldDefinitions.map((field) => field.id))
  const columnNames = new Set(detectedColumns.map(normalizeColumnName))
  const detectedPlaceholderKeys = new Set(detectedPlaceholders.map((placeholder) => placeholder.key))

  const missingMappings = fieldDefinitions
    .filter((field) => field.required && !fieldMapping[field.id])
    .map((field) => ({
      fieldId: field.id,
      label: field.label,
      placeholder: field.placeholder || `{{${field.id}}}`,
      severity: 'error',
    }))

  missingMappings.forEach((missing) => {
    errors.push(error(`${missing.label} is required but is not connected to an Excel column yet.`, missing))
  })

  Object.entries(fieldMapping)
    .filter(([, column]) => Boolean(column))
    .forEach(([fieldId, column]) => {
      if (!columnNames.has(normalizeColumnName(column))) {
        errors.push(error(`Mapped column "${column}" is not present in the Excel file.`, { fieldId, column }))
      }
    })

  const unknownPlaceholders = [...detectedPlaceholderKeys]
    .filter((key) => !fieldIds.has(normalizeFieldId(key)))
    .map((key) => {
      const placeholder = detectedPlaceholders.find((item) => item.key === key)
      return {
        key,
        raw: placeholder?.raw || `{{${key}}}`,
        severity: 'warning',
      }
    })

  // After v4.1, every valid detected placeholder becomes an effective field (known
  // or custom), so this branch no longer fires for valid custom placeholders like
  // {{place}}. Kept as a friendly fallback in case a placeholder has no field or
  // matching Excel column at all.
  unknownPlaceholders.forEach((placeholder) => {
    warnings.push(warning(`Placeholder ${placeholder.raw} is not connected to an Excel column yet.`, placeholder))
  })

  invalidPlaceholders.forEach((placeholder) => {
    warnings.push(warning(`Invalid placeholder ${placeholder.raw}. Placeholders must start with a letter and use only letters, numbers, and underscores.`, placeholder))
  })

  const unusedColumns = getUnusedColumns(detectedColumns, fieldMapping)
  if (unusedColumns.length > 0) {
    infoMessages.push(info(`${unusedColumns.length} Excel column(s) are not used by the current template.`, { columns: unusedColumns }))
  }

  fieldDefinitions
    .filter((field) => !field.required && detectedPlaceholderKeys.has(field.id) && !fieldMapping[field.id])
    .forEach((field) => {
      warnings.push(warning(`Placeholder ${field.placeholder || `{{${field.id}}}`} is not connected to an Excel column yet.`, { fieldId: field.id }))
    })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info: infoMessages,
    missingMappings,
    unknownPlaceholders,
    unusedColumns,
    invalidPlaceholders,
  }
}
