import ProductCard from './ProductCard';

const sampleProducts = [
  {
    id: 1,
    name: 'STP Generator Platinum',
    price: 379.00,
    image: 'https://via.placeholder.com/150?text=Generator',
  },
  {
    id: 2,
    name: 'Brake Kit',
    price: 569.00,
    image: 'https://via.placeholder.com/150?text=Brake+Kit',
  },
  {
    id: 3,
    name: 'Specter Brake Kit',
    price: 799.00,
    image: 'https://via.placeholder.com/150?text=Specter+Kit',
  },
  {
    id: 4,
    name: 'Sunset Brake Kit',
    price: 1259.00,
    image: 'https://via.placeholder.com/150?text=Sunset+Kit',
  },
];

export default function ProductList() {
  return (
    <section className="py-8">
      <h2 className="text-xl font-bold mb-4">Featured Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {sampleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
