import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, ChevronDown, Download, FileText, Info, PencilLine, Settings2, Sparkles, Table2 } from 'lucide-react'
import { generateWorksheetRows } from './worksheetBuilder.js'
import { generateQuestionPaperRows } from './questionPaperBuilder.js'
import { buildWorkbookFile, downloadWorkbook } from './buildWorkbook.js'
import PaperPreview from './PaperPreview.jsx'
import { composeWorksheetDocx } from '../composer/worksheetComposer.js'
import { composeQuestionPaperDocx } from '../composer/questionPaperComposer.js'
import { downloadDocxBlob } from '../composer/documentLayout.js'

// Builder-first teacher workspace: left = setup form, right = live PAPER preview
// (a real worksheet / question-paper document), with a Data View fallback. The
// composer produces a genuine one-click .docx from the same model the preview uses.

const GENERATORS = {
  worksheet: generateWorksheetRows,
  'question-paper': generateQuestionPaperRows,
}

const PREVIEW_ROW_LIMIT = 12

function defaultsFromFields(fields) {
  return fields.reduce((values, field) => {
    values[field.id] = field.default
    return values
  }, {})
}

function isFieldVisible(field, values) {
  if (!field.showIf) {
    return true
  }
  return Object.entries(field.showIf).every(([key, allowed]) => {
    const set = Array.isArray(allowed) ? allowed : [allowed]
    return set.includes(values[key])
  })
}

function slugForFile(value, fallback) {
  const slug = String(value || '').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
  return slug || fallback
}

function FieldControl({ field, value, onChange }) {
  const helper = field.helper ? (
    <span className="text-[11px] font-normal leading-4 text-slate-400">{field.helper}</span>
  ) : null

  if (field.type === 'toggle') {
    return (
      <div className="grid gap-1">
        <label className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
          <span className="text-sm font-semibold text-slate-700">{field.label}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(field.id, event.target.checked)}
            className="h-4 w-4 accent-accentTeal"
          />
        </label>
        {helper}
      </div>
    )
  }

  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{field.label}</span>
      {field.type === 'select' ? (
        <select
          value={value ?? ''}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-accentBlue"
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          value={value ?? ''}
          rows={3}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary outline-none focus:border-accentBlue"
        />
      ) : (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={value ?? ''}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.id, event.target.value)}
          className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-accentBlue"
        />
      )}
      {helper}
    </label>
  )
}

export default function BuilderWorkspace({ config, state, actions, onUseInWorkspace }) {
  const builder = config.builder
  const generate = GENERATORS[builder.builderType] || GENERATORS.worksheet
  const isPaper = builder.builderType === 'question-paper'
  const [formValues, setFormValues] = useState(() => ({
    ...defaultsFromFields(builder.fields),
    ...(state.builderConfig || {}),
  }))
  const [previewMode, setPreviewMode] = useState('paper')
  const [using, setUsing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const formRef = useRef(null)

  // Live preview — regenerates from the current form. Deterministic + cheap, so the
  // paper updates as the teacher types (only pattern/range/count reshuffle questions).
  const result = useMemo(() => generate(formValues), [generate, formValues])
  const visibleFields = builder.fields.filter((field) => isFieldVisible(field, formValues))

  // Persist the form to the workspace so edits survive navigation / restore and are
  // available to the "Continue to DOCX Layout" handoff. Runs on form change only.
  useEffect(() => {
    actions.updateState({ builderConfig: formValues, builderMode: 'build' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues])

  function handleField(id, value) {
    setFormValues((current) => ({ ...current, [id]: value }))
  }

  function handlePreset(preset) {
    setFormValues((current) => ({ ...current, ...preset.values }))
  }

  function handleEditInBuilder() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const hasRows = Boolean(result && result.rows.length)
  const fileBase = `${config.productSlug}-${slugForFile(formValues.title, 'document')}`

  function handleDownloadDocx() {
    if (!hasRows) {
      return
    }
    const blob = isPaper
      ? composeQuestionPaperDocx(formValues, result.rows, result.blueprint)
      : composeWorksheetDocx(formValues, result.rows)
    downloadDocxBlob(blob, `${fileBase}.docx`)
  }

  function handleDownloadExcel() {
    if (!hasRows) {
      return
    }
    downloadWorkbook(result.columns, result.rows, `${fileBase}.xlsx`)
  }

  async function handleContinueToLayout() {
    if (!hasRows) {
      return
    }
    setUsing(true)
    try {
      const file = buildWorkbookFile(result.columns, result.rows, `${fileBase}.xlsx`)
      await onUseInWorkspace(file)
    } finally {
      setUsing(false)
    }
  }

  const previewRows = result ? result.rows.slice(0, PREVIEW_ROW_LIMIT) : []
  const activeNotice = result?.notice || ''
  const docxLabel = isPaper ? 'Download Question Paper DOCX' : 'Download Worksheet DOCX'

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      {/* Left: teacher setup form */}
      <div ref={formRef} className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm scroll-mt-24">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-100 text-accentBlue">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-primary">{builder.title || 'Build automatically'}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{builder.description}</p>
          </div>
        </div>

        {builder.presets?.length ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{builder.presetLabel || 'Pattern'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {builder.presets.map((preset) => {
                const active = builder.presetMatch ? builder.presetMatch(formValues, preset) : false
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    className={`focus-ring inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-semibold transition ${
                      active ? 'border-accentBlue bg-blue-50 text-accentBlue' : 'border-slate-200 bg-white text-slate-600 hover:border-accentBlue hover:text-accentBlue'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {visibleFields.map((field) => (
            <div key={field.id} className={field.full || field.type === 'textarea' ? 'sm:col-span-2' : ''}>
              <FieldControl field={field} value={formValues[field.id]} onChange={handleField} />
            </div>
          ))}
        </div>

        {builder.note ? (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3">
            <Info size={15} className="mt-0.5 shrink-0 text-accentBlue" aria-hidden="true" />
            <p className="text-xs leading-5 text-blue-800">{builder.note}</p>
          </div>
        ) : null}
      </div>

      {/* Right: live paper preview + actions */}
      <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">{builder.previewTitle || 'Preview'}</p>
            {result?.blueprint ? (
              <p className="text-xs font-semibold text-slate-500">
                {result.blueprint.numSections} sections · {result.blueprint.totalQuestions} questions · {result.blueprint.totalMarks} marks
              </p>
            ) : result?.meta ? (
              <p className="text-xs font-semibold text-slate-500">
                {result.meta.count} questions · {result.meta.difficulty} · range {result.meta.range}
              </p>
            ) : null}
          </div>
          {/* Paper Preview | Data View toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Preview mode">
            {[
              { id: 'paper', label: 'Paper preview', Icon: FileText },
              { id: 'data', label: 'Data view', Icon: Table2 },
            ].map((option) => {
              const active = previewMode === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPreviewMode(option.id)}
                  className={`focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition ${
                    active ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'
                  }`}
                >
                  <option.Icon size={14} aria-hidden="true" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        {activeNotice ? (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="text-xs leading-5 text-amber-800">{activeNotice}</p>
          </div>
        ) : null}

        {!hasRows && !activeNotice ? (
          <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">Set your options to build the {isPaper ? 'paper' : 'worksheet'}.</p>
            <p className="mt-1 text-xs text-slate-500">The document is generated in your browser.</p>
          </div>
        ) : null}

        {hasRows && previewMode === 'paper' ? (
          <PaperPreview builderType={builder.builderType} form={formValues} rows={result.rows} blueprint={result.blueprint} />
        ) : null}

        {hasRows && previewMode === 'data' ? (
          <>
            <div className="mt-3 overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {result.columns.map((column) => (
                      <th key={column} className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="odd:bg-white even:bg-slate-50/60">
                      {result.columns.map((column) => (
                        <td key={column} className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700">
                          {row[column] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.rows.length > PREVIEW_ROW_LIMIT ? (
              <p className="mt-2 text-xs font-medium text-slate-500">Showing first {PREVIEW_ROW_LIMIT} of {result.rows.length} rows.</p>
            ) : null}
          </>
        ) : null}

        {hasRows ? (
          <>
            {/* Primary teacher path: download the finished document. */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadDocx}
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accentTeal px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                <FileText size={17} aria-hidden="true" />
                {docxLabel}
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:border-accentBlue hover:text-accentBlue"
              >
                <Download size={16} aria-hidden="true" />
                Download Excel
              </button>
              <button
                type="button"
                onClick={handleEditInBuilder}
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:border-accentBlue hover:text-accentBlue xl:hidden"
              >
                <PencilLine size={16} aria-hidden="true" />
                Edit in Builder
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              <span className="font-semibold">{docxLabel}</span> gives you the finished document — ready to print or edit in Word.
            </p>

            {/* Advanced (collapsed): map this content onto the teacher's own Word template. */}
            {onUseInWorkspace ? (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((open) => !open)}
                  aria-expanded={showAdvanced}
                  className="focus-ring flex w-full items-center justify-between gap-2 rounded-md px-3.5 py-2.5 text-left text-xs font-semibold text-slate-600 transition hover:text-primary"
                >
                  <span className="inline-flex items-center gap-2">
                    <Settings2 size={14} aria-hidden="true" />
                    Advanced: use my own Word template
                  </span>
                  <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                {showAdvanced ? (
                  <div className="border-t border-slate-200 px-3.5 py-3">
                    <p className="text-xs leading-5 text-slate-500">
                      Only use this if you want to map this content into your own Word template. Most teachers can just download the DOCX above.
                    </p>
                    <button
                      type="button"
                      onClick={handleContinueToLayout}
                      disabled={using}
                      className="focus-ring mt-2.5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-accentBlue hover:text-accentBlue disabled:opacity-60"
                    >
                      {using ? 'Loading…' : 'Advanced: use my own Word template'}
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  )
}
