import piexifjs from 'piexifjs';

/**
 * Convert GPS coordinates from DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 * @param {Array} dms - DMS array [degrees, minutes, seconds]
 * @param {string} ref - Reference direction (N, S, E, W)
 * @returns {number} Decimal degrees
 */
export const convertDMSToDD = (dms, ref) => {
  const degrees = dms[0];
  const minutes = dms[1];
  const seconds = dms[2];
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (ref === 'S' || ref === 'W') dd = -dd;
  return dd;
};

/**
 * Extract GPS data from image file
 * @param {File} file - Image file
 * @returns {Promise<Object|null>} GPS coordinates {lat, lng} or null if not found
 */
export const extractGPSFromImage = (file) => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const jpeg = e.target.result;
          const data = piexifjs.load(jpeg);
          
          if (data && data.GPS && Object.keys(data.GPS).length > 0) {
            const gps = data.GPS;
            
            // Check if we have the required GPS data
            if (gps[piexifjs.GPSIFD.GPSLatitude] && 
                gps[piexifjs.GPSIFD.GPSLongitude] && 
                gps[piexifjs.GPSIFD.GPSLatitudeRef] && 
                gps[piexifjs.GPSIFD.GPSLongitudeRef]) {
              
              const lat = gps[piexifjs.GPSIFD.GPSLatitude];
              const lon = gps[piexifjs.GPSIFD.GPSLongitude];
              const latRef = gps[piexifjs.GPSIFD.GPSLatitudeRef];
              const lonRef = gps[piexifjs.GPSIFD.GPSLongitudeRef];
              
              const latitude = convertDMSToDD(lat, latRef);
              const longitude = convertDMSToDD(lon, lonRef);
              
              resolve({ lat: latitude, lng: longitude });
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      };
      
      reader.onerror = function() {
        resolve(null);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      resolve(null);
    }
  });
};

/**
 * Get user's current location using browser geolocation API
 * @returns {Promise<Object>} GPS coordinates {lat, lng}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

/**
 * Validate GPS coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} Whether coordinates are valid
 */
export const validateGPSCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
};

/**
 * Calculate distance between two GPS points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format GPS coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Number of decimal places (default: 6)
 * @returns {string} Formatted coordinates
 */
export const formatGPSCoordinates = (lat, lng, precision = 6) => {
  if (!validateGPSCoordinates(lat, lng)) {
    return 'Invalid coordinates';
  }
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};