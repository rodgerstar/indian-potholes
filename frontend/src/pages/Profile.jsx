import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, handleApiError, bugReportAPI, feedbackAPI } from '../services/api';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AccessibleButton from '../components/AccessibleButton';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { 
  RiUserLine, 
  RiMailLine, 
  RiCalendarLine, 
  RiEditLine, 
  RiSaveLine, 
  RiCloseLine,
  RiShieldCheckLine,
  RiUploadLine,
  RiFeedbackLine,
  RiBugLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiLoader4Line,
  RiMailCheckLine,
  RiMailCloseLine,
  RiSendPlaneLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';

// Helper for relative time
function timeAgo(date) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)} days ago`;
  return then.toLocaleDateString();
}

const Profile = () => {
  const { user, logout, updateUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [userStats, setUserStats] = useState({
    totalReports: 0,
    resolvedReports: 0,
    totalUpvotes: 0,
    joinDate: user?.createdAt || new Date()
  });
  const [bugReports, setBugReports] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    fetchUserStats();
    fetchBugReports();
    fetchFeedbacks();
  }, []);

  // Sync profile data with user data when user changes
  useEffect(() => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || ''
    });
  }, [user]);

  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      const response = await userAPI.getStats();
      setUserStats(response.data);
    } catch (error) {
      try {
        handleApiError(error);
      } catch (apiError) {
        toast.error(apiError.message);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchBugReports = async () => {
    setLoadingReports(true);
    try {
      const res = await bugReportAPI.getMyReports();
      setBugReports(res.bugReports || []);
    } catch (err) {
      setBugReports([]);
      toast.error('Failed to load bug reports. Please try again.');
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const res = await feedbackAPI.getMyFeedback();
      setFeedbacks(res.feedbacks || []);
    } catch (err) {
      setFeedbacks([]);
      toast.error('Failed to load feedbacks. Please try again.');
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await userAPI.updateProfile(profileData);
      
      // Update auth context with new user data from response
      const updatedUser = {
        ...user,
        ...response.data.user
      };
      updateUserData(updatedUser);
      
      // Show appropriate message based on response
      toast.success(response.message || 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      try {
        handleApiError(error);
      } catch (apiError) {
        toast.error(apiError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      const response = await api.post('/auth/resend-verification');
      if (response.data.success) {
        toast.success('Verification email sent successfully! Please check your inbox.');
      } else {
        toast.error(response.data.message || 'Failed to send verification email.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email.');
    } finally {
      setResendingVerification(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  return (
    <ResponsiveContainer maxWidth="4xl" className="profile-container">
      <div className="profile-content">
        {/* Header */}
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Manage your account and view your activity</p>
        </div>

        <div className="profile-grid">
          {/* Profile Information */}
          <div className="profile-main">
            <div className="profile-card">
              <div className="profile-card-header">
                <h2 className="profile-card-title">Profile Information</h2>
                {!isEditing ? (
                  <AccessibleButton
                    onClick={() => setIsEditing(true)}
                    variant="secondary"
                    size="sm"
                    aria-label="Edit profile"
                    style={{ 
                      border: '1px solid #d1d5db',
                      backgroundColor: '#f9fafb',
                      color: '#374151',
                      fontWeight: '500'
                    }}
                  >
                    <RiEditLine className="action-icon" />
                    Edit Profile
                  </AccessibleButton>
                ) : (
                  <div className="edit-actions">
                    <AccessibleButton
                      onClick={handleSave}
                      loading={loading}
                      size="sm"
                      aria-label="Save changes"
                    >
                      <RiSaveLine className="action-icon" />
                      Save
                    </AccessibleButton>
                    <AccessibleButton
                      onClick={handleCancel}
                      variant="secondary"
                      size="sm"
                      aria-label="Cancel editing"
                    >
                      <RiCloseLine className="action-icon" />
                      Cancel
                    </AccessibleButton>
                  </div>
                )}
              </div>

              <div className="profile-fields">
                {/* Name */}
                <div className="profile-field">
                  <label className="profile-label">
                    <RiUserLine className="field-icon" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="profile-value">{user.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="profile-field">
                  <label className="profile-label">
                    <RiMailLine className="field-icon" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="email-verification-container">
                      <p className="profile-value">{user.email}</p>
                      <div className="email-verification-status">
                        {user.isVerified ? (
                          <span className="verification-badge verified">
                            <RiMailCheckLine className="verification-icon" />
                            Verified
                          </span>
                        ) : (
                          <span className="verification-badge unverified">
                            <RiMailCloseLine className="verification-icon" />
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Verification Section */}
                {!user.isVerified && !isEditing && (
                  <div className="email-verification-section">
                    <div className="verification-warning">
                      <RiMailCloseLine className="warning-icon" />
                      <div className="warning-content">
                        <h4>Email Not Verified</h4>
                        <p>Please verify your email address to access all features.</p>
                      </div>
                    </div>
                    <AccessibleButton
                      onClick={handleResendVerification}
                      loading={resendingVerification}
                      size="sm"
                      aria-label="Resend verification email"
                      className="resend-verification-btn"
                    >
                      <RiSendPlaneLine className="action-icon" />
                      {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                    </AccessibleButton>
                  </div>
                )}

                {/* Role */}
                <div className="profile-field">
                  <label className="profile-label">
                    <RiShieldCheckLine className="field-icon" />
                    Role
                  </label>
                  <div className="role-badge">
                    <span className={`role-text ${user.role === 'admin' ? 'admin' : 'user'}`}>
                      {user.role === 'admin' ? 'Administrator' : 'User'}
                    </span>
                  </div>
                </div>

                {/* Join Date */}
                <div className="profile-field">
                  <label className="profile-label">
                    <RiCalendarLine className="field-icon" />
                    Member Since
                  </label>
                  <p className="profile-value">{formatDate(userStats.joinDate)}</p>
                </div>
              </div>
            </div>

            {/* User Bug Reports */}
            <div className="profile-card" style={{ marginTop: 32 }}>
              <div className="profile-bug-section-header">
                <RiBugLine style={{ color: '#ea580c', fontSize: 22 }} />
                Bug Reports
              </div>
              <div className="profile-bug-section-sub">All your submitted bug reports are listed here.</div>
              {loadingReports ? <LoadingSpinner text="Loading bug reports..." /> : (
                bugReports.length === 0 ? <div className="profile-bug-feedback-empty"><span className="profile-bug-empty-icon"><RiBugLine /></span>No bug reports submitted yet.</div> : (
                  <ul className="profile-bug-feedback-list">
                    {bugReports.map((report) => (
                      <li key={report._id} className="profile-bug-feedback-item">
                        <div className="profile-bug-title">
                          {report.title}
                          <span className={`profile-bug-status-badge ${report.status.replace(/ /g,'_')}`}>{
                            report.status === 'resolved' ? <RiCheckboxCircleLine /> :
                            report.status === 'closed' ? <RiCloseCircleLine /> :
                            report.status === 'in_progress' ? <RiLoader4Line className="spin" /> : <RiTimeLine />
                          } {report.status.replace('_',' ')}</span>
                        </div>
                        <div className="profile-bug-desc">{report.description}</div>
                        {report.imageUrl && <div className="profile-bug-feedback-img-wrapper"><img src={report.imageUrl} alt="Bug" className="profile-bug-img" loading="lazy" decoding="async" /></div>}
                        <div className="profile-bug-feedback-meta"><RiTimeLine /> Submitted {timeAgo(report.createdAt)}</div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>

            {/* User Feedback */}
            <div className="profile-card" style={{ marginTop: 32 }}>
              <div className="profile-feedback-section-header">
                <RiFeedbackLine style={{ color: '#2563eb', fontSize: 22 }} />
                Feedback
              </div>
              <div className="profile-feedback-section-sub">All your submitted feedback is listed here.</div>
              {loadingFeedbacks ? <LoadingSpinner text="Loading feedback..." /> : (
                feedbacks.length === 0 ? <div className="profile-bug-feedback-empty"><span className="profile-feedback-empty-icon"><RiFeedbackLine /></span>No feedback submitted yet.</div> : (
                  <ul className="profile-bug-feedback-list">
                    {feedbacks.map((fb) => (
                      <li key={fb._id} className="profile-bug-feedback-item profile-feedback-accent">
                        <div className="profile-bug-desc">{fb.message}</div>
                        {fb.imageUrl && <div className="profile-bug-feedback-img-wrapper"><img src={fb.imageUrl} alt="Feedback" className="profile-bug-img" loading="lazy" decoding="async" /></div>}
                        <span className={`profile-feedback-status-badge ${fb.status.replace(/ /g,'_')}`}>{
                          fb.status === 'reviewed' ? <RiCheckboxCircleLine /> :
                          fb.status === 'closed' ? <RiCloseCircleLine /> :
                          fb.status === 'actioned' ? <RiLoader4Line className="spin" /> : <RiTimeLine />
                        } {fb.status.replace('_',' ')}</span>
                        <div className="profile-bug-feedback-meta"><RiTimeLine /> Submitted {timeAgo(fb.createdAt)}</div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>

          {/* Statistics and Actions Sidebar */}
          <div className="profile-sidebar">
            {/* Activity Stats */}
            <div className="stats-card">
              <h3 className="stats-title">Your Activity</h3>
              {statsLoading ? (
                <div className="stats-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading statistics...</p>
                </div>
              ) : (
                <div className="stats-list">
                  <div className="stat-item">
                    <div className="stat-info">
                      <RiUploadLine className="stat-icon reports-icon" />
                      <span className="stat-label">Reports Submitted</span>
                    </div>
                    <span className="stat-value reports-value">{userStats.totalReports}</span>
                  </div>
                  <div className="stat-item">
                    <div className="stat-info">
                      <RiShieldCheckLine className="stat-icon resolved-icon" />
                      <span className="stat-label">Resolved Reports</span>
                    </div>
                    <span className="stat-value resolved-value">{userStats.resolvedReports}</span>
                  </div>
                  <div className="stat-item">
                    <div className="stat-info">
                      <RiUserLine className="stat-icon upvotes-icon" />
                      <span className="stat-label">Total Upvotes</span>
                    </div>
                    <span className="stat-value upvotes-value">{userStats.totalUpvotes}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="actions-card">
              <h3 className="actions-title">Quick Actions</h3>
              <div className="actions-list">
                <AccessibleButton
                  onClick={() => window.location.href = '/upload'}
                  className="action-btn primary"
                  aria-label="Report a new pothole"
                >
                  <RiUploadLine className="action-icon" />
                  Report Pothole
                </AccessibleButton>
                <AccessibleButton
                  onClick={() => window.location.href = '/gallery'}
                  className="action-btn primary"
                  aria-label="View all reports"
                >
                  <RiUserLine className="action-icon" />
                  View Gallery
                </AccessibleButton>
                <AccessibleButton
                  onClick={logout}
                  variant="danger"
                  className="action-btn danger"
                  aria-label="Logout from account"
                >
                  Logout
                </AccessibleButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
};

export default Profile; 
