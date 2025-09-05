import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

    changePassword: async (passwordData) => {
      const response = await apiClient.post('/auth/change-password/', passwordData);
      return response.data;
    },
  },

  // Statistics endpoints
  // stats are calculated client-side
  stats: {
    getDashboardStats: async () => {
      try {
        const response = await api.timeEntries.getAll({ page_size: 1000 });
        const entries = response.results || [];

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayEntries = entries.filter(entry => {
          const entryDate = new Date(entry.end_time);
          return entryDate >= today;
        });

        const thisWeekEntries = entries.filter(entry => {
          const entryDate = new Date(entry.end_time);
          return entryDate >= thisWeekStart;
        });

        const thisMonthEntries = entries.filter(entry => {
          const entryDate = new Date(entry.end_time);
          return entryDate >= thisMonthStart;
        });

        const todaySeconds = todayEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
        const thisWeekSeconds = thisWeekEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
        const thisMonthSeconds = thisMonthEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
        const totalSeconds = entries.reduce((sum, entry) => sum + entry.duration_seconds, 0);

        const avgSessionDuration = entries.length > 0 
          ? Math.round(totalSeconds / entries.length) 
          : 0;

        return {
          total_entries: entries.length,
          total_hours: totalSeconds / 3600,
          this_week_hours: thisWeekSeconds / 3600,
          this_month_hours: thisMonthSeconds / 3600,
          today_seconds: todaySeconds,
          today_entries: todayEntries.length,
          avg_session_duration: avgSessionDuration,
        };
      } catch (error) {
        // Fallback to empty stats if API call fails
        console.warn('Stats calculation failed, using empty stats:', error);
        return {
          total_entries: 0,
          total_hours: 0,
          this_week_hours: 0,
          this_month_hours: 0,
          today_seconds: 0,
          today_entries: 0,
          avg_session_duration: 0,
        };
      }
    },
  },

  // Tracker endpoints
  tracker: {
    getStatus: async () => {
      const response = await apiClient.get('/tracker/status/');
      return response.data;
    },
    
    start: async () => {
    const response = await apiClient.post('/tracker/start/', { action: 'start' });
    return response.data;
    },
    
    pause: async () => {
      const response = await apiClient.post('/tracker/pause/', { action: 'pause' });
      return response.data;
    },
    
    resume: async () => {
      const response = await apiClient.post('/tracker/resume/', { action: 'resume' });
      return response.data;
    },
    
    reset: async () => {
      const response = await apiClient.post('/tracker/reset/', { action: 'reset' });
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

// Error handling 
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
        details: data,
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
    } else if (status === 422) {
      return {
        type: 'validation',
        message: data.message || 'Validation error occurred.',
        details: data,
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

// Time formatting
export const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Date formatting
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};


export const secondsToHours = (seconds) => {
  if (!seconds || seconds < 0) return 0;
  return Math.round((seconds / 3600) * 100) / 100;
};

export const hoursToSeconds = (hours) => {
  if (!hours || hours < 0) return 0;
  return Math.round(hours * 3600);
};


export const validateTimeEntry = (entry) => {
  const errors = {};
  
  if (!entry.description || entry.description.trim().length === 0) {
    errors.description = 'Description is required';
  } else if (entry.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }
  
  if (!entry.end_time) {
    errors.end_time = 'End time is required';
  }
  
  if (!entry.duration_seconds || entry.duration_seconds <= 0) {
    errors.duration_seconds = 'Duration must be greater than 0';
  } else if (entry.duration_seconds > 24 * 3600) {
    errors.duration_seconds = 'Duration cannot exceed 24 hours';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default api;