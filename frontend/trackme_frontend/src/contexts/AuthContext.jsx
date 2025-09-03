import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api, { tokenManager, handleApiError } from '../services/api';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
};

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        
        if (tokenManager.isAuthenticated()) {
          const userProfile = await api.user.getProfile();
          
          localStorage.setItem('user', JSON.stringify(userProfile));
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user: userProfile },
          });
        } else {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: { user },
              });
            } catch {
              localStorage.removeItem('user');
              dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
          } else {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        }
      } catch (error) {
        tokenManager.clearTokens();
        localStorage.removeItem('user');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await api.auth.login(credentials);

      tokenManager.setTokens(response.tokens.access, response.tokens.refresh);

      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.user },
      });
      
      return { success: true };
    } catch (error) {
      const apiError = handleApiError(error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: apiError.message });
      return { success: false, error: apiError.message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await api.auth.register(userData);

      tokenManager.setTokens(response.tokens.access, response.tokens.refresh);

      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.user },
      });
      
      return { success: true };
    } catch (error) {
      const apiError = handleApiError(error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: apiError.message });
      return { success: false, error: apiError.message };
    }
  };

  const logout = () => {
    tokenManager.clearTokens();
    localStorage.removeItem('user');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  const updateUser = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      
      const response = await api.user.updateProfile(userData);

      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: response.user,
      });
      
      return { success: true };
    } catch (error) {
      const apiError = handleApiError(error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: apiError.message });
      return { success: false, error: apiError.message };
    }
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;