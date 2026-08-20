import { api } from "../client";
import { endpoints } from "../endpoints";
import {
	ApiResponse,
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	UserRegistrationOtpRequest,
	UserRegistrationOtpResponse,
	ForgotPasswordRequest,
	ForgotPasswordResponse,
	VerifyForgotPasswordOtpRequest,
	VerifyForgotPasswordOtpResponse,
	ResetPasswordRequest,
	ResetPasswordResponse,
	SwitchProfileRequest,
	SwitchProfileResponse,
	GetStatesResponse,
	State
} from "../types";
import { authStorage } from "../storage";

export async function login(req: LoginRequest) {
	const { data } = await api.post<ApiResponse<{ message: string; user_info: any; token: string }>>(
		endpoints.userLogin,
		req
	);
	if (data.success) {
		authStorage.setToken(data.data.token);
		return data.data as LoginResponse;
	}
	throw new Error("Unexpected response shape");
}

export async function requestRegistrationOtp(req: UserRegistrationOtpRequest) {
	const { data } = await api.post<ApiResponse<UserRegistrationOtpResponse>>(
		endpoints.userRegistrationOtpRequest,
		req
	);
	
	if (data.success) {
		return data.data;
	}
	
	throw new Error("Unexpected response shape");
}

export async function register(req: RegisterRequest) {
	const { data } = await api.post<ApiResponse<{ message: string }>>(endpoints.userRegister, req);
	
	if (data.success) {
		return data.data;
	}
	
	throw new Error("Unexpected response shape");
}

export async function requestForgotPasswordOtp(req: ForgotPasswordRequest) {
	const { data } = await api.post<ApiResponse<ForgotPasswordResponse>>(
		endpoints.userForgotPasswordRequest,
		req
	);
	
	if (data.success) {
		return data.data;
	}
	
	throw new Error("Unexpected response shape");
}

export async function verifyForgotPasswordOtp(req: VerifyForgotPasswordOtpRequest) {
	const { data } = await api.post<ApiResponse<VerifyForgotPasswordOtpResponse>>(
		endpoints.userVerifyForgotPasswordOtp,
		req
	);
	
	if (data.success) {
		return data.data;
	}
	
	throw new Error("Unexpected response shape");
}

export async function resetPassword(req: ResetPasswordRequest) {
	const { data } = await api.post<ApiResponse<ResetPasswordResponse>>(
		endpoints.userResetPassword,
		req
	);
	
	if (data.success) {
		return data.data;
	}
	
	throw new Error("Unexpected response shape");
}

export function logout() {
	// Clear authentication token from localStorage
	authStorage.clear();
	
	// Dispatch custom event to notify useAuth hook in the same tab
	window.dispatchEvent(new Event('auth:logout'));
}

export async function switchProfile(req: SwitchProfileRequest) {
	const { data } = await api.post<ApiResponse<SwitchProfileResponse>>(
		endpoints.switchProfile,
		req
	);
	if (data.success) {
		// Return the host token - it will be passed to host domain via URL
		// User token remains unchanged in user domain's localStorage
		return data.data;
	}
	throw new Error("Unexpected response shape");
}

export async function getStates() {
	const { data } = await api.get<ApiResponse<GetStatesResponse>>(endpoints.getStates);

	if (data.success) {
		return data.data.states as State[];
	}

	throw new Error("Unexpected response shape");
}


