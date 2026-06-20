<?php
// order_status.php
// GET /order_status.php?order_id=...
// Returns: { "status": "PAID" | "ACTIVE" | "EXPIRED" | ... }
// Called by the SPA after Cashfree returns the browser, to confirm the real
// outcome server-side (never trust the redirect alone).

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/load_env.php';

// The SPA (Vercel) and this PHP backend (Hostinger) are on different origins,
// so the browser needs CORS to read this read-only status response. Allow the
// configured app origin; fall back to "*" if APP_BASE_URL isn't set.
$allowedOrigin = '*';
if (!empty($_ENV['APP_BASE_URL'])) {
    $parts = parse_url($_ENV['APP_BASE_URL']);
    if (!empty($parts['scheme']) && !empty($parts['host'])) {
        $allowedOrigin = $parts['scheme'] . '://' . $parts['host']
            . (isset($parts['port']) ? ':' . $parts['port'] : '');
    }
}
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Content-Type: application/json');

$orderId = isset($_GET['order_id']) ? $_GET['order_id'] : '';
if ($orderId === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'order_id is required.']);
    exit;
}

try {
    $config = new \Cashfree\Configuration();
    $config->setHost($_ENV['CASHFREE_ENVIRONMENT'] === 'PRODUCTION'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg');
    $config->setApiKey('x-client-id', $_ENV['CASHFREE_APP_ID']);
    $config->setApiKey('x-client-secret', $_ENV['CASHFREE_SECRET_KEY']);

    $ordersApi = new \Cashfree\Api\OrdersApi(null, $config);
    // getOrder() returns a CFOrderResponse; the order entity is inside getCFOrder().
    $result = $ordersApi->getOrder(
        $_ENV['CASHFREE_APP_ID'],
        $_ENV['CASHFREE_SECRET_KEY'],
        $orderId,
        '2022-01-01'
    );

    $cfOrder = method_exists($result, 'getCFOrder') ? $result->getCFOrder() : null;
    $status = ($cfOrder && method_exists($cfOrder, 'getOrderStatus'))
        ? $cfOrder->getOrderStatus()
        : null;

    if ($status) {
        echo json_encode(['status' => $status]);
    } else {
        echo json_encode(['status' => 'UNKNOWN']);
    }
} catch (\Exception $e) {
    error_log('Cashfree getOrder Exception: ' . $e->getMessage());
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
