<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\UserFeedbackModel;
use App\Models\UserModel;
use App\Models\HostUserModel;

class FeedbackController extends Controller
{
    /**
     * Submit feedback. Authenticated User or Host only.
     * Request body: title (required), description (required).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function submitFeedback(Request $request)
    {
        $result = array();
        $data = $request->all();

        $rules = array(
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
        );

        $validation = Validator::make($data, $rules);

        if ($validation->fails()) {
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ),
            );

            return response()->json($result, 400);
        }

        $auth = $request->user();
        if (empty($auth)) {
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ),
            );

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
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E004',
                    'error_message' => 'Access denied. End User or Host User access required.',
                ),
            );

            return response()->json($result, 403);
        }

        try {
            $feedback = UserFeedbackModel::create(array(
                'submitter_type' => $submitterType,
                'user_id' => $userId,
                'host_user_id' => $hostUserId,
                'title' => $data['title'],
                'description' => $data['description'],
            ));

            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'Feedback submitted successfully',
                    'feedback_id' => (int) $feedback->feedback_id,
                ),
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::info('Exception in FeedbackController::submitFeedback');
            Log::info($e->getMessage());
            Log::info($e);

            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while submitting the feedback',
                ),
            );

            return response()->json($result, 500);
        }
    }
}
