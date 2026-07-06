import { useState } from 'react'
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, FileText, Loader2, ListChecks, Wand2, X } from 'lucide-react'
import { detectDocxPlaceholders } from '../../core/atlas/index.js'
import {
  parseExcelColumns,
  uploadCertificateInput,
  uploadCertificateTemplate,
  validateExcelFile,
  validateTemplateFile,
} from './services/certificateFilesService.js'
import { createBatchDocxZip, downloadGeneratedCertificateDocx } from './services/certificateOutputsService.js'
import { getUploadError } from '../../utils/errorMessages.js'
import { BATCH_ROW_LIMIT } from './services/certificateBatchService.js'
import { navigateTo } from '../../utils/routes.js'
import EmailPreparationPanel from '../../components/email/EmailPreparationPanel.jsx'
import SampleStarterPanel from '../document-workspace/SampleStarterPanel.jsx'
import FirstRunGuide from '../document-workspace/FirstRunGuide.jsx'

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

function SelectedFileCard({ title, record, file, emptyText, onRemove }) {
  const fileName = record?.file_name || file?.name
  const sizeText = file?.size || record?.displaySize || ''
  const stored = Boolean(record)

  if (!record && !file) {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        {emptyText || 'No file uploaded yet.'}
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-emerald-800">{fileName}</p>
          <p className="mt-1 text-xs font-medium text-emerald-700">
            {sizeText ? `${sizeText} · ` : ''}{stored ? `${title} stored in Supabase` : 'Selected in this session'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Ready
          </span>
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="focus-ring inline-flex min-h-8 items-center justify-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              <X size={13} aria-hidden="true" />
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function FileUploadControl({ title, description, acceptLabel, accept, loading, selectedFile, record, error, onFile, emptyText, onRemove }) {
  const [dragActive, setDragActive] = useState(false)
  const hasFile = Boolean(record || selectedFile)

  function handleDrop(event) {
    event.preventDefault()
    setDragActive(false)

    if (loading) {
      return
    }

    const file = event.dataTransfer?.files?.[0]
    if (file) {
      onFile(file)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Your selection and mapping are saved for this product while you stay signed in on this tab.
      </p>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!loading) setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`mt-5 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
          dragActive ? 'border-accentTeal bg-teal-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        <p className="text-sm font-semibold text-slate-600">
          {dragActive ? 'Drop the file to upload' : 'Drag & drop your file here, or'}
        </p>
        <label className="focus-ring inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-accentTeal px-3.5 text-sm font-semibold text-white transition hover:bg-teal-800">
          {loading ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : null}
          {loading ? 'Uploading' : hasFile ? 'Replace file' : 'Choose file'}
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
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{acceptLabel}</p>
      </div>
      <UploadMessage error={error} />
      <SelectedFileCard title={title} record={record} file={selectedFile} emptyText={emptyText} onRemove={hasFile ? onRemove : undefined} />
    </div>
  )
}

export function TemplateStep({ state, actions, workspace, config }) {
  async function handleTemplateFile(file) {
    actions.updateState({ uploadingTemplate: true, templateUploadError: '' })

    try {
      validateTemplateFile(file)
      const templateRecord = await uploadCertificateTemplate({
        organizationId: workspace.organization?.id,
        productId: workspace.product?.organizationId ? workspace.product.id : null,
        productSlug: workspace.product?.slug || config.productSlug,
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

  function handleRemoveTemplate() {
    // Local re-selection only: drop the reference to the uploaded template so the
    // user can pick another one. This does NOT delete any stored file or History.
    actions.updateState({
      templateFile: null,
      templateRecord: null,
      detectedPlaceholders: [],
      invalidPlaceholders: [],
      placeholderKeys: [],
      placeholderDuplicateCounts: {},
      placeholderDetectionError: '',
      draftRecord: null,
      draftDirty: true,
      generationComplete: false,
      generatedDocx: null,
      generatedDocumentRecord: null,
      generationError: '',
      outputError: '',
    })
  }

  const templateReady = Boolean(state.templateRecord)

  return (
    <div className="grid min-w-0 gap-5">
      <FileUploadControl
        title={config.copy?.templateTitle || 'Upload your certificate template'}
        description={config.copy?.templateDescription || 'Choose the approved DOCX template for this certificate batch. Placeholder fields will be detected after upload.'}
        acceptLabel=".docx only, max 10 MB"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        loading={state.uploadingTemplate}
        selectedFile={state.templateFile}
        record={state.templateRecord}
        error={state.templateUploadError}
        onFile={handleTemplateFile}
        onRemove={handleRemoveTemplate}
        emptyText={config.copy?.templateEmptyText || 'No DOCX template uploaded yet.'}
      />
      <SampleStarterPanel slug={config.productSlug} config={config} defaultOpen={!templateReady} />
      <FirstRunGuide slug={config.productSlug} config={config} defaultOpen={!templateReady} />
    </div>
  )
}

export function ExcelStep({ state, actions, workspace, config }) {
  async function handleExcelFile(file) {
    actions.updateState({ uploadingExcel: true, excelUploadError: '' })

    try {
      validateExcelFile(file)
      const { detectedColumns, rowCount, previewRows, excelRows } = await parseExcelColumns(file)
      const uploadRecord = await uploadCertificateInput({
        organizationId: workspace.organization?.id,
        productId: workspace.product?.organizationId ? workspace.product.id : null,
        productSlug: workspace.product?.slug || config.productSlug,
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
        fieldMapping: config.createEmptyFieldMapping ? config.createEmptyFieldMapping() : {
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

  const excelEmptyText = config.copy?.excelEmptyText || 'No Excel file uploaded yet.'

  function handleRemoveExcel() {
    // Local re-selection only: drop the parsed rows/columns and the upload
    // reference so the user can pick another file. Nothing stored is deleted.
    actions.updateState({
      excelFile: null,
      uploadRecord: null,
      detectedColumns: [],
      previewRows: [],
      excelRows: [],
      previewRowIndex: 0,
      rowCount: 0,
      draftRecord: null,
      draftDirty: true,
      generationComplete: false,
      generatedDocx: null,
      generatedDocumentRecord: null,
      generationError: '',
      outputError: '',
    })
  }

  return (
    <div className="grid min-w-0 gap-5">
      <FileUploadControl
        title={config.copy?.excelTitle || 'Upload your Excel data'}
        description={config.copy?.excelDescription || 'Choose the spreadsheet with student or participant rows. Column headers are detected in the browser.'}
        acceptLabel=".xlsx or .xls, max 10 MB"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        loading={state.uploadingExcel}
        selectedFile={state.excelFile}
        record={state.uploadRecord}
        error={state.excelUploadError}
        onFile={handleExcelFile}
        onRemove={handleRemoveExcel}
        emptyText={excelEmptyText}
      />

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {state.uploadRecord ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <p><span className="font-semibold text-primary">Excel status:</span> Ready</p>
            <p><span className="font-semibold text-primary">Rows:</span> {state.rowCount}</p>
            <p><span className="font-semibold text-primary">Columns:</span> {state.detectedColumns.length}</p>
          </div>
        ) : (
          excelEmptyText
        )}
      </div>

      {state.detectedColumns.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-primary">Detected columns</h4>
          <p className="mt-1 text-sm text-slate-500">These columns are available for field mapping.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {state.detectedColumns.map((column) => (
              <span key={column} className="max-w-full break-words rounded-md border border-slate-200 bg-lightBg px-3 py-2 text-sm font-semibold text-slate-600">
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
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Step 3</p>
          <h3 className="mt-1 text-xl font-semibold text-primary">Review mapped fields</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Connect each template placeholder to the matching Excel column.</p>
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
                <span key={key} className="max-w-full break-words rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
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
      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-primary">Review the mapping before generating files. You can change any column manually.</p>
      </div>
      <div className="mt-5 grid gap-4">
        {config.templateFields.map((field) => {
          const selectedColumn = state.fieldMapping[field.id] || ''
          const isMissing = field.required && !selectedColumn

          return (
            <div
              key={field.id}
              className={`rounded-lg border p-4 ${isMissing ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">{field.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{field.placeholder}</p>
                </div>
                <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${selectedColumn ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                  {selectedColumn ? 'Mapped' : 'Missing'}
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.3fr]">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Selected Excel column</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{selectedColumn || 'No column selected'}</p>
                </div>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Choose column</span>
                  <select
                    value={selectedColumn}
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
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function PreviewStep({ state, actions, config }) {
  const previewData = config.getPreviewData(state)
  const mergeResult = config.getMergeResult(state)
  const selectedRow = state.previewRows[state.previewRowIndex] || {}
  const totalRows = state.previewRows.length
  const previewRowNumber = totalRows ? state.previewRowIndex + 1 : 0
  const missingFields = [...mergeResult.missingColumns, ...mergeResult.missingValues].map((item) => item.label)
  const rowReady = mergeResult.valid

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Step 4</p>
          <h3 className="mt-1 text-xl font-semibold text-primary">{config.copy?.previewTitle || 'Preview one student row'}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{config.copy?.previewDescription || 'Review one parsed Excel row before generating DOCX files.'}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          {totalRows ? `Row ${previewRowNumber} of ${totalRows}` : 'No preview rows available'}
        </div>
      </div>

      {totalRows > 0 ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Preview row status</p>
                <p className={`mt-2 text-sm font-semibold ${rowReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {rowReady ? 'This row is ready' : 'This row has missing fields'}
                </p>
              </div>
              <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${rowReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                {rowReady ? 'Ready' : 'Needs review'}
              </span>
            </div>
            {missingFields.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Missing values</p>
                <p className="mt-2">{missingFields.join(', ')}</p>
              </div>
            )}
            <div className="mt-5 grid gap-3">
              {config.templateFields.map((field) => (
                <div key={field.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{field.label}</p>
                  <p className="mt-2 text-sm font-semibold text-primary">{previewData[field.id] || '-'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accentBlue">{config.copy?.previewCardEyebrow || 'Document preview'}</p>
            </div>
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accentBlue">{config.copy?.previewDocumentTitle || 'Prepared DOCX Preview'}</p>
              <h4 className="mt-6 text-3xl font-semibold text-primary">{previewData[config.copy?.previewNameField || 'name'] || config.copy?.previewNameFallback || 'Primary Name'}</h4>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {config.copy?.previewSentence
                  ? config.copy.previewSentence(previewData)
                  : `has completed ${previewData.course || 'Course Name'} on ${previewData.date || 'Date'}.`}
              </p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {previewData[config.copy?.previewIdField || 'certificate_id'] || config.copy?.previewIdFallback || 'DOCUMENT-ID'}
              </p>
              {previewData[config.copy?.optionalField || 'trainer'] && <p className="mt-4 text-sm font-semibold text-slate-500">{config.copy?.optionalFieldLabel || 'Prepared by'}: {previewData[config.copy?.optionalField || 'trainer']}</p>}
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Raw preview row values</p>
              <div className="mt-4 grid gap-2">
                {Object.entries(selectedRow).map(([key, value]) => (
                  <div key={key} className="rounded-md bg-slate-50 p-3 text-xs">
                    <span className="font-semibold text-slate-500">{key}: </span>
                    <span className="text-slate-700">{value || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-slate-200 bg-lightBg p-6 text-sm text-slate-600">
          Upload Excel data and complete field mapping to see a preview row here.
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
              {stored ? 'Stored DOCX ready in History' : 'Local fallback ready; storage did not complete'} / Generated {new Date(generatedDocx.generatedAt).toLocaleString()}
            </p>
            {stored && generatedDocumentRecord?.storage_path ? (
              <p className={`mt-1 break-all text-xs font-medium ${detailClass}`}>{generatedDocumentRecord.storage_path}</p>
            ) : null}
          </div>
        </div>
        <a
          href={generatedDocx.downloadUrl}
          download={generatedDocx.fileName}
          className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-accentTeal px-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
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
    blockers.push('Please upload a DOCX template before generating.')
  }

  if (!state.uploadRecord) {
    blockers.push('Please upload an Excel file before generating.')
  }

  if (!validation.valid) {
    blockers.push('Some placeholders are not mapped. Review mapping before generating.')
  }

  if (!mergeResult.valid) {
    blockers.push('The selected preview row has missing values.')
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
          <h4 className="text-sm font-semibold text-primary">Batch DOCX summary</h4>
          <p className="mt-1 text-xs font-medium text-slate-500">Valid rows can be generated into individual DOCX files.</p>
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

function BatchResult({ state, config }) {
  const [zipState, setZipState] = useState({
    preparing: false,
    progressMessage: '',
    warningMessage: '',
    errorMessage: '',
  })

  if (!state.batchComplete || !state.batchJob) {
    return null
  }

  const outputs = state.batchOutputs || []
  const generatedOutputs = outputs.filter((output) => output.status === 'generated')
  const canDownloadZip = generatedOutputs.length > 0

  async function handleDownloadDocx(output) {
    try {
      const blob = await downloadGeneratedCertificateDocx(output)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = output.file_name || `row-${output.row_index}-${config.id || 'document'}.docx`
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      // Keep batch result flow unaffected if download fails.
      console.error('Batch DOCX download failed', error)
    }
  }

  async function handleDownloadZip() {
    if (!canDownloadZip) {
      return
    }

    setZipState({ preparing: true, progressMessage: 'Preparing ZIP...', warningMessage: '', errorMessage: '' })

    try {
      const fileName = `${config.productSlug || 'project-atlas'}-batch-${state.batchJob.id}.zip`
      const { zipBlob, warnings } = await createBatchDocxZip(generatedOutputs, fileName, ({ message }) => {
        setZipState((current) => ({ ...current, progressMessage: message }))
      })

      const url = URL.createObjectURL(zipBlob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = fileName
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      setZipState({ preparing: false, progressMessage: 'ZIP ready. Download started.', warningMessage: warnings.length ? 'Some files could not be added to ZIP.' : '', errorMessage: '' })
    } catch (error) {
      setZipState({ preparing: false, progressMessage: '', warningMessage: '', errorMessage: 'Could not prepare ZIP. Please try individual downloads.' })
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-emerald-900">Batch generation complete</h4>
          <p className="mt-1 text-xs font-medium text-emerald-700">
            {state.batchJob.success_count} generated, {state.batchJob.failure_count} failed or skipped from {state.batchJob.total_rows} rows.
          </p>
          <p className="mt-2 text-xs text-slate-600">Downloads all successfully generated DOCX files from this batch.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={zipState.preparing || !canDownloadZip}
            className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-accentTeal px-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
          >
            {zipState.preparing ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
            {zipState.preparing ? 'Preparing ZIP...' : 'Download All as ZIP'}
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/dashboard/history')}
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary"
          >
            Open History
          </button>
        </div>
      </div>
      {zipState.progressMessage ? (
        <p className="mt-3 text-sm font-medium text-slate-600">{zipState.progressMessage}</p>
      ) : null}
      {zipState.warningMessage ? (
        <p className="mt-2 text-sm font-semibold text-amber-700">{zipState.warningMessage}</p>
      ) : null}
      {zipState.errorMessage ? (
        <p className="mt-2 text-sm font-semibold text-red-600">{zipState.errorMessage}</p>
      ) : null}
      <div className="mt-5 overflow-x-auto rounded-lg border border-emerald-200 bg-white p-3">
        <table className="min-w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-3 py-3">Row</th>
              <th className="px-3 py-3">Display name</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {outputs.map((output) => (
              <tr key={output.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-semibold text-primary">{output.row_index}</td>
                <td className="px-3 py-3">{output.display_name || 'Unnamed row'}</td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${output.status === 'generated' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                    {output.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-amber-800">{output.error_message || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EmailPreparationPanel
        rows={state.excelRows || []}
        outputs={outputs}
        columns={state.detectedColumns || []}
        onDownload={handleDownloadDocx}
        title="Prepare email delivery"
        helperText="Review email copy and safety checks for generated DOCX files."
        statusText="Manual Prep / Auto Send Coming Soon"
      />
    </div>
  )
}

export function GenerateStep({ state, actions, config }) {
  const [selectedFormat, setSelectedFormat] = useState('docx-only')
  const canGenerate = config.canGenerate(state)
  const canGenerateBatch = config.canGenerateBatch ? config.canGenerateBatch(state) : false
  const mergeResult = config.getMergeResult(state)
  const blockers = getGenerationBlockers({ state, config })
  const statusLabel = config.getGenerationStatus ? config.getGenerationStatus(state) : 'Ready'

  const singleEmailRows = state.generatedDocumentRecord?.merge_data ? [state.generatedDocumentRecord.merge_data] : []
  const singleEmailOutputs = state.generatedDocumentRecord
    ? [
        {
          id: state.generatedDocumentRecord.id,
          row_index: (state.generatedDocumentRecord.preview_row_index ?? 0) + 1,
          display_name: state.generatedDocumentRecord.file_name,
          status: 'generated',
          storage_bucket: state.generatedDocumentRecord.storage_bucket,
          storage_path: state.generatedDocumentRecord.storage_path,
          file_name: state.generatedDocumentRecord.file_name,
        },
      ]
    : []

  async function handleSingleDownload(output) {
    if (!output || !state.generatedDocumentRecord) {
      return
    }

    try {
      const blob = await downloadGeneratedCertificateDocx(state.generatedDocumentRecord)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = state.generatedDocumentRecord.file_name || 'generated-document.docx'
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Single DOCX download failed', error)
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Step 5</p>
      <h3 className="mt-1 text-xl font-semibold text-primary">{config.copy?.generateTitle || 'Generate DOCX files'}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{config.copy?.generateDescription || 'Generate one DOCX from the preview row, or generate batch DOCX files from valid Excel rows.'}</p>
      <div className="mt-5 rounded-lg border border-slate-200 bg-lightBg p-4">
        <div className="grid gap-3 sm:grid-cols-[1.1fr_1fr]">
          <label className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 transition focus-within:border-accentBlue focus-within:ring-2 focus-within:ring-blue-100">
            <input
              type="radio"
              name="outputFormat"
              value="docx-only"
              checked={selectedFormat === 'docx-only'}
              onChange={() => setSelectedFormat('docx-only')}
              className="sr-only"
            />
            <p className="font-semibold text-primary">DOCX only</p>
            <p className="mt-1 text-sm text-slate-600">Generate and store DOCX files only. This is the stable output path.</p>
          </label>
          <label className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 p-4 opacity-70">
            <input type="radio" name="outputFormat" value="docx-pdf" disabled className="sr-only" />
            <p className="font-semibold text-slate-600">PDF export unavailable</p>
            <p className="mt-1 text-sm text-slate-500">DOCX is the supported output for this workspace.</p>
          </label>
        </div>
      </div>
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
          onClick={actions.saveWorkspace}
          disabled={state.savingDraft || !config.canSave(state)}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accentTeal px-3.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
        >
          {state.savingDraft ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <FileText size={17} aria-hidden="true" />}
          {state.savingDraft ? 'Saving workspace' : 'Save workspace'}
        </button>
        <button
          type="button"
          onClick={actions.generate}
          disabled={state.generating || state.batchGenerating || !canGenerate}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accentTeal px-3.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
        >
          {state.generating ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Wand2 size={17} aria-hidden="true" />}
          {state.generating ? 'Generating one DOCX' : 'Generate one DOCX'}
        </button>
        <button
          type="button"
          onClick={actions.generateBatch}
          disabled={state.generating || state.batchGenerating || !canGenerateBatch}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accentTeal px-3.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-60"
        >
          {state.batchGenerating ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ListChecks size={17} aria-hidden="true" />}
          {state.batchGenerating ? 'Generating batch DOCX files' : 'Generate batch DOCX files'}
        </button>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        Batch generation runs in your browser. Recommended limit: up to 100 rows.
      </p>
      {!canGenerate && blockers.length > 0 && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium leading-6 text-amber-800">
          {blockers.join(' ')}
        </div>
      )}
      <BatchSummary state={state} config={config} />
      <BatchProgress state={state} />
      <BatchResult state={state} config={config} />
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
      {state.generatedDocumentRecord ? (
        <EmailPreparationPanel
          rows={singleEmailRows}
          outputs={singleEmailOutputs}
          columns={Object.keys(state.generatedDocumentRecord.merge_data || {})}
          onDownload={handleSingleDownload}
          title="Prepare email delivery"
          helperText="Review email copy and safety checks for the generated DOCX."
          statusText="Manual Prep / Auto Send Coming Soon"
          showBatchTable={false}
        />
      ) : null}
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
    ['PDF package', FileText, 'Coming soon — browser-only PDF conversion not supported', null],
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
                className="focus-ring mt-4 inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-md bg-accentTeal px-2.5 text-xs font-semibold text-white transition hover:bg-teal-800"
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
