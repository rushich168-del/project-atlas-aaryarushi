const statusStyles = {
  Ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'In progress': 'border-sky-200 bg-sky-50 text-sky-700',
  Planned: 'border-amber-200 bg-amber-50 text-amber-700',
  Concept: 'border-slate-200 bg-slate-100 text-slate-700',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Concept}`}>
      {status}
    </span>
  )
}
