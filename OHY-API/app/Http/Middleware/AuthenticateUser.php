<?php

namespace App\Http\Middleware;

use App\Models\UserModel;
use Closure;
use Illuminate\Http\Request;

/**
 * AuthenticateUser Middleware
 *
 * This middleware verifies that the authenticated user is an End User
 * (from the users table). It checks if the user attached by AuthenticateApiToken
 * is an instance of UserModel.
 */
class AuthenticateUser
{
    /**
     * Handle an incoming request.
     *
     * Verifies that the authenticated user is an End User (UserModel instance).
     * Returns 401 if user is missing, or 403 if user is not an End User.
     *
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Get authenticated user from request (set by AuthenticateApiToken middleware)
        $user = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($user) || $user == null) {
            // User is missing, return 401 error response
            return response()->json([
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ], 401);
        }

        // Check if user is an instance of UserModel (End User)
        if (! $user instanceof UserModel) {
            // User is not an End User, return 403 error response
            return response()->json([
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Access denied. End User access required',
                ],
            ], 403);
        }

        // User is valid End User, continue to next middleware or controller
        return $next($request);
    }
}
