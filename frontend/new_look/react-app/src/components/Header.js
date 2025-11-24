import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import DashboardModal from './DashboardModal';

function Header({ onSearch, onProfileClick, onWishlistClick, onChatClick, onNotificationsClick }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesBadge, setFavoritesBadge] = useState(0);
  const [messagesBadge, setMessagesBadge] = useState(0);
  const [notificationsBadge, setNotificationsBadge] = useState(0);
  const [dashboardOpen, setDashboardOpen] = useState(false);

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

        // Load notifications count (if endpoint exists)
        try {
          const notifResponse = await fetch(`${API_BASE_URL}/notifications/unread-count/${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (notifResponse.ok) {
            const notifData = await notifResponse.json();
            setNotificationsBadge(notifData.unreadCount || 0);
          }
        } catch (e) {
          // Notifications endpoint might not exist
          console.log('Notifications endpoint not available');
        }
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

  return (
    <header className="header">
      <div className="logo" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
        <img src="/planhive_logo.svg" alt="PlanHive" style={{ height: '50px', width: 'auto' }} />
      </div>

      <div className="search-container">
        <div className="search-bar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search for event vendors..."
            id="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ flexGrow: 1, paddingLeft: '1rem', paddingRight: '2.5rem' }}
          />
          <button
            id="search-button"
            onClick={handleSearch}
            style={{
              position: 'absolute',
              right: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--primary)',
              fontSize: '1.25rem'
            }}
          >
            <i className="fas fa-magnifying-glass"></i>
          </button>
        </div>
      </div>

      <div className="user-nav">
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
        <div className="nav-icon" id="notifications-btn" onClick={onNotificationsClick}>
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
      <DashboardModal isOpen={dashboardOpen} onClose={() => setDashboardOpen(false)} />
    </header>
  );
}

export default Header;
