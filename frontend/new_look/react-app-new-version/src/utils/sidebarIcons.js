/**
 * Centralized App Icons
 * 
 * All icons used across the application for consistency.
 * Import this file to ensure consistent icon usage.
 * 
 * Usage:
 *   import { ICONS, getIcon } from '../utils/sidebarIcons';
 *   <i className={ICONS.bookings}></i>
 *   <i className={getIcon('bookings')}></i>
 */

// Font Awesome icon class names
export const ICONS = {
  // Navigation & Bottom Nav
  explore: 'fas fa-compass',
  bookings: 'fas fa-suitcase',
  messages: 'fas fa-envelope',
  favorites: 'fas fa-heart',
  profile: 'far fa-user-circle',
  map: 'fas fa-map',
  forum: 'fas fa-comments',
  
  // Sidebar Menu Items
  viewProfile: 'far fa-user-circle',
  settings: 'fas fa-cog',
  helpCentre: 'far fa-question-circle',
  logout: 'fas fa-sign-out-alt',
  
  // Actions & UI
  notifications: 'far fa-bell',
  notificationsFilled: 'fas fa-bell',
  close: 'fas fa-times',
  back: 'fas fa-arrow-left',
  chevronRight: 'fas fa-chevron-right',
  chevronLeft: 'fas fa-chevron-left',
  chevronDown: 'fas fa-chevron-down',
  chevronUp: 'fas fa-chevron-up',
  search: 'fas fa-search',
  filter: 'fas fa-filter',
  sort: 'fas fa-sort',
  edit: 'fas fa-edit',
  delete: 'fas fa-trash-alt',
  add: 'fas fa-plus',
  check: 'fas fa-check',
  
  // Vendor/Hosting
  switchToHosting: 'fas fa-key',
  switchToExplore: 'fas fa-compass',
  becomeVendor: 'fas fa-store',
  vendor: 'fas fa-store',
  
  // Quick Action Cards
  myBookings: 'fas fa-suitcase',
  myFavorites: 'fas fa-heart',
  
  // Account/Settings Pages
  personalInfo: 'fas fa-user',
  personalDetails: 'fas fa-user',
  loginSecurity: 'fas fa-lock',
  security: 'fas fa-shield-alt',
  privacy: 'fas fa-shield-alt',
  notificationsSettings: 'far fa-bell',
  taxes: 'fas fa-file-invoice-dollar',
  payments: 'fas fa-credit-card',
  languageCurrency: 'fas fa-globe',
  location: 'fas fa-map-marker-alt',
  communication: 'fas fa-envelope',
  
  // Client Pages
  reviews: 'fas fa-star',
  invoices: 'fas fa-file-invoice',
  calendar: 'fas fa-calendar-alt',
  
  // Vendor Profile / Become Vendor
  gallery: 'fas fa-images',
  services: 'fas fa-concierge-bell',
  pricing: 'fas fa-dollar-sign',
  availability: 'fas fa-clock',
  description: 'fas fa-align-left',
  contact: 'fas fa-phone',
  website: 'fas fa-globe',
  social: 'fas fa-share-alt',
  
  // Status Icons
  success: 'fas fa-check-circle',
  error: 'fas fa-exclamation-circle',
  warning: 'fas fa-exclamation-triangle',
  info: 'fas fa-info-circle',
  pending: 'fas fa-clock',
  confirmed: 'fas fa-check',
  cancelled: 'fas fa-times-circle',
  
  // Misc
  star: 'fas fa-star',
  starEmpty: 'far fa-star',
  starHalf: 'fas fa-star-half-alt',
  heart: 'fas fa-heart',
  heartEmpty: 'far fa-heart',
  share: 'fas fa-share',
  copy: 'fas fa-copy',
  download: 'fas fa-download',
  upload: 'fas fa-upload',
  camera: 'fas fa-camera',
  image: 'fas fa-image',
  video: 'fas fa-video',
  file: 'fas fa-file',
  link: 'fas fa-link',
  externalLink: 'fas fa-external-link-alt',
};

// Helper function to get icon class
export const getIcon = (iconName) => {
  return ICONS[iconName] || 'fas fa-circle';
};

// Alias for backward compatibility
export const SIDEBAR_ICONS = ICONS;

export default ICONS;
