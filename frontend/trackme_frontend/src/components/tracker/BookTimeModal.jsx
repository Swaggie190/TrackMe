import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { 
  XMarkIcon, 
  BookOpenIcon,
  ClockIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';
import api, { formatTime } from '../../services/api';

const BookTimeModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  elapsedSeconds, 
  startTime 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      end_time: new Date().toISOString().slice(0, 16), // Current datetime for input
      description: '',
      metadata: {},
    },
  });

  // Set default end time when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setValue('end_time', now.toISOString().slice(0, 16));
      setError(null);
    }
  }, [isOpen, setValue]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Create time entry with tracker data
      await api.timeEntries.create({
        description: data.description,
        end_time: new Date(data.end_time).toISOString(),
        booked_from_tracker: true,
        metadata: {
          project: data.project || '',
          tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        },
      });

      // Reset form and close modal
      reset();
      onSuccess();
    } catch (err) {
      console.error('Failed to book time:', err);
      setError(err.response?.data?.error || 'Failed to book time entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <BookOpenIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Book Tracked Time
                </Dialog.Title>
                <p className="text-sm text-gray-500">
                  Convert your tracked time into a time entry
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Time Summary */}
          <div className="bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg p-4 mb-6 border border-primary-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <ClockIcon className="w-5 h-5 text-primary-600 mr-2" />
                <span className="text-sm font-medium text-primary-800">
                  Time to Book
                </span>
              </div>
              <span className="text-lg font-bold text-primary-900">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            
            {startTime && (
              <div className="flex items-center text-sm text-primary-700">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>
                  Started: {new Date(startTime).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Description Field */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description <span className="text-danger-500">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                className={`form-input resize-none ${
                  errors.description ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''
                }`}
                placeholder="What did you work on?"
                {...register('description', {
                  required: 'Description is required',
                  minLength: {
                    value: 3,
                    message: 'Description must be at least 3 characters',
                  },
                  maxLength: {
                    value: 1000,
                    message: 'Description must be less than 1000 characters',
                  },
                })}
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
            </div>

            {/* End Time Field */}
            <div className="form-group">
              <label htmlFor="end_time" className="form-label">
                End Time <span className="text-danger-500">*</span>
              </label>
              <input
                id="end_time"
                type="datetime-local"
                className={`form-input ${
                  errors.end_time ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''
                }`}
                {...register('end_time', {
                  required: 'End time is required',
                  validate: {
                    notFuture: (value) => {
                      const endTime = new Date(value);
                      const now = new Date();
                      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
                      return endTime <= fiveMinutesFromNow || 'End time cannot be more than 5 minutes in the future';
                    },
                  },
                })}
              />
              {errors.end_time && (
                <p className="form-error">{errors.end_time.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                When did you finish this work?
              </p>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project Field */}
              <div className="form-group">
                <label htmlFor="project" className="form-label">
                  Project
                </label>
                <input
                  id="project"
                  type="text"
                  className="form-input"
                  placeholder="Project name"
                  {...register('project', {
                    maxLength: {
                      value: 100,
                      message: 'Project name too long',
                    },
                  })}
                />
              </div>

              {/* Tags Field */}
              <div className="form-group">
                <label htmlFor="tags" className="form-label">
                  Tags
                </label>
                <input
                  id="tags"
                  type="text"
                  className="form-input"
                  placeholder="bug, feature, review"
                  {...register('tags')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate with commas
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <BookOpenIcon className="w-4 h-4" />
                    <span>Book Time</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Helper Text */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> After booking, your tracker will reset to 00:00:00 and you can start tracking new work.
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default BookTimeModal;