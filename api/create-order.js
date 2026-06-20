/**
 * POST /api/create-order   (mapped from /payments/create-order.php by vercel.json)
 * Body: { amount, customer: { name, phone, email } }
 * Returns: { orderId, paymentSessionId }  (used by the Cashfree JS SDK)
 *
 * Port of payments/create-order.php. The Cashfree secret key is used here,
 * server-side only — never in the browser.
 */
import { cashfreeConfig, cashfreeBaseUrl, cashfreeRequest } from "./_cashfree.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  // Vercel parses JSON bodies automatically, but guard for the raw case too.
  const input =
    typeof req.body === "string" ? safeJson(req.body) : req.body || {};

  const amount = input.amount != null ? Number(input.amount) : 0;
  const customer = input.customer || {};

  if (!(amount > 0)) {
    return res.status(400).json({ error: "A valid amount is required." });
  }

  const config = cashfreeConfig();
  const orderId =
    "order_" + Math.floor(Date.now() / 1000) + "_" + rand(1000, 9999);

  const payload = {
    order_id: orderId,
    order_amount: amount, // Cashfree expects rupees
    order_currency: "INR",
    customer_details: {
      customer_id: "cust_" + Math.floor(Date.now() / 1000),
      customer_name: customer.name || "Guest",
      customer_phone: customer.phone || "9999999999",
      customer_email: customer.email || "guest@example.com",
    },
  };

  const [status, body] = await cashfreeRequest(
    "POST",
    cashfreeBaseUrl(config) + "/orders",
    config,
    payload
  );

  if (status >= 200 && status < 300 && body && body.payment_session_id) {
    return res.status(200).json({
      orderId: body.order_id,
      paymentSessionId: body.payment_session_id,
    });
  }

  // Surface the gateway's real message so failures are easy to diagnose.
  const detail = (body && body.message) || "Unknown error";
  return res.status(502).json({ error: "Failed to create order.", detail });
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function safeJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
