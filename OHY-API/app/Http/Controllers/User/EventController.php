<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\EventCategoryModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EventController extends Controller
{
    /**
     * Get Event Categories - public endpoint for listing all categories
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEventCategories(Request $request)
    {
        // Initialize response structure
        $result = [];

        try {
            // Initialize EventCategoryModel to perform database operations
            $eventCategoryModel = new EventCategoryModel;

            // Query all event categories
            $queryCondition = []; // No filters for now
            $categories = $eventCategoryModel->get_event_categories_list($queryCondition);

            // Format categories array for response
            $formattedCategories = [];
            foreach ($categories as $category) {
                $formattedCategories[] = [
                    'event_category_id' => $category->event_category_id,
                    'category_name' => $category->category_name,
                ];
            }

            // Sort categories alphabetically for better UX
            usort($formattedCategories, function ($a, $b) {
                return strcmp($a['category_name'], $b['category_name']);
            });

            // Build success response
            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Event categories retrieved successfully',
                    'categories' => $formattedCategories,
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details
            Log::info('Exception in User\EventController::getEventCategories');
            Log::info($e->getMessage());
            Log::info($e);

            // Build error response
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving event categories',
                ],
            ];
        }

        return response()->json($result);
    }
}
