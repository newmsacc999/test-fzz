<?php
// redirect_to_cashfree.php
// This page redirects to Cashfree payment page on load, amount is taken from URL param

// Buffer any accidental output so it can never block the redirect header below.
ob_start();

// Get amount from URL param
$amount = isset($_GET['amount']) ? $_GET['amount'] : null;

if (!$amount || !is_numeric($amount) || $amount <= 0) {
    die('Invalid or missing amount.');
}

// Optional customer details forwarded by the frontend (prefilled on the Cashfree page).
$customerName  = isset($_GET['name'])  && $_GET['name']  !== '' ? $_GET['name']  : 'Guest';
$customerPhone = isset($_GET['phone']) && $_GET['phone'] !== '' ? $_GET['phone'] : '9999999999';
$customerEmail = isset($_GET['email']) && $_GET['email'] !== '' ? $_GET['email'] : 'guest@example.com';

// create_order.php defines createCashfreeOrder() and loads the SDK + .env.
require_once __DIR__ . '/create_order.php';

$paymentLink = createCashfreeOrder($amount, $customerName, $customerEmail, $customerPhone); // returns the hosted payment URL

// createCashfreeOrder returns the hosted URL on success, or false / an error
// message on failure. Only redirect to a real URL; otherwise show the reason.
ob_end_clean();
if (!$paymentLink || !filter_var($paymentLink, FILTER_VALIDATE_URL)) {
    die('Failed to create Cashfree order. ' . htmlspecialchars((string) $paymentLink));
}

header('Location: ' . $paymentLink);
exit;
