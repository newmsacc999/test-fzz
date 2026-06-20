<?php
/**
 * POST /payments/create-order.php
 * Body: { amount, customer: { name, phone, email } }
 * Returns: { orderId, paymentSessionId }  (used by the Cashfree JS SDK)
 *
 * The Cashfree secret key is used here, server-side only — never in the browser.
 */
require __DIR__ . "/_lib.php";

$input = read_json_body();
$amount = isset($input["amount"]) ? (float) $input["amount"] : 0;
$customer = isset($input["customer"]) ? $input["customer"] : [];

if ($amount <= 0) {
    send_json(["error" => "A valid amount is required."], 400);
}

$config = cashfree_config();
$orderId = "order_" . time() . "_" . rand(1000, 9999);

$payload = [
    "order_id"       => $orderId,
    "order_amount"   => $amount, // Cashfree expects rupees
    "order_currency" => "INR",
    "customer_details" => [
        "customer_id"    => "cust_" . time(),
        "customer_name"  => isset($customer["name"]) ? $customer["name"] : "Guest",
        "customer_phone" => isset($customer["phone"]) ? $customer["phone"] : "9999999999",
        "customer_email" => isset($customer["email"]) ? $customer["email"] : "guest@example.com",
    ],
];

list($status, $body) = cashfree_request(
    "POST",
    cashfree_base_url($config) . "/orders",
    $config,
    $payload
);

if ($status >= 200 && $status < 300 && !empty($body["payment_session_id"])) {
    send_json([
        "orderId"          => $body["order_id"],
        "paymentSessionId" => $body["payment_session_id"],
    ]);
}

// Surface the gateway's real message so failures are easy to diagnose.
$detail = isset($body["message"]) ? $body["message"] : "Unknown error";
send_json(["error" => "Failed to create order.", "detail" => $detail], 502);
