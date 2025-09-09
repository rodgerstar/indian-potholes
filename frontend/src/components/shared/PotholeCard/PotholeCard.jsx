import React, { useEffect, useState } from 'react';
import ShareButton from '../../ShareButton';
import { 
  RiCalendarLine, 
  RiUserLine, 
  RiThumbUpLine, 
  RiEyeLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiImageLine,
  RiVideoLine,
  RiErrorWarningLine,
} from 'react-icons/ri';
import { generateVideoThumbnail } from '../../../utils/videoThumbnail';

/**
 * PotholeCard component for displaying pothole information
 * @param {Object} props - Component props
 * @param {Object} props.pothole - Pothole data
 * @param {Function} props.onUpvote - Upvote handler
 * @param {boolean} props.isAuthenticated - Whether user is authenticated
 * @param {Object} props.user - Current user data
 * @param {Function} props.onView - View details handler
 * @param {Function} props.onDelete - Delete handler (optional)
 * @param {string} props.viewMode - View mode (grid/list)
 * @param {Function} props.onShare - Share handler
 * @param {boolean} props.isUpvoting - Whether upvote is in progress
 */
const PotholeCard = ({ 
  pothole, 
  onUpvote, 
  isAuthenticated, 
  user, 
  onView, 
  onDelete, 
  viewMode = 'grid', 
  onShare,
  isUpvoting = false 
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [videoPoster, setVideoPoster] = useState(null);

  // Check if current user has upvoted this pothole
  const hasUpvoted = pothole.hasUpvoted || pothole.upvotedBy?.includes(user?.id);

  // Reset video error when media index changes
  React.useEffect(() => {
    setVideoError(false);
  }, [currentMediaIndex]);

  // Generate a poster thumbnail for videos so the card shows a preview image
  useEffect(() => {
    let cancelled = false;
    setVideoPoster(null);
    if (pothole?.media?.[currentMediaIndex]?.type === 'video') {
      const url = pothole.media[currentMediaIndex].url;
      generateVideoThumbnail(url, 0.5, 400)
        .then((thumb) => {
          if (!cancelled) setVideoPoster(thumb);
        })
        .catch(() => {
          if (!cancelled) setVideoPoster(null);
        });
    }
    return () => { cancelled = true; };
  }, [pothole, currentMediaIndex]);

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

  /**
   * Handle upvote click with event propagation prevention
   * @param {Event} e - Click event
   */
  const handleUpvoteClick = (e) => {
    e.stopPropagation(); // Prevent event from bubbling up to parent card
    if (onUpvote) {
      // Pass the event to the provided handler; it already knows the potholeId via closure
      onUpvote(e);
    }
  };

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Get status CSS class
   * @param {string} status - Pothole status
   * @returns {string} CSS class name
   */
  const getStatusColor = (status) => {
    const colors = {
      reported: 'status-reported',
      acknowledged: 'status-acknowledged',
      in_progress: 'status-in-progress',
      resolved: 'status-resolved'
    };
    return colors[status] || colors.reported;
  };

  /**
   * Get status display text
   * @param {string} status - Pothole status
   * @returns {string} Display text
   */
  const getStatusText = (status) => {
    const statusMap = {
      reported: 'Reported',
      acknowledged: 'Acknowledged',
      in_progress: 'In Progress',
      resolved: 'Resolved'
    };
    return statusMap[status] || 'Reported';
  };

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onView?.(pothole);
    }
  };

  /**
   * Navigate to previous media
   * @param {Event} e - Click event
   */
  const handlePrevMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => 
      prev === 0 ? pothole.media.length - 1 : prev - 1
    );
  };

  /**
   * Navigate to next media
   * @param {Event} e - Click event
   */
  const handleNextMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => 
      prev === pothole.media.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div 
      className={`gallery-card-modern ${viewMode}`}
      tabIndex={0}
      role="button"
      onKeyDown={handleKeyDown}
      onClick={() => onView?.(pothole)}
      aria-label={`Pothole report at ${pothole.location?.name || 'unknown location'}, reported on ${formatDate(pothole.createdAt)}`}
    >
      {/* Media Section */}
      <div className="gallery-media-modern">
        {pothole.media && pothole.media.length > 0 && (
          <>
            {pothole.media[currentMediaIndex].type === 'video' ? (
              videoError ? (
                <div className="video-error-fallback">
                  <RiErrorWarningLine className="error-icon" />
                  <span className="error-text">Video not supported</span>
                </div>
              ) : (
                <video
                  className="gallery-media-preview"
                  poster={videoPoster || '/api/placeholder/400/250'}
                  onError={handleVideoError}
                  onLoadedData={handleVideoLoad}
                  preload="metadata"
                  playsInline
                  muted
                  crossOrigin="anonymous"
                >
                  <source src={pothole.media[currentMediaIndex].url} type="video/mp4" />
                </video>
              )
            ) : (
              <img 
                src={pothole.media[currentMediaIndex].url} 
                alt="Pothole Report"
                className="gallery-media-preview"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
              />
            )}
            
            <div className="gallery-media-overlay">
              <div className="media-type-indicator-modern">
                {pothole.media[currentMediaIndex].type === 'video' ? (
                  <RiVideoLine className="media-type-icon-gallery" />
                ) : (
                  <RiImageLine className="media-type-icon-gallery" />
                )}
                {pothole.media.length > 1 && (
                  <span className="media-count-indicator">
                    {currentMediaIndex + 1}/{pothole.media.length}
                  </span>
                )}
              </div>
              
              <div className={`status-indicator-modern ${getStatusColor(pothole.status)}`}>
                {getStatusText(pothole.status)}
              </div>
            </div>

            {/* Navigation arrows for multiple media */}
            {pothole.media.length > 1 && (
              <>
                <button
                  className="media-nav-btn media-nav-prev"
                  onClick={handlePrevMedia}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePrevMedia(e);
                    }
                  }}
                  title="Previous media"
                  aria-label="Previous media"
                >
                  <RiArrowLeftLine />
                </button>
                <button
                  className="media-nav-btn media-nav-next"
                  onClick={handleNextMedia}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNextMedia(e);
                    }
                  }}
                  title="Next media"
                  aria-label="Next media"
                >
                  <RiArrowRightLine />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Content Section */}
      <div className="gallery-content-modern">
        <div className="gallery-header-section">
          <h3 className="gallery-title-modern">
            {pothole.location.name}
          </h3>
          
          <div className="gallery-meta-modern">
            <div className="meta-row">
              <div className="meta-item-gallery">
                <RiCalendarLine className="meta-icon-gallery" />
                <span>{formatDate(pothole.createdAt)}</span>
              </div>
              <div className="meta-item-gallery">
                <RiUserLine className="meta-icon-gallery" />
                <span>{pothole.isAnonymous ? 'Anonymous' : (pothole.userId?.name || 'Unknown')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Status (if pending or rejected) */}
        {pothole.approvalStatus && pothole.approvalStatus !== 'approved' && (
          <div className={`approval-status-banner ${pothole.approvalStatus}`}>
            {pothole.approvalStatus === 'pending' && (
              <>
                <RiErrorWarningLine className="approval-icon" />
                <span>Under Review</span>
              </>
            )}
            {pothole.approvalStatus === 'rejected' && (
              <>
                <RiErrorWarningLine className="approval-icon" />
                <span>Rejected</span>
                {pothole.rejectionReason && (
                  <span className="rejection-reason"> - {pothole.rejectionReason}</span>
                )}
              </>
            )}
          </div>
        )}

        {/* Authorities Section - Condensed */}
        {(pothole.authorities?.contractor || pothole.authorities?.engineer || 
          pothole.authorities?.corporator || pothole.authorities?.mla || pothole.authorities?.mp) && (
          <div className="authorities-preview">
            <div className="authorities-tags">
              {pothole.authorities?.contractor && (
                <span className="authority-tag-small contractor">Contractor</span>
              )}
              {pothole.authorities?.engineer && (
                <span className="authority-tag-small engineer">Engineer</span>
              )}
              {pothole.authorities?.corporator && (
                <span className="authority-tag-small corporator">Corporator</span>
              )}
              {pothole.authorities?.mla && (
                <span className="authority-tag-small mla">MLA</span>
              )}
              {pothole.authorities?.mp && (
                <span className="authority-tag-small mp">MP</span>
              )}
            </div>
          </div>
        )}

        {/* Actions and Upvote */}
        <div className="gallery-actions-modern">
          <button
            onClick={handleUpvoteClick}
            disabled={isUpvoting || !isAuthenticated}
            className={`upvote-btn-modern ${isAuthenticated ? 'enabled' : 'disabled'} ${hasUpvoted ? 'upvoted' : ''}`}
            title={hasUpvoted ? 'Click to remove upvote' : 'Click to upvote'}
            aria-label={hasUpvoted ? `Remove upvote from pothole report (${pothole.upvotes} upvotes)` : `Upvote pothole report (${pothole.upvotes} upvotes)`}
          >
            <RiThumbUpLine className={`upvote-icon-modern ${isUpvoting ? 'pulsing' : ''} ${hasUpvoted ? 'filled' : ''}`} />
            <span className="upvote-count-modern">
              {pothole.upvotes}
            </span>
          </button>

          <ShareButton pothole={pothole} variant="secondary" size="sm" iconOnly onShare={onShare} />

          <button
            className="view-btn-modern"
            onClick={() => onView?.(pothole)}
            aria-label={`View details for pothole report at ${pothole.location?.name || 'unknown location'}`}
          >
            <RiEyeLine />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PotholeCard;
