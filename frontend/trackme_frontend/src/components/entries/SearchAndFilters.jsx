import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  XMarkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const SearchAndFilters = ({ 
  searchQuery, 
  onSearch, 
  filters, 
  onFiltersChange 
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        onSearch(localSearchQuery);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, searchQuery, onSearch]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      start_date: '',
      end_date: '',
      booked_from_tracker: '',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setShowFilters(false);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== '');

  // Get date range presets
  const getDatePreset = (preset) => {
    const now = new Date();
    let start, end;

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        break;
      case 'this_week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        start = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        end = now;
        break;
      case 'last_week':
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        start = new Date(startOfLastWeek.getFullYear(), startOfLastWeek.getMonth(), startOfLastWeek.getDate());
        end = new Date(endOfLastWeek.getFullYear(), endOfLastWeek.getMonth(), endOfLastWeek.getDate(), 23, 59, 59);
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;
      default:
        return;
    }

    handleFilterChange('start_date', start.toISOString().split('T')[0]);
    handleFilterChange('end_date', end.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search descriptions, projects, or tags..."
            className="form-input pl-10 pr-4"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
          />
          {localSearchQuery && (
            <button
              onClick={() => {
                setLocalSearchQuery('');
                onSearch('');
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center space-x-2 ${
            hasActiveFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : ''
          }`}
        >
          <FunnelIcon className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-primary-100 text-primary-800 text-xs px-1.5 py-0.5 rounded-full">
              {Object.values(localFilters).filter(v => v !== '').length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Date Range Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                className="form-input"
                value={localFilters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                className="form-input"
                value={localFilters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entry Source
              </label>
              <select
                className="form-input"
                value={localFilters.booked_from_tracker}
                onChange={(e) => handleFilterChange('booked_from_tracker', e.target.value)}
              >
                <option value="">All Sources</option>
                <option value="true">Tracker Only</option>
                <option value="false">Manual Only</option>
              </select>
            </div>
          </div>

          {/* Date Presets */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Date Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'today', label: 'Today' },
                { key: 'yesterday', label: 'Yesterday' },
                { key: 'this_week', label: 'This Week' },
                { key: 'last_week', label: 'Last Week' },
                { key: 'this_month', label: 'This Month' },
              ].map(preset => (
                <button
                  key={preset.key}
                  onClick={() => getDatePreset(preset.key)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {hasActiveFilters && (
                <span>
                  {Object.values(localFilters).filter(v => v !== '').length} filter(s) applied
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !showFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          
          {localFilters.start_date && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              From: {new Date(localFilters.start_date).toLocaleDateString()}
              <button
                onClick={() => handleFilterChange('start_date', '')}
                className="ml-1 text-primary-600 hover:text-primary-800"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}

          {localFilters.end_date && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              To: {new Date(localFilters.end_date).toLocaleDateString()}
              <button
                onClick={() => handleFilterChange('end_date', '')}
                className="ml-1 text-primary-600 hover:text-primary-800"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}

          {localFilters.booked_from_tracker && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {localFilters.booked_from_tracker === 'true' ? 'Tracker Only' : 'Manual Only'}
              <button
                onClick={() => handleFilterChange('booked_from_tracker', '')}
                className="ml-1 text-primary-600 hover:text-primary-800"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;