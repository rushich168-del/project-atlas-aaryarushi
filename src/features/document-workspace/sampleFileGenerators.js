import * as XLSX from 'xlsx'
import PizZip from 'pizzip'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Build a real .xlsx workbook from the sample columns + rows using the project's
// existing SheetJS dependency. SheetJS writes valid OOXML spreadsheets, so this is
// a genuine downloadable file, not a faked binary.
export function buildSampleWorkbookBlob(starter) {
  const header = starter.columns
  const body = starter.rows.map((row) => header.map((column) => row[column] ?? ''))
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample')
  const array = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

  return new Blob([array], { type: XLSX_MIME })
}

// Assemble a minimal, valid .docx (Word Open XML) from the sample placeholders
// using the project's existing PizZip dependency. Each placeholder sits in its own
// text run so the workspace placeholder detector and docxtemplater read it cleanly.
// Placeholders stay in {{ColumnName}} format; no images or photo areas are added.
export function buildSampleTemplateBlob(starter) {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
    + `<Default Extension="xml" ContentType="application/xml"/>`
    + `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>`
    + `</Types>`

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>`
    + `</Relationships>`

  function paragraph(text, { bold = false } = {}) {
    const runProps = bold ? '<w:rPr><w:b/></w:rPr>' : ''
    return `<w:p><w:r>${runProps}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  }

  const bodyParagraphs = [
    paragraph(`${starter.productName} sample template`, { bold: true }),
    paragraph('Replace this layout with your own design. Keep the placeholder tags below (each shown in double curly braces); each one is filled from the matching Excel column.'),
    ...starter.placeholders.map((placeholder) => {
      const column = placeholder.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '')
      return paragraph(`${column}: ${placeholder}`)
    }),
  ].join('')

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">`
    + `<w:body>${bodyParagraphs}<w:sectPr/></w:body>`
    + `</w:document>`

  const zip = new PizZip()
  zip.file('[Content_Types].xml', contentTypes)
  zip.folder('_rels').file('.rels', rootRels)
  zip.folder('word').file('document.xml', documentXml)

  return zip.generate({ type: 'blob', mimeType: DOCX_MIME })
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Revoke on the next tick so the download has a chance to start.
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
