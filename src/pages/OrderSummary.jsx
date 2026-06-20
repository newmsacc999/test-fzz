import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { cartService } from "../services/cartService";
import { startCheckout } from "../services/paymentService";

const OrderSummary = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [address, setAddress] = useState(null);
  const [donationAmount, setDonationAmount] = useState(0);
  const [processing, setProcessing] = useState(false);

  // ---------- DISABLE ZOOM & PINCH (viewport + JavaScript) ----------
  useEffect(() => {
    // --- Viewport meta (fallback) ---
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    let originalContent = "";

    if (viewportMeta) {
      originalContent = viewportMeta.getAttribute("content") || "";
      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      );
    } else {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content =
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
      document.head.appendChild(meta);
    }

    // --- JavaScript prevention for iOS ---
    const preventPinch = (e) => {
      // Prevent only multi‑touch gestures (allow single‑finger scroll)
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventGesture = (e) => {
      e.preventDefault();
    };

    document.addEventListener("touchmove", preventPinch, { passive: false });
    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("gestureend", preventGesture);

    return () => {
      // Restore viewport
      if (viewportMeta) {
        viewportMeta.setAttribute("content", originalContent);
      } else {
        const createdMeta = document.querySelector('meta[name="viewport"]');
        if (createdMeta) createdMeta.remove();
      }

      // Remove listeners
      document.removeEventListener("touchmove", preventPinch);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
    };
  }, []);
  // ------------------------------------------------------------------

  useEffect(() => {
    localStorage.removeItem("selected_verient");
    setCartItems(cartService.getCartItems());
    const savedAddress = localStorage.getItem("address");
    if (savedAddress) {
      setAddress(JSON.parse(savedAddress));
    }

    const handleCartUpdated = () => {
      setCartItems(cartService.getCartItems());
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, []);

  const handleChangeAddress = () => {
    navigate("/address");
  };

  const handleQtyChange = (cartItemId, delta) => {
    const currentItem = cartItems.find((item) => item.cartItemId === cartItemId);
    if (!currentItem) return;
    const newQty = Math.max(1, (Number(currentItem.qty) || 1) + delta);
    const updatedItems = cartService.updateCartItemQty(cartItemId, newQty);
    setCartItems(updatedItems);
  };

  const handleRemoveItem = (cartItemId) => {
    const updatedItems = cartService.removeFromCart(cartItemId);
    setCartItems(updatedItems);
  };

  const handleContinue = async () => {
    if (cartItems.length === 0) {
      navigate("/");
      return;
    }
    if (processing) return;

    localStorage.setItem("checkout_cart", JSON.stringify(cartItems));

    const amount = cartItems.reduce(
      (sum, item) =>
        sum + (Number(item.selling_price) || 0) * (Number(item.qty) || 1),
      0
    ) + donationAmount;

    setProcessing(true);
    try {
      await startCheckout({
        amount,
        customer: { name: address?.name, phone: address?.number },
      });
      navigate("/thank-you");
    } catch (err) {
      toast.error(err.message || "Payment could not be completed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleVipClick = () => {
    toast("VIP membership isn't part of this demo.", { icon: "ℹ️" });
  };

  const getVariantDetailString = () => {
    const item = cartItems[0];
    if (!item) return "";
    let parts = [];
    if (item.color) parts.push(item.color);
    if (item.size) parts.push(`(${item.size})`);
    if (item.storage) parts.push(`(${item.storage})`);
    return parts.join(" ");
  };

  if (!address) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="bg-[#f1f3f6] min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">
          Add items to your cart to continue to checkout.
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

  const totalQuantity = cartItems.reduce(
    (sum, item) => sum + (Number(item.qty) || 1),
    0,
  );
  const totalMRP = cartItems.reduce(
    (sum, item) => sum + (Number(item.mrp) || 0) * (Number(item.qty) || 1),
    0,
  );
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.selling_price) || 0) * (Number(item.qty) || 1),
    0,
  );
  const discountAmount = totalMRP - subtotal;
  const totalAmount = subtotal + donationAmount;
  const firstProduct = cartItems[0] || null;
  const discountPercent = totalMRP ? Math.round((discountAmount / totalMRP) * 100) : 0;

  return (
    <div className="bg-[#f1f3f6] min-h-screen pb-24">
      {/* Header */}
      <div className="container mx-auto min-w-full p-3 pb-0 bg-white sticky top-0 z-50">
        <div className="flex items-center pb-2">
          <div className="w-[10%]" onClick={() => navigate(-1)}>
            <div className="">
              <img
                src="/assets/images/theme/back_dark.svg"
                alt="Back"
                className="w-5 h-5"
              />
            </div>
          </div>
          <div className="w-[80%]">
            <h4 className="mb-0 text-lg text-gray-700">Order Summary</h4>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white pt-1">
        <div className="w-full flex justify-center">
          <img
            className="w-full px-4"
            src="/assets/images/theme/progress-indicator-summary.png"
            alt="Progress"
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-white px-4 py-4 lg:-mt-43 top-0 z-50 relative">
        <div className="flex justify-between items-center w-full mb-2">
          <h3 className="text-[#111112] font-bold text-[18px]">Deliver to:</h3>
          <button
            className="text-[#2a55e5] text-[13px] border border-[#dbdbdb] px-2 py-1 rounded font-semibold"
            onClick={handleChangeAddress}
          >
            Change
          </button>
        </div>
        <div>
          <div className="flex gap-2 items-center mb-1">
            <h4 className="font-semibold text-[18px]">{address.name}</h4>
            <span className="bg-[#f0f2f5] text-[12px] text-[#717478] px-2 py-0.5 rounded font-medium">
              Home
            </span>
          </div>
          <div className="text-[14px] text-[#212121] mb-2 font-semibold leading-tight">
            {[
              address.flat,
              address.area,
              address.city,
              address.state,
              address.pin,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
          <div className="text-[14px] text-[#212121] mt-2">
            {address.number}
          </div>
        </div>
      </div>

      {/* Product Section */}
      <div className="bg-white px-3 py-2 mb-2">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-[18px] font-bold">Your Cart</p>
            <p className="text-[13px] text-gray-500">{totalQuantity} item{totalQuantity > 1 ? "s" : ""}</p>
          </div>
          <p className="text-[14px] font-semibold">Subtotal ₹{subtotal.toFixed(2)}</p>
        </div>

        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.cartItemId} className="flex gap-3 border rounded p-3">
              <img
                src={item.img1 || "https://via.placeholder.com/80"}
                alt={item.name}
                className="w-20 h-20 object-contain"
              />
              <div className="flex-1">
                <div className="font-semibold text-[15px] mb-1">{item.name}</div>
                <div className="text-[13px] text-gray-600 mb-2">
                  {item.color ? `${item.color} ` : ""}
                  {item.size ? `| ${item.size} ` : ""}
                  {item.storage ? `| ${item.storage}` : ""}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[15px] font-bold">₹{item.selling_price}</span>
                  <span className="line-through text-gray-400 text-[13px]">₹{item.mrp}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <div className="flex items-center rounded border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.cartItemId, -1)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="px-4 py-1">{item.qty || 1}</span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.cartItemId, 1)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.cartItemId)}
                    className="text-[#E53935] text-[13px] font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="px-3 flex gap-3 bg-[#f0f2f5] items-center">
        <img
          src="/assets/images/cart.webp"
          className="w-[9%] h-[4%] py-2 object-contain"
          alt="cart"
        />
        <div className="py-2 text-[13px] text-gray-700">
          Cancellation is allowed up to 48 hours after placing the order.
        </div>
      </div>

      {/* Invoice Section */}
      <div className="px-4 py-3 mb-2 bg-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img
            src="/assets/images/invoice.webp"
            className="w-5 h-5 object-contain"
            alt="invoice"
          />
          <div className="text-[15px]">Invoice</div>
        </div>
        <div className="text-[#2874f0] text-[15px]">Add Email</div>
      </div>

      {/* VIP & Donation */}
      <div>
        {/* VIP Card */}
        <div className="flex p-2 bg-[#f0f2f5] gap-2">
          <div className="w-[20%]">
            <img
              src="/assets/images/vip-card.png"
              className="w-full h-auto"
              alt="VIP"
            />
          </div>
          <div className="w-[78%]">
            <p className="font-bold text-[15px] pt-1 mb-0 leading-tight">
              Get Benefit Worth of ₹10000 Per Year
            </p>
            <p className="text-[12px] pt-1 mb-0 leading-tight">
              For Exclusive Discount up to 80% on All product up to 12 Months.
              Limited Time Offer | Become VIP Member
            </p>
            <div className="flex gap-3 pt-2 items-center">
              <p className="text-[15px] font-bold">₹199 For 12 Months</p>
              <button
                className="px-2 rounded text-[13px] h-[29px] cursor-pointer bg-[#FBBC05] border-none"
                onClick={handleVipClick}
              >
                Get VIP Member
              </button>
            </div>
          </div>
        </div>

        {/* Donation Card */}
        <div className="w-full bg-white text-left box-border mt-2 p-2">
          <div className="flex items-center mb-3 pt-2">
            <div className="w-[74%] pl-2">
              <h2 className="text-[14px] m-0 text-[#333] font-semibold">
                Direct UPI Payment
              </h2>
              <p className="text-[13px] text-[#666] m-1 mt-1">
                Support transformative social work in India
              </p>
            </div>
            <img
              src="/assets/images/Image (1).png"
              className="w-[20%] ml-4"
              alt="Donation"
            />
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between my-3 mx-3">
            {[10, 20, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() =>
                  setDonationAmount((prev) => (prev === amt ? 0 : amt))
                }
                className={`w-[22%] py-1.5 text-[16px] border border-[#ddd] rounded-[20px] transition-all cursor-pointer duration-300 hover:bg-gray-100 hover:scale-105 ${
                  donationAmount === amt
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-[#333]"
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
          <hr className="border-gray-200" />
          <p className="text-[13px] text-[#888] p-2 font-semibold">
            Note: GST and No cost EMI will not be applicable
          </p>
        </div>

        {/* Bank Offer Banner */}
        <div className="px-3 py-2 flex gap-3 bg-[#e7f8ec] mt-[-11px] mb-2">
          <img
            src="/assets/images/card.webp"
            className="w-[9%] h-[4%] object-contain"
            alt="Card"
          />
          <div className="text-[14px] mt-1 text-gray-700">
            Continue to the next page for Bank Offers.
          </div>
        </div>
      </div>

      {/* Price Details */}
      <div className="bg-white px-3 py-4 mb-2">
        <h3 className="text-[18px] mb-2">Price Details</h3>
        <div className="mt-2 text-[14px]">
          <div className="flex justify-between my-3">
            <span>Price ({totalQuantity} item{totalQuantity > 1 ? "s" : ""})</span>
            <span>₹{totalMRP.toFixed(2)}</span>
          </div>
          <div className="flex justify-between my-3">
            <span>Discount</span>
            <span className="text-green-600">-₹{discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between my-3">
            <span>Delivery Charges</span>
            <span className="text-green-600">FREE Delivery</span>
          </div>
          <div className="flex justify-between my-3 pt-3 border-t border-dashed border-gray-300 text-[14px]">
            <span>Total Amount</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="mt-3 pt-3 border-t font-extralight border-gray-100 text-green-600">
            You will save <span className="">-₹{discountAmount.toFixed(2)}</span> on this
            order
          </div>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="flex justify-center items-center mb-0 md:mb-20 p-4">
        <div className="flex justify-evenly items-center ">
          <img
            className="w-[30px] block"
            src="https://rukminim1.flixcart.com/www/60/70/promos/13/02/2019/9b179a8a-a0e2-497b-bd44-20aa733dc0ec.png?q=90"
            alt="Safety"
          />
          <div className="text-center w-50 font-bold text-[#878787] text-[12px] ">
            Safe and secure payments. Easy returns. 100% Authentic products.
          </div>
        </div>
      </div>

      {/* Desktop Footer */}
      <div className="w-full bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-3 hidden sm:flex justify-start items-center mx-auto">
        <div className="w-[50%] flex flex-col gap-2.5">
          <span className="line-through text-[#878787] text-[12px] block">
            ₹{totalMRP.toFixed(2)}
          </span>
          <span className="text-[15px] block leading-none">
            ₹{totalAmount.toFixed(2)}
          </span>
        </div>
        <button
          className="w-[12%] bg-[#FFC107] text-black font-semibold py-3 border-none rounded-sm shadow-sm text-[14px] cursor-pointer disabled:opacity-60"
          onClick={handleContinue}
          disabled={processing}
        >
          {processing ? "Processing..." : "Continue To Payment"}
        </button>
      </div>

      {/* Mobile Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] px-4 py-3 flex sm:hidden justify-between items-center z-50">
        <div className="flex flex-col">
          <span className="line-through text-[#878787] text-[14px]">
            ₹{totalMRP.toFixed(2)}
          </span>
          <span className="text-[20px] font-bold text-[#212121] leading-tight">
            ₹{totalAmount.toFixed(0)}
          </span>
        </div>
        <button
          className="bg-[#FBBC05] text-black font-bold py-3 px-6 rounded-md shadow-sm text-[16px] cursor-pointer disabled:opacity-60"
          onClick={handleContinue}
          disabled={processing}
        >
          {processing ? "Processing..." : "Continue To Payment"}
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
