<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\UserModel;
use App\Models\HostUserModel;

/**
 * AuthenticateUserOrHost Middleware
 *
 * Verifies that the authenticated entity is either an End User (UserModel)
 * or a Host User (HostUserModel). Used for routes that both roles can access.
 */
class AuthenticateUserOrHost
{
    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (empty($user) || $user === null) {
            return response()->json([
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ),
            ], 401);
        }

        if (!$user instanceof UserModel && !$user instanceof HostUserModel) {
            return response()->json([
                'success' => false,
                'error' => array(
                    'error_code' => 'E004',
                    'error_message' => 'Access denied. End User or Host User access required.',
                ),
            ], 403);
        }

        if ($user instanceof HostUserModel && $user->is_blocked) {
            $blockMessage = !empty($user->blocked_reason) ? $user->blocked_reason : 'You are blocked by the admin. Please contact support.';
            return response()->json([
                'success' => false,
                'error' => array(
                    'error_code' => 'E004',
                    'error_message' => $blockMessage,
                ),
            ], 403);
        }

        return $next($request);
    }
}
