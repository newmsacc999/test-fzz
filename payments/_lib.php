<?php
/**
 * Shared helpers for the Cashfree PHP endpoints.
 * Frontend and PHP are same-origin (Vite proxy in dev, same domain in prod),
 * so no CORS headers are needed.
 */

/** Load Cashfree config (keys + environment). */
function cashfree_config()
{
    return require __DIR__ . "/config.php";
}

/** Cashfree REST base URL for the configured environment. */
function cashfree_base_url($config)
{
    return ($config["env"] === "production")
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";
}

/** Read and decode the JSON request body into an associative array. */
function read_json_body()
{
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Send a JSON response with the given HTTP status code and stop. */
function send_json($data, $status = 200)
{
    http_response_code($status);
    header("Content-Type: application/json");
    echo json_encode($data);
    exit;
}

/**
 * Make an HTTP request to Cashfree and return [httpStatus, decodedBody].
 * $method: "GET" | "POST". $body is sent as JSON for POST.
 */
function cashfree_request($method, $url, $config, $body = null)
{
    $headers = [
        "Content-Type: application/json",
        "x-api-version: 2023-08-01",
        "x-client-id: " . $config["app_id"],
        "x-client-secret: " . $config["secret_key"],
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($method === "POST") {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }

    $response = curl_exec($ch);
    if ($response === false) {
        $err = curl_error($ch);
        return [500, ["message" => "Network error: " . $err]];
    }
    $httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    return [$httpStatus, json_decode($response, true)];
}
