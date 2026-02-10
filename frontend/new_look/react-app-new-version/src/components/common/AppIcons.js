/**
 * Centralized App Icons
 * 
 * All icons used across the app should be imported from this file
 * to ensure consistency in style (hollow/outline icons like Airbnb)
 * 
 * Usage:
 * import { Icons } from '../components/common/AppIcons';
 * <Icons.Bookings />
 * <Icons.Messages />
 * 
 * Or use the Icon component directly:
 * import { Icon } from '../components/common/AppIcons';
 * <Icon name="bookings" />
 */

import React from 'react';

// Default icon style - matches Airbnb's hollow/outline look
// eslint-disable-next-line no-unused-vars
const defaultStyle = {
  fontSize: '20px',
  color: '#717171',
  lineHeight: 1,
};

// Icon wrapper component for consistent sizing
const IconWrapper = ({ children, size = 20, color = '#717171', className = '', style = {}, ...props }) => (
  <span 
    className={`app-icon ${className}`}
    style={{ 
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      fontSize: size,
      color,
      lineHeight: 1,
      ...style 
    }}
    {...props}
  >
    {children}
  </span>
);

// Individual icon components using Font Awesome Regular (hollow) icons
// For icons without a regular variant, we use the solid with lighter styling

export const Icons = {
  // Navigation & Menu
  Bookings: (props) => <IconWrapper {...props}><i className="far fa-calendar-check"></i></IconWrapper>,
  Messages: (props) => <IconWrapper {...props}><i className="far fa-comment-dots"></i></IconWrapper>,
  Favorites: (props) => <IconWrapper {...props}><i className="far fa-heart"></i></IconWrapper>,
  Profile: (props) => <IconWrapper {...props}><i className="far fa-user-circle"></i></IconWrapper>,
  Settings: (props) => <IconWrapper {...props}><i className="fas fa-cog"></i></IconWrapper>,
  Help: (props) => <IconWrapper {...props}><i className="far fa-question-circle"></i></IconWrapper>,
  Logout: (props) => <IconWrapper {...props}><i className="fas fa-sign-out-alt"></i></IconWrapper>,
  
  // Dashboard
  Dashboard: (props) => <IconWrapper {...props}><i className="fas fa-th-large"></i></IconWrapper>,
  Analytics: (props) => <IconWrapper {...props}><i className="far fa-chart-bar"></i></IconWrapper>,
  Invoices: (props) => <IconWrapper {...props}><i className="far fa-file-alt"></i></IconWrapper>,
  Payments: (props) => <IconWrapper {...props}><i className="far fa-credit-card"></i></IconWrapper>,
  Reviews: (props) => <IconWrapper {...props}><i className="far fa-star"></i></IconWrapper>,
  
  // Vendor
  Store: (props) => <IconWrapper {...props}><i className="far fa-store"></i></IconWrapper>,
  Services: (props) => <IconWrapper {...props}><i className="fas fa-concierge-bell"></i></IconWrapper>,
  Calendar: (props) => <IconWrapper {...props}><i className="far fa-calendar-alt"></i></IconWrapper>,
  Availability: (props) => <IconWrapper {...props}><i className="far fa-clock"></i></IconWrapper>,
  Portfolio: (props) => <IconWrapper {...props}><i className="far fa-images"></i></IconWrapper>,
  Team: (props) => <IconWrapper {...props}><i className="fas fa-users"></i></IconWrapper>,
  
  // Actions
  Edit: (props) => <IconWrapper {...props}><i className="far fa-edit"></i></IconWrapper>,
  Delete: (props) => <IconWrapper {...props}><i className="far fa-trash-alt"></i></IconWrapper>,
  Add: (props) => <IconWrapper {...props}><i className="far fa-plus-circle"></i></IconWrapper>,
  Close: (props) => <IconWrapper {...props}><i className="far fa-times-circle"></i></IconWrapper>,
  Check: (props) => <IconWrapper {...props}><i className="far fa-check-circle"></i></IconWrapper>,
  Search: (props) => <IconWrapper {...props}><i className="fas fa-search"></i></IconWrapper>,
  Filter: (props) => <IconWrapper {...props}><i className="fas fa-filter"></i></IconWrapper>,
  Sort: (props) => <IconWrapper {...props}><i className="fas fa-sort"></i></IconWrapper>,
  
  // Status
  Pending: (props) => <IconWrapper {...props}><i className="far fa-hourglass-half"></i></IconWrapper>,
  Confirmed: (props) => <IconWrapper {...props}><i className="far fa-check-circle"></i></IconWrapper>,
  Cancelled: (props) => <IconWrapper {...props}><i className="far fa-times-circle"></i></IconWrapper>,
  Completed: (props) => <IconWrapper {...props}><i className="fas fa-check-double"></i></IconWrapper>,
  
  // Booking Details
  Date: (props) => <IconWrapper {...props}><i className="far fa-calendar"></i></IconWrapper>,
  Time: (props) => <IconWrapper {...props}><i className="far fa-clock"></i></IconWrapper>,
  Location: (props) => <IconWrapper {...props}><i className="fas fa-map-marker-alt"></i></IconWrapper>,
  Guests: (props) => <IconWrapper {...props}><i className="fas fa-users"></i></IconWrapper>,
  Event: (props) => <IconWrapper {...props}><i className="fas fa-glass-cheers"></i></IconWrapper>,
  
  // Communication
  Email: (props) => <IconWrapper {...props}><i className="far fa-envelope"></i></IconWrapper>,
  Phone: (props) => <IconWrapper {...props}><i className="fas fa-phone"></i></IconWrapper>,
  Chat: (props) => <IconWrapper {...props}><i className="far fa-comments"></i></IconWrapper>,
  Notification: (props) => <IconWrapper {...props}><i className="far fa-bell"></i></IconWrapper>,
  
  // Misc
  Info: (props) => <IconWrapper {...props}><i className="far fa-info-circle"></i></IconWrapper>,
  Warning: (props) => <IconWrapper {...props}><i className="far fa-exclamation-triangle"></i></IconWrapper>,
  Error: (props) => <IconWrapper {...props}><i className="far fa-exclamation-circle"></i></IconWrapper>,
  Success: (props) => <IconWrapper {...props}><i className="far fa-check-circle"></i></IconWrapper>,
  Lock: (props) => <IconWrapper {...props}><i className="fas fa-lock"></i></IconWrapper>,
  Unlock: (props) => <IconWrapper {...props}><i className="fas fa-unlock"></i></IconWrapper>,
  Eye: (props) => <IconWrapper {...props}><i className="far fa-eye"></i></IconWrapper>,
  EyeSlash: (props) => <IconWrapper {...props}><i className="far fa-eye-slash"></i></IconWrapper>,
  Copy: (props) => <IconWrapper {...props}><i className="far fa-copy"></i></IconWrapper>,
  Download: (props) => <IconWrapper {...props}><i className="fas fa-download"></i></IconWrapper>,
  Upload: (props) => <IconWrapper {...props}><i className="fas fa-upload"></i></IconWrapper>,
  Share: (props) => <IconWrapper {...props}><i className="fas fa-share-alt"></i></IconWrapper>,
  Link: (props) => <IconWrapper {...props}><i className="fas fa-link"></i></IconWrapper>,
  ExternalLink: (props) => <IconWrapper {...props}><i className="fas fa-external-link-alt"></i></IconWrapper>,
  
  // Arrows & Navigation
  ArrowLeft: (props) => <IconWrapper {...props}><i className="fas fa-arrow-left"></i></IconWrapper>,
  ArrowRight: (props) => <IconWrapper {...props}><i className="fas fa-arrow-right"></i></IconWrapper>,
  ArrowUp: (props) => <IconWrapper {...props}><i className="fas fa-arrow-up"></i></IconWrapper>,
  ArrowDown: (props) => <IconWrapper {...props}><i className="fas fa-arrow-down"></i></IconWrapper>,
  ChevronLeft: (props) => <IconWrapper {...props}><i className="fas fa-chevron-left"></i></IconWrapper>,
  ChevronRight: (props) => <IconWrapper {...props}><i className="fas fa-chevron-right"></i></IconWrapper>,
  ChevronUp: (props) => <IconWrapper {...props}><i className="fas fa-chevron-up"></i></IconWrapper>,
  ChevronDown: (props) => <IconWrapper {...props}><i className="fas fa-chevron-down"></i></IconWrapper>,
  
  // Vendor Profile Badges
  Trending: (props) => <IconWrapper {...props}><i className="fas fa-chart-line"></i></IconWrapper>,
  MostBooked: (props) => <IconWrapper {...props}><i className="fas fa-chart-line"></i></IconWrapper>,
  TopRated: (props) => <IconWrapper {...props}><i className="far fa-star"></i></IconWrapper>,
  InstantBook: (props) => <IconWrapper {...props}><i className="fas fa-bolt"></i></IconWrapper>,
  GuestFavorite: (props) => <IconWrapper {...props}><i className="fas fa-award"></i></IconWrapper>,
  Verified: (props) => <IconWrapper {...props}><i className="fas fa-check-circle"></i></IconWrapper>,
  New: (props) => <IconWrapper {...props}><i className="fas fa-star"></i></IconWrapper>,
  
  // Policies
  Cancellation: (props) => <IconWrapper {...props}><i className="far fa-calendar-times"></i></IconWrapper>,
  LeadTime: (props) => <IconWrapper {...props}><i className="far fa-hourglass-start"></i></IconWrapper>,
  Refund: (props) => <IconWrapper {...props}><i className="fas fa-undo"></i></IconWrapper>,
  
  // Sidebar specific
  MyBookings: (props) => <IconWrapper {...props}><i className="far fa-calendar-check"></i></IconWrapper>,
  MyFavorites: (props) => <IconWrapper {...props}><i className="far fa-heart"></i></IconWrapper>,
  Forums: (props) => <IconWrapper {...props}><i className="far fa-comments"></i></IconWrapper>,
  Blog: (props) => <IconWrapper {...props}><i className="far fa-newspaper"></i></IconWrapper>,
  SwitchMode: (props) => <IconWrapper {...props}><i className="fas fa-exchange-alt"></i></IconWrapper>,
  Key: (props) => <IconWrapper {...props}><i className="fas fa-key"></i></IconWrapper>,
  User: (props) => <IconWrapper {...props}><i className="far fa-user"></i></IconWrapper>,
  MapMarker: (props) => <IconWrapper {...props}><i className="fas fa-map-marker-alt"></i></IconWrapper>,
  Star: (props) => <IconWrapper {...props}><i className="fas fa-star"></i></IconWrapper>,
};

// Dynamic Icon component - use when icon name comes from data
export const Icon = ({ name, ...props }) => {
  const IconComponent = Icons[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in AppIcons`);
    return <IconWrapper {...props}><i className="far fa-question"></i></IconWrapper>;
  }
  return <IconComponent {...props} />;
};

// Icon class names for use in inline styles or when you need just the class
export const IconClasses = {
  bookings: 'far fa-calendar-check',
  messages: 'far fa-comment-dots',
  favorites: 'far fa-heart',
  profile: 'far fa-user-circle',
  settings: 'fas fa-cog',
  help: 'far fa-question-circle',
  logout: 'fas fa-sign-out-alt',
  dashboard: 'fas fa-th-large',
  analytics: 'far fa-chart-bar',
  invoices: 'far fa-file-alt',
  payments: 'far fa-credit-card',
  reviews: 'far fa-star',
  store: 'fas fa-store',
  services: 'fas fa-concierge-bell',
  calendar: 'far fa-calendar-alt',
  availability: 'far fa-clock',
  portfolio: 'far fa-images',
  team: 'fas fa-users',
  edit: 'far fa-edit',
  delete: 'far fa-trash-alt',
  add: 'far fa-plus-circle',
  close: 'far fa-times-circle',
  check: 'far fa-check-circle',
  search: 'fas fa-search',
  filter: 'fas fa-filter',
  sort: 'fas fa-sort',
  pending: 'far fa-hourglass-half',
  confirmed: 'far fa-check-circle',
  cancelled: 'far fa-times-circle',
  completed: 'fas fa-check-double',
  date: 'far fa-calendar',
  time: 'far fa-clock',
  location: 'fas fa-map-marker-alt',
  guests: 'fas fa-users',
  event: 'fas fa-glass-cheers',
  email: 'far fa-envelope',
  phone: 'fas fa-phone',
  chat: 'far fa-comments',
  notification: 'far fa-bell',
  info: 'far fa-info-circle',
  warning: 'far fa-exclamation-triangle',
  error: 'far fa-exclamation-circle',
  success: 'far fa-check-circle',
  lock: 'fas fa-lock',
  unlock: 'fas fa-unlock',
  eye: 'far fa-eye',
  eyeSlash: 'far fa-eye-slash',
  copy: 'far fa-copy',
  download: 'fas fa-download',
  upload: 'fas fa-upload',
  share: 'fas fa-share-alt',
  link: 'fas fa-link',
  externalLink: 'fas fa-external-link-alt',
  arrowLeft: 'fas fa-arrow-left',
  arrowRight: 'fas fa-arrow-right',
  arrowUp: 'fas fa-arrow-up',
  arrowDown: 'fas fa-arrow-down',
  chevronLeft: 'fas fa-chevron-left',
  chevronRight: 'fas fa-chevron-right',
  chevronUp: 'fas fa-chevron-up',
  chevronDown: 'fas fa-chevron-down',
  trending: 'fas fa-chart-line',
  mostBooked: 'fas fa-chart-line',
  topRated: 'far fa-star',
  instantBook: 'fas fa-bolt',
  guestFavorite: 'fas fa-award',
  verified: 'fas fa-check-circle',
  new: 'fas fa-star',
  cancellation: 'far fa-calendar-times',
  leadTime: 'far fa-hourglass-start',
  refund: 'fas fa-undo',
  // Sidebar specific
  myBookings: 'far fa-calendar-check',
  myFavorites: 'far fa-heart',
  forums: 'far fa-comments',
  blog: 'far fa-newspaper',
  switchMode: 'fas fa-exchange-alt',
  key: 'fas fa-key',
  user: 'far fa-user',
  mapMarker: 'fas fa-map-marker-alt',
  star: 'fas fa-star',
};

export default Icons;
