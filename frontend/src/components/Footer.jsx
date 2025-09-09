import React from 'react';
import { Link } from 'react-router-dom';
import { RiBugLine, RiFeedbackLine, RiFilePaper2Line, RiSettings3Line, RiShieldUserLine, RiFileList3Line, RiInformationLine, RiContactsLine, RiBarChart2Line, RiUserLine } from 'react-icons/ri';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-links">
        <Link to="/bug-report" className="footer-link"><RiBugLine /> Report Bug</Link>
        <Link to="/feedback" className="footer-link"><RiFeedbackLine /> Feedback</Link>
        <Link to="/changelog" className="footer-link"><RiFilePaper2Line /> Changelog</Link>
        <Link to="/roadmap" className="footer-link"><RiSettings3Line /> Roadmap</Link>
        <Link to="/privacy-policy" className="footer-link"><RiShieldUserLine /> Privacy Policy</Link>
        <Link to="/terms-of-service" className="footer-link"><RiFileList3Line /> Terms of Service</Link>
        <Link to="/legal-disclaimer" className="footer-link"><RiInformationLine /> Disclaimer</Link>
        <Link to="/contact-us" className="footer-link"><RiContactsLine /> Contact Us</Link>
        <Link to="/traffic" className="footer-link"><RiBarChart2Line /> Traffic</Link>
        <Link to="/contribute-mp-mla" className='footer-link'><RiUserLine /> Contribute MP/MLA</Link>
        <Link to="/blog" className="footer-link"><RiFilePaper2Line /> Blog</Link>
      </div>
      <div className="footer-copy">
        &copy; {new Date().getFullYear()} Indian Potholes
      </div>
      <div className="footer-funded">
        <a href="https://www.malpaniventures.com" target="_blank" rel="noopener noreferrer">
          Funded by Malpani Ventures as a social service project
        </a>
      </div>
    </div>
  </footer>
);

export default Footer; 