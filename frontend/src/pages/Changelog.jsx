import React from 'react';
import './Changelog.css';
import { RiGitRepositoryLine, RiCodeSSlashLine } from 'react-icons/ri';

const backendLogs = [
  {
    hash: '0bf073d',
    message: 'Enhance MongoDB connection handling and streamline health check response',
  },
  {
    hash: 'e825c66',
    message: 'Refactor logging and error handling across multiple modules',
  },
  {
    hash: 'e9efd32',
    message: 'Add axios dependency and enhance reCAPTCHA verification logging',
  },
  {
    hash: '511514f',
    message: 'Enhance server startup and logging with detailed environment validation',
  },
  {
    hash: 'd10baf9',
    message: 'Add deployment scripts for worker processes in package.json',
  },
  {
    hash: '136c5a6',
    message: 'Refactor media handling to integrate R2 storage and remove ImageKit dependencies',
  },
  {
    hash: 'bd40c9b',
    message: 'Refactor pothole submission process to allow guest submissions',
  },
  {
    hash: '11d2e4c',
    message: 'Merge pull request #4 from roshanasingh4/copilot/fix-3',
  },
  {
    hash: '9767b47',
    message: 'Increase rate limits to be more generous for new launch',
  },
  {
    hash: 'fe9af1f',
    message: 'Initial plan',
  },
  {
    hash: '318d19e',
    message: 'Add provider filter to user retrieval in admin route',
  },
  {
    hash: '576a674',
    message: 'Enhance server functionality with MongoDB connection check middleware and improve user registration logging',
  },
  {
    hash: '1476e3d',
    message: 'Remove SECURITY_FIXES.md file, consolidating security documentation into the codebase',
  },
  {
    hash: '1c5c7cf',
    message: 'Add Google OAuth authentication with Passport.js',
  },
  {
    hash: 'eb854e1',
    message: 'Allow updating hasSeenTour field in profile updates',
  },
  {
    hash: 'c96c2dd',
    message: 'Add hasSeenTour field to User model and update related routes',
  },
  {
    hash: '941d8ff',
    message: 'Update environment variable requirements and password validation',
  },
  {
    hash: 'fbedc15',
    message: 'Update image URL validation in bug report and feedback routes',
  },
  {
    hash: 'cfe832c',
    message: 'Enhance ImageKit configuration and error handling in health check',
  },
  {
    hash: 'fa39c55',
    message: 'Add severity and description fields to Pothole model and update validation in routes',
  },
  {
    hash: 'c4dec7d',
    message: 'Add notification routes and implement pothole status update with notification creation',
  },
  {
    hash: 'f6a0a4b',
    message: 'Fix critical error handling and logging issues',
  },
  {
    hash: '11715fc',
    message: 'Improve pothole deletion process with robust error handling for media deletion from ImageKit',
  },
  {
    hash: '20c2bab',
    message: 'Refactor file upload handling to support multiple file uploads and enhance validation middleware',
  },
  {
    hash: '3434571',
    message: 'Enhance security with secure logging, file signature validation, token blacklist functionality, and improved rate limiting',
  },
  {
    hash: '4f0466b',
    message: 'Update pothole routes to only populate user name in responses, removing email for improved data privacy',
  },
  {
    hash: 'f1e66d1',
    message: 'Add parliamentary constituencies endpoint to retrieve constituencies by state',
  },
  {
    hash: 'daae7f8',
    message: 'Add MP lookup endpoint to retrieve Member of Parliament by state and constituency name',
  },
  {
    hash: '4c8a6cc',
    message: 'Refactor user authentication logic to improve security with enhanced password requirements',
  },
  {
    hash: '9b35e78',
    message: 'Refine email validation regex and enhance password validation logic for stronger security',
  },
  {
    hash: '0da0ab7',
    message: 'Implement optional user authentication for pothole reports with JWT verification and upvote tracking',
  },
  {
    hash: 'adb0cdf',
    message: 'Enhance server configuration with environment variable validation and comprehensive health check endpoint',
  },
  {
    hash: '3dea517',
    message: 'Add bug report and feedback routes to server; enhance API functionality',
  },
  {
    hash: 'f080ae7',
    message: 'Add state and constituency fields to Pothole model; update routes to handle constituency data',
  },
  {
    hash: '1e22cb0',
    message: 'Add isAnonymous field to Pothole model and update routes to handle anonymous reports',
  },
  {
    hash: '225c125',
    message: 'Update CORS configuration to include the production URL for Indian Potholes website',
  },
];

const frontendLogs = [
  {
    hash: '95396c6',
    message: 'Update Gallery component to improve stats loading state and adjust items per page',
  },
  {
    hash: '0b1b3ae',
    message: 'Add success toast notifications for upvote actions in Gallery component',
  },
  {
    hash: '8e42047',
    message: 'Refactor blog feature for improved performance and user experience',
  },
  {
    hash: '7850202',
    message: 'Add blog feature with routing and styles',
  },
  {
    hash: '7f9788a',
    message: 'Update dependencies and enhance UploadPothole functionality',
  },
  {
    hash: '3471c5c',
    message: 'Update Open Graph and Twitter meta tags with absolute URLs for improved social sharing',
  },
  {
    hash: '0dc024a',
    message: 'Enhance mobile responsiveness for stats section',
  },
  {
    hash: 'eaaf334',
    message: 'Merge pull request #13 from roshanasingh4/copilot/fix-70c3825b-8661-48f4-93cb-061382524b8a',
  },
  {
    hash: 'af75ca9',
    message: 'Fix stats clickability and modal issues',
  },
  {
    hash: '31e326f',
    message: 'Revert fallback data and links, fix only text overflow on mobile',
  },
  {
    hash: 'd89d98a',
    message: 'Fix pothole statistics display and add clickable links',
  },
  {
    hash: 'a8a742f',
    message: 'Initial plan',
  },
  {
    hash: 'bb93ea1',
    message: 'Enhance AdminDashboard filters and styling',
  },
  {
    hash: 'f90d1c7',
    message: 'Add OpenStreetMap disclaimer to map components',
  },
  {
    hash: '2196822',
    message: 'Add Open Graph and Twitter meta tags for improved social sharing',
  },
  {
    hash: '2447dbc',
    message: 'Add footer section for funding acknowledgment',
  },
  {
    hash: '6501cc9',
    message: 'Merge pull request #11 from roshanasingh4/copilot/fix-55ddf6cb-c87a-415f-baf2-2b1366d55abf',
  },
  {
    hash: '3342a4e',
    message: 'Fix mobile guided tour functionality with device-specific tour steps',
  },
  {
    hash: '466fd84',
    message: 'Fix guided tour behavior and enhance UI/UX across login, FAQ, and social sharing features',
  },
  {
    hash: '92a416c',
    message: 'Fix guided tour behavior and improve Google sign-in button styling',
  },
  {
    hash: 'b54cd45',
    message: 'Add notification feature: integrate NotificationProvider, implement notification API, and enhance Navbar with NotificationBell component',
  },
  {
    hash: '45a2d74',
    message: 'Add low priority improvements: React.memo optimization, ARIA labels, and keyboard navigation',
  },
  {
    hash: 'fab576b',
    message: 'Fix high priority issues: session timeout race condition, token validation, and form validation',
  },
  {
    hash: '0822aa6',
    message: 'Fix critical frontend bugs: useEffect dependencies, console errors, and silent failures',
  },
  {
    hash: 'ff82499',
    message: 'Break pages.css into smaller, focused CSS files for better maintainability',
  },
  {
    hash: '671783d',
    message: 'Add Google Analytics tracking to index.html',
  },
  {
    hash: 'c6c7912',
    message: 'Update CSS styles for stats visibility in stats card',
  },
  {
    hash: '8307641',
    message: 'Refactor error handling and logging in various components for improved user experience',
  },
  {
    hash: 'f59b91f',
    message: 'Enhance media handling in DetailsModal, Gallery, and MyReports components',
  },
  {
    hash: '5ad09c3',
    message: 'Enhance UploadPothole component with multiple file upload and GPS extraction functionality',
  },
  {
    hash: '5935e87',
    message: 'Enhance Gallery component with map view functionality',
  },
  {
    hash: 'b14593e',
    message: 'Implement input validation and secure token management in AuthContext',
  },
  {
    hash: 'f831e44',
    message: 'Enhance DetailsModal component with new features and improved user interaction',
  },
  {
    hash: '2e7f5e4',
    message: 'Refactor Gallery and MyReports components for improved user experience and styling',
  },
  {
    hash: 'b6e21fe',
    message: 'Enhance UploadPothole component with parliamentary constituency selection',
  },
  {
    hash: '224f97c',
    message: 'Implement session timeout handling and confirmation modal for report deletion',
  },
];

const TimelineItem = ({ log, side }) => (
  <div className={`timeline-item ${side}`}>
    <div className="timeline-dot"><RiCodeSSlashLine /></div>
    <div className="timeline-content">
      <div className="timeline-hash">{log.hash}</div>
      <div className="timeline-message">{log.message}</div>
    </div>
  </div>
);

const Timeline = ({ logs, label }) => (
  <div className="timeline-section">
    <h2>{label}</h2>
    <div className="timeline">
      {logs.map((log, idx) => (
        <TimelineItem log={log} key={idx} side={idx % 2 === 0 ? 'left' : 'right'} />
      ))}
    </div>
  </div>
);

const Changelog = () => {
  return (
    <div className="changelog-container">
      <h1><RiGitRepositoryLine /> Project Changelog</h1>
      <Timeline logs={frontendLogs} label="Frontend" />
      <Timeline logs={backendLogs} label="Backend" />
    </div>
  );
};

export default Changelog; 