<?php
/**
 * Cashfree configuration.
 * Copy this file to config.php and fill in your keys. config.php is git-ignored.
 *
 * Use SANDBOX keys for testing (env = "sandbox"):
 *   App ID:     from Cashfree dashboard (Test/Sandbox) → Developers → API Keys
 *   Secret Key: a "cfsk_ma_test_..." value
 */
return [
    "env"        => "sandbox",                 // "sandbox" | "production"
    "app_id"     => "YOUR_CASHFREE_APP_ID",
    "secret_key" => "YOUR_CASHFREE_SECRET_KEY", // cfsk_ma_test_... for sandbox
];
