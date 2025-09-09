import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/pages/forgot-password.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('form'); // form, loading, success, error
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }
    
    try {
      setStatus('loading');
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message);
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleTryAgain = () => {
    setStatus('form');
    setMessage('');
    setErrors({});
  };

  if (status === 'loading') {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-content">
          <LoadingSpinner />
          <p>Sending reset email...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-content">
          <div className="forgot-password-header">
            <h1>Check Your Email</h1>
            <div className="success-icon">✓</div>
          </div>
          
          <div className="forgot-password-message">
            <p>{message}</p>
          </div>
          
          <div className="forgot-password-help">
            <p><strong>Didn't receive the email?</strong></p>
            <ul>
              <li>Check your spam/junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes for the email to arrive</li>
            </ul>
          </div>
          
          <div className="forgot-password-actions">
            <button 
              className="btn btn-primary"
              onClick={handleTryAgain}
            >
              Try Again
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleGoToLogin}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-content">
        <div className="forgot-password-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        {status === 'error' && (
          <div className="forgot-password-error">
            <p>{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email address"
              required
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="forgot-password-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={status === 'loading'}
            >
              Send Reset Link
            </button>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleGoToLogin}
            >
              Back to Login
            </button>
          </div>
        </form>

        <div className="forgot-password-info">
          <p>
            <strong>Remember your password?</strong>{' '}
            <button 
              className="link-button"
              onClick={handleGoToLogin}
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 