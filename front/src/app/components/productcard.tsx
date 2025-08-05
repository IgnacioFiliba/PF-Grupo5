// components/ProductCard.tsx

type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  reviews?: number;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border rounded p-4 hover:shadow transition">
      <img src={product.image} alt={product.name} className="h-40 w-full object-contain mb-2" />
      <h3 className="font-semibold text-sm">{product.name}</h3>
      <p className="text-red-600 font-bold text-lg">${product.price}</p>
      <p className="text-xs text-gray-500">{product.reviews || 1} Review</p>
      <button className="mt-2 bg-red-600 text-white w-full py-1 rounded text-sm">Add to Cart</button>
    </div>
  );
}
