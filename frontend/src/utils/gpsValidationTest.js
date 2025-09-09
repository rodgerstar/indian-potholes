// Test file to demonstrate GPS coordinate validation
import { validateGPSCoordinates } from './gpsUtils';

// Test cases for GPS coordinate validation
const testCases = [
  // Valid coordinates
  { lat: 28.6139, lng: 77.2090, expected: true, description: 'Valid Delhi coordinates' },
  { lat: -90, lng: -180, expected: true, description: 'Valid boundary coordinates (min)' },
  { lat: 90, lng: 180, expected: true, description: 'Valid boundary coordinates (max)' },
  { lat: 0, lng: 0, expected: true, description: 'Valid coordinates at origin' },
  
  // Invalid coordinates
  { lat: NaN, lng: 77.2090, expected: false, description: 'NaN latitude' },
  { lat: 28.6139, lng: NaN, expected: false, description: 'NaN longitude' },
  { lat: 91, lng: 77.2090, expected: false, description: 'Latitude too high' },
  { lat: -91, lng: 77.2090, expected: false, description: 'Latitude too low' },
  { lat: 28.6139, lng: 181, expected: false, description: 'Longitude too high' },
  { lat: 28.6139, lng: -181, expected: false, description: 'Longitude too low' },
  { lat: '28.6139', lng: 77.2090, expected: false, description: 'String latitude' },
  { lat: 28.6139, lng: '77.2090', expected: false, description: 'String longitude' },
  { lat: null, lng: 77.2090, expected: false, description: 'Null latitude' },
  { lat: 28.6139, lng: null, expected: false, description: 'Null longitude' },
  { lat: undefined, lng: 77.2090, expected: false, description: 'Undefined latitude' },
  { lat: 28.6139, lng: undefined, expected: false, description: 'Undefined longitude' },
];

// Run tests
export const runGPSTests = () => {
  console.log('Running GPS coordinate validation tests...');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = validateGPSCoordinates(testCase.lat, testCase.lng);
    const success = result === testCase.expected;
    
    if (success) {
      passed++;
      console.log(`✅ Test ${index + 1}: ${testCase.description}`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: ${testCase.description}`);
      console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    }
  });
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All GPS validation tests passed!');
  } else {
    console.log('⚠️  Some GPS validation tests failed!');
  }
  
  return { passed, failed, total: testCases.length };
};

// Export for use in development
if (process.env.NODE_ENV === 'development') {
  window.runGPSTests = runGPSTests;
} 