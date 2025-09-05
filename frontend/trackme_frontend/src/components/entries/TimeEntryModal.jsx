import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogBackdrop, DialogTitle, DialogPanel} from '@headlessui/react';
import { 
  XMarkIcon, 
  ClockIcon,
  PlusIcon,
  PencilIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';
import api, { formatTime } from '../../services/api';


console.log({ Dialog, XMarkIcon, ClockIcon, PlusIcon, PencilIcon, CalendarIcon, api, formatTime });


const TimeEntryModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  entry = null,
  initialData = null 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [durationInputType, setDurationInputType] = useState('duration'); 

  const isEditing = !!entry;
  const isFromTracker = initialData?.booked_from_tracker === true;

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

        setValue('project', entry.metadata?.project || '');
        setValue('tags', entry.metadata?.tags?.join(', ') || '');
      } else {
        const now = new Date();
        setValue('end_time', now.toISOString().slice(0, 16));
        setDurationInputType('duration');
      }
      setError(null);
    }
  }, [isOpen, isEditing, entry, setValue]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setError(null);

      let entryData;

      if (isFromTracker) {
        entryData = {
          description: data.description.trim(),
          end_time: new Date(data.end_time).toISOString(),
          booked_from_tracker: true,
          duration_seconds: 100,
          metadata: {
            project: data.project?.trim() || '',
            tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [],
          },
        };
      } else {
        entryData = {
          description: data.description.trim(),
          duration_seconds: parseInt(data.duration_seconds),
          end_time: new Date(data.end_time).toISOString(),
          booked_from_tracker: false,
          metadata: {
            project: data.project?.trim() || '',
            tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : [],
          },
        };

        if (durationInputType === 'times' && data.start_time) {
          entryData.start_time = new Date(data.start_time).toISOString();
        }
      }

      if (isEditing) {
        await api.timeEntries.update(entry.id, entryData);
      } else {
        await api.timeEntries.create(entryData);
      }

      reset();
      onSuccess();
    } catch (err) {
      console.error('Failed to save time entry:', err);

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

  const secondsToHours = (seconds) => {
    return (seconds / 3600).toFixed(2);
  };

  const hoursToSeconds = (hours) => {
    return Math.round(parseFloat(hours || 0) * 3600);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <DialogBackdrop className="fixed inset-0 bg-black bg-opacity-30" />
        
        <DialogPanel className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                {isFromTracker ? (
                  <ClockIcon className="w-5 h-5 text-green-600" />
                ) : isEditing ? (
                  <PencilIcon className="w-5 h-5 text-blue-600" />
                ) : (
                  <PlusIcon className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {isFromTracker ? 'Book Tracked Time' : 
                   isEditing ? 'Edit Time Entry' : 'Add Time Entry'}
                </DialogTitle>
                <p className="text-sm text-gray-500">
                  {isFromTracker ? 'Add description for your tracked time' :
                   isEditing ? 'Update your time entry details' : 'Manually add a new time entry'}
                </p>
              </div>
            </div>
            <button onClick={handleClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Show tracker info banner */}
          {isFromTracker && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Duration and timing will be calculated automatically from your tracker session
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={3}
                className={`form-input resize-none ${
                  errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder={isFromTracker ? "What did you work on during this tracked session?" : "What did you work on?"}
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

            {!isFromTracker && (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Duration Input Method
                  </label>
                  <button
                    type="button"
                    onClick={() => setDurationInputType(prev => prev === 'duration' ? 'times' : 'duration')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Switch to {durationInputType === 'duration' ? 'Start/End Times' : 'Direct Duration'}
                  </button>
                </div>

                {durationInputType === 'duration' ? (
                  <div className="form-group">
                    <label htmlFor="duration_hours" className="form-label">
                      Duration (Hours) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="duration_hours"
                      type="number"
                      step="0.25"
                      min="0"
                      max="24"
                      className={`form-input ${
                        errors.duration_seconds ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      placeholder="1.5"
                      value={secondsToHours(watch('duration_seconds') || 3600)}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value) || 0;
                        setValue('duration_seconds', hoursToSeconds(hours));
                      }}
                    />
                    {errors.duration_seconds && (
                      <p className="form-error">{errors.duration_seconds.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Enter duration in hours (e.g., 1.5 for 1 hour 30 minutes)
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="start_time" className="form-label">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="start_time"
                        type="datetime-local"
                        className={`form-input ${
                          errors.start_time ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
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
                        End Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="end_time"
                        type="datetime-local"
                        className={`form-input ${
                          errors.end_time ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        {...register('end_time', {
                          required: 'End time is required',
                        })}
                      />
                      {errors.end_time && (
                        <p className="form-error">{errors.end_time.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="project" className="form-label">
                  Project
                </label>
                <input
                  id="project"
                  type="text"
                  className="form-input"
                  placeholder="Project name"
                  {...register('project')}
                />
              </div>

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
                    <span>{isFromTracker ? 'Booking...' : isEditing ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    {isFromTracker ? (
                      <ClockIcon className="w-4 h-4" />
                    ) : isEditing ? (
                      <PencilIcon className="w-4 h-4" />
                    ) : (
                      <PlusIcon className="w-4 h-4" />
                    )}
                    <span>{isFromTracker ? 'Book Time' : isEditing ? 'Update Entry' : 'Create Entry'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> {isFromTracker 
                ? 'The duration and timing are automatically calculated from your tracker session.'
                : 'You can input duration directly (in hours) or use start/end times for automatic calculation.'
              }
            </p>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default TimeEntryModal;