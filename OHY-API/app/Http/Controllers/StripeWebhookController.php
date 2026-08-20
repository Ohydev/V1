<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\StripeService;

class StripeWebhookController extends Controller
{
    /**
     * Handle Stripe webhook events
     * 
     * Processes incoming webhook events from Stripe. Verifies webhook signature
     * for security and routes events to appropriate handlers. This endpoint is
     * public (no authentication) but secured by Stripe signature verification.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function handleWebhook(Request $request)
    {
        try {
            // Get raw request body (required for signature verification)
            $payload = $request->getContent();
            
            // Get Stripe signature from request header
            $signature = $request->header('Stripe-Signature');
            
            // Check if signature header is present
            if (empty($signature)) {
                Log::error('Stripe webhook signature header missing', [
                    'method' => __METHOD__,
                ]);
                
                return response()->json([
                    'error' => 'Missing Stripe-Signature header'
                ], 400);
            }
            
            // Initialize Stripe service
            $stripeService = new StripeService();
            
            // Verify webhook signature and get event object
            try {
                $event = $stripeService->verifyWebhookSignature($payload, $signature);
            } catch (\Stripe\Exception\SignatureVerificationException $e) {
                Log::error('Stripe webhook signature verification failed', [
                    'method' => __METHOD__,
                    'error' => $e->getMessage(),
                ]);
                
                return response()->json([
                    'error' => 'Invalid signature'
                ], 400);
            } catch (\Exception $e) {
                Log::error('Stripe webhook verification error', [
                    'method' => __METHOD__,
                    'error' => $e->getMessage(),
                ]);
                
                return response()->json([
                    'error' => 'Webhook verification failed'
                ], 400);
            }
            
            // Process webhook event
            $processed = $stripeService->handleWebhookEvent($event);
            
            // Log event processing result
            Log::info('Stripe webhook event processed', [
                'method' => __METHOD__,
                'event_id' => $event->id,
                'event_type' => $event->type,
                'processed' => $processed,
            ]);
            
            // Always return 200 OK to Stripe (even if processing failed)
            // This prevents Stripe from retrying the webhook
            // Errors are logged for manual investigation
            return response()->json([
                'received' => true
            ], 200);
            
        } catch (\Exception $e) {
            // Log unexpected errors
            Log::error('Unexpected error in Stripe webhook handler', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Still return 200 OK to prevent Stripe retries
            // Errors are logged for investigation
            return response()->json([
                'received' => true,
                'error' => 'Internal processing error (logged)'
            ], 200);
        }
    }
}


