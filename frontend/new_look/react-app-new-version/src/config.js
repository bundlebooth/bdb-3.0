// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================
// 
// To switch between environments, change USE_PRODUCTION_API:
//   - false = Use localhost (development)
//   - true  = Use production API (Render)
//
// You can also override via localStorage in browser console:
//   localStorage.setItem('USE_PRODUCTION_API', 'true')  // Use production
//   localStorage.setItem('USE_PRODUCTION_API', 'false') // Use localhost
//   localStorage.removeItem('USE_PRODUCTION_API')       // Use default
//
// ============================================================

// Default setting (change this to switch environments easily)
const DEFAULT_USE_PRODUCTION = false;

// Check localStorage override first, then use default
const getApiMode = () => {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem('USE_PRODUCTION_API');
    if (override !== null) {
      return override === 'true';
    }
  }
  // In production build, always use production API
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  return DEFAULT_USE_PRODUCTION;
};

const USE_PRODUCTION_API = getApiMode();

// API URLs
const PRODUCTION_API_URL = 'https://bdb-3-0-venuevue-api.onrender.com/api';
const LOCAL_API_URL = 'http://localhost:5000/api';

export const API_BASE_URL = USE_PRODUCTION_API ? PRODUCTION_API_URL : LOCAL_API_URL;

// Export environment info for display
export const ENV_CONFIG = {
  isProduction: USE_PRODUCTION_API,
  apiUrl: API_BASE_URL,
  mode: USE_PRODUCTION_API ? 'Production' : 'Development (localhost)'
};

// Derive Socket base URL from API origin
let SOCKET_BASE_URL = '';
try {
    const apiUrl = new URL(API_BASE_URL);
    SOCKET_BASE_URL = apiUrl.origin;
} catch (_) {
    SOCKET_BASE_URL = 'https://bdb-3-0-venuevue-api.onrender.com';
}

export { SOCKET_BASE_URL };

// Helper function to switch environments (call from browser console)
if (typeof window !== 'undefined') {
  window.switchToProduction = () => {
    localStorage.setItem('USE_PRODUCTION_API', 'true');
    window.location.reload();
  };
  window.switchToLocalhost = () => {
    localStorage.setItem('USE_PRODUCTION_API', 'false');
    window.location.reload();
  };
  window.resetApiMode = () => {
    localStorage.removeItem('USE_PRODUCTION_API');
    window.location.reload();
  };
  window.getCurrentApiMode = () => {
    return { url: API_BASE_URL, isProduction: USE_PRODUCTION_API };
  };
}

// Google Maps API Key - REQUIRED for map functionality
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCPhhp2rAt1VTrIzjgagJXZPZ_nc7K_BVo';

// Set global for Google Maps callback
if (typeof window !== 'undefined') {
    window.GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY;
}
