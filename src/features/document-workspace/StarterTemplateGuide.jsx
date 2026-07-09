import { useState } from 'react'
import { AlertTriangle, BookOpen, CheckCircle2, ChevronDown, ChevronUp, FileSpreadsheet, FileText } from 'lucide-react'
import {
  COMMON_MISTAKES,
  PLACEHOLDER_MATCH_RULE,
  getStarterTemplateGuidance,
} from './starterTemplateGuidance.js'

// Project Atlas v4.0 — reusable, collapsible starter guide for the top products.
// Renders product-specific example placeholders / Excel columns, the match rule,
// an example, common mistakes, and the output. Display-only: it never touches the
// generation engine, mapping, or payload. Unknown slugs render nothing so the
// panel only appears where guidance exists (and never crowds other workspaces).

export default function StarterTemplateGuide({ slug, defaultOpen = true }) {
  const guidance = getStarterTemplateGuidance(slug)
  const [open, setOpen] = useState(defaultOpen)

  if (!guidance) {
    return null
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-primary">
            <BookOpen size={18} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Starter guide</span>
            <span className="block text-base font-semibold text-primary">{guidance.productName} template setup</span>
          </span>
        </span>
        {open ? <ChevronUp size={18} className="text-slate-500" aria-hidden="true" /> : <ChevronDown size={18} className="text-slate-500" aria-hidden="true" />}
      </button>

      {open ? (
        <div className="border-t border-slate-200 px-5 py-5">
          <p className="text-sm leading-6 text-slate-600">{guidance.templateHint}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accentBlue" aria-hidden="true" />
                <p className="text-sm font-semibold text-primary">Word placeholders (example)</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {guidance.placeholders.map((placeholder) => (
                  <span key={placeholder} className="max-w-full break-words rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 font-mono text-xs font-semibold text-blue-800">
                    {placeholder}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-accentTeal" aria-hidden="true" />
                <p className="text-sm font-semibold text-primary">Excel columns (example)</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {guidance.columns.map((column) => (
                  <span key={column} className="max-w-full break-words rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800">
                    {column}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-semibold leading-6 text-blue-900">{PLACEHOLDER_MATCH_RULE}</p>
            <p className="mt-1 text-sm leading-6 text-blue-800">{guidance.example}</p>
          </div>

          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-700" aria-hidden="true" />
              <p className="text-sm font-semibold text-amber-800">Common mistakes to avoid</p>
            </div>
            <ul className="mt-2 grid gap-1.5">
              {COMMON_MISTAKES.map((mistake) => (
                <li key={mistake} className="flex items-start gap-2 text-sm leading-6 text-amber-800">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-md border border-teal-200 bg-teal-50 p-3">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-teal-800">
              <span className="font-semibold">What you get:</span> {guidance.output}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
