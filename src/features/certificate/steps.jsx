import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, FileText, Loader2, ListChecks, Wand2 } from 'lucide-react'
import { detectDocxPlaceholders } from '../../core/atlas/index.js'
import {
  parseExcelColumns,
  uploadCertificateInput,
  uploadCertificateTemplate,
  validateExcelFile,
  validateTemplateFile,
} from './services/certificateFilesService.js'
import { getUploadError } from '../../utils/errorMessages.js'
import { BATCH_ROW_LIMIT } from './services/certificateBatchService.js'
import { navigateTo } from '../../utils/routes.js'

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function UploadMessage({ error }) {
  if (!error) {
    return null
  }

  const message = typeof error === 'string' ? error : error.message
  const technicalDetail = typeof error === 'string' ? '' : error.technicalDetail

  return (
    <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-700">
      <div className="flex gap-3">
        <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {technicalDetail ? <p className="mt-2 pl-7 text-xs font-medium text-red-600">Detail: {technicalDetail}</p> : null}
    </div>
  )
}

function SelectedFileCard({ title, record, file }) {
  if (!record && !file) {
    return null
  }

  return (
    <div className="mt-5 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
      <CheckCircle2 size={18} className="text-emerald-600" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-emerald-800">{record?.file_name || file?.name}</p>
        <p className="text-xs font-medium text-emerald-700">{title} stored in Supabase</p>
      </div>
    </div>
  )
}

function FileUploadControl({ title, description, acceptLabel, accept, loading, selectedFile, record, error, onFile }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <label className="focus-ring mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
        {loading ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : null}
        {loading ? 'Uploading' : 'Choose file'}
        <input
          type="file"
          accept={accept}
          disabled={loading}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              onFile(file)
            }
            event.target.value = ''
          }}
          className="sr-only"
        />
      </label>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{acceptLabel}</p>
      <UploadMessage error={error} />
      <SelectedFileCard title={title} record={record} file={selectedFile} />
    </div>
  )
}

export function TemplateStep({ state, actions, workspace }) {
  async function handleTemplateFile(file) {
    actions.updateState({ uploadingTemplate: true, templateUploadError: '' })

    try {
      validateTemplateFile(file)
      const templateRecord = await uploadCertificateTemplate({
        organizationId: workspace.organization?.id,
        productId: workspace.product?.organizationId ? workspace.product.id : null,
        file,
        userId: workspace.user?.id,
      })
      const detection = await detectDocxPlaceholders(file)

      actions.updateState({
        templateFile: { name: file.name, size: templateRecord.displaySize },
        templateRecord,
        detectedPlaceholders: detection.placeholders,
        invalidPlaceholders: detection.invalidTokens,
        placeholderKeys: detection.uniqueKeys,
        placeholderDuplicateCounts: detection.duplicateCounts,
        placeholderDetectionError: '',
        draftRecord: null,
        draftDirty: true,
        generationComplete: false,
        generatedDocx: null,
        generatedDocumentRecord: null,
        generationError: '',
        outputError: '',
        persistingOutput: false,
        batchValidation: null,
        batchJob: null,
        batchOutputs: [],
        batchError: '',
        batchComplete: false,
        uploadingTemplate: false,
      })
    } catch (error) {
      const uploadError = getUploadError(error, 'template')
      actions.updateState({ uploadingTemplate: false, templateUploadError: uploadError, placeholderDetectionError: uploadError.message })
    }
  }

  return (
    <FileUploadControl
      title="Template selection"
      description="Upload the DOCX certificate template to the private certificate-templates bucket."
      acceptLabel=".docx only, max 10 MB"
      accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      loading={state.uploadingTemplate}
      selectedFile={state.templateFile}
      record={state.templateRecord}
      error={state.templateUploadError}
      onFile={handleTemplateFile}
    />
  )
}

export function ExcelStep({ state, actions, workspace }) {
  async function handleExcelFile(file) {
    actions.updateState({ uploadingExcel: true, excelUploadError: '' })

    try {
      validateExcelFile(file)
      const { detectedColumns, rowCount, previewRows, excelRows } = await parseExcelColumns(file)
      const uploadRecord = await uploadCertificateInput({
        organizationId: workspace.organization?.id,
        productId: workspace.product?.organizationId ? workspace.product.id : null,
        file,
        detectedColumns,
        rowCount,
        userId: workspace.user?.id,
      })

      actions.updateState({
        excelFile: { name: file.name, size: uploadRecord.displaySize },
        uploadRecord,
        detectedColumns,
        previewRows,
        excelRows,
        previewRowIndex: 0,
        rowCount,
        fieldMapping: {
          name: '',
          course: '',
          date: '',
          certificate_id: '',
          trainer: '',
        },
        draftRecord: null,
        draftDirty: true,
        generationComplete: false,
        generatedDocx: null,
        generatedDocumentRecord: null,
        generationError: '',
        outputError: '',
        persistingOutput: false,
        batchValidation: null,
        batchJob: null,
        batchOutputs: [],
        batchError: '',
        batchComplete: false,
        uploadingExcel: false,
      })
    } catch (error) {
      actions.updateState({ uploadingExcel: false, excelUploadError: getUploadError(error, 'excel') })
    }
  }

  return (
    <div className="grid gap-5">
      <FileUploadControl
        title="Excel selection"
        description="Upload the participant spreadsheet to the private certificate-inputs bucket. Headers are detected in the browser."
        acceptLabel=".xlsx or .xls, max 10 MB"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        loading={state.uploadingExcel}
        selectedFile={state.excelFile}
        record={state.uploadRecord}
        error={state.excelUploadError}
        onFile={handleExcelFile}
      />

      {state.detectedColumns.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-primary">Detected columns</h4>
          <p className="mt-1 text-sm text-slate-500">{state.rowCount} non-empty data rows detected.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {state.detectedColumns.map((column) => (
              <span key={column} className="rounded-md border border-slate-200 bg-lightBg px-3 py-2 text-sm font-semibold text-slate-600">
                {column}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function MappingStep({ state, actions, config }) {
  function handleAutoMap() {
    const normalizedColumns = state.detectedColumns.map((column) => ({
      column,
      normalized: normalizeName(column),
    }))
    const nextMapping = { ...state.fieldMapping }

    config.templateFields.forEach((field) => {
      const candidates = [field.id, field.label, field.placeholder]
      const match = normalizedColumns.find(({ normalized }) =>
        candidates.some((candidate) => normalized === normalizeName(candidate)),
      )

      if (match) {
        nextMapping[field.id] = match.column
      }
    })

    actions.updateState({
      fieldMapping: nextMapping,
      draftDirty: true,
      generationComplete: false,
      generatedDocx: null,
      generatedDocumentRecord: null,
      generationError: '',
      outputError: '',
      persistingOutput: false,
    })
  }

  const validation = config.getValidationResult(state)
  const missingRequiredFields = validation.missingMappings

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-primary">Field mapping</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Map template placeholders to detected Excel columns.</p>
        </div>
        <button
          type="button"
          onClick={handleAutoMap}
          disabled={state.detectedColumns.length === 0}
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Auto-map
        </button>
      </div>
      {state.detectedColumns.length === 0 && (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium leading-6 text-amber-800">
          Upload an Excel file first so columns can be detected.
        </div>
      )}
      {missingRequiredFields.length > 0 && state.detectedColumns.length > 0 && (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium leading-6 text-amber-800">
          Missing required mappings: {missingRequiredFields.map((field) => field.label).join(', ')}
        </div>
      )}
      {state.draftError && (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-700">
          {state.draftError}
        </div>
      )}
      {state.draftSavedAt && !state.draftDirty && (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium leading-6 text-emerald-700">
          Workspace saved at {new Date(state.draftSavedAt).toLocaleTimeString()}.
        </div>
      )}
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-lightBg p-4">
          <h4 className="text-sm font-semibold text-primary">Detected placeholders</h4>
          {state.placeholderKeys.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No valid DOCX placeholders detected yet.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {state.placeholderKeys.map((key) => (
                <span key={key} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                  {`{{${key}}}`} {state.placeholderDuplicateCounts[key] > 1 ? `x${state.placeholderDuplicateCounts[key]}` : ''}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-md border border-slate-200 bg-lightBg p-4">
          <h4 className="text-sm font-semibold text-primary">Validation</h4>
          <div className="mt-3 grid gap-2 text-sm">
            {validation.errors.map((item) => (
              <p key={item.message} className="font-medium text-red-700">{item.message}</p>
            ))}
            {validation.warnings.map((item) => (
              <p key={item.message} className="font-medium text-amber-700">{item.message}</p>
            ))}
            {validation.info.map((item) => (
              <p key={item.message} className="font-medium text-slate-500">{item.message}</p>
            ))}
            {validation.valid && validation.warnings.length === 0 && (
              <p className="font-medium text-emerald-700">Required mapping is valid.</p>
            )}
          </div>
          {validation.unusedColumns.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {validation.unusedColumns.map((column) => (
                <span key={column} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {column}
                </span>
              ))}
            </div>
          )}
          {validation.invalidPlaceholders.length > 0 && (
            <div className="mt-3 grid gap-2">
              {validation.invalidPlaceholders.map((placeholder) => (
                <p key={placeholder.raw} className="text-xs font-medium text-amber-700">
                  {placeholder.raw}: {placeholder.reason}
                  {placeholder.suggestion ? ` Suggested: {{${placeholder.suggestion}}}` : ''}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="mt-5 grid gap-3">
        {config.templateFields.map((field) => (
          <label
            key={field.id}
            className={`grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1.2fr] sm:items-center ${
              field.required && !state.fieldMapping[field.id]
                ? 'border-amber-200 bg-amber-50'
                : 'border-slate-200 bg-lightBg'
            }`}
          >
            <span>
              <span className="block text-sm font-semibold text-primary">
                {field.label}
                {field.required ? <span className="text-amber-600"> *</span> : null}
              </span>
              <span className="block text-xs font-medium text-slate-500">{field.placeholder}</span>
            </span>
            <select
              value={state.fieldMapping[field.id] || ''}
              onChange={(event) =>
                actions.updateState((current) => ({
                  fieldMapping: {
                    ...current.fieldMapping,
                    [field.id]: event.target.value,
                  },
                  draftDirty: true,
                  generationComplete: false,
                  generatedDocx: null,
                  generatedDocumentRecord: null,
                  generationError: '',
                  outputError: '',
                  persistingOutput: false,
                  batchValidation: null,
                  batchJob: null,
                  batchOutputs: [],
                  batchError: '',
                  batchComplete: false,
                }))
              }
              className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none"
            >
              <option value="">Choose column</option>
              {state.detectedColumns.map((column) => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  )
}

export function PreviewStep({ state, actions, config }) {
  const previewData = config.getPreviewData(state)
  const mergeResult = config.getMergeResult(state)
  const selectedRow = state.previewRows[state.previewRowIndex] || {}

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-primary">Preview</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">HTML preview uses real parsed Excel preview rows. DOCX rendering remains out of scope.</p>
      {state.previewRows.length > 0 && (
        <label className="mt-5 flex max-w-xs flex-col gap-2">
          <span className="text-sm font-semibold text-slate-600">Preview row</span>
          <select
            value={state.previewRowIndex}
            onChange={(event) =>
              actions.updateState({
                previewRowIndex: Number(event.target.value),
                draftDirty: true,
                generationComplete: false,
                generatedDocx: null,
                generatedDocumentRecord: null,
                generationError: '',
                outputError: '',
                persistingOutput: false,
              })
            }
            className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none"
          >
            {state.previewRows.map((_row, index) => (
              <option key={index} value={index}>Row {index + 1}</option>
            ))}
          </select>
        </label>
      )}
      {(mergeResult.errors.length > 0 || mergeResult.warnings.length > 0) && (
        <div className="mt-5 grid gap-2 rounded-md border border-slate-200 bg-lightBg p-4 text-sm">
          {mergeResult.errors.map((item) => (
            <p key={item.message} className="font-medium text-red-700">{item.message}</p>
          ))}
          {mergeResult.warnings.map((item) => (
            <p key={item.message} className="font-medium text-amber-700">{item.message}</p>
          ))}
        </div>
      )}
      <div className="mt-5 rounded-lg border border-slate-200 bg-lightBg p-6">
        <div className="mx-auto max-w-xl rounded-lg border border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentBlue">Certificate of Completion</p>
          <h4 className="mt-6 text-3xl font-semibold text-primary">{previewData.name || 'Participant Name'}</h4>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            has completed {previewData.course || 'Course Name'} on {previewData.date || 'Date'}.
          </p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            {previewData.certificate_id || 'CERT-ID'}
          </p>
          {previewData.trainer && <p className="mt-4 text-sm font-semibold text-slate-500">Trainer: {previewData.trainer}</p>}
        </div>
      </div>
      {Object.keys(selectedRow).length > 0 && (
        <div className="mt-5 rounded-md border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-primary">Raw preview row</h4>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(selectedRow).map(([key, value]) => (
              <div key={key} className="rounded-md bg-lightBg p-3 text-xs">
                <span className="font-semibold text-slate-500">{key}: </span>
                <span className="text-slate-700">{value || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function GenerationIssueList({ issues, tone = 'red' }) {
  if (!issues?.length) {
    return null
  }

  const toneClass = tone === 'amber' ? 'text-amber-700' : 'text-red-700'

  return (
    <div className="mt-4 grid gap-2 text-sm">
      {issues.map((item) => (
        <p key={item.message} className={`font-medium ${toneClass}`}>{item.message}</p>
      ))}
    </div>
  )
}

function GeneratedDocxCard({ generatedDocx, generatedDocumentRecord }) {
  if (!generatedDocx) {
    return null
  }

  const stored = Boolean(generatedDocumentRecord)
  const borderClass = stored ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
  const iconClass = stored ? 'text-emerald-600' : 'text-amber-600'
  const titleClass = stored ? 'text-emerald-900' : 'text-amber-900'
  const detailClass = stored ? 'text-emerald-700' : 'text-amber-700'

  return (
    <article className={`mt-5 rounded-md border p-4 ${borderClass}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className={`mt-0.5 shrink-0 ${iconClass}`} aria-hidden="true" />
          <div>
            <h4 className={`text-sm font-semibold ${titleClass}`}>{generatedDocx.fileName}</h4>
            <p className={`mt-1 text-xs font-medium ${detailClass}`}>
              {stored ? 'Stored DOCX ready in History' : 'Local fallback ready; storage did not complete'} - Generated {new Date(generatedDocx.generatedAt).toLocaleString()}
            </p>
            {stored && generatedDocumentRecord?.storage_path ? (
              <p className={`mt-1 break-all text-xs font-medium ${detailClass}`}>{generatedDocumentRecord.storage_path}</p>
            ) : null}
          </div>
        </div>
        <a
          href={generatedDocx.downloadUrl}
          download={generatedDocx.fileName}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          <Download size={16} aria-hidden="true" />
          Download DOCX
        </a>
      </div>
      <GenerationIssueList issues={generatedDocx.warnings} tone="amber" />
    </article>
  )
}

function getGenerationBlockers({ state, config }) {
  const blockers = []
  const validation = config.getValidationResult(state)
  const mergeResult = config.getMergeResult(state)

  if (!state.templateRecord) {
    blockers.push('Upload a DOCX template.')
  }

  if (!state.uploadRecord) {
    blockers.push('Upload an Excel file.')
  }

  if (!validation.valid) {
    blockers.push('Complete the required field mapping.')
  }

  if (!mergeResult.valid) {
    blockers.push('Fix the selected preview row values.')
  }

  if (!state.draftRecord) {
    blockers.push('Save the workspace draft.')
  }

  if (state.draftDirty) {
    blockers.push('Save the latest local changes.')
  }

  return blockers
}

function BatchSummary({ state, config }) {
  const rows = state.excelRows || []
  const validationRows = config.getBatchValidation ? config.getBatchValidation(state) : []
  const validRows = validationRows.filter((row) => row.status === 'valid')
  const invalidRows = validationRows.filter((row) => row.status !== 'valid')

  if (!rows.length) {
    return null
  }

  const overLimit = rows.length > BATCH_ROW_LIMIT

  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-lightBg p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-primary">Batch summary</h4>
          <p className="mt-1 text-xs font-medium text-slate-500">Generate valid Excel rows one DOCX at a time.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <span className="rounded-md bg-white px-3 py-2 text-xs font-bold text-primary">{rows.length} total</span>
          <span className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{validRows.length} valid</span>
          <span className="rounded-md bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">{invalidRows.length} invalid</span>
        </div>
      </div>
      {overLimit ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          Batch generation v2.0 supports up to 100 rows. Please split larger Excel files.
        </p>
      ) : null}
      {invalidRows.length > 0 ? (
        <div className="mt-3 max-h-36 overflow-auto rounded-md border border-amber-200 bg-white p-3">
          {invalidRows.slice(0, 8).map((row) => (
            <p key={row.rowNumber} className="text-xs font-medium text-amber-800">
              Row {row.rowNumber}: {row.missingFields.length ? `Missing ${row.missingFields.join(', ')}` : row.errorMessage}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function BatchProgress({ state }) {
  const progress = state.batchProgress || {}
  const validation = state.batchValidation
  const total = validation?.totalRows || state.rowCount || 0
  const percent = total ? Math.round((progress.completedCount / total) * 100) : 0

  if (!progress.active && !state.batchComplete) {
    return null
  }

  return (
    <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-primary">{progress.active ? `Current row ${progress.currentRow || '-'}` : 'Batch completed'}</p>
        <p className="text-sm font-bold text-accentBlue">{percent}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
        <div className="h-full rounded-full bg-accentBlue transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-4">
        <span>{progress.completedCount || 0} completed</span>
        <span>{progress.successCount || 0} generated</span>
        <span>{progress.failureCount || 0} failed/skipped</span>
        <span className="truncate">{progress.currentName || 'Do not close this tab'}</span>
      </div>
    </div>
  )
}

function BatchResult({ state }) {
  if (!state.batchComplete || !state.batchJob) {
    return null
  }

  const failedOutputs = (state.batchOutputs || []).filter((output) => output.status !== 'generated')

  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-emerald-900">Batch completed</h4>
          <p className="mt-1 text-xs font-medium text-emerald-700">
            {state.batchJob.success_count} generated, {state.batchJob.failure_count} failed or skipped from {state.batchJob.total_rows} rows.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('/dashboard/history')}
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white"
        >
          Open History
        </button>
      </div>
      {failedOutputs.length > 0 ? (
        <div className="mt-3 max-h-44 overflow-auto rounded-md border border-emerald-200 bg-white p-3">
          {failedOutputs.map((output) => (
            <p key={output.id} className="text-xs font-medium text-amber-800">
              Row {output.row_index}: {output.display_name || 'Unnamed'} - {output.error_message || output.status}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function GenerateStep({ state, actions, config }) {
  const canGenerate = config.canGenerate(state)
  const canGenerateBatch = config.canGenerateBatch ? config.canGenerateBatch(state) : false
  const mergeResult = config.getMergeResult(state)
  const blockers = getGenerationBlockers({ state, config })
  const statusLabel = config.getGenerationStatus ? config.getGenerationStatus(state) : 'Ready'

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-primary">Generate</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">Generate one DOCX certificate from the selected preview row. When storage succeeds, the same DOCX appears in History for re-download.</p>
      <div className="mt-5 rounded-md border border-slate-200 bg-lightBg p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary">{statusLabel}</p>
          <p className="text-sm font-semibold text-accentBlue">{state.generationProgress}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-accentBlue transition-all" style={{ width: `${state.generationProgress}%` }} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={actions.generate}
          disabled={state.generating || state.batchGenerating || !canGenerate}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {state.generating ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Wand2 size={17} aria-hidden="true" />}
          {state.generating ? 'Generating selected row' : 'Generate Selected Row'}
        </button>
        <button
          type="button"
          onClick={actions.generateBatch}
          disabled={state.generating || state.batchGenerating || !canGenerateBatch}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue disabled:opacity-60"
        >
          {state.batchGenerating ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ListChecks size={17} aria-hidden="true" />}
          {state.batchGenerating ? 'Generating batch' : 'Generate Batch'}
        </button>
      </div>
      {!canGenerate && blockers.length > 0 && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium leading-6 text-amber-800">
          {blockers.join(' ')}
        </div>
      )}
      <BatchSummary state={state} config={config} />
      <BatchProgress state={state} />
      <BatchResult state={state} />
      {state.generationError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-700">
          {state.generationError}
        </div>
      )}
      {state.batchError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-700">
          {state.batchError}
        </div>
      )}
      {state.outputError && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium leading-6 text-amber-800">
          {state.outputError.message || state.outputError}
          {state.outputError.technicalDetail ? <p className="mt-2 text-xs font-medium text-amber-700">Detail: {state.outputError.technicalDetail}</p> : null}
        </div>
      )}
      <GenerationIssueList issues={mergeResult.errors} />
      <GenerationIssueList issues={mergeResult.warnings} tone="amber" />
      <GeneratedDocxCard generatedDocx={state.generatedDocx} generatedDocumentRecord={state.generatedDocumentRecord} />
    </section>
  )
}

export function DownloadsStep({ state }) {
  const outputs = [
    [
      state.generatedDocumentRecord ? 'Stored DOCX' : 'Local DOCX',
      FileText,
      state.generatedDocumentRecord ? 'Saved in certificate-outputs' : state.generatedDocx ? 'Local fallback only' : 'Waiting for DOCX generation',
      state.generatedDocx,
      state.generatedDocumentRecord,
    ],
    ['PDF package', FileText, 'Coming soon', null],
    ['Generation log', FileSpreadsheet, 'Coming soon', null],
  ]

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-primary">Download center</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">The generated DOCX is stored privately when persistence succeeds. Local fallback remains available after a storage or database error.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {outputs.map(([label, Icon, status, generatedDocx, generatedDocumentRecord]) => (
          <article key={label} className="rounded-md border border-slate-200 bg-lightBg p-4">
            <Icon className="text-accentBlue" size={22} aria-hidden="true" />
            <h4 className="mt-4 text-sm font-semibold text-primary">{label}</h4>
            <p className="mt-1 text-xs leading-5 text-slate-500">{status}</p>
            {generatedDocumentRecord?.file_name ? (
              <p className="mt-2 break-all text-xs font-medium text-slate-600">{generatedDocumentRecord.file_name}</p>
            ) : null}
            {generatedDocx ? (
              <a
                href={generatedDocx.downloadUrl}
                download={generatedDocx.fileName}
                className="focus-ring mt-4 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-white"
              >
                <Download size={14} aria-hidden="true" />
                Download
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="mt-4 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-400"
              >
                <Download size={14} aria-hidden="true" />
                Download later
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
