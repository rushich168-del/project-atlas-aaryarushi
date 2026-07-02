import StatusBadge from '../dashboard/StatusBadge.jsx'

function AvailabilityBadge({ active, label }) {
  const classes = active
    ? 'border-blue-200 bg-blue-50 text-accentBlue'
    : 'border-slate-200 bg-slate-50 text-slate-400'

  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}

export default function ProductBadges({ product }) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status={product.status} />
      <AvailabilityBadge active={product.desktopAvailable} label="Desktop" />
      <AvailabilityBadge active={product.saasAvailable} label="SaaS" />
      {product.isBeta && <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Beta</span>}
    </div>
  )
}
