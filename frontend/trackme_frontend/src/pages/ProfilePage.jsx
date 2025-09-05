import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../components/common/Notifications';
import api from '../services/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const notifications = useNotifications();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
    reset: resetProfile,
    setValue: setProfileValue,
  } = useForm({
    defaultValues: {
      display_name: user?.display_name || '',
      email: user?.email || '',
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm();

  const newPassword = watchPassword('new_password');

  const onSubmitProfile = async (data) => {
    try {
      const result = await updateUser({
        display_name: data.display_name,
        email: data.email,
      });

      if (result.success) {
        notifications.success('Profile updated successfully');
        setIsEditingProfile(false);
      } else {
        notifications.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      notifications.error('Failed to update profile');
    }
  };

  const onSubmitPassword = async (data) => {
    try {
      await api.user.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });

      notifications.success('Password changed successfully');
      resetPassword();
      setIsChangingPassword(false);
    } catch (error) {
      if (error.response?.data?.error) {
        notifications.error(error.response.data.error);
      } else if (error.response?.data?.current_password) {
        notifications.error('Current password is incorrect');
      } else {
        notifications.error('Failed to change password');
      }
    }
  };

  const handleEditProfile = () => {
    setProfileValue('display_name', user?.display_name || '');
    setProfileValue('email', user?.email || '');
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    resetProfile({
      display_name: user?.display_name || '',
      email: user?.email || '',
    });
    setIsEditingProfile(false);
  };

  const handleCancelPasswordChange = () => {
    resetPassword();
    setIsChangingPassword(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
      </div>

      <div className="space-y-8">
        {/* Profile Information Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <UserIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-500">Update your personal information</p>
              </div>
            </div>
            
            {!isEditingProfile && (
              <button
                onClick={handleEditProfile}
                className="btn-secondary flex items-center"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
          </div>

          {!isEditingProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Display Name</label>
                  <div className="text-gray-900 font-medium">
                    {user?.display_name || 'Not set'}
                  </div>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <div className="text-gray-900 font-medium">
                    {user?.email || 'Not set'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Member Since</label>
                  <div className="text-gray-600">
                    {user?.created_at 
                      ? new Date(user.created_at).toLocaleDateString()
                      : 'Unknown'
                    }
                  </div>
                </div>
                <div>
                  <label className="form-label">Last Updated</label>
                  <div className="text-gray-600">
                    {user?.updated_at 
                      ? new Date(user.updated_at).toLocaleDateString()
                      : 'Never'
                    }
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Display Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your display name"
                    {...registerProfile('display_name', {
                      required: 'Display name is required',
                      minLength: {
                        value: 2,
                        message: 'Display name must be at least 2 characters',
                      },
                    })}
                  />
                  {profileErrors.display_name && (
                    <p className="form-error">{profileErrors.display_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    {...registerProfile('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                  {profileErrors.email && (
                    <p className="form-error">{profileErrors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelProfileEdit}
                  className="btn-secondary"
                  disabled={isProfileSubmitting}
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isProfileSubmitting}
                >
                  {isProfileSubmitting ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Password Change Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <LockClosedIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                <p className="text-sm text-gray-500">Update your account password</p>
              </div>
            </div>
            
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="btn-secondary flex items-center"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Change
              </button>
            )}
          </div>

          {!isChangingPassword ? (
            <div className="text-gray-600">
              <p>••••••••••••</p>
              <p className="text-sm mt-2">
                Click "Change" to update your password
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter your current password"
                    {...registerPassword('current_password', {
                      required: 'Current password is required',
                    })}
                  />
                  {passwordErrors.current_password && (
                    <p className="form-error">{passwordErrors.current_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter your new password"
                    {...registerPassword('new_password', {
                      required: 'New password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                  />
                  {passwordErrors.new_password && (
                    <p className="form-error">{passwordErrors.new_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Confirm your new password"
                    {...registerPassword('confirm_password', {
                      required: 'Please confirm your new password',
                      validate: (value) =>
                        value === newPassword || 'Passwords do not match',
                    })}
                  />
                  {passwordErrors.confirm_password && (
                    <p className="form-error">{passwordErrors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelPasswordChange}
                  className="btn-secondary"
                  disabled={isPasswordSubmitting}
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-danger"
                  disabled={isPasswordSubmitting}
                >
                  {isPasswordSubmitting ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Account Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <EnvelopeIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account Summary</h2>
              <p className="text-sm text-gray-500">Your TrackMe account overview</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">
                {user?.total_entries || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Entries</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-success-600">
                {user?.total_hours || '0'} hrs
              </div>
              <div className="text-sm text-gray-600 mt-1">Time Tracked</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {user?.active_days || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active Days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;