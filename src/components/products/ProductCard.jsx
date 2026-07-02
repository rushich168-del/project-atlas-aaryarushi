import { ArrowUpRight, Boxes, CheckCircle2 } from 'lucide-react'
import { navigateTo } from '../../utils/routes.js'
import ProductBadges from './ProductBadges.jsx'

export default function ProductCard({ product }) {
  return (
    <article className="flex min-h-[250px] flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
          <Boxes size={20} aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 flex-1">
        <ProductBadges product={product} />
        <h3 className="text-lg font-semibold text-primary">{product.name}</h3>
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
        onClick={() => navigateTo(`/dashboard/products/${product.slug}`)}
        className="focus-ring mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-primary transition hover:border-primary hover:bg-slate-50"
      >
        View detail
        <ArrowUpRight size={16} aria-hidden="true" />
      </button>
    </article>
  )
}
