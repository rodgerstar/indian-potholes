import React from 'react';
import { 
  RiCheckLine, 
  RiArrowLeftLine, 
  RiArrowRightLine, 
  RiUserLine,
  RiAlertLine,
  RiErrorWarningLine,
  RiShieldLine,
  RiInformationLine,
  RiTeamLine
} from 'react-icons/ri';
import { sanitizeInput } from '../../../utils/sanitization';
import toast from 'react-hot-toast';

/**
 * Step 4: Severity & Description Component
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data
 * @param {Function} props.setFormData - Form data setter
 * @param {Function} props.onNext - Next step handler
 * @param {Function} props.onBack - Back step handler
 */
const Step4SeverityDescription = ({ formData, setFormData, onNext, onBack }) => {
  const severityOptions = [
    { 
      value: 'low', 
      label: 'Low Impact', 
      description: 'Small pothole, minor inconvenience',
      icon: <RiInformationLine />,
      color: '#059669' // success green
    },
    { 
      value: 'medium', 
      label: 'Medium Impact', 
      description: 'Moderate size, noticeable damage',
      icon: <RiAlertLine />,
      color: '#ca8a04' // warning yellow
    },
    { 
      value: 'high', 
      label: 'High Impact', 
      description: 'Large pothole, significant hazard',
      icon: <RiErrorWarningLine />,
      color: '#f97316' // primary orange
    },
    { 
      value: 'critical', 
      label: 'Critical', 
      description: 'Very large, dangerous to vehicles',
      icon: <RiShieldLine />,
      color: '#dc2626' // error red
    }
  ];

  /**
   * Handle severity selection
   * @param {string} severity - Selected severity level
   */
  const handleSeverityChange = (severity) => {
    setFormData(prev => ({ ...prev, severity }));
  };

  /**
   * Handle description change during typing (no sanitization)
   * @param {Event} e - Input change event
   */
  const handleDescriptionChange = (e) => {
    // Don't sanitize on every keystroke - just store the raw input
    const description = e.target.value;
    setFormData(prev => ({ ...prev, description }));
  };

  /**
   * Handle description blur (with sanitization)
   * @param {Event} e - Input blur event
   */
  const handleDescriptionBlur = (e) => {
    // Sanitize when the field loses focus
    const description = sanitizeInput(e.target.value);
    setFormData(prev => ({ ...prev, description }));
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (!formData.severity) {
      toast.error('Please select a severity level');
      return;
    }
    onNext();
  };

  return (
    <div className="step-container modern-step">
      {/* Header Section */}
      <div className="step-header-modern">
        <div className="step-badge">Step 3 of 5</div>
        <h2 className="step-title-modern">Severity, Description & Authorities</h2>
        <p className="step-subtitle-modern">
          Help us understand the urgency and provide any authority information you know
        </p>
      </div>

      {/* Severity Section */}
      <div className="severity-section-modern">
        <div className="section-header-modern">
          <h3 className="section-title-modern">
            <RiErrorWarningLine className="section-icon" />
            Severity Level
            <span className="required-indicator">*</span>
          </h3>
          <p className="section-description">
            Choose the level that best describes the pothole's impact
            {!formData.severity && <span className="field-required-hint"> (Required to continue)</span>}
          </p>
        </div>

        <div className={`severity-grid-modern ${!formData.severity ? 'severity-required' : ''}`}>
          {severityOptions.map((option) => (
            <div
              key={option.value}
              className={`severity-card-modern ${formData.severity === option.value ? 'selected' : ''}`}
              onClick={() => handleSeverityChange(option.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSeverityChange(option.value);
                }
              }}
              aria-label={`Select ${option.label}: ${option.description}`}
              style={{ '--severity-color': option.color }}
            >
              <div className="severity-card-header">
                <div className="severity-icon-wrapper">
                  {option.icon}
                </div>
                <div className="severity-check">
                  {formData.severity === option.value && <RiCheckLine />}
                </div>
              </div>
              <div className="severity-content">
                <h4 className="severity-label-modern">{option.label}</h4>
                <p className="severity-description-modern">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Description Section */}
      <div className="description-section-modern">
        <div className="section-header-modern">
          <h3 className="section-title-modern">
            <RiInformationLine className="section-icon" />
            Additional Details
            <span className="optional-indicator">Optional</span>
          </h3>
          <p className="section-description">Provide more context about the pothole's condition</p>
        </div>

        <div className="description-wrapper-modern">
          <textarea
            className="form-textarea-modern"
            placeholder="Describe the pothole in detail: size, depth, location on road, any vehicle damage, traffic impact, etc."
            value={formData.description || ''}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            rows={4}
            maxLength={500}
          />
          <div className="character-counter">
            <span className={formData.description?.length > 450 ? 'warning' : ''}>
              {formData.description ? formData.description.length : 0}/500 characters
            </span>
          </div>
        </div>
      </div>

      {/* Authority Section */}
      <div className="authority-section-modern">
        <div className="section-header-modern">
          <h3 className="section-title-modern">
            <RiTeamLine className="section-icon" />
            Authority Information
            <span className="optional-indicator">Optional</span>
          </h3>
          <p className="section-description">
            Know specific officials responsible for this area? Help us reach the right people
          </p>
        </div>

        <div className="authority-grid-modern">
          {[
            { 
              name: 'corporator', 
              label: 'Corporator', 
              placeholder: 'e.g., John Smith',
              description: 'Local elected representative'
            },
            { 
              name: 'contractor', 
              label: 'Contractor', 
              placeholder: 'e.g., ABC Construction',
              description: 'Road maintenance contractor'
            },
            { 
              name: 'engineer', 
              label: 'Engineer', 
              placeholder: 'e.g., Jane Doe',
              description: 'Supervising engineer'
            }
          ].map((field) => (
            <div key={field.name} className="authority-card-modern">
              <div className="authority-card-header">
                <label className="authority-label-modern">{field.label}</label>
                <span className="authority-description">{field.description}</span>
              </div>
              <div className="authority-input-wrapper">
                <RiUserLine className="authority-icon" />
                <input
                  type="text"
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    [field.name]: sanitizeInput(e.target.value) 
                  }))}
                  placeholder={field.placeholder}
                  className="authority-input-modern"
                  maxLength={100}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="step-actions-modern">
        <button 
          type="button" 
          className="btn btn-secondary-modern btn-lg" 
          onClick={onBack}
        >
          <RiArrowLeftLine className="btn-icon" />
          Back
        </button>
        <button 
          type="button" 
          className="btn btn-primary-modern btn-lg" 
          onClick={handleNext}
          disabled={!formData.severity}
        >
          Continue
          <RiArrowRightLine className="btn-icon" />
        </button>
      </div>
    </div>
  );
};

export default Step4SeverityDescription;