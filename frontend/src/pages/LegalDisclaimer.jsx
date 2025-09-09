import React from 'react';
import { RiInformationLine } from 'react-icons/ri';

const LegalDisclaimer = () => {
  return (
    <div className="form-page-container">
      <div className="form-card" style={{ maxWidth: '800px' }}>
        <h1 className="form-title">
          <RiInformationLine /> Legal Disclaimer
        </h1>
        
        <div className="static-content">
          <p className="form-description">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <h2>General Information</h2>
          <p>
            The information on Indian Potholes is provided on an "as is" basis. To the fullest 
            extent permitted by law, this website excludes all representations, warranties, 
            conditions and terms related to our website and the use of this website.
          </p>
          
          <h2>User-Generated Content</h2>
          <p>
            Indian Potholes allows users to submit reports and information about road conditions. 
            We do not verify the accuracy of user-submitted content and cannot guarantee its 
            completeness or reliability.
          </p>
          
          <h2>Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We have no control over 
            these sites and are not responsible for their content, privacy policies, or practices.
          </p>
          
          <h2>Government and Authority Relations</h2>
          <p>
            While we forward pothole reports to relevant authorities, we cannot guarantee 
            that action will be taken. We are not affiliated with any government agency 
            and do not represent official government positions.
          </p>
          
          <h2>Data Accuracy</h2>
          <p>
            We strive to ensure that information on our website is accurate and up-to-date. 
            However, we make no representations or warranties about the accuracy, completeness, 
            or suitability of the information for any particular purpose.
          </p>
          
          <h2>Personal Safety</h2>
          <p>
            When reporting potholes, please prioritize your personal safety. Do not stop in 
            dangerous locations or put yourself at risk to document road conditions.
          </p>
          
          <h2>Location Services</h2>
          <p>
            Our service may use location data to help identify pothole locations. Location 
            data may not always be accurate and should not be relied upon for navigation 
            or safety purposes.
          </p>
          
          <h2>Service Modifications</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue any aspect of our service 
            at any time without notice.
          </p>
          
          <h2>Limitation of Liability</h2>
          <p>
            Under no circumstances shall Indian Potholes be liable for any direct, indirect, 
            special, incidental, or consequential damages arising from the use of this website 
            or the information contained herein.
          </p>
          
          <h2>Contact Information</h2>
          <p>
            For questions about this disclaimer, please contact us at help.indianpotholes@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalDisclaimer;