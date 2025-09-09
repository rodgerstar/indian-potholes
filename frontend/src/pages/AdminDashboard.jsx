import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/adminApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ResponsiveContainer from '../components/ResponsiveContainer';
import AccessibleButton from '../components/AccessibleButton';
import ConfirmationModal from '../components/ConfirmationModal';
import NotificationDetailsModal from '../components/NotificationDetailsModal';
import DetailsModal from '../components/DetailsModal';
import MPMLAModeration from '../components/MPMLAModeration';
import { 
  RiDashboardLine,
  RiUserLine,
  RiFileListLine,
  RiNotificationLine,
  RiSearchLine,
  RiFilterLine,
  RiEditLine,
  RiDeleteBinLine,
  RiShieldCheckLine,
  RiUserSettingsLine,
  RiEyeLine,
  RiCloseLine,
  RiSendPlaneLine,
  RiBarChartLine,
  RiCalendarLine,
  RiMapPinLine,
  RiThumbUpLine,
  RiImageLine,
  RiVideoLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiAddLine,
  RiMoreLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiErrorWarningLine,
  RiGovernmentLine,
  RiMapLine,
  RiSaveLine,
  RiAlertLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';

// Complete list of Indian states and union territories
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Component for individual pending assignment row
const PendingAssignmentRow = ({ report, onAssign }) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [constituencies, setConstituencies] = useState([]);
  const [parliamentaryConstituencies, setParliamentaryConstituencies] = useState([]);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    state: '',
    constituency: '',
    parliamentaryConstituency: ''
  });

  // Fetch constituencies when state changes
  const handleStateChange = async (selectedState) => {
    setAssignmentForm(prev => ({ 
      ...prev, 
      state: selectedState, 
      constituency: '', 
      parliamentaryConstituency: '' 
    }));
    
    if (!selectedState) {
      setConstituencies([]);
      setParliamentaryConstituencies([]);
      return;
    }

    setLoadingConstituencies(true);
    try {
      // Fetch Assembly Constituencies
      const acResponse = await adminAPI.getConstituenciesByState(selectedState);
      setConstituencies(acResponse.data || []);
      
      // Fetch Parliamentary Constituencies  
      const pcResponse = await adminAPI.getParliamentaryConstituenciesByState(selectedState);
      setParliamentaryConstituencies(pcResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch constituencies:', error);
      toast.error('Failed to load constituencies for selected state');
      setConstituencies([]);
      setParliamentaryConstituencies([]);
    } finally {
      setLoadingConstituencies(false);
    }
  };

  const handleAssign = async () => {
    if (!assignmentForm.state || !assignmentForm.constituency) {
      toast.error('Please fill in state and constituency');
      return;
    }

    setIsAssigning(true);
    try {
      await onAssign(
        report._id, 
        assignmentForm.state, 
        assignmentForm.constituency, 
        assignmentForm.parliamentaryConstituency
      );
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <tr>
      <td>
        <span className="report-id">{report.reportId}</span>
      </td>
      <td>
        <div className="location-info">
          <span className="location-name">{report.location.name}</span>
        </div>
      </td>
      <td>
        <div className="coordinates">
          <small>
            {report.location.coordinates.latitude.toFixed(6)}, {report.location.coordinates.longitude.toFixed(6)}
          </small>
        </div>
      </td>
      <td>
        <div className="date-info">
          <span>{new Date(report.createdAt).toLocaleDateString()}</span>
        </div>
      </td>
      <td>
        <div className="assignment-form">
          <select 
            value={assignmentForm.state} 
            onChange={(e) => handleStateChange(e.target.value)}
            className="form-select-small"
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          
          <select
            value={assignmentForm.constituency}
            onChange={(e) => setAssignmentForm(prev => ({ ...prev, constituency: e.target.value }))}
            className="form-select-small"
            disabled={!assignmentForm.state || loadingConstituencies}
          >
            <option value="">
              {loadingConstituencies ? 'Loading...' : 
               !assignmentForm.state ? 'Select State First' : 
               'Select Assembly Constituency'}
            </option>
            {constituencies.map(constituency => (
              <option key={constituency} value={constituency}>
                {constituency}
              </option>
            ))}
          </select>
          
          <select
            value={assignmentForm.parliamentaryConstituency}
            onChange={(e) => setAssignmentForm(prev => ({ ...prev, parliamentaryConstituency: e.target.value }))}
            className="form-select-small"
            disabled={!assignmentForm.state || loadingConstituencies}
          >
            <option value="">
              {loadingConstituencies ? 'Loading...' : 
               !assignmentForm.state ? 'Select State First' : 
               'Select Parliamentary Constituency (Optional)'}
            </option>
            {parliamentaryConstituencies.map(pc => (
              <option key={pc} value={pc}>
                {pc}
              </option>
            ))}
          </select>
          
          <button
            type="button"
            onClick={handleAssign}
            disabled={isAssigning || loadingConstituencies}
            className="btn btn-primary btn-sm"
          >
            <RiSaveLine />
            {isAssigning ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </td>
    </tr>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bugReports, setBugReports] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [assignmentStats, setAssignmentStats] = useState({});
  const [feedbacks, setFeedbacks] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({ title: '', message: '', type: 'system_announcement' });
  const [showNotificationDetailsModal, setShowNotificationDetailsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showReportDetailsModal, setShowReportDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
  const [rejectedReports, setRejectedReports] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectingReportId, setRejectingReportId] = useState(null);
  const [moderationView, setModerationView] = useState('pending'); // 'pending' | 'rejected'

  // Moderation enhancements (frontend-only)
  const [moderationFilters, setModerationFilters] = useState({
    search: '',
    severity: '',
    constituencyStatus: '', // '', 'pending_manual', 'assigned'
    dateFrom: '',
    dateTo: '',
    hasMedia: '', // '', 'true', 'false'
    minUpvotes: ''
  });
  const [debouncedModerationFilters, setDebouncedModerationFilters] = useState({
    search: '',
    severity: '',
    constituencyStatus: '',
    dateFrom: '',
    dateTo: '',
    hasMedia: '',
    minUpvotes: ''
  });
  const [moderationSort, setModerationSort] = useState({ sortBy: 'createdAt', order: 'desc' });
  const [pendingLimit, setPendingLimit] = useState(20);
  const [rejectedLimit, setRejectedLimit] = useState(20);
  const [includeAllPendingPages, setIncludeAllPendingPages] = useState(false);
  const [includeAllRejectedPages, setIncludeAllRejectedPages] = useState(false);
  const [pendingAllReports, setPendingAllReports] = useState([]);
  const [rejectedAllReports, setRejectedAllReports] = useState([]);
  const [pendingAllLoading, setPendingAllLoading] = useState(false);
  const [rejectedAllLoading, setRejectedAllLoading] = useState(false);
  const [selectedPendingIds, setSelectedPendingIds] = useState(new Set());
  const [selectedRejectedIds, setSelectedRejectedIds] = useState(new Set());
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [bulkRejectIds, setBulkRejectIds] = useState([]);

  // Quick assignment inside Moderation cards
  const [quickAssignOpenId, setQuickAssignOpenId] = useState(null);
  const [qaForm, setQaForm] = useState({ state: '', constituency: '', parliamentaryConstituency: '' });
  const [qaConstituencies, setQaConstituencies] = useState([]);
  const [qaParliamentary, setQaParliamentary] = useState([]);
  const [qaLoadingConstituencies, setQaLoadingConstituencies] = useState(false);
  const [qaAssigning, setQaAssigning] = useState(false);

  // Pagination states
  const [userPagination, setUserPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [reportPagination, setReportPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [notificationPagination, setNotificationPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [bugReportPagination, setBugReportPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [feedbackPagination, setFeedbackPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [pendingPagination, setPendingPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [rejectedPagination, setRejectedPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Filter states
  const [userFilters, setUserFilters] = useState({ search: '', role: '', status: '', provider: '' });
  const [reportFilters, setReportFilters] = useState({ status: '', city: '', reportId: '' });
  const [notificationFilters, setNotificationFilters] = useState({ type: '' });
  const [bugReportFilters, setBugReportFilters] = useState({ status: '', search: '' });
  const [feedbackFilters, setFeedbackFilters] = useState({ status: '', search: '' });

  // Debounced filter states for search inputs
  const [debouncedUserFilters, setDebouncedUserFilters] = useState({ search: '', role: '', status: '', provider: '' });
  const [debouncedReportFilters, setDebouncedReportFilters] = useState({ status: '', city: '', reportId: '' });
  const [debouncedBugReportFilters, setDebouncedBugReportFilters] = useState({ status: '', search: '' });
  const [debouncedFeedbackFilters, setDebouncedFeedbackFilters] = useState({ status: '', search: '' });

  // Add state for editing report fields
  const [editingReportId, setEditingReportId] = useState(null);
  const [editLocationName, setEditLocationName] = useState('');
  const [editSeverity, setEditSeverity] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'moderation') {
      if (moderationView === 'pending') {
        fetchPendingReports();
      } else {
        fetchRejectedReports();
      }
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    } else if (activeTab === 'bug-reports') {
      fetchBugReports();
    } else if (activeTab === 'feedback') {
      fetchFeedbacks();
    } else if (activeTab === 'assignments') {
      fetchPendingAssignments();
    }
  }, [activeTab, moderationView, userPagination.currentPage, reportPagination.currentPage, pendingPagination.currentPage, rejectedPagination.currentPage, notificationPagination.currentPage, bugReportPagination.currentPage, feedbackPagination.currentPage, pendingLimit, rejectedLimit, moderationSort.sortBy, moderationSort.order]);

  // Debounce search inputs to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserFilters(userFilters);
    }, 500);

    return () => clearTimeout(timer);
  }, [userFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedReportFilters(reportFilters);
    }, 500);

    return () => clearTimeout(timer);
  }, [reportFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBugReportFilters(bugReportFilters);
    }, 500);

    return () => clearTimeout(timer);
  }, [bugReportFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFeedbackFilters(feedbackFilters);
    }, 500);

    return () => clearTimeout(timer);
  }, [feedbackFilters]);

  // Watch for debounced filter changes and refetch data
  useEffect(() => {
    if (activeTab === 'users') {
      // Reset to first page when filters change
      setUserPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchUsers();
    }
  }, [debouncedUserFilters]);

  useEffect(() => {
    if (activeTab === 'reports') {
      // Reset to first page when filters change
      setReportPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchReports();
    }
  }, [debouncedReportFilters]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      // Reset to first page when filters change
      setNotificationPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchNotifications();
    }
  }, [notificationFilters]);

  useEffect(() => {
    if (activeTab === 'bug-reports') {
      // Reset to first page when filters change
      setBugReportPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchBugReports();
    }
  }, [debouncedBugReportFilters]);

  useEffect(() => {
    if (activeTab === 'feedback') {
      // Reset to first page when filters change
      setFeedbackPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchFeedbacks();
    }
  }, [debouncedFeedbackFilters]);

  // Debounce moderation filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedModerationFilters(moderationFilters);
    }, 400);
    return () => clearTimeout(timer);
  }, [moderationFilters]);

  const fetchStats = async (opts = {}) => {
    const silent = opts.silent === true;
    try {
      if (!silent) setLoading(true);
      const response = await adminAPI.getStats();
      if (response.success) {
        setStats(response.data);
      } else {
        toast.error('Failed to load dashboard statistics');
      }
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: userPagination.currentPage,
        limit: 10,
        ...debouncedUserFilters
      };
      const response = await adminAPI.getUsers(params);
      if (response.success) {
        setUsers(response.data.users);
        setUserPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: reportPagination.currentPage,
        limit: 10,
        ...debouncedReportFilters
      };
      const response = await adminAPI.getReports(params);
      if (response.success) {
        setReports(response.data.reports);
        setReportPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page: notificationPagination.currentPage,
        limit: 10,
        ...notificationFilters
      };
      const response = await adminAPI.getGroupedNotifications(params);
      
      if (response.success) {
        setNotifications(response.data.notifications);
        setNotificationPagination(response.data.pagination);
      } else {
        toast.error('Failed to load notifications');
      }
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: bugReportPagination.currentPage,
        limit: 10,
        ...debouncedBugReportFilters
      };
      const response = await adminAPI.getBugReports(params);
      if (response.success) {
        setBugReports(response.data.bugReports);
        setBugReportPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load bug reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = {
        page: feedbackPagination.currentPage,
        limit: 10,
        ...debouncedFeedbackFilters
      };
      const response = await adminAPI.getFeedback(params);
      if (response.success) {
        setFeedbacks(response.data.feedbacks);
        setFeedbackPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingAssignments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingAssignments();
      if (response.success) {
        setPendingAssignments(response.data.potholes);
        setAssignmentStats(response.data.stats);
      }
    } catch (error) {
      toast.error('Failed to load pending assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingReports = async (opts = {}) => {
    const silent = opts.silent === true;
    try {
      if (!silent) setLoading(true);
      const params = {
        page: pendingPagination.currentPage,
        limit: pendingLimit,
        sortBy: moderationSort.sortBy,
        order: moderationSort.order
      };
      const response = await adminAPI.getPendingReports(params);
      if (response.success) {
        setPendingReports(response.data.reports);
        setPendingPagination(response.data.pagination);
      } else {
        toast.error('Failed to load pending reports');
      }
    } catch (error) {
      toast.error('Failed to load pending reports');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchRejectedReports = async (opts = {}) => {
    const silent = opts.silent === true;
    try {
      if (!silent) setLoading(true);
      const params = {
        page: rejectedPagination.currentPage,
        limit: rejectedLimit,
        sortBy: moderationSort.sortBy,
        order: moderationSort.order
      };
      const response = await adminAPI.getRejectedReports(params);
      if (response.success) {
        setRejectedReports(response.data.reports);
        setRejectedPagination(response.data.pagination);
      } else {
        toast.error('Failed to load rejected reports');
      }
    } catch (error) {
      toast.error('Failed to load rejected reports');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch all pages for moderation (client-side filtering across complete set)
  const fetchAllPendingReports = async () => {
    try {
      setPendingAllLoading(true);
      const first = await adminAPI.getPendingReports({ page: 1, limit: 100, sortBy: moderationSort.sortBy, order: moderationSort.order });
      if (!first.success) throw new Error('Failed to load pending reports');
      const totalPages = first.data.pagination.totalPages || 1;
      let all = [...(first.data.reports || [])];
      for (let p = 2; p <= totalPages; p++) {
        const resp = await adminAPI.getPendingReports({ page: p, limit: 100, sortBy: moderationSort.sortBy, order: moderationSort.order });
        if (resp.success) all = all.concat(resp.data.reports || []);
      }
      setPendingAllReports(all);
    } catch (e) {
      toast.error('Failed to load all pending reports');
    } finally {
      setPendingAllLoading(false);
    }
  };

  const fetchAllRejectedReports = async () => {
    try {
      setRejectedAllLoading(true);
      const first = await adminAPI.getRejectedReports({ page: 1, limit: 100, sortBy: moderationSort.sortBy, order: moderationSort.order });
      if (!first.success) throw new Error('Failed to load rejected reports');
      const totalPages = first.data.pagination.totalPages || 1;
      let all = [...(first.data.reports || [])];
      for (let p = 2; p <= totalPages; p++) {
        const resp = await adminAPI.getRejectedReports({ page: p, limit: 100, sortBy: moderationSort.sortBy, order: moderationSort.order });
        if (resp.success) all = all.concat(resp.data.reports || []);
      }
      setRejectedAllReports(all);
    } catch (e) {
      toast.error('Failed to load all rejected reports');
    } finally {
      setRejectedAllLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'moderation') return;
    if (moderationView === 'pending' && includeAllPendingPages) {
      fetchAllPendingReports();
    }
    if (moderationView === 'rejected' && includeAllRejectedPages) {
      fetchAllRejectedReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, moderationView, includeAllPendingPages, includeAllRejectedPages, moderationSort.sortBy, moderationSort.order]);

  // Helpers for client-side filter/sort in moderation
  const normalize = (s) => (s || '').toString().toLowerCase();
  const withinDate = (d, from, to) => {
    const t = new Date(d).getTime();
    if (from) {
      const ft = new Date(from).getTime();
      if (t < ft) return false;
    }
    if (to) {
      const tt = new Date(to).getTime();
      if (t > tt) return false;
    }
    return true;
  };
  const filterModerationReports = (reports, filters) => {
    const f = { ...filters };
    const minUp = parseInt(f.minUpvotes || '0', 10) || 0;
    const hasMediaVal = f.hasMedia === '' ? null : f.hasMedia === 'true';
    return (reports || []).filter(r => {
      if (f.search) {
        const q = normalize(f.search);
        const hay = [r.location?.name, r.description, r.reportId, r.userId?.name, r.userId?.email].map(normalize).join(' ');
        if (!hay.includes(q)) return false;
      }
      if (f.severity && r.severity !== f.severity) return false;
      if (f.constituencyStatus) {
        if (f.constituencyStatus === 'assigned') {
          if (r.constituencyStatus === 'pending_manual') return false;
        } else if (r.constituencyStatus !== f.constituencyStatus) return false;
      }
      if (!withinDate(r.createdAt, f.dateFrom, f.dateTo)) return false;
      if (hasMediaVal !== null) {
        const hasMedia = (r.media?.length || 0) > 0;
        if (hasMedia !== hasMediaVal) return false;
      }
      if ((r.upvotes || 0) < minUp) return false;
      return true;
    });
  };
  const severityRank = (s) => ({ high: 3, medium: 2, low: 1 }[s] || 0);
  const sortModerationReports = (reports, sort) => {
    const { sortBy, order } = sort;
    const dir = order === 'asc' ? 1 : -1;
    return [...(reports || [])].sort((a, b) => {
      let av, bv;
      if (sortBy === 'createdAt') {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      } else if (sortBy === 'upvotes') {
        av = a.upvotes || 0;
        bv = b.upvotes || 0;
      } else if (sortBy === 'severity') {
        av = severityRank(a.severity);
        bv = severityRank(b.severity);
      } else if (sortBy === 'location') {
        av = normalize(a.location?.name);
        bv = normalize(b.location?.name);
      } else if (sortBy === 'reportId') {
        av = normalize(a.reportId);
        bv = normalize(b.reportId);
      } else {
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  };

  // Selection helpers for moderation
  const isPendingSelected = (id) => selectedPendingIds.has(id);
  const togglePendingSelected = (id) => {
    setSelectedPendingIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAllPendingVisible = (ids) => setSelectedPendingIds(new Set(ids));
  const clearPendingSelection = () => setSelectedPendingIds(new Set());
  const isRejectedSelected = (id) => selectedRejectedIds.has(id);
  const toggleRejectedSelected = (id) => {
    setSelectedRejectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAllRejectedVisible = (ids) => setSelectedRejectedIds(new Set(ids));
  const clearRejectedSelection = () => setSelectedRejectedIds(new Set());

  // Bulk actions
  const handleBulkApprovePending = async () => {
    const ids = Array.from(selectedPendingIds);
    if (ids.length === 0) return;
    let approved = 0, skipped = 0;
    for (const id of ids) {
      const source = includeAllPendingPages ? pendingAllReports : pendingReports;
      const r = source.find(x => x._id === id);
      if (r?.constituencyStatus === 'pending_manual') { skipped++; continue; }
      try { await adminAPI.approveReport(id); approved++; } catch (_) {}
    }
    if (approved) toast.success(`Approved ${approved} report(s)`);
    if (skipped) toast.error(`${skipped} skipped (assignment required)`);
    clearPendingSelection();
    fetchPendingReports({ silent: true });
    fetchStats({ silent: true });
    if (includeAllPendingPages) fetchAllPendingReports();
  };
  const handleBulkRejectPending = () => {
    const ids = Array.from(selectedPendingIds);
    if (ids.length === 0) return;
    setBulkRejectIds(ids);
    setShowRejectionModal(true);
  };

  // Quick assignment helpers for Moderation cards
  const openQuickAssign = async (report) => {
    setQuickAssignOpenId(report._id);
    setQaForm({ state: '', constituency: '', parliamentaryConstituency: '' });
    setQaConstituencies([]);
    setQaParliamentary([]);
  };
  const handleQaStateChange = async (state) => {
    setQaForm(prev => ({ ...prev, state, constituency: '', parliamentaryConstituency: '' }));
    if (!state) { setQaConstituencies([]); setQaParliamentary([]); return; }
    setQaLoadingConstituencies(true);
    try {
      const ac = await adminAPI.getConstituenciesByState(state);
      setQaConstituencies(ac.data || []);
      const pc = await adminAPI.getParliamentaryConstituenciesByState(state);
      setQaParliamentary(pc.data || []);
    } catch (e) {
      toast.error('Failed to load constituencies');
      setQaConstituencies([]);
      setQaParliamentary([]);
    } finally {
      setQaLoadingConstituencies(false);
    }
  };
  const submitQuickAssign = async (reportId) => {
    if (!qaForm.state || !qaForm.constituency) {
      toast.error('Please select state and constituency');
      return;
    }
    setQaAssigning(true);
    try {
      await handleAssignConstituency(reportId, qaForm.state, qaForm.constituency, qaForm.parliamentaryConstituency);
      setQuickAssignOpenId(null);
    } finally {
      setQaAssigning(false);
    }
  };

  // Keyboard shortcuts for Moderation (pending view)
  useEffect(() => {
    if (activeTab !== 'moderation' || moderationView !== 'pending') return;
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const source = includeAllPendingPages ? pendingAllReports : pendingReports;
      const list = filterModerationReports(source, debouncedModerationFilters);
      const display = sortModerationReports(list, moderationSort);
      if (display.length === 0) return;
      if (e.key === 'j') {
        setFocusedIndex(prev => Math.min(display.length - 1, (prev < 0 ? 0 : prev + 1)));
      } else if (e.key === 'k') {
        setFocusedIndex(prev => Math.max(0, (prev < 0 ? 0 : prev - 1)));
      } else if (e.key === 'x') {
        const idx = focusedIndex < 0 ? 0 : focusedIndex;
        const id = display[idx]?._id; if (id) togglePendingSelected(id);
      } else if (e.key === 'a') {
        const idx = focusedIndex < 0 ? 0 : focusedIndex;
        const id = display[idx]?._id; if (id) handleApproveReport(id);
      } else if (e.key === 'r') {
        const idx = focusedIndex < 0 ? 0 : focusedIndex;
        const id = display[idx]?._id; if (id) handleRejectReport(id);
      } else if (e.key === 'o') {
        const idx = focusedIndex < 0 ? 0 : focusedIndex;
        const rpt = display[idx]; if (rpt) { setSelectedReport(rpt); setShowReportDetailsModal(true); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, moderationView, pendingReports, pendingAllReports, includeAllPendingPages, debouncedModerationFilters, moderationSort, focusedIndex]);

  const handleUserRoleUpdate = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleUserStatusUpdate = async (userId, isActive) => {
    try {
      await adminAPI.updateUserStatus(userId, isActive);
      toast.success(`User account ${isActive ? 'reactivated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleUserDelete = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleReportStatusUpdate = async (reportId, newStatus) => {
    try {
      await adminAPI.updateReportStatus(reportId, newStatus);
      toast.success('Report status updated successfully');
      fetchReports();
    } catch (error) {
      toast.error('Failed to update report status');
    }
  };

  const handleReportDelete = async (reportId) => {
    try {
      await adminAPI.deleteReport(reportId);
      toast.success('Report deleted successfully');
      fetchReports();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const handleBugReportStatusUpdate = async (bugReportId, newStatus) => {
    try {
      await adminAPI.updateBugReportStatus(bugReportId, newStatus);
      toast.success('Bug report status updated successfully');
      fetchBugReports();
    } catch (error) {
      toast.error('Failed to update bug report status');
    }
  };

  const handleBugReportDelete = async (bugReportId) => {
    try {
      await adminAPI.deleteBugReport(bugReportId);
      toast.success('Bug report deleted successfully');
      fetchBugReports();
    } catch (error) {
      toast.error('Failed to delete bug report');
    }
  };

  const handleFeedbackStatusUpdate = async (feedbackId, newStatus) => {
    try {
      await adminAPI.updateFeedbackStatus(feedbackId, newStatus);
      toast.success('Feedback status updated successfully');
      fetchFeedbacks();
    } catch (error) {
      toast.error('Failed to update feedback status');
    }
  };

  const handleFeedbackDelete = async (feedbackId) => {
    try {
      await adminAPI.deleteFeedback(feedbackId);
      toast.success('Feedback deleted successfully');
      fetchFeedbacks();
    } catch (error) {
      toast.error('Failed to delete feedback');
    }
  };

  const handleNotificationDelete = async (notificationId) => {
    try {
      const response = await adminAPI.deleteNotification(notificationId);
      
      if (response.success) {
        toast.success(response.message || 'Notification deleted successfully');
        
        // Remove the deleted notification from the current state immediately
        setNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification._id !== notificationId)
        );
        
        // Refresh stats to ensure they're up to date
        await fetchStats();
        
        // Then fetch fresh notifications data to ensure consistency
        await fetchNotifications();
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleBroadcastNotification = async () => {
    try {
      await adminAPI.sendBroadcastNotification(broadcastData);
      toast.success('Broadcast notification sent successfully');
      setShowBroadcastModal(false);
      setBroadcastData({ title: '', message: '', type: 'system_announcement' });
    } catch (error) {
      toast.error('Failed to send broadcast notification');
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowNotificationDetailsModal(true);
  };

  const handleImageClick = (imageUrl, title) => {
    setSelectedImage({ url: imageUrl, title });
    setShowImageModal(true);
  };

  const handleApproveReport = async (reportId) => {
    // Find the report to check constituency assignment
    const source = includeAllPendingPages ? pendingAllReports : pendingReports;
    const report = source.find(r => r._id === reportId);
    
    // Check if constituency assignment is still pending
    if (report && report.constituencyStatus === 'pending_manual') {
      toast.error('Cannot approve report: Constituency assignment must be completed first. Please assign constituencies in the Assignments tab before approving.');
      return;
    }

    try {
      await adminAPI.approveReport(reportId);
      toast.success('Report approved successfully');
      // Optimistically update UI for snappier experience
      setPendingReports(prev => prev.filter(r => r._id !== reportId));
      setStats(prev => ({
        ...prev,
        reports: {
          ...(prev.reports || {}),
          pendingApproval: Math.max(0, ((prev.reports?.pendingApproval) || 1) - 1)
        }
      }));
      // Refresh data in background without global loading overlay
      fetchPendingReports({ silent: true });
      fetchStats({ silent: true });
      if (includeAllPendingPages) fetchAllPendingReports();
    } catch (error) {
      // Show the actual error message from the backend
      const errorMessage = error.response?.data?.message || error.message || 'Failed to approve report';
      toast.error(errorMessage);
    }
  };

  const handleRejectReport = async (reportId) => {
    setRejectingReportId(reportId);
    setShowRejectionModal(true);
  };

  const confirmRejectReport = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      toast.error('Please provide a rejection reason (at least 10 characters)');
      return;
    }

    try {
      if (bulkRejectIds.length > 0) {
        let rejected = 0;
        for (const id of bulkRejectIds) {
          try { await adminAPI.rejectReport(id, rejectionReason); rejected++; } catch (_) {}
        }
        toast.success(`Rejected ${rejected} report(s)`);
      } else if (rejectingReportId) {
        await adminAPI.rejectReport(rejectingReportId, rejectionReason);
        toast.success('Report rejected successfully');
      }
      setShowRejectionModal(false);
      setRejectionReason('');
      setRejectingReportId(null);
      setBulkRejectIds([]);
      fetchPendingReports();
      fetchStats();
      if (includeAllPendingPages) fetchAllPendingReports();
    } catch (error) {
      toast.error('Failed to reject report');
    }
  };

  const handleAssignConstituency = async (reportId, state, constituency, parliamentaryConstituency) => {
    try {
      await adminAPI.assignConstituency(reportId, {
        state,
        constituency,
        parliamentaryConstituency
      });
      toast.success('Constituency assigned successfully');
      fetchPendingAssignments();
      fetchStats();
    } catch (error) {
      toast.error('Failed to assign constituency');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: 'status-reported',
      acknowledged: 'status-acknowledged',
      in_progress: 'status-in-progress',
      resolved: 'status-resolved'
    };
    return colors[status] || colors.reported;
  };

  const getNotificationTypeColor = (type) => {
    const colors = {
      system_announcement: 'notification-system',
      pothole_status: 'notification-status',
      feedback_response: 'notification-feedback',
      bug_response: 'notification-bug',
      area_update: 'notification-area'
    };
    return colors[type] || colors.system_announcement;
  };

  const getBugReportStatusColor = (status) => {
    const colors = {
      pending: 'status-reported',
      in_progress: 'status-in-progress',
      resolved: 'status-resolved',
      closed: 'status-acknowledged'
    };
    return colors[status] || colors.pending;
  };

  const getFeedbackStatusColor = (status) => {
    const colors = {
      pending: 'status-reported',
      reviewed: 'status-acknowledged',
      actioned: 'status-in-progress',
      closed: 'status-resolved'
    };
    return colors[status] || colors.pending;
  };

  const handleEditClick = (report) => {
    setEditingReportId(report._id);
    setEditLocationName(report.location?.name || '');
    setEditSeverity(report.severity || '');
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setEditLocationName('');
    setEditSeverity('');
  };

  const handleSaveEdit = async (reportId) => {
    try {
      await adminAPI.updateReportDetails(reportId, {
        locationName: editLocationName,
        severity: editSeverity
      });
      toast.success('Report details updated successfully');
      setEditingReportId(null);
      setEditLocationName('');
      setEditSeverity('');
      fetchReports();
    } catch (error) {
      toast.error(error.message || 'Failed to update report details');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <ResponsiveContainer>
        <div className="admin-access-denied">
          <h1>Access Denied</h1>
          <p>You need administrator privileges to access this page.</p>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer>
      <div className="admin-dashboard">
        <div className="admin-header">
          <h1 className="admin-title">
            <RiDashboardLine className="admin-icon" />
            Admin Dashboard
          </h1>
          <p className="admin-subtitle">Manage users, reports, and notifications</p>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <RiBarChartLine className="tab-icon" />
            <span className="tab-text">Overview</span>
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <RiUserLine className="tab-icon" />
            <span className="tab-text">Users</span>
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <RiFileListLine className="tab-icon" />
            <span className="tab-text">Reports</span>
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            <RiShieldCheckLine className="tab-icon" />
            <span className="tab-text">Moderation</span>
            {stats.reports?.pendingApproval > 0 && (
              <span className="tab-badge">{stats.reports?.pendingApproval}</span>
            )}
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'bug-reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('bug-reports')}
          >
            <RiErrorWarningLine className="tab-icon" />
            <span className="tab-text">Bug Reports</span>
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <RiThumbUpLine className="tab-icon" />
            <span className="tab-text">Feedback</span>
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <RiNotificationLine className="tab-icon" />
            <span className="tab-text">Notifications</span>
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <RiMapLine className="tab-icon" />
            <span className="tab-text">Assignments</span>
            {assignmentStats.pending_manual > 0 && (
              <span className="tab-badge">{assignmentStats.pending_manual}</span>
            )}
          </button>
          <button
            type="button"
            className={`admin-tab ${activeTab === 'mp-mla-moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('mp-mla-moderation')}
          >
            <RiGovernmentLine className="tab-icon" />
            <span className="tab-text">MP/MLA Data</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="admin-content">
          {loading && <LoadingSpinner />}

          {/* Overview Tab */}
          {activeTab === 'overview' && !loading && (
            <div className="admin-overview">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon users">
                    <RiUserLine />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.users?.total || 0}</h3>
                    <p>Total Users</p>
                    <small>{stats.users?.newThisMonth || 0} new this month</small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon reports">
                    <RiFileListLine />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.reports?.total || 0}</h3>
                    <p>Total Reports</p>
                    <small>{stats.reports?.newThisMonth || 0} new this month</small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon notifications">
                    <RiNotificationLine />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.notifications?.total || 0}</h3>
                    <p>Total Notifications</p>
                    <small>{stats.notifications?.unread || 0} unread</small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon admins">
                    <RiShieldCheckLine />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.users?.admins || 0}</h3>
                    <p>Administrators</p>
                    <small>System admins</small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon pending">
                    <RiErrorWarningLine />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.reports?.pendingApproval || 0}</h3>
                    <p>Pending Approval</p>
                    <small>Reports awaiting moderation</small>
                  </div>
                </div>
              </div>

              <div className="overview-sections">
                <div className="overview-section">
                  <h3>Recent Reports</h3>
                  <div className="recent-list">
                    {stats.recentReports?.map((report, index) => (
                      <div key={index} className="recent-item">
                        <div className="recent-icon">
                          <RiMapPinLine />
                        </div>
                        <div className="recent-content">
                          <p className="recent-title">{report.location?.name}</p>
                          <p className="recent-subtitle">by {report.userId?.name}</p>
                          <small>{formatDate(report.createdAt)}</small>
                        </div>
                        <span className={`status-badge ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overview-section">
                  <h3>Recent Users</h3>
                  <div className="recent-list">
                    {stats.recentUsers?.map((user, index) => (
                      <div key={index} className="recent-item">
                        <div className="recent-icon">
                          <RiUserLine />
                        </div>
                        <div className="recent-content">
                          <p className="recent-title">{user.name}</p>
                          <p className="recent-subtitle">{user.email}</p>
                          <small>{formatDate(user.createdAt)}</small>
                        </div>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && !loading && (
            <div className="admin-users">
              <div className="section-header">
                <h2>User Management</h2>
                <div className="filters">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userFilters.search}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="filter-input"
                  />
                  <select
                    value={userFilters.role}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, role: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select
                    value={userFilters.status}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <select
                    value={userFilters.provider}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, provider: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Signup Methods</option>
                    <option value="google">Google</option>
                    <option value="local">Email/Password</option>
                  </select>
                  <AccessibleButton
                    onClick={() => setUserFilters({ search: '', role: '', status: '' , provider: '' })}
                    className="clear-filters-btn"
                    title="Clear all filters"
                  >
                    <RiCloseLine />
                    Clear
                  </AccessibleButton>
                </div>
              </div>

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Verified</th>
                      <th>Signup Method</th>
                      <th>Reports</th>
                      <th>Resolved</th>
                      <th>Upvotes</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? <RiCheckboxCircleLine style={{marginRight: 4}} /> : <RiCloseCircleLine style={{marginRight: 4}} />}
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
                            {user.isVerified ? <RiCheckboxCircleLine style={{marginRight: 4}} /> : <RiCloseCircleLine style={{marginRight: 4}} />}
                            {user.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td>
                          <span className={`provider-badge ${user.provider === 'google' ? 'google' : 'local'}`}>
                            {user.provider === 'google' ? 'Google' : 'Email/Password'}
                          </span>
                        </td>
                        <td>{user.stats?.totalReports || 0}</td>
                        <td>{user.stats?.resolvedReports || 0}</td>
                        <td>{user.stats?.totalUpvotes || 0}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            {user.role === 'user' ? (
                              <AccessibleButton
                                onClick={() => handleUserRoleUpdate(user._id, 'admin')}
                                className="action-btn promote"
                                title="Promote to Admin"
                              >
                                <RiShieldCheckLine />
                              </AccessibleButton>
                            ) : (
                              <AccessibleButton
                                onClick={() => handleUserRoleUpdate(user._id, 'user')}
                                className="action-btn demote"
                                title="Demote to User"
                              >
                                <RiUserSettingsLine />
                              </AccessibleButton>
                            )}
                            <AccessibleButton
                              onClick={() => handleUserStatusUpdate(user._id, !user.isActive)}
                              className={`action-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                              title={user.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.isActive ? <RiCloseLine /> : <RiAddLine />}
                            </AccessibleButton>
                            <AccessibleButton
                              onClick={() => {
                                setConfirmAction({
                                  type: 'deleteUser',
                                  id: user._id,
                                  name: user.name
                                });
                                setShowConfirmModal(true);
                              }}
                              className="action-btn delete"
                              title="Delete User"
                            >
                              <RiDeleteBinLine />
                            </AccessibleButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <AccessibleButton
                  onClick={() => setUserPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={userPagination.currentPage === 1}
                  className="pagination-btn"
                >
                  <RiArrowLeftLine />
                </AccessibleButton>
                <span className="pagination-info">
                  Page {userPagination.currentPage} of {userPagination.totalPages}
                </span>
                <AccessibleButton
                  onClick={() => setUserPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={userPagination.currentPage === userPagination.totalPages}
                  className="pagination-btn"
                >
                  <RiArrowRightLine />
                </AccessibleButton>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && !loading && (
            <div className="admin-reports">
              <div className="section-header">
                <h2>Report Management</h2>
                <div className="filters">
                  <select
                    value={reportFilters.status}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="reported">Reported</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search by city..."
                    value={reportFilters.city}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, city: e.target.value }))}
                    className="filter-input"
                  />
                  {/* New input for searching by Report ID */}
                  <input
                    type="text"
                    placeholder="Search by Report ID..."
                    value={reportFilters.reportId}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, reportId: e.target.value }))}
                    className="filter-input"
                  />
                  <AccessibleButton
                    onClick={() => setReportFilters({ status: '', city: '', reportId: '' })}
                    className="clear-filters-btn"
                    title="Clear all filters"
                  >
                    <RiCloseLine />
                    Clear
                  </AccessibleButton>
                </div>
              </div>

              <div className="reports-table">
                <table>
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Reporter</th>
                      <th>Status</th>
                      <th>Upvotes</th>
                      <th>Media</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report._id}>
                        <td>
                          {editingReportId === report._id ? (
                            <input
                              type="text"
                              value={editLocationName}
                              onChange={e => setEditLocationName(e.target.value)}
                              className="edit-input"
                              maxLength={200}
                            />
                          ) : (
                            report.location?.name
                          )}
                        </td>
                        <td>{report.userId?.name || 'Anonymous'}</td>
                        <td>
                          <span className={`status-badge ${getStatusColor(report.status)}`}>
                            {report.status === 'reported' && <RiErrorWarningLine style={{marginRight: 4}} />}
                            {report.status === 'acknowledged' && <RiCheckboxCircleLine style={{marginRight: 4}} />}
                            {report.status === 'in_progress' && <RiEditLine style={{marginRight: 4}} />}
                            {report.status === 'resolved' && <RiCheckboxCircleLine style={{marginRight: 4}} />}
                            {report.status}
                          </span>
                        </td>
                        <td>{report.upvotes || 0}</td>
                        <td>
                          <div className="media-count">
                            {report.media?.length || 0} files
                          </div>
                        </td>
                        <td>{formatDate(report.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            {editingReportId === report._id ? (
                              <>
                                <select
                                  value={editSeverity}
                                  onChange={e => setEditSeverity(e.target.value)}
                                  className="edit-select"
                                >
                                  <option value="">Select Severity</option>
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                  <option value="critical">Critical</option>
                                </select>
                                <AccessibleButton
                                  onClick={() => handleSaveEdit(report._id)}
                                  className="action-btn save"
                                  title="Save"
                                >
                                  Save
                                </AccessibleButton>
                                <AccessibleButton
                                  onClick={handleCancelEdit}
                                  className="action-btn cancel"
                                  title="Cancel"
                                >
                                  Cancel
                                </AccessibleButton>
                              </>
                            ) : (
                              <>
                                <span className={`severity-badge severity-${report.severity}`}>{report.severity}</span>
                                <AccessibleButton
                                  onClick={() => handleEditClick(report)}
                                  className="action-btn edit"
                                  title="Edit Location & Severity"
                                >
                                  <RiEditLine />
                                </AccessibleButton>
                                <AccessibleButton
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setShowReportDetailsModal(true);
                                  }}
                                  className="action-btn view"
                                  title="View Details"
                                >
                                  <RiEyeLine />
                                </AccessibleButton>
                                <select
                                  value={report.status}
                                  onChange={(e) => handleReportStatusUpdate(report._id, e.target.value)}
                                  className="status-select"
                                >
                                  <option value="reported">Reported</option>
                                  <option value="acknowledged">Acknowledged</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="resolved">Resolved</option>
                                </select>
                                <AccessibleButton
                                  onClick={() => {
                                    setConfirmAction({
                                      type: 'deleteReport',
                                      id: report._id,
                                      name: report.location?.name
                                    });
                                    setShowConfirmModal(true);
                                  }}
                                  className="action-btn delete"
                                  title="Delete Report"
                                >
                                  <RiDeleteBinLine />
                                </AccessibleButton>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <AccessibleButton
                  onClick={() => setReportPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={reportPagination.currentPage === 1}
                  className="pagination-btn"
                >
                  <RiArrowLeftLine />
                </AccessibleButton>
                <span className="pagination-info">
                  Page {reportPagination.currentPage} of {reportPagination.totalPages}
                </span>
                <AccessibleButton
                  onClick={() => setReportPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={reportPagination.currentPage === reportPagination.totalPages}
                  className="pagination-btn"
                >
                  <RiArrowRightLine />
                </AccessibleButton>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && !loading && (
            <div className="admin-notifications">
              <div className="section-header">
                <h2>Notification Management</h2>
                <div className="filters">
                  <select
                    value={notificationFilters.type}
                    onChange={(e) => setNotificationFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Types</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                  <AccessibleButton
                    onClick={() => setNotificationFilters({ type: '' })}
                    className="clear-filters-btn"
                    title="Clear all filters"
                  >
                    <RiCloseLine />
                    Clear
                  </AccessibleButton>
                  <AccessibleButton
                    onClick={() => setShowBroadcastModal(true)}
                    className="broadcast-btn"
                  >
                    <RiSendPlaneLine />
                    Send Broadcast
                  </AccessibleButton>
                </div>
              </div>

              <div className="notifications-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Message</th>
                      <th>Type</th>
                      <th>Recipients</th>
                      <th>Read Rate</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((notification) => (
                      <tr key={notification._id}>
                        <td>{notification.title}</td>
                        <td className="message-cell">{notification.message}</td>
                        <td>
                          <span className={`notification-badge ${getNotificationTypeColor(notification.type)}`}>
                            {notification.type.replace('_', ' ')}
                          </span>
                          {notification.isGrouped && (
                            <span className="broadcast-indicator">Broadcast</span>
                          )}
                        </td>
                        <td>
                          {notification.isGrouped ? (
                            <span className="recipients-count">
                              {notification.totalCount} users
                            </span>
                          ) : (
                            <span className="recipients-count">
                              {notification.user?.name || 'System'}
                            </span>
                          )}
                        </td>
                        <td>
                          {notification.isGrouped ? (
                            <div className="read-stats">
                              <span className="read-percentage">
                                {notification.readPercentage}%
                              </span>
                              <span className="read-breakdown">
                                {notification.readCount}/{notification.totalCount}
                              </span>
                            </div>
                          ) : (
                            <span className={`read-status ${notification.isRead ? 'read' : 'unread'}`}>
                              {notification.isRead ? 'Read' : 'Unread'}
                            </span>
                          )}
                        </td>
                        <td>{formatDate(notification.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <AccessibleButton
                              onClick={() => handleNotificationClick(notification)}
                              className="action-btn view"
                              title="View Details"
                            >
                              <RiEyeLine />
                            </AccessibleButton>
                            <AccessibleButton
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({
                                  type: 'deleteNotification',
                                  id: notification._id,
                                  name: notification.title
                                });
                                setShowConfirmModal(true);
                              }}
                              className="action-btn delete"
                              title="Delete Notification"
                            >
                              <RiDeleteBinLine />
                            </AccessibleButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <AccessibleButton
                  onClick={() => setNotificationPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={notificationPagination.currentPage === 1}
                  className="pagination-btn"
                >
                  <RiArrowLeftLine />
                </AccessibleButton>
                <span className="pagination-info">
                  Page {notificationPagination.currentPage} of {notificationPagination.totalPages}
                </span>
                <AccessibleButton
                  onClick={() => setNotificationPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={notificationPagination.currentPage === notificationPagination.totalPages}
                  className="pagination-btn"
                >
                  <RiArrowRightLine />
                </AccessibleButton>
              </div>
            </div>
          )}

          {/* Bug Reports Tab */}
          {activeTab === 'bug-reports' && !loading && (
            <div className="admin-bug-reports">
              <div className="section-header">
                <h2>Bug Report Management</h2>
                <div className="filters">
                  <select
                    value={bugReportFilters.status}
                    onChange={(e) => setBugReportFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search bug reports..."
                    value={bugReportFilters.search}
                    onChange={(e) => setBugReportFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="filter-input"
                  />
                  <AccessibleButton
                    onClick={() => setBugReportFilters({ status: '', search: '' })}
                    className="clear-filters-btn"
                    title="Clear all filters"
                  >
                    <RiCloseLine />
                    Clear
                  </AccessibleButton>
                </div>
              </div>

              <div className="bug-reports-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Reporter</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Image</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bugReports.map((bugReport) => (
                      <tr key={bugReport._id}>
                        <td>{bugReport.title}</td>
                        <td className="description-cell">{bugReport.description}</td>
                        <td>{bugReport.user?.name || 'Anonymous'}</td>
                        <td>{bugReport.user?.email || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${getBugReportStatusColor(bugReport.status)}`}>
                            {bugReport.status === 'pending' && <RiErrorWarningLine style={{marginRight: 4}} />}
                            {bugReport.status === 'in_progress' && <RiEditLine style={{marginRight: 4}} />}
                            {bugReport.status === 'resolved' && <RiCheckboxCircleLine style={{marginRight: 4}} />}
                            {bugReport.status === 'closed' && <RiCloseCircleLine style={{marginRight: 4}} />}
                            {bugReport.status}
                          </span>
                        </td>
                        <td>
                          {bugReport.imageUrl ? (
                            <div 
                              className="media-count clickable-image"
                              onClick={() => handleImageClick(bugReport.imageUrl, bugReport.title)}
                              title="Click to view image"
                            >
                              <RiImageLine />
                              View Image
                            </div>
                          ) : (
                            <span className="no-media">No Image</span>
                          )}
                        </td>
                        <td>{formatDate(bugReport.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <select
                              value={bugReport.status}
                              onChange={(e) => handleBugReportStatusUpdate(bugReport._id, e.target.value)}
                              className="status-select"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                            <AccessibleButton
                              onClick={() => {
                                setConfirmAction({
                                  type: 'deleteBugReport',
                                  id: bugReport._id,
                                  name: bugReport.title
                                });
                                setShowConfirmModal(true);
                              }}
                              className="action-btn delete"
                              title="Delete Bug Report"
                            >
                              <RiDeleteBinLine />
                            </AccessibleButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <AccessibleButton
                  onClick={() => setBugReportPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={bugReportPagination.currentPage === 1}
                  className="pagination-btn"
                >
                  <RiArrowLeftLine />
                </AccessibleButton>
                <span className="pagination-info">
                  Page {bugReportPagination.currentPage} of {bugReportPagination.totalPages}
                </span>
                <AccessibleButton
                  onClick={() => setBugReportPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={bugReportPagination.currentPage === bugReportPagination.totalPages}
                  className="pagination-btn"
                >
                  <RiArrowRightLine />
                </AccessibleButton>
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && !loading && (
            <div className="admin-feedback">
              <div className="section-header">
                <h2>Feedback Management</h2>
                <div className="filters">
                  <select
                    value={feedbackFilters.status}
                    onChange={(e) => setFeedbackFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="actioned">Actioned</option>
                    <option value="closed">Closed</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search feedback..."
                    value={feedbackFilters.search}
                    onChange={(e) => setFeedbackFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="filter-input"
                  />
                  <AccessibleButton
                    onClick={() => setFeedbackFilters({ status: '', search: '' })}
                    className="clear-filters-btn"
                    title="Clear all filters"
                  >
                    <RiCloseLine />
                    Clear
                  </AccessibleButton>
                </div>
              </div>

              <div className="feedback-table">
                <table>
                  <thead>
                    <tr>
                      <th>Message</th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Image</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((feedback) => (
                      <tr key={feedback._id}>
                        <td className="message-cell">{feedback.message}</td>
                        <td>{feedback.user?.name || 'Anonymous'}</td>
                        <td>{feedback.user?.email || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${getFeedbackStatusColor(feedback.status)}`}>
                            {feedback.status === 'pending' && <RiErrorWarningLine style={{marginRight: 4}} />}
                            {feedback.status === 'reviewed' && <RiCheckboxCircleLine style={{marginRight: 4}} />}
                            {feedback.status === 'actioned' && <RiEditLine style={{marginRight: 4}} />}
                            {feedback.status === 'closed' && <RiCloseCircleLine style={{marginRight: 4}} />}
                            {feedback.status}
                          </span>
                        </td>
                        <td>
                          {feedback.imageUrl ? (
                            <div 
                              className="media-count clickable-image"
                              onClick={() => handleImageClick(feedback.imageUrl, feedback.message.substring(0, 30) + '...')}
                              title="Click to view image"
                            >
                              <RiImageLine />
                              View Image
                            </div>
                          ) : (
                            <span className="no-media">No Image</span>
                          )}
                        </td>
                        <td>{formatDate(feedback.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <select
                              value={feedback.status}
                              onChange={(e) => handleFeedbackStatusUpdate(feedback._id, e.target.value)}
                              className="status-select"
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="actioned">Actioned</option>
                              <option value="closed">Closed</option>
                            </select>
                            <AccessibleButton
                              onClick={() => {
                                setConfirmAction({
                                  type: 'deleteFeedback',
                                  id: feedback._id,
                                  name: feedback.message.substring(0, 50) + '...'
                                });
                                setShowConfirmModal(true);
                              }}
                              className="action-btn delete"
                              title="Delete Feedback"
                            >
                              <RiDeleteBinLine />
                            </AccessibleButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <AccessibleButton
                  onClick={() => setFeedbackPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={feedbackPagination.currentPage === 1}
                  className="pagination-btn"
                >
                  <RiArrowLeftLine />
                </AccessibleButton>
                <span className="pagination-info">
                  Page {feedbackPagination.currentPage} of {feedbackPagination.totalPages}
                </span>
                <AccessibleButton
                  onClick={() => setFeedbackPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={feedbackPagination.currentPage === feedbackPagination.totalPages}
                  className="pagination-btn"
                >
                  <RiArrowRightLine />
                </AccessibleButton>
              </div>
            </div>
          )}

          {/* Moderation Tab */}
          {activeTab === 'moderation' && !loading && (
            <div className="admin-moderation">
              <div className="section-header">
                <h2>Report Moderation</h2>
                <p className="section-description">
                  Review and approve/reject newly submitted pothole reports
                </p>
              </div>

              {/* Moderation view toggle */}
              <div className="admin-tabs" style={{ marginBottom: 16 }}>
                <button
                  className={`admin-tab ${moderationView === 'pending' ? 'active' : ''}`}
                  onClick={() => {
                    setModerationView('pending');
                    setPendingPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                >
                  Pending
                </button>
                <button
                  className={`admin-tab ${moderationView === 'rejected' ? 'active' : ''}`}
                  onClick={() => {
                    setModerationView('rejected');
                    setRejectedPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                >
                  Rejected
                </button>
              </div>

              {/* Moderation filters & controls */}
              <div className="filters" style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search: location, description, ID, user"
                  value={moderationFilters.search}
                  onChange={(e) => setModerationFilters(prev => ({ ...prev, search: e.target.value }))}
                />
                <select
                  className="filter-select"
                  value={moderationFilters.severity}
                  onChange={(e) => setModerationFilters(prev => ({ ...prev, severity: e.target.value }))}
                >
                  <option value="">All severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  className="filter-select"
                  value={moderationFilters.constituencyStatus}
                  onChange={(e) => setModerationFilters(prev => ({ ...prev, constituencyStatus: e.target.value }))}
                >
                  <option value="">All assignment states</option>
                  <option value="pending_manual">Needs Assignment</option>
                  <option value="assigned">Assigned</option>
                </select>
                <select
                  className="filter-select"
                  value={moderationFilters.hasMedia}
                  onChange={(e) => setModerationFilters(prev => ({ ...prev, hasMedia: e.target.value }))}
                >
                  <option value="">All media</option>
                  <option value="true">With media</option>
                  <option value="false">No media</option>
                </select>
                <input
                  type="number"
                  min="0"
                  className="filter-input"
                  placeholder="Min upvotes"
                  value={moderationFilters.minUpvotes}
                  onChange={(e) => setModerationFilters(prev => ({ ...prev, minUpvotes: e.target.value }))}
                />
                <input
                  type="date"
                  className="filter-input"
                  value={moderationFilters.dateFrom}
                  onChange={(e) => setModerationFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
                <input
                  type="date"
                  className="filter-input"
                  value={moderationFilters.dateTo}
                  onChange={(e) => setModerationFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
                <select
                  className="filter-select"
                  value={moderationSort.sortBy}
                  onChange={(e) => setModerationSort(prev => ({ ...prev, sortBy: e.target.value }))}
                >
                  <option value="createdAt">Newest</option>
                  <option value="upvotes">Upvotes</option>
                  <option value="severity">Severity</option>
                  <option value="location">Location</option>
                  <option value="reportId">Report ID</option>
                </select>
                <select
                  className="filter-select"
                  value={moderationSort.order}
                  onChange={(e) => setModerationSort(prev => ({ ...prev, order: e.target.value }))}
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
                {moderationView === 'pending' ? (
                  <select
                    className="filter-select"
                    value={pendingLimit}
                    onChange={(e) => setPendingLimit(parseInt(e.target.value, 10))}
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                ) : (
                  <select
                    className="filter-select"
                    value={rejectedLimit}
                    onChange={(e) => setRejectedLimit(parseInt(e.target.value, 10))}
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                )}
                <label className="filter-toggle">
                  <input
                    type="checkbox"
                    checked={moderationView === 'pending' ? includeAllPendingPages : includeAllRejectedPages}
                    onChange={(e) => {
                      if (moderationView === 'pending') setIncludeAllPendingPages(e.target.checked);
                      else setIncludeAllRejectedPages(e.target.checked);
                    }}
                  />
                  <span>Search across all pages</span>
                </label>
                <AccessibleButton
                  onClick={() => {
                    setModerationFilters({ search: '', severity: '', constituencyStatus: '', dateFrom: '', dateTo: '', hasMedia: '', minUpvotes: '' });
                  }}
                  className="clear-filters-btn"
                  title="Clear all filters"
                >
                  <RiCloseLine />
                  Clear
                </AccessibleButton>
              </div>

              {/* Bulk actions bar for Pending */}
              {moderationView === 'pending' && (selectedPendingIds.size > 0) && (
                <div className="bulk-actions-bar">
                  <span>{selectedPendingIds.size} selected</span>
                  <div className="bulk-actions">
                    <AccessibleButton className="btn btn-primary" onClick={handleBulkApprovePending}>
                      <RiCheckboxCircleLine /> Approve selected
                    </AccessibleButton>
                    <AccessibleButton className="btn btn-danger" onClick={handleBulkRejectPending}>
                      <RiCloseCircleLine /> Reject selected
                    </AccessibleButton>
                    <AccessibleButton className="btn" onClick={() => setSelectedPendingIds(new Set())}>
                      <RiCloseLine /> Clear
                    </AccessibleButton>
                  </div>
                </div>
              )}

              {moderationView === 'pending' ? (
                <>
                  {(() => {
                    const base = includeAllPendingPages ? pendingAllReports : pendingReports;
                    const filtered = filterModerationReports(base, debouncedModerationFilters);
                    const display = sortModerationReports(filtered, moderationSort);
                    const visibleIds = display.map(r => r._id);

                    return (
                      <>
                        {(includeAllPendingPages && pendingAllLoading) && (
                          <div className="loading-inline">Loading all pending reports...</div>
                        )}
                        {display.length === 0 ? (
                          <div className="no-data">
                            <RiCheckboxCircleLine className="no-data-icon" />
                            <p>No pending reports to moderate</p>
                          </div>
                        ) : (
                          <div className="moderation-grid">
                            {display.map((report, idx) => (
                              <div key={report._id} className={`moderation-card ${focusedIndex === idx ? 'focused' : ''}`}>
                                <div className="card-select">
                                  <input
                                    type="checkbox"
                                    checked={isPendingSelected(report._id)}
                                    onChange={() => togglePendingSelected(report._id)}
                                    aria-label="Select report"
                                  />
                                </div>
                                <div className="moderation-header">
                                  <h4>{report.location?.name}</h4>
                                  <span className={`severity-badge severity-${report.severity}`}>
                                    {report.severity}
                                  </span>
                                </div>

                                <div className="moderation-info">
                                  <p><strong>Reporter:</strong> {report.userId?.name || 'Anonymous'}</p>
                                  <p><strong>Date:</strong> {formatDate(report.createdAt)}</p>
                                  <p><strong>Report ID:</strong> {report.reportId}</p>
                                  {report.description && (
                                    <p><strong>Description:</strong> {report.description}</p>
                                  )}
                                </div>

                                <div className="moderation-media">
                                  {(report.media || []).slice(0,1).map((media, index) => (
                                      <div key={index} className="media-thumbnail">
                                      {media.type === 'image' ? (
                                        <img
                                          src={media.url}
                                          alt={`Report ${index + 1}`}
                                          loading="lazy"
                                          decoding="async"
                                          onClick={() => handleImageClick(media.url, `${report.location?.name} - Image ${index + 1}`)}
                                        />
                                      ) : (
                                        <div className="video-placeholder">
                                          <RiVideoLine />
                                          <span>Video</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {report.constituencyStatus === 'pending_manual' && (
                                  <div className="assignment-warning">
                                    <RiAlertLine />
                                    <span>Constituency assignment required before approval</span>
                                    {quickAssignOpenId !== report._id ? (
                                      <AccessibleButton className="link-btn" onClick={() => openQuickAssign(report)}>Assign now</AccessibleButton>
                                    ) : null}
                                  </div>
                                )}
                                {quickAssignOpenId === report._id && (
                                  <div className="quick-assign">
                                    <div className="qa-row">
                                      <select className="form-select-small" value={qaForm.state} onChange={(e) => handleQaStateChange(e.target.value)}>
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                      <select className="form-select-small" value={qaForm.constituency} disabled={!qaForm.state || qaLoadingConstituencies} onChange={(e) => setQaForm(prev => ({ ...prev, constituency: e.target.value }))}>
                                        <option value="">{qaLoadingConstituencies ? 'Loading...' : (!qaForm.state ? 'Select State First' : 'Select Assembly Constituency')}</option>
                                        {qaConstituencies.map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                      <select className="form-select-small" value={qaForm.parliamentaryConstituency} disabled={!qaForm.state || qaLoadingConstituencies} onChange={(e) => setQaForm(prev => ({ ...prev, parliamentaryConstituency: e.target.value }))}>
                                        <option value="">{qaLoadingConstituencies ? 'Loading...' : (!qaForm.state ? 'Select State First' : 'Select Parliamentary Constituency (Optional)')}</option>
                                        {qaParliamentary.map(pc => <option key={pc} value={pc}>{pc}</option>)}
                                      </select>
                                    </div>
                                    <div className="qa-actions">
                                      <AccessibleButton className="btn btn-secondary" onClick={() => setQuickAssignOpenId(null)}>Cancel</AccessibleButton>
                                      <AccessibleButton className="btn btn-primary" disabled={qaAssigning || qaLoadingConstituencies || !qaForm.state || !qaForm.constituency} onClick={() => submitQuickAssign(report._id)}>
                                        <RiSaveLine /> {qaAssigning ? 'Assigning...' : 'Save Assignment'}
                                      </AccessibleButton>
                                    </div>
                                  </div>
                                )}

                                <div className="moderation-actions">
                                  <AccessibleButton
                                    onClick={() => handleApproveReport(report._id)}
                                    className={`action-btn approve ${
                                      report.constituencyStatus === 'pending_manual' ? 'disabled' : ''
                                    }`}
                                    title={
                                      report.constituencyStatus === 'pending_manual'
                                      ? 'Complete constituency assignment first' : 'Approve report'
                                    }
                                    disabled={report.constituencyStatus === 'pending_manual'}
                                  >
                                    <RiCheckboxCircleLine />
                                    Approve
                                  </AccessibleButton>
                                  <AccessibleButton
                                    onClick={() => handleRejectReport(report._id)}
                                    className="action-btn reject"
                                    title="Reject report"
                                  >
                                    <RiCloseCircleLine />
                                    Reject
                                  </AccessibleButton>
                                  <AccessibleButton
                                    onClick={() => {
                                      setSelectedReport(report);
                                      setShowReportDetailsModal(true);
                                    }}
                                    className="action-btn view"
                                    title="View full details"
                                  >
                                    <RiEyeLine />
                                    Details
                                  </AccessibleButton>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!includeAllPendingPages && (base?.length > 0) && (
                          <div className="pagination">
                            <AccessibleButton
                              onClick={() => setPendingPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                              disabled={pendingPagination.currentPage === 1}
                              className="pagination-btn"
                            >
                              <RiArrowLeftLine />
                            </AccessibleButton>
                            <span className="pagination-info">
                              Page {pendingPagination.currentPage} of {pendingPagination.totalPages}
                            </span>
                            <AccessibleButton
                              onClick={() => setPendingPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                              disabled={pendingPagination.currentPage === pendingPagination.totalPages}
                              className="pagination-btn"
                            >
                              <RiArrowRightLine />
                            </AccessibleButton>
                            <AccessibleButton
                              onClick={() => selectAllPendingVisible(visibleIds)}
                              className="filter-btn"
                              title="Select all visible"
                            >
                              Select all
                            </AccessibleButton>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  {(() => {
                    const base = includeAllRejectedPages ? rejectedAllReports : rejectedReports;
                    const filtered = filterModerationReports(base, debouncedModerationFilters);
                    const display = sortModerationReports(filtered, moderationSort);
                    const visibleIds = display.map(r => r._id);
                    return (
                      <>
                        {(includeAllRejectedPages && rejectedAllLoading) && (
                          <div className="loading-inline">Loading all rejected reports...</div>
                        )}
                        {display.length === 0 ? (
                          <div className="no-data">
                            <RiCloseCircleLine className="no-data-icon" />
                            <p>No rejected reports</p>
                          </div>
                        ) : (
                          <div className="moderation-grid">
                            {display.map((report) => (
                              <div key={report._id} className="moderation-card">
                                <div className="card-select">
                                  <input
                                    type="checkbox"
                                    checked={isRejectedSelected(report._id)}
                                    onChange={() => toggleRejectedSelected(report._id)}
                                    aria-label="Select report"
                                  />
                                </div>
                                <div className="moderation-header">
                                  <h4>{report.location?.name}</h4>
                                  <span className={`severity-badge severity-${report.severity}`}>
                                    {report.severity}
                                  </span>
                                </div>

                                <div className="moderation-info">
                                  <p><strong>Reporter:</strong> {report.userId?.name || 'Anonymous'}</p>
                                  <p><strong>Date:</strong> {formatDate(report.createdAt)}</p>
                                  <p><strong>Report ID:</strong> {report.reportId}</p>
                                  {report.description && (
                                    <p><strong>Description:</strong> {report.description}</p>
                                  )}
                                  {report.rejectionReason && (
                                    <p><strong>Rejection Reason:</strong> {report.rejectionReason}</p>
                                  )}
                                </div>

                                <div className="moderation-media">
                                  {(report.media || []).slice(0,1).map((media, index) => (
                                      <div key={index} className="media-thumbnail">
                                      {media.type === 'image' ? (
                                        <img
                                          src={media.url}
                                          alt={`Report ${index + 1}`}
                                          loading="lazy"
                                          decoding="async"
                                          onClick={() => handleImageClick(media.url, `${report.location?.name} - Image ${index + 1}`)}
                                        />
                                      ) : (
                                        <div className="video-placeholder">
                                          <RiVideoLine />
                                          <span>Video</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="moderation-actions">
                                  <AccessibleButton
                                    onClick={() => handleApproveReport(report._id)}
                                    className="action-btn approve"
                                    title="Approve report"
                                  >
                                    <RiCheckboxCircleLine />
                                    Approve
                                  </AccessibleButton>
                                  <AccessibleButton
                                    onClick={() => {
                                      setSelectedReport(report);
                                      setShowReportDetailsModal(true);
                                    }}
                                    className="action-btn view"
                                    title="View full details"
                                  >
                                    <RiEyeLine />
                                    Details
                                  </AccessibleButton>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!includeAllRejectedPages && (base?.length > 0) && (
                          <div className="pagination">
                            <AccessibleButton
                              onClick={() => setRejectedPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                              disabled={rejectedPagination.currentPage === 1}
                              className="pagination-btn"
                            >
                              <RiArrowLeftLine />
                            </AccessibleButton>
                            <span className="pagination-info">
                              Page {rejectedPagination.currentPage} of {rejectedPagination.totalPages}
                            </span>
                            <AccessibleButton
                              onClick={() => setRejectedPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                              disabled={rejectedPagination.currentPage === rejectedPagination.totalPages}
                              className="pagination-btn"
                            >
                              <RiArrowRightLine />
                            </AccessibleButton>
                            <AccessibleButton
                              onClick={() => selectAllRejectedVisible(visibleIds)}
                              className="filter-btn"
                              title="Select all visible"
                            >
                              Select all
                            </AccessibleButton>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* Constituency Assignments Tab */}
          {activeTab === 'assignments' && !loading && (
            <div className="admin-assignments">
              <div className="section-header">
                <h2>Constituency Assignments</h2>
                <p>Manage pothole reports that need constituency assignment</p>
              </div>

              {/* Assignment Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon pending">
                    <RiMapLine />
                  </div>
                  <div className="stat-content">
                    <h3>{assignmentStats.pending_manual || 0}</h3>
                    <p>Pending Assignment</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon success">
                    <RiCheckboxCircleLine />
                  </div>
                  <div className="stat-content">
                    <h3>{assignmentStats.auto_assigned || 0}</h3>
                    <p>Auto Assigned</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon manual">
                    <RiUserLine />
                  </div>
                  <div className="stat-content">
                    <h3>{assignmentStats.manually_assigned || 0}</h3>
                    <p>Manually Assigned</p>
                  </div>
                </div>
              </div>

              {/* Pending Assignments Table */}
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>Location</th>
                      <th>Coordinates</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAssignments.map((report) => (
                      <PendingAssignmentRow 
                        key={report._id} 
                        report={report} 
                        onAssign={handleAssignConstituency}
                      />
                    ))}
                  </tbody>
                </table>
                
                {pendingAssignments.length === 0 && (
                  <div className="no-data">
                    <RiCheckboxCircleLine className="no-data-icon" />
                    <h3>All Caught Up!</h3>
                    <p>No constituency assignments pending at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MP/MLA Moderation Tab */}
          {activeTab === 'mp-mla-moderation' && !loading && (
            <MPMLAModeration />
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && confirmAction && (
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false);
              setConfirmAction(null);
            }}
            onConfirm={async () => {
              if (confirmAction.type === 'deleteUser') {
                await handleUserDelete(confirmAction.id);
              } else if (confirmAction.type === 'deleteReport') {
                await handleReportDelete(confirmAction.id);
              } else if (confirmAction.type === 'deleteNotification') {
                await handleNotificationDelete(confirmAction.id);
              } else if (confirmAction.type === 'deleteBugReport') {
                await handleBugReportDelete(confirmAction.id);
              } else if (confirmAction.type === 'deleteFeedback') {
                await handleFeedbackDelete(confirmAction.id);
              }
              setShowConfirmModal(false);
              setConfirmAction(null);
            }}
            title={`Delete ${confirmAction.type === 'deleteUser' ? 'User' : confirmAction.type === 'deleteReport' ? 'Report' : confirmAction.type === 'deleteNotification' ? 'Notification' : confirmAction.type === 'deleteBugReport' ? 'Bug Report' : 'Feedback'}`}
            message={`Are you sure you want to delete ${confirmAction.name}? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
          />
        )}

        {/* Broadcast Modal */}
        {showBroadcastModal && (
          <div className="modal-overlay">
            <div className="modal-content broadcast-modal">
              <div className="modal-header">
                <h3>Send Broadcast Notification</h3>
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="modal-close"
                >
                  <RiCloseLine />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={broadcastData.title}
                    onChange={(e) => setBroadcastData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    value={broadcastData.message}
                    onChange={(
                      e) => setBroadcastData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Notification message"
                    className="form-textarea"
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={broadcastData.type}
                    onChange={(e) => setBroadcastData(prev => ({ ...prev, type: e.target.value }))}
                    className="form-select"
                  >
                    <option value="system_announcement">System Announcement</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <AccessibleButton
                  onClick={() => setShowBroadcastModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </AccessibleButton>
                <AccessibleButton
                  onClick={handleBroadcastNotification}
                  className="btn btn-primary"
                  disabled={!broadcastData.title || !broadcastData.message}
                >
                  <RiSendPlaneLine />
                  Send Broadcast
                </AccessibleButton>
              </div>
            </div>
          </div>
        )}

        {/* Notification Details Modal */}
        {showNotificationDetailsModal && selectedNotification && (
          <NotificationDetailsModal
            isOpen={showNotificationDetailsModal}
            onClose={() => setShowNotificationDetailsModal(false)}
            notificationId={selectedNotification._id}
            notification={selectedNotification}
          />
        )}

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
            <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedImage.title}</h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="modal-close"
                >
                  <RiCloseLine />
                </button>
              </div>
              <div className="modal-body">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.title}
                  className="modal-image"
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Report Details Modal */}
        {showReportDetailsModal && selectedReport && (
          <DetailsModal
            isOpen={showReportDetailsModal}
            onClose={() => setShowReportDetailsModal(false)}
            report={selectedReport}
            onAdminCommentUpdate={async (comment) => {
              const result = await adminAPI.updateReportComment(selectedReport._id, comment);
              setSelectedReport(prev => ({ ...prev, adminComment: comment, adminCommentAt: result.data.adminCommentAt }));
              setReports(prev => prev.map(r => r._id === selectedReport._id ? { ...r, adminComment: comment, adminCommentAt: result.data.adminCommentAt } : r));
            }}
          />
        )}

        {/* Rejection Modal */}
        {showRejectionModal && (
          <div className="modal-overlay">
            <div className="modal-content rejection-modal">
              <div className="modal-header">
                <h3>Reject Report</h3>
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                    setRejectingReportId(null);
                  }}
                  className="modal-close"
                >
                  <RiCloseLine />
                </button>
              </div>
              <div className="modal-body">
                <p>Please provide a reason for rejecting this report:</p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason (minimum 10 characters)..."
                  className="rejection-textarea"
                  rows={4}
                  maxLength={500}
                />
                <small className="char-count">
                  {rejectionReason.length}/500 characters
                </small>
              </div>
              <div className="modal-actions">
                <AccessibleButton
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                    setRejectingReportId(null);
                    setBulkRejectIds([]);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </AccessibleButton>
                <AccessibleButton
                  onClick={confirmRejectReport}
                  className="btn-danger"
                  disabled={rejectionReason.trim().length < 10}
                >
                  Reject Report
                </AccessibleButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveContainer>
  );
};

export default AdminDashboard; 
