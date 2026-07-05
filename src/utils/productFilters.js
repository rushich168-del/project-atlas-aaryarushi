export function filterProducts(products, searchTerm, statusFilter, categoryFilter, availabilityFilter = 'All') {
  const search = searchTerm.trim().toLowerCase()

  return products.filter((product) => {
    const displayStatus =
      product.slug === 'ar-cert-pro' || product.status === 'Demo Ready' || product.status === 'Ready'
        ? 'Ready to use'
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
