import { useMemo, useState } from 'react'
import DataStateBanner from '../components/dashboard/DataStateBanner.jsx'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import ProductFilters from '../components/products/ProductFilters.jsx'
import ProductGrid from '../components/products/ProductGrid.jsx'
import { useProductCatalog } from '../hooks/useProductCatalog.js'
import { filterProducts } from '../utils/productFilters.js'

export default function ProductsPage() {
  const { organization, categories, products, source, status, loading, error } = useProductCatalog()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('All')
  const filteredProducts = useMemo(
    () => filterProducts(products, searchTerm, statusFilter, categoryFilter, availabilityFilter),
    [products, searchTerm, statusFilter, categoryFilter, availabilityFilter],
  )

  return (
    <DashboardLayout title="Products" eyebrow={source === 'supabase' ? 'Live catalog' : 'Sample catalog'} currentView="products" workspaceStatus={status}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EnvironmentBanner />
        <DataStateBanner loading={loading} error={error} source={source} status={status} organization={organization} />
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
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">{filteredProducts.length} of {products.length} products shown</p>
          <p className="text-sm text-slate-500">Data source: {source === 'supabase' ? 'live workspace' : 'sample catalog'}</p>
        </div>
        <div className="mt-5">
          <ProductGrid products={filteredProducts} />
        </div>
      </div>
    </DashboardLayout>
  )
}
