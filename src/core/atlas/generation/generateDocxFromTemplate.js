import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { generationError, generationWarning } from './generationMessages.js'

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function normalizeFileName(fileName) {
  const baseName = String(fileName || 'project-atlas-document')
    .replace(/\.[^/.]+$/, '')
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)

  return `${baseName || 'project-atlas-document'}.docx`
}

// docxtemplater resolves tags case-sensitively against the render data. The merge
// step keys `values` by field id (e.g. `studentname`), while templates use the
// advertised placeholder text (e.g. `{{StudentName}}`). Feed BOTH keyings so a
// template written with the documented {{ColumnName}} placeholders renders the
// mapped value instead of a blank/"undefined". `mergeResult.placeholders` is keyed
// by the full `{{...}}` string, so strip the braces to recover the tag name.
// AR-CERT-PRO (lowercase {{name}} placeholders) is unaffected — its tag name and
// field id already match.
function buildRenderData(mergeResult) {
  const renderData = { ...(mergeResult.values || {}) }

  for (const [placeholder, value] of Object.entries(mergeResult.placeholders || {})) {
    const tagName = String(placeholder).replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '')

    if (tagName && !(tagName in renderData)) {
      renderData[tagName] = value
    }
  }

  return renderData
}

function collectDocxErrors(error) {
  if (!error) {
    return [generationError('DOCX generation failed.')]
  }

  const nestedErrors = error.properties?.errors
  if (Array.isArray(nestedErrors) && nestedErrors.length > 0) {
    return nestedErrors.map((item) =>
      generationError(item.properties?.explanation || item.message || 'DOCX generation failed.', {
        id: item.properties?.id,
        context: item.properties?.context,
      }),
    )
  }

  return [
    generationError(error.properties?.explanation || error.message || 'DOCX generation failed.', {
      id: error.properties?.id,
      context: error.properties?.context,
    }),
  ]
}

export function generateDocxFromTemplate({ templateArrayBuffer, mergeResult, options = {} }) {
  const warnings = []

  if (!templateArrayBuffer) {
    return {
      valid: false,
      blob: null,
      fileName: normalizeFileName(options.fileName),
      mimeType: DOCX_MIME_TYPE,
      errors: [generationError('Template file data is missing.')],
      warnings,
    }
  }

  if (!mergeResult?.valid) {
    return {
      valid: false,
      blob: null,
      fileName: normalizeFileName(options.fileName),
      mimeType: DOCX_MIME_TYPE,
      errors: [generationError('Selected preview row is not valid for generation.')],
      warnings,
    }
  }

  if (!mergeResult.values || Object.keys(mergeResult.values).length === 0) {
    return {
      valid: false,
      blob: null,
      fileName: normalizeFileName(options.fileName),
      mimeType: DOCX_MIME_TYPE,
      errors: [generationError('No merge values are available for DOCX generation.')],
      warnings,
    }
  }

  if (mergeResult.warnings?.length) {
    warnings.push(...mergeResult.warnings.map((item) => generationWarning(item.message, item)))
  }

  try {
    const zip = new PizZip(templateArrayBuffer)
    const doc = new Docxtemplater(zip, {
      delimiters: {
        start: '{{',
        end: '}}',
      },
      paragraphLoop: true,
      linebreaks: true,
      // Never render the literal string "undefined" into a user document for a
      // tag we have no value for; a blank is the safe, expected result.
      nullGetter: () => '',
    })

    doc.render(buildRenderData(mergeResult))

    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: DOCX_MIME_TYPE,
    })

    return {
      valid: true,
      blob,
      fileName: normalizeFileName(options.fileName),
      mimeType: DOCX_MIME_TYPE,
      errors: [],
      warnings,
    }
  } catch (error) {
    return {
      valid: false,
      blob: null,
      fileName: normalizeFileName(options.fileName),
      mimeType: DOCX_MIME_TYPE,
      errors: collectDocxErrors(error),
      warnings,
    }
  }
}
