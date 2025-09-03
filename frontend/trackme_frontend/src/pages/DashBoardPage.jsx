import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClockIcon, 
  DocumentTextIcon,
  PlusIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import TimeTracker from '../components/tracker/TimeTracker';
import api, { formatTime, formatDateTime } from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const [recentEntries, setRecentEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    todayTotal: 0,
    weekTotal: 0,
    totalEntries: 0,
  });

  useEffect(() => {
    loadRecentEntries();
    loadStats();
  }, []);

  const loadRecentEntries = async () => {
    try {
      const response = await api.timeEntries.getAll({ page_size: 5 });
      setRecentEntries(response.results || []);
    } catch (err) {
      console.error('Failed to load recent entries:', err);
    }
  };

  const loadStats = async () => {
    try {
      const allEntries = await api.timeEntries.getAll({ page_size: 100 });
      const entries = allEntries.results || [];

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const todayTotal = entries
        .filter(entry => new Date(entry.end_time) >= today)
        .reduce((sum, entry) => sum + entry.duration_seconds, 0);

      const weekTotal = entries
        .filter(entry => new Date(entry.end_time) >= weekAgo)
        .reduce((sum, entry) => sum + entry.duration_seconds, 0);

      setStats({
        todayTotal,
        weekTotal,
        totalEntries: entries.length,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadRecentEntries();
    loadStats();
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-50 to-indigo-50 rounded-2xl p-6 border border-primary-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.display_name}! 👋
            </h1>
            <p className="text-gray-600">
              Ready to track some productive time today?
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <ClockIcon className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(stats.todayTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(stats.weekTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalEntries}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Tracker */}
      <div>
        <TimeTracker onTimeBooked={refreshData} />
      </div>

      {/* Recent Entries Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Time Entries</h2>
              <p className="text-sm text-gray-500">Your latest tracked time</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              to="/time-entries"
              className="btn-secondary text-sm"
            >
              View All
            </Link>
            <button
              onClick={() => {/* TODO: Open manual entry modal */}}
              className="btn-primary text-sm flex items-center space-x-1"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-500">Loading recent entries...</p>
          </div>
        ) : recentEntries.length > 0 ? (
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {entry.description}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatDateTime(entry.end_time)}</span>
                    {entry.booked_from_tracker && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        From Tracker
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {entry.duration_display}
                  </p>
                </div>
              </div>
            ))}
            
            {recentEntries.length >= 5 && (
              <div className="text-center pt-4">
                <Link
                  to="/time-entries"
                  className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium"
                >
                  <span>View all entries</span>
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No time entries yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start tracking time with the timer above or add a manual entry
            </p>
            <button
              onClick={() => {/* TODO: Open manual entry modal */}}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Your First Entry
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/time-entries"
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all group"
          >
            <DocumentTextIcon className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900 group-hover:text-primary-600">
                View All Entries
              </h4>
              <p className="text-sm text-gray-500">Browse and manage your time logs</p>
            </div>
          </Link>

          <Link
            to="/profile"
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all group"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 group-hover:text-primary-600">
                Profile Settings
              </h4>
              <p className="text-sm text-gray-500">Update your account information</p>
            </div>
          </Link>

          <button
            onClick={refreshData}
            className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all group"
          >
            <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 group-hover:text-primary-600">
                Refresh Data
              </h4>
              <p className="text-sm text-gray-500">Update stats and recent entries</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;