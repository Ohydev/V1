export type SuccessResponse<T> = {
	success: true;
	data: T;
};

export type ErrorPayload = {
	success: false;
	error: {
		error_code: string;
		error_message: string | Record<string, string[]>;
	};
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorPayload;

export type LoginRequest = { email: string; password: string; remember_me?: string | boolean | 1 };
export type LoginResponse = { message: string; user_info: any; token: string };

export type RegisterRequest = {
	first_name: string;
	last_name: string;
	email: string;
	password: string;
	confirm_password: string;
	state: string;
	zipcode: string;
	gender: string;
	dob: string;
	country?: string;
	otp?: string;
};

export type State = {
	state_id: number;
	name: string;
};

export type GetStatesResponse = {
	message: string;
	states: State[];
};

export type UserRegistrationOtpRequest = {
	email: string;
	state: string;
	zipcode: string;
};

export type UserRegistrationOtpResponse = {
	message: string;
};

export type ForgotPasswordRequest = {
	email: string;
};

export type ForgotPasswordResponse = {
	message: string;
};

export type VerifyForgotPasswordOtpRequest = {
	email: string;
	otp: string;
};

export type VerifyForgotPasswordOtpResponse = {
	message: string;
};

export type ResetPasswordRequest = {
	email: string;
	otp: string;
	new_password: string;
	confirm_password: string;
};

export type ResetPasswordResponse = {
	message: string;
};

export type PublicEventsListResponse = {
	message: string;
	events: any[];
	pagination?: {
		total_records: number;
		current_page: number;
		total_pages: number;
		next_page: number | null;
		prev_page: number | null;
	};
};

export type PublicEventDetailsMediaAsset = { file_path: string | null; video_duration?: string };
export type PublicEventDetailsMedia = {
	banner?: PublicEventDetailsMediaAsset;
	thumbnail?: PublicEventDetailsMediaAsset;
	videos?: PublicEventDetailsMediaAsset[];
	flyers?: PublicEventDetailsMediaAsset[];
};

export type PublicEventDetailsVenue = {
	venue_name: string;
	city: string;
	venue_address?: string;
	state_province?: string;
	postal_code?: string;
	country?: { name: string };
	latitude?: number;
	longitude?: number;
	venue_image?: string | null;
};

export type PublicEventDetailsTicketCategory = { category_name: string };
export type PublicEventDetailsTicket = {
	ticket_id: number;
	price: number;
	available_quantity: number;
	max_per_user: number;
	description?: string;
	ticket_category?: PublicEventDetailsTicketCategory;
};

export type PublicEventDetailsTerms = { terms_content?: string };
export type PublicEventDetailsArtistSocial = { platform: string; url: string };
export type PublicEventDetailsArtist = {
	event_artist_id: number;
	artist_name: string;
	artist_image?: string | null;
	social_media?: PublicEventDetailsArtistSocial[];
};
export type PublicEventDetailsSocialLink = { platform: string; url: string };

export interface PublicEventDetailsEvent {
	event_id: number;
	host_user_id: number;
	event_title: string;
	description?: string;
	key_highlights?: string;
	start_date: string;
	end_date: string;
	start_time: string;
	end_time: string;
	venue?: PublicEventDetailsVenue | null;
	media?: PublicEventDetailsMedia;
	tickets?: PublicEventDetailsTicket[];
	terms_conditions?: PublicEventDetailsTerms;
	artists?: PublicEventDetailsArtist[];
	social_media?: PublicEventDetailsSocialLink[];
}

export type PublicEventDetailsResponse = {
	message: string;
	event: PublicEventDetailsEvent;
};

export type EventCategory = {
	event_category_id: number;
	category_name: string;
};

export type EventCategoriesResponse = {
	message: string;
	categories: EventCategory[];
};

export type WishlistItemResponse = {
	wishlist_id: number;
	event_id: number;
	event: {
		event_id: number;
		event_title: string;
		start_date: string;
		end_date: string;
		start_time: string;
		end_time: string;
		thumbnail: string;
		venue: {
			venue_name: string;
			city: string;
			state_province: string;
		};
		category: {
			event_category_id: number;
			category_name: string;
		};
		price_range: {
			min: string;
			max: string;
			display: string;
		};
	};
};

export type WishlistItemsResponse = {
	message: string;
	wishlist_items: WishlistItemResponse[];
};

export type AddToWishlistRequest = {
	event_id: number;
};

export type AddToWishlistResponse = {
	message: string;
};

export type RemoveFromWishlistRequest = {
	event_id: number;
};

export type RemoveFromWishlistResponse = {
	message: string;
};

export type SwitchProfileRequest = {
	mode: "host";
};

export type SwitchProfileResponse = {
	message: string;
	token: string;
	user_info: {
		host_user_id: number;
		first_name: string;
		last_name: string;
		email: string;
		profile_image: string | null;
		phone_number: string | null;
		website: string | null;
		city: string;
		state: string;
		country: string;
		business_id: number;
		is_primary: boolean;
		business: {
			business_name: string;
			account_type: string;
		};
	};
};


