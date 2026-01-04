import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import './UnifiedSidebar.css';

function UnifiedSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [hasVendorProfile, setHasVendorProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);
  const [vendorLogoUrl, setVendorLogoUrl] = useState(null);
  
  // Get view mode from localStorage
  const getViewMode = () => {
    const stored = localStorage.getItem('viewMode');
    if (stored === 'vendor' || stored === 'client') return stored;
    return currentUser?.isVendor ? 'vendor' : 'client';
  };
  
  const [isVendorMode, setIsVendorMode] = useState(getViewMode() === 'vendor');

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

  const handleToggleViewMode = () => {
    const newMode = isVendorMode ? 'client' : 'vendor';
    localStorage.setItem('viewMode', newMode);
    setIsVendorMode(!isVendorMode);
    
    // Dispatch event so other components can react immediately
    window.dispatchEvent(new CustomEvent('viewModeChanged', { detail: { mode: newMode } }));
    
    // Close sidebar after toggle
    onClose();
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('viewMode');
    window.location.href = '/';
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
        {hasVendorProfile && (
          <div className="unified-sidebar-section">
            <div className="unified-sidebar-section-title">ACCOUNT</div>
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
            
            {/* Profile Setup Status */}
            <button 
              className="unified-sidebar-item"
              onClick={() => handleNavigate('/become-a-vendor/setup?step=account')}
            >
              <i className="fas fa-user-check"></i>
              <span>Profile Setup</span>
              <span className={`unified-sidebar-status-badge ${profileStatus}`}>
                {profileStatus === 'live' && 'Live'}
                {profileStatus === 'submitted' && 'Pending'}
                {profileStatus === 'incomplete' && 'Incomplete'}
                {!profileStatus && 'Setup'}
              </span>
            </button>
          </div>
        )}
        
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
        </div>
        
        {/* Dashboard section */}
        <div className="unified-sidebar-section">
          <div className="unified-sidebar-section-title">DASHBOARD</div>
          <button className="unified-sidebar-item" onClick={() => handleNavigate('/dashboard?section=dashboard')}>
            <i className="fas fa-layer-group"></i>
            <span>Dashboard</span>
          </button>
          <button className="unified-sidebar-item" onClick={() => handleNavigate('/dashboard?section=bookings')}>
            <i className="fas fa-calendar-check"></i>
            <span>Bookings</span>
          </button>
          <button className="unified-sidebar-item" onClick={() => handleNavigate('/dashboard?section=messages')}>
            <i className="fas fa-comments"></i>
            <span>Messages</span>
          </button>
          <button className="unified-sidebar-item" onClick={() => handleNavigate('/dashboard?section=invoices')}>
            <i className="fas fa-file-invoice-dollar"></i>
            <span>Invoices</span>
          </button>
          {hasVendorProfile && (
            <>
              <button className="unified-sidebar-item" onClick={() => handleNavigate('/dashboard?section=business-profile')}>
                <i className="fas fa-store"></i>
                <span>Business Profile</span>
              </button>
              <button className="unified-sidebar-item" onClick={() => handleNavigate('/dashboard?section=reviews')}>
                <i className="fas fa-star"></i>
                <span>Reviews</span>
              </button>
              <button className="unified-sidebar-item" onClick={() => handleNavigate('/dashboard?section=analytics')}>
                <i className="fas fa-chart-line"></i>
                <span>Analytics</span>
              </button>
            </>
          )}
          <button className="unified-sidebar-item" onClick={() => handleNavigate('/dashboard?section=settings')}>
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
