import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export const FormInput = React.forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  className = '', 
  required = false,
  ...props 
}, ref) => {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`form-input ${
          error ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="form-error flex items-center mt-1">
          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
          {error.message || error}
        </p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

// Password Input with show/hide toggle
export const PasswordInput = React.forwardRef(({ 
  label, 
  error, 
  showPassword, 
  onTogglePassword, 
  className = '',
  required = false,
  ...props 
}, ref) => {
  const inputId = props.id || `password-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className={`form-input pr-10 ${
            error ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''
          } ${className}`}
          {...props}
        />
        {onTogglePassword && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onTogglePassword}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="form-error flex items-center mt-1">
          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
          {error.message || error}
        </p>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

// Form Button with loading states
export const FormButton = ({ 
  children, 
  isLoading = false, 
  variant = 'primary', 
  className = '',
  ...props 
}) => {
  const baseClasses = 'w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-primary-500',
    danger: 'text-white bg-danger-600 hover:bg-danger-700 focus:ring-danger-500',
  };

  return (
    <button
      className={`
        ${baseClasses} 
        ${variants[variant]} 
        ${isLoading ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400' : ''} 
        ${className}
      `}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="loading-spinner mr-2"></div>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Error Alert Component
export const ErrorAlert = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="mb-4 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg flex items-start">
      <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm">{error}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 text-danger-400 hover:text-danger-600"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Success Alert Component
export const SuccessAlert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="mb-4 bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg flex items-start">
      <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 text-success-400 hover:text-success-600"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Password Strength Indicator
export const PasswordStrength = ({ password = '' }) => {
  const getStrength = (password) => {
    let score = 0;
    if (!password) return score;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return Math.min(score, 4);
  };

  const strength = getStrength(password);
  
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-danger-500',
    'bg-warning-500',
    'bg-yellow-500',
    'bg-success-400',
    'bg-success-600'
  ];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">Password strength</span>
        <span className={`text-xs font-medium ${
          strength >= 3 ? 'text-success-600' : strength >= 2 ? 'text-yellow-600' : 'text-danger-600'
        }`}>
          {strengthLabels[strength]}
        </span>
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full ${
              level <= strength ? strengthColors[strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Form validation utilities
export const validationRules = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Please enter a valid email address',
    },
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters',
    },
    validate: {
      hasLetter: (value) =>
        /[a-zA-Z]/.test(value) || 'Password must contain at least one letter',
      hasNumber: (value) =>
        /\d/.test(value) || 'Password must contain at least one number',
    },
  },
  displayName: {
    required: 'Display name is required',
    minLength: {
      value: 2,
      message: 'Display name must be at least 2 characters',
    },
    maxLength: {
      value: 100,
      message: 'Display name must be less than 100 characters',
    },
  },
};