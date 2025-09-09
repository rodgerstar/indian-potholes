import { useState, useCallback } from 'react';

/**
 * Custom hook for modal state management
 * @param {boolean} initialOpen - Initial modal state (default: false)
 * @returns {Object} Modal state and handlers
 */
const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [modalData, setModalData] = useState(null);

  /**
   * Open modal with optional data
   * @param {*} data - Optional data to pass to modal
   */
  const openModal = useCallback((data = null) => {
    setModalData(data);
    setIsOpen(true);
  }, []);

  /**
   * Close modal and clear data
   */
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setModalData(null);
  }, []);

  /**
   * Toggle modal state
   */
  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev);
    if (isOpen) {
      setModalData(null);
    }
  }, [isOpen]);

  return {
    isOpen,
    modalData,
    openModal,
    closeModal,
    toggleModal,
  };
};

export default useModal;