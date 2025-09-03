import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management functions
export const tokenManager = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  }
};

// Add request interceptor to attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          tokenManager.setTokens(access, refreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          tokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        tokenManager.clearTokens();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

const api = {
  // Authentication endpoints
  auth: {
    register: async (userData) => {
      const response = await apiClient.post('/auth/register/', userData);
      return response.data;
    },
    
    login: async (credentials) => {
      const response = await apiClient.post('/auth/login/', credentials);
      return response.data;
    },
    
    logout: () => {
      tokenManager.clearTokens();
      window.location.href = '/login';
    },
    
    refreshToken: async () => {
      const refreshToken = tokenManager.getRefreshToken();
      const response = await apiClient.post('/auth/refresh/', {
        refresh: refreshToken,
      });
      return response.data;
    },
  },

  // User profile endpoints
  user: {
    getProfile: async () => {
      const response = await apiClient.get('/users/me/');
      return response.data;
    },
    
    updateProfile: async (userData) => {
      const response = await apiClient.put('/users/me/', userData);
      return response.data;
    },
  },

  // Tracker endpoints
  tracker: {
    getStatus: async () => {
      const response = await apiClient.get('/tracker/status/');
      return response.data;
    },
    
    start: async () => {
      const response = await apiClient.post('/tracker/status/', { action: 'start' });
      return response.data;
    },
    
    pause: async () => {
      const response = await apiClient.post('/tracker/status/', { action: 'pause' });
      return response.data;
    },
    
    resume: async () => {
      const response = await apiClient.post('/tracker/status/', { action: 'resume' });
      return response.data;
    },
    
    reset: async () => {
      const response = await apiClient.post('/tracker/status/', { action: 'reset' });
      return response.data;
    },
  },

  // Time entries endpoints
  timeEntries: {
    getAll: async (params = {}) => {
      const response = await apiClient.get('/time-entries/', { params });
      return response.data;
    },
    
    getById: async (id) => {
      const response = await apiClient.get(`/time-entries/${id}/`);
      return response.data;
    },
    
    create: async (entryData) => {
      const response = await apiClient.post('/time-entries/', entryData);
      return response.data;
    },
    
    update: async (id, entryData) => {
      const response = await apiClient.put(`/time-entries/${id}/`, entryData);
      return response.data;
    },
    
    delete: async (id) => {
      await apiClient.delete(`/time-entries/${id}/`);
      return true;
    },
  },
};

// Error handling helper
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    if (status === 400) {
      return {
        type: 'validation',
        message: 'Please check your input and try again.',
        details: data,
      };
    } else if (status === 401) {
      return {
        type: 'auth',
        message: 'Please log in to continue.',
      };
    } else if (status === 403) {
      return {
        type: 'permission',
        message: 'You do not have permission to perform this action.',
      };
    } else if (status === 404) {
      return {
        type: 'not_found',
        message: 'The requested resource was not found.',
      };
    } else if (status >= 500) {
      return {
        type: 'server',
        message: 'A server error occurred. Please try again later.',
      };
    }
  } else if (error.request) {
    return {
      type: 'network',
      message: 'Unable to connect to the server. Please check your internet connection.',
    };
  }
  
  return {
    type: 'generic',
    message: error.message || 'An unexpected error occurred.',
  };
};

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Date formatting helpers
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default api;