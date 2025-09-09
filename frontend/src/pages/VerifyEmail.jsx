import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import '../styles/pages/verify-email.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('pending'); // pending, verifying, success, error, email-form
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    // Check if there's a stored email from a previous verification request
    let storedEmail = '';
    try {
      const val = sessionStorage.getItem('pendingVerificationEmail');
      if (val) {
        storedEmail = val;
        setPendingEmail(val);
      }
    } catch (error) {
      console.warn('Failed to get pending verification email from sessionStorage:', error);
    }

    // Check if there's a token in URL (user clicked email link)
    const token = searchParams.get('token');
    if (token) {
      setStatus('verifying');
      setIsLoading(true);
      verifyEmail(token);
    } else if (storedEmail) {
      // No token but we have a stored email - show pending status
      setStatus('pending');
      setMessage(`Please check your email (${storedEmail}) and click the verification link to activate your account.`);
    } else {
      // No token and no stored email - show email input form
      setStatus('email-form');
      setMessage('Enter your email address to receive a verification link.');
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await api.post('/auth/verify-email', { token });
      
      if (response.data.success) {
        setStatus('success');
        setMessage('Email verified successfully! You can now log in to your account.');
        // Clear any stored pending verification email after successful verification
        try {
          sessionStorage.removeItem('pendingVerificationEmail');
        } catch (error) {
          console.warn('Failed to clear pending verification email from sessionStorage:', error);
        }
        setPendingEmail('');
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Email address is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const error = validateEmail(emailInput);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError('');

    try {
      setIsLoading(true);
      const response = await api.post('/auth/send-verification', { email: emailInput });
      
      if (response.data.success) {
        setStatus('pending');
        setPendingEmail(emailInput);
        // Store email in sessionStorage for this session
        try {
          sessionStorage.setItem('pendingVerificationEmail', emailInput);
        } catch (error) {
          console.warn('Failed to store pending verification email in sessionStorage:', error);
        }
        setMessage(`Verification email sent to ${emailInput}! Please check your inbox.`);
        toast.success('Verification email sent! Please check your inbox.');
      } else {
        setMessage(response.data.message || 'Failed to send verification email.');
        toast.error(response.data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send verification email.');
      toast.error(error.response?.data?.message || 'Failed to send verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/resend-verification');
      
      if (response.data.success) {
        setMessage('Verification email sent successfully! Please check your inbox.');
        toast.success('Verification email sent! Please check your inbox.');
        // Update the stored email if we have one
        if (pendingEmail) {
          try {
            sessionStorage.setItem('pendingVerificationEmail', pendingEmail);
          } catch (error) {
            console.warn('Failed to store pending verification email in sessionStorage:', error);
          }
        }
      } else {
        setMessage(response.data.message || 'Failed to send verification email.');
        toast.error(response.data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send verification email.');
      toast.error(error.response?.data?.message || 'Failed to send verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="verify-email-container">
        <div className="verify-email-content">
          <LoadingSpinner />
          <p>Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-email-container">
      <div className="verify-email-content">
        <div className="verify-email-header">
          <h1>Email Verification</h1>
          {status === 'success' && (
            <div className="success-icon">✓</div>
          )}
          {status === 'error' && (
            <div className="error-icon">✗</div>
          )}
          {status === 'pending' && (
            <div className="pending-icon">⏳</div>
          )}
        </div>

        <div className="verify-email-message">
          <p>{message}</p>
        </div>

        <div className="verify-email-actions">
          {status === 'email-form' && (
            <>
              <form onSubmit={handleEmailSubmit} className="email-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className={`form-input ${emailError ? 'error' : ''}`}
                    placeholder="Enter your email address"
                    disabled={isLoading}
                  />
                  {emailError && (
                    <div className="form-error">{emailError}</div>
                  )}
                </div>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Verification Email'}
                </button>
              </form>
              <button 
                className="btn btn-secondary"
                onClick={handleGoToLogin}
              >
                Go to Login
              </button>
            </>
          )}

          {status === 'pending' && (
            <>
              <button 
                className="btn btn-primary"
                onClick={handleResendVerification}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleGoToLogin}
              >
                Go to Login
              </button>
            </>
          )}

          {status === 'success' && (
            <>
              <button 
                className="btn btn-primary"
                onClick={handleGoToLogin}
              >
                Go to Login
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleGoToHome}
              >
                Go to Home
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <button 
                className="btn btn-primary"
                onClick={handleResendVerification}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleGoToLogin}
              >
                Go to Login
              </button>
            </>
          )}
        </div>

        {(status === 'error' || status === 'pending') && (
          <div className="verify-email-help">
            <p>
              <strong>Need help?</strong> If you're having trouble verifying your email:
            </p>
            <ul>
              <li>Check your spam/junk folder</li>
              <li>Make sure you're using the correct email address</li>
              <li>Try clicking the resend button above</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail; 
