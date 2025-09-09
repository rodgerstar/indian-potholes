import React, { useState, useEffect } from 'react';
import { potholeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import HeatmapMap from '../components/HeatmapMap';
import { 
  RiMapPinLine, 
  RiFilterLine, 
  RiRefreshLine,
  RiEyeLine,
  RiEyeOffLine,
  RiSettings3Line,
  RiInformationLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';

const HeatmapView = () => {
  const [potholes, setPotholes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    city: '',
    status: '',
    severity: ''
  });
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(false);
  const [heatmapOptions, setHeatmapOptions] = useState({
    radius: 35,
    blur: 20,
    maxZoom: 18,
    max: 2.0
  });
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Delhi
  const [mapZoom, setMapZoom] = useState(10);
  const { isAuthenticated } = useAuth();

  // Fetch all potholes for heatmap
  const fetchPotholes = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 1000, // Get more data for heatmap
        ...filters
      };
      
      const response = await potholeAPI.getAll(params);
      setPotholes(response.data.potholes);
    } catch (error) {
      toast.error('Failed to load pothole data for heatmap');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Convert potholes to heatmap data format
  const getHeatmapData = () => {
    if (!potholes.length) return [];

    return potholes.map(pothole => {
      const intensity = getIntensityBySeverity(pothole.severity);
      return [
        pothole.location.coordinates.latitude,
        pothole.location.coordinates.longitude,
        intensity
      ];
    });
  };

  // Get intensity based on severity
  const getIntensityBySeverity = (severity) => {
    const intensityMap = {
      'low': 0.6,
      'medium': 1.0,
      'high': 1.5,
      'critical': 2.0
    };
    return intensityMap[severity] || 0.8;
  };

  // Convert potholes to markers
  const getMarkers = () => {
    if (!showMarkers || !potholes.length) return [];

    return potholes.map(pothole => ({
      position: [
        pothole.location.coordinates.latitude,
        pothole.location.coordinates.longitude
      ],
      popup: `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">${pothole.location.name}</h4>
          <p style="margin: 4px 0; color: #6b7280;">
            <strong>Severity:</strong> ${pothole.severity}
          </p>
          <p style="margin: 4px 0; color: #6b7280;">
            <strong>Status:</strong> ${pothole.status || 'reported'}
          </p>
          <p style="margin: 4px 0; color: #6b7280;">
            <strong>Date:</strong> ${new Date(pothole.createdAt).toLocaleDateString()}
          </p>
        </div>
      `
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle heatmap options change
  const handleHeatmapOptionChange = (key, value) => {
    setHeatmapOptions(prev => ({
      ...prev,
      [key]: parseFloat(value)
    }));
  };

  // Auto-center map based on data
  const autoCenterMap = () => {
    if (potholes.length === 0) return;

    const lats = potholes.map(p => p.location.coordinates.latitude);
    const lngs = potholes.map(p => p.location.coordinates.longitude);
    
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    setMapCenter([centerLat, centerLng]);
    setMapZoom(12);
  };

  useEffect(() => {
    fetchPotholes();
  }, [filters]);

  useEffect(() => {
    if (potholes.length > 0) {
      autoCenterMap();
    }
  }, [potholes]);

  const heatmapData = getHeatmapData();
  const markers = getMarkers();

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <div className="heatmap-title">
          <h1>Pothole Heatmap</h1>
          <p>Visualize pothole density and severity across different areas</p>
        </div>
        
        <div className="heatmap-controls">
          <button
            className={`control-btn ${showHeatmap ? 'active' : ''}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
            title="Toggle Heatmap"
          >
            <RiEyeLine />
            Heatmap
          </button>
          
          <button
            className={`control-btn ${showMarkers ? 'active' : ''}`}
            onClick={() => setShowMarkers(!showMarkers)}
            title="Toggle Markers"
          >
            <RiMapPinLine />
            Markers
          </button>
          
          <button
            className="control-btn"
            onClick={fetchPotholes}
            title="Refresh Data"
          >
            <RiRefreshLine />
            Refresh
          </button>
        </div>
      </div>

      <div className="heatmap-content">
        <div className="heatmap-sidebar">
          <div className="sidebar-section">
            <h3>Filters</h3>
            
            <div className="filter-group">
              <label>City</label>
              <input
                type="text"
                placeholder="Filter by city..."
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="reported">Reported</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="filter-select"
              >
                <option value="">All Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {showHeatmap && (
            <div className="sidebar-section">
              <h3>Heatmap Settings</h3>
              
              <div className="setting-group">
                <label>Radius: {heatmapOptions.radius}</label>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={heatmapOptions.radius}
                  onChange={(e) => handleHeatmapOptionChange('radius', e.target.value)}
                  className="setting-slider"
                />
              </div>

              <div className="setting-group">
                <label>Blur: {heatmapOptions.blur}</label>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={heatmapOptions.blur}
                  onChange={(e) => handleHeatmapOptionChange('blur', e.target.value)}
                  className="setting-slider"
                />
              </div>

              <div className="setting-group">
                <label>Max Intensity: {heatmapOptions.max}</label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={heatmapOptions.max}
                  onChange={(e) => handleHeatmapOptionChange('max', e.target.value)}
                  className="setting-slider"
                />
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <h3>Legend</h3>
            <div className="legend">
              <div className="legend-item">
                <div className="legend-color" style={{ background: 'blue' }}></div>
                <span>Low Density</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: 'lime' }}></div>
                <span>Medium Density</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: 'orange' }}></div>
                <span>High Density</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: 'red' }}></div>
                <span>Critical Density</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Statistics</h3>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-label">Total Potholes:</span>
                <span className="stat-value">{potholes.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Critical:</span>
                <span className="stat-value">
                  {potholes.filter(p => p.severity === 'critical').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">High:</span>
                <span className="stat-value">
                  {potholes.filter(p => p.severity === 'high').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Medium:</span>
                <span className="stat-value">
                  {potholes.filter(p => p.severity === 'medium').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Low:</span>
                <span className="stat-value">
                  {potholes.filter(p => p.severity === 'low').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="heatmap-main">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading heatmap data...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>Error loading heatmap: {error}</p>
              <button onClick={fetchPotholes} className="retry-btn">
                Retry
              </button>
            </div>
          ) : (
            <HeatmapMap
              center={mapCenter}
              zoom={mapZoom}
              markers={markers}
              heatmapData={heatmapData}
              showHeatmap={showHeatmap}
              heatmapOptions={heatmapOptions}
              height="600px"
              showOsmDisclaimer={false}
            />
          )}

          {/* OSM Disclaimer - Positioned at bottom to avoid covering controls */}
          <div className="osm-disclaimer" style={{ 
            marginTop: '1rem',
            fontSize: '0.85rem',
            color: '#b91c1c',
            background: '#fff7ed',
            border: '1px solid #fca5a5',
            borderRadius: '0.4rem',
            padding: '0.5rem 0.75rem',
            textAlign: 'left',
            maxWidth: '100%',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 10
          }}>
            <strong>Note:</strong> The map above is powered by <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>, an open-source mapping platform. We have not developed this map. <span style={{ color: '#b91c1c', fontWeight: 600 }}>It may contain inaccuracies in the depiction of international or regional boundaries.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapView; 