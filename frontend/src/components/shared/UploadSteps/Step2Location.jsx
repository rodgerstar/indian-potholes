import React, { useState } from 'react';
import { RiMapPinLine, RiNavigationLine, RiArrowLeftLine, RiArrowRightLine } from 'react-icons/ri';
import LeafletMap from '../../LeafletMap';
import LoadingSpinner from '../../LoadingSpinner';
import { reverseGeocode } from '../../../utils/geocoding';
import { sanitizeInput } from '../../../utils/sanitization';
import { getCurrentLocation, validateGPSCoordinates } from '../../../utils/gpsUtils';
import toast from 'react-hot-toast';

/**
 * Step 2: Location Selection Component
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data
 * @param {Function} props.setFormData - Form data setter  
 * @param {Array} props.markerPosition - Marker position [lat, lng]
 * @param {Function} props.setMarkerPosition - Marker position setter
 * @param {Array} props.mapCenter - Map center [lat, lng] 
 * @param {Function} props.setMapCenter - Map center setter
 * @param {boolean} props.geojsonLoading - Whether geojson is loading
 * @param {Function} props.onNext - Next step handler
 * @param {Function} props.onBack - Back step handler
 */
const Step2Location = ({ 
  formData, 
  setFormData, 
  markerPosition, 
  setMarkerPosition, 
  mapCenter, 
  setMapCenter,
  geojsonLoading,
  onNext, 
  onBack 
}) => {
  const [locationName, setLocationName] = useState(formData.locationName || '');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  /**
   * Sanitize location name input
   * @param {string} input - Raw input
   * @returns {string} Sanitized input
   */
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

  /**
   * Handle map click to set location
   * @param {Object} e - Map click event
   */
  const handleMapClick = async (e) => {
    const lat = e.lat;
    const lng = e.lng;
    
    // Validate coordinates before processing
    if (!validateGPSCoordinates(lat, lng)) {
      console.warn('Invalid coordinates received from map click:', { lat, lng });
      toast.error('Invalid coordinates received. Please try clicking again.');
      return;
    }
    
    // Immediately update marker and form data
    setMarkerPosition([lat, lng]);
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));

    // Reverse geocode to get location name
    try {
      const locationName = await reverseGeocode(lat, lng);
      if (locationName) {
        setLocationName(locationName);
        setFormData(prev => ({
          ...prev,
          locationName
        }));
      }
    } catch (error) {
      // Set a default location name if geocoding fails
      const defaultName = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setLocationName(defaultName);
      setFormData(prev => ({
        ...prev,
        locationName: defaultName
      }));
    }
  };

  /**
   * Handle location name input change
   * @param {Event} e - Input change event
   */
  const handleLocationNameChange = (e) => {
    const value = sanitizeLocationName(e.target.value);
    setLocationName(value);
    setFormData(prev => ({
      ...prev,
      locationName: value
    }));
  };

  /**
   * Get user's current location
   */
  const handleUseMyLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      
      // Validate coordinates before using them
      if (!validateGPSCoordinates(location.lat, location.lng)) {
        console.warn('Invalid GPS coordinates received from geolocation:', location);
        toast.error('Invalid location data received. Please select location manually on the map.');
        return;
      }
      
      const userLocation = [location.lat, location.lng];
      
      setMapCenter(userLocation);
      setMarkerPosition(userLocation);
      setFormData(prev => ({
        ...prev,
        latitude: location.lat,
        longitude: location.lng
      }));
      
      // Reverse geocode to get location name
      try {
        const locationName = await reverseGeocode(location.lat, location.lng);
        if (locationName) {
          setLocationName(locationName);
          setFormData(prev => ({
            ...prev,
            locationName
          }));
        }
      } catch (error) {
        // Silent fail on reverse geocoding
      }
      
      toast.success('Current location set successfully!');
    } catch (error) {
      toast.error(error.message || 'Could not get your location. Please select manually on the map.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please select a location on the map');
      return;
    }
    
    // Validate coordinates before proceeding
    if (!validateGPSCoordinates(formData.latitude, formData.longitude)) {
      toast.error('Invalid coordinates. Please select a valid location on the map');
      return;
    }
    
    if (!locationName.trim()) {
      toast.error('Please enter a location name');
      return;
    }
    onNext();
  };

  // Validate coordinates before passing to map
  const validMapCenter = Array.isArray(mapCenter) && 
    mapCenter.length === 2 && 
    validateGPSCoordinates(mapCenter[0], mapCenter[1]) 
    ? mapCenter 
    : [28.6139, 77.2090]; // Default to Delhi if invalid

  const validMarkerPosition = markerPosition && 
    Array.isArray(markerPosition) && 
    markerPosition.length === 2 && 
    validateGPSCoordinates(markerPosition[0], markerPosition[1]) 
    ? markerPosition 
    : null;

  return (
    <div className="step-container modern-step">
      {/* Header Section */}
      <div className="step-header-modern">
        <div className="step-badge">Step 2 of 5</div>
        <h2 className="step-title-modern">Select Location</h2>
        <p className="step-subtitle-modern">
          Mark the exact location of the pothole on the map and provide a descriptive name
        </p>
      </div>

      {/* Map Section */}
      <div className="map-section-modern">
        <div className="section-header-modern">
          <h3 className="section-title-modern">
            <RiMapPinLine className="section-icon" />
            Map Location
            <span className="required-indicator">*</span>
          </h3>
          <p className="section-description">Click on the map to mark the exact pothole location</p>
        </div>

        <div className="osm-disclaimer-modern">
          <strong>Note:</strong> The map below is powered by <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>, an open-source mapping platform. We have not developed this map. <span style={{ color: '#b91c1c', fontWeight: 600 }}>It may contain inaccuracies in the depiction of international or regional boundaries.</span>
        </div>

        <div className="map-container-modern" style={{ position: 'relative' }}>
          <LeafletMap
            center={validMapCenter}
            zoom={15}
            onClick={geojsonLoading ? undefined : handleMapClick}
            markers={validMarkerPosition ? [{ position: validMarkerPosition }] : []}
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

        <div className="map-controls-modern">
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isGettingLocation}
            className="location-btn-modern"
          >
            <RiNavigationLine className="btn-icon" />
            {isGettingLocation ? 'Getting Location...' : 'Use My Location'}
          </button>
        </div>
      </div>

      {/* Location Name Section */}
      <div className="location-name-section-modern">
        <div className="section-header-modern">
          <h3 className="section-title-modern">
            <RiMapPinLine className="section-icon" />
            Location Name
            <span className="required-indicator">*</span>
          </h3>
          <p className="section-description">Provide a descriptive name for the location</p>
        </div>

        <div className="location-input-wrapper-modern">
          <RiMapPinLine className="location-input-icon" />
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
            className="location-input-modern"
          />
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
          onClick={handleNext}
          className="btn btn-primary-modern btn-lg"
          disabled={!formData.latitude || !formData.longitude || !locationName.trim()}
        >
          Continue
          <RiArrowRightLine className="btn-icon" />
        </button>
      </div>
    </div>
  );
};

export default Step2Location;