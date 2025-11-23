import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Header({ onSearch, onProfileClick, onWishlistClick, onChatClick, onNotificationsClick }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesBadge] = useState(0);
  const [messagesBadge] = useState(0);
  const [notificationsBadge] = useState(0);

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
          onClick={onProfileClick}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'S'}
        </div>
      </div>
    </header>
  );
}

export default Header;
