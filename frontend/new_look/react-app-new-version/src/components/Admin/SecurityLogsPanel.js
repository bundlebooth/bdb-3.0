import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const SecurityLogsPanel = () => {
  const [activeTab, setActiveTab] = useState('login'); // login, admin, flagged, 2fa
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [twoFASettings, setTwoFASettings] = useState({
    require2FAForAdmins: true,
    require2FAForVendors: false,
    sessionTimeout: 60,
    failedLoginLockout: 5
  });
  const [adminList, setAdminList] = useState([]);
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === '2fa') {
      fetch2FASettings();
      fetchAdminList();
    } else if (activeTab === 'flagged') {
      fetchFlaggedItems();
    } else {
      fetchLogs();
    }
  }, [activeTab, filter, pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'success' ? 'success' : filter === 'failed' ? 'failed' : '';
      const response = await fetch(
        `${API_BASE_URL}/admin/security/logs?type=${activeTab}&status=${statusFilter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Transform the data to match expected format
        const transformedLogs = (data.logs || []).map(log => ({
          id: log.id,
          user: log.user || log.email,
          admin: log.user || log.email,
          action: log.action === 'Login' ? 'Login Success' : 
                  log.action === 'LoginFailed' ? 'Login Failed' : 
                  log.action === 'Logout' ? 'Logout' :
                  log.action,
          ip: log.ip || 'Unknown',
          location: log.location || 'Unknown',
          device: log.device || log.userAgent || 'Unknown',
          details: log.details,
          target: log.details,
          timestamp: log.timestamp
        }));
        setLogs(transformedLogs);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        console.error('Failed to fetch logs, status:', response.status);
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetch2FASettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/security/2fa-settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setTwoFASettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching 2FA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/security/admin-2fa-status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminList(data.admins || []);
      }
    } catch (error) {
      console.error('Error fetching admin list:', error);
    }
  };

  const fetchFlaggedItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/security/flagged-items`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFlaggedItems(data.items || []);
        setLogs(data.items || []);
      } else {
        setFlaggedItems([]);
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching flagged items:', error);
      setFlaggedItems([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const save2FASettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/admin/security/2fa-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(twoFASettings)
      });
      if (response.ok) {
        showBanner('Security settings saved successfully', 'success');
      } else {
        showBanner('Failed to save settings', 'error');
      }
    } catch (error) {
      console.error('Error saving 2FA settings:', error);
      showBanner('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const reset2FA = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/security/reset-2fa/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        showBanner('2FA reset successfully', 'success');
        fetchAdminList();
      } else {
        showBanner('Failed to reset 2FA', 'error');
      }
    } catch (error) {
      console.error('Error resetting 2FA:', error);
      showBanner('Failed to reset 2FA', 'error');
    }
  };

  const getMockLogs = (type) => {
    const now = new Date();
    if (type === 'login') {
      return [
        { id: 1, user: 'john@example.com', action: 'Login Success', ip: '192.168.1.100', location: 'Toronto, ON', device: 'Chrome / Windows', timestamp: new Date(now - 1000 * 60 * 5).toISOString() },
        { id: 2, user: 'vendor@catering.com', action: 'Login Success', ip: '192.168.1.101', location: 'Vancouver, BC', device: 'Safari / macOS', timestamp: new Date(now - 1000 * 60 * 15).toISOString() },
        { id: 3, user: 'unknown@test.com', action: 'Login Failed', ip: '10.0.0.55', location: 'Unknown', device: 'Firefox / Linux', timestamp: new Date(now - 1000 * 60 * 30).toISOString() },
        { id: 4, user: 'admin@planhive.com', action: 'Login Success', ip: '192.168.1.1', location: 'Toronto, ON', device: 'Chrome / Windows', timestamp: new Date(now - 1000 * 60 * 60).toISOString() },
        { id: 5, user: 'jane@example.com', action: 'Password Reset', ip: '192.168.1.102', location: 'Montreal, QC', device: 'Chrome / Android', timestamp: new Date(now - 1000 * 60 * 120).toISOString() }
      ];
    } else if (type === 'admin') {
      return [
        { id: 1, admin: 'admin@planhive.com', action: 'Approved Vendor', target: 'Elite Catering Co.', details: 'Vendor profile approved', timestamp: new Date(now - 1000 * 60 * 10).toISOString() },
        { id: 2, admin: 'admin@planhive.com', action: 'Updated Settings', target: 'Platform Settings', details: 'Changed commission rate to 10%', timestamp: new Date(now - 1000 * 60 * 30).toISOString() },
        { id: 3, admin: 'admin@planhive.com', action: 'Deleted Review', target: 'Review #456', details: 'Removed for policy violation', timestamp: new Date(now - 1000 * 60 * 60).toISOString() },
        { id: 4, admin: 'admin@planhive.com', action: 'Suspended User', target: 'user@spam.com', details: 'Spam activity detected', timestamp: new Date(now - 1000 * 60 * 120).toISOString() },
        { id: 5, admin: 'admin@planhive.com', action: 'Issued Refund', target: 'Booking #1234', details: 'Full refund of $250', timestamp: new Date(now - 1000 * 60 * 180).toISOString() }
      ];
    } else if (type === 'flagged') {
      return [
        { id: 1, type: 'Account', item: 'user@suspicious.com', reason: 'Multiple failed login attempts', severity: 'high', timestamp: new Date(now - 1000 * 60 * 5).toISOString() },
        { id: 2, type: 'Chat', item: 'Conversation #789', reason: 'Reported for harassment', severity: 'medium', timestamp: new Date(now - 1000 * 60 * 30).toISOString() },
        { id: 3, type: 'Review', item: 'Review #456', reason: 'Suspected fake review', severity: 'low', timestamp: new Date(now - 1000 * 60 * 60).toISOString() },
        { id: 4, type: 'Vendor', item: 'Fake Business LLC', reason: 'Fraudulent documents', severity: 'high', timestamp: new Date(now - 1000 * 60 * 120).toISOString() }
      ];
    }
    return [];
  };

  const getActionBadge = (action) => {
    const actionMap = {
      'Login Success': { class: 'badge-success', icon: 'fa-check' },
      'Login Failed': { class: 'badge-danger', icon: 'fa-times' },
      'Password Reset': { class: 'badge-warning', icon: 'fa-key' },
      'Approved Vendor': { class: 'badge-success', icon: 'fa-check' },
      'Rejected Vendor': { class: 'badge-danger', icon: 'fa-times' },
      'Suspended User': { class: 'badge-dark', icon: 'fa-ban' },
      'Deleted Review': { class: 'badge-danger', icon: 'fa-trash' },
      'Issued Refund': { class: 'badge-info', icon: 'fa-undo' },
      'Updated Settings': { class: 'badge-purple', icon: 'fa-cog' }
    };
    const config = actionMap[action] || { class: 'badge-secondary', icon: 'fa-circle' };
    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fas ${config.icon}`}></i> {action}
      </span>
    );
  };

  const getSeverityBadge = (severity) => {
    const severityMap = {
      'high': { class: 'badge-danger', label: 'High' },
      'medium': { class: 'badge-warning', label: 'Medium' },
      'low': { class: 'badge-info', label: 'Low' }
    };
    const config = severityMap[severity] || { class: 'badge-secondary', label: severity };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="admin-panel security-logs">
      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
        >
          <i className="fas fa-sign-in-alt"></i> Login Activity
        </button>
        <button
          className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <i className="fas fa-user-shield"></i> Admin Actions
        </button>
        <button
          className={`tab ${activeTab === 'flagged' ? 'active' : ''}`}
          onClick={() => setActiveTab('flagged')}
        >
          <i className="fas fa-flag"></i> Flagged Items
        </button>
        <button
          className={`tab ${activeTab === '2fa' ? 'active' : ''}`}
          onClick={() => setActiveTab('2fa')}
        >
          <i className="fas fa-shield-alt"></i> 2FA Settings
        </button>
      </div>

      {/* Toolbar */}
      {activeTab !== '2fa' && (
        <div className="panel-toolbar">
          <div className="toolbar-left">
            {activeTab === 'login' && (
              <div className="filter-tabs">
                {['all', 'success', 'failed', 'reset'].map(status => (
                  <button
                    key={status}
                    className={`filter-tab ${filter === status ? 'active' : ''}`}
                    onClick={() => setFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="toolbar-right">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchLogs()}
              />
            </div>
            <button className="btn-secondary">
              <i className="fas fa-download"></i> Export
            </button>
            <button className="btn-primary" onClick={fetchLogs}>
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'login' && (
        <div className="data-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading logs...</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>IP Address</th>
                  <th>Location</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className={log.action === 'Login Failed' ? 'warning-row' : ''}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><strong>{log.user}</strong></td>
                    <td>{getActionBadge(log.action)}</td>
                    <td><code>{log.ip}</code></td>
                    <td>{log.location}</td>
                    <td><small>{log.device}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="data-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading logs...</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><strong>{log.admin}</strong></td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>{log.target}</td>
                    <td><small>{log.details}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'flagged' && (
        <div className="flagged-items">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading flagged items...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-check-circle"></i>
              <h3>No Flagged Items</h3>
              <p>There are no flagged items requiring attention</p>
            </div>
          ) : (
            <div className="flagged-list">
              {logs.map(item => (
                <div key={item.id} className={`flagged-item severity-${item.severity}`}>
                  <div className="flagged-icon">
                    <i className={`fas fa-${item.type === 'Account' ? 'user' : item.type === 'Chat' ? 'comment' : item.type === 'Review' ? 'star' : 'store'}`}></i>
                  </div>
                  <div className="flagged-info">
                    <div className="flagged-header">
                      <span className="flagged-type">{item.type}</span>
                      <span className="flagged-item-name">{item.item}</span>
                      {getSeverityBadge(item.severity)}
                    </div>
                    <p className="flagged-reason">{item.reason}</p>
                    <span className="flagged-time">{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flagged-actions">
                    <button className="btn-small primary">Review</button>
                    <button className="btn-small secondary">Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === '2fa' && (
        <div className="two-factor-settings">
          <div className="section-card">
            <h3><i className="fas fa-shield-alt"></i> Two-Factor Authentication</h3>
            <p className="section-description">
              Enhance security by requiring two-factor authentication for admin accounts.
            </p>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Require 2FA for Admins</h4>
                <p>All admin accounts must use two-factor authentication</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={twoFASettings.require2FAForAdmins}
                  onChange={(e) => setTwoFASettings(prev => ({ ...prev, require2FAForAdmins: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Require 2FA for Vendors</h4>
                <p>Vendor accounts must use two-factor authentication</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={twoFASettings.require2FAForVendors}
                  onChange={(e) => setTwoFASettings(prev => ({ ...prev, require2FAForVendors: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Session Timeout</h4>
                <p>Automatically log out inactive users after this period</p>
              </div>
              <select 
                value={twoFASettings.sessionTimeout}
                onChange={(e) => setTwoFASettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="480">8 hours</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Failed Login Lockout</h4>
                <p>Lock account after this many failed attempts</p>
              </div>
              <select 
                value={twoFASettings.failedLoginLockout}
                onChange={(e) => setTwoFASettings(prev => ({ ...prev, failedLoginLockout: parseInt(e.target.value) }))}
              >
                <option value="3">3 attempts</option>
                <option value="5">5 attempts</option>
                <option value="10">10 attempts</option>
              </select>
            </div>
          </div>

          <div className="section-card">
            <h3><i className="fas fa-key"></i> Admin 2FA Status</h3>
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Email</th>
                  <th>2FA Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminList.length > 0 ? adminList.map(admin => (
                  <tr key={admin.UserID}>
                    <td><strong>{admin.Name || 'Admin'}</strong></td>
                    <td>{admin.Email}</td>
                    <td>
                      <span className={`status-badge ${admin.TwoFactorEnabled ? 'badge-success' : 'badge-warning'}`}>
                        {admin.TwoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>{admin.LastLogin ? new Date(admin.LastLogin).toLocaleString() : 'Never'}</td>
                    <td>
                      <button className="btn-small secondary" onClick={() => reset2FA(admin.UserID)}>Reset 2FA</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>No admin users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="settings-footer">
            <button className="btn-primary" onClick={save2FASettings} disabled={saving}>
              <i className="fas fa-save"></i> {saving ? 'Saving...' : 'Save Security Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {activeTab !== '2fa' && pagination.total > pagination.limit && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default SecurityLogsPanel;
