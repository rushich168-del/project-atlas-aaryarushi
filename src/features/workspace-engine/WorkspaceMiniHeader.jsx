import { CheckCircle2, CircleDashed, ListChecks } from 'lucide-react'

// A subtle sticky bar that keeps the product, current step, readiness count and
// save status in view while the user scrolls a long workspace. Purely
// informational — it never covers the active content (it is a thin bar that
// sticks to the top of the scroll area).
export default function WorkspaceMiniHeader({
  productLabel,
  stepLabel,
  stepIndex,
  totalSteps,
  readinessDone,
  readinessTotal,
  saveStatusLabel,
  saved,
}) {
  return (
    <div className="sticky top-2 z-20 mt-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur">
        <span className="truncate text-sm font-semibold text-primary">{productLabel}</span>
        <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden="true" />
        <span className="text-xs font-semibold text-slate-500">
          Step {stepIndex + 1} of {totalSteps}
          {stepLabel ? <span className="ml-1 text-slate-700">· {stepLabel}</span> : null}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <ListChecks size={13} aria-hidden="true" />
          {readinessDone}/{readinessTotal} ready
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
            saved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {saved ? <CheckCircle2 size={13} aria-hidden="true" /> : <CircleDashed size={13} aria-hidden="true" />}
          {saveStatusLabel}
        </span>
      </div>
    </div>
  )
}
