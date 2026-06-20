<?php
// create_order.php

// Helper function to create a Cashfree order and return the payment link
function createCashfreeOrder($amount, $customerName = "John Doe", $customerEmail = "john.doe@example.com", $customerPhone = "9999999999") {
    $currency = "INR";
    $orderId = "order_" . uniqid();
    try {
        $config = new \Cashfree\Configuration();
        $config->setHost($_ENV['CASHFREE_ENVIRONMENT'] === 'PRODUCTION'
            ? 'https://api.cashfree.com/pg'
            : 'https://sandbox.cashfree.com/pg');
        $config->setApiKey('x-client-id', $_ENV['CASHFREE_APP_ID']);
        $config->setApiKey('x-client-secret', $_ENV['CASHFREE_SECRET_KEY']);
        $ordersApi = new \Cashfree\Api\OrdersApi(null, $config);
        $customer_details = new \Cashfree\Model\CFCustomerDetails([
            'customer_id' => $customerPhone,
            'customer_name' => $customerName,
            'customer_email' => $customerEmail,
            'customer_phone' => $customerPhone
        ]);
        $order_meta = new \Cashfree\Model\CFOrderMeta([
            // Cashfree substitutes {order_id} so the SPA can verify on return.
            'return_url' => $_ENV['APP_BASE_URL'] . (strpos($_ENV['APP_BASE_URL'], '?') === false ? '?' : '&') . 'order_id={order_id}'
        ]);
        $create_order_request = new \Cashfree\Model\CFOrderRequest([
            'order_id' => $orderId,
            'order_amount' => $amount,
            'order_currency' => $currency,
            'customer_details' => $customer_details,
            'order_meta' => $order_meta
        ]);
$result = $ordersApi->createOrder(
    $_ENV['CASHFREE_APP_ID'],
    $_ENV['CASHFREE_SECRET_KEY'],
    '2022-01-01',
    false,
    null,
    null,
    $create_order_request
);
// $result is CFOrderResponse, get CFOrder entity
$cfOrder = method_exists($result, 'getCFOrder') ? $result->getCFOrder() : null;
if ($cfOrder && method_exists($cfOrder, 'getPaymentLink') && $cfOrder->getPaymentLink()) {
    return $cfOrder->getPaymentLink();
} else {
    // Try to extract error details
    if (method_exists($result, 'getMessage')) {
        error_log('Cashfree error: ' . $result->getMessage());
    } else {
        error_log('Cashfree error: ' . print_r($result, true));
    }
    return false;
}
    } catch (\Exception $e) {
        error_log('Cashfree Exception: ' . $e->getMessage());
        return $e->getMessage();
    }
}

// Include Composer's autoloader - this is the ONLY include needed for the SDK
require_once __DIR__ . '/vendor/autoload.php';

// Include your custom .env loader (also sets safe error-display defaults)
require_once __DIR__ . '/load_env.php';

// --- Standalone JSON endpoint ---------------------------------------------
// Only run this block when create_order.php is requested directly (e.g. for
// debugging: create_order.php?amount=1). When payment_cashfree.php require()s
// this file it just needs the createCashfreeOrder() function above — running
// this block there would emit JSON and break the redirect.
if (realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {

header('Content-Type: application/json');

// --- Input Parameters (replace with dynamic values in a real application) ---
$amount = isset($_GET['amount']) ? (float)$_GET['amount'] : 100.00;
$currency = "INR";
$orderId = "order_".uniqid(); // Generate a unique order ID for each transaction
$customerName = "John Doe"; // Example customer name
$customerEmail = "john.doe@example.com"; // Example customer email
$customerPhone = "9999999999"; // Example customer phone (use a valid phone for testing)

try {
    // --- CORRECT SDK Initialization for v2.x of Cashfree PHP SDK ---

    // Use the helper function for order creation
    $paymentLink = createCashfreeOrder($amount, $customerName, $customerEmail, $customerPhone);
    if (filter_var($paymentLink, FILTER_VALIDATE_URL)) {
        echo json_encode([
            'status' => 'success',
            'payment_link' => $paymentLink
        ]);
    } else {
        error_log("Cashfree Order Creation Failed: " . $paymentLink);
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to create order. ' . $paymentLink
        ]);
    }

} catch (Exception $e) {
    // Catch any general exceptions
    error_log("Exception: " . $e->getMessage() . " on line " . $e->getLine() . " in " . $e->getFile());
    echo json_encode([
        'status' => 'error',
        'message' => 'An unexpected server error occurred. Please try again.',
        'details' => $e->getMessage()
    ]);
}

} // end standalone JSON endpoint guard
?>