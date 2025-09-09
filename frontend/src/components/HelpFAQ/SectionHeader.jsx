import React from 'react';
import './SectionHeader.css';

const SectionHeader = ({ 
  title, 
  subtitle, 
  alignment = 'center', 
  size = 'large',
  className = '' 
}) => {
  return (
    <div className={`section-header section-header--${alignment} section-header--${size} ${className}`}>
      <h2 className="section-header__title">{title}</h2>
      {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
    </div>
  );
};

export default SectionHeader;