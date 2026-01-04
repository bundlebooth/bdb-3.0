import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { useNotifications } from '../hooks/useNotifications';
import { showBanner } from '../utils/banners';

// Import all client sections
import ClientDashboardSection from '../components/Dashboard/sections/ClientDashboardSection';
import ClientBookingsSection from '../components/Dashboard/sections/ClientBookingsSection';
import ClientInvoicesSection from '../components/Dashboard/sections/ClientInvoicesSection';
import ClientFavoritesSection from '../components/Dashboard/sections/ClientFavoritesSection';
import ClientReviewsSection from '../components/Dashboard/sections/ClientReviewsSection';
import ClientSettingsSection from '../components/Dashboard/sections/ClientSettingsSection';
import ClientPaymentSection from '../components/Dashboard/sections/ClientPaymentSection';
import UnifiedMessagesSection from '../components/Dashboard/sections/UnifiedMessagesSection';

// Import all vendor sections
import VendorDashboardSection from '../components/Dashboard/sections/VendorDashboardSection';
import VendorRequestsSection from '../components/Dashboard/sections/VendorRequestsSection';
import VendorInvoicesSection from '../components/Dashboard/sections/VendorInvoicesSection';
import VendorBusinessProfileSection from '../components/Dashboard/sections/VendorBusinessProfileSection';
import VendorReviewsSection from '../components/Dashboard/sections/VendorReviewsSection';
import VendorAnalyticsSection from '../components/Dashboard/sections/VendorAnalyticsSection';
import VendorSettingsSection from '../components/Dashboard/sections/VendorSettingsSection';

import UnifiedSidebar from '../components/UnifiedSidebar';

import './DashboardPage.css';
import '../index.css';

function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, loading: authLoading } = useAuth();
  const { notificationCount } = useNotifications();
  
  // Get initial section from URL or state
  const getInitialSection = () => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section');
    if (sectionParam) return sectionParam;
    
    if (location.state?.section) return location.state.section;
    
    // Default based on user type
    return currentUser?.isVendor ? 'today' : 'today';
  };
  
  const [activeSection, setActiveSection] = useState(getInitialSection());
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'upcoming'
  const [clientData, setClientData] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Get view mode from localStorage
  const getViewMode = () => {
    const stored = localStorage.getItem('viewMode');
    if (stored === 'vendor' || stored === 'client') return stored;
    return currentUser?.isVendor ? 'vendor' : 'client';
  };
  
  const [viewMode, setViewMode] = useState(getViewMode());

  const isVendor = currentUser?.isVendor || currentUser?.userType === 'vendor';
  const hasVendorProfile = !!currentUser?.vendorProfileId;
  
  // Determine which view to show based on viewMode from localStorage
  const showVendorView = viewMode === 'vendor';

  // Listen for viewModeChanged events to update immediately
  useEffect(() => {
    const handleViewModeChange = (event) => {
      const newMode = event.detail?.mode;
      if (newMode) {
        console.log('DashboardPage: viewModeChanged event received, new mode:', newMode);
        setViewMode(newMode);
        // Reset to dashboard section when switching
        setActiveSection('dashboard');
      }
    };
    
    window.addEventListener('viewModeChanged', handleViewModeChange);
    return () => window.removeEventListener('viewModeChanged', handleViewModeChange);
  }, []);

  // Update activeSection when URL changes (for sidebar navigation)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section');
    if (sectionParam) {
      console.log('DashboardPage: URL section changed to:', sectionParam);
      setActiveSection(sectionParam);
    }
  }, [location.search]);

  // Redirect if not logged in (but wait for auth to finish loading)
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/');
    }
  }, [currentUser, authLoading, navigate]);

  // Load client dashboard data
  const loadClientData = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/dashboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const dashData = await response.json();
      
      let favoritesCount = 0;
      try {
        const favResp = await fetch(`${API_BASE_URL}/favorites/user/${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (favResp.ok) {
          const favs = await favResp.json();
          favoritesCount = Array.isArray(favs) ? favs.length : (favs?.length || 0);
        }
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
      
      let pendingRequests = 0;
      try {
        const reqResp = await fetch(`${API_BASE_URL}/bookings/requests/${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (reqResp.ok) {
          const reqData = await reqResp.json();
          const reqs = reqData.requests || [];
          pendingRequests = reqs.filter(r => (r.Status || r.status) === 'pending').length;
        }
      } catch (e) {
        console.error('Error loading pending requests:', e);
      }
      
      setClientData({
        ...dashData,
        favoritesCount,
        pendingRequests,
        upcomingBookings: dashData.upcomingBookings || [],
        recentMessages: dashData.recentMessages || [],
        unreadMessages: dashData.unreadMessages || 0
      });
      
    } catch (error) {
      console.error('Error loading client dashboard:', error);
      setClientData({});
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load vendor dashboard data
  const loadVendorData = useCallback(async () => {
    if (!currentUser?.vendorProfileId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/dashboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVendorData(data);
      } else {
        console.error('Failed to load vendor dashboard data');
        setVendorData({});
      }
    } catch (error) {
      console.error('Error loading vendor dashboard:', error);
      setVendorData({});
    }
  }, [currentUser]);

  // Load data on mount
  useEffect(() => {
    loadClientData();
    if (currentUser?.vendorProfileId) {
      loadVendorData();
    }
  }, [loadClientData, loadVendorData, currentUser]);

  // Update URL when section changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (activeSection !== 'today') {
      params.set('section', activeSection);
    } else {
      params.delete('section');
    }
    const newUrl = params.toString() ? `${location.pathname}?${params.toString()}` : location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [activeSection, location.pathname, location.search]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const handlePayNow = (booking) => {
    setSelectedBookingForPayment(booking);
    setActiveSection('payment');
  };

  const handlePaymentSuccess = (paymentIntent) => {
    showBanner('Payment successful! Your booking is now confirmed.', 'success');
    setSelectedBookingForPayment(null);
    setBookingsRefreshKey(prev => prev + 1);
    setActiveSection('bookings');
  };

  const handleBackFromPayment = () => {
    setSelectedBookingForPayment(null);
    setActiveSection('bookings');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSwitchToExploring = () => {
    navigate('/');
  };

  // All navigation tabs - matching original dashboard menu items
  const clientTabs = [
    { id: 'dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { id: 'bookings', icon: 'fa-calendar-check', label: 'Bookings' },
    { id: 'messages', icon: 'fa-comments', label: 'Messages' },
    { id: 'invoices', icon: 'fa-file-invoice', label: 'Invoices' },
    { id: 'favorites', icon: 'fa-heart', label: 'Favorites' },
    { id: 'reviews', icon: 'fa-star', label: 'Reviews' },
    { id: 'settings', icon: 'fa-cog', label: 'Settings' }
  ];

  const vendorTabs = [
    { id: 'vendor-dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
    { id: 'vendor-requests', icon: 'fa-calendar-check', label: 'Bookings' },
    { id: 'messages', icon: 'fa-comments', label: 'Messages' },
    { id: 'vendor-invoices', icon: 'fa-file-invoice', label: 'Invoices' },
    { id: 'vendor-business-profile', icon: 'fa-building', label: 'Business Profile' },
    { id: 'vendor-reviews', icon: 'fa-star', label: 'Reviews' },
    { id: 'vendor-analytics', icon: 'fa-chart-line', label: 'Analytics' },
    { id: 'vendor-settings', icon: 'fa-cog', label: 'Settings' }
  ];

  // Show tabs based on current view mode
  const topNavTabs = showVendorView ? vendorTabs : clientTabs;
  
  // Get current section label for mobile dropdown
  const getCurrentSectionLabel = () => {
    const allTabs = [...clientTabs, ...vendorTabs];
    const currentTab = allTabs.find(tab => tab.id === activeSection);
    return currentTab?.label || 'Dashboard';
  };

  const renderContent = () => {
    // Map section IDs to existing components - matching UnifiedDashboard
    switch (activeSection) {
      // Client sections
      case 'dashboard':
        return <ClientDashboardSection data={clientData} loading={loading && !clientData} onSectionChange={handleSectionChange} />;
      case 'bookings':
        return <ClientBookingsSection key={bookingsRefreshKey} onPayNow={handlePayNow} />;
      case 'invoices':
        return <ClientInvoicesSection />;
      case 'favorites':
        return <ClientFavoritesSection />;
      case 'reviews':
        return <ClientReviewsSection />;
      case 'settings':
        return <ClientSettingsSection />;
      case 'payment':
        return (
          <ClientPaymentSection 
            booking={selectedBookingForPayment}
            onBack={handleBackFromPayment}
            onPaymentSuccess={handlePaymentSuccess}
          />
        );
      
      // Vendor sections
      case 'vendor-dashboard':
        return <VendorDashboardSection data={vendorData} loading={loading && !vendorData} onSectionChange={handleSectionChange} />;
      case 'vendor-requests':
        return <VendorRequestsSection />;
      case 'vendor-invoices':
        return <VendorInvoicesSection />;
      case 'vendor-business-profile':
        return <VendorBusinessProfileSection />;
      case 'vendor-reviews':
        return <VendorReviewsSection />;
      case 'vendor-analytics':
        return <VendorAnalyticsSection />;
      case 'vendor-settings':
        return <VendorSettingsSection />;
      
      // Unified Messages section
      case 'messages':
        return <UnifiedMessagesSection onSectionChange={handleSectionChange} />;
      
      default:
        return showVendorView 
          ? <VendorDashboardSection data={vendorData} loading={loading && !vendorData} onSectionChange={handleSectionChange} />
          : <ClientDashboardSection data={clientData} loading={loading && !clientData} onSectionChange={handleSectionChange} />;
    }
  };

  // Handle switching between client and vendor view
  const handleViewModeSwitch = (mode) => {
    setViewMode(mode);
    // Reset to appropriate dashboard when switching
    if (mode === 'vendor' || (mode === 'auto' && isVendor)) {
      setActiveSection('vendor-dashboard');
    } else {
      setActiveSection('dashboard');
    }
  };

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="dashboard-page">
      {/* Top Header - Airbnb style */}
      <header className="dashboard-page-header">
        <div className="dashboard-header-content">
          {/* Logo */}
          <div className="dashboard-logo" onClick={() => navigate('/')}>
            <img src="/images/logo.png" alt="PlanBeau" />
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="dashboard-top-nav desktop-only">
            {topNavTabs.map(tab => (
              <button
                key={tab.id}
                className={`dashboard-nav-tab ${activeSection === tab.id ? 'active' : ''}`}
                onClick={() => handleSectionChange(tab.id)}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          
          {/* Mobile Navigation Dropdown - only shown on mobile */}
          <div className="mobile-nav-dropdown">
            <button 
              className="mobile-nav-trigger"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              <span>{getCurrentSectionLabel()}</span>
              <i className={`fas fa-chevron-${mobileNavOpen ? 'up' : 'down'}`}></i>
            </button>
            
            {mobileNavOpen && (
              <>
                <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />
                <div className="mobile-nav-menu">
                  {/* View mode switcher for users who are both client and vendor */}
                  {hasVendorProfile && (
                    <>
                      <div className="mobile-nav-section-title">View as</div>
                      <button 
                        className={`mobile-nav-item ${showVendorView ? '' : 'active'}`}
                        onClick={() => { handleViewModeSwitch('client'); setMobileNavOpen(false); }}
                      >
                        <i className="fas fa-user"></i>
                        <span>Client</span>
                      </button>
                      <button 
                        className={`mobile-nav-item ${showVendorView ? 'active' : ''}`}
                        onClick={() => { handleViewModeSwitch('vendor'); setMobileNavOpen(false); }}
                      >
                        <i className="fas fa-store"></i>
                        <span>Vendor</span>
                      </button>
                      <div className="mobile-nav-divider" />
                    </>
                  )}
                  
                  <div className="mobile-nav-section-title">Pages</div>
                  {topNavTabs.map(tab => (
                    <button
                      key={tab.id}
                      className={`mobile-nav-item ${activeSection === tab.id ? 'active' : ''}`}
                      onClick={() => { handleSectionChange(tab.id); setMobileNavOpen(false); }}
                    >
                      <i className={`fas ${tab.icon}`}></i>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right side actions */}
          <div className="dashboard-header-actions">
            {/* User menu button - hamburger + avatar */}
            <button 
              className="user-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className="fas fa-bars"></i>
              <div className="user-avatar">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>
          </div>
        </div>
      </header>
      
      {/* Unified Sidebar Component */}
      <UnifiedSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content */}
      <main className="dashboard-page-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default DashboardPage;
