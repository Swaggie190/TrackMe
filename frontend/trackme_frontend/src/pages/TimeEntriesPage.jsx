import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import api, { formatTime, formatDateTime } from '../services/api';
import { useNotifications } from '../components/common/Notifications';
import TimeEntryModal from '../components/entries/TimeEntryModal';
import SearchAndFilters from '../components/entries/SearchAndFilters';
import Pagination from '../components/common/Pagination';

const TimeEntriesPage = () => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    booked_from_tracker: '',
  });

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);

  const notifications = useNotifications();

  useEffect(() => {
    loadEntries();
  }, [currentPage, searchQuery, filters]);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      
      const params = {
        page: currentPage,
        page_size: pageSize,
        q: searchQuery || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      };

      if (filters.booked_from_tracker !== '') {
        params.booked_from_tracker = filters.booked_from_tracker === 'true';
      }

      const response = await api.timeEntries.getAll(params);
      setEntries(response.results || []);
      setTotalCount(response.count || 0);
    } catch (error) {
      console.error('Failed to load entries:', error);
      notifications.error('Failed to load time entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setShowEntryModal(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowEntryModal(true);
  };

  const handleDeleteEntry = async (entry) => {
    if (!window.confirm(`Are you sure you want to delete the entry "${entry.description}"?`)) {
      return;
    }

    try {
      await api.timeEntries.delete(entry.id);
      notifications.success('Time entry deleted successfully');
      loadEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      notifications.error('Failed to delete time entry');
    }
  };

  const handleModalSuccess = () => {
    setShowEntryModal(false);
    setEditingEntry(null);
    loadEntries(); 
    notifications.success(
      editingEntry ? 'Time entry updated successfully' : 'Time entry created successfully'
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTotalStats = () => {
    const totalSeconds = entries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
    const avgSeconds = entries.length > 0 ? totalSeconds / entries.length : 0;
    
    return {
      total: formatTime(totalSeconds),
      average: formatTime(Math.round(avgSeconds)),
      count: entries.length,
    };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Entries</h1>
          <p className="text-gray-600 mt-1">
            Manage and review your tracked time
          </p>
        </div>
        <button
          onClick={handleAddEntry}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Entry</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average</p>
              <p className="text-2xl font-bold text-gray-900">{stats.average}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TagIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        searchQuery={searchQuery}
        onSearch={handleSearch}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Entries */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Your Time Entries
            </h2>
            <p className="text-sm text-gray-500">
              Showing {entries.length} of {totalCount} entries
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-500">Loading time entries...</p>
          </div>
        ) : entries.length > 0 ? (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {entry.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-semibold text-gray-900">
                          {entry.duration_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(entry.end_time)}
                      </td>
                      <td className="px-6 py-4">
                        {entry.booked_from_tracker ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            Tracker
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="Edit entry"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry)}
                            className="text-danger-600 hover:text-danger-900 p-1"
                            title="Delete entry"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 pr-2">
                      {entry.description}
                    </h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="text-primary-600 hover:text-primary-900 p-1"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry)}
                        className="text-danger-600 hover:text-danger-900 p-1"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="font-mono font-semibold text-gray-900">
                        {entry.duration_display}
                      </span>
                      {entry.booked_from_tracker ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          Tracker
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Manual
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500">
                      {formatDateTime(entry.end_time)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalCount > pageSize && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No time entries found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters'
                : 'Start tracking time or add a manual entry to get started'
              }
            </p>
            <button
              onClick={handleAddEntry}
              className="btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Your First Entry
            </button>
          </div>
        )}
      </div>

      {/* Time Entry Modal */}
      {showEntryModal && (
        <TimeEntryModal
          isOpen={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          onSuccess={handleModalSuccess}
          entry={editingEntry}
        />
      )}
    </div>
  );
};

export default TimeEntriesPage;