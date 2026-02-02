/**
 * Admin Dashboard - Main Container Component
 * Renders the admin layout with sidebar and active section
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import './AdminDashboard.css';

// Section Components (will be created in subsequent phases)
import OverviewSection from './sections/OverviewSection';
import UsersSection from './sections/UsersSection';
import VendorsSection from './sections/VendorsSection';
import BookingsSection from './sections/BookingsSection';
import ModerationSection from './sections/ModerationSection';
import SupportSection from './sections/SupportSection';
import SettingsSection from './sections/SettingsSection';
import AnalyticsSection from './sections/AnalyticsSection';

const sectionTitles = {
  overview: { title: 'Dashboard Overview', subtitle: 'Platform metrics and activity at a glance' },
  users: { title: 'User Management', subtitle: 'Manage platform users and accounts' },
  vendors: { title: 'Vendor Management', subtitle: 'Approvals, profiles, and categories' },
  bookings: { title: 'Bookings & Payments', subtitle: 'Transactions, refunds, and disputes' },
  moderation: { title: 'Content Moderation', subtitle: 'Reviews, chats, and content management' },
  support: { title: 'Support Center', subtitle: 'Tickets and customer support' },
  settings: { title: 'Settings & Configuration', subtitle: 'Platform settings and security' },
  analytics: { title: 'Reports & Analytics', subtitle: 'Insights and data exports' }
};

const validSections = ['overview', 'users', 'vendors', 'bookings', 'moderation', 'support', 'settings', 'analytics'];

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { section: urlSection } = useParams(); // Get section from URL path /admin/:section
  const { currentUser, logout } = useAuth();
  
  // Priority: URL path > query param > default
  const getSectionFromUrl = () => {
    if (urlSection && validSections.includes(urlSection)) return urlSection;
    const querySection = searchParams.get('section');
    if (querySection && validSections.includes(querySection)) return querySection;
    return 'overview';
  };
  
  const [activeSection, setActiveSection] = useState(getSectionFromUrl());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Update section when URL changes
  useEffect(() => {
    const newSection = getSectionFromUrl();
    if (newSection !== activeSection) {
      setActiveSection(newSection);
    }
  }, [urlSection, searchParams]);

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    // Navigate to the new section URL
    navigate(`/admin/${sectionId}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'users':
        return <UsersSection />;
      case 'vendors':
        return <VendorsSection />;
      case 'bookings':
        return <BookingsSection />;
      case 'moderation':
        return <ModerationSection />;
      case 'support':
        return <SupportSection />;
      case 'settings':
        return <SettingsSection />;
      case 'analytics':
        return <AnalyticsSection />;
      default:
        return <OverviewSection />;
    }
  };

  const currentSectionInfo = sectionTitles[activeSection] || sectionTitles.overview;

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button 
              className="admin-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div>
              <h1 className="admin-header-title">{currentSectionInfo.title}</h1>
              <p className="admin-header-subtitle">{currentSectionInfo.subtitle}</p>
            </div>
          </div>
          <div className="admin-header-right">
            <span style={{ 
              fontSize: '0.85rem', 
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-user-shield" style={{ color: '#dc2626' }}></i>
              {currentUser?.email}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
