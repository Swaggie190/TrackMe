import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useTracker } from '../hooks/useTracker';
import { useNotifications } from './common/Notifications';
import { formatTime } from '../services/api';

const Tracker = ({ onBookTime }) => {
  const {
    trackerState,
    localSeconds,
    isLoading,
    error,
    start,
    pause,
    resume,
    reset,
    loadTrackerStatus
  } = useTracker();

  const [actionLoading, setActionLoading] = useState(null);
  const notifications = useNotifications();

  // Load initial status on mount
  useEffect(() => {
    loadTrackerStatus();
  }, [loadTrackerStatus]);

  // Show error notifications
  useEffect(() => {
    if (error) {
      notifications.error(error);
    }
  }, [error, notifications]);

  const handleStart = async () => {
    setActionLoading('start');
    try {
      await start();
      notifications.success('Timer started');
    } catch (err) {
      notifications.error('Failed to start timer');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async () => {
    setActionLoading('pause');
    try {
      await pause();
      notifications.success('Timer paused');
    } catch (err) {
      notifications.error('Failed to pause timer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    setActionLoading('resume');
    try {
      await resume();
      notifications.success('Timer resumed');
    } catch (err) {
      notifications.error('Failed to resume timer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReset = async () => {
    if (localSeconds > 0 && !window.confirm('Are you sure you want to reset the timer? This will clear all tracked time.')) {
      return;
    }

    setActionLoading('reset');
    try {
      await reset();
      notifications.success('Timer reset');
    } catch (err) {
      notifications.error('Failed to reset timer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookTime = () => {
    if (localSeconds === 0) {
      notifications.warning('No time to book. Start the timer first.');
      return;
    }
    
    // Call parent function to open time entry modal
    onBookTime({
      duration_seconds: localSeconds,
      booked_from_tracker: true,
    });
  };

  if (isLoading && !trackerState.is_running) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="loading-spinner mr-2"></div>
          <span className="text-gray-600">Loading tracker...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-2">
          <ClockIcon className="w-6 h-6 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Time Tracker</h2>
        </div>
        <p className="text-gray-500 text-sm">
          {trackerState.is_running ? 'Timer is running' : 
           trackerState.paused_at ? 'Timer is paused' : 'Ready to start tracking'}
        </p>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className={`timer-display ${trackerState.is_running ? 'text-primary-600 animate-timer' : 'text-gray-900'}`}>
          {formatTime(localSeconds)}
        </div>
        {trackerState.is_running && (
          <div className="flex items-center justify-center mt-2">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse mr-2"></div>
            <span className="text-sm text-primary-600 font-medium">Recording</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Primary Action Button */}
        <div className="flex justify-center">
          {!trackerState.is_running ? (
            <button
              onClick={trackerState.paused_at ? handleResume : handleStart}
              disabled={actionLoading === 'start' || actionLoading === 'resume'}
              className="btn-primary flex items-center px-8 py-3 text-lg"
            >
              {actionLoading === 'start' || actionLoading === 'resume' ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  {trackerState.paused_at ? 'Resuming...' : 'Starting...'}
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 mr-2" />
                  {trackerState.paused_at ? 'Resume' : 'Start'}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handlePause}
              disabled={actionLoading === 'pause'}
              className="btn-secondary flex items-center px-8 py-3 text-lg border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {actionLoading === 'pause' ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Pausing...
                </>
              ) : (
                <>
                  <PauseIcon className="w-5 h-5 mr-2" />
                  Pause
                </>
              )}
            </button>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="flex justify-center space-x-3">
          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={actionLoading === 'reset'}
            className="btn-secondary flex items-center px-4 py-2"
            title="Reset timer to zero"
          >
            {actionLoading === 'reset' ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Resetting...
              </>
            ) : (
              <>
                <StopIcon className="w-4 h-4 mr-2" />
                Reset
              </>
            )}
          </button>

          {/* Book Time Button */}
          <button
            onClick={handleBookTime}
            disabled={localSeconds === 0}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              localSeconds > 0
                ? 'bg-success-600 text-white hover:bg-success-700 focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Book the tracked time as an entry"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Book Time
          </button>
        </div>
      </div>

      {/* Status Info */}
      {(trackerState.started_at || localSeconds > 0) && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500 space-y-1">
            {trackerState.started_at && (
              <div>
                Started: {new Date(trackerState.started_at).toLocaleTimeString()}
              </div>
            )}
            {trackerState.paused_at && (
              <div>
                Paused: {new Date(trackerState.paused_at).toLocaleTimeString()}
              </div>
            )}
            {localSeconds > 0 && (
              <div className="font-medium text-gray-700">
                Total: {formatTime(localSeconds)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;