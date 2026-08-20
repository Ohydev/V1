<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\HostUserModel;
use App\Models\PlatformFeeModel;
use App\Services\PlatformFeeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PlatformFeeController extends Controller
{
    /**
     * Get global platform fee - Returns current global platform fee settings
     *
     * Returns the global/default platform fee (where host_user_id IS NULL).
     * Super Admin only.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getGlobalPlatformFee(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        try {
            // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
            $superAdmin = $request->user();

            // Safety check to ensure middleware injected user context
            if (empty($superAdmin) || $superAdmin == null) {
                // Return authentication error if user context missing
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E003',
                        'error_message' => 'Authentication required',
                    ],
                ];

                return response()->json($result, 401);
            }

            // Get global platform fee
            $globalFee = PlatformFeeService::getGlobalFee();

            // Build response data
            if ($globalFee) {
                $result = [
                    'success' => true,
                    'data' => [
                        'fee_type' => $globalFee->fee_type,
                        'fee_value' => number_format((float) $globalFee->fee_value, 2, '.', ''),
                    ],
                ];
            } else {
                // No global fee configured
                $result = [
                    'success' => true,
                    'data' => null,
                ];
            }
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::error('Exception in PlatformFeeController::getGlobalPlatformFee', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving global platform fee',
                ],
            ];

            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Update global platform fee - Creates or updates global platform fee settings
     *
     * Creates or updates the global/default platform fee (where host_user_id IS NULL).
     * Super Admin only.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateGlobalPlatformFee(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'fee_type' => 'required|in:flat_rate,percentage', // Fee type is required, must be 'flat_rate' or 'percentage'
            'fee_value' => 'required|numeric|min:0', // Fee value is required, must be numeric, minimum 0
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
                $superAdmin = $request->user();

                // Safety check to ensure middleware injected user context
                if (empty($superAdmin) || $superAdmin == null) {
                    // Return authentication error if user context missing
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E003',
                            'error_message' => 'Authentication required',
                        ],
                    ];

                    return response()->json($result, 401);
                }

                // Additional validation based on fee_type
                $feeType = $data['fee_type'];
                $feeValue = (float) $data['fee_value'];

                // Validate fee_value based on fee_type
                if ($feeType === 'flat_rate') {
                    // For flat_rate, max is 1000
                    if ($feeValue > 1000) {
                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E001',
                                'error_message' => 'Fee value for flat_rate cannot exceed 1000',
                            ],
                        ];

                        return response()->json($result, 400);
                    }
                } elseif ($feeType === 'percentage') {
                    // For percentage, max is 100
                    if ($feeValue > 100) {
                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E001',
                                'error_message' => 'Fee value for percentage cannot exceed 100',
                            ],
                        ];

                        return response()->json($result, 400);
                    }
                }

                // Initialize model
                $platformFeeModel = new PlatformFeeModel;

                // Check if global fee already exists
                $existingGlobalFee = PlatformFeeService::getGlobalFee();

                // Prepare fee data
                $feeData = [
                    'host_user_id' => null, // Global fee has NULL host_user_id
                    'fee_type' => $feeType,
                    'fee_value' => round($feeValue, 2), // Round to 2 decimal places
                    'updated_by_super_admin_id' => $superAdmin->super_admin_id,
                ];

                if ($existingGlobalFee) {
                    // Update existing global fee
                    $platformFeeModel->update_platform_fee_data(
                        ['id' => $existingGlobalFee->id],
                        $feeData
                    );

                    // Get updated fee
                    $updatedFee = PlatformFeeService::getGlobalFee();
                } else {
                    // Create new global fee
                    $updatedFee = $platformFeeModel->create_platform_fee($feeData);
                }

                // Build success response
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Global platform fee updated successfully',
                        'fee_type' => $updatedFee->fee_type,
                        'fee_value' => number_format((float) $updatedFee->fee_value, 2, '.', ''),
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::error('Exception in PlatformFeeController::updateGlobalPlatformFee', [
                    'method' => __METHOD__,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while updating global platform fee',
                    ],
                ];

                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get host platform fee - Returns host-specific fee if exists, otherwise returns global fee
     *
     * Returns the platform fee for a specific host. If host has custom fee, returns that.
     * Otherwise returns global fee. Response includes is_custom flag.
     * Super Admin only.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getHostPlatformFee(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        try {
            // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
            $superAdmin = $request->user();

            // Safety check to ensure middleware injected user context
            if (empty($superAdmin) || $superAdmin == null) {
                // Return authentication error if user context missing
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E003',
                        'error_message' => 'Authentication required',
                    ],
                ];

                return response()->json($result, 401);
            }

            // Get all request data from the incoming request (query parameters)
            $data = $request->all();

            // Get required host_user_id from query parameters
            $hostUserId = isset($data['host_user_id']) ? (int) $data['host_user_id'] : null;

            // Validate host_user_id is provided
            if (empty($hostUserId)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'error_code' => 'E001',
                        'error_message' => 'host_user_id is required',
                    ],
                ], 400);
            }

            // Validate host_user_id exists
            $hostUserModel = new HostUserModel;
            $hostUser = $hostUserModel->get_host_user(['host_user_id' => $hostUserId]);

            if (empty($hostUser)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'error_code' => 'E404',
                        'error_message' => 'Host user not found',
                    ],
                ], 404);
            }

            // Get host-specific fee
            $hostFee = PlatformFeeService::getHostFee($hostUserId);

            // Get global fee as fallback
            $globalFee = PlatformFeeService::getGlobalFee();

            // Determine which fee to return
            if ($hostFee) {
                // Host has custom fee
                $result = [
                    'success' => true,
                    'data' => [
                        'is_custom' => true,
                        'fee_type' => $hostFee->fee_type,
                        'fee_value' => number_format((float) $hostFee->fee_value, 2, '.', ''),
                    ],
                ];
            } elseif ($globalFee) {
                // Host uses global fee
                $result = [
                    'success' => true,
                    'data' => [
                        'is_custom' => false,
                        'fee_type' => $globalFee->fee_type,
                        'fee_value' => number_format((float) $globalFee->fee_value, 2, '.', ''),
                    ],
                ];
            } else {
                // No fee configured
                $result = [
                    'success' => true,
                    'data' => null,
                ];
            }
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::error('Exception in PlatformFeeController::getHostPlatformFee', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving host platform fee',
                ],
            ];

            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get my platform fee - Returns host-specific fee if exists, otherwise returns global fee
     *
     * Returns the platform fee for the authenticated host. If host has custom fee, returns that.
     * Otherwise returns global fee. Response does not include is_custom flag.
     * Host User only.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMyPlatformFee(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        try {
            // Get authenticated Host User from request (set by AuthenticateHostUser middleware)
            $authenticatedHost = $request->user();

            // Safety check to ensure middleware injected user context
            if (empty($authenticatedHost) || $authenticatedHost == null) {
                // Return authentication error if user context missing
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E003',
                        'error_message' => 'Authentication required',
                    ],
                ];

                return response()->json($result, 401);
            }

            // Get authenticated host's host_user_id
            $hostUserId = $authenticatedHost->host_user_id;

            // Get host-specific fee
            $hostFee = PlatformFeeService::getHostFee($hostUserId);

            // Get global fee as fallback
            $globalFee = PlatformFeeService::getGlobalFee();

            // Determine which fee to return
            if ($hostFee) {
                // Host has custom fee
                $result = [
                    'success' => true,
                    'data' => [
                        'fee_type' => $hostFee->fee_type,
                        'fee_value' => number_format((float) $hostFee->fee_value, 2, '.', ''),
                    ],
                ];
            } elseif ($globalFee) {
                // Host uses global fee
                $result = [
                    'success' => true,
                    'data' => [
                        'fee_type' => $globalFee->fee_type,
                        'fee_value' => number_format((float) $globalFee->fee_value, 2, '.', ''),
                    ],
                ];
            } else {
                // No fee configured
                $result = [
                    'success' => true,
                    'data' => null,
                ];
            }
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::error('Exception in PlatformFeeController::getMyPlatformFee', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving platform fee',
                ],
            ];

            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Update host platform fee - Creates or updates host-specific platform fee
     *
     * Creates or updates a host-specific platform fee override.
     * Super Admin only.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateHostPlatformFee(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'host_user_id' => 'required|integer|min:1', // Host user ID is required, must be integer, minimum 1
            'fee_type' => 'required|in:flat_rate,percentage', // Fee type is required, must be 'flat_rate' or 'percentage'
            'fee_value' => 'required|numeric|min:0', // Fee value is required, must be numeric, minimum 0
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
                $superAdmin = $request->user();

                // Safety check to ensure middleware injected user context
                if (empty($superAdmin) || $superAdmin == null) {
                    // Return authentication error if user context missing
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E003',
                            'error_message' => 'Authentication required',
                        ],
                    ];

                    return response()->json($result, 401);
                }

                // Get host_user_id from request data
                $hostUserId = (int) $data['host_user_id'];

                // Validate host_user_id exists
                $hostUserModel = new HostUserModel;
                $hostUser = $hostUserModel->get_host_user(['host_user_id' => $hostUserId]);

                if (empty($hostUser)) {
                    return response()->json([
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Host user not found',
                        ],
                    ], 404);
                }

                // Additional validation based on fee_type
                $feeType = $data['fee_type'];
                $feeValue = (float) $data['fee_value'];

                // Validate fee_value based on fee_type
                if ($feeType === 'flat_rate') {
                    // For flat_rate, max is 1000
                    if ($feeValue > 1000) {
                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E001',
                                'error_message' => 'Fee value for flat_rate cannot exceed 1000',
                            ],
                        ];

                        return response()->json($result, 400);
                    }
                } elseif ($feeType === 'percentage') {
                    // For percentage, max is 100
                    if ($feeValue > 100) {
                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E001',
                                'error_message' => 'Fee value for percentage cannot exceed 100',
                            ],
                        ];

                        return response()->json($result, 400);
                    }
                }

                // Initialize model
                $platformFeeModel = new PlatformFeeModel;

                // Check if host-specific fee already exists
                $existingHostFee = PlatformFeeService::getHostFee($hostUserId);

                // Prepare fee data
                $feeData = [
                    'host_user_id' => $hostUserId,
                    'fee_type' => $feeType,
                    'fee_value' => round($feeValue, 2), // Round to 2 decimal places
                    'updated_by_super_admin_id' => $superAdmin->super_admin_id,
                ];

                if ($existingHostFee) {
                    // Update existing host-specific fee
                    $platformFeeModel->update_platform_fee_data(
                        ['id' => $existingHostFee->id],
                        $feeData
                    );

                    // Get updated fee
                    $updatedFee = PlatformFeeService::getHostFee($hostUserId);
                } else {
                    // Create new host-specific fee
                    $updatedFee = $platformFeeModel->create_platform_fee($feeData);
                }

                // Build success response
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Host platform fee updated successfully',
                        'host_user_id' => $hostUserId,
                        'fee_type' => $updatedFee->fee_type,
                        'fee_value' => number_format((float) $updatedFee->fee_value, 2, '.', ''),
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::error('Exception in PlatformFeeController::updateHostPlatformFee', [
                    'method' => __METHOD__,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while updating host platform fee',
                    ],
                ];

                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Remove host platform fee - Deletes host-specific platform fee
     *
     * Deletes a host-specific platform fee. Host will fall back to global fee.
     * Super Admin only.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeHostPlatformFee(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        try {
            // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
            $superAdmin = $request->user();

            // Safety check to ensure middleware injected user context
            if (empty($superAdmin) || $superAdmin == null) {
                // Return authentication error if user context missing
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E003',
                        'error_message' => 'Authentication required',
                    ],
                ];

                return response()->json($result, 401);
            }

            // Get all request data from the incoming request (query parameters)
            $data = $request->all();

            // Get required host_user_id from query parameters
            $hostUserId = isset($data['host_user_id']) ? (int) $data['host_user_id'] : null;

            // Validate host_user_id is provided
            if (empty($hostUserId)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'error_code' => 'E001',
                        'error_message' => 'host_user_id is required',
                    ],
                ], 400);
            }

            // Validate host_user_id exists
            $hostUserModel = new HostUserModel;
            $hostUser = $hostUserModel->get_host_user(['host_user_id' => $hostUserId]);

            if (empty($hostUser)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'error_code' => 'E404',
                        'error_message' => 'Host user not found',
                    ],
                ], 404);
            }

            // Check if host-specific fee exists
            $hostFee = PlatformFeeService::getHostFee($hostUserId);

            if (empty($hostFee)) {
                return response()->json([
                    'success' => false,
                    'error' => [
                        'error_code' => 'E404',
                        'error_message' => 'Host-specific platform fee not found',
                    ],
                ], 404);
            }

            // Initialize model and delete host-specific fee
            $platformFeeModel = new PlatformFeeModel;
            $platformFeeModel->delete_platform_fee(['id' => $hostFee->id]);

            // Build success response
            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Host platform fee removed successfully. Host will now use global fee.',
                    'host_user_id' => $hostUserId,
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::error('Exception in PlatformFeeController::removeHostPlatformFee', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while removing host platform fee',
                ],
            ];

            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get all host platform fees - Returns list of all hosts with custom fees
     *
     * Returns a paginated list of all hosts that have custom platform fees set.
     * Includes host details (name, email) and fee settings.
     * Super Admin only.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllHostPlatformFees(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        try {
            // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
            $superAdmin = $request->user();

            // Safety check to ensure middleware injected user context
            if (empty($superAdmin) || $superAdmin == null) {
                // Return authentication error if user context missing
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E003',
                        'error_message' => 'Authentication required',
                    ],
                ];

                return response()->json($result, 401);
            }

            // Get all request data from the incoming request (query parameters)
            $data = $request->all();

            // Get pagination parameters with defaults
            $page = isset($data['page']) && $data['page'] > 0 ? (int) $data['page'] : 1; // Default page 1
            $perPage = isset($data['per_page']) && $data['per_page'] > 0 && $data['per_page'] <= 100 ? (int) $data['per_page'] : 10; // Default 10 per page, max 100

            // Get all host-specific fees with host user relationship
            $hostFeesQuery = PlatformFeeModel::with('hostUser')
                ->whereNotNull('host_user_id');

            // Get total count before pagination
            $totalRecords = $hostFeesQuery->count();

            // Apply pagination
            $hostFees = $hostFeesQuery->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->orderBy('updated_at', 'desc')
                ->get();

            // Build hosts array with fee details
            $hostsArray = [];

            foreach ($hostFees as $hostFee) {
                $hostUser = $hostFee->hostUser;

                $hostsArray[] = [
                    'host_user_id' => $hostFee->host_user_id,
                    'host_name' => $hostUser ? trim($hostUser->first_name.' '.$hostUser->last_name) : 'N/A',
                    'host_email' => $hostUser ? $hostUser->email : 'N/A',
                    'fee_type' => $hostFee->fee_type,
                    'fee_value' => number_format((float) $hostFee->fee_value, 2, '.', ''),
                    'updated_at' => $hostFee->updated_at->format('Y-m-d H:i:s'),
                ];
            }

            // Calculate total pages
            $totalPages = ceil($totalRecords / $perPage);

            // Build response
            $result = [
                'success' => true,
                'data' => [
                    'hosts' => $hostsArray,
                    'pagination' => [
                        'total_records' => $totalRecords,
                        'current_page' => $page,
                        'per_page' => $perPage,
                        'total_pages' => $totalPages,
                        'has_next_page' => $page < $totalPages,
                        'has_previous_page' => $page > 1,
                    ],
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::error('Exception in PlatformFeeController::getAllHostPlatformFees', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving host platform fees',
                ],
            ];

            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }
}
