<?php
// payment_razorpay.php
// Razorpay equivalent of payment_cashfree.php (phonepetest-style).
// Creates a Razorpay Payment Link server-side (secret key never leaves the server)
// and redirects the browser to the hosted payment page. After payment, Razorpay
// returns the browser to APP_BASE_URL (the SPA /thank-you) with its own query
// params (razorpay_payment_link_id, razorpay_payment_link_status, ...), where the
// SPA verifies the real status via razorpay_status.php.

require_once __DIR__ . '/load_env.php';

// --- Validate amount ---
$amount = isset($_GET['amount']) ? $_GET['amount'] : null;
if (!$amount || !is_numeric($amount) || $amount <= 0) {
    die('Invalid or missing amount.');
}

// --- Optional customer details forwarded by the frontend ---
$customerName  = isset($_GET['name'])  ? trim($_GET['name'])  : '';
$customerPhone = isset($_GET['phone']) ? trim($_GET['phone']) : '';
$customerEmail = isset($_GET['email']) ? trim($_GET['email']) : '';

// --- Build the Payment Links request ---
$customer = [];
if ($customerName !== '')  { $customer['name']    = $customerName; }
if ($customerPhone !== '') { $customer['contact'] = $customerPhone; }
if ($customerEmail !== '') { $customer['email']   = $customerEmail; }

$payload = [
    'amount'          => (int) round(((float) $amount) * 100), // Razorpay uses paise
    'currency'        => 'INR',
    'accept_partial'  => false,
    'description'     => 'Order payment',
    'notify'          => ['sms' => false, 'email' => false],
    'reminder_enable' => false,
    'callback_url'    => $_ENV['APP_BASE_URL'],
    'callback_method' => 'get',
];
if (!empty($customer)) {
    $payload['customer'] = $customer;
}

// --- Call Razorpay Payment Links API ---
$ch = curl_init('https://api.razorpay.com/v1/payment_links');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_USERPWD, $_ENV['RAZORPAY_KEY_ID'] . ':' . $_ENV['RAZORPAY_KEY_SECRET']);

$response = curl_exec($ch);
if ($response === false) {
    error_log('Razorpay cURL error: ' . curl_error($ch));
    die('Failed to reach Razorpay. Please try again.');
}
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$body = json_decode($response, true);

if ($httpStatus >= 200 && $httpStatus < 300 && !empty($body['short_url'])) {
    header('Location: ' . $body['short_url']);
    exit;
}

// Surface the gateway's real message so failures are easy to diagnose.
$detail = isset($body['error']['description']) ? $body['error']['description'] : 'Unknown error';
error_log('Razorpay Payment Link creation failed: ' . $detail . ' | raw: ' . $response);
die('Failed to create Razorpay payment link. ' . htmlspecialchars($detail));
