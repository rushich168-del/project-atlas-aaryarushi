import { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, Download, FileSpreadsheet, FileText, Info, Sparkles } from 'lucide-react'
import { getSampleStarter } from './sampleStarters.js'
import { buildSampleTemplateBlob, buildSampleWorkbookBlob, downloadBlob } from './sampleFileGenerators.js'

export default function SampleStarterPanel({ slug, config, defaultOpen = true }) {
  const starter = getSampleStarter(slug)
  const [open, setOpen] = useState(defaultOpen)
  const [error, setError] = useState('')
  const starterPack = config?.starterPack || null
  const isContentBuilder = config?.workspacePattern === 'content-builder'

  // Defensive fallback: an unknown or unsupported product slug must not crash the
  // workspace. Show a clear message and stop.
  if (!starter) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 shrink-0 text-slate-500" size={18} aria-hidden="true" />
          <p className="text-sm leading-6 text-slate-600">
            A sample starter pack is not available for this product yet. Upload your own Word template with{' '}
            <span className="font-mono">{'{{ColumnName}}'}</span> placeholders and an Excel file with matching column headers.
          </p>
        </div>
      </section>
    )
  }

  function handleDownloadExcel() {
    setError('')
    try {
      downloadBlob(buildSampleWorkbookBlob(starter), `${starter.slug}-sample.xlsx`)
    } catch {
      setError('The sample Excel could not be generated in this browser. You can still copy the columns and example rows below.')
    }
  }

  function handleDownloadTemplate() {
    setError('')
    try {
      downloadBlob(buildSampleTemplateBlob(starter), `${starter.slug}-sample-template.docx`)
    } catch {
      setError('The sample Word template could not be generated in this browser. You can still copy the placeholders below into your own template.')
    }
  }

  return (
    <section className="rounded-lg border border-blue-200 bg-blue-50/40 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-100 text-accentBlue">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-accentBlue">Sample starter pack</span>
            <span className="block text-base font-semibold text-primary">{starterPack?.title || 'Use this sample structure'}</span>
          </span>
        </span>
        {open ? <ChevronUp size={18} className="text-slate-500" aria-hidden="true" /> : <ChevronDown size={18} className="text-slate-500" aria-hidden="true" />}
      </button>

      {open ? (
        <div className="border-t border-blue-200 px-5 py-5">
          <p className="text-sm leading-6 text-slate-600">
            {starterPack?.description
              || `The ${starter.productName} workspace fills your Word template from Excel columns. Use the placeholders and columns below, or download a ready-made sample to start quickly. Downloaded files are generated locally in your browser.`}
          </p>

          {starterPack?.callout ? (
            <div className="mt-4 flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
              <Info className="mt-0.5 shrink-0 text-accentBlue" size={16} aria-hidden="true" />
              <p className="text-sm font-semibold leading-6 text-blue-800">{starterPack.callout}</p>
            </div>
          ) : null}

          {starter.note ? (
            <div className="mt-4 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
              <Info className="mt-0.5 shrink-0 text-amber-700" size={16} aria-hidden="true" />
              <p className="text-sm font-semibold leading-6 text-amber-800">{starter.note}</p>
            </div>
          ) : null}

          {isContentBuilder && starterPack ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-accentBlue" aria-hidden="true" />
                  <p className="text-sm font-semibold text-primary">{starterPack.metadataLabel || 'Document metadata'}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(starterPack.metadataFields || []).map((field) => (
                    <span key={field} className="max-w-full break-words rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-800">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-accentTeal" aria-hidden="true" />
                  <p className="text-sm font-semibold text-primary">{starterPack.contentLabel || 'Content fields'}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(starterPack.contentFields || []).map((field) => (
                    <span key={field} className="max-w-full break-words rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-accentBlue" aria-hidden="true" />
                  <p className="text-sm font-semibold text-primary">Word placeholders</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {starter.placeholders.map((placeholder) => (
                    <span key={placeholder} className="max-w-full break-words rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 font-mono text-xs font-semibold text-blue-800">
                      {placeholder}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-accentTeal" aria-hidden="true" />
                  <p className="text-sm font-semibold text-primary">Excel columns</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {starter.columns.map((column) => (
                    <span key={column} className="max-w-full break-words rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800">
                      {column}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-5">
            <p className="text-sm font-semibold text-primary">{isContentBuilder ? 'Example generated rows' : 'Example rows'}</p>
            <div className="mt-3 overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {starter.columns.map((column) => (
                      <th key={column} className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold text-slate-600">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {starter.rows.map((row, index) => (
                    <tr key={index} className="odd:bg-white even:bg-slate-50/60">
                      {starter.columns.map((column) => (
                        <td key={column} className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700">
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-3">
              <AlertCircle className="mt-0.5 shrink-0 text-rose-700" size={16} aria-hidden="true" />
              <p className="text-sm font-semibold leading-6 text-rose-800">{error}</p>
            </div>
          ) : null}

          <div className="mt-6 rounded-md border border-teal-200 bg-teal-50/60 p-3">
            <p className="text-sm font-semibold text-teal-800">Need a quick start?</p>
            <p className="mt-1 text-sm leading-6 text-teal-800">
              Download both sample files, replace the example values with your real data, then upload them in the steps above.
              The columns and placeholders already line up, so generation works on the first try.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accentTeal px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              <Download size={16} aria-hidden="true" />
              Download sample Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
            >
              <Download size={16} aria-hidden="true" />
              Download sample Word template (.docx)
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Next step: open the sample Word template, adjust the layout to your design (keep the placeholders), then upload it above with the sample Excel.
          </p>
        </div>
      ) : null}
    </section>
  )
}
