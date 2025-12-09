import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import DashboardModal from './DashboardModal';
import NotificationDropdown from './NotificationDropdown';
import EnhancedSearchBar from './EnhancedSearchBar';
import { getUnreadNotificationCount, updatePageTitle } from '../utils/notifications';
import { buildBecomeVendorUrl } from '../utils/urlHelpers';
import './EnhancedSearchBar.css';

const Header = memo(function Header({ onSearch, onProfileClick, onWishlistClick, onChatClick, onNotificationsClick }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesBadge, setFavoritesBadge] = useState(0);
  const [messagesBadge, setMessagesBadge] = useState(0);
  const [notificationsBadge, setNotificationsBadge] = useState(0);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const notificationBtnRef = useRef(null);

  // Clear any dashboard hash on mount to prevent auto-opening
  useEffect(() => {
    if (window.location.hash === '#dashboard') {
      console.log('Clearing dashboard hash to prevent auto-open');
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

  // Handle scroll to shrink/expand header
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          setIsScrolled(scrollTop > 1); // Shrink immediately on any scroll
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
        <img src="/planhive_logo.svg" alt="PlanHive" style={{ height: '50px', width: 'auto' }} />
      </div>

      <div className="search-container">
        <EnhancedSearchBar 
          onSearch={onSearch} 
          isScrolled={isScrolled}
        />
      </div>

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
        {currentUser?.isVendor && profileIncomplete && (
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
          <>
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
            <button 
              className="admin-reviews-btn"
              onClick={() => navigate('/admin/reviews')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                border: '1px solid #a5d6a7',
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
                e.target.style.backgroundColor = '#c8e6c9';
                e.target.style.borderColor = '#81c784';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#e8f5e9';
                e.target.style.borderColor = '#a5d6a7';
              }}
            >
              <i className="fas fa-user-shield" style={{ fontSize: '0.9rem' }}></i>
              Admin Reviews
            </button>
          </>
        )}
        <div className="nav-icon" id="wishlist-btn" onClick={onWishlistClick}>
          <i className="fas fa-heart"></i>
          <span
            className="badge"
            id="favorites-badge"
            style={{ display: favoritesBadge > 0 ? 'grid' : 'none' }}
          >
            {favoritesBadge}
          </span>
        </div>
        <div className="nav-icon" id="chat-btn" title="Chat" onClick={onChatClick}>
          <i className="fas fa-comments"></i>
          <span
            className="badge"
            id="messages-badge"
            style={{ display: messagesBadge > 0 ? 'grid' : 'none' }}
          >
            {messagesBadge}
          </span>
        </div>
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
  );
});

export default Header;
