import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ClientDashboard from './Dashboard/ClientDashboard';
import VendorDashboard from './Dashboard/VendorDashboard';

function DashboardModal({ isOpen, onClose, initialSection = 'dashboard' }) {
  const { currentUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState(initialSection);

  const isVendor = currentUser?.userType === 'vendor' || currentUser?.isVendor;

  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
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
          <h3 id="dashboard-modal-title">
            {isVendor ? 'Vendor Dashboard' : 'Dashboard'}
          </h3>
          <span className="close-modal" onClick={handleClose}></span>
        </div>
        <div 
          className="modal-body" 
          style={{ 
            padding: 0, 
            overflow: 'hidden', 
            flexGrow: 1 
          }}
        >
          {isVendor ? (
            <VendorDashboard 
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              onLogout={handleLogout}
            />
          ) : (
            <ClientDashboard 
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardModal;
