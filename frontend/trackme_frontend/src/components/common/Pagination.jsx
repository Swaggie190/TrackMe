import React from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon 
} from '@heroicons/react/24/outline';

const Pagination = ({ 
  currentPage, 
  totalCount, 
  pageSize, 
  onPageChange,
  showSizeSelector = false,
  onPageSizeChange,
  className = ''
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  
  if (totalPages <= 1) return null;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      const startPages = [1, 2];
      const endPages = [totalPages - 1, totalPages];
      const middleStart = Math.max(3, currentPage - 1);
      const middleEnd = Math.min(totalPages - 2, currentPage + 1);

      pages.push(...startPages);
      
      if (middleStart > 3) {
        pages.push('...');
      }
      
      for (let i = middleStart; i <= middleEnd; i++) {
        if (i > 2 && i < totalPages - 1) {
          pages.push(i);
        }
      }
      
      if (middleEnd < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(...endPages);
    }
    
    return [...new Set(pages)]; // Remove duplicates
  };

  const pageNumbers = getPageNumbers();

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const goToPrevious = () => goToPage(currentPage - 1);
  const goToNext = () => goToPage(currentPage + 1);
  const goToFirst = () => goToPage(1);
  const goToLast = () => goToPage(totalPages);

  // Calculate showing range
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Results Info */}
      <div className="text-sm text-gray-700">
        Showing <span className="font-semibold">{startItem}</span> to{' '}
        <span className="font-semibold">{endItem}</span> of{' '}
        <span className="font-semibold">{totalCount}</span> results
      </div>

      {/* Page Size Selector */}
      {showSizeSelector && onPageSizeChange && (
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-700">Show:</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center space-x-1">
        {/* First Page */}
        <button
          onClick={goToFirst}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title="First page"
        >
          <ChevronDoubleLeftIcon className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          onClick={goToPrevious}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title="Previous page"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500"
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = page === currentPage;
            
            return (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isCurrentPage
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={goToNext}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title="Next page"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          onClick={goToLast}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title="Last page"
        >
          <ChevronDoubleRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;