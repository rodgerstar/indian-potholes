import { getFrontendBaseUrl } from './environment.js';

// Social Share Configuration
export const socialShareConfig = {
  // Website URL - uses environment-based configuration
  websiteUrl: getFrontendBaseUrl(),
  
  // App name
  appName: 'Indian Potholes',
  
  // Default hashtags
  hashtags: '#IndianPotholes #RoadSafety #India #Infrastructure #PotholeReport',
  
  // Default tagline
  tagline: '🚧 Help improve our roads! Report potholes and track their progress on Indian Potholes.',
  
  // Share text templates
  templates: {
    whatsapp: (pothole, config) => {
      const location = pothole.location.name;
      const status = pothole.status;
      const date = new Date(pothole.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const reportUrl = `${config.websiteUrl}/report/${pothole._id}`;
      return `Pothole ${status} in ${location} - Reported on ${date}. ${config.tagline}\n\n📍 Location: ${pothole.location.coordinates.latitude.toFixed(6)}, ${pothole.location.coordinates.longitude.toFixed(6)}\n\n🌐 View on: ${reportUrl}`;
    },
    
    twitter: (pothole, config) => {
      const location = pothole.location.name;
      const status = pothole.status;
      const date = new Date(pothole.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const reportUrl = `${config.websiteUrl}/report/${pothole._id}`;
      return `Pothole ${status} in ${location} - Reported on ${date}. ${config.tagline}\n\n📍 ${pothole.location.coordinates.latitude.toFixed(6)}, ${pothole.location.coordinates.longitude.toFixed(6)}\n\n${config.hashtags}\n\n${reportUrl}`;
    },
    
    facebook: (pothole, config) => {
      const location = pothole.location.name;
      const status = pothole.status;
      const date = new Date(pothole.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const reportUrl = `${config.websiteUrl}/report/${pothole._id}`;
      return `Pothole ${status} in ${location} - Reported on ${date}. ${config.tagline}\n\n📍 Location: ${pothole.location.coordinates.latitude.toFixed(6)}, ${pothole.location.coordinates.longitude.toFixed(6)}\n\n${config.hashtags}\n\n${reportUrl}`;
    },
    
    email: (pothole, config) => {
      const location = pothole.location.name;
      const status = pothole.status;
      const date = new Date(pothole.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const reportUrl = `${config.websiteUrl}/report/${pothole._id}`;
      return {
        subject: `Pothole Report - ${location}`,
        body: `Pothole ${status} in ${location} - Reported on ${date}. ${config.tagline}\n\n📍 Location: ${pothole.location.coordinates.latitude.toFixed(6)}, ${pothole.location.coordinates.longitude.toFixed(6)}\n\n🌐 View on: ${reportUrl}\n\n---\nThis report was shared from ${config.appName}.`
      };
    }
  }
}; 