import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import piexifjs from 'piexifjs';
import { validateGPSCoordinates } from '../utils/gpsUtils';

/**
 * Convert GPS coordinates from DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 * @param {Array} dms - DMS array [degrees, minutes, seconds]
 * @param {string} ref - Reference direction (N, S, E, W)
 * @returns {number} Decimal degrees
 */
const convertDMSToDD = (dms, ref) => {
  const degrees = dms[0];
  const minutes = dms[1];
  const seconds = dms[2];
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (ref === 'S' || ref === 'W') dd = -dd;
  return dd;
};

/**
 * Extract GPS data from image file
 * @param {File} file - Image file
 * @returns {Promise<Object|null>} GPS coordinates or null
 */
const extractGPSFromImage = (file) => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const jpeg = e.target.result;
          const data = piexifjs.load(jpeg);
          
          if (data && data.GPS && Object.keys(data.GPS).length > 0) {
            const gps = data.GPS;
            
            // Check if we have the required GPS data
            if (gps[piexifjs.GPSIFD.GPSLatitude] && 
                gps[piexifjs.GPSIFD.GPSLongitude] && 
                gps[piexifjs.GPSIFD.GPSLatitudeRef] && 
                gps[piexifjs.GPSIFD.GPSLongitudeRef]) {
              
              const lat = gps[piexifjs.GPSIFD.GPSLatitude];
              const lon = gps[piexifjs.GPSIFD.GPSLongitude];
              const latRef = gps[piexifjs.GPSIFD.GPSLatitudeRef];
              const lonRef = gps[piexifjs.GPSIFD.GPSLongitudeRef];
              
              const latitude = convertDMSToDD(lat, latRef);
              const longitude = convertDMSToDD(lon, lonRef);
              
              // Validate the extracted coordinates before returning them
              if (validateGPSCoordinates(latitude, longitude)) {
                resolve({ lat: latitude, lng: longitude });
              } else {
                console.warn('Invalid GPS coordinates extracted from image:', { latitude, longitude });
                resolve(null);
              }
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        } catch (error) {
          console.warn('Error extracting GPS from image:', error);
          resolve(null);
        }
      };
      
      reader.onerror = function() {
        resolve(null);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.warn('Error reading file for GPS extraction:', error);
      resolve(null);
    }
  });
};

/**
 * Custom hook for file upload functionality
 * @param {Object} options - Upload options
 * @param {number} options.maxFiles - Maximum number of files (default: 5)
 * @param {number} options.maxSize - Maximum file size in bytes (default: 50MB)
 * @param {string[]} options.allowedTypes - Allowed MIME types
 * @param {Function} options.onGPSFound - Callback when GPS data is found
 * @returns {Object} File upload state and methods
 */
const useFileUpload = ({ 
  maxFiles = 5, 
  maxSize = 50 * 1024 * 1024, // 50MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov', 'video/webm'],
  onGPSFound = null 
} = {}) => {
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Create file preview
   * @param {File} file - File to create preview for
   * @returns {Promise<string>} Preview URL
   */
  const createFilePreview = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Validate file
   * @param {File} file - File to validate
   * @returns {boolean} Whether file is valid
   */
  const validateFile = useCallback((file) => {
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type: ${file.name}. Only images and videos are allowed.`);
      return false;
    }
    if (file.size > maxSize) {
      toast.error(`File too large: ${file.name}. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`);
      return false;
    }
    return true;
  }, [allowedTypes, maxSize]);

  /**
   * Process files and update state
   * @param {FileList} fileList - Files to process
   * @param {boolean} appendToExisting - Whether to append to existing files
   */
  const processFiles = useCallback(async (fileList, appendToExisting = false) => {
    if (!fileList || fileList.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const files = Array.from(fileList);
      
      // Get current files if appending
      const currentFiles = appendToExisting ? selectedFiles : [];
      const currentPreviews = appendToExisting ? filePreviews : [];
      
      // Filter valid files
      const validFiles = [];
      for (const file of files) {
        if (!validateFile(file)) continue;
        
        if (currentFiles.length + validFiles.length >= maxFiles) {
          toast.error(`Maximum ${maxFiles} files allowed.`);
          break;
        }
        validFiles.push(file);
      }
      
      if (validFiles.length === 0) {
        toast.error('No valid files selected.');
        return;
      }
      
      // Combine existing and new files
      const allFiles = [...currentFiles, ...validFiles];
      setSelectedFiles(allFiles);
      
      // Generate previews for new files only
      const newPreviews = [...currentPreviews];
      let gpsFound = false;
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        // Create preview
        const preview = await createFilePreview(file);
        newPreviews.push(preview);
        
        // Extract GPS for images
        if (file.type.startsWith('image/') && !gpsFound && onGPSFound) {
          try {
            const gpsData = await extractGPSFromImage(file);
            if (gpsData && validateGPSCoordinates(gpsData.lat, gpsData.lng)) {
              gpsFound = true;
              onGPSFound(gpsData.lat, gpsData.lng);
              toast.success('GPS location found in image! Location has been suggested.');
            }
          } catch (error) {
            console.warn('GPS extraction failed:', error);
            // GPS extraction failed silently
          }
        }
      }
      
      setFilePreviews(newPreviews);
      
      const totalFiles = allFiles.length;
      const newFilesCount = validFiles.length;
      
      if (appendToExisting) {
        toast.success(`${newFilesCount} file(s) added. Total: ${totalFiles}/${maxFiles}`);
      } else {
        toast.success(`${totalFiles} file(s) selected successfully.`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFiles, filePreviews, validateFile, maxFiles, createFilePreview, onGPSFound]);

  /**
   * Handle file selection
   * @param {Event} e - File input change event
   */
  const handleFileSelect = useCallback((e) => {
    const isAppending = selectedFiles.length > 0;
    processFiles(e.target.files, isAppending);
    // Reset input to allow selecting the same files again
    e.target.value = '';
  }, [selectedFiles.length, processFiles]);

  /**
   * Remove file at specific index
   * @param {number} indexToRemove - Index of file to remove
   */
  const removeFile = useCallback((indexToRemove) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    const newPreviews = filePreviews.filter((_, index) => index !== indexToRemove);
    
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
    
    toast.success('File removed successfully.');
  }, [selectedFiles, filePreviews]);

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setFilePreviews([]);
  }, []);

  /**
   * Trigger file input click
   */
  const triggerFileSelect = useCallback(() => {
    if (selectedFiles.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed.`);
      return;
    }
    fileInputRef.current?.click();
  }, [selectedFiles.length, maxFiles]);

  return {
    // State
    selectedFiles,
    filePreviews,
    isProcessing,
    fileInputRef,
    
    // Actions
    handleFileSelect,
    removeFile,
    clearFiles,
    triggerFileSelect,
    processFiles,
    
    // Computed
    hasFiles: selectedFiles.length > 0,
    canAddMore: selectedFiles.length < maxFiles,
    fileCount: selectedFiles.length,
    maxFiles,
  };
};

export default useFileUpload;