export default function SearchFilters() {
  return (
    <section className="bg-gray-100 p-4 rounded mt-4 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col">
        <label className="text-sm font-medium">Year</label>
        <select className="border px-2 py-1 rounded text-sm">
          <option>Select Year</option>
          <option>2023</option>
          <option>2022</option>
          <option>2021</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Brand</label>
        <select className="border px-2 py-1 rounded text-sm">
          <option>Select Brand</option>
          <option>Toyota</option>
          <option>Ford</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Model</label>
        <select className="border px-2 py-1 rounded text-sm">
          <option>Select Model</option>
          <option>Corolla</option>
          <option>F-150</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Engine</label>
        <select className="border px-2 py-1 rounded text-sm">
          <option>Select Engine</option>
          <option>1.6L</option>
          <option>2.0L</option>
        </select>
      </div>
      <button className="bg-red-600 text-white px-4 py-2 rounded">Search</button>
    </section>
  );
}
