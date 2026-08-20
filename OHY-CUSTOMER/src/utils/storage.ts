const DEFAULT_STORAGE_BASE_URL = "http://localhost:8000/storage";
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

export const getStorageBaseUrl = () => {
	const base = import.meta.env.VITE_STORAGE_BASE_URL || DEFAULT_STORAGE_BASE_URL;
	return base.endsWith("/") ? base.slice(0, -1) : base;
};

export const getStorageUrl = (path?: string | null) => {
	if (!path) return "";
	if (ABSOLUTE_URL_PATTERN.test(path)) {
		return path;
	}
	const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
	return `${getStorageBaseUrl()}/${normalizedPath}`;
};



