<?php

namespace App\Http\Controllers;

use App\Models\HostUserModel;
use App\Models\SupportRequestModel;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class SupportRequestController extends Controller
{
    /**
     * Submit support request. Authenticated User or Host only.
     * Request body: title (required), description (optional).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function submitSupportRequest(Request $request)
    {
        $result = [];
        $data = $request->all();

        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
        ];

        $validation = Validator::make($data, $rules);

        if ($validation->fails()) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        $auth = $request->user();
        if (empty($auth)) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        $submitterType = null;
        $userId = null;
        $hostUserId = null;

        if ($auth instanceof UserModel) {
            $submitterType = 'user';
            $userId = $auth->user_id;
        } elseif ($auth instanceof HostUserModel) {
            $submitterType = 'host';
            $hostUserId = $auth->host_user_id;
        } else {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E004',
                    'error_message' => 'Access denied. End User or Host User access required.',
                ],
            ];

            return response()->json($result, 403);
        }

        try {
            $supportRequest = SupportRequestModel::create([
                'submitter_type' => $submitterType,
                'user_id' => $userId,
                'host_user_id' => $hostUserId,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
            ]);

            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Support request submitted successfully',
                    'support_request_id' => (int) $supportRequest->support_request_id,
                ],
            ];

            return response()->json($result);
        } catch (\Exception $e) {
            Log::info('Exception in SupportRequestController::submitSupportRequest');
            Log::info($e->getMessage());
            Log::info($e);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while submitting the support request',
                ],
            ];

            return response()->json($result, 500);
        }
    }
}
