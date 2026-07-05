import { ArrowUpRight, Boxes } from 'lucide-react'
import { navigateTo } from '../../utils/routes.js'

function getSuiteLabel(product) {
  if (product.categoryId === 'education' || product.sector === 'education') return 'Education Suite'
  if (product.categoryId === 'hr' || product.sector === 'hr') return 'HR / Admin Suite'
  if (product.categoryId === 'office-business' || product.sector === 'office-business') return 'Office / Business Suite'
  if (product.categoryId === 'communication' || product.sector === 'communication') return 'HR / Admin Suite'
  return 'Product Suite'
}

export default function ProductCard({ product }) {
  const isActive = product.slug === 'ar-cert-pro'
  const isSharedDocxWorkspace = [
    'ar-marksheet-pro',
    'ar-report-pro',
    'ar-worksheet-pro',
    'ar-question-pro',
    'ar-invoice-pro',
    'ar-fee-receipt-pro',
  ].includes(product.slug)
  const isSafeDemo = product.status === 'Safe Demo'
  const isLaunchPrep = product.status === 'Launch Prep'
  const isProductPrep = product.status === 'Product Prep'
  const canOpen = product.isEnabled !== false
  const buttonLabel = isActive
    ? 'Open Workspace'
    : isSharedDocxWorkspace
      ? 'Open Workspace'
      : isSafeDemo
      ? 'Mail Prep'
      : isLaunchPrep || isProductPrep || product.status === 'Planned' || product.status === 'Concept'
        ? 'Setup Workspace'
        : 'Use Product'
  const suiteLabel = getSuiteLabel(product)
  const statusLabel = isActive
    ? 'Ready to use'
    : isSharedDocxWorkspace
      ? 'Product workspace'
      : isSafeDemo
      ? 'Mail preparation'
      : isLaunchPrep
        ? 'Workspace setup'
        : isProductPrep || product.status === 'Planned' || product.status === 'Concept'
          ? 'Request setup'
          : product.desktopAvailable
            ? 'Product workspace'
            : 'Workspace setup'
  const statusClass = isActive
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : isSharedDocxWorkspace
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : isSafeDemo
      ? 'border-teal-200 bg-teal-50 text-teal-700'
      : isLaunchPrep
      ? 'border-blue-200 bg-blue-50 text-blue-700'
    : isProductPrep
      ? 'border-amber-200 bg-amber-50 text-amber-700'
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
          } else if (canOpen) {
            navigateTo(`/dashboard/products/${product.slug}/workspace`)
          }
        }}
        disabled={!canOpen}
        className={`focus-ring mt-4 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md px-2.5 text-sm font-semibold transition ${
          canOpen
            ? 'bg-accentTeal text-white hover:bg-teal-800'
            : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
        }`}
      >
        {buttonLabel}
        {canOpen ? <ArrowUpRight size={16} aria-hidden="true" /> : null}
      </button>
    </article>
  )
}
