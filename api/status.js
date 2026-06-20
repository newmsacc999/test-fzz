/**
 * GET /api/status?orderId=...   (mapped from /payments/status.php by vercel.json)
 * Returns: { status }   ("PAID" means the payment succeeded)
 *
 * Port of payments/status.php. Called after the Cashfree checkout closes to
 * confirm the real outcome (never trust the browser alone for payment status).
 */
import { cashfreeConfig, cashfreeBaseUrl, cashfreeRequest } from "./_cashfree.js";

export default async function handler(req, res) {
  const orderId = (req.query && req.query.orderId) || "";
  if (orderId === "") {
    return res.status(400).json({ error: "orderId is required." });
  }

  const config = cashfreeConfig();

  const [status, body] = await cashfreeRequest(
    "GET",
    cashfreeBaseUrl(config) + "/orders/" + encodeURIComponent(orderId),
    config
  );

  if (status >= 200 && status < 300 && body && body.order_status) {
    return res.status(200).json({ status: body.order_status });
  }

  const detail = (body && body.message) || "Unknown error";
  return res.status(502).json({ error: "Failed to fetch order status.", detail });
}
