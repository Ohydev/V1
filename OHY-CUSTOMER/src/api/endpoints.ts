export const endpoints = {
	// Public
	getPublicEventsList: "/get_public_events_list",
	getPublicEventDetails: "/get_public_event_details",
	getEventCategories: "/get_event_categories",
	getStates: "/get_states",

	// User auth
	userRegister: "/user_register",
	userLogin: "/user_login",
	userRegistrationOtpRequest: "/user_registration_otp_request",
	userForgotPasswordRequest: "/user_forgot_password_request",
	userVerifyForgotPasswordOtp: "/user_verify_forgot_password_otp",
	userResetPassword: "/user_reset_password",

	// User (authenticated)
	getUserProfile: "/get_user_profile",
	updateUserProfile: "/update_user_profile",
	updateUserPassword: "/update_user_password",
	switchProfile: "/switch_profile",

	// Cart
	addCartItem: "/add_cart_item",
	getCartItems: "/get_cart_items",
	updateCartItem: "/update_cart_item",
	getAvailableCoupons: "/get_available_coupons",
	applyCoupon: "/apply_coupon",
	getCheckoutSummary: "/get_checkout_summary",
	emptyCart: "/empty_cart",

	// Orders
	createOrder: "/create_order",
	createCheckoutSession: "/create_checkout_session",
	getUserOrdersList: "/get_user_orders_list",
	getOrderDetails: "/get_order_details",

	// Wishlist
	getWishlistItems: "/get_wishlist_items",
	addToWishlist: "/add_to_wishlist",
	removeFromWishlist: "/remove_from_wishlist",

	// Reports
	submitReport: "/submit_report",

	// Feedback (authenticated)
	submitFeedback: "/submit_feedback",

	// Support (authenticated)
	submitSupportRequest: "/submit_support_request"
};


