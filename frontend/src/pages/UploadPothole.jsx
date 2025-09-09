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


/**
 * Main UploadPothole Component
 * TODO: Consider breaking this down further into smaller components
 * FIXME: Still contains complex state management that could be simplified
 */
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
    severity: '',
    description: '',
    selectedFiles: [], // Add to store files from Step1
    filePreviews: []   // Add to store previews from Step1
  });
  
  
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadRetries, setUploadRetries] = useState(0);
  
  const [geojsonLoading, setGeojsonLoading] = useState(false);

  const { user } = useAuth();
  const isGuest = !user;
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const navigate = useNavigate();

  // Load saved data from sessionStorage on mount
  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem('potholeReportDraft');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(prev => ({ ...prev, ...parsed.formData }));
          setMapCenter(parsed.mapCenter || defaultCenter);
          setMarkerPosition(parsed.markerPosition || null);
          if (parsed.hasFiles) {
            toast.success('Previous draft loaded! Please re-upload your photo/video.');
          }
        } catch (error) {
          sessionStorage.removeItem('potholeReportDraft');
        }
      }
    } catch (error) {
      console.warn('Failed to load draft from sessionStorage:', error);
    }
  }, []);

  // Save data to sessionStorage whenever it changes
  useEffect(() => {
    try {
      const { selectedFiles, filePreviews, ...formDataWithoutFiles } = formData;
      const dataToSave = {
        formData: formDataWithoutFiles,
        mapCenter,
        markerPosition,
        hasFiles: selectedFiles?.length > 0
      };
      sessionStorage.setItem('potholeReportDraft', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Failed to save draft to sessionStorage:', error);
    }
  }, [formData, mapCenter, markerPosition]);



  /**
   * Handle moving to next step
   */
  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  /**
   * Handle moving to previous step
   */
  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  /**
   * Handle GPS location found from image
   */
  const handleGPSFound = async (lat, lng) => {
    // Additional validation to ensure coordinates are valid before setting state
    if (typeof lat === 'number' && typeof lng === 'number' && 
        !isNaN(lat) && !isNaN(lng) && 
        lat >= -90 && lat <= 90 && 
        lng >= -180 && lng <= 180) {
      setMapCenter([lat, lng]);
      setMarkerPosition([lat, lng]);
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    } else {
      console.warn('Invalid GPS coordinates received:', { lat, lng });
      toast.error('Invalid GPS coordinates found in image. Please select location manually.');
    }
  };

  /**
   * Handle form submission
   * TODO: Consider extracting this large function to a custom hook
   */
  const handleSubmit = async (e) => {
    // Support being called without an event (e.g., on retry)
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
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
    

    if (!currentFormData.severity) {
      toast.error('Please select a severity level in Step 4');
      return;
    }

    if (!currentFormData.selectedFiles || currentFormData.selectedFiles.length === 0) {
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
      currentFormData.selectedFiles.forEach(file => submitData.append('media', file));
      submitData.append('locationName', currentFormData.locationName.trim());
      submitData.append('latitude', finalLatitude.toString());
      submitData.append('longitude', finalLongitude.toString());
      // Constituency assignment will be handled in background by admin
      submitData.append('contractor', (currentFormData.contractor || '').trim());
      submitData.append('engineer', (currentFormData.engineer || '').trim());
      submitData.append('corporator', (currentFormData.corporator || '').trim());
      submitData.append('mla', (currentFormData.mla || '').trim());
      submitData.append('mp', (currentFormData.mp || '').trim());
      submitData.append('severity', currentFormData.severity);
      submitData.append('description', (currentFormData.description || '').trim());
      submitData.append('isAnonymous', isAnonymous);
      
      // Add reCAPTCHA token for guests
      if (isGuest && recaptchaToken) {
        submitData.append('recaptchaToken', recaptchaToken);
      }

      // Use the API service for upload with progress tracking
      const response = await potholeAPI.create(submitData, setUploadProgress);
      
      // Track successful pothole report
      trackPotholeReport(currentFormData.locationName, isAnonymous);
      
      // Track file upload if files were uploaded
      if (currentFormData.selectedFiles.length > 0) {
        const imageCount = currentFormData.selectedFiles.filter(file => file.type.startsWith('image/')).length;
        const videoCount = currentFormData.selectedFiles.filter(file => file.type.startsWith('video/')).length;
        if (imageCount > 0) trackFileUpload('image', imageCount);
        if (videoCount > 0) trackFileUpload('video', videoCount);
      }
      
      // Clear sessionStorage after successful submission
      try {
        sessionStorage.removeItem('potholeReportDraft');
      } catch (error) {
        console.warn('Failed to clear draft from sessionStorage:', error);
      }
      
      // Navigate to success page with report ID
      // potholeAPI.create returns response.data directly
      const reportId = response?.reportId ?? response?.data?.reportId;
      navigate('/report-submitted', { 
        state: { reportId },
        replace: true 
      });
    } catch (error) {
      try {
        handleApiError(error);
      } catch (apiError) {
        // Retry logic for network errors
        if (apiError.type === 'network' && uploadRetries < 3) {
          setUploadRetries(prev => prev + 1);
          toast.error(`Upload failed. Retrying... (${uploadRetries + 1}/3)`);
          // Do not pass the (possibly pooled) synthetic event on retry
          setTimeout(() => handleSubmit(), 2000);
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

  /**
   * Render the current step component
   */
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PhotoUpload
            onNext={handleNext}
            onGPSFound={handleGPSFound}
            formData={formData}
            setFormData={setFormData}
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
            geojsonLoading={geojsonLoading}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <Step4SeverityDescription
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        if (isGuest) {
          return (
            <Step6Review
              formData={formData}
              selectedFiles={formData.selectedFiles}
              filePreviews={formData.filePreviews}
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
      case 5:
        return (
          <Step6Review
            formData={formData}
            selectedFiles={formData.selectedFiles}
            filePreviews={formData.filePreviews}
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
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
            <div className="progress-text">
              Step {currentStep} of 5
            </div>
          </div>

          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default UploadPothole;
