const statusStyles = {
  'Demo Ready': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Ready to use': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Safe Demo': 'border-teal-200 bg-teal-50 text-teal-700',
  'Mail preparation': 'border-teal-200 bg-teal-50 text-teal-700',
  'Launch Prep': 'border-blue-200 bg-blue-50 text-blue-700',
  'Workspace setup': 'border-blue-200 bg-blue-50 text-blue-700',
  'Product workspace': 'border-blue-200 bg-blue-50 text-blue-700',
  'Product Prep': 'border-amber-200 bg-amber-50 text-amber-700',
  'Request setup': 'border-amber-200 bg-amber-50 text-amber-700',
  Ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'In progress': 'border-sky-200 bg-sky-50 text-sky-700',
  Planned: 'border-amber-200 bg-amber-50 text-amber-700',
  Concept: 'border-slate-200 bg-slate-100 text-slate-700',
}

export default function StatusBadge({ status }) {
  const displayStatus =
    status === 'Demo Ready' ? 'Ready to use'
      : status === 'Safe Demo' ? 'Mail preparation'
        : status === 'Launch Prep' ? 'Workspace setup'
          : status === 'Product Prep' || status === 'Planned' || status === 'Concept' ? 'Request setup'
            : status

  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyles[displayStatus] || statusStyles.Concept}`}>
      {displayStatus}
    </span>
  )
}
