import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { 
  XMarkIcon, 
  ClockIcon,
  PlusIcon,
  PencilIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';
import api, { formatTime } from '../../services/api';

const TimeEntryModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  entry = null // null for create, entry object for edit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [durationInputType, setDurationInputType] = useState('duration'); 

  const isEditing = !!entry;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      description: '',
      duration_seconds: 3600,
      start_time: '',
      end_time: new Date().toISOString().slice(0, 16), 
      project: '',
      tags: '',
    },
  });

  const watchedStartTime = watch('start_time');
  const watchedEndTime = watch('end_time');

  // Set form values when editing or modal opens
  useEffect(() => {
    if (isOpen) {
      if (isEditing && entry) {
        setValue('description', entry.description);
        setValue('duration_seconds', entry.duration_seconds);
        setValue('end_time', new Date(entry.end_time).toISOString().slice(0, 16));
        
        if (entry.start_time) {
          setValue('start_time', new Date(entry.start_time).toISOString().slice(0, 16));
          setDurationInputType('times');
        } else {
          setDurationInputType('duration');
        }

        // Set metadata fields if available
        setValue('project', entry.metadata?.project || '');
        setValue('tags', entry.metadata?.tags?.join(', ') || '');
      } else {
        // Reset form for new entry
        const now = new Date();
        setValue('end_time', now.toISOString().slice(0, 16));
        setDurationInputType('duration');
      }
      setError(null);
    }
  }, [isOpen, isEditing, entry, setValue]);

  // Auto-calculate duration when start and end times change
  useEffect(() => {
    if (durationInputType === 'times' && watchedStartTime && watchedEndTime) {
      const start = new Date(watchedStartTime);
      const end = new Date(watchedEndTime);
      
      if (end > start) {
        const durationMs = end.getTime() - start.getTime();
        const durationSeconds = Math.floor(durationMs / 1000);
        setValue('duration_seconds', durationSeconds);
      }
    }
  }, [watchedStartTime, watchedEndTime, durationInputType, setValue]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare the entry data
      const entryData = {
        description: data.description.trim(),
        duration_seconds: parseInt(data.duration_seconds),
        end_time: new Date(data.end_time).toISOString(),
        booked_from_tracker: false,
        metadata: {
          project: data.project?.trim() || '',
          tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        },
      };

      // Add start time if provided
      if (durationInputType === 'times' && data.start_time) {
        entryData.start_time = new Date(data.start_time).toISOString();
      }

      // Create or update entry
      if (isEditing) {
        await api.timeEntries.update(entry.id, entryData);
      } else {
        await api.timeEntries.create(entryData);
      }

      reset();
      onSuccess();
    } catch (err) {
      console.error('Failed to save time entry:', err);
      
      // Handle validation errors
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data) {
        const errorMessages = [];
        Object.entries(err.response.data).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`);
          } else {
            errorMessages.push(`${field}: ${messages}`);
          }
        });
        setError(errorMessages.join('\n'));
      } else {
        setError('Failed to save time entry. Please try again.');
      }
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

  const toggleDurationInputType = () => {
    setDurationInputType(prev => prev === 'duration' ? 'times' : 'duration');
    setError(null);
  };

  const secondsToHours = (seconds) => {
    return (seconds / 3600).toFixed(2);
  };

  const hoursToSeconds = (hours) => {
    return Math.round(parseFloat(hours || 0) * 3600);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                {isEditing ? (
                  <PencilIcon className="w-5 h-5 text-primary-600" />
                ) : (
                  <PlusIcon className="w-5 h-5 text-primary-600" />
                )}
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Time Entry' : 'Add Time Entry'}
                </Dialog.Title>
                <p className="text-sm text-gray-500">
                  {isEditing ? 'Update your time entry details' : 'Manually add a new time entry'}
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

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Duration Input Type Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Duration Input Method
              </label>
              <button
                type="button"
                onClick={toggleDurationInputType}
                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                Switch to {durationInputType === 'duration' ? 'Start/End Times' : 'Direct Duration'}
              </button>
            </div>

            {durationInputType === 'duration' ? (
              /* Direct Duration Input */
              <div className="form-group">
                <label htmlFor="duration_hours" className="form-label">
                  Duration (Hours) <span className="text-danger-500">*</span>
                </label>
                <input
                  id="duration_hours"
                  type="number"
                  step="0.25"
                  min="0.01"
                  max="24"
                  className={`form-input ${
                    errors.duration_seconds ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''
                  }`}
                  placeholder="1.5"
                  {...register('duration_hours', {
                    required: 'Duration is required',
                    min: { value: 0.01, message: 'Duration must be at least 0.01 hours (36 seconds)' },
                    max: { value: 24, message: 'Duration cannot exceed 24 hours' },
                    onChange: (e) => {
                      const hours = parseFloat(e.target.value);
                      if (!isNaN(hours)) {
                        setValue('duration_seconds', hoursToSeconds(hours));
                      }
                    },
                  })}
                  defaultValue={secondsToHours(3600)}
                />
                {errors.duration_seconds && (
                  <p className="form-error">{errors.duration_seconds.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Example: 1.5 for 1 hour 30 minutes
                </p>
              </div>
            ) : (
              /* Start/End Time Inputs */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="start_time" className="form-label">
                    Start Time <span className="text-danger-500">*</span>
                  </label>
                  <input
                    id="start_time"
                    type="datetime-local"
                    className={`form-input ${
                      errors.start_time ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''
                    }`}
                    {...register('start_time', {
                      required: 'Start time is required when using time-based input',
                    })}
                  />
                  {errors.start_time && (
                    <p className="form-error">{errors.start_time.message}</p>
                  )}
                </div>

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
                        afterStart: (value) => {
                          const startTime = watch('start_time');
                          if (!startTime) return true;
                          const start = new Date(startTime);
                          const end = new Date(value);
                          return end > start || 'End time must be after start time';
                        },
                      },
                    })}
                  />
                  {errors.end_time && (
                    <p className="form-error">{errors.end_time.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Calculated Duration Display */}
            {watch('duration_seconds') > 0 && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 text-primary-600 mr-2" />
                  <span className="text-sm font-medium text-primary-800">
                    Duration: {formatTime(watch('duration_seconds') || 0)}
                  </span>
                </div>
              </div>
            )}

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
                {errors.project && (
                  <p className="form-error">{errors.project.message}</p>
                )}
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
                    <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <PencilIcon className="w-4 h-4" />
                    ) : (
                      <PlusIcon className="w-4 h-4" />
                    )}
                    <span>{isEditing ? 'Update Entry' : 'Create Entry'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Helper Text */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> You can input duration directly (in hours) or use start/end times for automatic calculation.
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default TimeEntryModal;