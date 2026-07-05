import { ArrowLeft, Boxes } from 'lucide-react'
import ProductBadges from '../../components/products/ProductBadges.jsx'
import { navigateTo } from '../../utils/routes.js'

export default function WorkspaceHeader({ product, config, activeStep, readinessPercentage, statusLabel, totalSteps }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigateTo(`/dashboard/products/${product.slug}`)}
            className="focus-ring mb-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Product detail
          </button>
          <ProductBadges product={product} />
          <h2 className="mt-5 text-3xl font-semibold text-primary">{config.title}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">{config.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Template</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">Excel data</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">{config.outputLabel || 'DOCX output'}</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">{config.supportedOutput || 'DOCX'} only</span>
          </div>
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-semibold text-blue-800">Use {'{{ColumnName}}'} placeholders in your Word template.</p>
            <p className="mt-1 text-sm leading-6 text-blue-800">{config.placeholderHelp || 'Example: {{Name}} matches the Name column in Excel.'}</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 xl:min-w-72">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
              <Boxes size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">{product.productCode || product.name}</p>
              <p className="text-xs font-medium text-slate-500">Workspace Engine v0.7</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-accentBlue transition-all"
              style={{ width: `${readinessPercentage}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Step {activeStep + 1} of {totalSteps} / {statusLabel}
          </p>
        </div>
      </div>
    </section>
  )
}
