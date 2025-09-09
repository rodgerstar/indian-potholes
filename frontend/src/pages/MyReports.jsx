import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { potholeAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ResponsiveContainer from '../components/ResponsiveContainer';
import AccessibleButton from '../components/AccessibleButton';
import ConfirmationModal from '../components/ConfirmationModal';
import DetailsModal from '../components/DetailsModal';
import PotholeCard from '../components/shared/PotholeCard';
import FilterControls from '../components/shared/FilterControls';
import PaginationControls from '../components/shared/PaginationControls';
import usePagination from '../hooks/usePagination';
import useModal from '../hooks/useModal';
import { 
  RiMapPinLine, 
  RiFileTextLine,
  RiGridLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';

/**
 * MyReports Component - User's personal pothole reports
 * TODO: Consider extracting report card logic to shared component
 * FIXME: Some duplicate logic with Gallery component for handling reports
 */
const MyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [viewMode, setViewMode] = useState('grid');
  const [currentMediaIndices, setCurrentMediaIndices] = useState({});

  // Use custom hooks
  const pagination = usePagination({ itemsPerPage: 12 });
  const confirmModal = useModal();
  const detailsModal = useModal();

  // Filter options configuration
  const filterOptions = {
    statusOptions: [
      { value: 'all', label: 'All Status' },
      { value: 'reported', label: 'Reported' },
      { value: 'acknowledged', label: 'Acknowledged' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'resolved', label: 'Resolved' }
    ]
  };

  useEffect(() => {
    fetchMyReports();
  }, [pagination.currentPage, filters]);

  /**
   * Fetch user's reports from API
   */
  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const response = await potholeAPI.getMyReports({
        ...pagination.getPaginationParams(),
        status: filters.status === 'all' ? undefined : filters.status,
        search: filters.search || undefined
      });
      
      if (response.success) {
        // Treat rejected reports as deleted in user view
        const filtered = (response.data.potholes || []).filter(r => r.approvalStatus !== 'rejected');
        setReports(filtered);
        pagination.updatePagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load your reports');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    pagination.resetPagination();
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = (reportId) => {
    confirmModal.openModal(reportId);
  };

  /**
   * Handle confirmed delete
   */
  const handleConfirmDelete = async () => {
    const reportId = confirmModal.modalData;
    confirmModal.closeModal();
    
    if (!reportId) return;
    
    try {
      await potholeAPI.delete(reportId);
      toast.success('Report deleted successfully');
      fetchMyReports();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  // Helper functions for display formatting (TODO: move to utils)
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && reports.length === 0) {
    return <LoadingSpinner text="Loading your reports..." />;
  }

  return (
    <ResponsiveContainer maxWidth="7xl" className="reports-container-modern">
      <div className="reports-content-modern">
        {/* Header Section */}
        <div className="reports-header">
          <h1 className="reports-title">
            <RiFileTextLine className="title-icon" />
            My Reports
          </h1>
          <p className="reports-subtitle">
            Manage and track your pothole reports
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="controls-section">
          <FilterControls
            filters={filters}
            onFilterChange={handleFilterChange}
            options={filterOptions}
            searchPlaceholder="Search by location..."
          />

          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <RiGridLine />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <RiFileTextLine />
            </button>
          </div>
        </div>

        {/* Reports Content */}
        {reports.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-illustration">
              <RiMapPinLine className="empty-icon-large" />
            </div>
            <h3 className="empty-title-modern">No reports found</h3>
            <p className="empty-description-modern">
              {filters.status === 'all' 
                ? "You haven't submitted any reports yet. Start making a difference in your community!" 
                : `No reports found with status: ${filters.status}`}
            </p>
            <AccessibleButton
              href="/upload"
              size="lg"
              className="empty-cta-modern"
            >
              Report a Pothole
            </AccessibleButton>
          </div>
        ) : (
          <>
            {/* Reports Grid */}
            <div className={`reports-grid-modern ${viewMode}`}>
              {reports.map((report) => (
                <PotholeCard
                  key={report._id}
                  pothole={report}
                  onUpvote={null} // No upvoting on own reports
                  isAuthenticated={true}
                  user={user}
                  onView={detailsModal.openModal}
                  onDelete={handleDeleteClick}
                  viewMode={viewMode}
                  onShare={null} // TODO: Add share functionality
                />
              ))}
            </div>

            {/* Pagination */}
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.handlePageChange}
              showInfo={true}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
            />
          </>
        )}

        {/* Modals */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={confirmModal.closeModal}
          onConfirm={handleConfirmDelete}
          message="Are you sure you want to delete this report? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
        />

        <DetailsModal
          isOpen={detailsModal.isOpen}
          onClose={detailsModal.closeModal}
          report={detailsModal.modalData}
        />
      </div>
    </ResponsiveContainer>
  );
};
export default MyReports; 
