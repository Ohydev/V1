<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Railway terminates HTTPS at its edge and forwards through internal
        // proxy hops in 100.0.0.0/8, appending the real client IP to
        // X-Forwarded-For. Trusting that whole range lets Laravel skip every
        // Railway hop and land on the real client IP (correct https scheme,
        // and per-IP rate limits that actually work). Reading from the right
        // also ignores any X-Forwarded-For value a client tries to spoof.
        // Note: '*' only trusted the last hop, so request->ip() came back as
        // a random internal 100.x address.
        $middleware->trustProxies(at: ['100.0.0.0/8']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
