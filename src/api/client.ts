import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function sanitizeMediaUrls<T>(data: T): T {
  if (typeof data === 'string') {
    if (/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/(?:api\/v1\/)?(merchant-logos|reward-videos)\/(.+)$/i.test(data)) {
      const match = data.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/(?:api\/v1\/)?(merchant-logos|reward-videos)\/(.+)$/i);
      if (match) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://spin-n-win.mobios.lk';
        return `${origin}/api/v1/${match[1]}/${match[2]}` as unknown as T;
      }
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeMediaUrls) as unknown as T;
  }
  if (data && typeof data === 'object' && Object.getPrototypeOf(data) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, sanitizeMediaUrls(v)])
    ) as unknown as T;
  }
  return data;
}

// Request interceptor: attach Staff Bearer token or Display Token if present
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const staffToken = localStorage.getItem('mobios_staff_token');
    const displayToken = localStorage.getItem('mobios_display_token') || 'mobios-display-screen-auth-token-key-2026';

    if (staffToken) {
      config.headers.Authorization = `Bearer ${staffToken}`;
    }

    if (displayToken) {
      config.headers['x-display-token'] = displayToken;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: unwrap standard envelope { success: true, data: T } and sanitize localhost URLs
apiClient.interceptors.response.use(
  (response) => {
    let payload = response.data;
    if (payload && typeof payload === 'object' && 'success' in payload) {
      payload = payload.data;
    }
    return sanitizeMediaUrls(payload);
  },
  (error: AxiosError<any>) => {
    const errorMsg =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg));
  },
);
