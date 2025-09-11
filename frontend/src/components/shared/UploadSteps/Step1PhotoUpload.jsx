import React from 'react';
import { 
  RiCameraLine, 
  RiVideoLine, 
  RiArrowRightLine, 
  RiUploadLine,
  RiImageLine,
  RiDeleteBin7Line,
  RiCheckLine 
} from 'react-icons/ri';
import useFileUpload from '../../../hooks/useFileUpload';

/**
 * Step 1: Photo/Video Upload Component
 * @param {Object} props - Component props
 * @param {Function} props.onNext - Next step handler
 * @param {Function} props.onGPSFound - GPS found callback
 * @param {Object} props.formData - Form data
 * @param {Function} props.setFormData - Form data setter
 */
const Step1PhotoUpload = ({ onNext, onGPSFound, formData, setFormData }) => {
  const {
    selectedFiles,
    filePreviews,
    isProcessing,
    fileInputRef,
    handleFileSelect,
    removeFile,
    triggerFileSelect,
    hasFiles,
    canAddMore,
    fileCount,
    maxFiles
  } = useFileUpload({
    maxFiles: 5,
    onGPSFound: onGPSFound
  });

  /**
   * Handle next button click
   */
  const handleNext = () => {
    if (!hasFiles) {
      // Error handling is done by the hook via toast
      return;
    }
    
    // Update form data with selected files
    setFormData(prev => ({
      ...prev,
      selectedFiles,
      filePreviews
    }));
    
    onNext();
  };

  return (
    <div className="step-container modern-step">
      {/* Header Section */}
      <div className="step-header-modern">
        <div className="step-badge">Step 1 of 5</div>
        <h2 className="step-title-modern">Upload Photos & Videos</h2>
        <p className="step-subtitle-modern">
          Upload clear photos or videos showing the pothole condition
        </p>
      </div>

      {/* Upload Section */}
      <div className="upload-section-modern">
        <div className="section-header-modern">
          <h3 className="section-title-modern">
            <RiUploadLine className="section-icon" />
            Media Upload
            <span className="required-indicator">*</span>
            <span className="file-counter">({fileCount}/{maxFiles})</span>
          </h3>
          <p className="section-description">Select up to {maxFiles} photos or videos of the pothole</p>
        </div>

        {/* Upload Dropzone */}
        <div 
          className={`upload-dropzone-modern ${hasFiles ? 'has-files' : ''}`}
          onClick={triggerFileSelect}
        >
          {!hasFiles ? (
            <div className="upload-placeholder-modern">
              <div className="upload-icon-group">
                <div className="upload-icon-wrapper">
                  <RiCameraLine className="upload-icon-main" />
                </div>
                <div className="upload-icon-wrapper">
                  <RiVideoLine className="upload-icon-main" />
                </div>
              </div>
              <h4 className="upload-title">Click to Upload Files</h4>
              <p className="upload-description">Drag & drop files here or click to browse</p>
              <div className="upload-specs">
                <div className="spec-item">
                  <RiImageLine className="spec-icon" />
                  <span>Images: JPEG, PNG, GIF, WEBP, HEIC/HEIF</span>
                </div>
                <div className="spec-item">
                  <RiVideoLine className="spec-icon" />
                  <span>Videos: MP4, MOV, WEBM, AVI, M4V, MKV, 3GP</span>
                </div>
                <div className="spec-item">
                  <span>Max 50MB per file</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="files-selected-modern">
              <div className="upload-success">
                <RiCheckLine className="success-icon" />
                <span className="success-text">{fileCount} file(s) selected</span>
              </div>
              {canAddMore && (
                <button 
                  type="button" 
                  className="btn btn-secondary-modern"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileSelect();
                  }}
                  disabled={isProcessing}
                >
                  <RiUploadLine className="btn-icon" />
                  Add More Files
                </button>
              )}
              {!canAddMore && (
                <span className="max-reached">Maximum files reached</span>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,image/heic,image/heif"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
        
        {/* File Previews */}
        {hasFiles && (
          <div className="file-previews-modern">
            <div className="previews-header">
              <h4 className="previews-title">Selected Files</h4>
              <span className="previews-count">{fileCount} of {maxFiles}</span>
            </div>
            <div className="preview-grid-modern">
              {selectedFiles.map((file, index) => (
                <div key={index} className="file-preview-card">
                  <div className="preview-media-container">
                    {file.type.startsWith('video/') ? (
                      <video 
                        src={filePreviews[index]} 
                        controls 
                        className="preview-media-modern"
                      />
                    ) : (
                      <img 
                        src={filePreviews[index]} 
                        alt={`Preview ${index + 1}`} 
                        className="preview-media-modern"
                      />
                    )}
                    <div className="media-overlay">
                      {file.type.startsWith('video/') ? (
                        <RiVideoLine className="media-type-icon" />
                      ) : (
                        <RiImageLine className="media-type-icon" />
                      )}
                    </div>
                  </div>
                  <div className="file-details">
                    <p className="file-name-modern">{file.name}</p>
                    <p className="file-size-modern">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="remove-file-btn"
                    disabled={isProcessing}
                    title="Remove file"
                  >
                    <RiDeleteBin7Line />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="step-actions-modern">
        <button 
          type="button" 
          onClick={handleNext} 
          className="btn btn-primary-modern btn-lg" 
          disabled={!hasFiles || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Continue'}
          <RiArrowRightLine className="btn-icon" />
        </button>
      </div>
    </div>
  );
};

export default Step1PhotoUpload;
