<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Frontend URL Configuration
    |--------------------------------------------------------------------------
    |
    | This value is the base URL of your frontend application. It is used
    | for generating redirect URLs after payment success/failure and other
    | frontend-related redirects.
    |
    */

    'event_frontend_url' => env('EVENT_FRONTEND_URL', 'http://localhost:8081'),
    'host_frontend_url' => env('HOST_FRONTEND_URL', 'http://localhost:8080'),

    /*
    |--------------------------------------------------------------------------
    | Checkout URLs
    |--------------------------------------------------------------------------
    |
    | These URLs are used for redirecting users after Stripe checkout
    | payment completion or cancellation.
    |
    */

    'checkout' => [
        'success_url' => env('EVENT_FRONTEND_URL', 'http://localhost:8081').'/order/verifying',
        'cancel_url' => env('EVENT_FRONTEND_URL', 'http://localhost:8081').'/order/verifying',
    ],
];
