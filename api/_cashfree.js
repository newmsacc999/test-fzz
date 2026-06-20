/**
 * Shared helpers for the Cashfree serverless endpoints (Vercel / Node.js).
 * Direct port of payments/_lib.php — same behaviour, same Cashfree REST calls.
 *
 * The secret key is read from environment variables (set in the Vercel
 * dashboard), never from the browser and never committed to git. This is the
 * Node equivalent of the git-ignored payments/config.php on Hostinger.
 */

/** Load Cashfree config (keys + environment) from env vars. */
export function cashfreeConfig() {
  return {
    env: process.env.CASHFREE_ENV || "sandbox", // "sandbox" | "production"
    appId: process.env.CASHFREE_APP_ID || "",
    secretKey: process.env.CASHFREE_SECRET_KEY || "",
  };
}

/** Cashfree REST base URL for the configured environment. */
export function cashfreeBaseUrl(config) {
  return config.env === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

/**
 * Make an HTTP request to Cashfree and return [httpStatus, decodedBody].
 * method: "GET" | "POST". body is sent as JSON for POST.
 */
export async function cashfreeRequest(method, url, config, body = null) {
  const headers = {
    "Content-Type": "application/json",
    "x-api-version": "2023-08-01",
    "x-client-id": config.appId,
    "x-client-secret": config.secretKey,
  };

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: method === "POST" && body ? JSON.stringify(body) : undefined,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return [res.status, data];
  } catch (err) {
    return [500, { message: "Network error: " + (err?.message || String(err)) }];
  }
}
