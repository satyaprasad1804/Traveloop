import axios from 'axios';

/**
 * Pre-configured Axios instance for the Traveloop API.
 *
 * Base URL  : http://localhost:5000/api
 * Interceptor: Automatically attaches the JWT from localStorage
 *              to every request as  Authorization: Bearer <token>
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach token ────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('traveloop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('traveloop_token');
      localStorage.removeItem('traveloop_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
