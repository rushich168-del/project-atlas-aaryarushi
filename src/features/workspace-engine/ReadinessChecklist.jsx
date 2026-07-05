import { CheckCircle2, Circle } from 'lucide-react'

export default function ReadinessChecklist({ items }) {
  const completedCount = items.filter((item) => item.complete).length

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-primary">Workspace readiness</h3>
          <p className="mt-1 text-sm text-slate-500">Complete these items before generating DOCX files.</p>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
          {completedCount}/{items.length}
        </span>
      </div>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.id} className={`flex items-start gap-3 rounded-md border p-3 ${item.complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            {item.complete ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accentTeal" aria-hidden="true" />
            ) : (
              <Circle size={18} className="mt-0.5 shrink-0 text-slate-300" aria-hidden="true" />
            )}
            <div>
              <p className="text-sm font-semibold text-primary">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
