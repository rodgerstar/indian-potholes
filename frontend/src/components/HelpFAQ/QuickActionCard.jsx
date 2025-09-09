import React from 'react';
import './QuickActionCard.css';

const QuickActionCard = ({ 
  href, 
  icon: Icon, 
  title, 
  description, 
  onClick,
  special = false 
}) => {
  const content = (
    <>
      <div className="quick-action-card__icon-wrapper">
        <Icon className="quick-action-card__icon" aria-hidden="true" />
      </div>
      <div className="quick-action-card__content">
        <h3 className="quick-action-card__title">{title}</h3>
        <p className="quick-action-card__description">{description}</p>
      </div>
    </>
  );

  const className = `quick-action-card ${special ? 'quick-action-card--special' : ''}`;

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
};

export default QuickActionCard;