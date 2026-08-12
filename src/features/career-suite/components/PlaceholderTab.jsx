import { Lock, Clock } from 'lucide-react'

export function ModuleHeader({ title, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-600">{description}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <Lock size={12} />
          Planning / Foundation State
        </span>
      </div>
    </div>
  )
}

export function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-700">
          <Icon size={18} />
        </span>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function PlaceholderItem({ title, detail }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
      <div>
        <p className="text-xs font-semibold text-slate-800">{title}</p>
        <p className="text-[11px] text-slate-500">{detail}</p>
      </div>
      <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500">
        <Clock size={10} />
        Structure Prepared
      </span>
    </div>
  )
}
