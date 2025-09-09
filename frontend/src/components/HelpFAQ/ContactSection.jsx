import React from 'react';
import SectionHeader from './SectionHeader';
import ContactOption from './ContactOption';
import { contactOptionsData } from '../../data/helpFAQData';
import './ContactSection.css';

const ContactSection = () => {
  return (
    <section className="contact-section">
      <div className="contact-section__container">
        <div className="contact-section__content">
          <SectionHeader 
            title="Still Need Help?" 
            subtitle="If you couldn't find the answer you're looking for, we're here to help!"
            size="medium"
          />
          <div className="contact-section__options">
            {contactOptionsData.map((option, index) => (
              <ContactOption
                key={index}
                href={option.href}
                icon={option.icon}
                title={option.title}
                description={option.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;