
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5003/api',
  timeout: 10000,
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle token expiration
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);




api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle token expiration
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  response => {
    if (!response.data) {
      const error = new Error('Invalid server response structure');
      error.response = response;
      throw error;
    }
    return response;
  },
  error => {
    // Ensure error object has consistent structure
    const formattedError = {
      message: error.message || 'Unknown error',
      status: error.response?.status,
      data: error.response?.data || { message: error.message },
      config: error.config,
      isAxiosError: error.isAxiosError
    };

    // Handle specific error cases
    if (error.message === 'Network Error') {
      formattedError.message = 'Network connection problem. Please check your internet.';
      formattedError.data.message = formattedError.message;
    }

    return Promise.reject(formattedError);
  }
);
// Add this near your axios instance creation
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized errors
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
export default api;