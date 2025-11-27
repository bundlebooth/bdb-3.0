// API base URL (global constant)
// Use local API for development, production API for deployed version
// export const API_BASE_URL = process.env.NODE_ENV === 'production' 
//   ? 'https://bdb-3-0-venuevue-api.onrender.com/api'
//   : 'http://localhost:5000/api';

// Always use Render API (production backend)
export const API_BASE_URL = 'https://bdb-3-0-venuevue-api.onrender.com/api';

// Derive Socket base URL from API origin
let SOCKET_BASE_URL = '';
try {
    const apiUrl = new URL(API_BASE_URL);
    SOCKET_BASE_URL = apiUrl.origin;
} catch (_) {
    SOCKET_BASE_URL = 'https://bdb-3-0-venuevue-api.onrender.com';
}

export { SOCKET_BASE_URL };

// Google Maps API Key - REQUIRED for map functionality
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCPhhp2rAt1VTrIzjgagJXZPZ_nc7K_BVo';

// Set global for Google Maps callback
if (typeof window !== 'undefined') {
    window.GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY;
}
