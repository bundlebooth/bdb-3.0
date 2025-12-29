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

// Format date with proper validation
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    // Handle various date formats
    let date;
    if (typeof dateString === 'string') {
      // Try parsing ISO format first
      date = new Date(dateString);
      // If invalid, try other formats
      if (isNaN(date.getTime())) {
        // Try parsing "YYYY-MM-DD" format explicitly
        const parts = dateString.split(/[-/T]/);
        if (parts.length >= 3) {
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'N/A';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return 'N/A';
  }
}

// Format relative time (e.g., "2 hours ago", "3 days ago")
export function formatTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  try {
    // Handle various date formats
    let date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
      // If invalid, try other formats
      if (isNaN(date.getTime())) {
        const parts = dateString.split(/[-/T]/);
        if (parts.length >= 3) {
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'Recently';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Recently';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
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
