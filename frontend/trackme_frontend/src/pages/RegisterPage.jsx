import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../components/common/Notifications';

const RegisterPage = () => {
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const notifications = useNotifications();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      display_name: '',
      email: '',
      password: '',
      confirm_password: '',
    }
  });

  const password = watch('password');

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data) => {
    try {
      clearError();
      clearErrors();

      if (!acceptTerms) {
        notifications.error('Please accept the Terms of Service to continue');
        return;
      }

      const result = await registerUser({
        email: data.email.trim(),
        password: data.password,
        display_name: data.display_name.trim(),
      });

      if (result.success) {
        notifications.success('Account created successfully! Welcome to TrackMe!');
        navigate('/dashboard', { replace: true });
      } else {
        if (result.error.includes('email')) {
          setError('email', { 
            type: 'server', 
            message: 'This email is already registered' 
          });
        } else if (result.error.includes('display_name')) {
          setError('display_name', { 
            type: 'server', 
            message: 'This display name is already taken' 
          });
        } else {
          notifications.error(result.error);
        }
      }
    } catch (err) {
      notifications.error('Registration failed. Please try again.');
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: '' };
    
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push('8+ characters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('uppercase letter');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('lowercase letter');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('number');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('special character');

    const strength = {
      0: { text: 'Very Weak', color: 'text-red-600' },
      1: { text: 'Weak', color: 'text-red-500' },
      2: { text: 'Fair', color: 'text-yellow-500' },
      3: { text: 'Good', color: 'text-yellow-600' },
      4: { text: 'Strong', color: 'text-green-500' },
      5: { text: 'Very Strong', color: 'text-green-600' },
    };

    return {
      score,
      text: strength[score].text,
      color: strength[score].color,
      feedback: feedback.length > 0 ? `Missing: ${feedback.join(', ')}` : 'Great password!',
    };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background sections */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-primary-600"></div>
        
        <div className="absolute top-0 right-0 w-full h-full bg-white" 
             style={{
               clipPath: 'polygon(calc(30% + 11cm) 0%, 100% 0%, 100% 100%, calc(0% + 11cm) 100%)'
             }}>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="max-w-md text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Start Tracking Your Activities Right From Here!
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Register now and unlock your potential with TrackMe - your personal activity management platform.
            </p>
          </div>
        </div>

        {/* Registration Form Container*/}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-primary-600 mb-2">TrackMe</h1>
              <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
              <p className="mt-2 text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Registration Form */}
            <div className="bg-white py-8 px-6 shadow-lg rounded-2xl border border-gray-200">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm text-red-600">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="display_name" className="form-label">
                    Display Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="display_name"
                      type="text"
                      autoComplete="name"
                      className={`form-input pl-10 ${errors.display_name ? 'border-red-300' : ''}`}
                      placeholder="Enter your display name"
                      {...register('display_name', {
                        required: 'Display name is required',
                        minLength: {
                          value: 2,
                          message: 'Display name must be at least 2 characters',
                        },
                        maxLength: {
                          value: 50,
                          message: 'Display name must be less than 50 characters',
                        },
                        pattern: {
                          value: /^[a-zA-Z0-9\s\-_.]+$/,
                          message: 'Display name can only contain letters, numbers, spaces, hyphens, dots, and underscores',
                        },
                      })}
                    />
                  </div>
                  {errors.display_name && (
                    <p className="form-error mt-1">{errors.display_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className={`form-input pl-10 ${errors.email ? 'border-red-300' : ''}`}
                      placeholder="Enter your email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address',
                        },
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="form-error mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`form-input pl-10 pr-10 ${errors.password ? 'border-red-300' : ''}`}
                      placeholder="Create a strong password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('password')}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>

                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password Strength:</span>
                        <span className={`text-xs font-medium ${passwordStrength.color}`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score <= 1 ? 'bg-red-500' :
                            passwordStrength.score <= 2 ? 'bg-yellow-500' :
                            passwordStrength.score <= 3 ? 'bg-yellow-600' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{passwordStrength.feedback}</p>
                    </div>
                  )}
                  
                  {errors.password && (
                    <p className="form-error mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirm_password" className="form-label">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={`form-input pl-10 pr-10 ${errors.confirm_password ? 'border-red-300' : ''}`}
                      placeholder="Confirm your password"
                      {...register('confirm_password', {
                        required: 'Please confirm your password',
                        validate: (value) => {
                          if (value !== password) {
                            return 'Passwords do not match';
                          }
                          return true;
                        },
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="form-error mt-1">{errors.confirm_password.message}</p>
                  )}
                </div>

                {/* Terms Acceptance */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="accept-terms"
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="accept-terms" className="text-gray-700">
                      I agree to the{' '}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          notifications.info('Terms of Service page coming soon!');
                        }}
                        className="text-primary-600 hover:text-primary-500 font-medium"
                      >
                        Terms of Service
                      </a>
                      {' '}and{' '}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          notifications.info('Privacy Policy page coming soon!');
                        }}
                        className="text-primary-600 hover:text-primary-500 font-medium"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading || !acceptTerms}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-colors duration-200 ${
                    isSubmitting || isLoading || !acceptTerms
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                  }`}
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Create Account
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Your account will be created with high level security
              </p>
              <div className="mt-2 flex items-center justify-center space-x-4 text-xs text-gray-400">
                <span>• Password encryption</span>
                <span>• Secure data storage</span>
                <span>• Privacy protection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;