import React, { useState, useEffect } from 'react';
import { mpMlaContributionAPI } from '../services/mpMlaContributionApi.js';
import AccessibleButton from '../components/AccessibleButton';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  RiUserLine,
  RiMailLine,
  RiTwitterLine,
  RiMapPinLine,
  RiCheckLine,
  RiCloseLine,
  RiEyeLine,
  RiFilterLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiGovernmentLine,
  RiFileTextLine,
  RiDeleteBinLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import '../styles/components/mp-mla-moderation.css';
import { useAuth } from '../context/AuthContext';

const MPMLAModeration = () => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState({});
  const [filters, setFilters] = useState({ type: '', state: '', status: 'pending' });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [editData, setEditData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchContributions();
  }, [pagination.currentPage, filters]);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: 10,
        ...filters
      };
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });
      let response;
      if (filters.status && filters.status !== 'pending') {
        response = await mpMlaContributionAPI.getAllContributions(params);
      } else {
        response = await mpMlaContributionAPI.getPendingContributions(params);
      }
      if (response.success) {
        setContributions(response.data.contributions);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.pagination.pages,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch contributions');
      console.error('Fetch contributions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationClick = (contribution, action) => {
    setSelectedContribution(contribution);
    setConfirmAction(action);
    setModerationNotes('');
    setShowConfirmModal(true);
  };

  const handleModeration = async () => {
    if (!selectedContribution || !confirmAction) return;
    try {
      setModerating(prev => ({ ...prev, [selectedContribution._id]: true }));
      await mpMlaContributionAPI.moderateContribution(
        selectedContribution._id,
        confirmAction,
        moderationNotes
      );
      toast.success(`Contribution ${confirmAction} successfully`);
      setContributions(prev =>
        prev.filter(contrib => contrib._id !== selectedContribution._id)
      );
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }));
    } catch (error) {
      toast.error(`Failed to ${confirmAction} contribution`);
      console.error('Moderation error:', error);
    } finally {
      setModerating(prev => ({ ...prev, [selectedContribution._id]: false }));
      setShowConfirmModal(false);
      setSelectedContribution(null);
      setConfirmAction(null);
      setModerationNotes('');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  // Edit and re-approve rejected contribution
  const handleEditClick = (contribution) => {
    setEditingId(contribution._id);
    setEditData({
      representativeName: contribution.representativeName,
      email: contribution.email || '',
      twitterHandle: contribution.twitterHandle || ''
    });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async (contribution) => {
    try {
      setModerating(prev => ({ ...prev, [contribution._id]: true }));
      await mpMlaContributionAPI.editRejectedContribution(contribution._id, editData);
      toast.success('Contribution updated. You can now re-approve it.');
      setEditingId(null);
      fetchContributions();
    } catch (error) {
      toast.error('Failed to update contribution');
    } finally {
      setModerating(prev => ({ ...prev, [contribution._id]: false }));
    }
  };

  const handleDeleteClick = (contribution) => {
    setDeletingId(contribution._id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      setModerating(prev => ({ ...prev, [deletingId]: true }));
      await mpMlaContributionAPI.deleteContribution(deletingId);
      toast.success('Contribution deleted');
      setContributions(prev => prev.filter(contrib => contrib._id !== deletingId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (error) {
      toast.error('Failed to delete contribution');
    } finally {
      setModerating(prev => ({ ...prev, [deletingId]: false }));
      setShowDeleteModal(false);
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mp-mla-moderation">
        <div className="mp-mla-loading-state">
          <div className="mp-mla-loading-spinner"></div>
          <span className="mp-mla-loading-text">Loading contributions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-mla-moderation">
      {/* Header */}
      <div className="mp-mla-moderation-header">
        <h2 className="mp-mla-moderation-title">
          <RiGovernmentLine className="mp-mla-moderation-icon" />
          MP/MLA Data Moderation
        </h2>
        <div className="mp-mla-moderation-count">
          {pagination.total} contributions
        </div>
      </div>

      {/* Filters */}
      <div className="mp-mla-filters">
        <div className="mp-mla-filters-header">
          <RiFilterLine className="mp-mla-filters-icon" />
          <span>Filters</span>
        </div>
        <div className="mp-mla-filters-grid">
          <div className="mp-mla-filter-group">
            <label className="mp-mla-filter-label">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="mp-mla-filter-select"
            >
              <option value="">All Types</option>
              <option value="MP">MP</option>
              <option value="MLA">MLA</option>
            </select>
          </div>
          <div className="mp-mla-filter-group">
            <label className="mp-mla-filter-label">State</label>
            <input
              type="text"
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              placeholder="Filter by state"
              className="mp-mla-filter-input"
            />
          </div>
          <div className="mp-mla-filter-group">
            <label className="mp-mla-filter-label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="mp-mla-filter-select"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contributions List */}
      <div className="mp-mla-contributions-list">
        {contributions.length === 0 ? (
          <div className="mp-mla-empty-state">
            <RiFileTextLine className="mp-mla-empty-icon" />
            <h3 className="mp-mla-empty-title">No contributions</h3>
            <p className="mp-mla-empty-message">No contributions found for the selected filter.</p>
          </div>
        ) : (
          contributions.map((contribution) => (
            <div key={contribution._id} className="mp-mla-contribution-card">
              {/* Header */}
              <div className="mp-mla-contribution-header">
                <div className="mp-mla-contribution-meta">
                  <div className="mp-mla-contribution-badges">
                    <span className={`mp-mla-type-badge ${contribution.type.toLowerCase()}`}>
                      {contribution.type}
                    </span>
                    <span className="mp-mla-contribution-date">
                      {new Date(contribution.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className={`mp-mla-status-badge status-${contribution.status}`}>{contribution.status}</span>
                  </div>
                  <div className="mp-mla-contribution-actions">
                    {contribution.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="mp-mla-action-button approve"
                          onClick={() => handleModerationClick(contribution, 'approved')}
                          disabled={moderating[contribution._id]}
                        >
                          <RiCheckLine />
                          Approve
                        </button>
                        <button
                          type="button"
                          className="mp-mla-action-button reject"
                          onClick={() => handleModerationClick(contribution, 'rejected')}
                          disabled={moderating[contribution._id]}
                        >
                          <RiCloseLine />
                          Reject
                        </button>
                      </>
                    )}
                    {contribution.status === 'rejected' && user?.role === 'admin' && (
                      <>
                        {editingId === contribution._id ? (
                          <>
                            <button
                              type="button"
                              className="mp-mla-action-button save"
                              onClick={() => handleEditSave(contribution)}
                              disabled={moderating[contribution._id]}
                            >
                              <RiCheckLine /> Save & Re-Approve
                            </button>
                            <button
                              type="button"
                              className="mp-mla-action-button cancel"
                              onClick={() => setEditingId(null)}
                            >
                              <RiCloseLine /> Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="mp-mla-action-button edit"
                            onClick={() => handleEditClick(contribution)}
                          >
                            <RiEyeLine /> Edit & Re-Approve
                          </button>
                        )}
                      </>
                    )}
                    {user?.role === 'admin' && (
                      <button
                        type="button"
                        className="mp-mla-action-button delete"
                        onClick={() => handleDeleteClick(contribution)}
                        disabled={moderating[contribution._id]}
                      >
                        <RiDeleteBinLine /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="mp-mla-location-info">
                <div className="mp-mla-location-header">
                  <RiMapPinLine className="mp-mla-location-icon" />
                  <span className="mp-mla-location-text">
                    {contribution.state} - {contribution.constituency}
                  </span>
                </div>
              </div>

              {/* Data Comparison */}
              <div className="mp-mla-comparison">
                {/* Current Data */}
                <div className="mp-mla-comparison-section current">
                  <h4 className="mp-mla-comparison-title current">Current Data</h4>
                  {contribution.currentData ? (
                    <div className="mp-mla-comparison-content current">
                      <p><strong>Name:</strong> {contribution.type === 'MP' ? contribution.currentData.mp_name : contribution.currentData.mla}</p>
                      {contribution.type === 'MP' && contribution.currentData.email && contribution.currentData.email.length > 0 && (
                        <p><strong>Email:</strong> {contribution.currentData.email[0]}</p>
                      )}
                      {contribution.type === 'MP' && contribution.currentData.mp_political_party && (
                        <p><strong>Party:</strong> {contribution.currentData.mp_political_party}</p>
                      )}
                      {contribution.type === 'MLA' && contribution.currentData.party && (
                        <p><strong>Party:</strong> {contribution.currentData.party}</p>
                      )}
                    </div>
                  ) : (
                    <p className="mp-mla-comparison-content current mp-mla-no-data">No current data found</p>
                  )}
                </div>

                {/* Proposed Data or Edit Form */}
                <div className="mp-mla-comparison-section proposed">
                  <h4 className="mp-mla-comparison-title proposed">Proposed Changes</h4>
                  <div className="mp-mla-comparison-content proposed">
                    {editingId === contribution._id ? (
                      <>
                        <label>
                          <strong>Name:</strong>
                          <input
                            type="text"
                            value={editData.representativeName}
                            onChange={e => handleEditChange('representativeName', e.target.value)}
                            className="mp-mla-edit-input"
                          />
                        </label>
                        <label>
                          <strong>Email:</strong>
                          <input
                            type="email"
                            value={editData.email}
                            onChange={e => handleEditChange('email', e.target.value)}
                            className="mp-mla-edit-input"
                          />
                        </label>
                        <label>
                          <strong>Twitter:</strong>
                          <input
                            type="text"
                            value={editData.twitterHandle}
                            onChange={e => handleEditChange('twitterHandle', e.target.value)}
                            className="mp-mla-edit-input"
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <p><strong>Name:</strong> {contribution.representativeName}</p>
                        {contribution.email && (
                          <p><strong>Email:</strong> {contribution.email}</p>
                        )}
                        {contribution.twitterHandle && (
                          <p><strong>Twitter:</strong> @{contribution.twitterHandle}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Submission Details */}
              <div className="mp-mla-submission-details">
                <div className="mp-mla-submission-details-content">
                  <p><strong>Submitted from:</strong> {contribution.submittedBy?.ip || 'Unknown'}</p>
                  <p><strong>User Agent:</strong> {contribution.submittedBy?.userAgent ?
                    contribution.submittedBy.userAgent.substring(0, 60) + '...' : 'Unknown'}</p>
                </div>
              </div>

              {/* Moderation Details for rejected */}
              {contribution.status === 'rejected' && contribution.moderatedBy && (
                <div className="mp-mla-rejection-reason">
                  <strong>Rejection Reason:</strong> {contribution.moderatedBy.notes || 'No reason provided.'}
                  <br />
                  <small>Rejected by: {contribution.moderatedBy.userId || 'Admin'} on {contribution.moderatedBy.moderatedAt ? new Date(contribution.moderatedBy.moderatedAt).toLocaleString() : ''}</small>
                </div>
              )}

              {moderating[contribution._id] && (
                <div className="mp-mla-processing">
                  <div className="mp-mla-processing-spinner"></div>
                  Processing...
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mp-mla-pagination">
          <button
            type="button"
            className="mp-mla-pagination-button"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage <= 1}
          >
            <RiArrowLeftLine />
          </button>
          <span className="mp-mla-pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className="mp-mla-pagination-button"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages}
          >
            <RiArrowRightLine />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleModeration}
        title={`${confirmAction === 'approved' ? 'Approve' : 'Reject'} Contribution`}
        message={
          <div className="space-y-4">
            <p>
              Are you sure you want to {confirmAction === 'approved' ? 'approve' : 'reject'} this contribution?
            </p>
            {selectedContribution && (
              <div className="bg-gray-50 p-3 rounded">
                <p><strong>Type:</strong> {selectedContribution.type}</p>
                <p><strong>Location:</strong> {selectedContribution.state} - {selectedContribution.constituency}</p>
                <p><strong>Representative:</strong> {selectedContribution.representativeName}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                placeholder="Add any notes about this moderation decision..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {moderationNotes.length}/500 characters
              </p>
            </div>
          </div>
        }
        confirmText={confirmAction === 'approved' ? 'Approve' : 'Reject'}
        confirmVariant={confirmAction === 'approved' ? 'success' : 'danger'}
      />
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Contribution"
        message="Are you sure you want to delete this contribution? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default MPMLAModeration;
