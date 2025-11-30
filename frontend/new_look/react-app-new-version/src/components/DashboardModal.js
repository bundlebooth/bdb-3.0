import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UnifiedDashboard from './Dashboard/UnifiedDashboard';

function DashboardModal({ isOpen, onClose, initialSection = 'dashboard' }) {
  const { currentUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState(initialSection);

  const isVendor = currentUser?.userType === 'vendor' || currentUser?.isVendor;

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
