// Project Atlas v2.85 — shared document-composer primitives.
//
// Builds a real, minimal, valid .docx (Word Open XML) from scratch using the
// project's existing PizZip dependency — the SAME proven approach as
// sampleFileGenerators.js. This is isolated document-composition logic: it does
// NOT touch the certificate/docxtemplater engine, and produces a genuine
// downloadable Word file (not a faked binary, not a PDF).
//
// Formatting is done inline with run/paragraph properties (no styles.xml needed),
// so the package stays tiny and robust. Sizes are in half-points (w:sz), spacing
// in twentieths of a point (w:spacing), page size/margins in twips (A4).

import PizZip from 'pizzip'

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// One text run. `size` is in points here (converted to half-points internally).
export function run(text, { bold = false, italic = false, size } = {}) {
  const props = []
  if (bold) props.push('<w:b/>')
  if (italic) props.push('<w:i/>')
  if (size) props.push(`<w:sz w:val="${Math.round(size * 2)}"/>`)
  const rPr = props.length ? `<w:rPr>${props.join('')}</w:rPr>` : ''
  return `${'<w:r>'}${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`
}

// A paragraph from either a plain string or an array of run() strings.
export function paragraph(content, { align, spacingAfter = 60, bold = false, size, border = false } = {}) {
  const pPrParts = []
  if (align) pPrParts.push(`<w:jc w:val="${align}"/>`)
  if (border) pPrParts.push('<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="999999"/></w:pBdr>')
  pPrParts.push(`<w:spacing w:after="${spacingAfter}"/>`)
  const pPr = `<w:pPr>${pPrParts.join('')}</w:pPr>`
  const runs = Array.isArray(content) ? content.join('') : run(content, { bold, size })
  return `<w:p>${pPr}${runs}</w:p>`
}

// Empty spacer paragraph.
export function blank(spacingAfter = 60) {
  return `<w:p><w:pPr><w:spacing w:after="${spacingAfter}"/></w:pPr></w:p>`
}

// A label/value line, e.g. "Class: 5" with the label bold. Value may be blank
// (renders an underline space) so printed sheets have a line to fill in.
export function labelValue(label, value, { spacingAfter = 40 } = {}) {
  const shown = String(value ?? '').trim()
  return paragraph(
    [run(`${label}: `, { bold: true }), run(shown || '__________________')],
    { spacingAfter },
  )
}

// --- v2.86 header-parity helpers: make the DOCX header read like the preview ---

export const FILL_LINE = '____________'

// Centered bold title (school name / document title).
export function centeredTitle(text, { size = 14, spacingAfter = 60 } = {}) {
  return paragraph(text, { align: 'center', bold: true, size, spacingAfter })
}

// A horizontal rule = empty paragraph with a bottom border.
export function rule({ spacingAfter = 100 } = {}) {
  return paragraph('', { spacingAfter, border: true })
}

// Centered, bold, ruled section heading (e.g. "Section A").
export function sectionHeading(text, { size = 13, spacingAfter = 60 } = {}) {
  return paragraph(text, { align: 'center', bold: true, size, border: true, spacingAfter })
}

// Compact key/value row: several "Label: value" cells on ONE line, aligned with
// left tab stops (no tables — safe OOXML). Empty values render a fill-in line.
// `pairs` = [{ label, value }]. Mirrors the preview's Class | Section | Name rows.
export function keyValueRow(pairs, { spacingAfter = 60, usableWidth = 9600 } = {}) {
  const count = pairs.length
  const stops = []
  for (let i = 1; i < count; i += 1) {
    stops.push(Math.round((usableWidth / count) * i))
  }
  const tabsXml = stops.length
    ? `<w:tabs>${stops.map((pos) => `<w:tab w:val="left" w:pos="${pos}"/>`).join('')}</w:tabs>`
    : ''

  const runs = []
  pairs.forEach((pair, index) => {
    if (index > 0) {
      runs.push('<w:r><w:tab/></w:r>')
    }
    const value = String(pair.value ?? '').trim()
    runs.push(run(`${pair.label}: `, { bold: true }))
    runs.push(run(value || FILL_LINE))
  })

  return `<w:p><w:pPr>${tabsXml}<w:spacing w:after="${spacingAfter}"/></w:pPr>${runs.join('')}</w:p>`
}

// Assemble the full package around a body of paragraph XML. A4 page + 2cm margins.
// --- v2.86 patch 2: two-column tables + pagination helpers ---

// Hard page break (its own paragraph). Foundation for "answer key on a new page"
// and future per-section page breaks. Word still paginates long content naturally.
export function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
}

// A borderless 2-column table laid out COLUMN-MAJOR: the first half of the cells
// fill the left column top-to-bottom, the rest fill the right column (so 1–5 land
// left and 6–10 land right for a 10-item list). Each `cell` is paragraph XML (one
// or more <w:p>). No visible borders; light cell padding. Safe OOXML — always
// follow the returned table with a paragraph (composers add a trailing blank()).
export function twoColumnTable(cells, { totalWidth = 9600 } = {}) {
  const colWidth = Math.floor(totalWidth / 2)
  const emptyCell = '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>'

  const tc = (content) => `<w:tc><w:tcPr><w:tcW w:w="${colWidth}" w:type="dxa"/></w:tcPr>${content || emptyCell}</w:tc>`

  const n = cells.length
  const leftCount = Math.ceil(n / 2)
  const rows = []
  for (let r = 0; r < leftCount; r += 1) {
    const left = cells[r]
    const rightIdx = leftCount + r
    const right = rightIdx < n ? cells[rightIdx] : ''
    rows.push(`<w:tr>${tc(left)}${tc(right)}</w:tr>`)
  }

  return '<w:tbl>'
    + '<w:tblPr>'
    + `<w:tblW w:w="${totalWidth}" w:type="dxa"/>`
    + '<w:tblLayout w:type="fixed"/>'
    + '<w:tblCellMar>'
    + '<w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/>'
    + '<w:bottom w:w="40" w:type="dxa"/><w:right w:w="120" w:type="dxa"/>'
    + '</w:tblCellMar>'
    + '</w:tblPr>'
    + `<w:tblGrid><w:gridCol w:w="${colWidth}"/><w:gridCol w:w="${colWidth}"/></w:tblGrid>`
    + rows.join('')
    + '</w:tbl>'
}

export function buildDocxBlob(bodyXml) {
  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '</Types>'

  const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '</Relationships>'

  const sectPr = '<w:sectPr>'
    + '<w:pgSz w:w="11906" w:h="16838"/>'
    + '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720" w:gutter="0"/>'
    + '</w:sectPr>'

  // Word requires a paragraph between a table and the section properties. If the
  // body happens to end with a table, add a minimal trailing paragraph.
  const safeBody = bodyXml.trimEnd().endsWith('</w:tbl>') ? `${bodyXml}<w:p/>` : bodyXml

  const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + `<w:body>${safeBody}${sectPr}</w:body>`
    + '</w:document>'

  const zip = new PizZip()
  zip.file('[Content_Types].xml', contentTypes)
  zip.folder('_rels').file('.rels', rootRels)
  zip.folder('word').file('document.xml', documentXml)

  return zip.generate({ type: 'blob', mimeType: DOCX_MIME })
}

// Local-only download of a Blob (mirrors sampleFileGenerators.downloadBlob).
export function downloadDocxBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName && fileName.toLowerCase().endsWith('.docx') ? fileName : `${fileName || 'document'}.docx`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
