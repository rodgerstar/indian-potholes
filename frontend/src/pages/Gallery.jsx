import React, { useState, useEffect } from 'react';
import { potholeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LeafletMap from '../components/LeafletMap';
import HeatmapMap from '../components/HeatmapMap';
import DetailsModal from '../components/DetailsModal';
import ShareModal from '../components/ShareModal';
import PotholeCard from '../components/shared/PotholeCard';
import FilterControls from '../components/shared/FilterControls';
import PaginationControls from '../components/shared/PaginationControls';
import usePagination from '../hooks/usePagination';
import useModal from '../hooks/useModal';
import useUpvote from '../hooks/useUpvote';
import { 
  RiMapPinLine, 
  RiPlayLine,
  RiGalleryLine,
  RiBarChartLine,
  RiRefreshLine,
  RiGridLine,
  RiListUnordered,
  RiMapLine,
  RiFireLine,
  RiThumbUpLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';

// PotholeCard component has been extracted to shared components

const Gallery = () => {
  const [potholes, setPotholes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    status: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [viewMode, setViewMode] = useState('grid');
  const [mapView, setMapView] = useState(false);
  const [heatmapView, setHeatmapView] = useState(false);
  const [stats, setStats] = useState(null);

  // Use custom hooks
  const { isAuthenticated } = useAuth();
  const pagination = usePagination({ itemsPerPage: 9 });
  const detailsModal = useModal();
  const shareModal = useModal();
  const { isUpvoting, createUpvoteHandler } = useUpvote(isAuthenticated);

  // Filter options configuration
  const filterOptions = {
    statusOptions: [
      { value: 'reported', label: 'Reported' },
      { value: 'acknowledged', label: 'Acknowledged' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'resolved', label: 'Resolved' }
    ],
    sortOptions: [
      { value: 'createdAt', label: 'Date Reported' },
      { value: 'upvotes', label: 'Most Upvoted' }
    ],
    orderOptions: [
      { value: 'desc', label: 'Newest First' },
      { value: 'asc', label: 'Oldest First' }
    ]
  };

  // Helper to get count by status
  const getStatusCount = (status) => {
    if (!stats?.statusStats) return 0;
    const found = stats.statusStats.find(s => s._id === status);
    return found ? found.count : 0;
  };

  const handleShare = (pothole) => {
    shareModal.openModal(pothole);
  };

  /**
   * Fetch potholes from API
   */
  const fetchPotholes = async () => {
    try {
      setLoading(true);
      const params = {
        ...pagination.getPaginationParams(),
        ...filters,
        ...(filters.city && { city: filters.city })
      };
      
      const response = await potholeAPI.getAll(params);
      setPotholes(response.data.potholes);
      pagination.updatePagination(response.data.pagination);
    } catch (error) {
      // Swallow expected cancellation/abort errors (common on mobile Safari during rapid navigations)
      const msg = error?.message || '';
      if (
        error?.name === 'AbortError' ||
        error?.name === 'CanceledError' ||
        error?.code === 'ERR_CANCELED' ||
        /AbortError|The operation was aborted|ERR_CANCELED|canceled/i.test(msg)
      ) {
        return;
      }
      toast.error('Failed to load potholes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch statistics
   */
  const fetchStats = async () => {
    try {
      const response = await potholeAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Effects
  useEffect(() => {
    fetchPotholes();
  }, [pagination.currentPage, filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    pagination.resetPagination();
  };

  /**
   * Function to open details modal from map popup
   */
  const openDetailsModal = (potholeOrId) => {
    let pothole;
    
    // Handle both pothole object and pothole ID
    if (typeof potholeOrId === 'string') {
      // If it's a string, treat it as an ID
      pothole = potholes.find(p => p._id === potholeOrId);
    } else {
      // If it's an object, use it directly
      pothole = potholeOrId;
    }
    
    if (pothole) {
      detailsModal.openModal(pothole);
    }
  };

  // Expose the function globally for map popup buttons
  useEffect(() => {
    window.openDetailsModal = openDetailsModal;
    return () => {
      delete window.openDetailsModal;
    };
  }, [potholes]);



  return (
    <div className="gallery-page-modern">
      <div className="gallery-container-modern">
        {/* Header Section */}
        <div className="gallery-header-modern">
          <div className="gallery-header-content">
            <div className="gallery-header-text">
              <h1 className="gallery-title-modern">
                <RiGalleryLine className="gallery-title-icon" />
                Community Reports Gallery
              </h1>
              <p className="gallery-subtitle-modern">
                Explore pothole reports from communities across India and join the movement for better roads
              </p>
            </div>
            
            <div className="gallery-header-actions">
              <button
                onClick={fetchPotholes}
                className="refresh-btn-gallery"
                title="Refresh Gallery"
              >
                <RiRefreshLine />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="gallery-stats-grid">
            {loading || !stats ? (
              // Loading state for stats
              <>
                <div className="gallery-stat-card">
                  <div className="stat-icon-gallery total">
                    <RiBarChartLine />
                  </div>
                  <div className="stat-content-gallery">
                    <div className="stat-number">
                      <div className="loading-spinner spinner-sm"></div>
                    </div>
                    <div className="stat-text">Total Reports</div>
                  </div>
                </div>
                <div className="gallery-stat-card">
                  <div className="stat-icon-gallery inprogress">
                    <RiPlayLine />
                  </div>
                  <div className="stat-content-gallery">
                    <div className="stat-number">
                      <div className="loading-spinner spinner-sm"></div>
                    </div>
                    <div className="stat-text">In Progress</div>
                  </div>
                </div>
                <div className="gallery-stat-card">
                  <div className="stat-icon-gallery resolved">
                    <RiMapPinLine />
                  </div>
                  <div className="stat-content-gallery">
                    <div className="stat-number">
                      <div className="loading-spinner spinner-sm"></div>
                    </div>
                    <div className="stat-text">Resolved Issues</div>
                  </div>
                </div>
                <div className="gallery-stat-card">
                  <div className="stat-icon-gallery upvotes">
                    <RiThumbUpLine />
                  </div>
                  <div className="stat-content-gallery">
                    <div className="stat-number">
                      <div className="loading-spinner spinner-sm"></div>
                    </div>
                    <div className="stat-text">Community Support</div>
                  </div>
                </div>
              </>
            ) : (
              // Actual stats when loaded
              <>
                <div className="gallery-stat-card">
                  <div className="stat-icon-gallery total">
                    <RiBarChartLine />
                  </div>
                  <div className="stat-content-gallery">
                    <div className="stat-number">{stats?.totalPotholes || 0}</div>
                    <div className="stat-text">Total Reports</div>
                  </div>
                </div>
                <div className="gallery-stat-card">
                  <div className="stat-icon-gallery inprogress">
                    <RiPlayLine />
                  </div>
                  <div className="stat-content-gallery">
                    <div className="stat-number">{getStatusCount('in_progress')}</div>
                    <div className="stat-text">In Progress</div>
                  </div>
                </div>
                <div className="gallery-stat-card">
                  <div className="stat-icon-gallery resolved">
                    <RiMapPinLine />
                  </div>
                  <div className="stat-content-gallery">
                    <div className="stat-number">{stats?.resolvedPotholes || 0}</div>
                    <div className="stat-text">Resolved Issues</div>
                  </div>
                </div>
                <div className="gallery-stat-card">
                  <div className="stat-icon-gallery upvotes">
                    <RiThumbUpLine />
                  </div>
                  <div className="stat-content-gallery">
                    <div className="stat-number">{stats?.totalUpvotes || 0}</div>
                    <div className="stat-text">Community Support</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="gallery-controls-modern">
          <FilterControls
            filters={{ ...filters, search: filters.city }}
            onFilterChange={(key, value) => {
              if (key === 'search') {
                handleFilterChange('city', value);
              } else {
                handleFilterChange(key, value);
              }
            }}
            options={filterOptions}
            searchPlaceholder="Search by city or area..."
          />

          {/* View Toggle */}
          <div className="gallery-view-toggle">
            <button
              className={`gallery-view-btn ${!mapView && !heatmapView && viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => { setMapView(false); setHeatmapView(false); setViewMode('grid'); }}
              title="Grid View"
            >
              <RiGridLine />
            </button>
            <button
              className={`gallery-view-btn ${!mapView && !heatmapView && viewMode === 'list' ? 'active' : ''}`}
              onClick={() => { setMapView(false); setHeatmapView(false); setViewMode('list'); }}
              title="List View"
            >
              <RiListUnordered />
            </button>
            <button
              className={`gallery-view-btn ${mapView ? 'active' : ''}`}
              onClick={() => { setMapView(true); setHeatmapView(false); }}
              title="Map View"
            >
              <RiMapLine />
            </button>
            <button
              className={`gallery-view-btn ${heatmapView ? 'active' : ''}`}
              onClick={() => { setHeatmapView(true); setMapView(false); }}
              title="Heatmap View"
            >
              <RiFireLine />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="gallery-loading-modern">
            <div className="loading-spinner spinner-lg"></div>
            <p>Loading community reports...</p>
          </div>
        ) : potholes.length === 0 ? (
          <div className="gallery-empty-modern">
            <div className="empty-illustration-gallery">
              <RiMapPinLine className="empty-icon-gallery" />
            </div>
            <h3 className="empty-title-gallery">No reports found</h3>
            <p className="empty-description-gallery">
              Try adjusting your filters or be the first to report a pothole in your area!
            </p>
            <button 
              onClick={() => window.location.href = '/upload'}
              className="empty-cta-gallery"
            >
              Report a Pothole
            </button>
          </div>
        ) : mapView ? (
          <div className="gallery-map-view-container" style={{ minHeight: '500px', margin: '2rem 0' }}>
            <LeafletMap
              center={potholes[0]?.location?.coordinates?.latitude ? [potholes[0].location.coordinates.latitude, potholes[0].location.coordinates.longitude] : [22.9734, 78.6569]}
              zoom={5}
              height="600px"
              showOsmDisclaimer={false}
              markers={potholes.map((pothole) => ({
                position: pothole.location?.coordinates?.latitude ? [pothole.location.coordinates.latitude, pothole.location.coordinates.longitude] : null,
                popup: `<div style='max-width:220px;'>
                  ${pothole.media && pothole.media.length > 0 ? `<img src='${pothole.media[0].url}' alt='Pothole' loading='lazy' decoding='async' style='width:100%;height:120px;object-fit:cover;border-radius:6px;margin-bottom:6px;' />` : ''}
                  <div><b>Status:</b> ${pothole.status}</div>
                  <div><b>Reported:</b> ${new Date(pothole.createdAt).toLocaleDateString('en-IN')}</div>
                  <div><b>Location:</b> ${pothole.location?.name || 'Unknown'}</div>
                  <div><b>Upvotes:</b> ${pothole.upvotes || 0}</div>
                  ${pothole.media && pothole.media.length > 1 ? `<div><b>Media:</b> ${pothole.media.length} items</div>` : ''}
                  <div style='margin-top:6px;'><button onclick='window.openDetailsModal("${pothole._id}")' style='color:#2563eb;text-decoration:underline;background:none;border:none;cursor:pointer;padding:0;font-size:inherit;'>View Details</button></div>
                </div>`
              })).filter(m => m.position)}
            />
          </div>
        ) : heatmapView ? (
          <div className="gallery-heatmap-view-container" style={{ minHeight: '500px', margin: '2rem 0' }}>
            <HeatmapMap
              center={potholes[0]?.location?.coordinates?.latitude ? [potholes[0].location.coordinates.latitude, potholes[0].location.coordinates.longitude] : [22.9734, 78.6569]}
              zoom={5}
              height="600px"
              showOsmDisclaimer={false}
              heatmapData={potholes.map((pothole) => {
                const intensity = pothole.severity === 'critical' ? 2.0 : 
                                pothole.severity === 'high' ? 1.5 : 
                                pothole.severity === 'medium' ? 1.0 : 0.6;
                return pothole.location?.coordinates?.latitude ? [
                  pothole.location.coordinates.latitude,
                  pothole.location.coordinates.longitude,
                  intensity
                ] : null;
              }).filter(h => h)}
              showHeatmap={true}
              heatmapOptions={{
                radius: 35,
                blur: 20,
                maxZoom: 18,
                max: 2.0,
                gradient: {
                  0.3: 'blue',
                  0.5: 'lime',
                  0.7: 'orange',
                  1.0: 'red'
                }
              }}
            />
          </div>
        ) : (
          <>
            {/* Gallery Grid */}
            <div className={`gallery-grid-modern ${viewMode}`}>
              {potholes.map((pothole) => (
                <PotholeCard 
                  key={pothole._id} 
                  pothole={pothole} 
                  onUpvote={createUpvoteHandler(pothole._id, setPotholes)}
                  isAuthenticated={isAuthenticated}
                  user={isAuthenticated?.user}
                  onView={openDetailsModal}
                  onDelete={null}
                  viewMode={viewMode}
                  onShare={handleShare}
                  isUpvoting={isUpvoting}
                />
              ))}
            </div>

            {/* Pagination */}
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.handlePageChange}
              showInfo={true}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
            />
          </>
        )}

        {/* OSM Disclaimer for Map View - Positioned at bottom to avoid covering controls */}
        {(mapView || heatmapView) && (
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
        )}
        
        <DetailsModal
          isOpen={detailsModal.isOpen}
          onClose={detailsModal.closeModal}
          report={detailsModal.modalData}
        />
      </div>
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={shareModal.closeModal}
        pothole={shareModal.modalData}
      />
    </div>
  );
};

export default Gallery;
