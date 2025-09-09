import React from 'react';
import { RiShareLine } from 'react-icons/ri';

const ShareButton = ({ pothole, className = '', size = 'md', variant = 'primary', iconOnly = false, onShare }) => {
  const handleShareClick = (e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(pothole);
    }
  };

  const buttonClasses = `share-btn ${className} ${size} ${variant} ${iconOnly ? 'icon-only' : ''}`;

  return (
    <button
      onClick={handleShareClick}
      className={buttonClasses}
      title="Share this report"
      aria-label="Share this pothole report"
      type="button"
    >
      <RiShareLine className="share-btn-icon" />
      {!iconOnly && <span className="share-btn-text">Share</span>}
    </button>
  );
};

export default ShareButton; 