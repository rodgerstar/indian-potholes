import React, { useState } from 'react';
import { RiContactsLine, RiMailLine, RiPhoneLine, RiMapPin2Line, RiSendPlaneLine } from 'react-icons/ri';
import FormValidation from '../components/FormValidation';
import { contactAPI } from '../services/api';

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const errs = {};
    if (!form.name) {
      errs.name = 'Name is required';
    } else if (form.name.length > 100) {
      errs.name = 'Name must be less than 100 characters';
    }
    if (!form.email) {
      errs.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = 'Please enter a valid email';
    }
    if (!form.message) {
      errs.message = 'Message is required';
    } else if (form.message.length < 10) {
      errs.message = 'Message must be at least 10 characters';
    } else if (form.message.length > 2000) {
      errs.message = 'Message must be less than 2000 characters';
    }
    return errs;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({ name: true, email: true, message: true });
    setSubmitError('');
    setSuccess(false);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    try {
      await contactAPI.submit(form);
      setSuccess(true);
      setForm({ name: '', email: '', message: '' });
      setTouched({});
    } catch (err) {
      setSuccess(false);
      setSubmitError(err.message || 'Failed to send your message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card" style={{ maxWidth: '800px' }}>
        <h1 className="form-title">
          <RiContactsLine /> Contact Us
        </h1>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="form-group" style={{ marginBottom: '2rem' }}>
          <label className="form-label">Name</label>
          <input
            className="form-input"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Your Name"
            maxLength={100}
            autoComplete="name"
          />
          <FormValidation errors={errors} touched={touched} fieldName="name" />

          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="your@email.com"
            autoComplete="email"
          />
          <FormValidation errors={errors} touched={touched} fieldName="email" />

          <label className="form-label">Message</label>
          <textarea
            className="form-input"
            name="message"
            value={form.message}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Type your message (minimum 10 characters)"
            rows={5}
            maxLength={2000}
          />
          <div className={`form-character-count ${form.message.length < 10 ? 'error' : ''} ${form.message.length > 1800 ? 'warning' : ''} ${form.message.length > 1900 ? 'error' : ''}`}>
            {form.message.length}/2000 characters (minimum 10)
          </div>
          <FormValidation errors={errors} touched={touched} fieldName="message" />

          <button className="btn btn-primary form-submit-btn" type="submit" disabled={submitting} aria-busy={submitting} style={{ marginTop: '1rem' }}>
            <RiSendPlaneLine /> {submitting ? 'Sending...' : 'Send Message'}
          </button>
          {success && (
            <div
              className="form-validation success contact-success-message"
              style={{
                background: '#d1fae5',
                color: '#065f46',
                fontWeight: 'bold',
                fontSize: '1.15rem',
                border: '2px solid #10b981',
                borderRadius: '8px',
                padding: '1rem',
                margin: '1rem 0',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
              }}
            >
              Thank you! Your message has been sent.
            </div>
          )}
          {submitError && <div className="form-validation error">{submitError}</div>}
        </form>

        <div className="static-content">
          <p className="form-description">
            Get in touch with the Indian Potholes team. We're here to help improve road safety 
            across India.
          </p>
          
          <div className="contact-section">
            <h2>General Information</h2>
            <p>
              For general inquiries, support, or feedback about our platform, please reach out 
              to us using the contact information below.
            </p>
          </div>
          
          <div className="contact-section">
            <h2>Contact Information</h2>
            
            <div className="contact-item">
              <div className="contact-icon">
                <RiMailLine />
              </div>
              <div className="contact-details">
                <h3>Email</h3>
                <p>help.indianpotholes@gmail.com</p>
                <p>For technical support and general inquiries</p>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">
                <RiPhoneLine />
              </div>
              <div className="contact-details">
                <h3>Phone</h3>
                <p>We are working on getting a number</p>
                {/* <p>Monday to Friday, 9:00 AM - 6:00 PM IST</p> */}
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">
                <RiMapPin2Line />
              </div>
              <div className="contact-details">
                <h3>Address</h3>
                <p>We are working on getting an address</p>
                {/* <p>
                  Indian Potholes Foundation<br />
                  123 Tech Park, Sector 5<br />
                  Bangalore, Karnataka 560001<br />
                  India
                </p> */}
              </div>
            </div>
          </div>
          
          <div className="contact-section">
            <h2>Specialized Contacts</h2>
            
            <div className="specialized-contact">
              <h3>Technical Support</h3>
              <p>Email: help.indianpotholes@gmail.com</p>
              <p>For bugs, technical issues, and feature requests</p>
            </div>
            
            <div className="specialized-contact">
              <h3>Privacy & Legal</h3>
              <p>Email: help.indianpotholes@gmail.com</p>
              <p>For privacy concerns and legal matters</p>
            </div>
            
            <div className="specialized-contact">
              <h3>Press & Media</h3>
              <p>Email: help.indianpotholes@gmail.com</p>
              <p>For media inquiries and press releases</p>
            </div>
          </div>
          
          <div className="contact-section">
            <h2>Response Time</h2>
            <p>
              We aim to respond to all inquiries within 24-48 hours during business days. 
              For urgent technical issues, please submit a ticket via the report bug form.
            </p>
          </div>
          
          <div className="contact-section">
            <h2>Report a Pothole</h2>
            <p>
              To report a pothole, please use our reporting feature in the main application. 
              This ensures your report is properly categorized and forwarded to the relevant 
              authorities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;