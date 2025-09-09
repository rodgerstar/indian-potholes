import React, { useState } from 'react';
import FormValidation from '../components/FormValidation';
import { RiFeedbackLine, RiSendPlaneLine, RiImageAddLine, RiCloseLine } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { feedbackAPI } from '../services/api';

const Feedback = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ message: '', image: null, imageUrl: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.message) {
      errs.message = 'Feedback is required';
    } else if (form.message.length < 10) {
      errs.message = 'Feedback must be at least 10 characters';
    } else if (form.message.length > 2000) {
      errs.message = 'Feedback must be less than 2000 characters';
    }
    return errs;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: file, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image: null, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({ message: true });
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    try {
      await feedbackAPI.submit({
        message: form.message,
        imageUrl: form.imageUrl
      });
      setSuccess(true);
      setForm({ message: '', image: null, imageUrl: '' });
      setTouched({});
    } catch (err) {
      setSuccess(false);
      if (err.response?.data?.errors) {
        // Handle server validation errors
        const serverErrors = {};
        err.response.data.errors.forEach(error => {
          serverErrors[error.path] = error.msg;
        });
        setErrors(serverErrors);
        setTouched({ message: true });
      } else {
        setErrors({ submit: err.message || 'Failed to submit feedback' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <h2 className="form-title"><RiFeedbackLine /> Send Feedback</h2>
        <p className="form-description">We value your feedback! Please share your thoughts or suggestions below. You can also attach an image if relevant.</p>
        <form onSubmit={handleSubmit} className="form-group">
          <label className="form-label">Your Feedback</label>
          <textarea
            className="form-input"
            name="message"
            value={form.message}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Share your thoughts or suggestions (minimum 10 characters)"
            rows={5}
          />
          <div className={`form-character-count ${form.message.length < 10 ? 'error' : ''} ${form.message.length > 1800 ? 'warning' : ''} ${form.message.length > 1900 ? 'error' : ''}`}>
            {form.message.length}/2000 characters (minimum 10)
          </div>
          <FormValidation errors={errors} touched={touched} fieldName="message" />
          <label className="form-label">Upload Image (optional)</label>
          <div className="form-image-upload">
            <input id="feedback-image-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <label htmlFor="feedback-image-upload" className="image-upload-btn">
              <RiImageAddLine /> {form.imageUrl ? 'Change Image' : 'Add Image'}
            </label>
            {form.imageUrl && (
              <div className="image-preview-wrapper">
                <img src={form.imageUrl} alt="Preview" className="image-preview" loading="lazy" decoding="async" />
                <button type="button" className="remove-image-btn" onClick={removeImage} aria-label="Remove image">
                  <RiCloseLine />
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-primary form-submit-btn" type="submit" disabled={submitting} aria-busy={submitting}>
            <RiSendPlaneLine /> {submitting ? 'Submitting...' : 'Send Feedback'}
          </button>
          {success && <div className="form-validation success">Thank you for your feedback!</div>}
          {errors.submit && <div className="form-validation error">{errors.submit}</div>}
        </form>
      </div>
    </div>
  );
};

export default Feedback; 
