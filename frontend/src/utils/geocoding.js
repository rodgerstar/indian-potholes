// Utility for reverse and forward geocoding using OpenStreetMap Nominatim

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
    const ct = response.headers.get('content-type') || '';
    if (!/application\/json/i.test(ct)) {
      // Avoid JSON parse errors when upstream serves HTML or text
      return null;
    }
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

// Forward geocode: name/query -> coordinates (India only)
export async function forwardGeocode(query, { limit = 5 } = {}) {
  const q = (query || '').trim();
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=${limit}&countrycodes=in`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'pothole-app/1.0 (roshan@empoweredindian.in)'
      }
    });
    if (!response.ok) return [];
    const ct = response.headers.get('content-type') || '';
    if (!/application\/json/i.test(ct)) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    // Normalize items
    return data
      .map(item => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (isNaN(lat) || isNaN(lon)) return null;
        return {
          display_name: item.display_name,
          lat,
          lon,
          type: item.type,
          class: item.class,
          address: item.address || {},
        };
      })
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}
