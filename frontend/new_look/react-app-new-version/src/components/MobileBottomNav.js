import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MobileBottomNav({ onOpenDashboard, onOpenProfile, onOpenMessages, onToggleMap, mapActive }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);
  
  // Map button should only show on explore page where map is available
  const showMapButton = location.pathname === '/' || location.pathname === '/explore';

  // Handle scroll to hide/show bottom nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
      
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Show nav after scroll stops (300ms delay)
      scrollTimeout.current = setTimeout(() => {
        setIsVisible(true);
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const isActive = (paths) => {
    if (Array.isArray(paths)) {
      return paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));
    }
    return location.pathname === paths || location.pathname.startsWith(paths + '/');
  };

  const handleExploreClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTab(null);
    navigate('/');
  };

  const handleForumClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTab(null);
    navigate('/forum');
  };

  const handleMessagesClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUser) {
      setActiveTab('messages');
      // Open MessagingWidget in fullscreen mode on mobile
      window.dispatchEvent(new CustomEvent('openMessagingWidget', { 
        detail: { mobileFullscreen: true } 
      }));
    } else {
      if (onOpenProfile) {
        onOpenProfile();
      }
    }
  };

  const handleAccountClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUser) {
      setActiveTab('account');
      // Open dashboard
      if (onOpenDashboard) {
        onOpenDashboard('dashboard');
      }
    } else {
      if (onOpenProfile) {
        onOpenProfile();
      }
    }
  };

  const handleMapClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleMap) {
      onToggleMap();
    }
  };

  return (
    <nav className={`mobile-bottom-nav ${isVisible ? 'visible' : 'hidden'}`} onClick={(e) => e.stopPropagation()}>
      <button 
        type="button"
        className={`mobile-nav-item ${isActive(['/', '/explore']) && !activeTab ? 'active' : ''}`}
        onClick={handleExploreClick}
      >
        <i className="fas fa-compass"></i>
        <span>Explore</span>
      </button>
      
      {/* Map button - only on explore page where map feature exists */}
      {showMapButton && (
        <button 
          type="button"
          className={`mobile-nav-item ${mapActive ? 'active' : ''}`}
          onClick={handleMapClick}
        >
          <i className="fas fa-map"></i>
          <span>Map</span>
        </button>
      )}
      
      <button 
        type="button"
        className={`mobile-nav-item ${isActive('/forum') && !activeTab ? 'active' : ''}`}
        onClick={handleForumClick}
      >
        <i className="fas fa-comments"></i>
        <span>Forum</span>
      </button>
      
      <button 
        type="button"
        className={`mobile-nav-item ${activeTab === 'messages' ? 'active' : ''}`}
        onClick={handleMessagesClick}
      >
        <i className="fas fa-envelope"></i>
        <span>Messages</span>
      </button>
      
      <button 
        type="button"
        className={`mobile-nav-item ${activeTab === 'account' ? 'active' : ''}`}
        onClick={handleAccountClick}
      >
        <i className="fas fa-user"></i>
        <span>{currentUser ? 'Account' : 'Login'}</span>
      </button>
    </nav>
  );
}

export default MobileBottomNav;
