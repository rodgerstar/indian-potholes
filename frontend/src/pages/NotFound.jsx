import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';
import '../styles/pages/not-found.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">
          <FaExclamationTriangle className="rocket-icon" />
        </div>
        <h1 className="not-found-title">Houston, we have a problem!</h1>
        <p className="not-found-message">
          The page you're looking for seems to have taken a detour to outer space.
          <br />
          <span className="not-found-subtitle">404 - Page Not Found</span>
        </p>
        <div className="not-found-actions">
          <Link to="/" className="home-button">
            <FaHome className="home-icon" />
            Back to Home
          </Link>
        </div>
        <div className="not-found-decoration">
          <div className="stars">
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 