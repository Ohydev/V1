// Gender values returned by the registered users API and accepted as filter.
export type RegisteredUserGender =
  | "Male"
  | "Female"
  | "Other"
  | "Prefer Not to say";

// Age range filter values accepted by the registered users list endpoint.
export type RegisteredUserAgeRange =
  | "10-20"
  | "20-30"
  | "30-40"
  | "40-50"
  | "50-60"
  | "60+";

// Define the structure describing a single registered user row.
export type RegisteredUser = {
  // Unique identifier for the user record.
  user_id: number;
  // Full name string returned by backend.
  full_name: string;
  // Email address used for login and contact.
  email: string;
  // Optional contact number string when provided.
  contact_number: string | null;
  // Gender when provided by the user (or null).
  gender: RegisteredUserGender | null;
  // Registration date already formatted as d-m-Y.
  created_at: string;
  // Total number of orders placed by the user.
  total_orders: number;
  // Aggregate spend amount calculated by backend.
  total_spend: number;
  // Date of the user’s most recent order (d-m-Y or null).
  last_order_date: string | null;
};

// Request body for POST get_super_admin_registered_users_list (all fields optional).
export type GetSuperAdminRegisteredUsersBody = {
  // Page number to request (defaults to backend page 1).
  page?: number;
  // Optional search keyword to filter users.
  search?: string;
  // Optional number of records per page.
  per_page?: number;
  // Optional gender filter.
  gender?: RegisteredUserGender;
  // Optional age range filter.
  age_range?: RegisteredUserAgeRange;
  // Optional state filter (from get_state list).
  state_id?: number;
  // Optional zipcode filter.
  zipcode?: string;
};

// Gender options for the registered users filter dropdown (UI and types in sync).
export const REGISTERED_USER_GENDER_OPTIONS: readonly RegisteredUserGender[] = [
  "Male",
  "Female",
  "Other",
  "Prefer Not to say",
] as const;

// Age range options for the registered users filter dropdown.
export const REGISTERED_USER_AGE_RANGE_OPTIONS: readonly RegisteredUserAgeRange[] = [
  "10-20",
  "20-30",
  "30-40",
  "40-50",
  "50-60",
  "60+",
] as const;

// Define the pagination metadata attached to the users list.
export type RegisteredUsersPagination = {
  // Aggregate number of records available across all pages.
  total_records: number;
  // Current page index as provided in the response.
  current_page: number;
  // Total number of pages calculated by backend.
  total_pages: number;
  // Next page index when another page exists.
  next_page: number | null;
  // Previous page index when available.
  prev_page: number | null;
};

// Define the full payload returned by the registered users endpoint.
export type SuperAdminRegisteredUsersResponse = {
  // Success message string returned by backend.
  message: string;
  // Array of registered user rows.
  users: RegisteredUser[];
  // Pagination block describing page metadata.
  pagination: RegisteredUsersPagination;
};

// Define the structure describing a single attendee's event summary.
export type AttendeeEvent = {
  // Unique event identifier.
  event_id: number;
  // Event title string.
  event_title: string;
  // Number of tickets purchased for the event.
  tickets_purchased: number;
  // Ticket subtotal amount prior to fees/discounts.
  ticket_subtotal: number;
  // Service fee amount applied to the purchase.
  service_fee: number;
  // Coupon discount amount applied to the purchase.
  coupon_discount: number;
  // Final event spend after adjustments.
  event_spend: number;
};

// Define the structure for each attendee row.
export type Attendee = {
  // Unique user identifier.
  user_id: number;
  // Full name string.
  name: string;
  // Email address string.
  email: string;
  // Contact number string.
  contact: string | null;
  // Total number of transactions completed.
  total_txns: number;
  // Aggregate spend amount across all events.
  total_spend: number;
  // Timestamp of the last transaction (d-m-Y H:i:s).
  last_txn: string | null;
  // Nested events array summarizing per-event metrics.
  events: AttendeeEvent[];
};

// Define pagination metadata for attendees list.
export type AttendeesPagination = {
  // Total number of attendee records available.
  total_records: number;
  // Current page number.
  current_page: number;
  // Total number of pages.
  total_pages: number;
  // Next page number when available.
  next_page: number | null;
  // Previous page number when available.
  prev_page: number | null;
};

// Define the full payload returned by the attendees endpoint.
export type SuperAdminAttendeesResponse = {
  // Success message string.
  message: string;
  // Array of attendee rows.
  attendees: Attendee[];
  // Pagination metadata.
  pagination: AttendeesPagination;
};


