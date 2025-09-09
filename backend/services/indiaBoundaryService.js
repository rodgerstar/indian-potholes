import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * India Boundary Validation Service
 * Uses point-in-polygon algorithm to check if coordinates are within India's borders
 */
class IndiaBoundaryService {
  constructor() {
    this.indiaPolygon = null;
    this.isLoaded = false;
    this.loadingPromise = null;
  }

  /**
   * Load India boundary GeoJSON data
   */
  async loadIndiaPolygon() {
    if (this.isLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this._loadPolygonData();
    await this.loadingPromise;
  }

  async _loadPolygonData() {
    try {
      const geojsonPath = path.join(__dirname, '../data/india-composite.geojson');
      const data = fs.readFileSync(geojsonPath, 'utf8');
      const geojson = JSON.parse(data);
      
      // Extract the first feature (India boundary)
      if (geojson.features && geojson.features.length > 0) {
        this.indiaPolygon = geojson.features[0].geometry;
        this.isLoaded = true;
        console.log('✅ India boundary polygon loaded successfully');
      } else {
        throw new Error('No features found in India GeoJSON');
      }
    } catch (error) {
      console.error('❌ Error loading India boundary polygon:', error);
      throw error;
    }
  }

  /**
   * Check if a point is inside a polygon using ray casting algorithm
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {Array} polygon - Polygon coordinates array
   * @returns {boolean} True if point is inside polygon
   */
  pointInPolygon(lat, lng, polygon) {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      
      if (((yi > lat) !== (yj > lat)) && 
          (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * Check if a point is inside a MultiPolygon
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {Array} multiPolygon - MultiPolygon coordinates array
   * @returns {boolean} True if point is inside any polygon
   */
  pointInMultiPolygon(lat, lng, multiPolygon) {
    for (const polygon of multiPolygon) {
      // Each polygon can have holes (exterior ring + interior rings)
      const exteriorRing = polygon[0];
      
      // Check if point is in the exterior ring
      if (this.pointInPolygon(lat, lng, exteriorRing)) {
        // Check if point is in any holes (interior rings)
        let inHole = false;
        for (let i = 1; i < polygon.length; i++) {
          if (this.pointInPolygon(lat, lng, polygon[i])) {
            inHole = true;
            break;
          }
        }
        
        // If in exterior ring but not in any hole, point is inside
        if (!inHole) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if coordinates are within India's boundaries
   * @param {number} latitude - Latitude in decimal degrees
   * @param {number} longitude - Longitude in decimal degrees
   * @returns {Promise<boolean>} True if coordinates are within India
   */
  async isWithinIndia(latitude, longitude) {
    // Ensure polygon is loaded
    await this.loadIndiaPolygon();
    
    if (!this.indiaPolygon) {
      throw new Error('India boundary polygon not loaded');
    }

    // Basic validation
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        isNaN(latitude) || isNaN(longitude)) {
      return false;
    }

    // Quick bounding box check first (optimization)
    // India's approximate bounding box
    if (latitude < 6.4 || latitude > 37.6 || 
        longitude < 68.7 || longitude > 97.25) {
      return false;
    }

    try {
      // Handle different geometry types
      if (this.indiaPolygon.type === 'Polygon') {
        return this.pointInMultiPolygon(latitude, longitude, [this.indiaPolygon.coordinates]);
      } else if (this.indiaPolygon.type === 'MultiPolygon') {
        return this.pointInMultiPolygon(latitude, longitude, this.indiaPolygon.coordinates);
      }
      
      return false;
    } catch (error) {
      console.error('Error checking point in India boundary:', error);
      return false;
    }
  }

  /**
   * Get India boundary statistics
   * @returns {Object} Statistics about the loaded boundary
   */
  getBoundaryStats() {
    if (!this.indiaPolygon) {
      return { loaded: false };
    }

    let polygonCount = 0;
    let totalPoints = 0;

    if (this.indiaPolygon.type === 'Polygon') {
      polygonCount = 1;
      totalPoints = this.indiaPolygon.coordinates.reduce((sum, ring) => sum + ring.length, 0);
    } else if (this.indiaPolygon.type === 'MultiPolygon') {
      polygonCount = this.indiaPolygon.coordinates.length;
      totalPoints = this.indiaPolygon.coordinates.reduce((sum, polygon) => 
        sum + polygon.reduce((ringSum, ring) => ringSum + ring.length, 0), 0
      );
    }

    return {
      loaded: true,
      type: this.indiaPolygon.type,
      polygonCount,
      totalPoints,
      boundingBox: {
        north: 37.6,
        south: 6.4,
        east: 97.25,
        west: 68.7
      }
    };
  }
}

// Create singleton instance
const indiaBoundaryService = new IndiaBoundaryService();

export default indiaBoundaryService;