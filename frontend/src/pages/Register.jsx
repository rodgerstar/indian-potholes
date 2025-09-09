import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authAPI, handleApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RiEyeLine, RiEyeOffLine, RiMailLine, RiLockLine, RiUserLine, RiCheckboxCircleLine, RiShieldCheckLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import { trackRegistration } from '../utils/analytics';
import { FaGoogle } from 'react-icons/fa';
import { getApiBaseUrl } from '../config/environment.js';

const schema = yup.object({
  name: yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .required('Name is required'),
  email: yup.string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .matches(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .matches(/^(?=.*\d)/, 'Password must contain at least one number')
    .matches(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character (@$!%*?&)')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password')
}).required();

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  // Watch password for strength indicator
  const watchedPassword = watch('password', '');

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    if (score <= 2) return { score, label: 'Weak', color: 'text-red-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'text-yellow-500' };
    if (score <= 4) return { score, label: 'Good', color: 'text-blue-500' };
    return { score, label: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(watchedPassword);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        name: data.name,
        email: data.email,
        password: data.password
      });
      
      if (response.success) {
        // Track successful registration
        trackRegistration();
        
        // Show success message and redirect to success page
        toast.success('Account created successfully!');
        
        // Redirect to success page with email
        navigate('/register-success', { state: { email: data.email } });
      }
    } catch (error) {
      try {
        handleApiError(error);
      } catch (apiError) {
        toast.error(apiError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-header">
          <h2 className="auth-title">
            Create Account
          </h2>
          <p className="auth-subtitle">
            Join thousands of Indians working together for better roads
          </p>
          <div className="verification-notice">
            <p>📧 Email verification required to activate your account</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <div className="form-group">
                <label className="form-label">
                  <RiUserLine className="icon" />
                  Full Name
                </label>
                <div className="form-input-icon">
                  <input
                    type="text"
                    {...register('name')}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                  <RiUserLine className="icon icon-right" />
                </div>
                {errors.name && (
                  <div className="form-error">{errors.name.message}</div>
                )}
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label className="form-label">
                  <RiMailLine className="icon" />
                  Email Address
                </label>
                <div className="form-input-icon">
                  <input
                    type="email"
                    {...register('email')}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                  <RiMailLine className="icon icon-right" />
                </div>
                {errors.email && (
                  <div className="form-error">{errors.email.message}</div>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label className="form-label">
                  <RiLockLine className="icon" />
                  Password
                </label>
                <div className="form-input-icon">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="icon icon-right password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {watchedPassword && (
                  <div className="password-requirements">
                    <div className="requirements-header">
                      <RiShieldCheckLine className="icon" />
                      <span className="text-sm font-medium">Password Requirements:</span>
                      {passwordStrength.score > 0 && (
                        <span className={`text-sm font-medium ${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                    <div className="requirements-list">
                      <div className={`requirement ${watchedPassword.length >= 8 ? 'met' : 'unmet'}`}>
                        ✓ At least 8 characters
                      </div>
                      <div className={`requirement ${/[a-z]/.test(watchedPassword) ? 'met' : 'unmet'}`}>
                        ✓ One lowercase letter
                      </div>
                      <div className={`requirement ${/[A-Z]/.test(watchedPassword) ? 'met' : 'unmet'}`}>
                        ✓ One uppercase letter
                      </div>
                      <div className={`requirement ${/\d/.test(watchedPassword) ? 'met' : 'unmet'}`}>
                        ✓ One number
                      </div>
                      <div className={`requirement ${/[@$!%*?&]/.test(watchedPassword) ? 'met' : 'unmet'}`}>
                        ✓ One special character (@$!%*?&)
                      </div>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <div className="form-error">{errors.password.message}</div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label className="form-label">
                  <RiLockLine className="icon" />
                  Confirm Password
                </label>
                <div className="form-input-icon">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="icon icon-right password-toggle"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="form-error">{errors.confirmPassword.message}</div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full btn-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            {/* Google Sign Up Button */}
            <button
              type="button"
              className="btn btn-google w-full btn-lg flex items-center justify-center mb-4"
              onClick={() => window.location.href = `${getApiBaseUrl()}/auth/google`}
            >
              <FaGoogle className="mr-2" /> Sign up with Google
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="benefits-section">
          <h3 className="benefits-title">
            <RiCheckboxCircleLine className="icon" />
            Why Join Indian Potholes?
          </h3>
          <div className="benefits-list">
            <div className="benefit-item">
              <div className="benefit-dot"></div>
              <span>Report potholes in your area with photos and GPS coordinates</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-dot"></div>
              <span>Track repair progress and hold authorities accountable</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-dot"></div>
              <span>Join a community working for better infrastructure</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="terms-text">
          <p>
            By creating an account, you agree to our{' '}
            <a href="#" className="text-orange-500 hover:text-orange-600">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-orange-500 hover:text-orange-600">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
