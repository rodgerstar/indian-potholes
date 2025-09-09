import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { potholeAPI } from '../services/api';
import { RiMapPinLine, RiCalendarLine, RiUserLine, RiThumbUpLine, RiArrowLeftLine, RiArrowRightLine, RiImageLine, RiVideoLine, RiShieldCheckLine, RiShareLine, RiAlertLine, RiFileTextLine, RiErrorWarningLine } from 'react-icons/ri';
import ShareButton from '../components/ShareButton';
import ShareModal from '../components/ShareModal';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/pages/report-details-modern.css';

const getStatusColor = (status) => {
  const colors = {
    reported: 'status-reported',
    acknowledged: 'status-acknowledged',
    in_progress: 'status-in-progress',
    resolved: 'status-resolved'
  };
  return colors[status] || colors.reported;
};

const getStatusText = (status) => {
  const statusMap = {
    reported: 'Reported',
    acknowledged: 'Acknowledged',
    in_progress: 'In Progress',
    resolved: 'Resolved'
  };
  return statusMap[status] || 'Reported';
};

const getSeverityColor = (severity) => {
  const colors = {
    low: 'severity-low',
    medium: 'severity-medium',
    high: 'severity-high',
    critical: 'severity-critical'
  };
  return colors[severity] || colors.medium;
};

const getSeverityText = (severity) => {
  const severityMap = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
  };
  return severityMap[severity] || 'Medium';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ReportDetailsModern = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await potholeAPI.getById(id);
        setReport(response.data.pothole);
        setError(null);
      } catch (err) {
        setError('Report not found');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  // Reset video error when media index changes
  useEffect(() => {
    setVideoError(false);
  }, [currentMediaIndex]);

  /**
   * Handle video error
   */
  const handleVideoError = () => {
    setVideoError(true);
  };

  /**
   * Handle video load success
   */
  const handleVideoLoad = () => {
    setVideoError(false);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (loading) return <LoadingSpinner text="Loading report..." />;
  if (error) return (
    <div className="not-found-page">
      <h2>Report Not Found</h2>
      <p>The report you are looking for does not exist.</p>
      <button className="btn btn-primary" onClick={() => navigate('/gallery')}>Back to Gallery</button>
    </div>
  );

  const media = report.media || [];
  const authorities = report.authorities || {};

  return (
    <div className="report-details-modern-page">
      <div className="report-details-modern-container">
        <div className="report-details-modern-card">
          {/* Header with Back Button */}
          <div className="report-page-header">
            <button className="back-btn" onClick={() => navigate('/gallery')} title="Back to Gallery">
              <RiArrowLeftLine />
              <span>Back to Gallery</span>
            </button>
            <div className={`status-badge-large ${getStatusColor(report.status)}`}>
              <RiShieldCheckLine className="status-icon" />
              {getStatusText(report.status)}
            </div>
          </div>

          {/* Media Carousel */}
          {media.length > 0 && (
            <div className="report-media-carousel">
              <div className="media-main-preview">
                {media[currentMediaIndex].type === 'video' ? (
                  videoError ? (
                    <div className="video-error-fallback-details">
                      <RiErrorWarningLine className="error-icon" />
                      <span className="error-text">Video not supported</span>
                    </div>
                  ) : (
                    <video 
                      src={media[currentMediaIndex].url} 
                      controls 
                      className="media-main" 
                      poster="/api/placeholder/600/400"
                      onError={handleVideoError}
                      onLoadedData={handleVideoLoad}
                      preload="metadata"
                    />
                  )
                ) : (
                  <img src={media[currentMediaIndex].url} alt="Pothole Report" className="media-main" decoding="async" />
                )}
                {media.length > 1 && (
                  <>
                    <button className="media-nav-btn prev" onClick={() => setCurrentMediaIndex(currentMediaIndex === 0 ? media.length - 1 : currentMediaIndex - 1)} title="Previous media">
                      <RiArrowLeftLine />
                    </button>
                    <button className="media-nav-btn next" onClick={() => setCurrentMediaIndex(currentMediaIndex === media.length - 1 ? 0 : currentMediaIndex + 1)} title="Next media">
                      <RiArrowRightLine />
                    </button>
                    <div className="media-counter">
                      {currentMediaIndex + 1} / {media.length}
                    </div>
                  </>
                )}
              </div>
              {media.length > 1 && (
                <div className="media-thumbnails">
                  {media.map((m, i) => (
                    <button key={i} className={`media-thumbnail ${i === currentMediaIndex ? 'active' : ''}`} onClick={() => setCurrentMediaIndex(i)}>
                      {m.type === 'video' ? <RiVideoLine /> : <RiImageLine />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Content */}
          <div className="report-content">
            {/* Actions */}
            <div className="report-actions">
              <button className="action-btn" disabled title="Upvote disabled">
                <RiThumbUpLine />
                <span>{report.upvotes || 0} Upvotes</span>
              </button>
              <button className="action-btn" onClick={handleShare} title="Share this report">
                <RiShareLine />
                <span>Share</span>
              </button>
            </div>

            {/* Info Grid */}
            <div className="report-info-grid">
              <div className="info-item">
                <div className="info-header">
                  <RiCalendarLine className="info-icon" />
                  <div className="info-label">Date Reported</div>
                </div>
                <div className="info-value">{formatDate(report.createdAt)}</div>
              </div>
              <div className="info-item">
                <div className="info-header">
                  <RiUserLine className="info-icon" />
                  <div className="info-label">Reported By</div>
                </div>
                <div className="info-value">{report.isAnonymous ? 'Anonymous' : (report.userId?.name || 'Unknown')}</div>
              </div>
              <div className="info-item">
                <div className="info-header">
                  <RiMapPinLine className="info-icon" />
                  <div className="info-label">Location</div>
                </div>
                <div className="info-value">{report.location?.name || 'Unknown location'}</div>
              </div>
              {report.severity && (
                <div className="info-item">
                  <div className="info-header">
                    <RiAlertLine className="info-icon" />
                    <div className="info-label">Severity</div>
                  </div>
                  <div className="info-value">
                    <span className={`severity-badge ${getSeverityColor(report.severity)}`}>
                      {getSeverityText(report.severity)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Authorities */}
            {(authorities.contractor || authorities.engineer || authorities.corporator || authorities.mla || authorities.mp) && (
              <div className="authorities-section">
                <div className="authorities-title">
                  <RiShieldCheckLine />
                  Tagged Authorities
                </div>
                <div className="authorities-grid">
                  {authorities.contractor && (
                    <div className="authority-item">
                      <div className="authority-role">Contractor</div>
                      <div className="authority-name">{authorities.contractor}</div>
                    </div>
                  )}
                  {authorities.engineer && (
                    <div className="authority-item">
                      <div className="authority-role">Engineer</div>
                      <div className="authority-name">{authorities.engineer}</div>
                    </div>
                  )}
                  {authorities.corporator && (
                    <div className="authority-item">
                      <div className="authority-role">Corporator</div>
                      <div className="authority-name">{authorities.corporator}</div>
                    </div>
                  )}
                  {authorities.mla && (
                    <div className="authority-item">
                      <div className="authority-role">MLA</div>
                      <div className="authority-name">{authorities.mla}</div>
                    </div>
                  )}
                  {authorities.mp && (
                    <div className="authority-item">
                      <div className="authority-role">MP</div>
                      <div className="authority-name">{authorities.mp}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description/Notes */}
            {report.description && (
              <div className="description-section">
                <div className="description-title">
                  <RiFileTextLine />
                  Description
                </div>
                <div className="description-content">
                  <p>{report.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        pothole={report}
      />
    </div>
  );
};

export default ReportDetailsModern; 
