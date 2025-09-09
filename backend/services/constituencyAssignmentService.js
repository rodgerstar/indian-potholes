import * as turf from '@turf/turf';
import Pothole from '../models/Pothole.js';
import MP from '../models/MP.js';
import Constituency from '../models/Constituency.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class ConstituencyAssignmentService {
  constructor() {
    this.assemblyGeojson = null;
    this.parliamentGeojson = null;
    this.loadGeojsons();
  }

  async loadGeojsons() {
    try {
      // Resolve paths relative to the backend directory regardless of current working directory
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const dataDir = path.join(__dirname, '..', 'data');
      const acPath = path.join(dataDir, 'India_AC.json');
      const pcPath = path.join(dataDir, 'india_pc_2019_simplified.geojson');
      
      if (fs.existsSync(acPath) && fs.existsSync(pcPath)) {
        this.assemblyGeojson = JSON.parse(fs.readFileSync(acPath, 'utf8'));
        this.parliamentGeojson = JSON.parse(fs.readFileSync(pcPath, 'utf8'));
        console.log('Constituency GeoJSONs loaded successfully');
      } else {
        console.warn('GeoJSON files not found, auto-assignment will be disabled');
      }
    } catch (error) {
      console.error('Failed to load constituency GeoJSONs:', error);
    }
  }

  /**
   * Find constituencies for a given lat/lng point
   */
  getConstituenciesForPoint(lat, lng) {
    if (!this.assemblyGeojson || !this.parliamentGeojson) {
      return { assembly: null, parliament: null };
    }

    const point = turf.point([lng, lat]);
    let assembly = null;
    let parliament = null;

    // Find assembly constituency
    for (const feature of this.assemblyGeojson.features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        assembly = feature.properties;
        break;
      }
    }

    // Find parliamentary constituency
    for (const feature of this.parliamentGeojson.features) {
      if (turf.booleanPointInPolygon(point, feature)) {
        parliament = feature.properties;
        break;
      }
    }

    return { assembly, parliament };
  }

  /**
   * Clean constituency name by removing SC, ST, OBC suffixes
   */
  cleanConstituencyName(constituencyName) {
    if (!constituencyName) return '';
    
    let cleaned = constituencyName;
    
    // Remove common reserved seat suffixes
    const suffixPatterns = [
      / SC$/, / ST$/, / OBC$/, / GEN$/,
      / \(SC\)$/, / \(ST\)$/, / \(OBC\)$/, / \(GEN\)$/
    ];
    
    for (const pattern of suffixPatterns) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '');
        break;
      }
    }
    
    return cleaned.trim();
  }

  /**
   * Escape a string for safe usage in RegExp constructor
   */
  escapeRegex(str) {
    if (!str) return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Try to automatically assign constituencies to a pothole
   */
  async tryAutoAssignment(potholeId, lat, lng) {
    try {
      // Check if constituency is already manually assigned
      const existingPothole = await Pothole.findById(potholeId);
      if (existingPothole && existingPothole.constituencyStatus === 'manually_assigned') {
        return true; // Skip auto-assignment for manually assigned potholes
      }

      const { assembly, parliament } = this.getConstituenciesForPoint(lat, lng);
      
      if (assembly && parliament) {
        const stateName = assembly.ST_NAME || assembly.st_name || 'Unknown State';
        const rawConstituencyName = assembly.AC_NAME || assembly.ac_name || 'Unknown Constituency';
        const constituencyName = this.cleanConstituencyName(rawConstituencyName);
        const parliamentaryConstituencyName = parliament.pc_name || 'Unknown PC';

        const updateData = {
          state: stateName,
          constituency: constituencyName,
          parliamentaryConstituency: parliamentaryConstituencyName
        };

        let mlaFound = false;
        let mpFound = false;

        // Look up MLA from Constituency collection
        try {
          const mlaRecord = await Constituency.findOne({
            state: { $regex: new RegExp(`^${this.escapeRegex(stateName)}$`, 'i') },
            constituency: { $regex: new RegExp(`^${this.escapeRegex(constituencyName)}$`, 'i') }
          });
          if (mlaRecord && mlaRecord.mla) {
            updateData['authorities.mla'] = mlaRecord.mla;
            mlaFound = true;
          } else {
            console.warn(`Could not find MLA for ${constituencyName}, ${stateName}`);
          }
        } catch (mlaError) {
          console.error(`Database error looking up MLA for ${constituencyName}, ${stateName}:`, mlaError.message);
        }

        // Look up MP from MP collection
        try {
          const mpRecord = await MP.findOne({
            pc_name: { $regex: new RegExp(`^${this.escapeRegex(parliamentaryConstituencyName)}$`, 'i') },
            state: { $regex: new RegExp(`^${this.escapeRegex(stateName)}$`, 'i') }
          });
          if (mpRecord && mpRecord.mp_name) {
            updateData['authorities.mp'] = mpRecord.mp_name;
            mpFound = true;
          } else {
            console.warn(`Could not find MP for ${parliamentaryConstituencyName}, ${stateName}`);
          }
        } catch (mpError) {
          console.error(`Database error looking up MP for ${parliamentaryConstituencyName}, ${stateName}:`, mpError.message);
        }

        // Only mark as auto_assigned if BOTH MLA and MP are found
        if (mlaFound && mpFound) {
          updateData.constituencyStatus = 'auto_assigned';
        } else {
          updateData.constituencyStatus = 'pending_manual';
        }

        await Pothole.findByIdAndUpdate(potholeId, updateData);
        return mlaFound && mpFound;
      }
    } catch (error) {
      console.error(`Auto-assignment failed for pothole ${potholeId}:`, error);
    }
    
    // If auto-assignment fails, mark for manual review
    await Pothole.findByIdAndUpdate(potholeId, {
      constituencyStatus: 'pending_manual'
    });
    
    return false;
  }

  /**
   * Process all potholes that need constituency assignment
   */
  async processUnassignedPotholes() {
    try {
      const unassignedPotholes = await Pothole.find({
        constituencyStatus: 'pending_manual',
        state: 'Pending Assignment'
      }).select('_id location');

      console.log(`Processing ${unassignedPotholes.length} unassigned potholes`);

      for (const pothole of unassignedPotholes) {
        const { latitude, longitude } = pothole.location.coordinates;
        await this.tryAutoAssignment(pothole._id, latitude, longitude);
      }

      return unassignedPotholes.length;
    } catch (error) {
      console.error('Error processing unassigned potholes:', error);
      return 0;
    }
  }

  /**
   * Get statistics about constituency assignments
   */
  async getAssignmentStats() {
    try {
      const stats = await Pothole.aggregate([
        {
          $group: {
            _id: '$constituencyStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        auto_assigned: 0,
        pending_manual: 0,
        manually_assigned: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
      });

      return result;
    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return null;
    }
  }
}

export default new ConstituencyAssignmentService();