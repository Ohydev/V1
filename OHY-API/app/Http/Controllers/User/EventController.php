<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\EventCategoryModel;

class EventController extends Controller
{
    /**
     * Get Event Categories - public endpoint for listing all categories
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEventCategories(Request $request)
    {
        // Initialize response structure
        $result = array();

        try {
            // Initialize EventCategoryModel to perform database operations
            $eventCategoryModel = new EventCategoryModel();

            // Query all event categories
            $queryCondition = array(); // No filters for now
            $categories = $eventCategoryModel->get_event_categories_list($queryCondition);

            // Format categories array for response
            $formattedCategories = array();
            foreach ($categories as $category) {
                $formattedCategories[] = array(
                    'event_category_id' => $category->event_category_id,
                    'category_name' => $category->category_name,
                );
            }

            // Sort categories alphabetically for better UX
            usort($formattedCategories, function ($a, $b) {
                return strcmp($a['category_name'], $b['category_name']);
            });

            // Build success response
            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'Event categories retrieved successfully',
                    'categories' => $formattedCategories,
                ),
            );
        } catch (\Exception $e) {
            // Log exception details
            Log::info('Exception in User\EventController::getEventCategories');
            Log::info($e->getMessage());
            Log::info($e);

            // Build error response
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving event categories',
                ),
            );
        }

        return response()->json($result);
    }
}

