import React, { useState, useEffect } from 'react';
import { generateVideoThumbnail } from '../utils/videoThumbnail';
import { 
  RiCloseLine, 
  RiMapPinLine, 
  RiCalendarLine, 
  RiUserLine, 
  RiThumbUpLine, 
  RiImageLine, 
  RiVideoLine,
  RiShieldCheckLine,
  RiFileCopyLine,
  RiNavigationLine,
  RiShareLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiAlertLine,
  RiFileTextLine,
  RiFullscreenLine,
  RiDownloadLine,
  RiErrorWarningLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import ShareModal from './ShareModal';
import './DetailsModal.css';
import { useAuth } from '../context/AuthContext';

const DetailsModal = ({ isOpen, onClose, report, onAdminCommentUpdate }) => {
  const { user } = useAuth();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [adminComment, setAdminComment] = useState(report?.adminComment || '');
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [thumbnailVideoErrors, setThumbnailVideoErrors] = useState({});
  const [mainVideoPoster, setMainVideoPoster] = useState(null);
  const [thumbPosters, setThumbPosters] = useState({});

  useEffect(() => {
    setAdminComment(report?.adminComment || '');
  }, [report]);

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

  /**
   * Handle thumbnail video error
   */
  const handleThumbnailVideoError = (index) => {
    setThumbnailVideoErrors(prev => ({ ...prev, [index]: true }));
  };

  /**
   * Handle thumbnail video load success
   */
  const handleThumbnailVideoLoad = (index) => {
    setThumbnailVideoErrors(prev => ({ ...prev, [index]: false }));
  };

  // Handle ESC key and click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isImageFullscreen) {
          setIsImageFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, isImageFullscreen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentMediaIndex(0);
      setIsImageFullscreen(false);
      setShowShareModal(false);
      setCopiedField(null);
      setMainVideoPoster(null);
      setThumbPosters({});
    }
  }, [isOpen]);

  // Generate poster for the main video preview
  useEffect(() => {
    let cancelled = false;
    setMainVideoPoster(null);
    const m = report?.media?.[currentMediaIndex];
    if (isOpen && m && m.type === 'video' && m.url) {
      generateVideoThumbnail(m.url, 0.5, 600)
        .then((thumb) => { if (!cancelled) setMainVideoPoster(thumb); })
        .catch(() => { if (!cancelled) setMainVideoPoster(null); });
    }
    return () => { cancelled = true; };
  }, [isOpen, report, currentMediaIndex]);

  // Pre-generate posters for all video thumbnails in this report (max 5 files)
  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !report?.media) return;
    const promises = report.media.map((media, idx) => {
      if (media?.type === 'video' && media.url) {
        return generateVideoThumbnail(media.url, 0.5, 200)
          .then((thumb) => { if (!cancelled) setThumbPosters(prev => ({ ...prev, [idx]: thumb })); })
          .catch(() => {});
      }
      return Promise.resolve();
    });
    Promise.allSettled(promises);
    return () => { cancelled = true; };
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const openInMaps = () => {
    const lat = report.location?.coordinates?.latitude;
    const lng = report.location?.coordinates?.longitude;
    if (lat && lng) {
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  const downloadMedia = () => {
    if (report.media && report.media.length > 0) {
      const link = document.createElement('a');
      link.href = report.media[currentMediaIndex].url;
      link.download = `pothole-report-${report._id}-${currentMediaIndex + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="modal-overlay-new" onClick={handleOverlayClick}>
        <div className="modal-container-new">
          {/* Header */}
          <div className="modal-header-new">
            <div className="modal-title-section-new">
              <h2 className="modal-title-new">Report Details</h2>
              <div className={`status-badge-new ${getStatusColor(report.status)}`}>
                <RiShieldCheckLine className="status-icon-new" />
                {getStatusText(report.status)}
              </div>
            </div>
            <button 
              className="modal-close-btn-new" 
              onClick={onClose}
              aria-label="Close modal"
            >
              <RiCloseLine size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body-new">
            <div className="modal-content-grid-new">
              {/* Media Section */}
              {report.media && report.media.length > 0 && report.media[currentMediaIndex] && (
                <div className="modal-section-new media-section-new">
                  <div className="media-container-new">
                    {report.media[currentMediaIndex] && report.media[currentMediaIndex].type === 'video' ? (
                      videoError ? (
                        <div className="video-error-fallback-modal">
                          <RiErrorWarningLine className="error-icon" />
                          <span className="error-text">Video not supported</span>
                          {report.media[currentMediaIndex]?.url && (
                            <a
                              href={report.media[currentMediaIndex].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="download-fallback-link"
                            >
                              Open video in new tab
                            </a>
                          )}
                        </div>
                      ) : (
                        <video 
                          controls 
                          className="media-display-new"
                          poster={mainVideoPoster || '/api/placeholder/600/400'}
                          onError={(e) => {
                            console.error('Video playback error', {
                              src: report.media[currentMediaIndex]?.url
                            });
                            handleVideoError();
                          }}
                          onLoadedData={handleVideoLoad}
                          preload="metadata"
                          playsInline
                          crossOrigin="anonymous"
                        >
                          <source 
                            src={report.media[currentMediaIndex].url} 
                            type={(() => {
                              const u = report.media[currentMediaIndex].url || '';
                              const ext = u.split('?')[0].split('.').pop()?.toLowerCase();
                              const map = {
                                mp4: 'video/mp4',
                                webm: 'video/webm',
                                mov: 'video/quicktime',
                                m4v: 'video/x-m4v',
                                avi: 'video/x-msvideo'
                              };
                              return map[ext] || 'video/mp4';
                            })()}
                          />
                        </video>
                      )
                    ) : (
                      <img 
                        src={report.media[currentMediaIndex] ? report.media[currentMediaIndex].url : ''} 
                        alt="Pothole Report" 
                        className="media-display-new"
                        onClick={() => setIsImageFullscreen(true)}
                      />
                    )}
                    
                    {/* Media Controls */}
                    <div className="media-controls-new">
                      <div className="media-type-badge-new">
                        {report.media[currentMediaIndex] && report.media[currentMediaIndex].type === 'video' ? (
                          <><RiVideoLine /> Video</>
                        ) : (
                          <><RiImageLine /> Photo</>
                        )}
                        {report.media.length > 1 && (
                          <span className="media-count-new">
                            {currentMediaIndex + 1}/{report.media.length}
                          </span>
                        )}
                      </div>
                      <div className="media-actions-new">
                        {report.media[currentMediaIndex] && report.media[currentMediaIndex].type === 'image' && (
                          <button 
                            className="media-action-btn-new"
                            onClick={() => setIsImageFullscreen(true)}
                            title="View fullscreen"
                          >
                            <RiFullscreenLine />
                          </button>
                        )}
                        <button 
                          className="media-action-btn-new"
                          onClick={downloadMedia}
                          title="Download media"
                        >
                          <RiDownloadLine />
                        </button>
                      </div>
                    </div>

                    {/* Navigation for multiple media */}
                    {report.media.length > 1 && (
                      <>
                        <button
                          className="media-nav-btn-new media-nav-prev-new"
                          onClick={() => setCurrentMediaIndex(prev => 
                            prev === 0 ? report.media.length - 1 : prev - 1
                          )}
                        >
                          <RiArrowLeftLine />
                        </button>
                        <button
                          className="media-nav-btn-new media-nav-next-new"
                          onClick={() => setCurrentMediaIndex(prev => 
                            prev === report.media.length - 1 ? 0 : prev + 1
                          )}
                        >
                          <RiArrowRightLine />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails for multiple media */}
                  {report.media.length > 1 && (
                    <div className="media-thumbnails-new">
                      {report.media.map((media, index) => (
                        <button
                          key={index}
                          className={`media-thumbnail-new ${index === currentMediaIndex ? 'active' : ''}`}
                          onClick={() => setCurrentMediaIndex(index)}
                        >
                          {media && media.type === 'video' ? (
                            thumbnailVideoErrors[index] ? (
                              <div className="thumbnail-error-fallback">
                                <RiErrorWarningLine className="error-icon" />
                              </div>
                            ) : (
                              <video 
                                className="thumbnail-content-new"
                                onError={() => handleThumbnailVideoError(index)}
                                onLoadedData={() => handleThumbnailVideoLoad(index)}
                                preload="none"
                                playsInline
                                muted
                                crossOrigin="anonymous"
                                poster={thumbPosters[index] || '/api/placeholder/200/120'}
                              />
                            )
                          ) : (
                            <img src={media && media.url ? media.url : ''} alt={`Thumbnail ${index + 1}`} className="thumbnail-content-new" loading="lazy" decoding="async" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Basic Information Section */}
              <div className="modal-section-new">
                <div className="section-header-new">
                  <RiFileTextLine className="section-icon-new" />
                  <h3 className="section-title-new">Basic Information</h3>
                </div>
                <div className="section-content-new">
                  <div className="info-grid-new">
                    <div className="info-item-new">
                      <div className="info-label-new">
                        <RiMapPinLine className="info-icon-new" />
                        Location
                      </div>
                      <div className="info-value-new location-value-new">
                        {report.location?.name || 'Location not available'}
                      </div>
                    </div>

                    <div className="info-item-new">
                      <div className="info-label-new">
                        <RiCalendarLine className="info-icon-new" />
                        Date Reported
                      </div>
                      <div className="info-value-new">
                        {formatDate(report.createdAt)}
                      </div>
                    </div>

                    <div className="info-item-new">
                      <div className="info-label-new">
                        <RiUserLine className="info-icon-new" />
                        Reported By
                      </div>
                      <div className="info-value-new">
                        {report.isAnonymous ? 'Anonymous' : (report.userId?.name || 'Unknown')}
                      </div>
                    </div>

                    <div className="info-item-new">
                      <div className="info-label-new">
                        <RiThumbUpLine className="info-icon-new" />
                        Community Support
                      </div>
                      <div className="info-value-new upvotes-value-new">
                        {report.upvotes || 0} {(report.upvotes || 0) === 1 ? 'upvote' : 'upvotes'}
                      </div>
                    </div>

                    {report.severity && (
                      <div className="info-item-new">
                        <div className="info-label-new">
                          <RiAlertLine className="info-icon-new" />
                          Severity Level
                        </div>
                        <div className="info-value-new">
                          <span className={`severity-badge-new ${getSeverityColor(report.severity)}`}>
                            {getSeverityText(report.severity)}
                          </span>
                        </div>
                      </div>
                    )}

                    {report.description && (
                      <div className="info-item-new description-item-new">
                        <div className="info-label-new">
                          <RiFileTextLine className="info-icon-new" />
                          Description
                        </div>
                        <div className="info-value-new">
                          <div className="description-content-new">
                            {report.description}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Details Section */}
              <div className="modal-section-new">
                <div className="section-header-new">
                  <RiMapPinLine className="section-icon-new" />
                  <h3 className="section-title-new">Location Details</h3>
                </div>
                <div className="section-content-new">
                  <div className="coordinates-grid-new">
                    <div className="coordinate-item-new">
                      <span className="coordinate-label-new">Latitude:</span>
                      <span className="coordinate-value-new">
                        {report.location?.coordinates?.latitude?.toFixed(6) || 'N/A'}
                      </span>
                      {report.location?.coordinates?.latitude && (
                        <button 
                          className={`copy-btn-new ${copiedField === 'Latitude' ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(report.location.coordinates.latitude.toFixed(6), 'Latitude')}
                        >
                          <RiFileCopyLine />
                        </button>
                      )}
                    </div>
                    <div className="coordinate-item-new">
                      <span className="coordinate-label-new">Longitude:</span>
                      <span className="coordinate-value-new">
                        {report.location?.coordinates?.longitude?.toFixed(6) || 'N/A'}
                      </span>
                      {report.location?.coordinates?.longitude && (
                        <button 
                          className={`copy-btn-new ${copiedField === 'Longitude' ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(report.location.coordinates.longitude.toFixed(6), 'Longitude')}
                        >
                          <RiFileCopyLine />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {report.location?.address && (
                    <div className="address-section-new">
                      <div className="address-label-new">Full Address:</div>
                      <div className="address-container-new">
                        <span className="address-value-new">{report.location.address}</span>
                        <button 
                          className={`copy-btn-new ${copiedField === 'Address' ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(report.location.address, 'Address')}
                        >
                          <RiFileCopyLine />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tagged Authorities Section */}
              {(report.authorities?.contractor || report.authorities?.engineer || 
                report.authorities?.corporator || report.authorities?.mla || 
                report.authorities?.mp) && (
                <div className="modal-section-new">
                  <div className="section-header-new">
                    <RiShieldCheckLine className="section-icon-new" />
                    <h3 className="section-title-new">Tagged Authorities</h3>
                  </div>
                  <div className="section-content-new">
                    <div className="authorities-grid-new">
                      {report.authorities.mla && (
                        <div className="authority-item-new mla">
                          <div className="authority-role-new">MLA</div>
                          <div className="authority-name-new">{report.authorities.mla}</div>
                        </div>
                      )}
                      {report.authorities.mp && (
                        <div className="authority-item-new mp">
                          <div className="authority-role-new">MP</div>
                          <div className="authority-name-new">{report.authorities.mp}</div>
                        </div>
                      )}
                      {report.authorities.contractor && (
                        <div className="authority-item-new contractor">
                          <div className="authority-role-new">Contractor</div>
                          <div className="authority-name-new">{report.authorities.contractor}</div>
                        </div>
                      )}
                      {report.authorities.engineer && (
                        <div className="authority-item-new engineer">
                          <div className="authority-role-new">Engineer</div>
                          <div className="authority-name-new">{report.authorities.engineer}</div>
                        </div>
                      )}
                      {report.authorities.corporator && (
                        <div className="authority-item-new corporator">
                          <div className="authority-role-new">Corporator</div>
                          <div className="authority-name-new">{report.authorities.corporator}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Section */}
              <div className="modal-section-new">
                <div className="section-header-new">
                  <RiShareLine className="section-icon-new" />
                  <h3 className="section-title-new">Actions</h3>
                </div>
                <div className="section-content-new">
                  <div className="actions-grid-new">
                    <button
                      className="action-btn-new share-btn-new"
                      onClick={() => setShowShareModal(true)}
                    >
                      <RiShareLine />
                      <span>Share Report</span>
                    </button>
                    <button
                      className="action-btn-new directions-btn-new"
                      onClick={openInMaps}
                    >
                      <RiNavigationLine />
                      <span>Get Directions</span>
                    </button>
                    <button
                      className="action-btn-new copy-btn-action-new"
                      onClick={() => copyToClipboard(report.reportId, 'Report ID')}
                    >
                      <RiFileCopyLine />
                      <span>Copy Report ID</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Admin Comment Section */}
              <div className="modal-section-new">
                <div className="section-header-new">
                  <RiFileTextLine className="section-icon-new" />
                  <h3 className="section-title-new">Admin Comment</h3>
                </div>
                <div className="section-content-new">
                  {user?.role === 'admin' ? (
                    <>
                      <textarea
                        className="admin-comment-textarea"
                        value={adminComment}
                        onChange={e => setAdminComment(e.target.value)}
                        maxLength={1000}
                        rows={4}
                        placeholder="Add a comment for this report..."
                      />
                      <button
                        type="button"
                        className="admin-comment-save-btn"
                        onClick={async () => {
                          setIsSavingComment(true);
                          try {
                            await onAdminCommentUpdate(adminComment);
                            toast.success('Admin comment updated!');
                          } catch (err) {
                            toast.error('Failed to update comment');
                          } finally {
                            setIsSavingComment(false);
                          }
                        }}
                        disabled={isSavingComment}
                      >
                        {isSavingComment ? 'Saving...' : 'Save Comment'}
                      </button>
                    </>
                  ) : (
                    <div className="admin-comment-display">
                      {report.adminComment ? report.adminComment : <em>No comment from admin yet.</em>}
                      {report.adminCommentAt && (
                        <div className="admin-comment-timestamp">
                          <small>Last updated: {new Date(report.adminCommentAt).toLocaleString()}</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Overlay */}
      {isImageFullscreen && report.media && report.media.length > 0 && 
       report.media[currentMediaIndex] && report.media[currentMediaIndex].type === 'image' && (
        <div className="fullscreen-overlay-new" onClick={() => setIsImageFullscreen(false)}>
          <button 
            type="button"
            className="fullscreen-close-new" 
            onClick={() => setIsImageFullscreen(false)}
            aria-label="Close fullscreen"
          >
            <RiCloseLine size={32} />
          </button>
          <img
            src={report.media[currentMediaIndex].url}
            alt="Pothole Fullscreen"
            className="fullscreen-image-new"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          pothole={report}
        />
      )}
    </>
  );
};

export default DetailsModal;
