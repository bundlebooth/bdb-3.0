import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import NotificationDropdown from './NotificationDropdown';
import EnhancedSearchBar from './EnhancedSearchBar';
import WhatsNewSidebar from './WhatsNewSidebar';
import UnifiedSidebar from './UnifiedSidebar';
import { getUnreadNotificationCount, updatePageTitle } from '../utils/notifications';
import { buildBecomeVendorUrl } from '../utils/urlHelpers';
import './EnhancedSearchBar.css';

const Header = memo(function Header({ onSearch, onProfileClick, onWishlistClick, onChatClick, onNotificationsClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Only show search bar and incomplete profile banner on explore/main page
  const isExplorePage = location.pathname === '/' || location.pathname === '' || location.pathname === '/explore';
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesBadge, setFavoritesBadge] = useState(0);
  const [messagesBadge, setMessagesBadge] = useState(0);
  const [notificationsBadge, setNotificationsBadge] = useState(0);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // No longer used - kept for compatibility
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null); // 'live', 'submitted', 'incomplete'
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasVendorProfile, setHasVendorProfile] = useState(false);
  const [vendorLogoUrl, setVendorLogoUrl] = useState(null);
  const notificationBtnRef = useRef(null);
  
  // Get view mode from localStorage
  const getViewMode = () => {
    const stored = localStorage.getItem('viewMode');
    if (stored === 'vendor' || stored === 'client') return stored;
    return currentUser?.isVendor ? 'vendor' : 'client';
  };
  const [isVendorMode, setIsVendorMode] = useState(getViewMode() === 'vendor');
  
  // Listen for viewModeChanged events
  useEffect(() => {
    const handleViewModeChange = () => {
      setIsVendorMode(getViewMode() === 'vendor');
    };
    window.addEventListener('viewModeChanged', handleViewModeChange);
    return () => window.removeEventListener('viewModeChanged', handleViewModeChange);
  }, []);

  // Clear any dashboard hash on mount to prevent auto-opening
  useEffect(() => {
    if (window.location.hash === '#dashboard') {
      window.history.replaceState(null, null, window.location.pathname);
    }

    // Listen for custom dashboard open event - now navigates to dashboard page
    const handleOpenDashboard = (event) => {
      if (currentUser) {
        const section = event?.detail?.section;
        if (section) {
          navigate(`/dashboard?section=${section}`);
        } else {
          navigate('/dashboard');
        }
      }
    };

    // Listen for openUserSidebar event from MobileBottomNav
    const handleOpenUserSidebar = () => {
      if (currentUser) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('openDashboard', handleOpenDashboard);
    window.addEventListener('openUserSidebar', handleOpenUserSidebar);
    return () => {
      window.removeEventListener('openDashboard', handleOpenDashboard);
      window.removeEventListener('openUserSidebar', handleOpenUserSidebar);
    };
  }, [currentUser, navigate]);

  // Scroll detection removed - no animation on scroll

  // Check vendor profile completion status
  useEffect(() => {
    if (!currentUser?.isVendor || !currentUser?.id) {
      setProfileIncomplete(false);
      setProfileStatus(null);
      return;
    }

    const checkProfileStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/vendor/${currentUser.id}/setup-status`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const isComplete = data.allRequiredComplete ?? data?.setupStatus?.allRequiredComplete ?? false;
          const isCompletedFlag = data.isCompletedFlag ?? data?.setupStatus?.isCompletedFlag ?? false;
          const acceptingBookings = data.acceptingBookings ?? data?.setupStatus?.acceptingBookings ?? false;
          
          setProfileIncomplete(!isComplete);
          
          // Determine profile status:
          // - Live: Profile is completed AND accepting bookings (visible to public)
          // - Complete: All required steps done but not yet accepting bookings
          // - Incomplete: Still has required steps to complete
          if (acceptingBookings || isCompletedFlag) {
            setProfileStatus('live');
          } else if (isComplete) {
            setProfileStatus('complete');
          } else {
            setProfileStatus('incomplete');
          }
        }
      } catch (error) {
        console.error('Failed to check profile status:', error);
      }
    };

    checkProfileStatus();
  }, [currentUser]);

  // Check if user has vendor profile
  useEffect(() => {
    if (!currentUser?.id) {
      setHasVendorProfile(false);
      return;
    }
    
    const checkVendorProfile = async () => {
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
      }
    };
    
    checkVendorProfile();
  }, [currentUser]);

  // Load notification badges
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadBadges = async () => {
      try {
        // Load favorites count
        const favResponse = await fetch(`${API_BASE_URL}/favorites/user/${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (favResponse.ok) {
          const favData = await favResponse.json();
          setFavoritesBadge(Array.isArray(favData.favorites) ? favData.favorites.length : 0);
        }

        // Load unread messages count
        const msgResponse = await fetch(`${API_BASE_URL}/messages/unread-count/${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (msgResponse.ok) {
          const msgData = await msgResponse.json();
          setMessagesBadge(msgData.unreadCount || 0);
        }

        // Load notifications count
        const notifCount = await getUnreadNotificationCount(currentUser.id);
        setNotificationsBadge(notifCount);
        updatePageTitle(notifCount);
      } catch (error) {
        console.error('Failed to load badges:', error);
      }
    };

    loadBadges();
    
    // Refresh badges every 30 seconds
    const interval = setInterval(loadBadges, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Load announcement count
  useEffect(() => {
    const loadAnnouncementCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/public/announcements/all`);
        if (response.ok) {
          const data = await response.json();
          const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
          const activeCount = (data.announcements || []).filter(a => !dismissed.includes(a.AnnouncementID)).length;
          setAnnouncementCount(activeCount);
        }
      } catch (error) {
        console.error('Failed to load announcement count:', error);
      }
    };

    loadAnnouncementCount();
    // Refresh every 5 minutes
    const interval = setInterval(loadAnnouncementCount, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleNotificationClick = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
    if (onNotificationsClick) {
      onNotificationsClick();
    }
  };

  const handleNotificationDropdownClose = async () => {
    setNotificationDropdownOpen(false);
    // Refresh notification count after closing
    if (currentUser?.id) {
      const notifCount = await getUnreadNotificationCount(currentUser.id);
      setNotificationsBadge(notifCount);
      updatePageTitle(notifCount);
    }
  };

  return (
    <>
    <header className="header">
      <div className="header-inner page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="logo" style={{ cursor: 'pointer', marginRight: '8px' }} onClick={() => window.location.href = '/'}>
          <img src="/images/logo.png" alt="PlanBeau" className="header-logo-img" />
        </div>
        
      </div>

      {isExplorePage && (
        <div className="search-container">
          <EnhancedSearchBar 
            onSearch={onSearch} 
            isScrolled={isScrolled}
          />
        </div>
      )}

      <div className="user-nav">
        {!currentUser?.isVendor && (
          <button 
            className="become-vendor-btn"
            onClick={() => {
              const url = buildBecomeVendorUrl({ source: 'header', ref: 'homepage' });
              navigate(url);
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: 'var(--text)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginRight: '0.5rem'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f7f7f7'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Become A Vendor
          </button>
        )}
        {(currentUser?.isAdmin === true || currentUser?.isAdmin === 1 || currentUser?.IsAdmin === true || currentUser?.IsAdmin === 1) && (
          <button 
            className="admin-dashboard-btn"
            onClick={() => navigate('/admin/dashboard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e3f2fd',
              color: '#1565c0',
              border: '1px solid #90caf9',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginRight: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#bbdefb';
              e.target.style.borderColor = '#64b5f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#e3f2fd';
              e.target.style.borderColor = '#90caf9';
            }}
          >
            <i className="fas fa-tachometer-alt" style={{ fontSize: '0.9rem' }}></i>
            Admin Dashboard
          </button>
        )}
        {/* What's New Button */}
        <div 
          className="nav-icon" 
          id="whats-new-btn" 
          onClick={() => {
            setWhatsNewOpen(true);
          }}
          title="What's New"
          style={{ position: 'relative', cursor: 'pointer' }}
        >
          <i className="fas fa-bullhorn"></i>
          {announcementCount > 0 && (
            <span
              className="badge"
              style={{ display: 'grid' }}
            >
              {announcementCount > 9 ? '9+' : announcementCount}
            </span>
          )}
        </div>
        {/* Heart and Chat icons removed as per user request */}
        <div 
          ref={notificationBtnRef}
          className="nav-icon" 
          id="notifications-btn" 
          onClick={handleNotificationClick}
          style={{ cursor: 'pointer', position: 'relative', overflow: 'visible' }}
        >
          <i className="fas fa-bell"></i>
          <span
            className="notification-count-badge"
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-8px',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              borderRadius: '50%',
              display: notificationsBadge > 0 ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              zIndex: 10,
              lineHeight: 1
            }}
          >
            {notificationsBadge > 99 ? '99+' : notificationsBadge}
          </span>
        </div>
        {/* User menu button - hamburger + avatar like dashboard - hidden on mobile via CSS */}
        <div
          className="user-menu-button"
          onClick={() => currentUser ? setSidebarOpen(true) : onProfileClick()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '5px 5px 5px 12px',
            border: '1px solid #ddd',
            borderRadius: '24px',
            cursor: 'pointer',
            backgroundColor: 'white',
            transition: 'box-shadow 0.2s',
            position: 'relative',
            height: '42px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <i className="fas fa-bars" style={{ fontSize: '14px', color: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '16px' }}></i>
          {/* Show profile pic based on mode */}
          {(isVendorMode && vendorLogoUrl) || currentUser?.profilePicture ? (
            <img
              src={isVendorMode && vendorLogoUrl ? vendorLogoUrl : currentUser?.profilePicture}
              alt="Profile"
              style={{
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                objectFit: 'cover',
                position: 'relative',
                border: '1px solid #e0e0e0'
              }}
            />
          ) : (
            <div
              style={{
                backgroundColor: currentUser ? 'var(--primary)' : '#717171',
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600,
                position: 'relative'
              }}
            >
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : <i className="fas fa-user" style={{ fontSize: '14px' }}></i>}
            </div>
          )}
          {/* Exclamation mark indicator for incomplete profile - only show if NOT live */}
          {profileIncomplete && profileStatus !== 'live' && (
            <div
              style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                color: 'white',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              !
            </div>
          )}
        </div>
      </div>
      </div>

      
      {/* Notification Dropdown */}
      <NotificationDropdown 
        isOpen={notificationDropdownOpen} 
        onClose={handleNotificationDropdownClose}
        anchorEl={notificationBtnRef.current}
      />
    </header>
    
    {/* Unified Sidebar Component */}
    <UnifiedSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    
    {/* What's New Sidebar - Rendered outside header for proper z-index */}
    <WhatsNewSidebar 
      isOpen={whatsNewOpen} 
      onClose={() => setWhatsNewOpen(false)} 
    />
    </>
  );
});

export default Header;
