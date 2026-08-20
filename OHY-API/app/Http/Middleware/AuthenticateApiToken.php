<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    /**
     * Handle an incoming request.
     *
     * Authenticates API requests by verifying Laravel Sanctum token from request headers.
     * Token can be sent as Bearer token or custom 'token' header.
     * Attaches authenticated user to request for use in controllers.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get token from custom 'token' header or Bearer token from Authorization header
        $token = $request->header('token') ?? $request->bearerToken();

        // Check if token is provided, return error if missing
        if (empty($token)) {
            // Token is missing, return authentication error
            return response()->json([
                'success' => false,
                'error' => [
                    'error_code' => 'T001',
                    'error_message' => 'Token is required',
                ],
            ], 401);
        }

        // Verify token using Laravel Sanctum's PersonalAccessToken
        // findToken() checks if token exists and matches hash, but does NOT check expiration
        $accessToken = PersonalAccessToken::findToken($token);

        // Check if token is found, return error if not found or hash mismatch
        if (! $accessToken) {
            // Token is invalid (not found or hash mismatch), return authentication error
            return response()->json([
                'success' => false,
                'error' => [
                    'error_code' => 'T002',
                    'error_message' => 'Invalid token',
                ],
            ], 401);
        }

        // Check if token is expired by comparing expires_at with current time
        // Only check expiration if expires_at is not null (tokens without expiration should still work)
        if (! empty($accessToken->expires_at) && $accessToken->expires_at->isPast()) {
            // Token has expired (expires_at is in the past), return authentication error
            return response()->json([
                'success' => false,
                'error' => [
                    'error_code' => 'T003',
                    'error_message' => 'Token has expired',
                ],
            ], 401);
        }

        // Note: last_used_at update removed for performance optimization
        // Updating last_used_at on every request causes unnecessary database writes
        // This was causing 50-200ms delay per request
        // If token usage tracking is needed, consider implementing it asynchronously or with conditional updates

        // Attach authenticated user (tokenable model) to request for use in controllers
        // This allows controllers to access user via $request->user()
        $request->setUserResolver(function () use ($accessToken) {
            return $accessToken->tokenable;
        });

        // Continue to next middleware or controller
        return $next($request);
    }
}
