<?php

// Here are the controller for the Host User's
use App\Http\Controllers\Host\HostUserController;
use App\Http\Controllers\Host\EventController;
use App\Http\Controllers\User\EventController as UserEventCategoryController;
use App\Http\Controllers\SuperAdmin\SuperAdminController;
use App\Http\Controllers\SuperAdmin\SettlementController;
use App\Http\Controllers\SuperAdmin\PlatformFeeController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\MasterDataController;
use App\Http\Middleware\AuthenticateApiToken;
use App\Http\Middleware\AuthenticateHostUser;
use App\Http\Middleware\AuthenticateSuperAdmin;
use App\Http\Middleware\AuthenticateUserOrHost;
use Illuminate\Support\Facades\Route;

// Here are the controller for the End Users
use App\Http\Controllers\User\UserEventController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\User\CartController;
use App\Http\Controllers\User\OrderController;
use App\Http\Controllers\User\WishlistController;
use App\Http\Controllers\User\ReportController;
use App\Http\Middleware\AuthenticateUser;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\ProfileSwitchController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\SupportRequestController;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned the "api" middleware group. Make something great!
|
*/

// Routes:: Public Routes (No Authentication Required)

// Route: Health Check API (Public, No Authentication Required)
Route::get('/v1/health', [HealthController::class, 'check']);

Route::get('/v1/clear-config', function () {
    Artisan::call('config:clear');
    Artisan::call('cache:clear');
    return 'Config cleared';
});

Route::get('/v1/run-migrations', function () {
    Artisan::call('migrate', [
        '--force' => true, // required for production
    ]);

    return response()->json([
        'status' => 'success',
        'message' => 'Migrations executed successfully',
        'output' => Artisan::output(),
    ]);
});

// Routes:: Stripe Webhook (Public, CSRF Exempt)
Route::post('/v1/stripe/webhook', [StripeWebhookController::class, 'handleWebhook'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);

// Route: Get Countries Master Data API (Public, No Authentication Required)
Route::get('/v1/get_countries', [MasterDataController::class, 'getCountries']);

// Route: Get Business Intersections list (Public, for host registration and business info dropdown)
Route::get('/v1/get_business_intersections', [MasterDataController::class, 'getBusinessIntersections']);

// Route: Get States Master Data API (Public, No Authentication Required)
Route::get('/v1/get_states', [MasterDataController::class, 'getStates']);

// Routes:: Public API to get the list of CMS pages for the footer & its details.
Route::get('/v1/get_public_cms_pages_list', [MasterDataController::class, 'getPublicCmsPagesList']);
Route::get('/v1/get_public_cms_page/{slug}', [MasterDataController::class, 'getPublicCmsPage']);

// Routes:: Public Routes for Authentication for the Host Users & Super Admin
Route::prefix('v1')->group(function () {
    Route::post('/host_registration_otp_request', [HostUserController::class, 'requestRegistrationOtp']);
    Route::post('/host_user_register', [HostUserController::class, 'hostUserRegister']);
    Route::post('/host_user_login', [HostUserController::class, 'hostUserLogin']);
    Route::post('/super_admin_login', [SuperAdminController::class, 'superAdminLogin']);
    
    // Routes:: These are the public routes for host forgot password functionality.
    Route::post('/host_forgot_password_request', [HostUserController::class, 'requestForgotPassword']);
    Route::post('/host_verify_forgot_password_otp', [HostUserController::class, 'verifyForgotPasswordOtp']);
    Route::post('/host_reset_password', [HostUserController::class, 'resetPassword']);
});

// Routes:: Public Routes for Authentication for the End Users
Route::prefix('v1')->group(function () {
    // Routes:: These are the public routes which are used at the end user to view events & event details without authentication.
    Route::post('/get_public_events_list', [UserEventController::class, 'getPublicEventsList']);
    Route::get('/get_public_event_details', [UserEventController::class, 'getPublicEventDetails']);
    Route::get('/get_event_categories', [UserEventCategoryController::class, 'getEventCategories']);

    // Routes:: These are the public routes which are used at the end user to register & login without authentication.
    Route::post('/user_registration_otp_request', [UserController::class, 'requestRegistrationOtp']);
    Route::post('/user_register', [UserController::class, 'userRegister']);
    Route::post('/user_login', [UserController::class, 'userLogin']);
    
    // Routes:: These are the public routes for forgot password functionality.
    Route::post('/user_forgot_password_request', [UserController::class, 'requestForgotPassword']);
    Route::post('/user_verify_forgot_password_otp', [UserController::class, 'verifyForgotPasswordOtp']);
    Route::post('/user_reset_password', [UserController::class, 'resetPassword']);
});

// Routes:: Authenticated Routes

// Wrap authenticated routes with AuthenticateApiToken middleware and v1 prefix
Route::prefix('v1')->middleware([AuthenticateApiToken::class])->group(function () {

    // Routes:: Profile Switching Route (accessible to both User and Host)
    Route::post('/switch_profile', [ProfileSwitchController::class, 'switchProfile']);

    // Route: Submit Feedback (accessible to both User and Host)
    Route::post('/submit_feedback', [FeedbackController::class, 'submitFeedback'])->middleware([AuthenticateUserOrHost::class]);

    // Route: Submit Support Request (accessible to both User and Host)
    Route::post('/submit_support_request', [SupportRequestController::class, 'submitSupportRequest'])->middleware([AuthenticateUserOrHost::class]);
    
    // Routes:: Event Host Routes Authentication is required.

    // Routes:: Event Host Routes Authentication is required.
    Route::middleware([AuthenticateHostUser::class])->group(function () {

        // Routes:: Event Host Profile Management Routes Authentication is required.
        Route::post('/update_host_user_profile', [HostUserController::class, 'updateHostUserProfile']);
        Route::post('/update_host_user_business_info', [HostUserController::class, 'updateHostUserBusinessInfo']);
        Route::post('/update_host_user_password', [HostUserController::class, 'updateHostUserPassword']);
        Route::post('/update_host_user_banking_details', [HostUserController::class, 'updateHostUserBankingDetails']);
        Route::get('/get_host_user_profile', [HostUserController::class, 'getHostUserProfile']);

        // Route: Get Host User Dashboard
        Route::get('/get_host_user_dashboard', [HostUserController::class, 'getHostUserDashboard']);

        // Route: Get My Platform Fee (Host User only)
        Route::get('/get_my_platform_fee', [PlatformFeeController::class, 'getMyPlatformFee']);

        // Route: Get Host Payouts (Host User only)
        Route::get('/host_payouts', [SettlementController::class, 'getHostPayouts']);

        // Routes:: Stripe Onboarding Routes Authentication is required.
        Route::post('/create_host_stripe_account', [HostUserController::class, 'createHostStripeAccount']);
        Route::get('/get_host_stripe_onboarding_link', [HostUserController::class, 'getHostStripeOnboardingLink']);

        // Routes:: Event Creation Master Data Routes Authentication is required.
        Route::get('/get_event_creation_master_data', [EventController::class, 'getEventCreationMasterData']);

        // Routes:: Event Creation Routes
        Route::post('/save_event_step_1', [EventController::class, 'saveEventStep1']);

        // Routes:: Event Ticket Management Routes Authentication is required.
        Route::post('/create_ticket_category', [EventController::class, 'createTicketCategory']);
        Route::get('/get_ticket_categories', [EventController::class, 'getTicketCategories']);
        Route::post('/save_event_step_2', [EventController::class, 'saveEventStep2']);
        Route::get('/get_tickets_list', [EventController::class, 'getTicketsList']);

        // Routes:: Event Venue Management Routes Authentication is required.
        Route::post('/save_event_step_3', [EventController::class, 'saveEventStep3']);

        // Routes:: Event Event Members/Artists Management Routes Authentication is required.
        Route::post('/save_event_step_4', [EventController::class, 'saveEventStep4']);

        // Routes:: Event Terms & Conditions Management Routes Authentication is required.
        Route::post('/save_event_step_5', [EventController::class, 'saveEventStep5']);

        // Routes:: Event Coupons Management Routes Authentication is required.
        Route::post('/save_event_step_6', [EventController::class, 'saveEventStep6']);

        // Routes:: Event Summary & Publish Event Routes Authentication is required.
        Route::get('/get_event_summary', [EventController::class, 'getEventSummary']);
        Route::post('/publish_event', [EventController::class, 'publishEvent']);

        // Routes:: Event Data for Editing Routes Authentication is required.
        Route::get('/get_event_data_for_editing', [EventController::class, 'getEventDataForEditing']);

        // Routes:: Event List Routes Authentication is required.
        Route::get('/get_events_list', [EventController::class, 'getEventsList']);

        // Routes:: Event Details Routes Authentication is required.
        Route::get('/get_event_details', [EventController::class, 'getEventDetails']);

        // Routes:: Attendees List Routes Authentication is required.
        Route::get('/get_attendees_list', [EventController::class, 'getAttendeesList']);
    });

    // Routes:: Super Admin Routes Authentication is required.
    Route::middleware([AuthenticateSuperAdmin::class])->group(function () {
        // Routes:: Super Admin Profile Management Routes Authentication is required.
        Route::get('/get_super_admin_profile', [SuperAdminController::class, 'getSuperAdminProfile']);
        Route::post('/update_super_admin_profile', [SuperAdminController::class, 'updateSuperAdminProfile']);

        // Route: Super Admin Dashboard
        Route::get('/get_super_admin_dashboard', [SuperAdminController::class, 'getSuperAdminDashboard']);

        // Routes:: Event Management Routes
        Route::post('/get_super_admin_events_list', [SuperAdminController::class, 'getSuperAdminEventsList']); // Route: Get Super Admin Events List (filters + pagination in body)
        Route::get('/get_super_admin_event_details', [SuperAdminController::class, 'getSuperAdminEventDetails']); // Route: Get Super Admin Event Details
        Route::post('/toggle_event_hide_status', [SuperAdminController::class, 'toggleEventHideStatus']); // Route: Toggle Event Hide Status (Hide/Unhide)
        Route::post('/toggle_event_featured_status', [SuperAdminController::class, 'toggleEventFeaturedStatus']); // Route: Toggle Event Featured Status (Feature/Unfeature)
        Route::get('/get_super_admin_venue_cities', [SuperAdminController::class, 'getSuperAdminVenueCities']); // Route: Get distinct venue cities for filtering

        // Route: User Reports Management Routes
        Route::get('/get_super_admin_reports_list', [SuperAdminController::class, 'getSuperAdminReportsList']); // Route: Get Super Admin Reports List
        Route::post('/update_report_status', [SuperAdminController::class, 'updateReportStatus']); // Route: Update Report Status (in_review | resolved)

        // Route: Feedbacks Management Routes
        Route::get('/get_super_admin_feedbacks_list', [SuperAdminController::class, 'getSuperAdminFeedbacksList']); // Route: Get Super Admin Feedbacks List

        // Route: Support Requests Management Routes
        Route::get('/get_super_admin_support_requests_list', [SuperAdminController::class, 'getSuperAdminSupportRequestsList']); // Route: Get Super Admin Support Requests List

        // Route: Registered Users Management Routes
        Route::post('/get_super_admin_registered_users_list', [SuperAdminController::class, 'getSuperAdminRegisteredUsersList']); // Route: Get Super Admin Registered Users List (filters in request body)

        // Route: Attendees Management Routes
        Route::get('/get_super_admin_attendees_list', [SuperAdminController::class, 'getSuperAdminAttendeesList']); // Route: Get Super Admin Attendees List

        // Routes:: Event Host Management Routes
        Route::post('/get_super_admin_event_hosts_list', [SuperAdminController::class, 'getSuperAdminEventHostsList']); // Route: Get Super Admin Event Hosts List
        Route::post('/toggle_event_host_block_status', [SuperAdminController::class, 'toggleEventHostBlockStatus']); // Route: Toggle Event Host Block Status (Block/Unblock)

        // Routes:: CMS Management Routes
        Route::get('/get_cms_pages_list', [SuperAdminController::class, 'getCmsPagesList']); // Route: Get CMS Pages List
        Route::get('/get_cms_page_details', [SuperAdminController::class, 'getCmsPageDetails']); // Route: Get CMS Page Details
        Route::post('/create_cms_page', [SuperAdminController::class, 'createCmsPage']); // Route: Create CMS Page
        Route::post('/update_cms_page', [SuperAdminController::class, 'updateCmsPage']); // Route: Update CMS Page

        // Routes:: Settlement Management Routes (Super Admin only)
        Route::post('/settle_event_payout', [SettlementController::class, 'settleEventPayout']); // Route: Settle Event Payout
        Route::get('/get_event_settlement_summary', [SettlementController::class, 'getEventSettlementSummary']); // Route: Get Event Settlement Summary
        Route::get('/event_settlement_details', [SettlementController::class, 'getEventSettlementDetails']); // Route: Get Event Settlement Details (Orders and Transfers)
        Route::get('/get_event_settlement_breakdown', [SettlementController::class, 'getEventSettlementBreakdown']); // Route: Get Event Settlement Breakdown
        Route::post('/delete_cms_page/{cms_page_id}', [SuperAdminController::class, 'deleteCmsPage']); // Route: Delete CMS Page

        // Routes:: Platform Fee Management Routes (Super Admin only)
        Route::get('/get_global_platform_fee', [PlatformFeeController::class, 'getGlobalPlatformFee']); // Route: Get Global Platform Fee
        Route::post('/update_global_platform_fee', [PlatformFeeController::class, 'updateGlobalPlatformFee']); // Route: Update Global Platform Fee
        Route::get('/get_host_platform_fee', [PlatformFeeController::class, 'getHostPlatformFee']); // Route: Get Host Platform Fee
        Route::post('/update_host_platform_fee', [PlatformFeeController::class, 'updateHostPlatformFee']); // Route: Update Host Platform Fee
        Route::delete('/remove_host_platform_fee', [PlatformFeeController::class, 'removeHostPlatformFee']); // Route: Remove Host Platform Fee
        Route::get('/get_all_host_platform_fees', [PlatformFeeController::class, 'getAllHostPlatformFees']); // Route: Get All Host Platform Fees

        // Route: Super Admin Analytics (Super Admin only)
        Route::get('/get_super_admin_analytics', [SuperAdminController::class, 'getSuperAdminAnalytics']); // Route: Get Super Admin Analytics
    });

    // Routes:: End User Routes Authentication is required.
    Route::middleware([AuthenticateUser::class])->group(function () {
        // Routes:: Cart Management Routes Authentication is required.
        Route::post('/add_cart_item', [CartController::class, 'addCartItem']);
        Route::get('/get_cart_items', [CartController::class, 'getCartItems']);
        Route::put('/update_cart_item', [CartController::class, 'updateCartItem']);

        // Routes:: Coupons Management Routes Authentication is required.
        Route::get('/get_available_coupons', [CartController::class, 'getAvailableCoupons']);
        Route::post('/apply_coupon', [CartController::class, 'applyCoupon']);

        // Routes:: Checkout Routes Authentication is required.
        Route::post('/get_checkout_summary', [CartController::class, 'getCheckoutSummary']);
        Route::post('/empty_cart', [CartController::class, 'emptyCart']);

        // Routes:: Order Management Routes Authentication is required.
        Route::post('/create_checkout_session', [OrderController::class, 'createCheckoutSession']);
        Route::post('/create_order', [OrderController::class, 'createOrder']); // Legacy endpoint - use create_checkout_session instead
        Route::get('/get_user_orders_list', [OrderController::class, 'getUserOrdersList']);
        Route::get('/get_order_details', [OrderController::class, 'getOrderDetails']);

        // Routes:: Wishlist Management Routes Authentication is required.
        Route::post('/add_to_wishlist', [WishlistController::class, 'addToWishlist']);
        Route::get('/get_wishlist_items', [WishlistController::class, 'getWishlistItems']);
        Route::post('/remove_from_wishlist', [WishlistController::class, 'removeFromWishlist']);

        // Route: Submit Report (event or business profile)
        Route::post('/submit_report', [ReportController::class, 'submitReport']);

        // Routes:: User Profile Management Routes Authentication is required.
        Route::get('/get_user_profile', [UserController::class, 'getUserProfile']);
        Route::post('/update_user_profile', [UserController::class, 'updateUserProfile']);
        Route::post('/update_user_password', [UserController::class, 'updateUserPassword']);
    });
});
