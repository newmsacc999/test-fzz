<?php
/**
 * GET /payments/status.php?orderId=...
 * Returns: { status }   ("PAID" means the payment succeeded)
 *
 * Called after the Cashfree checkout closes to confirm the real outcome
 * (never trust the browser alone for payment status).
 */
require __DIR__ . "/_lib.php";

$orderId = isset($_GET["orderId"]) ? $_GET["orderId"] : "";
if ($orderId === "") {
    send_json(["error" => "orderId is required."], 400);
}

$config = cashfree_config();

list($status, $body) = cashfree_request(
    "GET",
    cashfree_base_url($config) . "/orders/" . urlencode($orderId),
    $config
);

if ($status >= 200 && $status < 300 && isset($body["order_status"])) {
    send_json(["status" => $body["order_status"]]);
}

$detail = isset($body["message"]) ? $body["message"] : "Unknown error";
send_json(["error" => "Failed to fetch order status.", "detail" => $detail], 502);
