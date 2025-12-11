import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const VendorManagementPanel = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected, suspended, visible, hidden
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view', 'edit', 'reject', 'analytics'
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [selectedVendors, setSelectedVendors] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [filter, pagination.page]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/vendors?status=${filter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showBanner('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorId) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showBanner('Vendor approved and now visible on platform!', 'success');
        fetchVendors();
        setSelectedVendor(null);
        setModalType(null);
      }
    } catch (error) {
      showBanner('Failed to approve vendor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (vendorId, reason) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: reason })
      });

      if (response.ok) {
        showBanner('Vendor rejected and hidden from platform', 'success');
        fetchVendors();
        setSelectedVendor(null);
        setModalType(null);
      }
    } catch (error) {
      showBanner('Failed to reject vendor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (vendorId) => {
    if (!window.confirm('Are you sure you want to suspend this vendor? They will be hidden from the platform.')) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: 'Suspended by admin' })
      });

      if (response.ok) {
        showBanner('Vendor suspended and hidden from platform', 'success');
        fetchVendors();
      }
    } catch (error) {
      showBanner('Failed to suspend vendor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVisibility = async (vendorId, currentVisibility) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ visible: !currentVisibility })
      });

      if (response.ok) {
        const data = await response.json();
        showBanner(data.message || `Vendor ${currentVisibility ? 'hidden from' : 'now visible on'} platform`, 'success');
        fetchVendors();
      }
    } catch (error) {
      showBanner('Failed to update visibility', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk action handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedVendors(new Set(vendors.map(v => v.VendorProfileID)));
    } else {
      setSelectedVendors(new Set());
    }
  };

  const handleSelectVendor = (vendorId) => {
    const newSelected = new Set(selectedVendors);
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId);
    } else {
      newSelected.add(vendorId);
    }
    setSelectedVendors(newSelected);
  };

  const handleBulkMakeVisible = async () => {
    if (selectedVendors.size === 0) {
      showBanner('Please select vendors first', 'error');
      return;
    }
    if (!window.confirm(`Make ${selectedVendors.size} vendor(s) visible on the platform?`)) return;
    
    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedVendors).map(vendorId =>
        fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/visibility`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ visible: true })
        })
      );
      await Promise.all(promises);
      showBanner(`${selectedVendors.size} vendor(s) are now visible`, 'success');
      setSelectedVendors(new Set());
      fetchVendors();
    } catch (error) {
      showBanner('Failed to update visibility', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkMakeHidden = async () => {
    if (selectedVendors.size === 0) {
      showBanner('Please select vendors first', 'error');
      return;
    }
    if (!window.confirm(`Hide ${selectedVendors.size} vendor(s) from the platform?`)) return;
    
    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedVendors).map(vendorId =>
        fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/visibility`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ visible: false })
        })
      );
      await Promise.all(promises);
      showBanner(`${selectedVendors.size} vendor(s) are now hidden`, 'success');
      setSelectedVendors(new Set());
      fetchVendors();
    } catch (error) {
      showBanner('Failed to update visibility', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedVendors.size === 0) {
      showBanner('Please select vendors first', 'error');
      return;
    }
    if (!window.confirm(`Approve ${selectedVendors.size} vendor(s)?`)) return;
    
    try {
      setBulkActionLoading(true);
      const promises = Array.from(selectedVendors).map(vendorId =>
        fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      );
      await Promise.all(promises);
      showBanner(`${selectedVendors.size} vendor(s) approved and visible`, 'success');
      setSelectedVendors(new Set());
      fetchVendors();
    } catch (error) {
      showBanner('Failed to approve vendors', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleResetPassword = async (vendorId, email) => {
    if (!window.confirm(`Send password reset email to ${email}?`)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        showBanner('Password reset email sent', 'success');
      }
    } catch (error) {
      showBanner('Failed to send reset email', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Approved': { class: 'badge-success', icon: 'fa-check-circle' },
      'Pending': { class: 'badge-warning', icon: 'fa-clock' },
      'Rejected': { class: 'badge-danger', icon: 'fa-times-circle' },
      'Suspended': { class: 'badge-dark', icon: 'fa-ban' }
    };
    const config = statusMap[status] || { class: 'badge-secondary', icon: 'fa-question' };
    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fas ${config.icon}`}></i> {status}
      </span>
    );
  };

  return (
    <div className="admin-panel vendor-management">
      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {['all', 'pending', 'approved', 'rejected', 'suspended'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <span className="filter-divider">|</span>
            <button
              className={`filter-tab ${filter === 'visible' ? 'active' : ''}`}
              onClick={() => setFilter('visible')}
            >
              <i className="fas fa-eye"></i> Visible
            </button>
            <button
              className={`filter-tab ${filter === 'hidden' ? 'active' : ''}`}
              onClick={() => setFilter('hidden')}
            >
              <i className="fas fa-eye-slash"></i> Hidden
            </button>
          </div>
        </div>
        <div className="toolbar-right">
          {/* Bulk Actions */}
          {selectedVendors.size > 0 && (
            <div className="bulk-actions" style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
              <span style={{ alignSelf: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                {selectedVendors.size} selected
              </span>
              <button 
                className="btn-success" 
                onClick={handleBulkMakeVisible}
                disabled={bulkActionLoading}
                title="Make selected vendors visible"
              >
                <i className="fas fa-eye"></i> Make Visible
              </button>
              <button 
                className="btn-warning" 
                onClick={handleBulkMakeHidden}
                disabled={bulkActionLoading}
                title="Hide selected vendors"
              >
                <i className="fas fa-eye-slash"></i> Hide
              </button>
              <button 
                className="btn-primary" 
                onClick={handleBulkApprove}
                disabled={bulkActionLoading}
                title="Approve selected vendors"
              >
                <i className="fas fa-check"></i> Approve All
              </button>
            </div>
          )}
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchVendors()}
            />
          </div>
          <button className="btn-primary" onClick={fetchVendors}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="data-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-store"></i>
            <h3>No vendors found</h3>
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
                    checked={selectedVendors.size === vendors.length && vendors.length > 0}
                  />
                </th>
                <th>Vendor</th>
                <th>Owner</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Visibility</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(vendor => (
                <tr key={vendor.VendorProfileID}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedVendors.has(vendor.VendorProfileID)}
                      onChange={() => handleSelectVendor(vendor.VendorProfileID)}
                    />
                  </td>
                  <td>
                    <div className="vendor-cell">
                      {vendor.PrimaryImage ? (
                        <img src={vendor.PrimaryImage} alt={vendor.BusinessName} className="vendor-thumb" />
                      ) : (
                        <div className="vendor-thumb-placeholder">
                          <i className="fas fa-store"></i>
                        </div>
                      )}
                      <div>
                        <strong>{vendor.BusinessName}</strong>
                        <small>{vendor.DisplayName}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="owner-cell">
                      <span>{vendor.OwnerName}</span>
                      <small>{vendor.OwnerEmail}</small>
                    </div>
                  </td>
                  <td>{vendor.Categories || 'N/A'}</td>
                  <td>{vendor.City}, {vendor.State}</td>
                  <td>{getStatusBadge(vendor.ProfileStatus || 'Pending')}</td>
                  <td>
                    <div className="visibility-cell">
                      <button
                        className={`visibility-toggle ${vendor.IsVisible ? 'visible' : 'hidden'}`}
                        onClick={() => handleToggleVisibility(vendor.VendorProfileID, vendor.IsVisible)}
                        disabled={actionLoading}
                        title={vendor.IsVisible ? 'Click to hide from platform' : 'Click to show on platform'}
                      >
                        <i className={`fas fa-eye${vendor.IsVisible ? '' : '-slash'}`}></i>
                        <span>{vendor.IsVisible ? 'Visible' : 'Hidden'}</span>
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="rating-cell">
                      <i className="fas fa-star"></i>
                      <span>{vendor.AverageRating?.toFixed(1) || 'N/A'}</span>
                      <small>({vendor.ReviewCount || 0})</small>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        title="View Details"
                        onClick={() => { setSelectedVendor(vendor); setModalType('view'); }}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="action-btn edit"
                        title="Edit Vendor"
                        onClick={() => { setSelectedVendor(vendor); setModalType('edit'); }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {vendor.ProfileStatus === 'Pending' && (
                        <>
                          <button
                            className="action-btn approve"
                            title="Approve"
                            onClick={() => handleApprove(vendor.VendorProfileID)}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className="action-btn reject"
                            title="Reject"
                            onClick={() => { setSelectedVendor(vendor); setModalType('reject'); }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                      {vendor.ProfileStatus === 'Approved' && (
                        <button
                          className="action-btn suspend"
                          title="Suspend"
                          onClick={() => handleSuspend(vendor.VendorProfileID)}
                        >
                          <i className="fas fa-ban"></i>
                        </button>
                      )}
                      <button
                        className="action-btn analytics"
                        title="View Analytics"
                        onClick={() => { setSelectedVendor(vendor); setModalType('analytics'); }}
                      >
                        <i className="fas fa-chart-line"></i>
                      </button>
                      <button
                        className="action-btn password"
                        title="Reset Password"
                        onClick={() => handleResetPassword(vendor.VendorProfileID, vendor.OwnerEmail)}
                      >
                        <i className="fas fa-key"></i>
                      </button>
                    </div>
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
      {selectedVendor && modalType === 'view' && (
        <VendorViewModal
          vendor={selectedVendor}
          onClose={() => { setSelectedVendor(null); setModalType(null); }}
          onApprove={() => handleApprove(selectedVendor.VendorProfileID)}
          onReject={() => setModalType('reject')}
          actionLoading={actionLoading}
        />
      )}

      {selectedVendor && modalType === 'edit' && (
        <VendorEditModal
          vendor={selectedVendor}
          onClose={() => { setSelectedVendor(null); setModalType(null); }}
          onSave={() => { fetchVendors(); setSelectedVendor(null); setModalType(null); }}
        />
      )}

      {selectedVendor && modalType === 'reject' && (
        <RejectModal
          vendor={selectedVendor}
          onClose={() => { setSelectedVendor(null); setModalType(null); }}
          onReject={(reason) => handleReject(selectedVendor.VendorProfileID, reason)}
          actionLoading={actionLoading}
        />
      )}

      {selectedVendor && modalType === 'analytics' && (
        <VendorAnalyticsModal
          vendor={selectedVendor}
          onClose={() => { setSelectedVendor(null); setModalType(null); }}
        />
      )}
    </div>
  );
};

// Vendor View Modal
const VendorViewModal = ({ vendor, onClose, onApprove, onReject, actionLoading }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Vendor Details: {vendor.BusinessName}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="vendor-detail-grid">
            <div className="detail-section">
              <h3>Business Information</h3>
              <div className="detail-row">
                <label>Business Name:</label>
                <span>{vendor.BusinessName}</span>
              </div>
              <div className="detail-row">
                <label>Display Name:</label>
                <span>{vendor.DisplayName}</span>
              </div>
              <div className="detail-row">
                <label>Categories:</label>
                <span>{vendor.Categories || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Description:</label>
                <p>{vendor.BusinessDescription || 'No description provided'}</p>
              </div>
            </div>

            <div className="detail-section">
              <h3>Contact Information</h3>
              <div className="detail-row">
                <label>Owner:</label>
                <span>{vendor.OwnerName}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{vendor.OwnerEmail}</span>
              </div>
              <div className="detail-row">
                <label>Phone:</label>
                <span>{vendor.BusinessPhone || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Website:</label>
                <span>{vendor.Website || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Location</h3>
              <div className="detail-row">
                <label>Address:</label>
                <span>{vendor.StreetAddress || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>City:</label>
                <span>{vendor.City}</span>
              </div>
              <div className="detail-row">
                <label>State/Province:</label>
                <span>{vendor.State}</span>
              </div>
              <div className="detail-row">
                <label>Postal Code:</label>
                <span>{vendor.PostalCode || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Documents</h3>
              <div className="documents-list">
                {vendor.Documents?.length > 0 ? (
                  vendor.Documents.map((doc, index) => (
                    <a key={index} href={doc.url} target="_blank" rel="noopener noreferrer" className="document-link">
                      <i className="fas fa-file-pdf"></i> {doc.name}
                    </a>
                  ))
                ) : (
                  <p className="no-documents">No documents submitted</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {vendor.ProfileStatus === 'Pending' && (
            <>
              <button className="btn-success" onClick={onApprove} disabled={actionLoading}>
                <i className="fas fa-check"></i> Approve
              </button>
              <button className="btn-danger" onClick={onReject} disabled={actionLoading}>
                <i className="fas fa-times"></i> Reject
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Vendor Edit Modal
const VendorEditModal = ({ vendor, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    BusinessName: vendor.BusinessName || '',
    DisplayName: vendor.DisplayName || '',
    BusinessDescription: vendor.BusinessDescription || '',
    BusinessPhone: vendor.BusinessPhone || '',
    Website: vendor.Website || '',
    City: vendor.City || '',
    State: vendor.State || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendor.VendorProfileID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showBanner('Vendor updated successfully', 'success');
        onSave();
      }
    } catch (error) {
      showBanner('Failed to update vendor', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Vendor: {vendor.BusinessName}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              value={formData.BusinessName}
              onChange={e => setFormData({ ...formData, BusinessName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={formData.DisplayName}
              onChange={e => setFormData({ ...formData, DisplayName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.BusinessDescription}
              onChange={e => setFormData({ ...formData, BusinessDescription: e.target.value })}
              rows={4}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.BusinessPhone}
                onChange={e => setFormData({ ...formData, BusinessPhone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="text"
                value={formData.Website}
                onChange={e => setFormData({ ...formData, Website: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.City}
                onChange={e => setFormData({ ...formData, City: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Province/State</label>
              <input
                type="text"
                value={formData.State}
                onChange={e => setFormData({ ...formData, State: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Reject Modal
const RejectModal = ({ vendor, onClose, onReject, actionLoading }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reject Vendor: {vendor.BusinessName}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Rejection Reason (will be sent to vendor)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Please provide a clear reason for rejection..."
              rows={4}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-danger"
            onClick={() => onReject(reason)}
            disabled={actionLoading || !reason.trim()}
          >
            {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Vendor Analytics Modal
const VendorAnalyticsModal = ({ vendor, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendor.VendorProfileID}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Analytics: {vendor.BusinessName}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading analytics...</p>
            </div>
          ) : (
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-icon"><i className="fas fa-eye"></i></div>
                <div className="analytics-value">{analytics?.profileViews || 0}</div>
                <div className="analytics-label">Profile Views</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-icon"><i className="fas fa-calendar-check"></i></div>
                <div className="analytics-value">{analytics?.totalBookings || 0}</div>
                <div className="analytics-label">Total Bookings</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-icon"><i className="fas fa-star"></i></div>
                <div className="analytics-value">{analytics?.averageRating?.toFixed(1) || 'N/A'}</div>
                <div className="analytics-label">Average Rating</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-icon"><i className="fas fa-dollar-sign"></i></div>
                <div className="analytics-value">${analytics?.totalRevenue?.toLocaleString() || 0}</div>
                <div className="analytics-label">Total Revenue</div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default VendorManagementPanel;
