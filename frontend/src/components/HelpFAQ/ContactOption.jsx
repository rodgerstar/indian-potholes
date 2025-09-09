import React from 'react';
import './ContactOption.css';

const ContactOption = ({ href, icon: Icon, title, description }) => {
  return (
    <a href={href} className="contact-option">
      <div className="contact-option__icon-wrapper">
        <Icon className="contact-option__icon" aria-hidden="true" />
      </div>
      <div className="contact-option__content">
        <h4 className="contact-option__title">{title}</h4>
        <p className="contact-option__description">{description}</p>
      </div>
    </a>
  );
};

export default ContactOption;