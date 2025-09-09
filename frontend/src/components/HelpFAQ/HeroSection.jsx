import React from 'react';
import { RiQuestionLine } from 'react-icons/ri';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="help-hero-section">
      <div className="help-hero-section__overlay" />
      <div className="help-hero-section__container">
        <div className="help-hero-section__content">
          <RiQuestionLine className="help-hero-section__icon" aria-hidden="true" />
          <h1 className="help-hero-section__title">Help & FAQ</h1>
          <p className="help-hero-section__description">
            Find answers to common questions about reporting potholes and using the platform
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;