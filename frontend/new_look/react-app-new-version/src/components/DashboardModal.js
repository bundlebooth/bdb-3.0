import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UnifiedDashboard from './Dashboard/UnifiedDashboard';

function DashboardModal({ isOpen, onClose, initialSection = 'dashboard' }) {
  const { currentUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isVendor = currentUser?.userType === 'vendor' || currentUser?.isVendor;

  // Get section title for header
  const getSectionTitle = () => {
    const sectionTitles = {
      'dashboard': 'Dashboard',
      'bookings': 'Bookings',
      'invoices': 'Invoices',
      'favorites': 'Favorites',
      'messages': 'Messages',
      'reviews': 'Reviews',
      'settings': 'Settings',
      'vendor-dashboard': 'Vendor Dashboard',
      'vendor-requests': 'Booking Requests',
      'vendor-invoices': 'Invoices',
      'vendor-business-profile': 'Business Profile',
      'vendor-messages': 'Messages',
      'vendor-reviews': 'Reviews',
      'vendor-analytics': 'Analytics',
      'vendor-settings': 'Settings'
    };
    return sectionTitles[activeSection] || 'Dashboard';
  };

  // Handle resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset section when user changes
  useEffect(() => {
    if (currentUser) {
      const defaultSection = currentUser.isVendor || currentUser.userType === 'vendor' 
        ? 'vendor-dashboard' 
        : 'dashboard';
      setActiveSection(defaultSection);
    }
  }, [currentUser?.id, currentUser?.vendorProfileId]);

  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
      document.body.style.overflow = 'hidden';
      
      // CRITICAL: Hide categories nav when modal is open to prevent overlap
      const categoriesNav = document.querySelector('.categories-nav');
      if (categoriesNav) {
        categoriesNav.style.display = 'none';
      }
    } else {
      document.body.style.overflow = '';
      
      // Show categories nav when modal closes
      const categoriesNav = document.querySelector('.categories-nav');
      if (categoriesNav) {
        categoriesNav.style.display = 'flex';
      }
    }
    
    return () => {
      document.body.style.overflow = '';
      const categoriesNav = document.querySelector('.categories-nav');
      if (categoriesNav) {
        categoriesNav.style.display = 'flex';
      }
    };
  }, [isOpen, initialSection]);

  const handleSectionChange = useCallback((section) => {
    setActiveSection(section);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    onClose();
  }, [logout, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen || !currentUser) return null;

  // Mobile full-screen layout
  if (isMobile) {
    return (
      <div 
        id="dashboard-modal" 
        className={`modal ${activeSection === 'messages' || activeSection === 'vendor-messages' ? 'messages-active' : ''}`}
        data-no-outside-close 
        style={{ 
          display: 'flex',
          padding: 0,
          background: 'white'
        }}
      >
        <div 
          className="modal-content" 
          style={{ 
            maxWidth: '100%', 
            width: '100%', 
            height: '100vh',
            margin: 0,
            borderRadius: 0,
            display: 'flex', 
            flexDirection: 'column'
          }}
        >
          <div className="modal-header" style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Hamburger menu button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <i className="fas fa-bars" style={{ fontSize: '18px', color: '#374151' }}></i>
              </button>
              <h3 id="dashboard-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{getSectionTitle()}</h3>
            </div>
            <button 
              onClick={handleClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>
          <div 
            className="modal-body" 
            style={{ 
              padding: 0, 
              overflow: 'auto', 
              flexGrow: 1,
              background: '#f9fafb'
            }}
          >
            <UnifiedDashboard 
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              onLogout={handleLogout}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div 
      id="dashboard-modal" 
      className="modal" 
      data-no-outside-close 
      style={{ display: 'flex' }}
      onClick={(e) => {
        if (e.target.id === 'dashboard-modal') {
          // Don't close on outside click due to data-no-outside-close
        }
      }}
    >
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '95%', 
          width: '1200px', 
          height: '90vh', 
          display: 'flex', 
          flexDirection: 'column'
        }}
      >
        <div className="modal-header">
          <h3 id="dashboard-modal-title">Dashboard</h3>
          <span className="close-modal" onClick={handleClose}>×</span>
        </div>
        <div 
          className="modal-body" 
          style={{ 
            padding: 0, 
            overflow: 'hidden', 
            flexGrow: 1 
          }}
        >
          <UnifiedDashboard 
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardModal;
