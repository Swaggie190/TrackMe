import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClockIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  PlusIcon,
  ArrowPathIcon,
  ChartBarIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../components/common/Notifications';
import Tracker from '../tracker/Tracker';
import TimeEntryModal from '../components/entries/TimeEntryModal';
import api, { formatTime, formatDateTime } from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const notifications = useNotifications();

  // State for dashboard data
  const [stats, setStats] = useState({
    total_entries: 0,
    total_hours: 0,
    this_week_hours: 0,
    this_month_hours: 0,
    avg_session_duration: 0,
  });
  
  const [recentEntries, setRecentEntries] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Time entry modal state
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [timeEntryData, setTimeEntryData] = useState(null);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoadingData(true);
      
      // Load stats and recent entries in parallel
      const [statsResponse, entriesResponse] = await Promise.all([
        api.stats.getDashboardStats(),
        api.timeEntries.getAll({ page: 1, page_size: 5 }) // Get 5 most recent
      ]);

      setStats(statsResponse);
      setRecentEntries(entriesResponse.results || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      notifications.error('Failed to load dashboard data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const refreshData = async () => {
    notifications.info('Refreshing dashboard data...');
    await loadDashboardData();
    notifications.success('Dashboard data updated');
  };

  // Handle booking time from tracker
  const handleBookTime = (trackerData) => {
    setTimeEntryData(trackerData);
    setShowTimeEntryModal(true);
  };

  // Handle successful time entry creation
  const handleTimeEntrySuccess = async () => {
    setShowTimeEntryModal(false);
    setTimeEntryData(null);
    
    // Refresh dashboard data to show the new entry
    await loadDashboardData();
    notifications.success('Time entry saved successfully');
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {user?.display_name || 'there'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Ready to track your time? Let's make today productive.
            </p>
          </div>
          
          <button
            onClick={refreshData}
            disabled={isLoadingData}
            className="btn-secondary flex items-center"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Timer */}
        <div className="lg:col-span-2">
          <Tracker onBookTime={handleBookTime} />
        </div>

        {/* Right Column - Quick Stats */}
        <div className="space-y-6">
          {/* Today's Progress */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Progress</h3>
              <ChartBarIcon className="w-5 h-5 text-primary-600" />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Time Tracked</span>
                <span className="font-semibold text-primary-600">
                  {formatTime(stats.today_seconds || 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Entries Created</span>
                <span className="font-semibold text-gray-900">
                  {stats.today_entries || 0}
                </span>
              </div>

              {/* Progress bar for daily goal (assuming 8 hours) */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Daily Goal Progress</span>
                  <span>{Math.round(((stats.today_seconds || 0) / (8 * 3600)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(((stats.today_seconds || 0) / (8 * 3600)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setTimeEntryData({ booked_from_tracker: false });
                  setShowTimeEntryModal(true);
                }}
                className="w-full flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition-colors group"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary-200">
                  <PlusIcon className="w-4 h-4 text-primary-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-primary-700">Add Manual Entry</h4>
                  <p className="text-xs text-primary-600">Book time without using the tracker</p>
                </div>
              </button>

              <Link
                to="/time-entries"
                className="w-full flex items-center p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200">
                  <DocumentTextIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-700">View All Entries</h4>
                  <p className="text-xs text-gray-500">Search and manage your time entries</p>
                </div>
              </Link>

              <Link
                to="/profile"
                className="w-full flex items-center p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-gray-200">
                  <UserIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-700">Profile Settings</h4>
                  <p className="text-xs text-gray-500">Update your account information</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoadingData ? '...' : stats.total_entries}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <ClockIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoadingData ? '...' : `${Math.round((stats.this_week_hours || 0) * 10) / 10}h`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <CalendarDaysIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoadingData ? '...' : `${Math.round((stats.this_month_hours || 0) * 10) / 10}h`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <PlayIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoadingData ? '...' : formatTime(stats.avg_session_duration || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Time Entries</h2>
          <Link to="/time-entries" className="btn-secondary text-sm">
            View All
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoadingData ? (
            <div className="p-8 text-center">
              <div className="loading-spinner mx-auto mb-2"></div>
              <p className="text-gray-500">Loading recent entries...</p>
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="p-8 text-center">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your time to see entries here</p>
              <button
                onClick={() => {
                  setTimeEntryData({ booked_from_tracker: false });
                  setShowTimeEntryModal(true);
                }}
                className="btn-primary"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create First Entry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {entry.description}
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {entry.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{entry.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-primary-600">
                          {formatTime(entry.duration_seconds)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(entry.end_time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.booked_from_tracker 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {entry.booked_from_tracker ? 'Tracker' : 'Manual'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Time Entry Modal */}
      <TimeEntryModal
        isOpen={showTimeEntryModal}
        onClose={() => {
          setShowTimeEntryModal(false);
          setTimeEntryData(null);
        }}
        onSuccess={handleTimeEntrySuccess}
        entry={null}
        initialData={timeEntryData}
      />
    </div>
  );
};

export default DashboardPage;