// Utility for reverse geocoding using OpenStreetMap Nominatim

export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'pothole-app/1.0 (roshan@empoweredindian.in)'
      }
    });
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    // Prefer display_name, fallback to address parts
    if (data.display_name) return data.display_name;
    if (data.address) {
      // Compose a simple address if display_name is missing
      const { road, suburb, city, town, village, state, country } = data.address;
      return [road, suburb, city || town || village, state, country].filter(Boolean).join(', ');
    }
    return null;
      } catch (error) {
      return null;
    }
} 
