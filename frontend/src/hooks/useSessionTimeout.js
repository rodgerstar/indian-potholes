import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useSessionTimeout = (timeoutMinutes = 30) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const activityRef = useRef(Date.now());
  const isLoggingOutRef = useRef(false);

  // Reset timeout on user activity
  const resetTimeout = () => {
    activityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Set warning timeout (5 minutes before session expires)
    const warningTime = (timeoutMinutes - 5) * 60 * 1000;
    warningRef.current = setTimeout(() => {
      toast.error('Your session will expire in 5 minutes. Please save your work.', {
        duration: 10000,
        position: 'top-center',
      });
    }, warningTime);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      if (!isLoggingOutRef.current) {
        isLoggingOutRef.current = true;
        logout();
        try {
          sessionStorage.setItem('sessionExpired', '1');
        } catch (error) {
          console.warn('Failed to set session expired flag in sessionStorage:', error);
        }
        navigate('/login');
        toast.error('Session expired due to inactivity. Please login again.');
      }
    }, timeoutMinutes * 60 * 1000);
  };

  // Handle user activity
  const handleActivity = () => {
    resetTimeout();
  };

  useEffect(() => {
    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [timeoutMinutes]); // Remove logout from dependencies to prevent race conditions

  return {
    resetTimeout,
    getTimeRemaining: () => {
      const timeElapsed = Date.now() - activityRef.current;
      const timeRemaining = (timeoutMinutes * 60 * 1000) - timeElapsed;
      return Math.max(0, timeRemaining);
    }
  };
}; 