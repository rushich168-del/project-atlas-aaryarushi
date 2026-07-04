import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabaseClient.js'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const TEMPLATE_BUCKET = 'certificate-templates'
const INPUT_BUCKET = 'certificate-inputs'

function getExtension(fileName) {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? `.${parts.pop()}` : ''
}

function formatBytes(bytes) {
  if (!bytes) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function safeFileName(fileName) {
  const extension = getExtension(fileName)
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${baseName || 'file'}${extension}`
}

function ensureBaseUploadContext({ organizationId, productId, file, userId }) {
  if (!organizationId) {
    throw new Error('No organization is selected.')
  }

  if (!productId) {
    throw new Error('No product is selected.')
  }

  if (!userId) {
    throw new Error('No authenticated user is available.')
  }

  if (!file) {
    throw new Error('Choose a file first.')
  }
}

function validateSize(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum size is 10 MB.')
  }
}

export function validateTemplateFile(file) {
  if (!file) {
    throw new Error('Choose a DOCX template file.')
  }

  validateSize(file)

  if (getExtension(file.name) !== '.docx') {
    throw new Error('Certificate template must be a .docx file.')
  }

  return true
}

export function validateExcelFile(file) {
  if (!file) {
    throw new Error('Choose an Excel file.')
  }

  validateSize(file)

  const extension = getExtension(file.name)
  if (!['.xlsx', '.xls'].includes(extension)) {
    throw new Error('Participant data must be an .xlsx or .xls file.')
  }

  return true
}

function dedupeHeaders(headers) {
  const seen = new Map()

  return headers.map((header) => {
    const count = seen.get(header) || 0
    seen.set(header, count + 1)
    return count === 0 ? header : `${header} ${count + 1}`
  })
}

function rowHasValue(row) {
  return row.some((cell) => String(cell ?? '').trim().length > 0)
}

function normalizeCellValue(value) {
  if (value instanceof Date) {
    return value.toLocaleDateString()
  }

  return String(value ?? '').trim()
}

export async function parseExcelColumns(file) {
  validateExcelFile(file)

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) {
    throw new Error('No worksheet found in the Excel file.')
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    header: 1,
    blankrows: false,
    defval: '',
    raw: false,
  })

  const headerRowIndex = rows.findIndex(rowHasValue)

  if (headerRowIndex === -1) {
    throw new Error('No header row found in the Excel file.')
  }

  const rawHeaders = rows[headerRowIndex].map((cell) => String(cell ?? '').trim())
  const headerEntries = rawHeaders
    .map((header, index) => ({ header, index }))
    .filter((entry) => Boolean(entry.header))
  const headers = headerEntries.map((entry) => entry.header)

  if (headers.length === 0) {
    throw new Error('No usable columns found in the Excel file.')
  }

  const dedupedHeaders = dedupeHeaders(headers)
  const dataRows = rows
    .slice(headerRowIndex + 1)
    .filter(rowHasValue)
  const excelRows = dataRows.map((row) =>
    headerEntries.reduce((previewRow, entry, entryIndex) => {
      previewRow[dedupedHeaders[entryIndex]] = normalizeCellValue(row[entry.index])
      return previewRow
    }, {}),
  )

  if (import.meta.env.DEV) {
    console.debug('[Project Atlas] parsed Excel data', {
      sheetName: firstSheetName,
      detectedColumns: dedupedHeaders,
      firstParsedRowKeys: Object.keys(excelRows[0] || {}),
      firstParsedRowEmail: excelRows[0]?.Email || excelRows[0]?.email || '',
    })
  }

  return {
    detectedColumns: dedupedHeaders,
    rowCount: dataRows.length,
    previewRows: excelRows.slice(0, 10),
    excelRows,
  }
}

export async function uploadCertificateTemplate({ organizationId, productId, file, userId }) {
  ensureBaseUploadContext({ organizationId, productId, file, userId })
  validateTemplateFile(file)

  const templateId = crypto.randomUUID()
  const fileName = safeFileName(file.name)
  const storagePath = `${organizationId}/ar-cert-pro/templates/${templateId}/${fileName}`

  const { error: storageError } = await supabase.storage
    .from(TEMPLATE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: false,
    })

  if (storageError) {
    throw storageError
  }

  const { data, error } = await supabase
    .from('templates')
    .insert({
      id: templateId,
      organization_id: organizationId,
      product_id: productId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      file_name: file.name,
      file_type: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      file_size: file.size,
      storage_bucket: TEMPLATE_BUCKET,
      storage_path: storagePath,
      version: 1,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return {
    ...data,
    displaySize: formatBytes(file.size),
  }
}

export async function uploadCertificateInput({ organizationId, productId, file, detectedColumns, rowCount, userId }) {
  ensureBaseUploadContext({ organizationId, productId, file, userId })
  validateExcelFile(file)

  const uploadId = crypto.randomUUID()
  const fileName = safeFileName(file.name)
  const storagePath = `${organizationId}/ar-cert-pro/inputs/${uploadId}/${fileName}`

  const { error: storageError } = await supabase.storage
    .from(INPUT_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: false,
    })

  if (storageError) {
    throw storageError
  }

  const { data, error } = await supabase
    .from('uploads')
    .insert({
      id: uploadId,
      organization_id: organizationId,
      product_id: productId,
      file_name: file.name,
      file_type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      file_size: file.size,
      storage_bucket: INPUT_BUCKET,
      storage_path: storagePath,
      status: 'parsed',
      detected_columns: detectedColumns,
      row_count: rowCount,
      uploaded_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return {
    ...data,
    displaySize: formatBytes(file.size),
  }
}
