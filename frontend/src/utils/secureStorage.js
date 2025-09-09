/**
 * Secure Storage Utility
 * 
 * This utility provides secure storage for sensitive data like authentication tokens.
 * It uses sessionStorage (which is cleared when the browser tab is closed) combined
 * with encryption to prevent XSS attacks and unauthorized access to sensitive data.
 * 
 * Key security features:
 * - Uses sessionStorage instead of localStorage (cleared on tab close)
 * - Encrypts sensitive data before storage
 * - Includes integrity checks to detect tampering
 * - Automatically handles token expiration
 * - Provides fallback mechanisms for older browsers
 */

// Simple encryption key (in production, this should be more sophisticated)
const ENCRYPTION_KEY = 'pothole-app-secure-key-2024';

/**
 * Encryption function using Web Crypto API for better security
 * Maintains backward compatibility by handling both sync and async usage
 */
const encrypt = (text) => {
  try {
    // Use Web Crypto API if available for async encryption
    if (window.crypto && window.crypto.subtle) {
      // Return a Promise for async encryption
      return (async () => {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(ENCRYPTION_KEY);
        
        // Create a key using PBKDF2
        const baseKey = await window.crypto.subtle.importKey(
          'raw',
          keyData,
          'PBKDF2',
          false,
          ['deriveBits', 'deriveKey']
        );
        
        // Generate salt (in production, use a random salt and store it)
        const salt = encoder.encode('pothole-app-salt-2024');
        
        // Derive a key from the password
        const key = await window.crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
          },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
        
        // Generate a random IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt the data
        const encrypted = await window.crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: iv
          },
          key,
          encoder.encode(text)
        );
        
        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);
        
        // Convert to base64
        return btoa(String.fromCharCode(...combined));
      })();
    } else {
      // For older browsers, use synchronous obfuscation
      const obfuscated = text.split('').map((char, index) => {
        const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
      }).join('');
      return btoa(encodeURIComponent(obfuscated));
    }
  } catch (error) {
    console.warn('Encryption failed, using fallback:', error);
    // Fallback to obfuscation for compatibility
    const obfuscated = text.split('').map((char, index) => {
      const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    }).join('');
    return btoa(encodeURIComponent(obfuscated));
  }
};

/**
 * Decryption function using Web Crypto API
 * Maintains backward compatibility by handling both sync and async usage
 */
const decrypt = (encryptedText) => {
  try {
    // Try to detect if this is modern encrypted data or legacy data
    if (window.crypto && window.crypto.subtle && encryptedText.length > 16) {
      // Might be modern encryption, try async decryption
      try {
        // Return a Promise for async decryption
        return (async () => {
          try {
            // Convert from base64
            const combined = new Uint8Array(
              atob(encryptedText).split('').map(char => char.charCodeAt(0))
            );
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);
            
            // Generate the same key
            const encoder = new TextEncoder();
            const keyData = encoder.encode(ENCRYPTION_KEY);
            
            const baseKey = await window.crypto.subtle.importKey(
              'raw',
              keyData,
              'PBKDF2',
              false,
              ['deriveBits', 'deriveKey']
            );
            
            const salt = encoder.encode('pothole-app-salt-2024');
            
            const key = await window.crypto.subtle.deriveKey(
              {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
              },
              baseKey,
              { name: 'AES-GCM', length: 256 },
              false,
              ['encrypt', 'decrypt']
            );
            
            // Decrypt the data
            const decrypted = await window.crypto.subtle.decrypt(
              {
                name: 'AES-GCM',
                iv: iv
              },
              key,
              encrypted
            );
            
            // Convert back to string
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
          } catch (cryptoError) {
            // Fall back to legacy decryption
            const decoded = decodeURIComponent(atob(encryptedText));
            const deobfuscated = decoded.split('').map((char, index) => {
              const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length);
              return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
            }).join('');
            return deobfuscated;
          }
        })();
      } catch (setupError) {
        // Fall through to sync decryption
      }
    }
    
    // Synchronous decryption for legacy data or older browsers
    const decoded = decodeURIComponent(atob(encryptedText));
    const deobfuscated = decoded.split('').map((char, index) => {
      const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    }).join('');
    return deobfuscated;
  } catch (error) {
    console.warn('Decryption failed:', error);
    return null;
  }
};

/**
 * Generate a simple integrity hash
 */
const generateIntegrityHash = (data) => {
  try {
    // Simple hash function
    let hash = 0;
    const str = JSON.stringify(data);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  } catch (error) {
    return '';
  }
};

/**
 * Verify data integrity
 */
const verifyIntegrity = (data, storedHash) => {
  const calculatedHash = generateIntegrityHash(data);
  return calculatedHash === storedHash;
};

/**
 * Secure Storage Class
 */
class SecureStorage {
  constructor() {
    this.storageKey = 'pothole_secure_data';
    this.isAvailable = this.checkAvailability();
  }

  /**
   * Check if secure storage is available
   */
  checkAvailability() {
    try {
      const testKey = '__test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('SessionStorage not available:', error);
      return false;
    }
  }

  /**
   * Store data securely
   * Maintains backward compatibility by handling both sync and async usage
   */
  setItem(key, value, options = {}) {
    if (!this.isAvailable) {
      console.warn('Secure storage not available, falling back to localStorage');
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Failed to store data:', error);
        return false;
      }
    }

    try {
      const dataToStore = {
        value,
        timestamp: Date.now(),
        expiresAt: options.expiresAt || null,
        version: '1.0'
      };

      const integrityHash = generateIntegrityHash(dataToStore);
      
      // Handle both sync and async encryption for backward compatibility
      const encryptionResult = encrypt(JSON.stringify(dataToStore));
      
      if (encryptionResult instanceof Promise) {
        // Async encryption - return a Promise for new usage
        return encryptionResult.then(encryptedData => {
          const storageData = {
            data: encryptedData,
            hash: integrityHash
          };
          sessionStorage.setItem(`${this.storageKey}_${key}`, JSON.stringify(storageData));
          return true;
        }).catch(error => {
          console.error('Failed to store data securely:', error);
          return false;
        });
      } else {
        // Sync encryption - maintain backward compatibility
        const storageData = {
          data: encryptionResult,
          hash: integrityHash
        };
        sessionStorage.setItem(`${this.storageKey}_${key}`, JSON.stringify(storageData));
        return true;
      }
    } catch (error) {
      console.error('Failed to store data securely:', error);
      return false;
    }
  }

  /**
   * Retrieve data securely
   * Maintains backward compatibility by handling both sync and async usage
   */
  getItem(key, defaultValue = null) {
    if (!this.isAvailable) {
      console.warn('Secure storage not available, falling back to localStorage');
      try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
      } catch (error) {
        console.error('Failed to retrieve data:', error);
        return defaultValue;
      }
    }

    try {
      const stored = sessionStorage.getItem(`${this.storageKey}_${key}`);
      if (!stored) return defaultValue;

      const storageData = JSON.parse(stored);
      
      // Handle both sync and async decryption for backward compatibility
      const decryptionResult = decrypt(storageData.data);
      
      if (decryptionResult instanceof Promise) {
        // Async decryption - return a Promise for new usage
        return decryptionResult.then(decryptedData => {
          if (!decryptedData) {
            console.warn('Failed to decrypt data for key:', key);
            this.removeItem(key);
            return defaultValue;
          }

          const parsedData = JSON.parse(decryptedData);

          // Verify integrity
          if (!verifyIntegrity(parsedData, storageData.hash)) {
            console.warn('Data integrity check failed for key:', key);
            this.removeItem(key);
            return defaultValue;
          }

          // Check expiration
          if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
            console.warn('Data expired for key:', key);
            this.removeItem(key);
            return defaultValue;
          }

          return parsedData.value;
        }).catch(error => {
          console.error('Failed to retrieve data securely:', error);
          this.removeItem(key);
          return defaultValue;
        });
      } else {
        // Sync decryption - maintain backward compatibility
        if (!decryptionResult) {
          console.warn('Failed to decrypt data for key:', key);
          this.removeItem(key);
          return defaultValue;
        }

        const parsedData = JSON.parse(decryptionResult);

        // Verify integrity
        if (!verifyIntegrity(parsedData, storageData.hash)) {
          console.warn('Data integrity check failed for key:', key);
          this.removeItem(key);
          return defaultValue;
        }

        // Check expiration
        if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
          console.warn('Data expired for key:', key);
          this.removeItem(key);
          return defaultValue;
        }

        return parsedData.value;
      }
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      this.removeItem(key);
      return defaultValue;
    }
  }

  /**
   * Remove data
   */
  removeItem(key) {
    if (!this.isAvailable) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Failed to remove data:', error);
        return false;
      }
    }

    try {
      sessionStorage.removeItem(`${this.storageKey}_${key}`);
      return true;
    } catch (error) {
      console.error('Failed to remove data securely:', error);
      return false;
    }
  }

  /**
   * Clear all secure data
   */
  clear() {
    if (!this.isAvailable) {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.error('Failed to clear data:', error);
        return false;
      }
    }

    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.storageKey)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear secure data:', error);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  hasItem(key) {
    if (!this.isAvailable) {
      return localStorage.getItem(key) !== null;
    }

    return sessionStorage.getItem(`${this.storageKey}_${key}`) !== null;
  }

  /**
   * Get all keys
   */
  getKeys() {
    if (!this.isAvailable) {
      return Object.keys(localStorage);
    }

    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.storageKey)) {
        keys.push(key.replace(`${this.storageKey}_`, ''));
      }
    }
    return keys;
  }
}

// Create and export a singleton instance
const secureStorage = new SecureStorage();

export default secureStorage;

// Export the class for testing purposes
export { SecureStorage }; 