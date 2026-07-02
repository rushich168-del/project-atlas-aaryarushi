import ProductCard from '../products/ProductCard.jsx'

export default function CategorySection({ category, products }) {
  return (
    <section id={category.id} className="scroll-mt-24">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">{category.name}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{category.description}</p>
        </div>
        <span className="text-sm font-semibold text-slate-500">{products.length} products</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
