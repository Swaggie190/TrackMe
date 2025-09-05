import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export const useTracker = () => {
  const [trackerState, setTrackerState] = useState({
    is_running: false,
    current_elapsed_seconds: 0,
    started_at: null,
    paused_at: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localSeconds, setLocalSeconds] = useState(0);

  const intervalRef = useRef(null);
  const syncIntervalRef = useRef(null);

  const loadTrackerStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const status = await api.tracker.getStatus();
      setTrackerState(status);
      setLocalSeconds(status.current_elapsed_seconds);
    } catch (err) {
      console.error('Failed to load tracker status:', err);
      setError('Failed to load tracker status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startLocalTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setLocalSeconds(prev => prev + 1);
    }, 1000);
  }, []);

  const stopLocalTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const syncWithServer = useCallback(async () => {
    try {
      const status = await api.tracker.getStatus();
      setTrackerState(status);
      setLocalSeconds(status.current_elapsed_seconds);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }, []);

  const startSyncInterval = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    syncIntervalRef.current = setInterval(syncWithServer, 30000); // Sync every 30 seconds
  }, [syncWithServer]);

  const stopSyncInterval = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  const startTracker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await api.tracker.start();
      setTrackerState(result.tracker);
      setLocalSeconds(result.tracker.current_elapsed_seconds);
    } catch (err) {
      console.error('Failed to start tracker:', err);
      setError('Failed to start tracker');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pauseTracker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await api.tracker.pause();
      setTrackerState(result.tracker);
      setLocalSeconds(result.tracker.current_elapsed_seconds);
    } catch (err) {
      console.error('Failed to pause tracker:', err);
      setError('Failed to pause tracker');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resumeTracker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await api.tracker.resume();
      setTrackerState(result.tracker);
      setLocalSeconds(result.tracker.current_elapsed_seconds);
    } catch (err) {
      console.error('Failed to resume tracker:', err);
      setError('Failed to resume tracker');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetTracker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await api.tracker.reset();
      setTrackerState(result.tracker);
      setLocalSeconds(0);
    } catch (err) {
      console.error('Failed to reset tracker:', err);
      setError('Failed to reset tracker');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (trackerState.is_running) {
      startLocalTimer();
      startSyncInterval();
    } else {
      stopLocalTimer();
      stopSyncInterval();
    }

    return () => {
      stopLocalTimer();
      stopSyncInterval();
    };
  }, [trackerState.is_running, startLocalTimer, stopLocalTimer, startSyncInterval, stopSyncInterval]);

  useEffect(() => {
    loadTrackerStatus();
  }, [loadTrackerStatus]);

  useEffect(() => {
    return () => {
      stopLocalTimer();
      stopSyncInterval();
    };
  }, [stopLocalTimer, stopSyncInterval]);
 
  const displaySeconds = trackerState.is_running ? localSeconds : trackerState.current_elapsed_seconds;

  return {

    trackerState,
    displaySeconds,
    isLoading,
    error,

    startTracker,
    pauseTracker,
    resumeTracker,
    resetTracker,
    loadTrackerStatus,
    clearError,

    syncWithServer,
  };
};

export default useTracker;