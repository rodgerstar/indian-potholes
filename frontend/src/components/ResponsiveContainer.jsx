import React from 'react';

const ResponsiveContainer = React.memo(({ 
  children, 
  className = '', 
  maxWidth = '7xl',
  padding = true 
}) => {
  const maxWidthClasses = {
    sm: 'container-sm',
    md: 'container-md',
    lg: 'container-lg',
    xl: 'container-xl',
    '2xl': 'container-2xl',
    '3xl': 'container-3xl',
    '4xl': 'container-4xl',
    '5xl': 'container-5xl',
    '6xl': 'container-6xl',
    '7xl': 'container-7xl',
    full: 'container-full'
  };

  const paddingClasses = padding ? 'container-padding' : '';

  return (
    <div className={`container ${maxWidthClasses[maxWidth]} ${paddingClasses} ${className}`}>
      {children}
    </div>
  );
});

ResponsiveContainer.displayName = 'ResponsiveContainer';

export default ResponsiveContainer; 