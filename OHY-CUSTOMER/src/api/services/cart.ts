import { api } from "../client";
import { endpoints } from "../endpoints";
import { ApiResponse } from "../types";

type ApiErrorPayload = {
	error_code?: string;
	error_message?: string;
};

const buildApiError = (errorData: ApiErrorPayload | undefined, fallbackMessage: string) => {
	const message = errorData?.error_message || fallbackMessage;
	const error = new Error(message);
	(error as any).response = {
		data: {
			error: errorData ?? { error_message: message },
		},
	};
	return error;
};

const ensureSuccess = <T>(data: ApiResponse<T>, fallbackMessage: string) => {
	if (data.success) {
		return data.data;
	}
	throw buildApiError(data.error as ApiErrorPayload | undefined, fallbackMessage);
};

export async function addCartItem(body: any) {
	const { data } = await api.post<ApiResponse<{ message: string }>>(endpoints.addCartItem, body);
	return ensureSuccess(data, "Failed to add item to cart");
}

export async function getCartItems() {
	const { data } = await api.get<ApiResponse<{ message: string; cart_items: any[]; subtotal: string }>>(endpoints.getCartItems);
	return ensureSuccess(data, "Failed to fetch cart items");
}

export async function updateCartItem(body: any) {
	const { data } = await api.put<ApiResponse<{ message: string }>>(endpoints.updateCartItem, body);
	return ensureSuccess(data, "Failed to update cart item");
}

export async function getAvailableCoupons(params?: Record<string, any>) {
	const { data } = await api.get<ApiResponse<{ message: string; coupons: any[] }>>(endpoints.getAvailableCoupons, { params });
	return ensureSuccess(data, "Failed to fetch coupons");
}

export async function applyCoupon(body: any) {
	const { data } = await api.post<ApiResponse<{ message: string; coupon?: any }>>(endpoints.applyCoupon, body);
	return ensureSuccess(data, "Failed to apply coupon");
}

export interface CheckoutSummaryCartItem {
	cart_id: number;
	ticket_id: number;
	quantity: number;
	ticket_type: string;
	ticket_category: string;
	item_price: string;
	total_item_price: string;
}

export interface CheckoutSummaryData {
	message: string;
	event_id: number;
	cart_items: CheckoutSummaryCartItem[];
	summary: {
		subtotal: string;
		service_fee: string;
		coupon_discount: string;
		total: string;
	};
	coupon: {
		coupon_id: number;
		coupon_code: string;
		discount_display: string;
		discount_amount: string;
	} | null;
}

export async function getCheckoutSummary(body: { event_id: number; coupon_id: number | null }) {
	const { data } = await api.post<ApiResponse<CheckoutSummaryData>>(endpoints.getCheckoutSummary, body);
	return ensureSuccess(data, "Failed to load checkout summary");
}

export async function emptyCart() {
	const { data } = await api.post<ApiResponse<{ message: string }>>(endpoints.emptyCart);
	return ensureSuccess(data, "Failed to empty cart");
}


