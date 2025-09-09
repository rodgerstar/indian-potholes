import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/pages/reset-password.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('form'); // form, loading, success, error
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setStatus('error');
      setMessage('No reset token found. Please use the link from your email.');
      return;
    }
    setToken(tokenFromUrl);
  }, [searchParams]);

  const validatePassword = (password) => {
    const errors = {};
    
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/\d/.test(password)) {
      errors.password = 'Password must contain at least one number';
    } else if (!/[@$!%*?&]/.test(password)) {
      errors.password = 'Password must contain at least one special character (@$!%*?&)';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate passwords
    const passwordErrors = validatePassword(password);
    if (Object.keys(passwordErrors).length > 0) {
      setErrors(passwordErrors);
      return;
    }
    
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    
    try {
      setStatus('loading');
      const response = await api.post('/auth/reset-password', {
        token,
        password
      });
      
      if (response.data.success) {
        setStatus('success');
        setMessage('Password reset successfully! You can now log in with your new password.');
      } else {
        setStatus('error');
        setMessage(response.data.message || 'Password reset failed. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Password reset failed. Please try again.');
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToForgotPassword = () => {
    navigate('/forgot-password');
  };

  if (status === 'loading') {
    return (
      <div className="reset-password-container">
        <div className="reset-password-content">
          <LoadingSpinner />
          <p>Resetting your password...</p>
        </div>
      </div>
    );
  }

  if (status === 'error' && !token) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-content">
          <div className="reset-password-header">
            <h1>Password Reset</h1>
            <div className="error-icon">✗</div>
          </div>
          
          <div className="reset-password-message">
            <p>{message}</p>
          </div>
          
          <div className="reset-password-actions">
            <button 
              className="btn btn-primary"
              onClick={handleGoToForgotPassword}
            >
              Request New Reset Link
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleGoToLogin}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="reset-password-container">
        <div className="reset-password-content">
          <div className="reset-password-header">
            <h1>Password Reset</h1>
            <div className="success-icon">✓</div>
          </div>
          
          <div className="reset-password-message">
            <p>{message}</p>
          </div>
          
          <div className="reset-password-actions">
            <button 
              className="btn btn-primary"
              onClick={handleGoToLogin}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-content">
        <div className="reset-password-header">
          <h1>Reset Your Password</h1>
          <p>Enter your new password below</p>
        </div>

        {status === 'error' && (
          <div className="reset-password-error">
            <p>{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your new password"
              required
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Confirm your new password"
              required
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <div className="password-requirements">
            <p><strong>Password Requirements:</strong></p>
            <ul>
              <li className={password.length >= 8 ? 'valid' : ''}>At least 8 characters</li>
              <li className={/[a-z]/.test(password) ? 'valid' : ''}>One lowercase letter</li>
              <li className={/[A-Z]/.test(password) ? 'valid' : ''}>One uppercase letter</li>
              <li className={/\d/.test(password) ? 'valid' : ''}>One number</li>
              <li className={/[@$!%*?&]/.test(password) ? 'valid' : ''}>One special character (@$!%*?&)</li>
            </ul>
          </div>

          <div className="reset-password-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={status === 'loading'}
            >
              Reset Password
            </button>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleGoToLogin}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 