import { useState, useCallback } from 'react';
import { potholeAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Custom hook for upvote functionality
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Object} Upvote state and handlers
 */
const useUpvote = (isAuthenticated) => {
  const [isUpvoting, setIsUpvoting] = useState(false);

  /**
   * Handle upvote action for a pothole
   * @param {string} potholeId - The pothole ID to upvote
   * @param {Function} updateCallback - Callback to update local state
   */
  const handleUpvote = useCallback(async (potholeId, updateCallback) => {
    if (!isAuthenticated) {
      toast.error('Please login to upvote');
      return;
    }

    setIsUpvoting(true);
    try {
      const response = await potholeAPI.upvote(potholeId);
      
      // Show success toast based on whether upvote was added or removed
      if (response.data.isUpvoted) {
        toast.success('Upvote added successfully!');
      } else {
        toast.success('Upvote removed successfully!');
      }
      
      // Call the update callback if provided
      if (updateCallback) {
        updateCallback(potholeId, response.data);
      }
      
      return response.data;
    } catch (error) {
      // Swallow error to avoid unhandled promise rejections in event handlers
      toast.error('Failed to upvote. Please try again.');
      return null;
    } finally {
      setIsUpvoting(false);
    }
  }, [isAuthenticated]);

  /**
   * Create an upvote handler for a specific pothole with local state update
   * @param {string} potholeId - The pothole ID
   * @param {Function} setState - State setter function
   * @returns {Function} Click handler
   */
  const createUpvoteHandler = useCallback((potholeId, setState) => {
    return async (e) => {
      // Prevent event bubbling when invoked as an event handler
      e?.stopPropagation?.(); // Safe-guard if non-event is passed
      
      await handleUpvote(potholeId, (id, responseData) => {
        setState(prev => prev.map(item => {
          if (item._id === id) {
            return {
              ...item,
              upvotes: responseData.upvotes,
              hasUpvoted: responseData.isUpvoted,
              upvotedBy: responseData.isUpvoted 
                ? [...(item.upvotedBy || []), responseData.userId]
                : (item.upvotedBy || []).filter(userId => userId !== responseData.userId)
            };
          }
          return item;
        }));
      });
    };
  }, [handleUpvote]);

  return {
    isUpvoting,
    handleUpvote,
    createUpvoteHandler,
  };
};

export default useUpvote;
