import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'

export default function ReadinessChecklist({ items, nextMissing = null, completedCount, nextActionLabel = '', onNextAction }) {
  const doneCount = typeof completedCount === 'number' ? completedCount : items.filter((item) => item.complete).length
  const allDone = doneCount === items.length

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-20">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-primary">Workspace readiness</h3>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
          {doneCount}/{items.length}
        </span>
      </div>

      {allDone ? (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
          <CheckCircle2 size={15} className="shrink-0 text-accentTeal" aria-hidden="true" />
          <p className="text-sm font-semibold text-emerald-800">All set — ready to generate DOCX.</p>
        </div>
      ) : nextMissing ? (
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <ArrowRight size={15} className="mt-0.5 shrink-0 text-accentBlue" aria-hidden="true" />
            <p className="text-sm font-semibold leading-5 text-blue-800">Next: {nextMissing.label}</p>
          </div>
          {onNextAction && nextActionLabel ? (
            <button
              type="button"
              onClick={onNextAction}
              className="focus-ring mt-2.5 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md bg-accentBlue px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {nextActionLabel}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item.id} className={`flex items-center gap-2.5 rounded-md border px-2.5 py-2 ${item.complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            {item.complete ? (
              <CheckCircle2 size={16} className="shrink-0 text-accentTeal" aria-hidden="true" />
            ) : (
              <Circle size={16} className="shrink-0 text-slate-300" aria-hidden="true" />
            )}
            <p className={`text-sm font-semibold ${item.complete ? 'text-emerald-800' : 'text-primary'}`}>{item.label}</p>
          </div>
        ))}
      </div>
    </aside>
  )
}
