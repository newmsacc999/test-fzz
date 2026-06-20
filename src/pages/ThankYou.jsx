import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cartService } from "../services/cartService";
import {
  fetchCashfreeStatus,
  fetchRazorpayStatus,
} from "../services/paymentService";

const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Cashfree returns ?order_id=...; Razorpay returns ?razorpay_payment_link_id=...
  const orderId = searchParams.get("order_id");
  const razorpayLinkId = searchParams.get("razorpay_payment_link_id");

  // "success" | "pending" | "failed" | "checking"
  // A gateway return is verified server-side; a direct visit (no params) = success.
  const [state, setState] = useState(
    orderId || razorpayLinkId ? "checking" : "success"
  );

  useEffect(() => {
    // Verify the real status server-side before confirming the order. Cashfree
    // reports "PAID", Razorpay reports "paid" — compare case-insensitively.
    const verifier = orderId
      ? () => fetchCashfreeStatus(orderId)
      : razorpayLinkId
      ? () => fetchRazorpayStatus(razorpayLinkId)
      : null;

    if (verifier) {
      verifier()
        .then((data) => {
          const status = String(data.status || "").toUpperCase();
          if (status === "PAID") {
            cartService.clearCart();
            localStorage.removeItem("selected_verient");
            setState("success");
          } else if (
            status === "ACTIVE" ||
            status === "CREATED" ||
            status === "UNKNOWN"
          ) {
            setState("pending");
          } else {
            setState("failed");
          }
        })
        .catch(() => setState("failed"));
      return;
    }

    // Direct visit (no gateway params): treat as confirmed.
    cartService.clearCart();
    localStorage.removeItem("selected_verient");
  }, [orderId, razorpayLinkId]);

  if (state === "checking") {
    return (
      <div className="bg-[#f1f3f6] min-h-screen flex items-center justify-center font-sans">
        <div className="bg-white p-6 md:p-10 rounded shadow-sm max-w-lg w-full text-center">
          <h1 className="text-xl font-semibold text-gray-700">
            Confirming your payment…
          </h1>
          <p className="text-gray-500 mt-2">Please wait, do not close this page.</p>
        </div>
      </div>
    );
  }

  if (state === "pending" || state === "failed") {
    const failed = state === "failed";
    return (
      <div className="bg-[#f1f3f6] min-h-screen flex items-center justify-center font-sans">
        <div className="bg-white p-6 md:p-10 rounded shadow-sm max-w-lg w-full text-center">
          <h1
            className={`text-2xl font-bold mb-2 ${
              failed ? "text-red-600" : "text-yellow-600"
            }`}
          >
            {failed ? "Payment Failed" : "Payment Pending"}
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            {failed
              ? "Your payment could not be completed. You were not charged, or any amount will be refunded."
              : "We haven't received confirmation yet. If money was debited, it will reflect shortly."}
          </p>
          <button
            onClick={() => navigate("/cart")}
            className="bg-[#fb641b] text-white font-semibold py-3 px-10 rounded shadow-sm hover:bg-[#f4511e] uppercase tracking-wide text-sm"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f1f3f6] min-h-screen flex items-center justify-center font-sans">
      <div className="bg-white p-6 md:p-10 rounded shadow-sm max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <img
            src="https://img1a.flixcart.com/www/linchpin/fk-cp-zion/img/order-placed_e358c5.png"
            alt="Order Success"
            className="h-24 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            }}
          />
          <svg
            style={{ display: "none" }}
            className="w-20 h-20 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#2874f0] mb-2">
          Order Place Successfully
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          Thank you for your purchase!
        </p>

        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
          <p className="text-green-700 font-medium">
            Your order has been confirmed.
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="bg-[#fb641b] text-white font-semibold py-3 px-10 rounded shadow-sm hover:bg-[#f4511e] uppercase tracking-wide text-sm"
        >
          Shop More
        </button>
      </div>
    </div>
  );
};

export default ThankYou;
