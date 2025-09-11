import React, { useState } from 'react';
import { RiMapPinLine, RiNavigationLine, RiArrowLeftLine, RiArrowRightLine } from 'react-icons/ri';
import LeafletMap from '../../LeafletMap';
import LoadingSpinner from '../../LoadingSpinner';
import { reverseGeocode, forwardGeocode } from '../../../utils/geocoding';
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
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);

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

  // Debounced suggestions for the Location Name input
  React.useEffect(() => {
    if (suppressSuggestions) { setSuggestions([]); setHighlightIndex(-1); return; }
    const q = (locationName || '').trim();
    if (q.length < 3) { setSuggestions([]); setHighlightIndex(-1); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const results = await forwardGeocode(q, { limit: 5 });
        if (!cancelled) {
          setSuggestions(results);
          setHighlightIndex(results.length > 0 ? 0 : -1);
        }
      } catch (_) {
        if (!cancelled) { setSuggestions([]); setHighlightIndex(-1); }
      }
    }, 450);
    return () => { cancelled = true; clearTimeout(t); };
  }, [locationName, suppressSuggestions]);

  const applySuggestion = async (sug) => {
    const lat = sug.lat;
    const lng = sug.lon;
    if (!validateGPSCoordinates(lat, lng)) return;
    setMarkerPosition([lat, lng]);
    setMapCenter([lat, lng]);
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      locationName: sug.display_name || prev.locationName || ''
    }));
    setLocationName(sug.display_name || locationName);
    setSuggestions([]);
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
    setSuppressSuggestions(true);
    setSuggestions([]);
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
    // User typing should re-enable suggestions
    setSuppressSuggestions(false);
    setLocationName(value);
    setFormData(prev => ({
      ...prev,
      locationName: value
    }));
  };

  // Geocode the typed location name to set the pin (when user finishes typing)
  const geocodeLocationName = async () => {
    const q = (locationName || '').trim();
    if (q.length < 3) return;
    try {
      const results = await forwardGeocode(q, { limit: 1 });
      if (Array.isArray(results) && results.length > 0) {
        const r = results[0];
        const lat = r.lat;
        const lng = r.lon;
        if (validateGPSCoordinates(lat, lng)) {
          setMarkerPosition([lat, lng]);
          setMapCenter([lat, lng]);
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            locationName: r.display_name || prev.locationName
          }));
          if (r.display_name) setLocationName(r.display_name);
          toast.success('Location set from address');
        }
      }
    } catch (err) {
      // silent fail
    }
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
      
      setSuppressSuggestions(true);
      setSuggestions([]);
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
  const handleNext = async () => {
    let lat = formData.latitude;
    let lng = formData.longitude;

    // If user typed a name but hasn't set coordinates, try forward geocoding now
    if ((lat === null || lat === undefined || lng === null || lng === undefined) && locationName.trim().length >= 3) {
      try {
        const res = await forwardGeocode(locationName.trim(), { limit: 1 });
        if (Array.isArray(res) && res.length > 0) {
          const r = res[0];
          lat = r.lat;
          lng = r.lon;
          if (validateGPSCoordinates(lat, lng)) {
            setMarkerPosition([lat, lng]);
            setMapCenter([lat, lng]);
            setFormData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              locationName: r.display_name || prev.locationName
            }));
            if (r.display_name) setLocationName(r.display_name);
            toast.success('Location set from address');
          }
        }
      } catch (_) { /* ignore */ }
    }

    // Require coordinates set
    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      toast.error('Please select a location on the map');
      return;
    }

    // Validate coordinates before proceeding
    if (!validateGPSCoordinates(lat, lng)) {
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
    : [22.9734, 78.6569]; // Default to India centroid if invalid (visual only)

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
        {/* Address Search (Forward Geocoding) */}
        {/* Search removed: we integrate suggestions into the Location Name field below */}

        <div className="section-header-modern">
          <h3 className="section-title-modern">
            <RiMapPinLine className="section-icon" />
            Map Location
            <span className="required-indicator">*</span>
          </h3>
          <p className="section-description">Click on the map to mark the exact pothole location</p>
        </div>

        <div className="map-container-modern" style={{ position: 'relative' }}>
          <LeafletMap
            center={validMapCenter}
            zoom={15}
            onClick={geojsonLoading ? undefined : handleMapClick}
            markers={validMarkerPosition ? [{ position: validMarkerPosition, draggable: true }] : []}
            onMarkerDragEnd={({ lat, lng }) => {
              setSuppressSuggestions(true);
              setSuggestions([]);
              if (!validateGPSCoordinates(lat, lng)) return;
              setMarkerPosition([lat, lng]);
              setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
              // Reverse geocode on drag end to update name
              reverseGeocode(lat, lng).then(n => {
                if (n) {
                  setLocationName(n);
                  setFormData(prev => ({ ...prev, locationName: n }));
                }
              }).catch(() => {});
            }}
            showPlaceHere={!geojsonLoading}
            placeHereLabel="Place pin here"
            showCrosshair={!geojsonLoading}
            height="400px"
            className={geojsonLoading ? 'map-disabled' : ''}
            showOsmDisclaimer={false}
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

        {/* Single, focused instruction below the map to encourage accurate pin placement */}
        <div style={{
          marginTop: 8,
          fontSize: '0.95rem',
          color: '#1f2937',
          background: '#f3f4f6',
          border: '1px solid #e5e7eb',
          borderRadius: '0.4rem',
          padding: '0.5rem 0.75rem',
        }}>
          Please place the pin exactly where the pothole is. You can tap the map, drag the pin, or pan the map and tap “Place pin here”. Accurate location helps authorities resolve your complaint faster.
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

        <div className="location-input-wrapper-modern" style={{ position: 'relative' }}>
          <RiMapPinLine className="location-input-icon" />
          <input
            type="text"
            value={locationName}
            onChange={handleLocationNameChange}
            onBlur={() => {
              // If coordinates are not yet set, try geocoding the typed address on blur
              if (!formData.latitude || !formData.longitude) {
                geocodeLocationName();
              }
              // Hide suggestions on blur
              setTimeout(() => setSuggestions([]), 150);
            }}
            onKeyDown={e => {
              // Explicitly allow space key
              if (e.key === ' ') {
                e.stopPropagation(); // Prevent any parent from blocking
                return;
              }
              if (e.key === 'ArrowDown' && suggestions.length > 0) {
                e.preventDefault();
                setHighlightIndex(i => {
                  const ni = (i + 1) % suggestions.length;
                  return ni;
                });
                return;
              }
              if (e.key === 'ArrowUp' && suggestions.length > 0) {
                e.preventDefault();
                setHighlightIndex(i => {
                  const ni = (i - 1 + suggestions.length) % suggestions.length;
                  return ni;
                });
                return;
              }
              if (e.key === 'Escape') {
                setSuggestions([]);
                return;
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestions.length > 0 && highlightIndex >= 0) {
                  applySuggestion(suggestions[highlightIndex]);
                } else {
                  geocodeLocationName();
                }
              }
            }}
            placeholder="e.g., MG Road near Metro Station, Bangalore"
            className="location-input-modern"
          />
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              zIndex: 10,
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 6,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              maxHeight: 240,
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              {suggestions.map((s, idx) => (
                <button
                  key={`${s.lat},${s.lon},${idx}`}
                  type="button"
                  onClick={() => applySuggestion(s)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: idx === highlightIndex ? '#f3f4f6' : 'white',
                    border: 'none',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: 14, color: '#111827' }}>{s.display_name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.class}/{s.type}</div>
                </button>
              ))}
            </div>
          )}
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
          disabled={!locationName.trim()}
        >
          Continue
          <RiArrowRightLine className="btn-icon" />
        </button>
      </div>
    </div>
  );
};

export default Step2Location;
