import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const HeatmapMap = ({ 
  center = [28.6139, 77.2090], // Default to Delhi
  zoom = 13,
  markers = [],
  heatmapData = [],
  onClick,
  height = '400px',
  width = '100%',
  className = '',
  showUserLocation = false,
  onUserLocationFound,
  showHeatmap = true,
  heatmapOptions = {},
  showOsmDisclaimer = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const heatmapLayerRef = useRef(null);
  const clickHandlerRef = useRef(null);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing click handler
    if (clickHandlerRef.current) {
      mapInstanceRef.current.off('click', clickHandlerRef.current);
      clickHandlerRef.current = null;
    }

    // Add new click handler if onClick is provided
    if (onClick) {
      clickHandlerRef.current = (e) => {
        onClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          latLng: e.latlng
        });
      };
      mapInstanceRef.current.on('click', clickHandlerRef.current);
    }
  }, [onClick]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Get user location if requested
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLatLng = [
            position.coords.latitude,
            position.coords.longitude
          ];
          
          // Add user location marker
          try {
            L.marker(userLatLng, {
              icon: L.divIcon({
                className: 'user-location-marker',
                html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            }).addTo(map);

            // Center map on user location
            map.setView(userLatLng, 15);
            
            if (onUserLocationFound) {
              onUserLocationFound({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            }
          } catch (error) {
            console.warn('Failed to add user location marker:', error);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }

    return () => {
      // Clean up click handler
      if (clickHandlerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.off('click', clickHandlerRef.current);
        clickHandlerRef.current = null;
      }
      
      // Clean up map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, showUserLocation, onUserLocationFound]);

  // Update heatmap when heatmapData changes
  useEffect(() => {
    if (!mapInstanceRef.current || !showHeatmap) return;

    // Remove existing heatmap layer
    if (heatmapLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    // Add new heatmap layer if data exists
    if (heatmapData && heatmapData.length > 0) {
      const defaultOptions = {
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
      };

      const options = { ...defaultOptions, ...heatmapOptions };
      
      try {
        heatmapLayerRef.current = L.heatLayer(heatmapData, options).addTo(mapInstanceRef.current);
      } catch (error) {
        console.warn('Failed to create heatmap layer:', error);
      }
    }
  }, [heatmapData, showHeatmap, heatmapOptions]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(({ position, popup, icon }) => {
      if (Array.isArray(position) && position.length === 2 &&
          typeof position[0] === 'number' && typeof position[1] === 'number') {
        const marker = icon
          ? L.marker(position, { icon }).addTo(mapInstanceRef.current)
          : L.marker(position).addTo(mapInstanceRef.current);
        if (popup) {
          marker.bindPopup(popup);
        }
        markersRef.current.push(marker);
      }
    });
  }, [markers]);

  // Update center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  return (
    <div style={{ position: 'relative', width }}>
      <div 
        ref={mapRef}
        style={{ 
          height, 
          width: '100%',
          borderRadius: '0.5rem',
          overflow: 'hidden'
        }}
        className={className}
      />
      {showOsmDisclaimer && (
        <div
          className="osm-disclaimer"
          style={{
            marginTop: 8,
            fontSize: '0.92rem',
            color: '#b91c1c',
            background: '#fff7ed',
            border: '1px solid #fca5a5',
            borderRadius: '0.4rem',
            padding: '0.5rem 0.75rem',
            textAlign: 'left',
            maxWidth: '100%',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 1
          }}
        >
          <strong>Note:</strong> The map shown above is powered by <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>, an open-source mapping platform. We have not developed this map. <span style={{ color: '#b91c1c', fontWeight: 600 }}>It may contain inaccuracies in the depiction of international or regional boundaries.</span>
        </div>
      )}
    </div>
  );
};

export default HeatmapMap; 