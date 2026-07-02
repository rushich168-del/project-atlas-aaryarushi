import { useMemo, useState } from 'react'
import { Activity, Boxes, CheckCircle2, Clock3, Layers3 } from 'lucide-react'
import CategorySection from '../components/dashboard/CategorySection.jsx'
import DataStateBanner from '../components/dashboard/DataStateBanner.jsx'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import ProductFilters from '../components/products/ProductFilters.jsx'
import ProductGrid from '../components/products/ProductGrid.jsx'
import { useProductCatalog } from '../hooks/useProductCatalog.js'
import { filterProducts } from '../utils/productFilters.js'

export default function DashboardPage() {
  const { organization, categories, products, source, status, loading, error } = useProductCatalog()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('All')
  const filteredProducts = useMemo(
    () => filterProducts(products, searchTerm, statusFilter, categoryFilter, availabilityFilter),
    [products, searchTerm, statusFilter, categoryFilter, availabilityFilter],
  )
  const stats = useMemo(
    () => [
      { label: 'Total products', value: products.length, detail: 'Across education, HR, and office automation.', icon: Boxes },
      { label: 'Ready to demo', value: products.filter((product) => product.status === 'Ready').length, detail: 'Products marked ready for client conversations.', icon: CheckCircle2, tone: 'teal' },
      { label: 'In progress', value: products.filter((product) => product.status === 'In progress').length, detail: 'Products with defined direction but active polish pending.', icon: Clock3, tone: 'amber' },
      { label: 'Categories', value: categories.length, detail: 'Primary business segments for catalog planning.', icon: Activity },
    ],
    [categories.length, products],
  )

  return (
    <DashboardLayout title="Product Dashboard" eyebrow="Project Atlas MVP" currentView="dashboard" workspaceStatus={status}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EnvironmentBanner />
        <DataStateBanner loading={loading} error={error} source={source} status={status} organization={organization} />
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
            <div>
              <p className="text-sm font-semibold text-accentTeal">{source === 'supabase' ? 'Live catalog workspace' : 'Sample catalog workspace'}</p>
              <h2 className="mt-2 text-3xl font-semibold text-primary">Automation products organized for early sales and delivery planning.</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                Track education, HR, and office/business products from one clean dashboard while AR-CERT-PRO demonstrates the first single-DOCX generation workflow.
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-lightBg p-4">
              <Layers3 className="text-accentBlue" size={22} aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-slate-500">MVP focus</p>
              <p className="mt-1 text-lg font-semibold text-primary">Catalog, protected workspace, single DOCX generation, and History.</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <div className="mt-6">
          <ProductFilters
            categories={categories}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            availabilityFilter={availabilityFilter}
            onSearchChange={setSearchTerm}
            onStatusChange={setStatusFilter}
            onCategoryChange={setCategoryFilter}
            onAvailabilityChange={setAvailabilityFilter}
          />
        </div>

        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-primary">Filtered products</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Search and filter against the current catalog source.</p>
            </div>
            <span className="text-sm font-semibold text-slate-500">{filteredProducts.length} shown</span>
          </div>
          <ProductGrid products={filteredProducts} />
        </section>

        <div className="mt-8 grid gap-10">
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              products={products.filter((product) => product.categoryId === category.id)}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
