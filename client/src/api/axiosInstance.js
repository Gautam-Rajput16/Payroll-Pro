import axios from 'axios';
import toast from 'react-hot-toast';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling global errors (like 401/403)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle Unauthorized (Invalid or expired token)
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Prevent multiple toasts
        if (!window.location.pathname.includes('/login')) {
          toast.error('Session expired. Please login again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      }

      // Handle Forbidden (Organisation suspended, etc.)
      if (status === 403) {
        toast.error(data.message || 'Access denied. Account may be suspended.');
        if (data.message && data.message.toLowerCase().includes('suspended')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
