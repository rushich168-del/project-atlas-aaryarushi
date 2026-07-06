// Project Atlas v2.83 — turn generated builder rows into a real .xlsx file.
//
// This is the safe bridge between Auto Builder Mode and the EXISTING engine: the
// generated { columns, rows } become a genuine OOXML spreadsheet (via the project's
// SheetJS dependency) that can be downloaded, or fed straight into the existing
// Excel upload/parse/generation path — no DOCX engine duplication, no faked files.

import * as XLSX from 'xlsx'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function buildWorkbookBlob(columns, rows) {
  const header = columns
  const body = rows.map((row) => header.map((column) => row[column] ?? ''))
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Generated')
  const array = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([array], { type: XLSX_MIME })
}

// Wrap the workbook as a File so it can be handed to the existing Excel upload
// handler exactly like a user-selected file.
export function buildWorkbookFile(columns, rows, fileName) {
  const blob = buildWorkbookBlob(columns, rows)
  const safeName = fileName && fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName || 'generated'}.xlsx`
  return new File([blob], safeName, { type: XLSX_MIME })
}

export function downloadWorkbook(columns, rows, fileName) {
  const blob = buildWorkbookBlob(columns, rows)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName && fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName || 'generated'}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
