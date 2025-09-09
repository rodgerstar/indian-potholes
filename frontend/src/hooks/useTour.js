import { useState, useEffect } from 'react';
import { userAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import secureStorage from '../utils/secureStorage';

export const useTour = () => {
  const { isAuthenticated, user, updateUserData } = useAuth();
  const [showTour, setShowTour] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper function to get/set localStorage for anonymous users
  const getAnonymousTourStatus = () => {
    try {
      const stored = localStorage.getItem('anonymousHasSeenTour');
      return stored === 'true';
    } catch (error) {
      console.warn('Failed to get anonymous tour status from localStorage:', error);
      return false;
    }
  };

  const setAnonymousTourStatus = (value) => {
    try {
      localStorage.setItem('anonymousHasSeenTour', value ? 'true' : 'false');
      return true;
    } catch (error) {
      console.error('Failed to set anonymous tour status in localStorage:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkTourStatus = async () => {
      if (isAuthenticated && user) {
        try {
          // Fetch latest user data from backend (GET /auth/me)
          const response = await authAPI.getCurrentUser();
          const backendHasSeenTour = response?.data?.user?.hasSeenTour;
          setHasSeenTour(!!backendHasSeenTour);
          const result = secureStorage.setItem('hasSeenTour', backendHasSeenTour ? 'true' : 'false');
          if (result instanceof Promise) {
            await result;
          }
        } catch (e) {
          console.error('Failed to fetch user for tour status:', e);
          // fallback to secureStorage if backend fails
          try {
            const tourSeenResult = secureStorage.getItem('hasSeenTour');
            // Handle both sync and async retrieval
            const tourSeen = tourSeenResult instanceof Promise ? await tourSeenResult : tourSeenResult;
            setHasSeenTour(tourSeen === 'true');
          } catch (storageError) {
            console.error('Failed to get tour status from storage:', storageError);
            setHasSeenTour(false);
          }
        }
      } else {
        // Not authenticated, check if anonymous user has seen tour
        // Use localStorage directly for anonymous users to ensure persistence
        const anonymousTourSeen = getAnonymousTourStatus();
        setHasSeenTour(anonymousTourSeen);
      }
      setLoading(false);
    };
    checkTourStatus();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (loading) return;
    // Show tour for first-time users after a short delay
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, loading]);

  const startTour = () => {
    setShowTour(true);
  };

  const closeTour = async () => {
    setShowTour(false);
    // When user closes tour (skips), also mark as seen so it doesn't show again
    setHasSeenTour(true);
    if (isAuthenticated && user) {
      // For authenticated users, save to both backend and secureStorage
      const result = secureStorage.setItem('hasSeenTour', 'true');
      if (result instanceof Promise) {
        await result;
      }
      try {
        const response = await userAPI.updateProfile({ hasSeenTour: true });
        if (response?.data?.user) {
          updateUserData && updateUserData(response.data.user);
        }
      } catch (e) {
        console.error('Failed to update user for tour skip:', e);
        // Ignore backend error, keep local state
      }
    } else {
      // For anonymous users, save to localStorage for persistence
      setAnonymousTourStatus(true);
    }
  };

  const completeTour = async () => {
    setShowTour(false);
    setHasSeenTour(true);
    if (isAuthenticated && user) {
      // For authenticated users, save to both backend and secureStorage
      const result = secureStorage.setItem('hasSeenTour', 'true');
      if (result instanceof Promise) {
        await result;
      }
      try {
        const response = await userAPI.updateProfile({ hasSeenTour: true });
        if (response?.data?.user) {
          updateUserData && updateUserData(response.data.user);
        }
      } catch (e) {
        console.error('Failed to update user for tour completion:', e);
        // Ignore backend error, keep local state
      }
    } else {
      // For anonymous users, save to localStorage for persistence
      setAnonymousTourStatus(true);
    }
  };

  const resetTour = () => {
    setHasSeenTour(false);
    if (isAuthenticated && user) {
      secureStorage.removeItem('hasSeenTour');
      // Optionally, update backend to reset tour (not implemented here)
    } else {
      // For anonymous users, remove from localStorage
      try {
        localStorage.removeItem('anonymousHasSeenTour');
      } catch (error) {
        console.warn('Failed to remove anonymous tour status from localStorage:', error);
      }
    }
  };

  return {
    showTour,
    hasSeenTour,
    startTour,
    closeTour,
    completeTour,
    resetTour,
    loading
  };
};