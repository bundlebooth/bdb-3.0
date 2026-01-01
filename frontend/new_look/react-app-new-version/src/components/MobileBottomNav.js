import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MobileBottomNav({ onOpenDashboard, onOpenProfile, onOpenMessages, onOpenMap, onCloseDashboard }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef(null);

  // Pages where bottom nav should be visible
  const allowedPaths = ['/', '/explore', '/forum'];
  const isAllowedPage = allowedPaths.some(path => 
    location.pathname === path || location.pathname.startsWith('/forum')
  );

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
    // Close dashboard if open
    if (onCloseDashboard) onCloseDashboard();
    // Close messaging widget if open
    window.dispatchEvent(new CustomEvent('closeMessagingWidget'));
    // Close mobile map if open
    window.dispatchEvent(new CustomEvent('closeMobileMap'));
    navigate('/');
    // Scroll to top
    window.scrollTo(0, 0);
  };

  const handleForumClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTab(null);
    // Close dashboard if open
    if (onCloseDashboard) onCloseDashboard();
    // Close messaging widget if open
    window.dispatchEvent(new CustomEvent('closeMessagingWidget'));
    navigate('/forum');
    // Scroll to top
    window.scrollTo(0, 0);
  };

  const handleMessagesClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Close dashboard if open
    if (onCloseDashboard) onCloseDashboard();
    if (currentUser) {
      setActiveTab('messages');
      // Open messaging widget instead of dashboard
      if (onOpenMessages) {
        onOpenMessages();
      } else {
        // Fallback: dispatch event to open messaging widget
        window.dispatchEvent(new CustomEvent('openMessagingWidget', { detail: { showHome: true } }));
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
    // Close dashboard if open
    if (onCloseDashboard) onCloseDashboard();
    // Close messaging widget if open
    window.dispatchEvent(new CustomEvent('closeMessagingWidget'));
    if (onOpenMap) {
      setActiveTab('map');
      onOpenMap();
    }
  };

  const handleAccountClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Close messaging widget if open
    window.dispatchEvent(new CustomEvent('closeMessagingWidget'));
    if (currentUser) {
      setActiveTab('account');
      // Open dashboard fullscreen
      if (onOpenDashboard) {
        onOpenDashboard('dashboard');
      }
    } else {
      // Close dashboard if somehow open
      if (onCloseDashboard) onCloseDashboard();
      if (onOpenProfile) {
        onOpenProfile();
      }
    }
  };

  // Don't render if not on allowed page
  if (!isAllowedPage) {
    return null;
  }

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
      
      {/* Map button - always visible on all allowed pages */}
      <button 
        type="button"
        className={`mobile-nav-item ${activeTab === 'map' ? 'active' : ''}`}
        onClick={handleMapClick}
      >
        <i className="fas fa-map"></i>
        <span>Map</span>
      </button>
      
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
