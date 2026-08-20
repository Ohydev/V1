<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\UserReportModel;
use App\Models\EventModel;
use App\Models\HostUserModel;
use App\Models\OrderModel;

class ReportController extends Controller
{
    /**
     * Submit a report for an event or business (host) profile.
     * Authenticated End User only. Exactly one of event_id or host_user_id must be provided.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function submitReport(Request $request)
    {
        $result = array();

        $data = $request->all();

        $rules = array(
            'event_id' => 'nullable|integer|min:1',
            'host_user_id' => 'nullable|integer|min:1',
            'order_id' => 'nullable|integer|min:1',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'priority' => 'required|in:high,medium,low',
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

        $hasEventId = !empty($data['event_id']);
        $hasHostUserId = !empty($data['host_user_id']);
        $hasOrderId = !empty($data['order_id']);
        $count = ($hasEventId ? 1 : 0) + ($hasHostUserId ? 1 : 0) + ($hasOrderId ? 1 : 0);

        if ($count !== 1) {
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => 'Exactly one of event_id, host_user_id or order_id must be provided.',
                ),
            );

            return response()->json($result, 400);
        }

        $user = $request->user();
        if (empty($user)) {
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ),
            );

            return response()->json($result, 401);
        }

        try {
            $eventModel = new EventModel();
            $hostUserModel = new HostUserModel();
            $orderModel = new OrderModel();

            $eventId = null;
            $hostUserId = null;
            $orderId = null;

            if ($hasEventId) {
                $event = $eventModel->get_event(array('event_id' => (int) $data['event_id']));
                if (!$event) {
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Event not found',
                        ),
                    );

                    return response()->json($result, 404);
                }
                if (!$event->is_published || $event->is_draft) {
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'Event is not published',
                        ),
                    );

                    return response()->json($result, 400);
                }
                $eventId = (int) $data['event_id'];
            } elseif ($hasHostUserId) {
                $hostUser = $hostUserModel->get_host_user(array('host_user_id' => (int) $data['host_user_id']));
                if (!$hostUser) {
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Host profile not found',
                        ),
                    );

                    return response()->json($result, 404);
                }
                $hostUserId = (int) $data['host_user_id'];
            } else {
                $order = $orderModel->get_order(array('order_id' => (int) $data['order_id']));
                if (!$order) {
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Order not found',
                        ),
                    );

                    return response()->json($result, 404);
                }
                if ((int) $order->user_id !== (int) $user->user_id) {
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'You can only report your own orders',
                        ),
                    );

                    return response()->json($result, 403);
                }
                $orderId = (int) $data['order_id'];
            }

            $report = UserReportModel::create(array(
                'user_id' => $user->user_id,
                'event_id' => $eventId,
                'host_user_id' => $hostUserId,
                'order_id' => $orderId,
                'title' => $data['title'],
                'description' => isset($data['description']) ? $data['description'] : null,
                'priority' => $data['priority'],
                'status' => 'new',
            ));

            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'Report submitted successfully',
                    'report_id' => (int) $report->report_id,
                ),
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::info('Exception in ReportController::submitReport');
            Log::info($e->getMessage());
            Log::info($e);

            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while submitting the report',
                ),
            );

            return response()->json($result, 500);
        }
    }
}
