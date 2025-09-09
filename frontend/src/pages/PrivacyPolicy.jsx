import React from 'react';
import { RiShieldUserLine } from 'react-icons/ri';

const PrivacyPolicy = () => {
  return (
    <div className="form-page-container">
      <div className="form-card" style={{ maxWidth: '800px' }}>
        <h1 className="form-title">
          <RiShieldUserLine /> Privacy Policy
        </h1>
        
        <div className="static-content">
          <p className="form-description">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <h2>Information We Collect</h2>
          <p>
            When you use Indian Potholes, we collect information that you provide directly to us, 
            such as when you create an account, report a pothole, or contact us for support.
          </p>
          
          <h2>How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Process and respond to your pothole reports</li>
            <li>Send you updates about reported potholes</li>
            <li>Improve our services and user experience</li>
          </ul>
          
          <h2>Information Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to outside parties. 
            We may share your information with government authorities when reporting potholes for 
            public safety purposes.
          </p>
          
          <h2>Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction.
          </p>
          
          <h2>Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information. 
            You may also request that we stop processing your data.
          </p>
          
          <h2>Changes to Privacy Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes 
            by posting the new policy on this page.
          </p>
          
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this privacy policy, please contact us at 
            roshan@empoweredindian.in
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
