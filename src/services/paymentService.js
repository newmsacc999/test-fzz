// Both gateways use the same phonepetest-style flow: the browser is redirected to
// a PHP endpoint (payment_cashfree.php / payment_razorpay.php) that creates the
// order/link server-side (secret stays on the server) and redirects to the gateway's
// hosted payment page. On return, the SPA confirms the real status server-side.
//
// The SPA runs on Vercel and the PHP backend runs on Hostinger (separate origin),
// so PHP_BASE must be the absolute Hostinger origin. Set VITE_PHP_BASE_URL in the
// Vercel project env, e.g. "https://your-site.hostingersite.com". Leave it empty
// only if the PHP files are served from the same origin as the SPA.

// The one switch: which gateway is active. Set in cart-teeee-main/.env.
export const PAYMENT_PROVIDER = import.meta.env.VITE_PAYMENT_PROVIDER || "razorpay";

// Absolute origin of the PHP payment backend (no trailing slash).
export const PHP_BASE = (import.meta.env.VITE_PHP_BASE_URL || "").replace(/\/+$/, "");

// Confirm the real Cashfree outcome on return (called from /thank-you).
// Returns { status } where "PAID" means success.
export async function fetchCashfreeStatus(orderId) {
  const res = await fetch(
    `${PHP_BASE}/order_status.php?order_id=${encodeURIComponent(orderId)}`
  );
  if (!res.ok) throw new Error("Could not verify payment status");
  return res.json();
}

// Confirm the real Razorpay outcome on return (called from /thank-you).
// Returns { status } where "paid" means success.
export async function fetchRazorpayStatus(paymentLinkId) {
  const res = await fetch(
    `${PHP_BASE}/razorpay_status.php?id=${encodeURIComponent(paymentLinkId)}`
  );
  if (!res.ok) throw new Error("Could not verify payment status");
  return res.json();
}

// Redirect to a PHP endpoint that creates the order/link server-side and forwards
// the browser to the gateway's hosted page. Leaves the SPA, so the returned
// promise stays pending until the navigation happens.
function redirectToGateway(endpoint, { amount, customer }) {
  const params = new URLSearchParams({
    amount,
    name: customer?.name || "",
    phone: customer?.phone || "",
  });
  window.location.href = `${PHP_BASE}/${endpoint}?${params.toString()}`;
  return new Promise(() => {});
}

/**
 * Start checkout with whichever gateway is configured (VITE_PAYMENT_PROVIDER).
 * Both gateways redirect away to a hosted page and are confirmed on return at
 * /thank-you (Cashfree via order_id, Razorpay via razorpay_payment_link_id).
 */
export async function startCheckout({ amount, customer }) {
  if (PAYMENT_PROVIDER === "cashfree") {
    return redirectToGateway("payment_cashfree.php", { amount, customer });
  }
  return redirectToGateway("payment_razorpay.php", { amount, customer });
}
