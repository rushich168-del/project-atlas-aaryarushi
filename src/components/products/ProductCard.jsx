import { ArrowUpRight, Boxes, CheckCircle2 } from 'lucide-react'
import { navigateTo } from '../../utils/routes.js'
import ProductBadges from './ProductBadges.jsx'

function getSuiteLabel(product) {
  if (product.categoryId === 'education') return 'Education Suite'
  if (product.categoryId === 'hr') return 'HR Suite'
  if (product.categoryId === 'office-business') return 'Office / Business Suite'
  return 'Product Suite'
}

export default function ProductCard({ product }) {
  const isActive = product.slug === 'ar-cert-pro'
  const buttonLabel = isActive ? 'Open workspace' : 'Coming soon'
  const suiteLabel = getSuiteLabel(product)

  return (
    <article className="flex min-h-[280px] flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
          <Boxes size={20} aria-hidden="true" />
        </div>
        {isActive ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
            Live
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex-1">
        <div className="inline-flex rounded-full border border-slate-200 bg-lightBg px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {suiteLabel}
        </div>
        <h3 className="mt-4 text-lg font-semibold text-primary">{product.name}</h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{product.productCode || product.name}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{product.summary}</p>
      </div>

      <div className="mt-5 grid gap-2">
        {product.metrics.map((metric) => (
          <div key={metric} className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <CheckCircle2 size={15} className="text-accentTeal" aria-hidden="true" />
            {metric}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          if (isActive) {
            navigateTo(`/dashboard/products/${product.slug}/workspace`)
          }
        }}
        disabled={!isActive}
        className={`focus-ring mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
          isActive
            ? 'bg-primary text-white hover:bg-slate-800'
            : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
        }`}
      >
        {buttonLabel}
        {isActive ? <ArrowUpRight size={16} aria-hidden="true" /> : null}
      </button>
    </article>
  )
}
