import React, { useState, useEffect } from 'react';
import { showBanner } from '../../utils/helpers';
import { apiGet, apiPost, apiPut } from '../../utils/api';
import UniversalModal, { FormModal } from '../UniversalModal';
import { LoadingState, EmptyState, FilterBar, Pagination, StatusBadge, ActionButton } from '../common/AdminComponents';
import { ActionButtonGroup, ActionButton as IconActionButton, ViewButton, EditButton } from '../common/UIComponents';

const UserManagementPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive, vendors, clients
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view', 'edit', 'activity'
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filter, pagination.page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/admin/users?status=${filter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showBanner('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      const response = await apiPost(`/admin/users/${userId}/toggle-status`);
      if (response.ok) {
        showBanner('User deactivated', 'success');
        fetchUsers();
      }
    } catch (error) {
      showBanner('Failed to deactivate user', 'error');
    }
  };

  const handleReactivate = async (userId) => {
    try {
      const response = await apiPost(`/admin/users/${userId}/toggle-status`);
      if (response.ok) {
        showBanner('User reactivated', 'success');
        fetchUsers();
      }
    } catch (error) {
      showBanner('Failed to reactivate user', 'error');
    }
  };

  const handleResetPassword = async (email) => {
    if (!window.confirm(`Send password reset email to ${email}?`)) return;
    try {
      const response = await apiPost('/admin/users/reset-password', { email });
      if (response.ok) {
        showBanner('Password reset email sent', 'success');
      }
    } catch (error) {
      showBanner('Failed to send reset email', 'error');
    }
  };

  const getAccountTypeBadge = (user) => {
    if (user.IsAdmin) {
      return <span className="status-badge badge-purple"><i className="fas fa-shield-alt"></i> Admin</span>;
    }
    if (user.IsVendor) {
      return <span className="status-badge badge-info"><i className="fas fa-store"></i> Vendor</span>;
    }
    return <span className="status-badge badge-secondary"><i className="fas fa-user"></i> Client</span>;
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="status-badge badge-success"><i className="fas fa-check-circle"></i> Active</span>
    ) : (
      <span className="status-badge badge-danger"><i className="fas fa-times-circle"></i> Inactive</span>
    );
  };

  // Bulk action handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(new Set(users.map(u => u.UserID)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) {
      showBanner('Please select users first', 'error');
      return;
    }
    if (!window.confirm(`Activate ${selectedUsers.size} user(s)?`)) return;
    
    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedUsers).map(userId =>
        apiPost(`/admin/users/${userId}/activate`)
      );
      await Promise.all(promises);
      showBanner(`${selectedUsers.size} user(s) activated`, 'success');
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      showBanner('Failed to activate users', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.size === 0) {
      showBanner('Please select users first', 'error');
      return;
    }
    if (!window.confirm(`Deactivate ${selectedUsers.size} user(s)?`)) return;
    
    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedUsers).map(userId =>
        apiPost(`/admin/users/${userId}/deactivate`)
      );
      await Promise.all(promises);
      showBanner(`${selectedUsers.size} user(s) deactivated`, 'success');
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      showBanner('Failed to deactivate users', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="admin-panel user-management">
      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {['all', 'active', 'inactive', 'vendors', 'clients'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="bulk-actions" style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
              <span style={{ alignSelf: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                {selectedUsers.size} selected
              </span>
              <button 
                className="btn-success" 
                onClick={handleBulkActivate}
                disabled={bulkActionLoading}
                title="Activate selected users"
              >
                <i className="fas fa-user-check"></i> Activate
              </button>
              <button 
                className="btn-danger" 
                onClick={handleBulkDeactivate}
                disabled={bulkActionLoading}
                title="Deactivate selected users"
              >
                <i className="fas fa-user-slash"></i> Deactivate
              </button>
            </div>
          )}
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
            />
          </div>
          <button className="btn-primary" onClick={fetchUsers}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="data-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-users"></i>
            <h3>No users found</h3>
            <p>Try adjusting your filters or search term</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedUsers.size === users.length && users.length > 0}
                  />
                </th>
                <th>User</th>
                <th>Email</th>
                <th>Account Type</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.UserID}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.has(user.UserID)}
                      onChange={() => handleSelectUser(user.UserID)}
                    />
                  </td>
                  <td>
                    <div className="user-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#5e72e4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.85rem', flexShrink: 0 }}>
                        {user.Name?.[0] || 'U'}
                      </div>
                      <div>
                        <strong style={{ display: 'block', color: '#1f2937' }}>{user.Name || 'Unknown'}</strong>
                        <small style={{ color: '#9ca3af', fontSize: '0.75rem' }}>ID: {user.UserID}</small>
                      </div>
                    </div>
                  </td>
                  <td>{user.Email}</td>
                  <td>{getAccountTypeBadge(user)}</td>
                  <td>{getStatusBadge(user.IsActive !== false)}</td>
                  <td>{new Date(user.CreatedAt).toLocaleDateString()}</td>
                  <td>{user.LastLoginAt ? new Date(user.LastLoginAt).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <ActionButtonGroup>
                      <ViewButton onClick={() => { setSelectedUser(user); setModalType('view'); }} />
                      <EditButton onClick={() => { setSelectedUser(user); setModalType('edit'); }} />
                      <IconActionButton action="activity" onClick={() => { setSelectedUser(user); setModalType('activity'); }} />
                      <IconActionButton action="password" onClick={() => handleResetPassword(user.Email)} />
                      {user.IsActive !== false ? (
                        <IconActionButton action="suspend" onClick={() => handleDeactivate(user.UserID)} title="Deactivate" />
                      ) : (
                        <IconActionButton action="activate" onClick={() => handleReactivate(user.UserID)} />
                      )}
                    </ActionButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
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

      {/* Modals */}
      {selectedUser && modalType === 'view' && (
        <UserViewModal
          user={selectedUser}
          onClose={() => { setSelectedUser(null); setModalType(null); }}
        />
      )}

      {selectedUser && modalType === 'edit' && (
        <UserEditModal
          user={selectedUser}
          onClose={() => { setSelectedUser(null); setModalType(null); }}
          onSave={() => { fetchUsers(); setSelectedUser(null); setModalType(null); }}
        />
      )}

      {selectedUser && modalType === 'activity' && (
        <UserActivityModal
          user={selectedUser}
          onClose={() => { setSelectedUser(null); setModalType(null); }}
        />
      )}
    </div>
  );
};

// User View Modal
const UserViewModal = ({ user, onClose }) => {
  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title="User Details"
      size="medium"
      footer={<button className="um-btn um-btn-secondary" onClick={onClose}>Close</button>}
    >
      <div className="user-profile-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div className="user-avatar large" style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '600' }}>
          {user.FirstName?.[0]}{user.LastName?.[0]}
        </div>
        <div>
          <h3 style={{ margin: 0 }}>{user.FirstName} {user.LastName}</h3>
          <p style={{ margin: '4px 0 0', color: '#6b7280' }}>{user.Email}</p>
        </div>
      </div>
      <div className="detail-section">
        <div className="detail-row"><label>User ID:</label><span>{user.UserID}</span></div>
        <div className="detail-row"><label>Account Type:</label><span>{user.IsAdmin ? 'Admin' : user.IsVendor ? 'Vendor' : 'Client'}</span></div>
        <div className="detail-row"><label>Status:</label><span>{user.IsActive !== false ? 'Active' : 'Inactive'}</span></div>
        <div className="detail-row"><label>Registered:</label><span>{new Date(user.CreatedAt).toLocaleString()}</span></div>
        <div className="detail-row"><label>Last Login:</label><span>{user.LastLoginAt ? new Date(user.LastLoginAt).toLocaleString() : 'Never'}</span></div>
        <div className="detail-row"><label>Phone:</label><span>{user.Phone || 'N/A'}</span></div>
      </div>
    </UniversalModal>
  );
};

// User Edit Modal
const UserEditModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    FirstName: user.FirstName || '',
    LastName: user.LastName || '',
    Email: user.Email || '',
    Phone: user.Phone || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiPut(`/admin/users/${user.UserID}`, formData);

      if (response.ok) {
        showBanner('User updated successfully', 'success');
        onSave();
      }
    } catch (error) {
      showBanner('Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      title="Edit User"
      onSave={handleSave}
      saving={saving}
      saveLabel="Save Changes"
    >
      <div className="form-row">
        <div className="form-group">
          <label>First Name</label>
          <input type="text" value={formData.FirstName} onChange={e => setFormData({ ...formData, FirstName: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input type="text" value={formData.LastName} onChange={e => setFormData({ ...formData, LastName: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={formData.Email} onChange={e => setFormData({ ...formData, Email: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input type="text" value={formData.Phone} onChange={e => setFormData({ ...formData, Phone: e.target.value })} />
      </div>
    </FormModal>
  );
};

// User Activity Modal
const UserActivityModal = ({ user, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await apiGet(`/admin/users/${user.UserID}/activity`);

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      'booking': 'fa-calendar-check',
      'review': 'fa-star',
      'chat': 'fa-comment',
      'login': 'fa-sign-in-alt',
      'profile_update': 'fa-user-edit',
      'payment': 'fa-credit-card'
    };
    return icons[type] || 'fa-circle';
  };

  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={`Activity Log: ${user.FirstName} ${user.LastName}`}
      size="large"
      footer={<button className="um-btn um-btn-secondary" onClick={onClose}>Close</button>}
    >
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading activity...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state small" style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fas fa-history" style={{ fontSize: '32px', color: '#d1d5db', marginBottom: '12px' }}></i>
          <p style={{ color: '#6b7280' }}>No activity recorded</p>
        </div>
      ) : (
        <div className="activity-timeline">
          {activities.map((activity, index) => (
            <div key={index} className="timeline-item" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div className="timeline-icon" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fas ${getActivityIcon(activity.type)}`}></i>
              </div>
              <div className="timeline-content">
                <p style={{ margin: 0 }}>{activity.description}</p>
                <span className="timeline-time" style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </UniversalModal>
  );
};

export default UserManagementPanel;
