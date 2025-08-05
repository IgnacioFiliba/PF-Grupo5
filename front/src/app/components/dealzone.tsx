export default function DealZone() {
  return (
    <section className="bg-yellow-100 py-8 px-4 mt-10 rounded text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-2">Attention! Deal Zone</h2>
      <p className="text-lg font-medium">Hurry up! Discounts up to <span className="font-bold text-red-700">70%</span></p>
      <button className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition">
        Shop Now
      </button>
    </section>
  );
}
