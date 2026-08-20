<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\CountryModel;
use App\Models\CmsPageModel;
use App\Models\BusinessIntersectionModel;
use App\Models\State;
use Carbon\Carbon;

class MasterDataController extends Controller
{
    /**
     * Get Countries - retrieves all active countries from the countries table
     * 
     * This method retrieves all active countries (is_deleted = 0) from the countries table,
     * sorts them alphabetically by name, and returns them in a formatted response.
     * This endpoint is public and does not require authentication.
     * Used for dropdowns in forms (profile, venue, checkout).
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getCountries(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        try {
            // Initialize CountryModel to perform database operations
            $countryModel = new CountryModel();

            // Prepare query condition to get only active countries (not soft deleted)
            $queryCondition = array(
                'is_deleted' => 0, // Only get active countries (is_deleted = 0)
            );

            // Query countries table to get all active countries
            $countries = $countryModel->get_countries_list($queryCondition);

            // Format countries array for response
            // Extract all country fields for each country
            $countriesArray = array();
            foreach ($countries as $country) {
                $countriesArray[] = array(
                    'country_id' => $country->country_id, // Country's unique identifier
                    'iso' => $country->iso, // Two-letter ISO country code (e.g., "US", "GB", "IN")
                    'name' => $country->name, // Common country name (e.g., "United States")
                    'nicename' => $country->nicename, // User-friendly country name (e.g., "United States of America")
                    'flag_icon' => $country->flag_icon, // Path/URL to country flag icon (nullable)
                    'iso3' => $country->iso3, // Three-letter ISO code (e.g., "USA", "GBR") (nullable)
                    'numcode' => $country->numcode, // Numeric country code (nullable)
                    'phonecode' => $country->phonecode, // International dialing code (e.g., 1 for USA, 44 for UK)
                );
            }

            // Sort countries alphabetically by name for better UX
            usort($countriesArray, function ($a, $b) {
                return strcmp($a['name'], $b['name']);
            });

            // Return success response with countries data
            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'Countries retrieved successfully',
                    'countries' => $countriesArray, // Array of all active countries
                )
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in MasterDataController::getCountries');
            Log::info($e->getMessage());
            Log::info($e);

            // Return error response to the client
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving countries'
                )
            );
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get Business Intersections - retrieves all business intersection types (e.g. Woman-owned, Others)
     *
     * This endpoint is public and does not require authentication.
     * Used for dropdown when host selects business account type during registration and in business info form.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBusinessIntersections(Request $request)
    {
        $result = array();

        try {
            $intersections = BusinessIntersectionModel::orderBy('id')->get();

            $intersectionsArray = array();
            foreach ($intersections as $item) {
                $intersectionsArray[] = array(
                    'id' => (int) $item->id,
                    'name' => $item->name,
                );
            }

            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'Business intersections retrieved successfully',
                    'business_intersections' => $intersectionsArray,
                )
            );
        } catch (\Exception $e) {
            Log::info('Exception in MasterDataController::getBusinessIntersections');
            Log::info($e->getMessage());
            Log::info($e);

            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving business intersections'
                )
            );
        }

        return response()->json($result);
    }

    /**
     * Get States - retrieves all states from the states table
     *
     * This endpoint is public and does not require authentication.
     * Used for dropdowns in forms (address, profile, etc.).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStates(Request $request)
    {
        $result = array();

        try {
            $states = State::orderBy('name')->get();

            $statesArray = array();
            foreach ($states as $state) {
                $statesArray[] = array(
                    'state_id' => (int) $state->id,
                    'name' => $state->name,
                );
            }

            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'States retrieved successfully',
                    'states' => $statesArray,
                ),
            );
        } catch (\Exception $e) {
            Log::info('Exception in MasterDataController::getStates');
            Log::info($e->getMessage());
            Log::info($e);

            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving states',
                ),
            );
        }

        return response()->json($result);
    }

    /**
     * Get Public CMS Pages List - retrieves all active CMS pages for footer display
     * 
     * This method retrieves all active CMS pages (is_active = true) from the cms_pages table,
     * sorts them alphabetically by title, and returns minimal data (title, slug) for footer links.
     * This endpoint is public and does not require authentication.
     * Used for displaying CMS links in footer of User (Event) Module and Event Host Module.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getPublicCmsPagesList(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        try {
            // Initialize CmsPageModel to perform database operations
            $cmsPageModel = new CmsPageModel();

            // Get all active CMS pages sorted alphabetically by title
            $cmsPages = $cmsPageModel->get_active_cms_pages();

            // Format CMS pages array for response (minimal data for footer links)
            $cmsPagesArray = array();
            foreach ($cmsPages as $cmsPage) {
                $cmsPagesArray[] = array(
                    'cms_page_id' => (int)$cmsPage->cms_page_id, // CMS page unique identifier
                    'title' => $cmsPage->title, // CMS page title (e.g., "Terms & Conditions")
                    'slug' => $cmsPage->slug, // URL-friendly slug (e.g., "terms-and-conditions")
                );
            }

            // Return success response with active CMS pages data
            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'CMS pages retrieved successfully',
                    'cms_pages' => $cmsPagesArray, // Array of active CMS pages for footer
                ),
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in MasterDataController::getPublicCmsPagesList');
            Log::info($e->getMessage());
            Log::info($e);

            // Return error response to the client
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving CMS pages',
                ),
            );
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get Public CMS Page - retrieves single active CMS page by slug for viewing
     * 
     * This method retrieves a single active CMS page (is_active = true) by slug from the cms_pages table,
     * and returns complete page data (title, content, slug) for display.
     * This endpoint is public and does not require authentication.
     * Used for displaying CMS page content when user clicks on footer link.
     * 
     * @param Request $request
     * @param string $slug URL-friendly slug identifier
     * @return string JSON encoded response
     */
    public function getPublicCmsPage(Request $request, $slug)
    {
        // Initialize result array to store response data
        $result = array();

        try {
            // Initialize CmsPageModel to perform database operations
            $cmsPageModel = new CmsPageModel();

            // Get active CMS page by slug
            $cmsPage = $cmsPageModel->get_active_cms_page_by_slug($slug);

            // Check if CMS page exists and is active
            if (empty($cmsPage)) {
                // Return not found error if CMS page doesn't exist or is inactive
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E404',
                        'error_message' => 'CMS page not found',
                    ),
                );

                // Return 404 Not Found response
                return response()->json($result, 404);
            }

            // Format CMS page data for response (complete data for viewing)
            $cmsPageData = array(
                'cms_page_id' => (int)$cmsPage->cms_page_id,
                'title' => $cmsPage->title, // CMS page title
                'slug' => $cmsPage->slug, // URL-friendly slug
                'content' => $cmsPage->content, // Rich text HTML content from WYSIWYG editor
            );

            // Return success response with CMS page data
            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'CMS page retrieved successfully',
                    'cms_page' => $cmsPageData,
                ),
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in MasterDataController::getPublicCmsPage');
            Log::info($e->getMessage());
            Log::info($e);

            // Return error response to the client
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving CMS page',
                ),
            );
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }
}
