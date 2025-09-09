import React from 'react';

const LoadingSpinner = React.memo(({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg',
    xl: 'spinner-xl'
  };

  return (
    <div className={`loading-container ${className}`}>
      <div className={`loading-spinner ${sizeClasses[size]}`}></div>
      {text && (
        <p className="loading-text">{text}</p>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 