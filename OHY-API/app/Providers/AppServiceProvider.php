<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\HttpFoundation\IpUtils;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Named limiters for the public auth routes (applied in routes/api.php
     * via throttle:<name>). Keys combine the submitted email with the client
     * IP (see clientIp()). Counters live in the cache store (file on
     * Railway, single instance).
     */
    protected function configureRateLimiting(): void
    {
        // Password guessing: 5 tries per minute per account + IP.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)
            ->by('login|'.$this->emailKey($request).'|'.$this->clientIp($request))
            ->response($this->tooManyAttempts(...)));

        // OTP emails cost Brevo quota and can be used to spam an inbox:
        // limit per recipient email and per IP.
        RateLimiter::for('otp-send', fn (Request $request) => [
            Limit::perMinute(3)->by('otp-send|email|'.$this->emailKey($request))->response($this->tooManyAttempts(...)),
            Limit::perHour(10)->by('otp-send|email-hour|'.$this->emailKey($request))->response($this->tooManyAttempts(...)),
            Limit::perHour(20)->by('otp-send|ip|'.$this->clientIp($request))->response($this->tooManyAttempts(...)),
        ]);

        // OTPs are 6 digits: cap guesses so brute force is impractical.
        RateLimiter::for('otp-verify', fn (Request $request) => Limit::perMinute(5)
            ->by('otp-verify|'.$this->emailKey($request).'|'.$this->clientIp($request))
            ->response($this->tooManyAttempts(...)));
    }

    /**
     * Real client IP behind Railway. X-Forwarded-For ends with Railway's
     * edge node, which changes between requests, so request->ip() isn't
     * stable enough to key a limiter on. Railway sets X-Real-IP to the
     * connecting client and overwrites any client-supplied value (verified
     * 2026-09-29), so trust it — but only when the request really came
     * through Railway's internal proxy range.
     */
    private function clientIp(Request $request): string
    {
        $realIp = $request->header('X-Real-IP');

        if ($realIp && filter_var($realIp, FILTER_VALIDATE_IP)
            && IpUtils::checkIp((string) $request->server('REMOTE_ADDR'), '100.0.0.0/8')) {
            return $realIp;
        }

        return (string) $request->ip();
    }

    private function emailKey(Request $request): string
    {
        return strtolower(trim((string) $request->input('email')));
    }

    /**
     * 429 in the same envelope every other API error uses, so the frontends
     * show the message instead of a generic failure.
     */
    private function tooManyAttempts(Request $request, array $headers)
    {
        return response()->json([
            'success' => false,
            'error' => [
                'error_code' => 'R001',
                'error_message' => 'Too many attempts. Please wait a moment and try again.',
            ],
        ], 429, $headers);
    }
}
