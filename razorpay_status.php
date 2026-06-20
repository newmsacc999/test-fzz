<?php
// razorpay_status.php
// GET /razorpay_status.php?id=<razorpay_payment_link_id>
// Returns: { "status": "paid" | "created" | "cancelled" | "expired" | ... }
// Called by the SPA after Razorpay returns the browser, to confirm the real
// outcome server-side (never trust the redirect alone). "paid" = success.

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

$linkId = isset($_GET['id']) ? $_GET['id'] : '';
if ($linkId === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'id is required.']);
    exit;
}

$ch = curl_init('https://api.razorpay.com/v1/payment_links/' . urlencode($linkId));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_USERPWD, $_ENV['RAZORPAY_KEY_ID'] . ':' . $_ENV['RAZORPAY_KEY_SECRET']);

$response = curl_exec($ch);
if ($response === false) {
    error_log('Razorpay status cURL error: ' . curl_error($ch));
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Network error']);
    exit;
}
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$body = json_decode($response, true);

if ($httpStatus >= 200 && $httpStatus < 300 && !empty($body['status'])) {
    echo json_encode(['status' => $body['status']]);
    exit;
}

$detail = isset($body['error']['description']) ? $body['error']['description'] : 'Unknown error';
http_response_code(502);
echo json_encode(['status' => 'error', 'message' => $detail]);
