// Utility helper functions

// Update page title with notification count
export function updatePageTitle(notificationCount) {
  const baseTitle = 'PlanHive - Event Booking Platform';
  if (notificationCount > 0) {
    document.title = `(${notificationCount}) ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Format date
export function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

// Format money
export function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

// Generate session ID
export function generateSessionId() {
  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem('sessionId', sessionId);
  return sessionId;
}

// Show banner notification - import from banners.js
export { showBanner, showSuccess, showError, showInfo, detectBannerVariant } from './banners';

// Map category to icon
export function getCategoryIcon(category) {
  const icons = {
    venue: 'fa-building',
    photo: 'fa-camera',
    music: 'fa-music',
    catering: 'fa-utensils',
    entertainment: 'fa-theater-masks',
    experiences: 'fa-star',
    decor: 'fa-ribbon',
    beauty: 'fa-spa',
    cake: 'fa-birthday-cake',
    transport: 'fa-shuttle-van',
    planner: 'fa-clipboard-list',
    fashion: 'fa-tshirt',
    stationery: 'fa-envelope'
  };
  return icons[category] || 'fa-layer-group';
}

// Get category icon HTML
export function getCategoryIconHtml(category) {
  const icon = getCategoryIcon(category);
  return `<i class="fas ${icon}" style="font-size: 12px;"></i>`;
}

// Map type to category
export function mapTypeToCategory(type) {
  const mapping = {
    'Venue': 'venue',
    'Photography': 'photo',
    'Videography': 'photo',
    'Music': 'music',
    'DJ': 'music',
    'Catering': 'catering',
    'Entertainment': 'entertainment',
    'Experiences': 'experiences',
    'Decorations': 'decor',
    'Beauty': 'beauty',
    'Cake': 'cake',
    'Transportation': 'transport',
    'Event Planner': 'planner',
    'Fashion': 'fashion',
    'Stationery': 'stationery'
  };
  return mapping[type] || type.toLowerCase();
}
