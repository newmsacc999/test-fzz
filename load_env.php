<?php
// load_env.php

// The bundled Cashfree SDK predates PHP 8.1+ and emits deprecation notices.
// Printing them corrupts JSON responses and breaks header() redirects, so never
// display errors to output (real errors still go to the PHP error log).
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
ini_set('display_errors', '0');

/**
 * Loads environment variables from a .env file.
 * This is a simplified version suitable for shared hosting without Composer.
 *
 * @param string $path The directory where the .env file is located.
 * @param string $file The name of the .env file (default is '.env').
 */
function loadEnv($path, $file = '.env') {
    $filePath = rtrim($path, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $file;

    if (!file_exists($filePath) || !is_readable($filePath)) {
        // In a production environment, you might just log an error
        // or ensure environment variables are set via server config.
        // For development, you might throw an exception.
        error_log(".env file not found or not readable at: " . $filePath);
        return;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments and empty lines
        if (strpos(trim($line), '#') === 0 || empty(trim($line))) {
            continue;
        }

        // Parse key=value pairs
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        // Remove quotes from values
        if (preg_match('/^"(.+)"$/', $value, $matches) || preg_match("/^'(.+)'$/", $value, $matches)) {
            $value = $matches[1];
        }

        // Set environment variables
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value)); // For getenv()
            $_ENV[$name] = $value; // For $_ENV superglobal
            $_SERVER[$name] = $value; // For $_SERVER superglobal
        }
    }
}

// Call the function to load the .env variables.
// Assumes .env is in the same directory as this script.
loadEnv(__DIR__);

// Access variables like this:
// $_ENV['CASHFREE_APP_ID']
// getenv('CASHFREE_SECRET_KEY')
// $_SERVER['APP_BASE_URL']