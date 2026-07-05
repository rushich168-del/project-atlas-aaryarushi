import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Compass } from 'lucide-react'
import { getSampleStarter } from './sampleStarters.js'

// Generic fallbacks so an unknown/unsupported slug still renders a useful guide
// (and never crashes the workspace).
const FALLBACK = {
  templateLabel: 'Word template',
  excelLabel: 'Excel data',
  outputLabel: 'documents',
}

export default function FirstRunGuide({ slug }) {
  const [open, setOpen] = useState(true)
  const starter = getSampleStarter(slug)
  const templateLabel = starter?.templateLabel || FALLBACK.templateLabel
  const excelLabel = starter?.excelLabel || FALLBACK.excelLabel
  const outputLabel = starter?.outputLabel || FALLBACK.outputLabel
  const isTextOnly = slug === 'ar-idcard-pro' || Boolean(starter?.note)

  const steps = [
    `Download the sample ${excelLabel} and ${templateLabel} (buttons below).`,
    'Edit the sample files with your real data — keep the placeholder names.',
    `Upload your ${templateLabel} (.docx).`,
    `Upload your ${excelLabel} (.xlsx).`,
    'Check the detected fields and column mapping.',
    'Preview one row to confirm it looks right.',
    `Generate ${outputLabel} as DOCX.`,
  ]

  const warnings = [
    <>Use <span className="font-mono">{'{{ColumnName}}'}</span> placeholders only.</>,
    'Excel column names must match the template placeholders.',
    'Output is DOCX only.',
    ...(isTextOnly
      ? ['AR-IDCARD-PRO supports text placeholders only; photo placement stays manual/static in your template for now.']
      : []),
  ]

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-primary">
            <Compass size={18} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">First-run guide</span>
            <span className="block text-base font-semibold text-primary">New here? Follow these steps</span>
          </span>
        </span>
        {open ? <ChevronUp size={18} className="text-slate-500" aria-hidden="true" /> : <ChevronDown size={18} className="text-slate-500" aria-hidden="true" />}
      </button>

      {open ? (
        <div className="border-t border-slate-200 px-5 py-5">
          <ol className="grid gap-2 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3 rounded-md border border-slate-200 bg-lightBg p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accentBlue text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold leading-6 text-slate-700">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-700" aria-hidden="true" />
              <p className="text-sm font-semibold text-amber-800">Before you upload</p>
            </div>
            <ul className="mt-2 grid gap-1.5">
              {warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2 text-sm leading-6 text-amber-800">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  )
}
