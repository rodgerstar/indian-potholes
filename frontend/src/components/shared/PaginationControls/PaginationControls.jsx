import React from 'react';
import { RiArrowLeftLine, RiArrowRightLine } from 'react-icons/ri';

/**
 * Reusable pagination controls component
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current page number
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Page change handler
 * @param {number} props.maxVisiblePages - Maximum visible page buttons (default: 5)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showInfo - Whether to show page info
 * @param {number} props.totalItems - Total number of items (for info display)
 * @param {number} props.itemsPerPage - Items per page (for info display)
 */
const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  className = "",
  showInfo = false,
  totalItems = 0,
  itemsPerPage = 0
}) => {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  /**
   * Generate page numbers to display
   * @returns {number[]} Array of page numbers
   */
  const getVisiblePages = () => {
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end based on current page
      let start, end;
      
      if (currentPage <= Math.ceil(maxVisiblePages / 2)) {
        // Near the beginning
        start = 1;
        end = maxVisiblePages;
      } else if (currentPage >= totalPages - Math.floor(maxVisiblePages / 2)) {
        // Near the end
        start = totalPages - maxVisiblePages + 1;
        end = totalPages;
      } else {
        // In the middle
        start = currentPage - Math.floor(maxVisiblePages / 2);
        end = currentPage + Math.floor(maxVisiblePages / 2);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  /**
   * Handle page change with validation
   * @param {number} newPage - New page number
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      onPageChange(newPage);
    }
  };

  const visiblePages = getVisiblePages();
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Calculate item range for info display
  const startItem = showInfo && itemsPerPage > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = showInfo && itemsPerPage > 0 ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  return (
    <div className={`gallery-pagination-modern ${className}`}>
      {/* Page Info */}
      {showInfo && totalItems > 0 && (
        <div className="pagination-info">
          Showing {startItem}-{endItem} of {totalItems} items
        </div>
      )}

      <div className="pagination-controls">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className="gallery-pagination-btn"
          aria-label="Previous page"
        >
          <RiArrowLeftLine />
          Previous
        </button>

        {/* First page if not visible */}
        {visiblePages[0] > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="gallery-pagination-btn"
            >
              1
            </button>
            {visiblePages[0] > 2 && (
              <span className="pagination-ellipsis">...</span>
            )}
          </>
        )}

        {/* Page Numbers */}
        <div className="pagination-pages">
          {visiblePages.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`gallery-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              aria-label={`Page ${pageNum}`}
              aria-current={currentPage === pageNum ? 'page' : undefined}
            >
              {pageNum}
            </button>
          ))}
        </div>

        {/* Last page if not visible */}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="pagination-ellipsis">...</span>
            )}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="gallery-pagination-btn"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="gallery-pagination-btn"
          aria-label="Next page"
        >
          Next
          <RiArrowRightLine />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;