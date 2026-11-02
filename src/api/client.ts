import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Response interceptor: unwrap standard envelope { success: true, data: T }
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data.data;
    }
    return response.data;
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
