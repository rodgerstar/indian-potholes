import React from 'react';
import { RiFileList3Line } from 'react-icons/ri';

const TermsOfService = () => {
  return (
    <div className="form-page-container">
      <div className="form-card" style={{ maxWidth: '800px' }}>
        <h1 className="form-title">
          <RiFileList3Line /> Terms of Service
        </h1>
        
        <div className="static-content">
          <p className="form-description">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <h2>Acceptance of Terms</h2>
          <p>
            By accessing and using Indian Potholes, you accept and agree to be bound by the 
            terms and provision of this agreement.
          </p>
          
          <h2>Use License</h2>
          <p>
            Permission is granted to temporarily use Indian Potholes for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a 
            transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained on the website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
          
          <h2>User Conduct</h2>
          <p>
            When using our service, you agree to:
          </p>
          <ul>
            <li>Provide accurate and truthful information in your reports</li>
            <li>Not submit false or misleading pothole reports</li>
            <li>Respect the privacy and rights of other users</li>
            <li>Not use the service for any illegal or unauthorized purpose</li>
            <li>Not interfere with or disrupt the service</li>
          </ul>
          
          <h2>Content Responsibility</h2>
          <p>
            You are responsible for the content you submit to Indian Potholes. By submitting 
            content, you grant us the right to use, modify, and distribute your content for 
            the purpose of improving road safety.
          </p>
          
          <h2>Limitation of Liability</h2>
          <p>
            Indian Potholes shall not be liable for any damages that may arise from the use 
            or inability to use the service, including but not limited to direct, indirect, 
            incidental, or consequential damages.
          </p>
          
          <h2>Service Availability</h2>
          <p>
            We strive to maintain service availability but do not guarantee uninterrupted 
            access. We may suspend or terminate service at any time without notice.
          </p>
          
          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Changes will be effective 
            immediately upon posting to the website.
          </p>
          
          <h2>Contact Information</h2>
          <p>
            For questions about these terms, please contact us at help.indianpotholes@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;