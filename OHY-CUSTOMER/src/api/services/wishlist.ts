import { api } from "../client";
import { endpoints } from "../endpoints";
import { ApiResponse, WishlistItemsResponse, AddToWishlistRequest, AddToWishlistResponse, RemoveFromWishlistRequest, RemoveFromWishlistResponse } from "../types";

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

export async function getWishlistItems() {
	const { data } = await api.get<ApiResponse<WishlistItemsResponse>>(endpoints.getWishlistItems);
	return ensureSuccess(data, "Failed to fetch wishlist items");
}

export async function addToWishlist(eventId: number) {
	const { data } = await api.post<ApiResponse<AddToWishlistResponse>>(endpoints.addToWishlist, { event_id: eventId } as AddToWishlistRequest);
	return ensureSuccess(data, "Failed to add item to wishlist");
}

export async function removeFromWishlist(eventId: number) {
	const { data } = await api.post<ApiResponse<RemoveFromWishlistResponse>>(endpoints.removeFromWishlist, { event_id: eventId } as RemoveFromWishlistRequest);
	return ensureSuccess(data, "Failed to remove item from wishlist");
}

