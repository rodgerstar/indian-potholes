import React, { useState } from 'react';
import { RiArrowLeftLine, RiUploadLine, RiErrorWarningLine } from 'react-icons/ri';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';

/**
 * Step 6: Review & Submit Component
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data
 * @param {Array} props.selectedFiles - Selected files
 * @param {Array} props.filePreviews - File previews
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onBack - Back step handler
 * @param {boolean} props.loading - Whether submission is in progress
 * @param {number} props.uploadProgress - Upload progress percentage
 * @param {boolean} props.isGuest - Whether user is guest
 * @param {boolean} props.isAnonymous - Whether reporting anonymously
 * @param {string} props.recaptchaToken - reCAPTCHA token
 * @param {Function} props.setRecaptchaToken - reCAPTCHA token setter
 */
const Step6Review = ({ 
  formData, 
  selectedFiles, 
  filePreviews, 
  onSubmit, 
  onBack, 
  loading, 
  uploadProgress, 
  isGuest, 
  isAnonymous, 
  recaptchaToken, 
  setRecaptchaToken 
}) => {
  const [videoErrors, setVideoErrors] = useState({});

  /**
   * Handle video error for specific preview
   */
  const handleVideoError = (index) => {
    setVideoErrors(prev => ({ ...prev, [index]: true }));
  };

  /**
   * Handle video load success for specific preview
   */
  const handleVideoLoad = (index) => {
    setVideoErrors(prev => ({ ...prev, [index]: false }));
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Step 6: Review & Submit</h2>
        <p>Review your pothole report before submitting</p>
      </div>

      <div className="review-section">
        <div className="review-grid">
          <div className="review-item">
            <h4>Media</h4>
            <div className="review-media">
              {filePreviews && filePreviews.length > 0 && (
                <div className="media-preview-multi">
                  {filePreviews.map((preview, idx) => (
                    <div className="media-preview" key={idx}>
                      {selectedFiles[idx]?.type.startsWith('video/') ? (
                        videoErrors[idx] ? (
                          <div className="video-error-fallback-upload">
                            <RiErrorWarningLine className="error-icon" />
                            <span className="error-text">Video not supported</span>
                          </div>
                        ) : (
                          <video 
                            src={preview} 
                            controls 
                            className="preview-media"
                            onError={() => handleVideoError(idx)}
                            onLoadedData={() => handleVideoLoad(idx)}
                            preload="metadata"
                          />
                        )
                      ) : (
                        <img src={preview} alt={`Preview ${idx + 1}`} className="preview-media" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="review-item">
            <h4>Location</h4>
            <p><strong>Name:</strong> {formData.locationName}</p>
            <p><strong>Coordinates:</strong> {formData.latitude}, {formData.longitude}</p>
          </div>

          <div className="review-item">
            <h4>Constituency Information</h4>
            <p><strong>State:</strong> {formData.state}</p>
            <p><strong>Assembly Constituency:</strong> {formData.constituency}</p>
            <p><strong>Parliamentary Constituency:</strong> {formData.parliamentaryConstituency}</p>
          </div>

          <div className="review-item">
            <h4>Representatives</h4>
            <p><strong>MP:</strong> {formData.mp || 'Not specified'}</p>
            <p><strong>MLA:</strong> {formData.mla || 'Not specified'}</p>
            <p><strong>Corporator:</strong> {formData.corporator || 'Not specified'}</p>
            <p><strong>Contractor:</strong> {formData.contractor || 'Not specified'}</p>
            <p><strong>Engineer:</strong> {formData.engineer || 'Not specified'}</p>
          </div>

          <div className="review-item">
            <h4>Severity & Description</h4>
            <p><strong>Severity:</strong> {formData.severity ? formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1) : 'Not specified'}</p>
            <p><strong>Description:</strong> {formData.description || 'Not provided'}</p>
          </div>

          <div className="review-item">
            <h4>Reporting Settings</h4>
            <p><strong>Anonymous:</strong> {isGuest ? 'No' : (isAnonymous ? 'Yes' : 'No')}</p>
          </div>
        </div>
      </div>

      {/* Show reCAPTCHA for guests only */}
      {isGuest && (
        <div className="form-section" style={{ margin: '1.5rem 0' }}>
          <label className="form-label">Verification *</label>
          <ReCAPTCHA
            sitekey="6LfaWoYrAAAAAAp3JCo-yDVkSFeDAfIbRiC-qBZ6"
            onChange={setRecaptchaToken}
            onErrored={() => {
              setRecaptchaToken(null);
              toast.error('Verification failed to load. Check network or disable blockers.');
            }}
            onExpired={() => {
              setRecaptchaToken(null);
              toast.error('Verification expired. Please try again.');
            }}
            theme="light"
          />
          <div className="form-hint">Please complete the verification to submit your report.</div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {loading && uploadProgress > 0 && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <span className="progress-text">{uploadProgress}% uploaded</span>
        </div>
      )}

      <div className="step-actions">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary btn-lg"
          disabled={loading}
        >
          <RiArrowLeftLine className="step-icon" />
          Back
        </button>
        <button
          type="submit"
          onClick={onSubmit}
          disabled={loading}
          className="btn btn-primary btn-lg"
        >
          {loading ? (
            <div className="loading-content">
              <div className="loading-spinner"></div>
              {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Submitting Report...'}
            </div>
          ) : (
            <div className="submit-content">
              <RiUploadLine className="submit-icon" />
              Submit Report
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step6Review;
