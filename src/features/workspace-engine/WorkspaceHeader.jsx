import { ArrowLeft, Boxes } from 'lucide-react'
import ProductBadges from '../../components/products/ProductBadges.jsx'
import { navigateTo } from '../../utils/routes.js'

export default function WorkspaceHeader({ product, config, activeStep, readinessPercentage, statusLabel, totalSteps }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo(`/dashboard/products/${product.slug}`)}
              className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Product detail
            </button>
            <ProductBadges product={product} />
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-primary">{config.title}</h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{config.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">{config.workspacePattern === 'content-builder' ? 'Layout template' : 'Template'}</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">{config.workspacePattern === 'content-builder' ? 'Structured content' : 'Excel data'}</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">{config.outputLabel || 'DOCX output'}</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">{config.supportedOutput || 'DOCX'} only</span>
          </div>
          <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
            <p className="text-xs leading-5 text-blue-800">
              <span className="font-semibold">
                {config.workspacePattern === 'content-builder'
                  ? 'Generated automatically from your structured Excel content. '
                  : 'Use {{ColumnName}} placeholders in your Word template. '}
              </span>
              {config.placeholderHelp || 'Example: {{Name}} matches the Name column in Excel.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-3 xl:w-64">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
              <Boxes size={16} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary">{product.productCode || product.name}</p>
              <p className="text-xs font-medium text-slate-500">Step {activeStep + 1} of {totalSteps} · {statusLabel}</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-accentBlue transition-all"
              style={{ width: `${readinessPercentage}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-slate-500">{readinessPercentage}% ready</p>
        </div>
      </div>
    </section>
  )
}
