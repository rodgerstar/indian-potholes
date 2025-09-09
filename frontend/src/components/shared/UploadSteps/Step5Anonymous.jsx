import React from 'react';
import { RiArrowLeftLine, RiArrowRightLine, RiShieldCheckLine, RiEyeOffLine } from 'react-icons/ri';

/**
 * Step 5: Anonymous Reporting Component
 * @param {Object} props - Component props
 * @param {boolean} props.isAnonymous - Whether reporting anonymously
 * @param {Function} props.setIsAnonymous - Anonymous state setter
 * @param {Function} props.onNext - Next step handler
 * @param {Function} props.onBack - Back step handler
 */
const Step5Anonymous = ({ isAnonymous, setIsAnonymous, onNext, onBack }) => {
  return (
    <div className="step-container modern-step">
      {/* Header Section */}
      <div className="step-header-modern">
        <div className="step-badge">Step 4 of 5</div>
        <h2 className="step-title-modern">Privacy Settings</h2>
        <p className="step-subtitle-modern">
          Choose how you want your identity to be handled in this report
        </p>
      </div>
      
      {/* Privacy Section */}
      <div className="privacy-section-modern">
        <div className="section-header-modern">
          <h3 className="section-title-modern">
            <RiShieldCheckLine className="section-icon" />
            Reporting Preference
            <span className="optional-indicator">Optional</span>
          </h3>
          <p className="section-description">
            You can choose to submit this report anonymously or with your name attached
          </p>
        </div>

        <div className="privacy-options-modern">
          {/* Anonymous Option */}
          <div 
            className={`privacy-option-modern ${isAnonymous ? 'selected' : ''}`}
            onClick={() => setIsAnonymous(true)}
          >
            <div className="privacy-option-header">
              <div className="privacy-icon-wrapper anonymous">
                <RiEyeOffLine />
              </div>
              <div className="privacy-check">
                {isAnonymous && <RiShieldCheckLine />}
              </div>
            </div>
            <div className="privacy-content">
              <h4 className="privacy-label-modern">Anonymous Report</h4>
              <p className="privacy-description-modern">
                Your name will not be displayed publicly with this report. Only administrators can see your identity.
              </p>
            </div>
          </div>

          {/* Named Option */}
          <div 
            className={`privacy-option-modern ${!isAnonymous ? 'selected' : ''}`}
            onClick={() => setIsAnonymous(false)}
          >
            <div className="privacy-option-header">
              <div className="privacy-icon-wrapper named">
                <RiShieldCheckLine />
              </div>
              <div className="privacy-check">
                {!isAnonymous && <RiShieldCheckLine />}
              </div>
            </div>
            <div className="privacy-content">
              <h4 className="privacy-label-modern">Public Report</h4>
              <p className="privacy-description-modern">
                Your name will be displayed with this report to help build community accountability.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="step-actions-modern">
        <button 
          type="button" 
          onClick={onBack} 
          className="btn btn-secondary-modern btn-lg"
        >
          <RiArrowLeftLine className="btn-icon" />
          Back
        </button>
        <button 
          type="button" 
          onClick={onNext} 
          className="btn btn-primary-modern btn-lg"
        >
          Review Report
          <RiArrowRightLine className="btn-icon" />
        </button>
      </div>
    </div>
  );
};

export default Step5Anonymous;