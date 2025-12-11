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
    { id: 'commissions', label: 'Commission Settings', icon: 'fas fa-percentage' },
    { id: 'content', label: 'Content Management', icon: 'fas fa-file-alt' },
    { id: 'faqs', label: 'FAQ Management', icon: 'fas fa-question-circle' },
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
      case 'commissions':
        return <CommissionSettingsPanel />;
      case 'content':
        return <ContentManagementPanel />;
      case 'faqs':
        return <FAQManagementPanel />;
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
            <button className="topbar-btn" title="Notifications" onClick={() => handleSectionChange('notifications')}>
              <i className="fas fa-bell"></i>
              {stats.pendingVendors > 0 && <span className="notification-badge">{stats.pendingVendors}</span>}
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

// FAQ Management Panel Component
const FAQManagementPanel = () => {
  const [faqs, setFaqs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingFaq, setEditingFaq] = React.useState(null);
  const [newFaq, setNewFaq] = React.useState({ question: '', answer: '', category: 'General', displayOrder: 0 });
  const [showAddForm, setShowAddForm] = React.useState(false);

  React.useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/faqs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFaqs(data.faqs || []);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (faq) => {
    try {
      const isNew = !faq.FAQID;
      const url = isNew ? `${API_BASE_URL}/admin/faqs` : `${API_BASE_URL}/admin/faqs/${faq.FAQID}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(faq)
      });
      
      if (response.ok) {
        fetchFaqs();
        setEditingFaq(null);
        setShowAddForm(false);
        setNewFaq({ question: '', answer: '', category: 'General', displayOrder: 0 });
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await fetch(`${API_BASE_URL}/admin/faqs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchFaqs();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    }
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h2>FAQ Management</h2>
        <p>Manage frequently asked questions displayed in the Help Center</p>
      </div>
      
      <div className="panel-actions" style={{ marginBottom: '20px' }}>
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(true)}
          style={{ background: '#5e72e4', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
          Add New FAQ
        </button>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fe', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '16px' }}>Add New FAQ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Question"
              value={newFaq.question}
              onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
              style={{ padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
            />
            <textarea
              placeholder="Answer"
              value={newFaq.answer}
              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              rows={4}
              style={{ padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
            />
            <select
              value={newFaq.category}
              onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
              style={{ padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
            >
              <option value="General">General</option>
              <option value="Booking">Booking</option>
              <option value="Payments">Payments</option>
              <option value="Vendors">Vendors</option>
              <option value="Account">Account</option>
            </select>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => handleSave(newFaq)} style={{ background: '#5e72e4', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Save FAQ
              </button>
              <button onClick={() => { setShowAddForm(false); setNewFaq({ question: '', answer: '', category: 'General', displayOrder: 0 }); }} style={{ background: '#f0f0f0', color: '#333', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner"></div>
          <p>Loading FAQs...</p>
        </div>
      ) : faqs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fe', borderRadius: '12px' }}>
          <i className="fas fa-question-circle" style={{ fontSize: '48px', color: '#5e72e4', marginBottom: '16px' }}></i>
          <h3>No FAQs Yet</h3>
          <p style={{ color: '#666' }}>Add your first FAQ to help users find answers quickly.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq) => (
            <div key={faq.FAQID} className="card" style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
              {editingFaq === faq.FAQID ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    value={faq.Question}
                    onChange={(e) => setFaqs(faqs.map(f => f.FAQID === faq.FAQID ? { ...f, Question: e.target.value } : f))}
                    style={{ padding: '10px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
                  />
                  <textarea
                    value={faq.Answer}
                    onChange={(e) => setFaqs(faqs.map(f => f.FAQID === faq.FAQID ? { ...f, Answer: e.target.value } : f))}
                    rows={3}
                    style={{ padding: '10px', border: '1px solid #e0e0e0', borderRadius: '6px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleSave({ ...faq, question: faq.Question, answer: faq.Answer, category: faq.Category, displayOrder: faq.DisplayOrder, isActive: faq.IsActive })} style={{ background: '#5e72e4', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingFaq(null)} style={{ background: '#f0f0f0', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '11px', background: '#e7f1ff', color: '#5e72e4', padding: '2px 8px', borderRadius: '4px', marginBottom: '8px', display: 'inline-block' }}>{faq.Category}</span>
                      <h4 style={{ margin: '8px 0', fontSize: '15px', fontWeight: 600 }}>{faq.Question}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.5' }}>{faq.Answer}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingFaq(faq.FAQID)} style={{ background: 'none', border: 'none', color: '#5e72e4', cursor: 'pointer' }}><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDelete(faq.FAQID)} style={{ background: 'none', border: 'none', color: '#f5365c', cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Commission Settings Panel Component
const CommissionSettingsPanel = () => {
  const [settings, setSettings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [testAmount, setTestAmount] = React.useState(100);
  const [breakdown, setBreakdown] = React.useState(null);

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/commission-settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
      }
    } catch (error) {
      console.error('Error fetching commission settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key, value) => {
    try {
      await fetch(`${API_BASE_URL}/admin/commission-settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ value })
      });
      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const calculateBreakdown = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payment-calculator?amount=${testAmount}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBreakdown(data.breakdown);
      }
    } catch (error) {
      console.error('Error calculating breakdown:', error);
    }
  };

  const getSettingLabel = (key) => {
    const labels = {
      'platform_commission_rate': 'Platform Commission Rate',
      'renter_processing_fee_rate': 'Renter Processing Fee',
      'minimum_booking_amount': 'Minimum Booking Amount',
      'stripe_application_fee_rate': 'Stripe Processing Fee',
      'stripe_fixed_fee': 'Stripe Fixed Fee',
      'instant_payout_enabled': 'Instant Payouts',
      'payout_delay_days': 'Payout Delay (Days)'
    };
    return labels[key] || key;
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h2>Commission & Payment Settings</h2>
        <p>Configure platform fees, commissions, and payment processing like Giggster</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Settings */}
        <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-cog" style={{ color: '#5e72e4' }}></i>
            Commission Settings
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}><div className="spinner"></div></div>
          ) : settings.length === 0 ? (
            <p style={{ color: '#666' }}>No settings configured. Run the migration script to create default settings.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {settings.map((setting) => (
                <div key={setting.SettingID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fe', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{getSettingLabel(setting.SettingKey)}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{setting.Description}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type={setting.SettingType === 'boolean' ? 'checkbox' : 'text'}
                      value={setting.SettingValue}
                      checked={setting.SettingType === 'boolean' && setting.SettingValue === 'true'}
                      onChange={(e) => {
                        const newValue = setting.SettingType === 'boolean' ? e.target.checked.toString() : e.target.value;
                        setSettings(settings.map(s => s.SettingID === setting.SettingID ? { ...s, SettingValue: newValue } : s));
                      }}
                      onBlur={(e) => handleUpdateSetting(setting.SettingKey, setting.SettingType === 'boolean' ? e.target.checked.toString() : e.target.value)}
                      style={{ width: setting.SettingType === 'boolean' ? 'auto' : '80px', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '6px', textAlign: 'center' }}
                    />
                    {setting.SettingType === 'percentage' && <span>%</span>}
                    {setting.SettingType === 'fixed' && setting.SettingKey.includes('fee') && <span>$</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Calculator */}
        <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-calculator" style={{ color: '#5e72e4' }}></i>
            Payment Calculator
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Test Booking Amount ($)</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
                style={{ flex: 1, padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              />
              <button onClick={calculateBreakdown} style={{ background: '#5e72e4', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Calculate
              </button>
            </div>
          </div>

          {breakdown && (
            <div style={{ background: '#f8f9fe', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ marginBottom: '16px', color: '#5e72e4' }}>Payment Breakdown</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0' }}>
                  <span>Booking Amount</span>
                  <strong>${breakdown.bookingAmount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0' }}>
                  <span>Renter Processing Fee ({breakdown.renterFeeRate}%)</span>
                  <span style={{ color: '#5e72e4' }}>+${breakdown.renterProcessingFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0', fontWeight: 600 }}>
                  <span>Total Customer Pays</span>
                  <strong>${breakdown.totalCustomerPays}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0' }}>
                  <span>Platform Commission ({breakdown.platformCommissionRate}%)</span>
                  <span style={{ color: '#f5365c' }}>-${breakdown.platformCommission}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0e0e0' }}>
                  <span>Stripe Fees</span>
                  <span style={{ color: '#f5365c' }}>-${breakdown.stripeFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#d4edda', borderRadius: '8px', fontWeight: 600 }}>
                  <span>Vendor Payout</span>
                  <strong style={{ color: '#155724' }}>${breakdown.vendorPayout}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#e7f1ff', borderRadius: '8px', fontWeight: 600 }}>
                  <span>Platform Revenue</span>
                  <strong style={{ color: '#5e72e4' }}>${breakdown.platformRevenue}</strong>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '16px', background: '#fff3cd', borderRadius: '8px', fontSize: '13px', color: '#856404' }}>
            <strong>How it works (like Giggster):</strong>
            <ul style={{ margin: '8px 0 0 16px', paddingLeft: '0' }}>
              <li>PlanHive takes a {settings.find(s => s.SettingKey === 'platform_commission_rate')?.SettingValue || '15'}% commission from the host's payout</li>
              <li>Customers pay a {settings.find(s => s.SettingKey === 'renter_processing_fee_rate')?.SettingValue || '5'}% processing fee</li>
              <li>These fees cover platform development, support, and fraud prevention</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
