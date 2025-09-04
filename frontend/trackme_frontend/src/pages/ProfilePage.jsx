import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../components/common/Notifications';
import { UserIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const notifications = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      display_name: user?.display_name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsUpdating(true);
      
      const result = await updateUser({
        display_name: data.display_name,
      });

      if (result.success) {
        setIsEditing(false);
        notifications.success('Profile updated successfully');
      } else {
        notifications.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      notifications.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    reset({
      display_name: user?.display_name || '',
      email: user?.email || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({
      display_name: user?.display_name || '',
      email: user?.email || '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center mb-8">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mr-6">
            <UserIcon className="w-10 h-10 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900">{user?.display_name}</h2>
            <p className="text-gray-600 mt-1">{user?.email}</p>
            <p className="text-sm text-gray-500 mt-2">
              Member since {new Date(user?.created_at).toLocaleDateString()}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="btn-primary flex items-center space-x-2"
            >
              <PencilIcon className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Display Name Field */}
              <div className="form-group">
                <label htmlFor="display_name" className="form-label">
                  Display Name <span className="text-danger-500">*</span>
                </label>
                <input
                  id="display_name"
                  type="text"
                  className={`form-input ${
                    errors.display_name ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''
                  }`}
                  placeholder="Enter your display name"
                  {...register('display_name', {
                    required: 'Display name is required',
                    minLength: {
                      value: 2,
                      message: 'Display name must be at least 2 characters',
                    },
                    maxLength: {
                      value: 100,
                      message: 'Display name must be less than 100 characters',
                    },
                  })}
                />
                {errors.display_name && (
                  <p className="form-error">{errors.display_name.message}</p>
                )}
              </div>

              {/* Email Field (Read-only) */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input bg-gray-50 text-gray-500"
                  value={user?.email}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed for security reasons
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                disabled={isUpdating}
                className="btn-primary flex items-center space-x-2"
              >
                {isUpdating ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isUpdating}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Read-only Display */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Display Name</h3>
              <p className="text-gray-900 text-lg">{user?.display_name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Email Address</h3>
              <p className="text-gray-900 text-lg">{user?.email}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Account Created</h3>
              <p className="text-gray-900 text-lg">
                {new Date(user?.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h3>
              <p className="text-gray-900 text-lg">
                {new Date(user?.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Account Statistics */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {Math.floor((new Date() - new Date(user?.created_at)) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-sm text-primary-700">Days as member</div>
          </div>
          
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <div className="text-2xl font-bold text-success-600 mb-1">
              Active
            </div>
            <div className="text-sm text-success-700">Account status</div>
          </div>
          
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              Standard
            </div>
            <div className="text-sm text-indigo-700">Plan type</div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Password</h4>
              <p className="text-sm text-gray-600">Last changed when account was created</p>
            </div>
            <button className="btn-secondary" disabled>
              Change Password
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Add an extra layer of security</p>
            </div>
            <button className="btn-secondary" disabled>
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;