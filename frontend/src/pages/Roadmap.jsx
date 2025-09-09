import React from "react";
import { RiRoadMapLine, RiDashboardLine, RiMapPin2Line, RiShieldKeyholeLine, RiLockPasswordLine, RiAccountPinBoxLine, RiBarChart2Line, RiLightbulbLine, RiNotification4Line, RiFileUploadLine, RiGalleryLine, RiUserSettingsLine, RiCheckLine, RiArticleLine, RiShareForwardLine } from "react-icons/ri";
import "./Roadmap.css";

const recentlyCompleted = [
  {
    title: "Blog Feature",
    description: "Added a comprehensive blog system with routing and styles for improved content management and user engagement.",
    icon: <RiArticleLine className="roadmap-feature-icon" />
  },
  {
    title: "Enhanced Social Sharing",
    description: "Improved Open Graph and Twitter meta tags with absolute URLs for better social media sharing experience.",
    icon: <RiShareForwardLine className="roadmap-feature-icon" />
  },
  {
    title: "Mobile Responsiveness",
    description: "Enhanced mobile responsiveness for stats section and improved overall mobile user experience.",
    icon: <RiMapPin2Line className="roadmap-feature-icon" />
  },
  {
    title: "R2 Storage Integration",
    description: "Refactored media handling to integrate R2 storage and removed ImageKit dependencies for better performance.",
    icon: <RiFileUploadLine className="roadmap-feature-icon" />
  },
  {
    title: "Guest Submissions",
    description: "Refactored pothole submission process to allow guest submissions without requiring user registration.",
    icon: <RiAccountPinBoxLine className="roadmap-feature-icon" />
  },
  {
    title: "Google OAuth Authentication",
    description: "Added Google OAuth authentication with Passport.js for seamless user login experience.",
    icon: <RiShieldKeyholeLine className="roadmap-feature-icon" />
  },
  {
    title: "Guided Tour System",
    description: "Implemented comprehensive guided tour functionality with device-specific tour steps for new users.",
    icon: <RiLightbulbLine className="roadmap-feature-icon" />
  },
];

const features = [
  {
    title: "Admin Dashboard",
    description: "A dedicated dashboard for administrators to manage users, reports, and system settings with advanced analytics and reporting tools.",
    icon: <RiDashboardLine className="roadmap-feature-icon" />
  },
  {
    title: "Google Maps Integration",
    description: "Replace Leaflet with Google Maps for improved navigation, better satellite imagery, and enhanced mapping features.",
    icon: <RiMapPin2Line className="roadmap-feature-icon" />
  },
  {
    title: "Two-Factor Authentication (2FA)",
    description: "Enhance account security by adding 2FA during login with SMS or authenticator app support.",
    icon: <RiShieldKeyholeLine className="roadmap-feature-icon" />
  },
  {
    title: "Password Reset Feature",
    description: "Allow users to securely reset their passwords via email verification if forgotten.",
    icon: <RiLockPasswordLine className="roadmap-feature-icon" />
  },
  {
    title: "Advanced Notification System",
    description: "Expand notification system with email notifications, push notifications, and customizable notification preferences.",
    icon: <RiNotification4Line className="roadmap-feature-icon" />
  },
  {
    title: "Bulk Upload Feature",
    description: "Allow users to upload multiple pothole reports at once with batch processing and validation.",
    icon: <RiFileUploadLine className="roadmap-feature-icon" />
  },
  {
    title: "Photo Gallery Enhancements",
    description: "Add advanced filtering, sorting, and search capabilities to the photo gallery with improved image optimization.",
    icon: <RiGalleryLine className="roadmap-feature-icon" />
  },
  {
    title: "User Profile Management",
    description: "Enhanced user profiles with customizable settings, activity history, and preference management.",
    icon: <RiUserSettingsLine className="roadmap-feature-icon" />
  },
  {
    title: "Constituency & MP/MLA Wise Ranking",
    description: "Show rankings and statistics based on constituency and elected representatives with detailed analytics.",
    icon: <RiBarChart2Line className="roadmap-feature-icon" />
  },
  {
    title: "Real-time Status Updates",
    description: "Implement real-time status updates for pothole reports with live progress tracking and notifications.",
    icon: <RiNotification4Line className="roadmap-feature-icon" />
  },
  {
    title: "Mobile App Development",
    description: "Develop native mobile applications for iOS and Android to improve accessibility and user experience.",
    icon: <RiMapPin2Line className="roadmap-feature-icon" />
  },
];

const underConsideration = [
  {
    title: "AI-Powered Pothole Detection",
    description: "Implement machine learning algorithms to automatically detect and classify potholes from uploaded images.",
    icon: <RiLightbulbLine className="roadmap-feature-icon" />
  },
  {
    title: "Integration with Government APIs",
    description: "Integrate with government databases and APIs for official pothole tracking and resolution status.",
    icon: <RiBarChart2Line className="roadmap-feature-icon" />
  },
  {
    title: "Community Features",
    description: "Add community features like user forums, discussion boards, and collaborative reporting initiatives.",
    icon: <RiLightbulbLine className="roadmap-feature-icon" />
  },
  {
    title: "Advanced Analytics Dashboard",
    description: "Create comprehensive analytics dashboards for users, officials, and administrators with detailed insights and trends.",
    icon: <RiDashboardLine className="roadmap-feature-icon" />
  }
];

const Roadmap = () => {
  return (
    <div className="roadmap-outer">
      <section className="roadmap-hero">
        <RiRoadMapLine className="roadmap-hero-icon" />
        <h1>Product Roadmap</h1>
        <p className="roadmap-hero-subtitle">See what's coming next for Indian Potholes</p>
        <p className="roadmap-hero-intro">
          We're committed to building a powerful platform for reporting, tracking, and resolving potholes and infrastructure issues across India. Here are the features you can expect soon:
        </p>
      </section>

      <section className="roadmap-timeline-section">
        <h2 className="roadmap-section-title">Recently Completed</h2>
        <ul className="roadmap-timeline">
          {recentlyCompleted.map((feature, idx) => (
            <li key={idx} className="roadmap-timeline-item completed">
              <div className="roadmap-timeline-icon completed">{feature.icon}</div>
              <div className="roadmap-timeline-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="roadmap-completed-badge">
                  <RiCheckLine /> Completed
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="roadmap-timeline-section">
        <h2 className="roadmap-section-title">Upcoming Features</h2>
        <ul className="roadmap-timeline">
          {features.map((feature, idx) => (
            <li key={idx} className="roadmap-timeline-item">
              <div className="roadmap-timeline-icon">{feature.icon}</div>
              <div className="roadmap-timeline-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="roadmap-consideration-section">
        <h2 className="roadmap-section-title">Under Consideration</h2>
        <ul className="roadmap-timeline">
          {underConsideration.map((feature, idx) => (
            <li key={idx} className="roadmap-timeline-item">
              <div className="roadmap-timeline-icon">{feature.icon}</div>
              <div className="roadmap-timeline-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Roadmap; 