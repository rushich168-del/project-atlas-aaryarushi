import { ArrowUpRight, Boxes } from 'lucide-react'
import { navigateTo } from '../../utils/routes.js'

function getSuiteLabel(product) {
  if (product.categoryId === 'education') return 'Education Suite'
  if (product.categoryId === 'hr') return 'HR Suite'
  if (product.categoryId === 'office-business') return 'Office / Business Suite'
  return 'Product Suite'
}

export default function ProductCard({ product }) {
  const isActive = product.slug === 'ar-cert-pro'
  const buttonLabel = isActive ? 'Start Demo' : 'Coming soon'
  const suiteLabel = getSuiteLabel(product)
  const statusLabel = isActive ? 'Demo Ready' : product.desktopAvailable ? 'Desktop Ready' : 'Coming Soon'
  const statusClass = isActive
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : product.desktopAvailable
      ? 'border-sky-200 bg-sky-50 text-sky-700'
      : 'border-amber-200 bg-amber-50 text-amber-700'

  return (
    <article className="flex min-h-[190px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-primary">
            <Boxes size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{suiteLabel}</p>
            <h3 className="mt-1 truncate text-base font-semibold text-primary">{product.name}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{product.productCode || product.name}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-5 text-slate-600">{product.summary}</p>

      <button
        type="button"
        onClick={() => {
          if (isActive) {
            navigateTo(`/dashboard/products/${product.slug}/workspace`)
          }
        }}
        disabled={!isActive}
        className={`focus-ring mt-4 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold transition ${
          isActive
            ? 'bg-accentTeal text-white hover:bg-teal-800'
            : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
        }`}
      >
        {buttonLabel}
        {isActive ? <ArrowUpRight size={16} aria-hidden="true" /> : null}
      </button>
    </article>
  )
}
