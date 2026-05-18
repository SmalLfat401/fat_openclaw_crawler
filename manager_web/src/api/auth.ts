import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8879/api/v1',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_session');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.detail || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export interface LoginResponse {
  success: boolean;
  username: string;
  login_at: string;
  message: string;
}

export const authApi = {
  login: (username: string, obfuscatedPassword: string) =>
    apiClient.post<LoginResponse>('/auth/login', null, {
      params: { username, password: obfuscatedPassword },
    }),
};
