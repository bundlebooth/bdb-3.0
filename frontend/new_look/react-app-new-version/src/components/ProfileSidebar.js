import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { useTranslation } from '../hooks/useTranslation';
import { buildBecomeVendorUrl } from '../utils/urlHelpers';
import { encodeUserId } from '../utils/hashIds';
import './ProfileSidebar.css';

/**
 * Airbnb-Style Profile Sidebar
 * 
 * For Clients: Elegant profile menu with quick actions, "Become a Vendor" promo
 * For Vendors: Same elegant menu PLUS "Switch to hosting" button at bottom
 * 
 * This is NOT a dashboard - it's a lightweight profile menu like Airbnb's
 */
function ProfileSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  
  const [hasVendorProfile, setHasVendorProfile] = useState(false);
  const [vendorCheckLoading, setVendorCheckLoading] = useState(true);
  const [notificationCounts, setNotificationCounts] = useState({
    pendingBookings: 0,
    unreadMessages: 0,
    pendingReviews: 0
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [vendorLogoUrl, setVendorLogoUrl] = useState(null);
  const [userProfilePic, setUserProfilePic] = useState(null);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);

  // Check vendor profile status and get logo
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const checkVendorProfile = async () => {
      setVendorCheckLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/vendors/profile?userId=${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHasVendorProfile(!!data.vendorProfileId);
          
          // Get vendor logo URL
          const logoUrl = data.logoUrl || data.LogoURL || data.data?.profile?.LogoURL || data.data?.profile?.logoUrl;
          if (logoUrl) {
            setVendorLogoUrl(logoUrl);
          }
        }
      } catch (error) {
        console.error('Failed to check vendor profile:', error);
      } finally {
        setVendorCheckLoading(false);
      }
    };
    
    checkVendorProfile();
  }, [currentUser?.id]);

  // Fetch user profile picture
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/profile`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          const pic = data.ProfilePicture || data.profilePicture || data.ProfileImageURL || data.profileImageUrl;
          if (pic) {
            setUserProfilePic(pic);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [currentUser?.id]);

  // Load notification counts
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const loadNotificationCounts = async () => {
      try {
        let unreadMessages = 0;
        let pendingReviews = 0;
        
        // Get unread messages count
        try {
          const clientMsgResp = await fetch(`${API_BASE_URL}/messages/conversations/user/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (clientMsgResp.ok) {
            const data = await clientMsgResp.json();
            const convs = data.conversations || data || [];
            unreadMessages = convs.reduce((sum, c) => {
              const count = c.unreadCount || c.UnreadCount || c.unread_count || c.Unread || 0;
              return sum + (typeof count === 'number' ? count : parseInt(count) || 0);
            }, 0);
          }
        } catch (e) { console.error('Error fetching messages:', e); }
        
        // Get pending reviews count
        try {
          const bookingsResp = await fetch(`${API_BASE_URL}/users/${currentUser.id}/bookings/all`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (bookingsResp.ok) {
            const bookings = await bookingsResp.json();
            const reviewsResp = await fetch(`${API_BASE_URL}/users/${currentUser.id}/reviews`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const reviewsData = reviewsResp.ok ? await reviewsResp.json() : [];
            const reviewedBookingIds = new Set((Array.isArray(reviewsData) ? reviewsData : []).map(r => r.BookingID));
            const now = new Date();
            pendingReviews = (bookings || []).filter(b => {
              const eventDate = new Date(b.EventDate);
              const isPast = eventDate < now;
              const isPaid = b.FullAmountPaid === true || b.FullAmountPaid === 1 || 
                           (b.Status || '').toLowerCase() === 'paid';
              const notReviewed = !reviewedBookingIds.has(b.BookingID);
              return isPast && isPaid && notReviewed;
            }).length;
          }
        } catch (e) { console.error('Error fetching reviews:', e); }
        
        setNotificationCounts({ pendingBookings: 0, unreadMessages, pendingReviews });
      } catch (error) {
        console.error('Error loading notification counts:', error);
      }
    };
    
    loadNotificationCounts();
  }, [currentUser?.id]);

  // Fetch notifications when opening notifications view
  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    setNotificationsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/user/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
    fetchNotifications();
  };

  const handleBackFromNotifications = () => {
    setShowNotifications(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userSession');
    localStorage.removeItem('viewMode');
    
    if (logout) {
      logout();
    }
    
    window.location.replace('/');
  };

  const profilePic = userProfilePic || currentUser?.profilePicture || currentUser?.ProfilePicture || vendorLogoUrl;

  if (!isOpen || !currentUser) return null;

  // Notifications View (like Image 2)
  if (showNotifications) {
    return (
      <>
        <div className="profile-sidebar-overlay" onClick={onClose} />
        <div className="profile-sidebar">
          {/* Notifications Header */}
          <div className="profile-sidebar-header">
            <button className="profile-sidebar-back-btn" onClick={handleBackFromNotifications}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div style={{ flex: 1 }}></div>
            <button className="profile-sidebar-close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="profile-sidebar-content">
            <h2 className="profile-sidebar-page-title">Notifications</h2>
            
            {notificationsLoading ? (
              <div className="notifications-loading">
                <div className="spinner"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">
                <div className="notifications-empty-icon">
                  <i className="fas fa-bell"></i>
                </div>
                <h3>No notifications yet</h3>
                <p>You've got a blank slate (for now). We'll let you know when updates arrive.</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notification, index) => {
                  // Safely extract notification text
                  const notificationText = typeof notification.message === 'string' ? notification.message 
                    : typeof notification.Message === 'string' ? notification.Message 
                    : typeof notification.title === 'string' ? notification.title 
                    : 'New notification';
                  
                  // Safely format the date
                  const rawDate = notification.createdAt || notification.CreatedAt || notification.created_at;
                  let formattedTime = '';
                  if (rawDate) {
                    try {
                      const date = new Date(rawDate);
                      if (!isNaN(date.getTime())) {
                        formattedTime = date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      }
                    } catch (e) {
                      formattedTime = typeof rawDate === 'string' ? rawDate : '';
                    }
                  }
                  
                  const notificationType = notification.type || notification.Type || 'general';
                  
                  // Get icon and color based on notification type - realistic/intuitive colors
                  const getNotificationStyle = (type) => {
                    const styles = {
                      'message': { icon: 'fa-envelope', iconColor: '#5086E8' },      // Blue envelope
                      'new_message': { icon: 'fa-envelope', iconColor: '#5086E8' },  // Blue envelope
                      'booking': { icon: 'fa-calendar-plus', iconColor: '#5086E8' }, // Blue calendar
                      'booking_request': { icon: 'fa-calendar-plus', iconColor: '#5086E8' }, // Blue calendar
                      'booking_approved': { icon: 'fa-check-circle', iconColor: '#10b981' }, // Green checkmark
                      'booking_confirmed': { icon: 'fa-check-circle', iconColor: '#10b981' }, // Green checkmark
                      'booking_declined': { icon: 'fa-times-circle', iconColor: '#ef4444' }, // Red X
                      'booking_cancelled': { icon: 'fa-ban', iconColor: '#ef4444' },  // Red ban
                      'booking_reminder': { icon: 'fa-bell', iconColor: '#f59e0b' },  // Yellow bell for reminder
                      'payment': { icon: 'fa-credit-card', iconColor: '#10b981' },   // Green credit card
                      'payment_received': { icon: 'fa-dollar-sign', iconColor: '#10b981' }, // Green dollar
                      'invoice': { icon: 'fa-file-invoice-dollar', iconColor: '#8b5cf6' }, // Purple invoice
                      'review': { icon: 'fa-star', iconColor: '#f59e0b' },            // Yellow/gold star
                      'promotion': { icon: 'fa-tag', iconColor: '#f97316' },          // Orange tag
                      'announcement': { icon: 'fa-bullhorn', iconColor: '#f97316' },  // Orange megaphone
                      'general': { icon: 'fa-bell', iconColor: '#f59e0b' },           // Yellow bell
                    };
                    return styles[type] || { icon: 'fa-bell', iconColor: '#f59e0b' }; // Default yellow bell
                  };
                  
                  const notifStyle = getNotificationStyle(notificationType);
                  
                  return (
                    <div key={notification.id || notification.ID || index} className="notification-item">
                      <div className="notification-icon" style={{ background: 'rgba(80, 134, 232, 0.15)' }}>
                        <i className={`fas ${notifStyle.icon}`} style={{ color: notifStyle.iconColor }}></i>
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">{notificationText}</p>
                        <span className="notification-time">{formattedTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Profile View - Clean Airbnb style
  return (
    <>
      <div className="profile-sidebar-overlay" onClick={onClose} />
      <div className="profile-sidebar">
        {/* Header with notification bell and close button */}
        <div className="profile-sidebar-header">
          <h1 className="profile-sidebar-title">Profile</h1>
          <div className="profile-sidebar-header-actions">
            <button 
              className="profile-sidebar-icon-btn" 
              onClick={handleNotificationClick}
              aria-label="Notifications"
            >
              <i className="far fa-bell"></i>
              {(notificationCounts.unreadMessages > 0 || notificationCounts.pendingBookings > 0) && (
                <span className="notification-dot"></span>
              )}
            </button>
            <button 
              className="profile-sidebar-icon-btn profile-sidebar-close" 
              onClick={onClose}
              aria-label="Close"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        {/* Scrollable content wrapper */}
        <div className="profile-sidebar-scroll-content">
        
        {/* Profile Card - Clickable to view full profile */}
        <div 
          className="profile-sidebar-card"
          onClick={() => handleNavigate(`/profile/${encodeUserId(currentUser?.id)}`)}
        >
          <div className="profile-sidebar-avatar-container">
            {profilePic ? (
              <img 
                src={profilePic} 
                alt="Profile"
                className="profile-sidebar-avatar"
              />
            ) : (
              <div className="profile-sidebar-avatar-placeholder">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="profile-sidebar-user-name">{currentUser?.name}</div>
          <div className="profile-sidebar-view-profile">View your profile</div>
        </div>
        
        {/* Quick Action Cards - With images */}
        <div className="profile-sidebar-quick-actions">
          <div 
            className="profile-sidebar-action-card"
            onClick={() => handleNavigate('/client/bookings')}
          >
            <div className="action-card-icon-wrapper">
              <img src="/images/sidebar/dfdbccc2-9ef2-409b-9b34-f3d71058dbe4.avif" alt="My Bookings" className="action-card-img" />
            </div>
            <span className="action-card-label">My Bookings</span>
            {notificationCounts.pendingBookings > 0 && (
              <span className="action-card-badge">NEW</span>
            )}
          </div>
          <div 
            className="profile-sidebar-action-card"
            onClick={() => handleNavigate('/client/favorites')}
          >
            <div className="action-card-icon-wrapper">
              <img src="/images/sidebar/297263db-3cc6-45b5-97b6-5c4537a15be4.avif" alt="Favorites" className="action-card-img" />
            </div>
            <span className="action-card-label">Favorites</span>
          </div>
        </div>
        
        {/* Become a Vendor Promo Card (only for non-vendors) */}
        {vendorCheckLoading ? (
          <div className="profile-sidebar-promo-card" style={{ justifyContent: 'center' }}>
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }}></div>
          </div>
        ) : !hasVendorProfile && (
          <div 
            className="profile-sidebar-promo-card"
            onClick={() => {
              const url = buildBecomeVendorUrl({ source: 'sidebar', ref: 'profile' });
              handleNavigate(url);
            }}
          >
            <div className="promo-card-image">
              <img src="/images/become-vendor-promo.svg" alt="" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              <div className="promo-card-icon-fallback" style={{ display: 'none' }}>
                <i className="fas fa-store"></i>
              </div>
            </div>
            <div className="promo-card-content">
              <div className="promo-card-title">Become a vendor</div>
              <div className="promo-card-subtitle">It's easy to start hosting and earn extra income.</div>
            </div>
            <i className="fas fa-chevron-right promo-card-arrow"></i>
          </div>
        )}
        
        {/* Menu Items */}
        <div className="profile-sidebar-menu">
          {/* View Profile */}
          <button className="profile-sidebar-menu-item" onClick={() => handleNavigate(`/profile/${encodeUserId(currentUser?.id)}`)}>
            <i className="far fa-user-circle"></i>
            <span>View Profile</span>
            <i className="fas fa-chevron-right menu-item-arrow"></i>
          </button>
          
          {/* Account Settings */}
          <button className="profile-sidebar-menu-item" onClick={() => handleNavigate('/client/settings')}>
            <i className="fas fa-cog"></i>
            <span>Settings</span>
            <i className="fas fa-chevron-right menu-item-arrow"></i>
          </button>
          
          {/* Help Centre */}
          <button className="profile-sidebar-menu-item" onClick={() => handleNavigate('/help-centre')}>
            <i className="far fa-question-circle"></i>
            <span>Help Centre</span>
            <i className="fas fa-chevron-right menu-item-arrow"></i>
          </button>
          
          <div className="profile-sidebar-menu-divider"></div>
          
          {/* Forums */}
          <button className="profile-sidebar-menu-item" onClick={() => handleNavigate('/forum')}>
            <i className="far fa-comments"></i>
            <span>Forums</span>
            <i className="fas fa-chevron-right menu-item-arrow"></i>
          </button>
          
          {/* Blogs */}
          <button className="profile-sidebar-menu-item" onClick={() => handleNavigate('/blog')}>
            <i className="fas fa-newspaper"></i>
            <span>Blog</span>
            <i className="fas fa-chevron-right menu-item-arrow"></i>
          </button>
          
          <div className="profile-sidebar-menu-divider"></div>
          
          {/* Log out */}
          <button className="profile-sidebar-menu-item" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Log out</span>
            <i className="fas fa-chevron-right menu-item-arrow"></i>
          </button>
        </div>
        
        </div>{/* End of profile-sidebar-scroll-content */}
        
        {/* Switch to hosting button - Fixed at bottom for vendors */}
        {hasVendorProfile && (
          <div className="profile-sidebar-footer">
            <button 
              className="profile-sidebar-switch-btn"
              onClick={() => {
                // Set vendor mode and navigate to vendor dashboard
                localStorage.setItem('viewMode', 'vendor');
                window.dispatchEvent(new CustomEvent('viewModeChanged', { detail: { mode: 'vendor' } }));
                handleNavigate('/dashboard?section=vendor-dashboard');
              }}
            >
              <i className="fas fa-sync-alt"></i>
              <span>Switch to hosting</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default ProfileSidebar;
