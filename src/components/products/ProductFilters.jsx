import { Search, SlidersHorizontal } from 'lucide-react'
import { availabilityFilters, productStatuses } from '../../data/products.js'

export default function ProductFilters({
  categories = [],
  searchTerm,
  statusFilter,
  categoryFilter,
  availabilityFilter,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onAvailabilityChange,
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_220px]">
        <label className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-lightBg px-3">
          <Search size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search products, outputs, audience"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-slate-400"
          />
        </label>

        <label className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-lightBg px-3">
          <SlidersHorizontal size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-primary outline-none"
          >
            {productStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="flex min-h-11 items-center rounded-md border border-slate-200 bg-lightBg px-3">
          <select
            value={availabilityFilter}
            onChange={(event) => onAvailabilityChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-primary outline-none"
          >
            {availabilityFilters.map((availability) => (
              <option key={availability} value={availability}>{availability}</option>
            ))}
          </select>
        </label>

        <label className="flex min-h-11 items-center rounded-md border border-slate-200 bg-lightBg px-3">
          <select
            value={categoryFilter}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-primary outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
