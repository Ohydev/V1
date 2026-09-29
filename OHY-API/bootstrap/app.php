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
        // hops in 100.0.0.0/8. Trusting that range makes Laravel honour
        // X-Forwarded-Proto (correct https URLs / secure cookies). The
        // client IP for rate limiting comes from X-Real-IP instead — see
        // AppServiceProvider::clientIp().
        $middleware->trustProxies(at: ['100.0.0.0/8']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
