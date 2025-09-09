import React from 'react';

const AccessibleButton = React.memo(({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
  ...props 
}) => {
  const baseClasses = 'btn';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger'
  };
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={classes}
      onClick={(e) => {
        // Prevent accidental form submissions when used inside a form
        if (type !== 'submit') {
          e.preventDefault();
        }
        // Avoid triggering parent click handlers inadvertently
        e.stopPropagation();
        if (onClick) onClick(e);
      }}
      type={type}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="loading-spinner"></div>
      )}
      {children}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton; 
