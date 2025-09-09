import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  RiUserLine,
  RiMailLine,
  RiTwitterLine,
  RiMapPinLine,
  RiSendPlaneLine,
  RiCheckboxCircleLine,
  RiArrowDownSLine,
  RiInformationLine
} from 'react-icons/ri';
import { getApiBaseUrl } from '../config/environment.js';
import { mpMlaContributionAPI } from '../services/mpMlaContributionApi.js';
import LoadingSpinner from '../components/LoadingSpinner';
import ResponsiveContainer from '../components/ResponsiveContainer';
import AccessibleButton from '../components/AccessibleButton';
import '../styles/pages/contribute-mp-mla.css';
import { useMediaQuery } from 'react-responsive';

// Validation schema
const contributionSchema = yup.object().shape({
  type: yup.string().oneOf(['MP', 'MLA']).required('Please select MP or MLA'),
  state: yup.string().required('Please select a state'),
  constituency: yup.string().required('Please select a constituency'),
  representativeName: yup.string()
    .required('Representative name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: yup.string()
    .email('Please enter a valid email')
    .max(100, 'Email must be less than 100 characters')
    .optional(),
  twitterHandle: yup.string()
    .max(50, 'Twitter handle must be less than 50 characters')
    .optional()
}).test('at-least-one-contact', 'Please provide either an email address or Twitter handle', function(values) {
  const { email, twitterHandle } = values;
  // At least one contact method should be provided
  return !!(email && email.trim()) || !!(twitterHandle && twitterHandle.trim());
});

const ContributeMPMLA = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [states, setStates] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [currentRepresentative, setCurrentRepresentative] = useState(null);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [loadingCurrentData, setLoadingCurrentData] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showStats, setShowStats] = useState(false);

  // Update showStats if screen resizes
  useEffect(() => {
    const handler = () => {
      const mobile = window.matchMedia('(max-width: 600px)').matches;
      setShowStats(!mobile);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(contributionSchema),
    defaultValues: {
      type: '',
      state: '',
      constituency: '',
      representativeName: '',
      email: '',
      twitterHandle: ''
    }
  });

  const watchedType = watch('type');
  const watchedState = watch('state');
  const watchedConstituency = watch('constituency');

  // Load states on component mount
  useEffect(() => {
    loadStates();
  }, []);

  // Load constituencies when state or type changes
  useEffect(() => {
    if (watchedState && watchedType) {
      loadConstituencies();
    } else {
      // Clear constituencies and current representative when state/type changes
      setConstituencies([]);
      setCurrentRepresentative(null);
      setValue('constituency', '');
      setValue('representativeName', '');
      setValue('email', '');
    }
  }, [watchedState, watchedType]);

  // Load current representative data when constituency changes
  useEffect(() => {
    if (watchedState && watchedConstituency && watchedType) {
      loadCurrentRepresentative();
    } else {
      // Clear current representative and name when constituency changes
      setCurrentRepresentative(null);
      if (!watchedConstituency) {
        setValue('representativeName', '');
        setValue('email', '');
        setValue('twitterHandle', '');
      }
    }
  }, [watchedState, watchedConstituency, watchedType]);

  // Load stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const response = await mpMlaContributionAPI.getContributionStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        // ignore error
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const loadStates = async () => {
    try {
      setLoadingStates(true);
      const response = await axios.get(`${getApiBaseUrl()}/constituencies`);
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load states');
    } finally {
      setLoadingStates(false);
    }
  };

  const loadConstituencies = async () => {
    try {
      setLoadingConstituencies(true);
      setConstituencies([]);
      setValue('constituency', '');
      setCurrentRepresentative(null);

      let url = `${getApiBaseUrl()}/constituencies?state=${encodeURIComponent(watchedState)}`;
      
      if (watchedType === 'MP') {
        url = `${getApiBaseUrl()}/constituencies/parliamentary?state=${encodeURIComponent(watchedState)}`;
      }

      const response = await axios.get(url);
      if (response.data.success) {
        setConstituencies(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load constituencies');
    } finally {
      setLoadingConstituencies(false);
    }
  };

  const loadCurrentRepresentative = async () => {
    try {
      setLoadingCurrentData(true);
      setCurrentRepresentative(null);

      let url;
      if (watchedType === 'MP') {
        url = `${getApiBaseUrl()}/constituencies/mp?state=${encodeURIComponent(watchedState)}&pc_name=${encodeURIComponent(watchedConstituency)}`;
      } else {
        url = `${getApiBaseUrl()}/constituencies?state=${encodeURIComponent(watchedState)}&constituency=${encodeURIComponent(watchedConstituency)}`;
      }

      const response = await axios.get(url);
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setCurrentRepresentative(data);
        
        // Pre-fill form with current data
        if (watchedType === 'MP') {
          setValue('representativeName', data.mp_name || '');
          setValue('email', data.email?.[0] || '');
          setValue('twitterHandle', data.twitterHandle || '');
        } else {
          setValue('representativeName', data.mla || '');
          setValue('email', data.email?.[0] || '');
          setValue('twitterHandle', data.twitterHandle || '');
        }
      }
    } catch (error) {
      // Not showing error for 404 as it means no current data exists
      if (error.response?.status !== 404) {
        console.error('Failed to load current representative data:', error);
      }
    } finally {
      setLoadingCurrentData(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Clean up twitter handle
      if (data.twitterHandle) {
        data.twitterHandle = data.twitterHandle.replace('@', '');
      }

      // Validate that readonly fields match current data if they exist
      if (currentRepresentative) {
        const currentName = watchedType === 'MP' ? currentRepresentative.mp_name : currentRepresentative.mla;
        if (currentName && data.representativeName !== currentName) {
          toast.error('Representative name cannot be modified for existing entries');
          return;
        }
      }

      await mpMlaContributionAPI.submitContribution(data);
      
      setShowThankYou(true);
      toast.success('Thank you for your contribution!');
      
      // Auto redirect after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);
      
    } catch (error) {
      toast.error(error.message || 'Failed to submit contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showThankYou) {
    return (
      <div className="contribute-mp-mla-page">
        <ResponsiveContainer>
          <div className="contribute-thank-you-card">
            <RiCheckboxCircleLine className="contribute-thank-you-icon" />
            <h2 className="contribute-thank-you-title">Thank You!</h2>
            <p className="contribute-thank-you-message">
              Your contribution has been submitted successfully. Our moderators will review it and update the database if approved.
            </p>
            <button
              onClick={() => navigate('/')}
              className="contribute-thank-you-button"
            >
              Return to Home
            </button>
            <p className="contribute-thank-you-note">
              Redirecting automatically in 5 seconds...
            </p>
          </div>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="contribute-mp-mla-page">
      <ResponsiveContainer>
        {/* Stats Card Toggle (always shown) */}
        {!showStats && (
          <button
            className="contribute-mp-mla-stats-toggle-btn"
            onClick={() => setShowStats(true)}
          >
            Show Contribution Stats
          </button>
        )}
        {/* Stats Card */}
        {showStats && (
          <div
            className="contribute-mp-mla-stats-card mobile-toggle"
            style={{ transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s', maxHeight: showStats ? 400 : 0, opacity: showStats ? 1 : 0 }}
          >
            <button
              className="contribute-mp-mla-stats-toggle-btn close"
              onClick={() => setShowStats(false)}
            >
              Hide Stats
            </button>
            {loadingStats ? (
              <div className="contribute-mp-mla-stats-loading">
                <LoadingSpinner size="sm" /> Loading stats...
              </div>
            ) : stats ? (
              <>
                <h2 className="contribute-mp-mla-stats-title">Contribution Stats</h2>
                <div className="contribute-mp-mla-stats-grid">
                  <div className="contribute-mp-mla-stats-item total">
                    <span className="contribute-mp-mla-stats-label">Total Requests</span>
                    <span className="contribute-mp-mla-stats-value total">{stats.total}</span>
                  </div>
                  <div className="contribute-mp-mla-stats-item approved">
                    <span className="contribute-mp-mla-stats-label">Approved</span>
                    <span className="contribute-mp-mla-stats-value approved">{stats.approved}</span>
                  </div>
                  <div className="contribute-mp-mla-stats-item rejected">
                    <span className="contribute-mp-mla-stats-label">Rejected</span>
                    <span className="contribute-mp-mla-stats-value rejected">{stats.rejected}</span>
                  </div>
                  <div className="contribute-mp-mla-stats-item pending">
                    <span className="contribute-mp-mla-stats-label">Pending</span>
                    <span className="contribute-mp-mla-stats-value pending">{stats.pending}</span>
                  </div>
                  <div className="contribute-mp-mla-stats-item coverage">
                    <span className="contribute-mp-mla-stats-label">MLA Coverage</span>
                    <span className="contribute-mp-mla-stats-value coverage">{stats.mlaCoverage}%</span>
                  </div>
                  <div className="contribute-mp-mla-stats-item coverage">
                    <span className="contribute-mp-mla-stats-label">MP Coverage</span>
                    <span className="contribute-mp-mla-stats-value coverage">{stats.mpCoverage}%</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="contribute-mp-mla-stats-error">Unable to load stats.</div>
            )}
          </div>
        )}
        <div className="contribute-form-container">
          <div className="contribute-form-card">
            <div className="contribute-form-header">
              <h1 className="contribute-form-title">
                Contribute MP/MLA Contact Data
              </h1>
              <p className="contribute-form-subtitle">
                Help us maintain accurate contact information for Members of Parliament (MPs) and Members of Legislative Assembly (MLAs). 
                Your contributions will be reviewed before being added to our database.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Type Selection */}
              <div className="contribute-form-field">
                <label htmlFor="type" className="contribute-form-label">
                  Representative Type *
                </label>
                <div className="contribute-select-wrapper">
                  <select
                    {...register('type')}
                    id="type"
                    className="contribute-form-select"
                  >
                    <option value="">Select MP or MLA</option>
                    <option value="MP">Member of Parliament (MP)</option>
                    <option value="MLA">Member of Legislative Assembly (MLA)</option>
                  </select>
                  <RiArrowDownSLine className="contribute-select-icon" />
                </div>
                {errors.type && (
                  <p className="contribute-form-error">{errors.type.message}</p>
                )}
              </div>

              {/* State Selection */}
              <div className="contribute-form-field">
                <label htmlFor="state" className="contribute-form-label">
                  State *
                </label>
                <div className="contribute-select-wrapper">
                  <select
                    {...register('state')}
                    id="state"
                    disabled={loadingStates}
                    className="contribute-form-select"
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <RiArrowDownSLine className="contribute-select-icon" />
                </div>
                {errors.state && (
                  <p className="contribute-form-error">{errors.state.message}</p>
                )}
              </div>

              {/* Constituency Selection */}
              <div className="contribute-form-field">
                <label htmlFor="constituency" className="contribute-form-label">
                  {watchedType === 'MP' ? 'Parliamentary Constituency' : 'Assembly Constituency'} *
                </label>
                <div className="contribute-select-wrapper">
                  <select
                    {...register('constituency')}
                    id="constituency"
                    disabled={!watchedState || !watchedType || loadingConstituencies}
                    className="contribute-form-select"
                  >
                    <option value="">Select Constituency</option>
                    {constituencies.map((constituency) => (
                      <option key={constituency} value={constituency}>
                        {constituency}
                      </option>
                    ))}
                  </select>
                  <RiArrowDownSLine className="contribute-select-icon" />
                  {loadingConstituencies && (
                    <div className="contribute-loading-container">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
                {errors.constituency && (
                  <p className="contribute-form-error">{errors.constituency.message}</p>
                )}
              </div>

              {/* Current Representative Info */}
              {currentRepresentative && (
                <div className="contribute-current-info">
                  <h3 className="contribute-current-info-title">
                    <RiInformationLine />
                    Current Information:
                  </h3>
                  <div className="contribute-current-info-content">
                    <p><strong>Name:</strong> {watchedType === 'MP' ? currentRepresentative.mp_name : currentRepresentative.mla}</p>
                    {watchedType === 'MP' && currentRepresentative.email && (
                      <p><strong>Email:</strong> {currentRepresentative.email[0]}</p>
                    )}
                    {watchedType === 'MP' && currentRepresentative.mp_political_party && (
                      <p><strong>Party:</strong> {currentRepresentative.mp_political_party}</p>
                    )}
                    {watchedType === 'MLA' && currentRepresentative.party && (
                      <p><strong>Party:</strong> {currentRepresentative.party}</p>
                    )}
                  </div>
                  <p className="contribute-current-info-note">
                    Please update the fields below if any information is missing or incorrect.
                  </p>
                </div>
              )}

              {loadingCurrentData && (
                <div className="contribute-loading-container">
                  <LoadingSpinner size="sm" />
                  <p className="contribute-loading-text">Loading current data...</p>
                </div>
              )}

              {/* Representative Name */}
              <div className="contribute-form-field">
                <label htmlFor="representativeName" className="contribute-form-label">
                  {watchedType === 'MP' ? 'MP Name' : 'MLA Name'} *
                </label>
                <div className="contribute-form-input-group">
                  <RiUserLine className="contribute-form-icon" />
                  <input
                    {...register('representativeName')}
                    type="text"
                    id="representativeName"
                    placeholder={`Enter ${watchedType === 'MP' ? 'MP' : 'MLA'} name`}
                    readOnly={currentRepresentative && (
                      (watchedType === 'MP' && currentRepresentative.mp_name) ||
                      (watchedType === 'MLA' && currentRepresentative.mla)
                    )}
                    className={`contribute-form-input ${
                      currentRepresentative && (
                        (watchedType === 'MP' && currentRepresentative.mp_name) ||
                        (watchedType === 'MLA' && currentRepresentative.mla)
                      ) ? 'readonly' : ''
                    }`}
                  />
                </div>
                {currentRepresentative && (
                  (watchedType === 'MP' && currentRepresentative.mp_name) ||
                  (watchedType === 'MLA' && currentRepresentative.mla)
                ) && (
                  <p className="contribute-readonly-note">
                    This name is from our existing records and cannot be edited. If incorrect, please contact support.
                  </p>
                )}
                {errors.representativeName && (
                  <p className="contribute-form-error">{errors.representativeName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="contribute-form-field">
                <label htmlFor="email" className="contribute-form-label">
                  Email Address
                </label>
                <div className="contribute-form-input-group">
                  <RiMailLine className="contribute-form-icon" />
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    placeholder="Enter email address"
                    className="contribute-form-input"
                  />
                </div>
                {errors.email && (
                  <p className="contribute-form-error">{errors.email.message}</p>
                )}
              </div>

              {/* Twitter Handle */}
              <div className="contribute-form-field">
                <label htmlFor="twitterHandle" className="contribute-form-label">
                  Twitter Handle
                </label>
                <div className="contribute-form-input-group">
                  <RiTwitterLine className="contribute-form-icon" />
                  <input
                    {...register('twitterHandle')}
                    type="text"
                    id="twitterHandle"
                    placeholder="Enter Twitter handle (without @)"
                    className="contribute-form-input"
                  />
                </div>
                {errors.twitterHandle && (
                  <p className="contribute-form-error">{errors.twitterHandle.message}</p>
                )}
                <p className="contribute-form-help">
                  Don't include the @ symbol
                </p>
              </div>

              {/* Submit Button */}
              <div className="contribute-form-submit">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="contribute-submit-button"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="contribute-loading-icon" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <RiSendPlaneLine />
                      Submit Contribution
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="contribute-form-footer">
              <h3 className="contribute-form-footer-title">About this form:</h3>
              <ul className="contribute-form-footer-list">
                <li className="contribute-form-footer-item">All submissions are reviewed by our moderation team</li>
                <li className="contribute-form-footer-item">Only accurate and verified information will be added to our database</li>
                <li className="contribute-form-footer-item">This form does not require login or registration</li>
                <li className="contribute-form-footer-item">Your IP address may be logged for security purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default ContributeMPMLA;