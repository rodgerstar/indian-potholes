import React, { useState, useEffect, useCallback } from 'react';
import { potholeAPI, handleApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as turf from '@turf/turf';
import LoadingSpinner from '../components/LoadingSpinner';
import { reverseGeocode } from '../utils/geocoding';
import { trackPotholeReport, trackFileUpload } from '../utils/analytics';
import secureStorage from '../utils/secureStorage';
import toast from 'react-hot-toast';
import { sanitizeInput } from '../utils/sanitization';
import { 
  Step1PhotoUpload,
  Step2Location, 
  Step4SeverityDescription,
  Step5Anonymous,
  Step6Review
} from '../components/shared/UploadSteps';
import { RiUserLine } from 'react-icons/ri';
import { getApiBaseUrl } from '../config/environment.js';

const defaultCenter = [28.6139, 77.2090]; // Delhi coordinates as default

// TODO: Extract Step3Constituencies to shared component
// FIXME: This component is very complex and needs refactoring
// Currently contains constituency selection logic that should be abstracted

// Old Step1PhotoUpload component removed - now using shared component from UploadSteps

const Step2Location = ({ formData, setFormData, markerPosition, setMarkerPosition, mapCenter, setMapCenter, assemblyGeojson, parliamentGeojson, geojsonLoading, onNext, onBack }) => {
  const [locationName, setLocationName] = useState(formData.locationName || '');

  const sanitizeLocationName = (input) => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
      // DO NOT trim or collapse spaces
  };

  const handleMapClick = async (e) => {
    const lat = e.lat;
    const lng = e.lng;
    
    // Immediately update marker and form data
    setMarkerPosition([lat, lng]);
    setFormData(prev => {
      const newData = {
        ...prev,
        latitude: lat,
        longitude: lng
      };
      return newData;
    });

    // Reverse geocode to get location name
    try {
      const locationName = await reverseGeocode(lat, lng);
      if (locationName) {
        setLocationName(locationName);
        setFormData(prev => ({
          ...prev,
          locationName
        }));
        // Location name set successfully
      }
    } catch (error) {
      // Set a default location name if geocoding fails
      setLocationName(`Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setFormData(prev => ({
        ...prev,
        locationName: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }));
    }
  };

  const handleLocationNameChange = (e) => {
    const value = sanitizeLocationName(e.target.value);
    setLocationName(value);
    setFormData(prev => ({
      ...prev,
      locationName: value
    }));
  };

  const handleNext = () => {
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please select a location on the map');
      return;
    }
    if (!locationName.trim()) {
      toast.error('Please enter a location name');
      return;
    }
    onNext();
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Step 2: Select Location</h2>
        <p>Click on the map to mark the exact location of the pothole</p>
      </div>

      <div className="form-section">
        <label className="form-label">
          Select Location on Map *
        </label>
        <div className="osm-disclaimer" style={{ marginBottom: '0.5rem' }}>
          <strong>Note:</strong> The map below is powered by <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>, an open-source mapping platform. We have not developed this map. <span style={{ color: '#b91c1c', fontWeight: 600 }}>It may contain inaccuracies in the depiction of international or regional boundaries.</span>
        </div>
        <div className="map-container" style={{ position: 'relative' }}>
          <LeafletMap
            center={mapCenter}
            zoom={15}
            onClick={geojsonLoading ? undefined : handleMapClick}
            markers={markerPosition ? [{ position: markerPosition }] : []}
            height="400px"
            className={geojsonLoading ? 'map-disabled' : ''}
          />
          {geojsonLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}>
              <LoadingSpinner />
              <span style={{ marginLeft: 12 }}>Loading map boundaries...</span>
            </div>
          )}
        </div>
        <div className="map-controls">
          <button
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  async (position) => {
                    const userLocation = [position.coords.latitude, position.coords.longitude];
                    setMapCenter(userLocation);
                    setMarkerPosition(userLocation);
                    setFormData(prev => ({
                      ...prev,
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude
                    }));
                    // Reverse geocode to get location name
                    const locationName = await reverseGeocode(position.coords.latitude, position.coords.longitude);
                    if (locationName) {
                      setLocationName(locationName);
                      setFormData(prev => ({
                        ...prev,
                        locationName
                      }));
                    }
                  },
                  (error) => {
                    toast.error('Could not get your location. Please select manually on the map.');
                  }
                );
              }
            }}
            className="location-btn"
          >
            <RiNavigationLine className="location-icon" />
            Use My Location
          </button>
        </div>
        <p className="map-hint">
          Click on the map to select the exact location of the pothole
        </p>
      </div>

      <div className="form-section">
        <label className="form-label">
          Location Name *
        </label>
        <div className="form-input-icon">
          <RiMapPinLine className="icon" />
          <input
            type="text"
            value={locationName}
            onChange={handleLocationNameChange}
            onKeyDown={e => {
              // Explicitly allow space key
              if (e.key === ' ') {
                e.stopPropagation(); // Prevent any parent from blocking
                return;
              }
            }}
            placeholder="e.g., MG Road near Metro Station, Bangalore"
            className="form-input"
          />
        </div>
      </div>

      <div className="step-actions">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary btn-lg"
        >
          <RiArrowLeftLine className="step-icon" />
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn btn-primary btn-lg"
          disabled={!formData.latitude || !formData.longitude || !locationName.trim()}
        >
          Next Step
          <RiArrowRightLine className="step-icon" />
        </button>
      </div>
    </div>
  );
};

const Step3Constituencies = ({ formData, setFormData, states, constituencies, parliamentaryConstituencies, loadingStates, loadingConstituencies, loadingParliamentaryConstituencies, autofillFailed, setAutofillFailed, assemblyGeojson, parliamentGeojson, onNext, onBack }) => {
  const [showManualSelection, setShowManualSelection] = useState(autofillFailed);

  // Helper: Clean constituency name by removing SC, ST, OBC suffixes
  const cleanConstituencyName = (constituencyName) => {
    if (!constituencyName) return '';
    
    let cleaned = constituencyName;
    
    // Remove common reserved seat suffixes (both formats)
    const suffixPatterns = [
      / SC$/, / ST$/, / OBC$/, / GEN$/,  // Space + suffix
      / \(SC\)$/, / \(ST\)$/, / \(OBC\)$/, / \(GEN\)$/  // (Suffix) format
    ];
    
    for (const pattern of suffixPatterns) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '');
        break;
      }
    }
    
    return cleaned.trim();
  };

  // Helper: Find constituency for a point
  const getConstituenciesForPoint = (lat, lng) => {
    if (!assemblyGeojson || !parliamentGeojson) return {};
    const point = turf.point([lng, lat]);
    let assembly = null, parliament = null;
    for (const feature of assemblyGeojson.features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        assembly = feature.properties;
        break;
      }
    }
    for (const feature of parliamentGeojson.features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        parliament = feature.properties;
        break;
      }
    }
    return { assembly, parliament };
  };

  // Autofill logic for a given lat/lng
  const autofillFromLatLng = useCallback(async (lat, lng) => {
    if (!assemblyGeojson || !parliamentGeojson) {
      toast.error('Constituency boundaries not loaded yet. Please try again in a moment.');
      return;
    }
    const { assembly, parliament } = getConstituenciesForPoint(lat, lng);
    let autofilledMLA = '';
    let autofilledMP = '';
    let autofilledState = '';
    let autofilledAC = '';
    let autofilledPC = '';
    if (assembly) {
      autofilledState = assembly.ST_NAME || assembly.st_name || '';
      autofilledAC = assembly.AC_NAME || assembly.ac_name || '';
      setFormData(prev => ({
        ...prev,
        state: autofilledState,
        constituency: autofilledAC,
      }));
      // Fetch MLA from backend
      try {
        const cleanedConstituencyName = cleanConstituencyName(autofilledAC);
        const result = await potholeAPI.getMLAAndParty(autofilledState, cleanedConstituencyName);
        if (result) {
          autofilledMLA = result.mla || '';
          setFormData(prev => ({
            ...prev,
            mla: autofilledMLA,
          }));
        }
      } catch (error) {
        // silent fail
      }
    } else {
      toast.error('No assembly constituency found for this location.');
    }
    if (parliament) {
      autofilledPC = parliament.pc_name;
      setFormData(prev => ({
        ...prev,
        parliamentaryConstituency: autofilledPC,
      }));
      try {
        const pcName = cleanConstituencyName(autofilledPC);
        const stateName = parliament.st_name;
        const mpResult = await potholeAPI.getMPByPC(pcName, stateName);
        if (mpResult) {
          autofilledMP = mpResult.mp_name || '';
          setFormData(prev => ({
            ...prev,
            mp: autofilledMP,
          }));
        }
      } catch (error) {
        // silent fail
      }
    } else {
      toast.error('No parliamentary constituency found for this location.');
    }
    // If either MLA or MP is missing, set autofill failed
    setTimeout(() => {
      const failed = !autofilledMLA || !autofilledMP;
      setAutofillFailed(failed);
      setShowManualSelection(failed);
    }, 0);
  }, [assemblyGeojson, parliamentGeojson]);

  const handleConstituencyChange = async (constituency) => {
    setFormData(prev => ({
      ...prev,
      constituency,
      mla: ''
    }));

    if (constituency && formData.state) {
      try {
        const cleanedConstituencyName = cleanConstituencyName(constituency);
        const result = await potholeAPI.getMLAAndParty(formData.state, cleanedConstituencyName);
        if (result) {
          setFormData(prev => ({
            ...prev,
            mla: result.mla || ''
          }));
        }
      } catch (error) {
        // silent fail
      }
    }
    
    // Hide manual selection if both MLA and MP are filled
    if (constituency && formData.parliamentaryConstituency) {
      setAutofillFailed(false);
      setShowManualSelection(false);
    }
  };

  const handleParliamentaryConstituencyChange = async (parliamentaryConstituency) => {
    setFormData(prev => ({
      ...prev,
      parliamentaryConstituency,
      mp: ''
    }));

    if (parliamentaryConstituency && formData.state) {
      try {
        const cleanedConstituencyName = cleanConstituencyName(parliamentaryConstituency);
        const result = await potholeAPI.getMPByPC(cleanedConstituencyName, formData.state);
        if (result) {
          setFormData(prev => ({
            ...prev,
            mp: result.mp_name || ''
          }));
        }
      } catch (error) {
        // silent fail
      }
    }
    
    // Hide manual selection if both MLA and MP are filled
    if (parliamentaryConstituency && formData.constituency) {
      setAutofillFailed(false);
      setShowManualSelection(false);
    }
  };

  const handleStateChange = (state) => {
    setFormData(prev => ({ 
      ...prev, 
      state, 
      constituency: '',
      parliamentaryConstituency: ''
    }));
  };

  const handleNext = () => {
    if (!formData.state) {
      toast.error('Please select a state');
      return;
    }
    if (!formData.constituency) {
      toast.error('Please select an assembly constituency');
      return;
    }
    if (!formData.parliamentaryConstituency) {
      toast.error('Please select a parliamentary constituency');
      return;
    }
    onNext();
  };

  // Try autofill on component mount and when coordinates change
  useEffect(() => {
    if (formData.latitude && formData.longitude && assemblyGeojson && parliamentGeojson) {
      autofillFromLatLng(formData.latitude, formData.longitude);
    }
  }, [formData.latitude, formData.longitude, assemblyGeojson, parliamentGeojson]);

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Step 3: Constituency Information</h2>
        <p>We'll try to automatically find your representatives, or you can select them manually</p>
      </div>

      {/* Authority Information */}
      <div className="form-section">
        <h3 className="section-title">Your Representatives</h3>
        <div className="authority-grid">
          {[
            { name: 'mp', label: 'MP Name', placeholder: 'Member of Parliament' },
            { name: 'mla', label: 'MLA Name', placeholder: 'Member of Legislative Assembly', readOnly: true },
            { name: 'corporator', label: 'Corporator Name (optional)', placeholder: 'Local corporator name (optional)' },
            { name: 'contractor', label: 'Contractor Name (optional)', placeholder: 'Name of the road contractor (optional)' },
            { name: 'engineer', label: 'Engineer Name (optional)', placeholder: 'Name of the supervising engineer (optional)' }
          ].map((field) => (
            <div key={field.name} className="authority-field">
              <label className="form-label">
                {field.label}
              </label>
              <div className="form-input-icon">
                <RiUserLine className="icon" />
                <input
                  type="text"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: sanitizeInput(e.target.value) }))}
                  placeholder={field.placeholder}
                  className="form-input"
                  readOnly={field.name === 'mla'}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Selection - Only show when autofill failed */}
      {showManualSelection && (
        <div className="form-section">
          <div className="autofill-failed-notice" style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '8px', 
            padding: '12px 16px', 
            marginBottom: '16px',
            fontSize: '14px',
            color: '#856404'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🤔</span>
              <div>
                <strong>Oops! Our smart system couldn't figure out your exact constituency.</strong>
                <br />
                <span style={{ fontSize: '13px', opacity: 0.8 }}>
                  We're still fine-tuning our location magic! Please help us by selecting your constituencies below.
                </span>
              </div>
            </div>
          </div>
          <div className="authority-grid">
            <div className="authority-field">
              <label className="form-label">
                State *
              </label>
              <div className="form-input-icon">
                <RiUserLine className="icon" />
                <select
                  name="state"
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="form-input"
                  disabled={loadingStates}
                >
                  <option value="">Select State</option>
                  {Array.isArray(states) && states.map(state => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="authority-field">
              <label className="form-label">
                Assembly Constituency *
              </label>
              <div className="form-input-icon">
                <RiUserLine className="icon" />
                <select
                  name="constituency"
                  value={formData.constituency}
                  onChange={(e) => handleConstituencyChange(e.target.value)}
                  className="form-input"
                  disabled={loadingConstituencies || !formData.state}
                >
                  <option value="">Select Assembly Constituency</option>
                  {Array.isArray(constituencies) && constituencies.map((constituency) => (
                    <option key={constituency} value={constituency}>
                      {constituency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="authority-field">
              <label className="form-label">
                Parliamentary Constituency *
              </label>
              <div className="form-input-icon">
                <RiUserLine className="icon" />
                <select
                  name="parliamentaryConstituency"
                  value={formData.parliamentaryConstituency}
                  onChange={(e) => handleParliamentaryConstituencyChange(e.target.value)}
                  className="form-input"
                  disabled={loadingParliamentaryConstituencies || !formData.state}
                >
                  <option value="">Select Parliamentary Constituency</option>
                  {Array.isArray(parliamentaryConstituencies) && parliamentaryConstituencies.map((constituency) => (
                    <option key={constituency} value={constituency}>
                      {constituency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="step-actions">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary btn-lg"
        >
          <RiArrowLeftLine className="step-icon" />
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn btn-primary btn-lg"
          disabled={!formData.state || !formData.constituency || !formData.parliamentaryConstituency}
        >
          Next Step
          <RiArrowRightLine className="step-icon" />
        </button>
      </div>
    </div>
  );
};

const Step4SeverityDescription = ({ formData, setFormData, onNext, onBack }) => {
  const severityOptions = [
    { value: 'low', label: 'Low', description: 'Small pothole, minor inconvenience' },
    { value: 'medium', label: 'Medium', description: 'Moderate size, noticeable damage' },
    { value: 'high', label: 'High', description: 'Large pothole, significant hazard' },
    { value: 'critical', label: 'Critical', description: 'Very large, dangerous to vehicles' }
  ];

  const handleSeverityChange = (severity) => {
    setFormData(prev => ({ ...prev, severity }));
  };

  const handleDescriptionChange = (e) => {
    // Don't sanitize on every keystroke - just store the raw input
    const description = e.target.value;
    setFormData(prev => ({ ...prev, description }));
  };

  const handleDescriptionBlur = (e) => {
    // Sanitize when the field loses focus
    const description = sanitizeInput(e.target.value);
    setFormData(prev => ({ ...prev, description }));
  };

  const handleNext = () => {
    if (!formData.severity) {
      toast.error('Please select a severity level');
      return;
    }
    onNext();
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Step 4: Severity & Description</h2>
        <p>Help authorities understand the urgency and details of the pothole</p>
      </div>
      
      <div className="form-section">
        <label className="form-label">
          Severity Level *
        </label>
        <div className="severity-options">
          {severityOptions.map((option) => (
            <div
              key={option.value}
              className={`severity-option ${formData.severity === option.value ? 'selected' : ''}`}
              onClick={() => handleSeverityChange(option.value)}
            >
              <div className="severity-header">
                <div className="severity-label">{option.label}</div>
                <div className="severity-indicator">
                  {formData.severity === option.value && <RiCheckLine />}
                </div>
              </div>
              <div className="severity-description">{option.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">
          Description (optional)
        </label>
        <textarea
          className="form-textarea"
          placeholder="Describe the pothole in detail (optional). Include information about size, depth, location on the road, any visible damage to vehicles, etc."
          value={formData.description || ''}
          onChange={handleDescriptionChange}
          onBlur={handleDescriptionBlur}
          rows={5}
          maxLength={500}
        />
        <div className="form-hint">
          {formData.description ? formData.description.length : 0}/500 characters
        </div>
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          <RiArrowLeftLine /> Back
        </button>
        <button type="button" className="btn btn-primary" onClick={handleNext}>
          Next <RiArrowRightLine />
        </button>
      </div>
    </div>
  );
};

const Step5Anonymous = ({ isAnonymous, setIsAnonymous, onNext, onBack }) => (
  <div className="step-container">
    <div className="step-header">
      <h2>Step 5: Anonymous Reporting</h2>
      <p>Choose whether you want to report anonymously or with your name</p>
    </div>
    <div className="form-section">
      <div className="anonymous-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={e => setIsAnonymous(e.target.checked)}
            className="checkbox-input"
          />
          <span className="checkbox-custom"></span>
          <span className="checkbox-text">Report anonymously</span>
        </label>
        <p className="anonymous-hint">When checked, your name will not be displayed with this report</p>
      </div>
    </div>
    <div className="step-actions">
      <button type="button" onClick={onBack} className="btn btn-secondary btn-lg">
        <RiArrowLeftLine className="step-icon" />
        Back
      </button>
      <button type="button" onClick={onNext} className="btn btn-primary btn-lg">
        Review Report
        <RiArrowRightLine className="step-icon" />
      </button>
    </div>
  </div>
);

const Step6Review = ({ formData, selectedFiles, filePreviews, onSubmit, onBack, loading, uploadProgress, isGuest, isAnonymous, recaptchaToken, setRecaptchaToken }) => {
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Step 5: Review & Submit</h2>
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
                        <video src={preview} controls className="preview-media" />
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

const UploadPothole = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    locationName: '',
    latitude: defaultCenter[0],
    longitude: defaultCenter[1],
    state: '',
    constituency: '',
    parliamentaryConstituency: '',
    contractor: '',
    engineer: '',
    corporator: '',
    mla: '',
    mp: '',
    severity: '', // Added for Step 4
    description: '' // Added for Step 4
  });
  
  const [states, setStates] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [parliamentaryConstituencies, setParliamentaryConstituencies] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [loadingParliamentaryConstituencies, setLoadingParliamentaryConstituencies] = useState(false);
  const [autofillFailed, setAutofillFailed] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadRetries, setUploadRetries] = useState(0);
  
  const [assemblyGeojson, setAssemblyGeojson] = useState(null);
  const [parliamentGeojson, setParliamentGeojson] = useState(null);
  const [geojsonLoading, setGeojsonLoading] = useState(true);

  const { user } = useAuth();
  const isGuest = !user;
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();

  // Load saved data from sessionStorage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('potholeReportDraft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed.formData || formData);
        setMapCenter(parsed.mapCenter || defaultCenter);
        setMarkerPosition(parsed.markerPosition || null);
        // Note: We can't restore file data from sessionStorage due to security restrictions
        // But we can show a message to the user
        if (parsed.hasFiles) {
          toast.success('Previous draft loaded! Please re-upload your photo/video.');
        }
      } catch (error) {
        sessionStorage.removeItem('potholeReportDraft');
      }
    }
  }, []);

  // Save data to sessionStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      formData,
      mapCenter,
      markerPosition,
      hasFiles: selectedFiles.length > 0
    };
    sessionStorage.setItem('potholeReportDraft', JSON.stringify(dataToSave));
  }, [formData, mapCenter, markerPosition, selectedFiles]);

  // Fetch states on component mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch constituencies when state changes
  useEffect(() => {
    if (formData.state) {
      fetchConstituencies(formData.state);
      fetchParliamentaryConstituencies(formData.state);
    } else {
      setConstituencies([]);
      setParliamentaryConstituencies([]);
    }
  }, [formData.state]);

  // Load GeoJSONs on mount
  useEffect(() => {
    const fetchGeojsons = async () => {
      setGeojsonLoading(true);
      try {
        const [acRes, pcRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}/geo/india-ac`),
          fetch(`${getApiBaseUrl()}/geo/india-pc`)
        ]);
        const [acJson, pcJson] = await Promise.all([
          acRes.json().catch(e => { throw e; }),
          pcRes.json().catch(e => { throw e; })
        ]);
        setAssemblyGeojson(acJson);
        setParliamentGeojson(pcJson);
      } catch (err) {
        toast.error('Failed to load constituency boundaries');
      } finally {
        setGeojsonLoading(false);
      }
    };
    fetchGeojsons();
  }, []);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const states = await potholeAPI.getConstituencies();
      setStates(Array.isArray(states) ? states : []);
    } catch (error) {
      toast.error('Failed to load states');
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchConstituencies = async (state) => {
    setLoadingConstituencies(true);
    try {
      const constituencies = await potholeAPI.getConstituencies(state);
      setConstituencies(constituencies);
    } catch (error) {
      toast.error('Failed to load constituencies');
    } finally {
      setLoadingConstituencies(false);
    }
  };

  const fetchParliamentaryConstituencies = async (state) => {
    setLoadingParliamentaryConstituencies(true);
    try {
      const constituencies = await potholeAPI.getParliamentaryConstituencies(state);
      setParliamentaryConstituencies(constituencies);
    } catch (error) {
      toast.error('Failed to load parliamentary constituencies');
    } finally {
      setLoadingParliamentaryConstituencies(false);
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get current form data with any pending updates
    const currentFormData = {
      ...formData,
      latitude: formData.latitude || markerPosition?.[0] || defaultCenter[0],
      longitude: formData.longitude || markerPosition?.[1] || defaultCenter[1],
      locationName: formData.locationName || 'Selected Location'
    };
    
    // Validate required fields
    if (!currentFormData.latitude || !currentFormData.longitude || 
        currentFormData.latitude === undefined || currentFormData.longitude === undefined ||
        currentFormData.latitude === null || currentFormData.longitude === null ||
        isNaN(Number(currentFormData.latitude)) || isNaN(Number(currentFormData.longitude))) {
      toast.error('Please select a location on the map in Step 2');
      return;
    }
    
    if (!currentFormData.locationName || !currentFormData.locationName.trim()) {
      toast.error('Please enter a location name in Step 2');
      return;
    }
    
    if (!currentFormData.state || !currentFormData.constituency) {
      toast.error('Please select state and constituency in Step 3');
      return;
    }

    if (!currentFormData.severity) {
      toast.error('Please select a severity level in Step 4');
      return;
    }

    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please upload at least one photo or video');
      return;
    }
    
    // For guests, require reCAPTCHA
    if (isGuest && !recaptchaToken) {
      toast.error('Please complete the verification (reCAPTCHA) before submitting.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    try {
      // Ensure coordinates are valid numbers
      const finalLatitude = Number(currentFormData.latitude);
      const finalLongitude = Number(currentFormData.longitude);
      
      if (isNaN(finalLatitude) || isNaN(finalLongitude)) {
        toast.error('Invalid coordinates. Please select a location on the map.');
        return;
      }
      
      const submitData = new FormData();
      selectedFiles.forEach(file => submitData.append('media', file));
      submitData.append('locationName', currentFormData.locationName.trim());
      submitData.append('latitude', finalLatitude.toString());
      submitData.append('longitude', finalLongitude.toString());
      submitData.append('state', currentFormData.state);
      submitData.append('constituency', currentFormData.constituency);
      submitData.append('parliamentaryConstituency', currentFormData.parliamentaryConstituency || '');
      submitData.append('contractor', (currentFormData.contractor || '').trim());
      submitData.append('engineer', (currentFormData.engineer || '').trim());
      submitData.append('corporator', (currentFormData.corporator || '').trim());
      submitData.append('mla', (currentFormData.mla || '').trim());
      submitData.append('mp', (currentFormData.mp || '').trim());
      submitData.append('severity', currentFormData.severity);
      submitData.append('description', currentFormData.description.trim());
      submitData.append('isAnonymous', isAnonymous); // Add isAnonymous for logged-in users
      
      // Add reCAPTCHA token for guests
      if (isGuest && recaptchaToken) {
        submitData.append('recaptchaToken', recaptchaToken);
      }


      // Create custom axios instance for upload with progress
      const axios = (await import('axios')).default;
      const tokenResult = secureStorage.getItem('token');
      const token = tokenResult instanceof Promise ? await tokenResult : tokenResult;
      
      const uploadAxios = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Add progress interceptor
      uploadAxios.interceptors.request.use((config) => {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        };
        return config;
      });

      await uploadAxios.post('/potholes', submitData);
      
      // Track successful pothole report
      trackPotholeReport(currentFormData.locationName, false); // Report is not anonymous
      
      // Track file upload if files were uploaded
      if (selectedFiles.length > 0) {
        const imageCount = selectedFiles.filter(file => file.type.startsWith('image/')).length;
        const videoCount = selectedFiles.filter(file => file.type.startsWith('video/')).length;
        if (imageCount > 0) trackFileUpload('image', imageCount);
        if (videoCount > 0) trackFileUpload('video', videoCount);
      }
      
      // Clear sessionStorage after successful submission
      sessionStorage.removeItem('potholeReportDraft');
      
      toast.success('Pothole report submitted successfully!');
      navigate('/gallery');
    } catch (error) {
      try {
        handleApiError(error);
      } catch (apiError) {
        // Retry logic for network errors
        if (apiError.type === 'network' && uploadRetries < 3) {
          setUploadRetries(prev => prev + 1);
          toast.error(`Upload failed. Retrying... (${uploadRetries + 1}/3)`);
          setTimeout(() => handleSubmit(e), 2000);
          return;
        }
        
        toast.error(apiError.message);
        setUploadRetries(0);
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleGPSFound = (lat, lng) => {
    setMapCenter([lat, lng]);
    setMarkerPosition([lat, lng]);
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PhotoUpload
            formData={formData}
            setFormData={setFormData}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            filePreviews={filePreviews}
            setFilePreviews={setFilePreviews}
            errors={errors}
            setErrors={setErrors}
            onNext={handleNext}
            onGPSFound={handleGPSFound}
          />
        );
      case 2:
        return (
          <Step2Location
            formData={formData}
            setFormData={setFormData}
            markerPosition={markerPosition}
            setMarkerPosition={setMarkerPosition}
            mapCenter={mapCenter}
            setMapCenter={setMapCenter}
            assemblyGeojson={assemblyGeojson}
            parliamentGeojson={parliamentGeojson}
            geojsonLoading={geojsonLoading}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <Step3Constituencies
            formData={formData}
            setFormData={setFormData}
            states={states}
            constituencies={constituencies}
            parliamentaryConstituencies={parliamentaryConstituencies}
            loadingStates={loadingStates}
            loadingConstituencies={loadingConstituencies}
            loadingParliamentaryConstituencies={loadingParliamentaryConstituencies}
            autofillFailed={autofillFailed}
            setAutofillFailed={setAutofillFailed}
            assemblyGeojson={assemblyGeojson}
            parliamentGeojson={parliamentGeojson}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <Step4SeverityDescription
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        if (isGuest) {
          return (
            <Step6Review
              formData={formData}
              selectedFiles={selectedFiles}
              filePreviews={filePreviews}
              onSubmit={handleSubmit}
              onBack={handleBack}
              loading={loading}
              uploadProgress={uploadProgress}
              isGuest={isGuest}
              isAnonymous={false}
              recaptchaToken={recaptchaToken}
              setRecaptchaToken={setRecaptchaToken}
            />
          );
        } else {
          return (
            <Step5Anonymous
              isAnonymous={isAnonymous}
              setIsAnonymous={setIsAnonymous}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        }
      case 6:
        return (
          <Step6Review
            formData={formData}
            selectedFiles={selectedFiles}
            filePreviews={filePreviews}
            onSubmit={handleSubmit}
            onBack={handleBack}
            loading={loading}
            uploadProgress={uploadProgress}
            isGuest={isGuest}
            isAnonymous={isAnonymous}
            recaptchaToken={recaptchaToken}
            setRecaptchaToken={setRecaptchaToken}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-card">
          <div className="upload-header">
            <h1 className="upload-title">Report a Pothole</h1>
            <p className="upload-subtitle">Help improve India's roads by reporting potholes in your area</p>
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentStep / 6) * 100}%` }}
              ></div>
            </div>
            <div className="progress-text">
              Step {currentStep} of 6
            </div>
          </div>

          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default UploadPothole;

