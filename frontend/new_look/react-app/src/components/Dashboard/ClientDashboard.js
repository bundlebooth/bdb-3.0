import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';
import DashboardSidebar from './DashboardSidebar';
import ClientDashboardSection from './sections/ClientDashboardSection';
import ClientBookingsSection from './sections/ClientBookingsSection';
import ClientInvoicesSection from './sections/ClientInvoicesSection';
import ClientFavoritesSection from './sections/ClientFavoritesSection';
import ClientMessagesSection from './sections/ClientMessagesSection';
import ClientReviewsSection from './sections/ClientReviewsSection';
import ClientSettingsSection from './sections/ClientSettingsSection';

function ClientDashboard({ activeSection, onSectionChange, onLogout }) {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { id: 'bookings', icon: 'fa-calendar-check', label: 'Bookings' },
    { id: 'invoices', icon: 'fa-file-invoice', label: 'Invoices' },
    { id: 'favorites', icon: 'fa-heart', label: 'Favorites' },
    { id: 'messages', icon: 'fa-comments', label: 'Messages' },
    { id: 'reviews', icon: 'fa-star', label: 'My Reviews' },
    { id: 'settings', icon: 'fa-cog', label: 'Settings' }
  ];

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // If no user ID, just show empty dashboard
      if (!currentUser?.id) {
        setDashboardData({});
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/dashboard`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Failed to load dashboard data');
        setDashboardData({});
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setDashboardData({});
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <ClientDashboardSection 
            data={dashboardData} 
            loading={loading}
            onSectionChange={onSectionChange}
          />
        );
      case 'bookings':
        return <ClientBookingsSection />;
      case 'invoices':
        return <ClientInvoicesSection />;
      case 'favorites':
        return <ClientFavoritesSection />;
      case 'messages':
        return <ClientMessagesSection onSectionChange={onSectionChange} />;
      case 'reviews':
        return <ClientReviewsSection />;
      case 'settings':
        return <ClientSettingsSection />;
      default:
        return <ClientDashboardSection data={dashboardData} loading={loading} />;
    }
  };

  return (
    <div className="dashboard-container" id="dashboard-container" style={{ display: 'flex', height: '100%' }}>
      <DashboardSidebar 
        menuItems={menuItems}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        onLogout={onLogout}
      />
      <main className="dashboard-content" style={{ overflowY: 'auto', flex: 1 }}>
        <div className="dashboard-header">
          <h1 className="dashboard-title" id="dashboard-title">
            {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
          </h1>
          <div className="user-nav">
            <div className="nav-icon" id="dashboard-notifications-btn" style={{ display: 'none' }}>
              <i className="fas fa-bell"></i>
              <span className="badge" id="dashboard-notifications-badge">0</span>
            </div>
          </div>
        </div>
        {renderSection()}
      </main>
    </div>
  );
}

export default ClientDashboard;
