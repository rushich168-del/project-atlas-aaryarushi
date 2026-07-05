// Products wired into the shared DOCX workspace engine. These open a live
// "Product workspace" (matching ProductCard), so the status filter must bucket
// them there rather than under a stale "Workspace setup" / "Request setup".
const sharedDocxWorkspaceSlugs = new Set([
  'ar-marksheet-pro',
  'ar-report-pro',
  'ar-worksheet-pro',
  'ar-question-pro',
  'ar-idcard-pro',
  'ar-invoice-pro',
  'ar-fee-receipt-pro',
])

export function filterProducts(products, searchTerm, statusFilter, categoryFilter, availabilityFilter = 'All') {
  const search = searchTerm.trim().toLowerCase()

  return products.filter((product) => {
    const displayStatus =
      product.slug === 'ar-cert-pro' || product.status === 'Demo Ready' || product.status === 'Ready'
        ? 'Ready to use'
        : sharedDocxWorkspaceSlugs.has(product.slug)
          ? 'Product workspace'
        : product.status === 'Safe Demo'
          ? 'Mail preparation'
          : product.status === 'Launch Prep'
            ? 'Workspace setup'
            : product.status === 'Product Prep' || product.status === 'Planned' || product.status === 'Concept'
              ? 'Request setup'
              : product.desktopAvailable
                ? 'Product workspace'
                : product.status
    const matchesStatus = statusFilter === 'All' || displayStatus === statusFilter
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter
    const matchesAvailability =
      availabilityFilter === 'All' ||
      (availabilityFilter === 'Desktop' && product.desktopAvailable) ||
      (availabilityFilter === 'SaaS' && product.saasAvailable) ||
      (availabilityFilter === 'Beta' && product.isBeta)
    const searchable = [
      product.name,
      product.summary,
      product.audience,
      product.status,
      product.productCode || '',
      product.sector || '',
      ...product.metrics,
      ...product.inputs,
      ...product.outputs,
    ].join(' ').toLowerCase()

    return matchesStatus && matchesCategory && matchesAvailability && (!search || searchable.includes(search))
  })
}
