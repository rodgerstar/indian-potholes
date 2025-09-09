import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResponsiveContainer from '../components/ResponsiveContainer';
import AccessibleButton from '../components/AccessibleButton';
import { 
  RiCheckboxCircleLine,
  RiTimeLine,
  RiEyeLine,
  RiUserLine,
  RiShieldCheckLine,
  RiArrowRightLine,
  RiFileListLine
} from 'react-icons/ri';

const ReportSubmitted = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get report ID from state (passed during navigation)
  const reportId = location.state?.reportId;

  // Redirect if accessed directly without state
  useEffect(() => {
    if (!reportId) {
      navigate('/upload');
    }
  }, [reportId, navigate]);

  const handleViewMyReports = () => {
    navigate('/my-reports');
  };

  const handleViewGallery = () => {
    navigate('/gallery');
  };

  const handleSubmitAnother = () => {
    navigate('/upload');
  };

  if (!reportId) {
    return null; // Will redirect via useEffect
  }

  return (
    <ResponsiveContainer>
      <div className="report-submitted-page">
        <div className="success-container">
          {/* Success Icon */}
          <div className="success-icon">
            <RiCheckboxCircleLine />
          </div>

          {/* Main Heading */}
          <h1 className="success-title">
            Report Submitted Successfully!
          </h1>

          {/* Report ID */}
          <div className="report-id-section">
            <span className="report-id-label">Report ID:</span>
            <span className="report-id-value">#{reportId}</span>
          </div>

          {/* Status Section */}
          <div className="status-section">
            <div className="status-card">
              <div className="status-icon">
                <RiTimeLine />
              </div>
              <div className="status-content">
                <h3>Under Review</h3>
                <p>Your report is now being reviewed by our moderation team</p>
              </div>
            </div>
          </div>

          {/* Process Steps */}
          <div className="process-steps">
            <h3>What happens next?</h3>
            <div className="steps-list">
              <div className="step-item active">
                <div className="step-icon">
                  <RiCheckboxCircleLine />
                </div>
                <div className="step-content">
                  <h4>Report Submitted</h4>
                  <p>Your pothole report has been received</p>
                </div>
              </div>
              
              <div className="step-item pending">
                <div className="step-icon">
                  <RiShieldCheckLine />
                </div>
                <div className="step-content">
                  <h4>Under Review</h4>
                  <p>Our team is verifying your report</p>
                </div>
              </div>
              
              <div className="step-item pending">
                <div className="step-icon">
                  <RiEyeLine />
                </div>
                <div className="step-content">
                  <h4>Published</h4>
                  <p>Your report will appear in the public gallery</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {user ? (
              <>
                <AccessibleButton
                  onClick={handleViewMyReports}
                  className="btn-primary"
                >
                  <RiFileListLine />
                  View My Reports
                  <RiArrowRightLine />
                </AccessibleButton>
                <AccessibleButton
                  onClick={handleViewGallery}
                  className="btn-secondary"
                >
                  <RiEyeLine />
                  Browse Gallery
                </AccessibleButton>
              </>
            ) : (
              <>
                <AccessibleButton
                  onClick={handleViewGallery}
                  className="btn-primary"
                >
                  <RiEyeLine />
                  Browse Gallery
                  <RiArrowRightLine />
                </AccessibleButton>
                <div className="guest-info">
                  <RiUserLine />
                  <span>
                    <strong>Want to track your reports?</strong>{' '}
                    <button 
                      onClick={() => navigate('/register')}
                      className="link-button"
                    >
                      Create an account
                    </button>{' '}
                    to view and manage your submissions.
                  </span>
                </div>
              </>
            )}
            
            <AccessibleButton
              onClick={handleSubmitAnother}
              className="btn-outline"
            >
              Submit Another Report
            </AccessibleButton>
          </div>

          {/* Thank You Message */}
          <div className="thank-you-section">
            <h3>Thank you for contributing to community safety!</h3>
            <p>
              Your report helps local authorities identify and fix infrastructure 
              issues. Together, we're making our roads safer for everyone.
            </p>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
};

export default ReportSubmitted;