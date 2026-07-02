import { CheckCircle2, Circle } from 'lucide-react'

export default function ReadinessChecklist({ items }) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-primary">Readiness</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-md border border-slate-200 bg-lightBg p-3">
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
