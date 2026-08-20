<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\HostUserModel;

class AuthenticateHostUser
{
    /**
     * Handle an incoming request.
     * 
     * Verifies that the authenticated user is a Host User (from host_users table).
     * This middleware should be used after AuthenticateApiToken middleware.
     * Returns error if user is not a Host User instance.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get authenticated user from request (set by AuthenticateApiToken middleware)
        $user = $request->user();
        
        // Check if user is authenticated, return error if not
        if (empty($user) || $user == null) {
            // User not authenticated, return authentication error
            return response()->json([
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required'
                ]
            ], 401);
        }
        
        // Check if user is an instance of HostUserModel (from host_users table)
        if (!($user instanceof HostUserModel)) {
            // User is not a Host User, return authorization error
            return response()->json([
                'success' => false,
                'error' => [
                    'error_code' => 'E004',
                    'error_message' => 'Access denied. Host User access required.'
                ]
            ], 403);
        }
        
        // Immediately deny access if the host user is currently blocked by a super admin
        if ($user->is_blocked) {
            // Prefer stored block reason, otherwise fall back to generic message
            $blockMessage = !empty($user->blocked_reason) ? $user->blocked_reason : 'You are blocked by the admin. Please contact support.';

            // Return authorization error response indicating block status
            return response()->json([
                'success' => false,
                'error' => [
                    'error_code' => 'E004',
                    'error_message' => $blockMessage
                ]
            ], 403);
        }

        // User is authenticated, is a Host User, and is not blocked, so continue execution
        return $next($request);
    }
}
