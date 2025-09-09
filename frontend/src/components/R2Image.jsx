import React, { useState, useRef, useEffect } from 'react';
import { FaImage, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import './R2Image.css';

/**
 * R2Image Component
 * 
 * A React component for displaying images from Cloudflare R2 with:
 * - Lazy loading support
 * - Loading states
 * - Error handling with fallback
 * - Responsive design
 * - Accessibility features
 * 
 * @param {Object} props
 * @param {string} props.src - Image URL from Cloudflare Worker
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.width - Image width (optional)
 * @param {string} props.height - Image height (optional)
 * @param {boolean} props.lazy - Enable lazy loading (default: true)
 * @param {string} props.placeholder - Placeholder text or component
 * @param {Function} props.onLoad - Callback when image loads
 * @param {Function} props.onError - Callback when image fails to load
 * @param {string} props.fallbackSrc - Fallback image URL
 */
const R2Image = ({
  src,
  alt = '',
  className = '',
  width,
  height,
  lazy = true,
  placeholder = 'Loading...',
  onLoad,
  onError,
  fallbackSrc,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const imgRef = useRef(null);

  // Handle image load
  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setLoading(false);
    setError(true);
    
    // Try fallback image if available
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setLoading(true);
      setError(false);
      return;
    }
    
    onError?.();
  };

  // Update image source when src prop changes
  useEffect(() => {
    setImageSrc(src);
    setLoading(true);
    setError(false);
  }, [src]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before image enters viewport
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [lazy, imageSrc]);

  // CSS classes
  const containerClasses = `r2-image-container ${className}`.trim();
  const imageClasses = `r2-image ${loading ? 'loading' : ''} ${error ? 'error' : ''}`.trim();

  // Inline styles
  const containerStyle = {
    width: width || 'auto',
    height: height || 'auto',
    position: 'relative',
    overflow: 'hidden'
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: loading ? 'none' : 'block'
  };

  return (
    <div className={containerClasses} style={containerStyle}>
      {/* Loading State */}
      {loading && (
        <div className="r2-image-loading">
          <FaSpinner className="r2-image-spinner" />
          <span className="r2-image-placeholder">{placeholder}</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="r2-image-error">
          <FaExclamationTriangle className="r2-image-error-icon" />
          <span className="r2-image-error-text">Failed to load image</span>
        </div>
      )}

      {/* Image */}
      <img
        ref={imgRef}
        className={imageClasses}
        style={imageStyle}
        alt={alt}
        data-src={lazy ? imageSrc : undefined}
        src={lazy ? undefined : imageSrc}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? 'lazy' : undefined}
        {...props}
      />

      {/* Accessibility: Screen reader only text for loading/error states */}
      {(loading || error) && (
        <span className="sr-only">
          {loading ? 'Loading image' : 'Image failed to load'}
        </span>
      )}
    </div>
  );
};

export default R2Image; 