// Google Analytics utility functions

/**
 * Track a custom event
 * @param {string} action - The action being tracked
 * @param {string} category - The category of the event
 * @param {string} label - Optional label for the event
 * @param {number} value - Optional numeric value
 */
export const trackEvent = (action, category, label = null, value = null) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

/**
 * Track user registration
 */
export const trackRegistration = () => {
  trackEvent('sign_up', 'engagement');
};

/**
 * Track user login
 */
export const trackLogin = () => {
  trackEvent('login', 'engagement');
};

/**
 * Track pothole report submission
 * @param {string} location - The location of the pothole
 * @param {boolean} isAnonymous - Whether the report is anonymous
 */
export const trackPotholeReport = (location, isAnonymous = false) => {
  trackEvent('pothole_report', 'engagement', location, isAnonymous ? 0 : 1);
};

/**
 * Track file upload
 * @param {string} fileType - Type of file uploaded (image/video)
 * @param {number} fileCount - Number of files uploaded
 */
export const trackFileUpload = (fileType, fileCount) => {
  trackEvent('file_upload', 'engagement', fileType, fileCount);
};

/**
 * Track gallery interaction
 * @param {string} action - The action performed (view, filter, upvote)
 * @param {string} details - Additional details about the action
 */
export const trackGalleryInteraction = (action, details = null) => {
  trackEvent(action, 'gallery', details);
};

/**
 * Track map interaction
 * @param {string} action - The action performed (click, zoom, pan)
 */
export const trackMapInteraction = (action) => {
  trackEvent(action, 'map');
};

/**
 * Track share action
 * @param {string} platform - The platform shared to (whatsapp, twitter, etc.)
 */
export const trackShare = (platform) => {
  trackEvent('share', 'social', platform);
};

/**
 * Track error
 * @param {string} errorType - Type of error
 * @param {string} errorMessage - Error message
 */
export const trackError = (errorType, errorMessage) => {
  trackEvent('error', 'system', errorType);
}; 