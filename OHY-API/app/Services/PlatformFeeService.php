<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use App\Models\PlatformFeeModel;

class PlatformFeeService
{
    /**
     * Get platform fee for a specific host
     * 
     * Resolves fee using hierarchy: host-specific fee → global fee → null
     * 
     * @param int|null $hostUserId Host user ID to get fee for
     * @return \App\Models\PlatformFeeModel|null Platform fee record or null if no fee configured
     */
    public static function getFeeForHost($hostUserId)
    {
        try {
            // Step 1: Check for host-specific fee if host_user_id is provided
            if (!empty($hostUserId)) {
                $hostFee = PlatformFeeModel::where('host_user_id', $hostUserId)->first();
                
                if ($hostFee) {
                    // Host has custom fee, return it
                    return $hostFee;
                }
            }
            
            // Step 2: Fall back to global fee (host_user_id IS NULL)
            $globalFee = PlatformFeeModel::whereNull('host_user_id')->first();
            
            // Return global fee (can be null if no fee configured)
            return $globalFee;
        } catch (\Exception $e) {
            // Log exception for debugging
            Log::error('PlatformFeeService: Exception in getFeeForHost', [
                'method' => __METHOD__,
                'host_user_id' => $hostUserId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Return null on error (treats as no fee configured)
            return null;
        }
    }
    
    /**
     * Calculate platform fee amount based on fee settings
     * 
     * Calculates fee based on fee_type:
     * - flat_rate: fee_value × ticketCount
     * - percentage: (subtotal × fee_value) / 100
     * 
     * @param \App\Models\PlatformFeeModel|null $feeSettings Platform fee settings (can be null)
     * @param float $subtotal Order subtotal amount
     * @param int $ticketCount Total number of tickets in the order
     * @return float Calculated platform fee amount (rounded to 2 decimal places)
     */
    public static function calculateFee($feeSettings, $subtotal, $ticketCount)
    {
        try {
            // If no fee settings provided, return 0.00
            if (empty($feeSettings)) {
                return 0.00;
            }
            
            $feeType = $feeSettings->fee_type;
            $feeValue = (float)$feeSettings->fee_value;
            
            $calculatedFee = 0.00;
            
            // Calculate fee based on type
            if ($feeType === 'flat_rate') {
                // Flat rate: fee_value × ticketCount
                $calculatedFee = $feeValue * $ticketCount;
            } elseif ($feeType === 'percentage') {
                // Percentage: (subtotal × fee_value) / 100
                $calculatedFee = ($subtotal * $feeValue) / 100;
            }
            
            // Ensure fee is not negative (minimum 0.00)
            if ($calculatedFee < 0) {
                $calculatedFee = 0.00;
            }
            
            // Round to 2 decimal places
            return round($calculatedFee, 2);
        } catch (\Exception $e) {
            // Log exception for debugging
            Log::error('PlatformFeeService: Exception in calculateFee', [
                'method' => __METHOD__,
                'fee_settings' => $feeSettings ? $feeSettings->toArray() : null,
                'subtotal' => $subtotal,
                'ticket_count' => $ticketCount,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Return 0.00 on error (safe default)
            return 0.00;
        }
    }
    
    /**
     * Get global platform fee
     * 
     * Returns the global/default platform fee (where host_user_id IS NULL)
     * 
     * @return \App\Models\PlatformFeeModel|null Global platform fee record or null if not configured
     */
    public static function getGlobalFee()
    {
        try {
            // Query for global fee (host_user_id IS NULL)
            $globalFee = PlatformFeeModel::whereNull('host_user_id')->first();
            
            return $globalFee;
        } catch (\Exception $e) {
            // Log exception for debugging
            Log::error('PlatformFeeService: Exception in getGlobalFee', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Return null on error
            return null;
        }
    }
    
    /**
     * Get host-specific platform fee
     * 
     * Returns the host-specific platform fee for a given host (where host_user_id = $hostUserId)
     * 
     * @param int $hostUserId Host user ID to get fee for
     * @return \App\Models\PlatformFeeModel|null Host-specific platform fee record or null if not configured
     */
    public static function getHostFee($hostUserId)
    {
        try {
            // Validate host_user_id is provided
            if (empty($hostUserId)) {
                return null;
            }
            
            // Query for host-specific fee
            $hostFee = PlatformFeeModel::where('host_user_id', $hostUserId)->first();
            
            return $hostFee;
        } catch (\Exception $e) {
            // Log exception for debugging
            Log::error('PlatformFeeService: Exception in getHostFee', [
                'method' => __METHOD__,
                'host_user_id' => $hostUserId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Return null on error
            return null;
        }
    }
}

