import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import DashboardModal from './DashboardModal';
import NotificationDropdown from './NotificationDropdown';
import EnhancedSearchBar from './EnhancedSearchBar';
import WhatsNewSidebar from './WhatsNewSidebar';
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
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // No longer used - kept for compatibility
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const notificationBtnRef = useRef(null);

  // Clear any dashboard hash on mount to prevent auto-opening
  useEffect(() => {
    if (window.location.hash === '#dashboard') {
      window.history.replaceState(null, null, window.location.pathname);
    }

    // Listen for custom dashboard open event
    const handleOpenDashboard = () => {
      if (currentUser) {
        setDashboardOpen(true);
      }
    };

    window.addEventListener('openDashboard', handleOpenDashboard);
    return () => window.removeEventListener('openDashboard', handleOpenDashboard);
  }, [currentUser]);

  // Scroll detection removed - no animation on scroll

  // Check vendor profile completion status
  useEffect(() => {
    if (!currentUser?.isVendor || !currentUser?.id) {
      setProfileIncomplete(false);
      return;
    }

    const checkProfileStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/vendor/${currentUser.id}/setup-status`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const isComplete = data.allRequiredComplete ?? data?.setupStatus?.allRequiredComplete;
          setProfileIncomplete(!isComplete);
        }
      } catch (error) {
        console.error('Failed to check profile status:', error);
      }
    };

    checkProfileStatus();
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
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="logo" style={{ cursor: 'pointer', marginRight: '8px' }} onClick={() => window.location.href = '/'}>
          <img src="/images/logo.png" alt="PlanBeau" className="header-logo-img" />
        </div>
        
        {/* Page Tabs - Explore / Forum - Integrated into header */}
        <div className="header-nav-tabs" style={{ 
          display: 'flex', 
          gap: '2px',
          background: '#f3f4f6',
          borderRadius: '10px',
          padding: '4px'
        }}>
          <button
            onClick={() => navigate('/')}
            className="header-nav-tab"
            style={{
              padding: '8px 18px',
              background: location.pathname === '/' || location.pathname === '/explore' ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: location.pathname === '/' || location.pathname === '/explore' ? '#111827' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: location.pathname === '/' || location.pathname === '/explore' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <i className="fas fa-compass" style={{ fontSize: '13px' }}></i>
            <span className="nav-tab-text">Explore</span>
          </button>
          <button
            onClick={() => navigate('/forum')}
            className="header-nav-tab"
            style={{
              padding: '8px 18px',
              background: location.pathname.startsWith('/forum') ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: location.pathname.startsWith('/forum') ? '#111827' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: location.pathname.startsWith('/forum') ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <i className="fas fa-comments" style={{ fontSize: '13px' }}></i>
            <span className="nav-tab-text">Forum</span>
          </button>
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
        {currentUser?.isVendor && profileIncomplete && isExplorePage && (
          <button 
            className="complete-profile-btn"
            onClick={() => {
              // Force open in new tab to avoid state conflicts
              const url = buildBecomeVendorUrl({ source: 'header', ref: 'complete_profile' });
              window.open(url, '_blank');
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#fff8e1',
              color: '#f57c00',
              border: '1px solid #ffe0b2',
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
              e.target.style.backgroundColor = '#ffecb3';
              e.target.style.borderColor = '#ffcc80';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff8e1';
              e.target.style.borderColor = '#ffe0b2';
            }}
          >
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '0.9rem' }}></i>
            Complete Profile Setup
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
          style={{ cursor: 'pointer' }}
        >
          <i className="fas fa-bell"></i>
          <span
            className="badge"
            id="notifications-badge"
            style={{ display: notificationsBadge > 0 ? 'grid' : 'none' }}
          >
            {notificationsBadge}
          </span>
        </div>
        <div
          className="nav-icon"
          id="profile-btn"
          onClick={() => currentUser ? setDashboardOpen(true) : onProfileClick()}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'S'}
        </div>
      </div>

      {/* Dashboard Modal */}
      <DashboardModal 
        isOpen={dashboardOpen} 
        onClose={() => setDashboardOpen(false)} 
      />
      
      {/* Notification Dropdown */}
      <NotificationDropdown 
        isOpen={notificationDropdownOpen} 
        onClose={handleNotificationDropdownClose}
        anchorEl={notificationBtnRef.current}
      />
    </header>
    
    {/* What's New Sidebar - Rendered outside header for proper z-index */}
    <WhatsNewSidebar 
      isOpen={whatsNewOpen} 
      onClose={() => setWhatsNewOpen(false)} 
    />
    </>
  );
});

export default Header;
