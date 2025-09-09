import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authAPI, handleApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RiEyeLine, RiEyeOffLine, RiMailLine, RiLockLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import { trackLogin } from '../utils/analytics';
import { FaGoogle } from 'react-icons/fa';
import { getApiBaseUrl } from '../config/environment.js';
import secureStorage from '../utils/secureStorage';

const schema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required')
}).required();

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('');

  useEffect(() => {
    try {
      if (sessionStorage.getItem('sessionExpired')) {
        setSessionExpiredMsg('Session expired due to inactivity. Please login again.');
        sessionStorage.removeItem('sessionExpired');
      }
    } catch (error) {
      console.warn('Failed to check sessionStorage for expired session:', error);
    }
    // Handle Google OAuth token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // Optionally, fetch user info from backend using token
      // For now, just store token and reload user
      loginWithToken(token, null); // user will be fetched by AuthContext
      navigate('/');
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authAPI.login(data);
      
      // Fix: Backend returns { success: true, data: { token, user } }
      if (response.success) {
        // Track successful login
        trackLogin();
        loginWithToken(response.data.token, response.data.user);
        toast.success('Login successful!');
        
        // Check for redirect path
        const redirectPathResult = secureStorage.getItem('redirectAfterLogin');
        // Handle both sync and async retrieval
        const redirectPath = redirectPathResult instanceof Promise ? await redirectPathResult : redirectPathResult;
        
        if (redirectPath) {
          secureStorage.removeItem('redirectAfterLogin');
          navigate(redirectPath);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      // Check if the error is due to unverified email
      if (error.response?.data?.requiresVerification) {
        toast.error('Please verify your email address before logging in. Check your inbox for the verification link.', {
          duration: 6000,
          action: {
            label: 'Resend Email',
            onClick: () => navigate('/verify-email')
          }
        });
      } else {
        try {
          handleApiError(error);
        } catch (apiError) {
          toast.error(apiError.message);
        }
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
            Welcome Back
          </h2>
          <p className="auth-subtitle">
            Sign in to your account to continue reporting potholes
          </p>
        </div>

        {sessionExpiredMsg && (
          <div className="persistent-error">{sessionExpiredMsg}</div>
        )}

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
                {errors.password && (
                  <div className="form-error">{errors.password.message}</div>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  Forgot your password?
                </Link>
              </div>
              
              {/* Verification Email Link */}
              <div className="text-right">
                <Link 
                  to="/verify-email" 
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  Need verification email?
                </Link>
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
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
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

            {/* Google Sign-In Button */}
            <button
              type="button"
              className="btn btn-google w-full btn-lg flex items-center justify-center mb-4"
              onClick={() => window.location.href = `${getApiBaseUrl()}/auth/google`}
            >
              <FaGoogle className="mr-2" /> Sign in with Google
            </button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-orange-500 hover:text-orange-600 font-medium">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="terms-text">
          <p>
            By signing in, you agree to our{' '}
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

export default Login;
