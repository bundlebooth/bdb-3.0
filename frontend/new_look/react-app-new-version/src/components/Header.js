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
  const [profileStatus, setProfileStatus] = useState(null); // 'live', 'submitted', 'incomplete'
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasVendorProfile, setHasVendorProfile] = useState(false);
  const [isVendorMode, setIsVendorMode] = useState(false); // Toggle between client/vendor view
  const notificationBtnRef = useRef(null);

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
        {/* User menu button - hamburger + avatar like dashboard - hidden on mobile via CSS */}
        <div
          className="user-menu-button"
          onClick={() => currentUser ? setSidebarOpen(true) : onProfileClick()}
          style={{
            alignItems: 'center',
            gap: '8px',
            padding: '4px 4px 4px 12px',
            border: '1px solid #ddd',
            borderRadius: '24px',
            cursor: 'pointer',
            backgroundColor: 'white',
            transition: 'box-shadow 0.2s',
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <i className="fas fa-bars" style={{ fontSize: '14px', color: '#222' }}></i>
          <div
            style={{
              backgroundColor: 'var(--primary)',
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
            {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'S'}
            {/* Exclamation mark indicator for incomplete profile */}
            {profileIncomplete && (
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
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

      {/* Dashboard Modal - kept for backwards compatibility with openDashboard events */}
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
    
    {/* User Menu Sidebar - Giggster style */}
    {sidebarOpen && currentUser && (
      <>
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
        <div 
          className="sidebar-menu"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '320px',
            maxWidth: '85vw',
            height: '100vh',
            background: 'white',
            zIndex: 1000,
            overflowY: 'auto',
            boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
            animation: 'slideInRight 0.2s ease-out'
          }}
        >
          {/* Close button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#666',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
          
          {/* User info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '24px 20px 20px',
            borderBottom: '1px solid #e5e5e5'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 600,
              flexShrink: 0
            }}>
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#222', marginBottom: '2px' }}>
                {currentUser?.name}
              </div>
              <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.email}
              </div>
            </div>
          </div>
          
          {/* Account section with toggle and profile status */}
          {hasVendorProfile && (
            <div style={{ padding: '12px 0', borderBottom: '1px solid #e5e5e5' }}>
              <div style={{ padding: '6px 20px', fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Account
              </div>
              <div 
                onClick={() => setIsVendorMode(!isVendorMode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 20px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className="fas fa-exchange-alt" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
                  <span style={{ fontSize: '14px', color: '#222' }}>Switch to {isVendorMode ? 'Client' : 'Vendor'}</span>
                </div>
                <div style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '11px',
                  background: isVendorMode ? 'var(--primary, #5e72e4)' : '#e5e5e5',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: isVendorMode ? '20px' : '2px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s'
                  }} />
                </div>
              </div>
              
              {/* Profile Setup Status Button - Simple clean design */}
              <button 
                onClick={() => { 
                  if (profileStatus === 'incomplete') {
                    navigate('/become-a-vendor/setup?step=categories');
                  } else {
                    navigate('/dashboard?section=vendor-business-profile');
                  }
                  setSidebarOpen(false); 
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '12px', 
                  width: '100%',
                  padding: '10px 20px', 
                  background: 'none',
                  border: 'none',
                  fontSize: '14px', 
                  color: '#222', 
                  cursor: 'pointer', 
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className="fas fa-user-check" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
                  <span>Profile Setup</span>
                </div>
                <span style={{
                  padding: '3px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  background: profileStatus === 'live' ? '#dcfce7' : 
                              profileStatus === 'submitted' ? '#dbeafe' : 
                              profileStatus === 'complete' ? '#dcfce7' : '#fef3c7',
                  color: profileStatus === 'live' ? '#166534' : 
                         profileStatus === 'submitted' ? '#1e40af' : 
                         profileStatus === 'complete' ? '#166534' : '#92400e'
                }}>
                  {profileStatus === 'live' && 'Live'}
                  {profileStatus === 'submitted' && 'Pending'}
                  {profileStatus === 'complete' && 'Complete'}
                  {profileStatus === 'incomplete' && 'Incomplete'}
                  {!profileStatus && 'Setup'}
                </span>
              </button>
            </div>
          )}
          
          {/* Actions section - moved above Dashboard */}
          <div style={{ padding: '12px 0', borderBottom: '1px solid #e5e5e5' }}>
            <div style={{ padding: '6px 20px', fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Actions
            </div>
            <button 
              onClick={() => { navigate('/'); setSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#222', cursor: 'pointer', textAlign: 'left' }}
            >
              <i className="fas fa-compass" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
              <span>Explore Vendors</span>
            </button>
            <button 
              onClick={() => { navigate('/forum'); setSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#222', cursor: 'pointer', textAlign: 'left' }}
            >
              <i className="fas fa-comments" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
              <span>Forum</span>
            </button>
          </div>
          
          {/* Dashboard section */}
          <div style={{ padding: '12px 0', borderBottom: '1px solid #e5e5e5' }}>
            <div style={{ padding: '6px 20px', fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Dashboard
            </div>
            <button 
              onClick={() => { navigate('/dashboard?section=dashboard'); setSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#222', cursor: 'pointer', textAlign: 'left' }}
            >
              <i className="fas fa-th-large" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
              <span>Dashboard</span>
            </button>
            <button 
              onClick={() => { navigate('/dashboard?section=bookings'); setSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#222', cursor: 'pointer', textAlign: 'left' }}
            >
              <i className="fas fa-calendar-check" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
              <span>Bookings</span>
            </button>
            <button 
              onClick={() => { navigate('/dashboard?section=messages'); setSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#222', cursor: 'pointer', textAlign: 'left' }}
            >
              <i className="fas fa-comments" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
              <span>Messages</span>
            </button>
            <button 
              onClick={() => { navigate('/dashboard?section=invoices'); setSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#222', cursor: 'pointer', textAlign: 'left' }}
            >
              <i className="fas fa-file-invoice-dollar" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
              <span>Invoices</span>
            </button>
            {hasVendorProfile && (
              <>
                <button 
                  onClick={() => { navigate('/dashboard?section=business-profile'); setSidebarOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#222', cursor: 'pointer', textAlign: 'left' }}
                >
                  <i className="fas fa-store" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
                  <span>Business Profile</span>
                </button>
                <button 
                  onClick={() => { navigate('/dashboard?section=reviews'); setSidebarOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#222', cursor: 'pointer', textAlign: 'left' }}
                >
                  <i className="fas fa-star" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
                  <span>Reviews</span>
                </button>
                <button 
                  onClick={() => { navigate('/dashboard?section=analytics'); setSidebarOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#222', cursor: 'pointer', textAlign: 'left' }}
                >
                  <i className="fas fa-chart-line" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
                  <span>Analytics</span>
                </button>
              </>
            )}
            <button 
              onClick={() => { navigate('/dashboard?section=settings'); setSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#222', cursor: 'pointer', textAlign: 'left' }}
            >
              <i className="fas fa-cog" style={{ width: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}></i>
              <span>Settings</span>
            </button>
          </div>
          
          {/* Log Out */}
          <div style={{ padding: '12px 0' }}>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 20px', background: 'none', border: 'none', fontSize: '14px', color: '#c13515', cursor: 'pointer', textAlign: 'left' }}
            >
              <i className="fas fa-sign-out-alt" style={{ width: '20px', textAlign: 'center', color: '#c13515', fontSize: '14px' }}></i>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </>
    )}
    
    {/* What's New Sidebar - Rendered outside header for proper z-index */}
    <WhatsNewSidebar 
      isOpen={whatsNewOpen} 
      onClose={() => setWhatsNewOpen(false)} 
    />
    </>
  );
});

export default Header;
