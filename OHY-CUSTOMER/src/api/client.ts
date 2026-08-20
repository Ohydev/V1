import axios from "axios";
import { authStorage } from "./storage";
import { normalizeApiError } from "./errors";

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	withCredentials: false,
	headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
	const token = authStorage.getToken();
	if (token) {
		config.headers = config.headers ?? {};
		config.headers.Authorization = `Bearer ${token}`;
		(config.headers as any).token = token;
	}
	return config;
});

api.interceptors.response.use(
	(res) => res,
	(err) => {
		const norm = normalizeApiError(err);
		if (norm.status === 401) {
			authStorage.clear();
			try {
				window.dispatchEvent(new CustomEvent("auth:unauthorized"));
			} catch {
				/* no-op */
			}
		}
		return Promise.reject(norm);
	}
);


