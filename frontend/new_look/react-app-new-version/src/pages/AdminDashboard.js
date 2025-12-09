import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { showBanner } from '../utils/helpers';
import './AdminDashboard.css';

// Import all admin panels
import VendorManagementPanel from '../components/Admin/VendorManagementPanel';
import UserManagementPanel from '../components/Admin/UserManagementPanel';
import BookingManagementPanel from '../components/Admin/BookingManagementPanel';
import ChatOversightPanel from '../components/Admin/ChatOversightPanel';
import CategoriesPanel from '../components/Admin/CategoriesPanel';
import ReviewsPanel from '../components/Admin/ReviewsPanel';
import PaymentsPanel from '../components/Admin/PaymentsPanel';
import ContentManagementPanel from '../components/Admin/ContentManagementPanel';
import NotificationsPanel from '../components/Admin/NotificationsPanel';
import PlatformSettingsPanel from '../components/Admin/PlatformSettingsPanel';
import AnalyticsPanel from '../components/Admin/AnalyticsPanel';
import SecurityLogsPanel from '../components/Admin/SecurityLogsPanel';
import SupportToolsPanel from '../components/Admin/SupportToolsPanel';
import VendorApprovalsPanel from '../components/Admin/VendorApprovalsPanel';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingVendors: 0,
    totalUsers: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    activeListings: 0
  });
  const [loading, setLoading] = useState(true);

  // Menu items configuration
  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'fas fa-tachometer-alt' },
    { id: 'approvals', label: 'Vendor Approvals', icon: 'fas fa-user-check', badge: stats.pendingVendors },
    { id: 'vendors', label: 'Vendor Management', icon: 'fas fa-store' },
    { id: 'users', label: 'User Management', icon: 'fas fa-users' },
    { id: 'bookings', label: 'Booking Management', icon: 'fas fa-calendar-check' },
    { id: 'chats', label: 'Chat & Messaging', icon: 'fas fa-comments' },
    { id: 'categories', label: 'Services & Categories', icon: 'fas fa-tags' },
    { id: 'reviews', label: 'Reviews & Ratings', icon: 'fas fa-star' },
    { id: 'payments', label: 'Payments & Payouts', icon: 'fas fa-credit-card' },
    { id: 'content', label: 'Content Management', icon: 'fas fa-file-alt' },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'settings', label: 'Platform Settings', icon: 'fas fa-cog' },
    { id: 'analytics', label: 'Analytics & Reports', icon: 'fas fa-chart-line' },
    { id: 'security', label: 'Security & Logs', icon: 'fas fa-shield-alt' },
    { id: 'support', label: 'Support Tools', icon: 'fas fa-headset' }
  ];

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      showBanner('Please log in to access this page', 'error');
      navigate('/');
      return;
    }

    // Check if user is admin (check both cases for compatibility)
    const isAdmin = currentUser.IsAdmin === true || currentUser.IsAdmin === 1 || 
                    currentUser.isAdmin === true || currentUser.isAdmin === 1;
    if (!isAdmin) {
      showBanner('Access denied. Admin privileges required.', 'error');
      navigate('/');
      return;
    }

    fetchDashboardStats();
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    setSearchParams({ section: sectionId });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewPanel stats={stats} loading={loading} onNavigate={handleSectionChange} />;
      case 'approvals':
        return <VendorApprovalsPanel />;
      case 'vendors':
        return <VendorManagementPanel />;
      case 'users':
        return <UserManagementPanel />;
      case 'bookings':
        return <BookingManagementPanel />;
      case 'chats':
        return <ChatOversightPanel />;
      case 'categories':
        return <CategoriesPanel />;
      case 'reviews':
        return <ReviewsPanel />;
      case 'payments':
        return <PaymentsPanel />;
      case 'content':
        return <ContentManagementPanel />;
      case 'notifications':
        return <NotificationsPanel />;
      case 'settings':
        return <PlatformSettingsPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'security':
        return <SecurityLogsPanel />;
      case 'support':
        return <SupportToolsPanel />;
      default:
        return <OverviewPanel stats={stats} loading={loading} onNavigate={handleSectionChange} />;
    }
  };

  if (authLoading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-dashboard ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo" onClick={() => navigate('/')}>
            <img src="/planhive_logo.svg" alt="PlanHive" />
            {!sidebarCollapsed && <span>Admin</span>}
          </div>
          <button 
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => handleSectionChange(item.id)}
              title={sidebarCollapsed ? item.label : ''}
            >
              <i className={item.icon}></i>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user">
            <div className="user-avatar">
              {currentUser?.FirstName?.[0] || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <span className="user-name">{currentUser?.FirstName} {currentUser?.LastName}</span>
                <span className="user-role">Administrator</span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={() => navigate('/')}>
            <i className="fas fa-sign-out-alt"></i>
            {!sidebarCollapsed && <span>Exit Admin</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <h1>{menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}</h1>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn" title="Refresh">
              <i className="fas fa-sync-alt"></i>
            </button>
            <button className="topbar-btn" title="Notifications">
              <i className="fas fa-bell"></i>
              <span className="notification-badge">3</span>
            </button>
            <button className="topbar-btn" title="Help">
              <i className="fas fa-question-circle"></i>
            </button>
          </div>
        </header>

        <div className="admin-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// Overview Panel Component
const OverviewPanel = ({ stats, loading, onNavigate }) => {
  const [recentActivity, setRecentActivity] = React.useState([]);
  const [activityLoading, setActivityLoading] = React.useState(true);

  React.useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/recent-activity`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activity || []);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const statCards = [
    { label: 'Total Vendors', value: stats.totalVendors, icon: 'fas fa-store', color: '#5e72e4', link: 'vendors' },
    { label: 'Pending Approvals', value: stats.pendingVendors, icon: 'fas fa-clock', color: '#fb6340', link: 'vendors' },
    { label: 'Total Users', value: stats.totalUsers, icon: 'fas fa-users', color: '#2dce89', link: 'users' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: 'fas fa-calendar-check', color: '#11cdef', link: 'bookings' },
    { label: 'Monthly Revenue', value: `$${(stats.monthlyRevenue || 0).toLocaleString()}`, icon: 'fas fa-dollar-sign', color: '#f5365c', link: 'payments' },
    { label: 'Active Listings', value: stats.activeListings, icon: 'fas fa-list', color: '#8965e0', link: 'vendors' }
  ];

  const quickActions = [
    { label: 'Review Pending Vendors', icon: 'fas fa-user-check', action: () => onNavigate('vendors') },
    { label: 'View Recent Bookings', icon: 'fas fa-calendar', action: () => onNavigate('bookings') },
    { label: 'Check Flagged Reviews', icon: 'fas fa-flag', action: () => onNavigate('reviews') },
    { label: 'View Payment Reports', icon: 'fas fa-chart-bar', action: () => onNavigate('payments') },
    { label: 'Manage Categories', icon: 'fas fa-tags', action: () => onNavigate('categories') },
    { label: 'View Security Logs', icon: 'fas fa-shield-alt', action: () => onNavigate('security') }
  ];

  return (
    <div className="overview-panel">
      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card"
            onClick={() => onNavigate(stat.link)}
            style={{ '--accent-color': stat.color }}
          >
            <div className="stat-icon" style={{ background: stat.color }}>
              <i className={stat.icon}></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{loading ? '...' : stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-card">
        <h2><i className="fas fa-bolt"></i> Quick Actions</h2>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <button key={index} className="quick-action-btn" onClick={action.action}>
              <i className={action.icon}></i>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="dashboard-grid">
        <div className="section-card">
          <h2><i className="fas fa-clock"></i> Recent Activity</h2>
          <div className="activity-list">
            {activityLoading ? (
              <div className="loading-text">Loading activity...</div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((item, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon" style={{ background: item.color || '#5e72e4' }}>
                    <i className={`fas ${item.icon || 'fa-circle'}`}></i>
                  </div>
                  <div className="activity-content">
                    <p>{item.description}</p>
                    <span className="activity-time">{formatTimeAgo(item.timestamp)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-text">No recent activity</div>
            )}
          </div>
        </div>

        <div className="section-card">
          <h2><i className="fas fa-chart-pie"></i> Platform Health</h2>
          <div className="health-metrics">
            <div className="health-item">
              <div className="health-label">
                <span>Server Status</span>
                <span className="health-status good">Operational</span>
              </div>
              <div className="health-bar">
                <div className="health-fill" style={{ width: '100%', background: '#2dce89' }}></div>
              </div>
            </div>
            <div className="health-item">
              <div className="health-label">
                <span>API Response Time</span>
                <span className="health-value">45ms</span>
              </div>
              <div className="health-bar">
                <div className="health-fill" style={{ width: '15%', background: '#2dce89' }}></div>
              </div>
            </div>
            <div className="health-item">
              <div className="health-label">
                <span>Database Load</span>
                <span className="health-value">32%</span>
              </div>
              <div className="health-bar">
                <div className="health-fill" style={{ width: '32%', background: '#5e72e4' }}></div>
              </div>
            </div>
            <div className="health-item">
              <div className="health-label">
                <span>Storage Used</span>
                <span className="health-value">67%</span>
              </div>
              <div className="health-bar">
                <div className="health-fill" style={{ width: '67%', background: '#fb6340' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
