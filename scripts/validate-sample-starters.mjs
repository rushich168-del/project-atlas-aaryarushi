// Project Atlas v2.75 — End-to-End Workspace Regression Test (local, offline).
//
// Exercises the real generation chain for every active DOCX sample starter pack:
//   sample XLSX  -> parsed columns/rows
//   sample DOCX  -> detected {{ColumnName}} placeholders
//   mergeRow + generateDocxFromTemplate -> rendered DOCX with row values
//
// It imports only the pure engine + sample modules (no Supabase, no storage, no
// network, no delete logic), so it is safe to run anywhere. Reconstructs the field
// definitions the same way the shared workspace config does (field id = lowercased
// column, placeholder = {{Column}}), which matches both the shared products and
// AR-CERT-PRO's real field ids (name, course, date, certificate_id, trainer).
//
// Run: npm run validate:samples

import * as XLSX from 'xlsx'
import PizZip from 'pizzip'
import { sampleStarters, getSampleStarter } from '../src/features/document-workspace/sampleStarters.js'
import { buildSampleWorkbookBlob, buildSampleTemplateBlob } from '../src/features/document-workspace/sampleFileGenerators.js'
import { detectDocxPlaceholders } from '../src/core/atlas/placeholders/detectDocxPlaceholders.js'
import { mergeRow } from '../src/core/atlas/merge/mergeRow.js'
import { generateDocxFromTemplate } from '../src/core/atlas/generation/generateDocxFromTemplate.js'

let failures = 0
const results = []

function check(label, condition, detail = '') {
  if (!condition) {
    failures += 1
    results.push(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
  return condition
}

function docText(blobBufferText) {
  return blobBufferText.replace(/<[^>]+>/g, ' ')
}

function fieldDefsFor(starter) {
  return starter.columns.map((column, index) => ({
    id: column.toLowerCase(),
    label: column,
    placeholder: `{{${column}}}`,
    // Mark the final column optional to also exercise the optional/blank path.
    required: index < starter.columns.length - 1,
    type: 'text',
  }))
}

async function testProduct(slug) {
  const starter = getSampleStarter(slug)
  results.push(`\n[${slug}] ${starter.productName}`)

  // --- Sample XLSX ---
  const wbBlob = buildSampleWorkbookBlob(starter)
  const wb = XLSX.read(new Uint8Array(await wbBlob.arrayBuffer()), { type: 'array' })
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
  const headers = rows.length ? Object.keys(rows[0]) : []
  check('XLSX columns match placeholders', JSON.stringify(headers) === JSON.stringify(starter.columns), `${headers.join(',')} vs ${starter.columns.join(',')}`)
  check('XLSX row count matches', rows.length === starter.rows.length, `${rows.length} vs ${starter.rows.length}`)

  // --- Sample DOCX placeholders ---
  const tplBuf = await buildSampleTemplateBlob(starter).arrayBuffer()
  const detection = await detectDocxPlaceholders(tplBuf)
  const expectedKeys = starter.columns.map((c) => c.toLowerCase()).sort()
  check('DOCX has exactly the expected {{ColumnName}} placeholders', JSON.stringify([...detection.uniqueKeys].sort()) === JSON.stringify(expectedKeys), detection.uniqueKeys.join(','))
  check('DOCX has no invalid placeholder tokens', detection.invalidTokens.length === 0, JSON.stringify(detection.invalidTokens))

  // --- Render every row (mirrors single + batch per-row generation) ---
  const fieldDefinitions = fieldDefsFor(starter)
  const fieldMapping = Object.fromEntries(fieldDefinitions.map((f) => [f.id, f.label]))
  let allRowsOk = true
  for (const row of rows) {
    const mergeResult = mergeRow({ fieldDefinitions, fieldMapping, row, options: { locale: 'en-IN', emptyValue: '', trimText: true } })
    if (!mergeResult.valid) { allRowsOk = false; continue }
    const res = generateDocxFromTemplate({ templateArrayBuffer: tplBuf, mergeResult, options: { fileName: 'sample' } })
    if (!res.valid) { allRowsOk = false; continue }
    const text = docText(new PizZip(await res.blob.arrayBuffer()).file('word/document.xml').asText())
    const valuesPresent = starter.columns.every((c) => String(row[c]) === '' || text.includes(String(row[c])))
    const noUndefined = !text.includes('undefined')
    if (!valuesPresent || !noUndefined) allRowsOk = false
  }
  check('Every row renders its values with no literal "undefined"', allRowsOk)
}

async function testEdgeCases() {
  results.push('\n[edge-cases] unmapped / unknown / empty placeholders')
  const starter = getSampleStarter('ar-marksheet-pro')
  const tplBuf = await buildSampleTemplateBlob(starter).arrayBuffer()

  // Unknown tag: field that does not exist at all -> must be blank, never "undefined".
  const fieldDefinitions = [{ id: 'studentname', label: 'StudentName', placeholder: '{{StudentName}}', required: true, type: 'text' }]
  const mergeResult = mergeRow({ fieldDefinitions, fieldMapping: { studentname: 'StudentName' }, row: { StudentName: 'Solo Value' }, options: { emptyValue: '', trimText: true } })
  const res = generateDocxFromTemplate({ templateArrayBuffer: tplBuf, mergeResult, options: { fileName: 'x' } })
  const text = docText(new PizZip(await res.blob.arrayBuffer()).file('word/document.xml').asText())
  check('Mapped tag renders its value', text.includes('Solo Value'))
  check('Unmapped/unknown tags render blank, never "undefined"', !text.includes('undefined'), text.slice(0, 200))
}

async function main() {
  for (const slug of Object.keys(sampleStarters)) {
    await testProduct(slug)
  }
  await testEdgeCases()

  console.log(results.join('\n'))
  console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${Object.keys(sampleStarters).length} products, ${failures} failing checks`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('Regression script crashed:', error)
  process.exit(1)
})
