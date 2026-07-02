export default function StatCard({ label, value, detail, icon: Icon, tone = 'blue' }) {
  const toneClass = tone === 'teal' ? 'bg-teal-50 text-teal-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-accentBlue'

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-primary">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-md ${toneClass}`}>
          <Icon size={21} aria-hidden="true" />
        </span>
      </div>
      {detail && <p className="mt-4 text-sm leading-6 text-slate-500">{detail}</p>}
    </article>
  )
}
