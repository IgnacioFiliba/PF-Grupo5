export default function TopBar() {
  return (
    <div className="bg-red-600 text-white text-sm py-2 px-4 flex justify-between items-center">
      <div className="flex gap-4">
        <span>Call Us: (860) 060-0730</span>
        <a href="#" className="hover:underline">About Us</a>
        <a href="#" className="hover:underline">Contacts</a>
        <a href="#" className="hover:underline">Track Order</a>
      </div>
      <div className="flex gap-4">
        <a href="#" className="hover:underline">Compare (0)</a>
        <a href="#" className="hover:underline">Currency: USD</a>
        <a href="/login" className="hover:underline">Hello, Log In</a>
        <a href="/cart" className="hover:underline">Cart: $0.00</a>
      </div>
    </div>
  );
}
