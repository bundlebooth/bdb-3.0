import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import './UnifiedSidebar.css';

function UnifiedSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  const [hasVendorProfile, setHasVendorProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);
  const [vendorLogoUrl, setVendorLogoUrl] = useState(null);
  const [notificationCounts, setNotificationCounts] = useState({
    pendingBookings: 0,
    unreadMessages: 0,
    pendingReviews: 0
  });
  
  // Get view mode from localStorage
  const getViewMode = () => {
    const stored = localStorage.getItem('viewMode');
    if (stored === 'vendor' || stored === 'client') return stored;
    return currentUser?.isVendor ? 'vendor' : 'client';
  };
  
  const [isVendorMode, setIsVendorMode] = useState(getViewMode() === 'vendor');

  // Get current section from URL
  const currentSection = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('section') || 'dashboard';
  }, [location.search]);

  // Sync with localStorage on mount and when it changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsVendorMode(getViewMode() === 'vendor');
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('viewModeChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('viewModeChanged', handleStorageChange);
    };
  }, []);

  // Check vendor profile status
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const checkVendorProfile = async () => {
      try {
        // First get vendor profile for logo
        const response = await fetch(`${API_BASE_URL}/vendors/profile?userId=${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHasVendorProfile(!!data.vendorProfileId);
          
          // Get logo URL
          const logoUrl = data.logoUrl || data.LogoURL || data.data?.profile?.LogoURL || data.data?.profile?.logoUrl;
          if (logoUrl) {
            setVendorLogoUrl(logoUrl);
          }
        }
        
        // Then check setup status for accurate live/incomplete status
        if (currentUser?.isVendor) {
          const statusResponse = await fetch(`${API_BASE_URL}/vendor/${currentUser.id}/setup-status`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            const isComplete = statusData.allRequiredComplete ?? statusData?.setupStatus?.allRequiredComplete ?? false;
            const acceptingBookings = statusData.acceptingBookings ?? statusData?.setupStatus?.acceptingBookings ?? false;
            const isCompletedFlag = statusData.isCompletedFlag ?? statusData?.setupStatus?.isCompletedFlag ?? false;
            
            if (acceptingBookings || isCompletedFlag) {
              setProfileStatus('live');
            } else if (isComplete) {
              setProfileStatus('complete');
            } else {
              setProfileStatus('incomplete');
            }
          }
        }
      } catch (error) {
        console.error('Failed to check vendor profile:', error);
      }
    };
    
    checkVendorProfile();
  }, [currentUser?.id, currentUser?.isVendor]);

  // Load notification counts
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const loadNotificationCounts = async () => {
      try {
        let pendingBookings = 0;
        let unreadMessages = 0;
        let pendingReviews = 0;
        
        // Get pending bookings count based on mode (use state, not localStorage)
        if (isVendorMode && currentUser?.vendorProfileId) {
          // Vendor: count pending requests
          const bookingsResp = await fetch(`${API_BASE_URL}/vendor/${currentUser.vendorProfileId}/bookings/all`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (bookingsResp.ok) {
            const bookings = await bookingsResp.json();
            pendingBookings = (bookings || []).filter(b => 
              (b.Status || '').toLowerCase() === 'pending'
            ).length;
          }
        } else {
          // Client: count pending bookings
          const bookingsResp = await fetch(`${API_BASE_URL}/users/${currentUser.id}/bookings/all`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (bookingsResp.ok) {
            const bookings = await bookingsResp.json();
            pendingBookings = (bookings || []).filter(b => 
              (b.Status || '').toLowerCase() === 'pending'
            ).length;
            
            // Calculate pending reviews (past paid bookings not yet reviewed)
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
        }
        
        // Get unread messages count from both client and vendor conversations
        // Client conversations
        try {
          const clientMsgResp = await fetch(`${API_BASE_URL}/messages/conversations/user/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (clientMsgResp.ok) {
            const data = await clientMsgResp.json();
            const convs = data.conversations || data || [];
            const clientUnread = convs.reduce((sum, c) => {
              const count = c.unreadCount || c.UnreadCount || c.unread_count || c.Unread || 0;
              return sum + (typeof count === 'number' ? count : parseInt(count) || 0);
            }, 0);
            unreadMessages += clientUnread;
          }
        } catch (e) { console.error('Error fetching client messages:', e); }
        
        // Vendor conversations (if vendor)
        if (currentUser?.vendorProfileId) {
          try {
            const vendorMsgResp = await fetch(`${API_BASE_URL}/messages/conversations/vendor/${currentUser.vendorProfileId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (vendorMsgResp.ok) {
              const data = await vendorMsgResp.json();
              const convs = data.conversations || data || [];
              const vendorUnread = convs.reduce((sum, c) => {
                const count = c.unreadCount || c.UnreadCount || c.unread_count || c.Unread || 0;
                return sum + (typeof count === 'number' ? count : parseInt(count) || 0);
              }, 0);
              unreadMessages += vendorUnread;
            }
          } catch (e) { console.error('Error fetching vendor messages:', e); }
        }
        
        setNotificationCounts({ pendingBookings, unreadMessages, pendingReviews });
      } catch (error) {
        console.error('Error loading notification counts:', error);
      }
    };
    
    loadNotificationCounts();
    
    // Refresh counts every 30 seconds when sidebar is open
    const interval = setInterval(loadNotificationCounts, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.vendorProfileId, isVendorMode]);

  const handleToggleViewMode = () => {
    const newMode = isVendorMode ? 'client' : 'vendor';
    localStorage.setItem('viewMode', newMode);
    setIsVendorMode(!isVendorMode);
    
    // Dispatch event so other components can react immediately
    window.dispatchEvent(new CustomEvent('viewModeChanged', { detail: { mode: newMode } }));
    
    // Don't close sidebar - let user continue navigating
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    // Clear all localStorage items first
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userSession');
    localStorage.removeItem('viewMode');
    
    // Call AuthContext logout to clear state
    if (logout) {
      logout();
    }
    
    // Force full page reload to home
    window.location.replace('/');
  };

  // Get profile picture based on mode
  const getProfilePicture = () => {
    if (isVendorMode && vendorLogoUrl) {
      return vendorLogoUrl;
    }
    return currentUser?.profilePicture || currentUser?.ProfilePicture;
  };

  const profilePic = getProfilePicture();

  if (!isOpen || !currentUser) return null;

  return (
    <>
      <div className="unified-sidebar-overlay" onClick={onClose} />
      <div className="unified-sidebar">
        {/* Close button */}
        <button className="unified-sidebar-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        
        {/* User info */}
        <div className="unified-sidebar-user-info">
          {profilePic ? (
            <img 
              src={profilePic} 
              alt="Profile"
              className="unified-sidebar-avatar"
            />
          ) : (
            <div className="unified-sidebar-avatar-placeholder">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="unified-sidebar-user-details">
            <div className="unified-sidebar-user-name">{currentUser?.name}</div>
            <div className="unified-sidebar-user-email">{currentUser?.email}</div>
            <div className="unified-sidebar-user-mode">
              {isVendorMode ? 'Vendor Mode' : 'Client Mode'}
            </div>
          </div>
        </div>
        
        {/* Account section with toggle */}
        <div className="unified-sidebar-section">
          <div className="unified-sidebar-section-title">ACCOUNT</div>
          {hasVendorProfile ? (
            /* User has vendor profile - show toggle between modes */
            <>
              <div 
                className="unified-sidebar-toggle-item"
                onClick={handleToggleViewMode}
              >
                <div className="unified-sidebar-toggle-label">
                  <i className="fas fa-exchange-alt"></i>
                  <span>Switch to {isVendorMode ? 'Client' : 'Vendor'}</span>
                </div>
                <div className={`unified-sidebar-toggle ${isVendorMode ? 'active' : ''}`}>
                  <div className="unified-sidebar-toggle-knob" />
                </div>
              </div>
              
              {/* Profile Setup Status - only for vendors */}
              <button 
                className="unified-sidebar-item"
                onClick={() => handleNavigate('/become-a-vendor/setup?step=account')}
              >
                <i className="fas fa-user-check"></i>
                <span>Profile Setup</span>
                {!profileStatus ? (
                  <div className="spinner" style={{ width: '16px', height: '16px', marginLeft: 'auto', borderWidth: '2px' }}></div>
                ) : (
                  <span className={`unified-sidebar-status-badge ${profileStatus}`}>
                    {profileStatus === 'live' && 'Live'}
                    {profileStatus === 'submitted' && 'Pending'}
                    {profileStatus === 'incomplete' && 'Incomplete'}
                  </span>
                )}
              </button>
            </>
          ) : (
            /* Client-only user - show option to become a vendor */
            <button 
              className="unified-sidebar-item"
              onClick={() => handleNavigate('/become-a-vendor')}
            >
              <i className="fas fa-store"></i>
              <span>Become a Vendor</span>
              <i className="fas fa-arrow-right" style={{ marginLeft: 'auto', fontSize: '12px', color: '#9CA3AF' }}></i>
            </button>
          )}
        </div>
        
        {/* Actions section */}
        <div className="unified-sidebar-section">
          <div className="unified-sidebar-section-title">ACTIONS</div>
          <button className="unified-sidebar-item" onClick={() => handleNavigate('/')}>
            <i className="fas fa-compass"></i>
            <span>Explore Vendors</span>
          </button>
          <button className="unified-sidebar-item" onClick={() => handleNavigate('/forum')}>
            <i className="fas fa-comments"></i>
            <span>Forum</span>
          </button>
          <button className="unified-sidebar-item" onClick={() => handleNavigate('/blog')}>
            <i className="fas fa-newspaper"></i>
            <span>Blog</span>
          </button>
        </div>
        
        {/* Dashboard section */}
        <div className="unified-sidebar-section">
          <div className="unified-sidebar-section-title">DASHBOARD</div>
          <button className={`unified-sidebar-item ${currentSection === 'dashboard' || currentSection === 'vendor-dashboard' ? 'active' : ''}`} onClick={() => handleNavigate('/dashboard?section=dashboard')}>
            {(currentSection === 'dashboard' || currentSection === 'vendor-dashboard') && <span className="unified-sidebar-active-dot"></span>}
            <i className="fas fa-layer-group"></i>
            <span>Dashboard</span>
          </button>
          <button className={`unified-sidebar-item ${currentSection === 'bookings' || currentSection === 'vendor-requests' ? 'active' : ''}`} onClick={() => handleNavigate('/dashboard?section=bookings')}>
            {(currentSection === 'bookings' || currentSection === 'vendor-requests') && <span className="unified-sidebar-active-dot"></span>}
            <i className="fas fa-calendar-check"></i>
            <span>Bookings</span>
            {notificationCounts.pendingBookings > 0 && (
              <span className="unified-sidebar-badge">{notificationCounts.pendingBookings}</span>
            )}
          </button>
          <button className={`unified-sidebar-item ${currentSection === 'messages' ? 'active' : ''}`} onClick={() => handleNavigate('/dashboard?section=messages')}>
            {currentSection === 'messages' && <span className="unified-sidebar-active-dot"></span>}
            <i className="fas fa-comments"></i>
            <span>Messages</span>
            {notificationCounts.unreadMessages > 0 && (
              <span className="unified-sidebar-badge">{notificationCounts.unreadMessages}</span>
            )}
          </button>
          <button className={`unified-sidebar-item ${currentSection === 'invoices' || currentSection === 'vendor-invoices' ? 'active' : ''}`} onClick={() => handleNavigate('/dashboard?section=invoices')}>
            {(currentSection === 'invoices' || currentSection === 'vendor-invoices') && <span className="unified-sidebar-active-dot"></span>}
            <i className="fas fa-file-invoice-dollar"></i>
            <span>Invoices</span>
          </button>
          <button className={`unified-sidebar-item ${currentSection === 'favorites' ? 'active' : ''}`} onClick={() => handleNavigate('/dashboard?section=favorites')}>
            {currentSection === 'favorites' && <span className="unified-sidebar-active-dot"></span>}
            <i className="fas fa-heart"></i>
            <span>Favorites</span>
          </button>
          <button className={`unified-sidebar-item ${currentSection === 'reviews' || currentSection === 'vendor-reviews' ? 'active' : ''}`} onClick={() => handleNavigate('/dashboard?section=reviews')}>
            {(currentSection === 'reviews' || currentSection === 'vendor-reviews') && <span className="unified-sidebar-active-dot"></span>}
            <i className="fas fa-star"></i>
            <span>Reviews</span>
            {notificationCounts.pendingReviews > 0 && (
              <span className="unified-sidebar-badge">{notificationCounts.pendingReviews}</span>
            )}
          </button>
          {hasVendorProfile && (
            <>
              <button className={`unified-sidebar-item ${currentSection === 'vendor-business-profile' ? 'active' : ''}`} onClick={() => handleNavigate('/dashboard?section=business-profile')}>
                {currentSection === 'vendor-business-profile' && <span className="unified-sidebar-active-dot"></span>}
                <i className="fas fa-store"></i>
                <span>Business Profile</span>
              </button>
              <button className={`unified-sidebar-item ${currentSection === 'vendor-analytics' ? 'active' : ''}`} onClick={() => handleNavigate('/dashboard?section=analytics')}>
                {currentSection === 'vendor-analytics' && <span className="unified-sidebar-active-dot"></span>}
                <i className="fas fa-chart-line"></i>
                <span>Analytics</span>
              </button>
            </>
          )}
          <button className={`unified-sidebar-item ${currentSection === 'settings' || currentSection === 'vendor-settings' ? 'active' : ''}`} onClick={() => handleNavigate('/dashboard?section=settings')}>
            {(currentSection === 'settings' || currentSection === 'vendor-settings') && <span className="unified-sidebar-active-dot"></span>}
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </button>
        </div>
        
        {/* Log Out */}
        <div className="unified-sidebar-section">
          <button className="unified-sidebar-item logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default UnifiedSidebar;
