import { api } from "../client";
import { endpoints } from "../endpoints";
import { ApiResponse } from "../types";

export interface CreateOrderRequest {
	event_id: number;
	first_name: string;
	last_name: string;
	email: string;
	phone_number: string;
	card_number: string;
	expiry_date: string; // MM/YY format
	cvv: string;
	street_address: string;
	city: string;
	state: string;
	zip_code: string;
	country_id: number;
	coupon_code: string | null; // Optional coupon code
}

export interface OrderTicket {
	order_ticket_id: number;
	ticket_id: number;
	ticket_type: string;
	ticket_category: string;
	quantity: number;
	unit_price: string;
	total_price: string;
}

export interface CreateOrderResponse {
	message: string;
	order: {
		order_id: number;
		order_number: string;
		order_date: string;
		subtotal: string;
		service_fee: string;
		coupon_discount: string;
		total_amount: string;
		order_tickets: OrderTicket[];
	};
}

export async function createOrder(body: CreateOrderRequest) {
	const { data } = await api.post<ApiResponse<CreateOrderResponse>>(endpoints.createOrder, body);
	if (data.success) return data.data;
	throw new Error("Unexpected response shape");
}

export interface UserOrder {
	order_id: number;
	order_number: string;
	order_status: string; // "paid", "pending", "cancelled", etc.
	event_id: number;
	event_title: string;
	event_status: string; // "Live", "Upcoming", "Completed"
	event_date: string;
	event_time: string;
	total_tickets: number;
	total_amount: string;
	order_date: string;
}

export interface OrdersListPagination {
	total_records: number;
	current_page: number;
	total_pages: number;
	per_page: number;
	next_page: number | null;
	prev_page: number | null;
}

export interface GetUserOrdersListResponse {
	message: string;
	orders: UserOrder[];
	pagination: OrdersListPagination;
}

export async function getUserOrdersList(params?: { page?: number; per_page?: number }) {
	const { data } = await api.get<ApiResponse<GetUserOrdersListResponse>>(endpoints.getUserOrdersList, { params });
	if (data.success) return data.data;
	throw new Error("Unexpected response shape");
}

// Order Details Interfaces
export interface OrderInfo {
	order_id: number;
	order_number: string;
	order_date: string;
	order_status: string;
	subtotal: string;
	service_fee: string;
	coupon_discount: string;
	total_amount: string;
}

export interface EventCategory {
	event_category_id: number;
	category_name: string;
}

export interface EventMediaItem {
	event_media_id: number;
	file_path: string;
	file_name: string;
	file_size: number;
	video_duration?: string | null; // Only for videos
}

export interface EventMedia {
	thumbnail: EventMediaItem | null;
	banner: EventMediaItem | null;
	flyers: EventMediaItem[];
	videos: EventMediaItem[];
}

export interface Venue {
	venue_id: number;
	venue_name: string;
	venue_address: string;
	city: string;
	state_province: string;
	postal_code: string;
	latitude: string;
	longitude: string;
	additional_details: string | null;
	maximum_attendees: number;
	venue_image: string | null;
}

export interface ArtistSocialMedia {
	platform: string;
	url: string;
}

export interface EventArtist {
	event_artist_id: number;
	artist_name: string;
	artist_image: string | null;
	social_media: ArtistSocialMedia[];
}

export interface EventSocialMedia {
	platform: string;
	url: string;
}

export interface TermsConditions {
	terms_content: string; // Rich text content
}

export interface EventDetails {
	event_id: number;
	event_title: string;
	description: string; // Rich text content
	key_highlights: string | null; // Rich text content
	category: EventCategory | null;
	start_date: string;
	end_date: string;
	start_time: string;
	end_time: string;
	event_status: string; // "Live", "Upcoming", "Completed"
	media: EventMedia;
	venue: Venue | null;
	artists: EventArtist[];
	social_media: EventSocialMedia[];
	terms_conditions: TermsConditions | null;
}

export interface OrderTicketDetail {
	order_ticket_id: number;
	ticket_id: number;
	ticket_category: string | null;
	ticket_type: string | null;
	quantity: number;
	unit_price: string;
	total_price: string;
}

export interface PaymentInfo {
	full_name: string;
	email: string;
	phone_number: string;
}

export interface Country {
	country_id: number;
	name: string;
}

export interface BillingAddress {
	street_address: string;
	city: string;
	state: string;
	zip_code: string;
	country: Country | null;
}

export interface CouponDetail {
	coupon_id: number;
	coupon_code: string;
	discount_type: string; // "percentage" or "flat"
	discount_percent: string | null;
	flat_discount_amount: string | null;
	discount_amount: string;
}

export interface GetOrderDetailsResponse {
	message: string;
	order: {
		order_info: OrderInfo;
		event: EventDetails | null;
		order_tickets: OrderTicketDetail[];
		payment_info: PaymentInfo;
		billing_address: BillingAddress;
		coupon: CouponDetail | null;
	};
}

export async function getOrderDetails(params: { order_id: number }) {
	const { data } = await api.get<ApiResponse<GetOrderDetailsResponse>>(endpoints.getOrderDetails, { params });
	if (data.success) return data.data;
	throw new Error("Unexpected response shape");
}

// Stripe Checkout Session Interfaces
export interface CreateCheckoutSessionRequest {
	event_id: number;
	full_name: string;
	// first_name: string;
	// last_name: string;
	email: string;
	phone_number: string;
	street_address: string;
	city: string;
	state: string;
	zip_code: string;
	country_id: number;
	coupon_code?: string | null; // Optional coupon code
}

export interface CreateCheckoutSessionResponse {
	checkout_url: string;
	session_id: string;
	order_id: number;
	message: string;
}

export async function createCheckoutSession(body: CreateCheckoutSessionRequest) {
	const { data } = await api.post<ApiResponse<CreateCheckoutSessionResponse>>(endpoints.createCheckoutSession, body);
	if (data.success) return data.data;
	throw new Error("Unexpected response shape");
}


