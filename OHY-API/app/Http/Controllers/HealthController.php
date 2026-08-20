<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HealthController extends Controller
{
    /**
     * Health Check API
     * 
     * Returns system health status including database connectivity.
     * This endpoint is public and does not require authentication.
     * Used for monitoring system status and ensuring all components are working properly.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function check(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        try {
            // Check database connectivity by attempting to connect and run a simple query
            // This verifies that the database connection is working properly
            DB::connection()->getPdo();

            // Run a simple query to verify database is accessible and responsive
            // SELECT 1 is a lightweight query that doesn't require any table access
            DB::select('SELECT 1');

            // Database connection successful, system is healthy
            // Return success response with healthy status
            $result = array(
                'success' => true,
                'data' => array(
                    'status' => 'healthy', // System status: healthy
                    'database' => 'connected', // Database connection status
                    'timestamp' => date('Y-m-d H:i:s'), // Current timestamp
                    'message' => 'System is operating normally', // Status message
                )
            );
        } catch (\Exception $e) {
            // Database connection failed or query failed
            // Log exception details for debugging purposes
            Log::info('Exception in HealthController::check');
            Log::info($e->getMessage());
            Log::info($e);

            // Return error response indicating system is unhealthy
            $result = array(
                'success' => false,
                'data' => array(
                    'status' => 'unhealthy', // System status: unhealthy
                    'database' => 'disconnected', // Database connection status
                    'timestamp' => date('Y-m-d H:i:s'), // Current timestamp
                    'message' => 'System health check failed', // Status message
                )
            );
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }
}
