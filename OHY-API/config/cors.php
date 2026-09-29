<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Same as Laravel's framework default, except allowed_origins comes from
    | CORS_ALLOWED_ORIGINS (comma-separated, e.g. the 3 frontend domains).
    | Unset falls back to '*' so local dev keeps working without config;
    | production must set it so only our own frontends can call the API
    | from a browser.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGINS', '*'))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Frontends authenticate with a Bearer token header, not cookies.
    'supports_credentials' => false,

];
