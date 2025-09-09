import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RiMailLine, RiCheckboxCircleLine, RiArrowLeftLine } from 'react-icons/ri';
import '../styles/pages/register-success.css';

const RegisterSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'your email';

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  const handleResendEmail = () => {
    navigate('/verify-email');
  };

  return (
    <div className="register-success-container">
      <div className="register-success-content">
        <div className="success-header">
          <div className="success-icon">
            <RiCheckboxCircleLine />
          </div>
          <h1>Account Created Successfully!</h1>
          <p className="success-subtitle">
            Welcome to the Pothole Reporting System
          </p>
        </div>

        <div className="verification-info">
          <div className="info-card">
            <div className="info-icon">
              <RiMailLine />
            </div>
            <div className="info-content">
              <h3>Check Your Email</h3>
              <p>
                We've sent a verification email to <strong>{email}</strong>. 
                Please check your inbox and click the verification link to activate your account.
              </p>
            </div>
          </div>
        </div>

        <div className="next-steps">
          <h3>What happens next?</h3>
          <div className="steps-list">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Check your email</h4>
                <p>Look for an email from Pothole Reporting System</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Click the verification link</h4>
                <p>Click the "Verify Email Address" button in the email</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Start reporting potholes</h4>
                <p>Once verified, you can log in and start contributing to better roads</p>
              </div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={handleGoToLogin}
          >
            Go to Login
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleResendEmail}
          >
            Resend Verification Email
          </button>
          <button 
            className="btn btn-outline"
            onClick={handleGoToHome}
          >
            <RiArrowLeftLine className="icon" />
            Back to Home
          </button>
        </div>

        <div className="help-section">
          <h4>Need help?</h4>
          <ul>
            <li>Check your spam/junk folder if you don't see the email</li>
            <li>Make sure you entered the correct email address</li>
            <li>Click "Resend Verification Email" if needed</li>
            <li>The verification link expires in 24 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccess; 