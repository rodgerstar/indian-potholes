import { useState, useCallback } from 'react';

/**
 * Custom hook for pagination logic
 * @param {Object} options - Pagination options
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.itemsPerPage - Items per page (default: 9)
 * @returns {Object} Pagination state and handlers
 */
const usePagination = ({ initialPage = 1, itemsPerPage = 9 } = {}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /**
   * Handle page change with smooth scroll to top
   * @param {number} newPage - The new page number
   */
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  /**
   * Reset pagination to first page
   */
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Update pagination metadata from API response
   * @param {Object} paginationData - Pagination data from API
   */
  const updatePagination = useCallback((paginationData) => {
    if (paginationData) {
      setTotalPages(paginationData.totalPages || 1);
      setTotalItems(paginationData.totalItems || 0);
    }
  }, []);

  /**
   * Get pagination parameters for API calls
   * @returns {Object} Pagination parameters
   */
  const getPaginationParams = useCallback(() => ({
    page: currentPage,
    limit: itemsPerPage,
  }), [currentPage, itemsPerPage]);

  return {
    // State
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    
    // Actions
    handlePageChange,
    resetPagination,
    updatePagination,
    getPaginationParams,
    
    // Computed
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
  };
};

export default usePagination;