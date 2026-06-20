import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartService } from "../services/cartService";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    setCartItems(cartService.getCartItems());

    const handleCartUpdated = () => {
      setCartItems(cartService.getCartItems());
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("storage", handleCartUpdated);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("storage", handleCartUpdated);
    };
  }, []);

  const handleQtyChange = (cartItemId, delta) => {
    const item = cartItems.find((entry) => entry.cartItemId === cartItemId);
    if (!item) return;
    const newQty = Math.max(1, (Number(item.qty) || 1) + delta);
    const updatedItems = cartService.updateCartItemQty(cartItemId, newQty);
    setCartItems(updatedItems);
  };

  const handleRemoveItem = (cartItemId) => {
    const updatedItems = cartService.removeFromCart(cartItemId);
    setCartItems(updatedItems);
  };

  const totalQuantity = cartItems.reduce(
    (sum, item) => sum + (Number(item.qty) || 1),
    0,
  );
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.selling_price) || 0) * (Number(item.qty) || 1),
    0,
  );

  if (cartItems.length === 0) {
    return (
      <div className="bg-[#f1f3f6] min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">
          Add items to your cart to see them here.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#2874f0] text-white px-6 py-3 rounded font-semibold"
        >
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#f1f3f6] min-h-screen pb-24">
      <div className="container mx-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
            <p className="text-sm text-gray-600">
              {totalQuantity} item{totalQuantity > 1 ? "s" : ""} in your cart
            </p>
          </div>
          <Link
            to="/"
            className="text-[#2874f0] text-sm font-semibold"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.cartItemId}
              className="flex flex-col gap-4 rounded-lg border bg-white p-4 md:flex-row md:items-center"
            >
              <img
                src={item.img1 || "https://via.placeholder.com/120"}
                alt={item.name}
                className="h-24 w-24 rounded object-contain"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {item.color ? item.color : ""}
                  {item.size ? ` • ${item.size}` : ""}
                  {item.storage ? ` • ${item.storage}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                  <span className="font-semibold">₹{item.selling_price}</span>
                  <span className="line-through text-gray-400">₹{item.mrp}</span>
                  <span className="text-green-600">Qty: {item.qty || 1}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 items-start md:items-end">
                <div className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    className="h-8 w-8 rounded bg-white text-gray-700 shadow-sm"
                    onClick={() => handleQtyChange(item.cartItemId, -1)}
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm">{item.qty || 1}</span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded bg-white text-gray-700 shadow-sm"
                    onClick={() => handleQtyChange(item.cartItemId, 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.cartItemId)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="text-2xl font-bold text-gray-900">₹{subtotal.toFixed(2)}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/address")}
              className="w-full rounded bg-[#2874f0] px-5 py-3 text-white shadow-sm hover:bg-blue-600 md:w-auto"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
