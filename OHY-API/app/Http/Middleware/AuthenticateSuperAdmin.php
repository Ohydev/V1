<?php

namespace App\Http\Middleware;

use App\Models\SuperAdminModel;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateSuperAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Retrieve authenticated user resolved by AuthenticateApiToken middleware
        $user = $request->user(); // Get tokenable model instance from request

        // Ensure request contains authenticated user before checking type
        if (empty($user) || $user == null) {
            // Return authentication error when token missing or invalid
            return response()->json([
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ], 401);
        }

        // Verify authenticated model is a SuperAdminModel instance
        if (! ($user instanceof SuperAdminModel)) {
            // Return authorization error when user is not super admin
            return response()->json([
                'success' => false,
                'error' => [
                    'error_code' => 'E004',
                    'error_message' => 'Access denied. Super Admin access required.',
                ],
            ], 403);
        }

        // Continue processing since user is authenticated Super Admin
        return $next($request);
    }
}
