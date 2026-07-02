import ProductCard from './ProductCard.jsx'

export default function ProductGrid({ products }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <h3 className="text-lg font-semibold text-primary">No products match this view</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">Adjust the search or filters to show static catalog items again.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
