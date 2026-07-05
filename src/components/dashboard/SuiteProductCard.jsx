import { ArrowRight } from 'lucide-react'
import { navigateTo } from '../../utils/routes.js'

const badgeStyles = {
  live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  demo_ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ready_to_use: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  safe_demo: 'border-teal-200 bg-teal-50 text-teal-700',
  mail_preparation: 'border-teal-200 bg-teal-50 text-teal-700',
  launch_prep: 'border-blue-200 bg-blue-50 text-blue-700',
  workspace_setup: 'border-blue-200 bg-blue-50 text-blue-700',
  product_workspace: 'border-blue-200 bg-blue-50 text-blue-700',
  product_prep: 'border-amber-200 bg-amber-50 text-amber-700',
  request_setup: 'border-amber-200 bg-amber-50 text-amber-700',
  'desktop-ready': 'border-sky-200 bg-sky-50 text-sky-700',
  coming_soon: 'border-amber-200 bg-amber-50 text-amber-700',
  planned: 'border-amber-200 bg-amber-50 text-amber-700',
  inactive: 'border-slate-200 bg-slate-100 text-slate-500',
}

export default function SuiteProductCard({ card }) {
  const {
    label,
    productCode,
    summary,
    suiteLabel,
    status,
    badge,
    active,
    href,
    buttonLabel,
  } = card

  const displayBadge = badge || status || 'Coming soon'
  const badgeKey = badge?.toLowerCase().replace(/\s+/g, '_') || status?.toLowerCase().replace(/\s+/g, '_') || 'inactive'
  const badgeClass = badgeStyles[badgeKey] || badgeStyles.inactive

  return (
    <article className="group flex min-h-[178px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{suiteLabel}</p>
          <h3 className="mt-2 text-base font-semibold text-primary">{label}</h3>
          {productCode ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{productCode}</p> : null}
        </div>
        <span className={`inline-flex shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${badgeClass}`}>
          {displayBadge}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-5 text-slate-600">{summary}</p>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => {
            if (active && href) {
              navigateTo(href)
            }
          }}
          disabled={!active}
          className={`focus-ring inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold transition ${
            active
              ? 'bg-accentTeal text-white shadow-sm hover:bg-teal-800'
              : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
          }`}
        >
          {buttonLabel || (active ? 'Open Workspace' : 'Request Setup')}
          {active ? <ArrowRight size={16} aria-hidden="true" /> : null}
        </button>
      </div>
    </article>
  )
}
