import React, { useState } from 'react';
import FormValidation from '../components/FormValidation';
import { RiBugLine, RiSendPlaneLine, RiImageAddLine, RiCloseLine } from 'react-icons/ri';
import { bugReportAPI } from '../services/api';

const BugReport = () => {
  const [form, setForm] = useState({ title: '', description: '', image: null, imageUrl: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.title) {
      errs.title = 'Title is required';
    } else if (form.title.length < 3) {
      errs.title = 'Title must be at least 3 characters';
    } else if (form.title.length > 200) {
      errs.title = 'Title must be less than 200 characters';
    }
    
    if (!form.description) {
      errs.description = 'Description is required';
    } else if (form.description.length < 10) {
      errs.description = 'Description must be at least 10 characters';
    } else if (form.description.length > 2000) {
      errs.description = 'Description must be less than 2000 characters';
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
    setTouched({ title: true, description: true });
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    try {
      await bugReportAPI.submit({
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl
      });
      setSuccess(true);
      setForm({ title: '', description: '', image: null, imageUrl: '' });
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
        setTouched({ title: true, description: true });
      } else {
        setErrors({ submit: err.message || 'Failed to submit bug report' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-card">
        <h2 className="form-title"><RiBugLine /> Report a Bug</h2>
        <p className="form-description">Found a bug? Please help us improve by describing the issue below. You can also attach a screenshot or image.</p>
        <form onSubmit={handleSubmit} className="form-group">
          <label className="form-label">Title</label>
          <input
            className="form-input"
            name="title"
            value={form.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Short summary of the bug"
            autoFocus
          />
          <div className={`form-character-count ${form.title.length > 180 ? 'warning' : ''} ${form.title.length > 190 ? 'error' : ''}`}>
            {form.title.length}/200 characters
          </div>
          <FormValidation errors={errors} touched={touched} fieldName="title" />
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            name="description"
            value={form.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Describe the bug in detail (minimum 10 characters)"
            rows={5}
          />
          <div className={`form-character-count ${form.description.length < 10 ? 'error' : ''} ${form.description.length > 1800 ? 'warning' : ''} ${form.description.length > 1900 ? 'error' : ''}`}>
            {form.description.length}/2000 characters (minimum 10)
          </div>
          <FormValidation errors={errors} touched={touched} fieldName="description" />
          <label className="form-label">Upload Image (optional)</label>
          <div className="form-image-upload">
            <input id="bug-image-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <label htmlFor="bug-image-upload" className="image-upload-btn">
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
            <RiSendPlaneLine /> {submitting ? 'Submitting...' : 'Submit Bug Report'}
          </button>
          {success && <div className="form-validation success">Thank you for your report!</div>}
          {errors.submit && <div className="form-validation error">{errors.submit}</div>}
        </form>
      </div>
    </div>
  );
};

export default BugReport; 
