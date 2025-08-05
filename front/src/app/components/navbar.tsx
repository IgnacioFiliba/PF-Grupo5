export default function Navbar() {
  return (
    <nav className="bg-white shadow px-4 py-3 flex justify-between items-center">
      <div className="text-2xl font-bold text-red-600">REDPARTS</div>
      <ul className="flex gap-6 text-sm">
        <li><a href="#" className="hover:text-red-600">Menu</a></li>
        <li><a href="#" className="hover:text-red-600">Home</a></li>
        <li><a href="#" className="hover:text-red-600">Shop</a></li>
        <li><a href="#" className="hover:text-red-600">Blog</a></li>
        <li><a href="#" className="hover:text-red-600">Account</a></li>
        <li><a href="#" className="hover:text-red-600">Pages</a></li>
      </ul>
      <div className="flex">
        <input
          type="text"
          placeholder="Enter Keyword or Part Number"
          className="border rounded-l px-2 py-1 text-sm"
        />
        <button className="bg-red-600 text-white px-3 rounded-r">Search</button>
      </div>
    </nav>
  );
}
