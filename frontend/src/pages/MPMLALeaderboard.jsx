import React, { useEffect, useState } from 'react';
import { RiTrophyLine, RiUserLine, RiGovernmentLine, RiMapPinLine, RiFilterLine } from 'react-icons/ri';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/pages/leaderboard.css';
import api, { potholeAPI } from '../services/api';

const statusLabels = {
  reported: 'Pending',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const sortOptions = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'count_desc', label: 'Total (High-Low)' },
  { value: 'count_asc', label: 'Total (Low-High)' },
];

const statusFilterOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'reported', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const MPMLALeaderboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('count_desc');
  const [mpFilter, setMpFilter] = useState('');
  const [mlaFilter, setMlaFilter] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/potholes/leaderboard');
        const json = res.data;
        if (json?.success) {
          setData(json.data);
        } else {
          setError(json?.message || 'Failed to fetch leaderboard');
        }
      } catch (err) {
        setError('Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
    // Fetch all states for filter (handle network errors gracefully)
    potholeAPI
      .getConstituencies()
      .then((statesArr) => {
        setStates(statesArr.map((s) => (typeof s === 'string' ? s : s.state)));
      })
      .catch((err) => {
        console.warn('Failed to fetch states list', err);
        // Leave states empty; UI will still work with "All States"
      });
  }, []);

  useEffect(() => {
    let filtered = [...data];
    if (selectedState) {
      filtered = filtered.filter(row => row.state === selectedState);
    }
    if (selectedStatus) {
      filtered = filtered.filter(row => {
        const statusMap = Object.fromEntries(row.statusCounts.map(s => [s.status, s.count]));
        return statusMap[selectedStatus] > 0;
      });
    }
    if (mpFilter.trim()) {
      filtered = filtered.filter(row => (row.mp || '').toLowerCase().includes(mpFilter.trim().toLowerCase()));
    }
    if (mlaFilter.trim()) {
      filtered = filtered.filter(row => (row.mla || '').toLowerCase().includes(mlaFilter.trim().toLowerCase()));
    }
    // Sorting
    if (sortBy === 'name_asc') {
      filtered.sort((a, b) => a.constituency.localeCompare(b.constituency));
    } else if (sortBy === 'name_desc') {
      filtered.sort((a, b) => b.constituency.localeCompare(a.constituency));
    } else if (sortBy === 'count_desc') {
      filtered.sort((a, b) => b.total - a.total);
    } else if (sortBy === 'count_asc') {
      filtered.sort((a, b) => a.total - b.total);
    }
    setFilteredData(filtered);
  }, [data, selectedState, selectedStatus, sortBy, mpFilter, mlaFilter]);

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">
        <RiTrophyLine className="leaderboard-title-icon" /> MP/MLA Leaderboard
      </h1>
      <div className="leaderboard-filters">
        <label>
          <RiFilterLine /> State:
          <select value={selectedState} onChange={e => setSelectedState(e.target.value)}>
            <option value="">All States</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </label>
        <label>
          <RiFilterLine /> Status:
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            {statusFilterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label>
          <RiFilterLine /> Sort by:
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label>
          <RiFilterLine /> MP Name:
          <input
            type="text"
            value={mpFilter}
            onChange={e => setMpFilter(e.target.value)}
            placeholder="Search MP name"
            className="leaderboard-text-input"
          />
        </label>
        <label>
          <RiFilterLine /> MLA Name:
          <input
            type="text"
            value={mlaFilter}
            onChange={e => setMlaFilter(e.target.value)}
            placeholder="Search MLA name"
            className="leaderboard-text-input"
          />
        </label>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="leaderboard-error">{error}</div>
      ) : (
        <div className="leaderboard-table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th><RiMapPinLine /> State</th>
                <th><RiMapPinLine /> Constituency</th>
                <th><RiGovernmentLine /> MP</th>
                <th><RiUserLine /> MLA</th>
                <th>Total</th>
                <th>Pending</th>
                <th>In Progress</th>
                <th>Resolved</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => {
                const statusMap = Object.fromEntries(row.statusCounts.map(s => [s.status, s.count]));
                return (
                  <tr key={idx}>
                    <td>{row.state}</td>
                    <td>{row.constituency}</td>
                    <td>{row.mp || '-'}</td>
                    <td>{row.mla || '-'}</td>
                    <td>{row.total}</td>
                    <td>{statusMap.reported || 0}</td>
                    <td>{statusMap.in_progress || 0}</td>
                    <td>{statusMap.resolved || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MPMLALeaderboard; 
