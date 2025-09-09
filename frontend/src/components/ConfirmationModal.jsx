import React from 'react';

const ConfirmationModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onConfirm}>{confirmText}</button>
          <button className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 