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
    errors.push(error(`${missing.label} is required but not mapped.`, missing))
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

  unknownPlaceholders.forEach((placeholder) => {
    warnings.push(warning(`Unknown placeholder ${placeholder.raw} was found in the template.`, placeholder))
  })

  invalidPlaceholders.forEach((placeholder) => {
    warnings.push(warning(`Invalid placeholder ${placeholder.raw} was found.`, placeholder))
  })

  const unusedColumns = getUnusedColumns(detectedColumns, fieldMapping)
  if (unusedColumns.length > 0) {
    infoMessages.push(info(`${unusedColumns.length} Excel columns are not used in this mapping.`, { columns: unusedColumns }))
  }

  fieldDefinitions
    .filter((field) => !field.required && detectedPlaceholderKeys.has(field.id) && !fieldMapping[field.id])
    .forEach((field) => {
      warnings.push(warning(`Optional placeholder ${field.placeholder || `{{${field.id}}}`} is present but not mapped.`, { fieldId: field.id }))
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
