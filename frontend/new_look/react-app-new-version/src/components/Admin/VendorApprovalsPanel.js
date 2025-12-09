import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const VendorApprovalsPanel = () => {
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  useEffect(() => {
    fetchProfiles();
  }, [filter]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/vendor-approvals?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingProfiles(data.profiles || []);
      } else {
        // Fallback to existing endpoint
        const fallbackResponse = await fetch(`${API_BASE_URL}/vendors/admin/pending-reviews`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setPendingProfiles(data.profiles || []);
        }
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      showBanner('Failed to load vendor profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorProfileId) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/admin/${vendorProfileId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ adminNotes })
      });

      if (response.ok) {
        showBanner('Vendor approved successfully! They are now live.', 'success');
        setSelectedProfile(null);
        setAdminNotes('');
        fetchProfiles();
      } else {
        throw new Error('Failed to approve');
      }
    } catch (error) {
      showBanner('Failed to approve vendor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (vendorProfileId) => {
    if (!rejectionReason.trim()) {
      showBanner('Please provide a rejection reason', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/admin/${vendorProfileId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rejectionReason, adminNotes })
      });

      if (response.ok) {
        showBanner('Vendor rejected. They will be notified.', 'success');
        setSelectedProfile(null);
        setRejectionReason('');
        setAdminNotes('');
        fetchProfiles();
      } else {
        throw new Error('Failed to reject');
      }
    } catch (error) {
      showBanner('Failed to reject vendor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending_review': { class: 'badge-warning', label: 'Pending Review', icon: 'fa-clock' },
      'approved': { class: 'badge-success', label: 'Approved', icon: 'fa-check-circle' },
      'rejected': { class: 'badge-danger', label: 'Rejected', icon: 'fa-times-circle' }
    };
    const config = statusMap[status] || { class: 'badge-secondary', label: status, icon: 'fa-question' };
    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fas ${config.icon}`}></i> {config.label}
      </span>
    );
  };

  return (
    <div className="admin-panel vendor-approvals-panel">
      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {['pending', 'approved', 'rejected', 'all'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'pending' && pendingProfiles.length > 0 && filter !== 'pending' && (
                  <span className="badge">{pendingProfiles.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={fetchProfiles}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Profiles List */}
      <div className="approvals-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading vendor applications...</p>
          </div>
        ) : pendingProfiles.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-check"></i>
            <h3>No {filter === 'all' ? '' : filter} vendor applications</h3>
            <p>{filter === 'pending' ? 'All caught up! No vendors waiting for review.' : 'No vendors match this filter.'}</p>
          </div>
        ) : (
          <div className="profiles-grid">
            {pendingProfiles.map(profile => (
              <div 
                key={profile.VendorProfileID} 
                className={`profile-card ${selectedProfile?.VendorProfileID === profile.VendorProfileID ? 'selected' : ''}`}
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="profile-header">
                  <div className="profile-image">
                    {profile.PrimaryImage ? (
                      <img src={profile.PrimaryImage} alt={profile.BusinessName} />
                    ) : (
                      <div className="image-placeholder">
                        <i className="fas fa-store"></i>
                      </div>
                    )}
                  </div>
                  <div className="profile-title">
                    <h3>{profile.BusinessName}</h3>
                    <p className="owner-info">
                      <i className="fas fa-user"></i> {profile.OwnerName || profile.Name}
                    </p>
                    <p className="email-info">
                      <i className="fas fa-envelope"></i> {profile.OwnerEmail || profile.Email}
                    </p>
                  </div>
                  {getStatusBadge(profile.ProfileStatus)}
                </div>

                <div className="profile-details">
                  <div className="detail-row">
                    <span className="label"><i className="fas fa-map-marker-alt"></i> Location:</span>
                    <span className="value">{profile.City}{profile.State ? `, ${profile.State}` : ''}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label"><i className="fas fa-tags"></i> Category:</span>
                    <span className="value">{profile.Categories || profile.Category || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label"><i className="fas fa-calendar"></i> Submitted:</span>
                    <span className="value">{formatDate(profile.CreatedAt)}</span>
                  </div>
                  {profile.BusinessPhone && (
                    <div className="detail-row">
                      <span className="label"><i className="fas fa-phone"></i> Phone:</span>
                      <span className="value">{profile.BusinessPhone}</span>
                    </div>
                  )}
                </div>

                {profile.BusinessDescription && (
                  <div className="profile-description">
                    <p>{profile.BusinessDescription.substring(0, 200)}{profile.BusinessDescription.length > 200 ? '...' : ''}</p>
                  </div>
                )}

                {profile.ProfileStatus === 'pending_review' && (
                  <div className="profile-actions">
                    <button 
                      className="btn-approve"
                      onClick={(e) => { e.stopPropagation(); setSelectedProfile(profile); }}
                    >
                      <i className="fas fa-check"></i> Review & Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedProfile && (
        <div className="modal-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Vendor Application</h2>
              <button className="close-btn" onClick={() => setSelectedProfile(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Vendor Info Section */}
              <div className="review-section">
                <h3><i className="fas fa-store"></i> Business Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Business Name</label>
                    <p>{selectedProfile.BusinessName}</p>
                  </div>
                  <div className="info-item">
                    <label>Display Name</label>
                    <p>{selectedProfile.DisplayName || selectedProfile.BusinessName}</p>
                  </div>
                  <div className="info-item">
                    <label>Category</label>
                    <p>{selectedProfile.Categories || selectedProfile.Category || 'Not specified'}</p>
                  </div>
                  <div className="info-item">
                    <label>Location</label>
                    <p>{selectedProfile.StreetAddress && `${selectedProfile.StreetAddress}, `}{selectedProfile.City}{selectedProfile.State ? `, ${selectedProfile.State}` : ''} {selectedProfile.PostalCode}</p>
                  </div>
                </div>
              </div>

              {/* Owner Info Section */}
              <div className="review-section">
                <h3><i className="fas fa-user"></i> Owner Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Owner Name</label>
                    <p>{selectedProfile.OwnerName || selectedProfile.Name}</p>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <p>{selectedProfile.OwnerEmail || selectedProfile.Email}</p>
                  </div>
                  <div className="info-item">
                    <label>Phone</label>
                    <p>{selectedProfile.BusinessPhone || 'Not provided'}</p>
                  </div>
                  <div className="info-item">
                    <label>Submitted</label>
                    <p>{formatDate(selectedProfile.CreatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="review-section">
                <h3><i className="fas fa-align-left"></i> Business Description</h3>
                <div className="description-box">
                  <p>{selectedProfile.BusinessDescription || 'No description provided'}</p>
                </div>
              </div>

              {/* Images Section */}
              {selectedProfile.PrimaryImage && (
                <div className="review-section">
                  <h3><i className="fas fa-images"></i> Business Photos</h3>
                  <div className="images-preview">
                    <img src={selectedProfile.PrimaryImage} alt="Primary" className="primary-image" />
                  </div>
                </div>
              )}

              {/* Services Section */}
              {selectedProfile.Services && selectedProfile.Services.length > 0 && (
                <div className="review-section">
                  <h3><i className="fas fa-concierge-bell"></i> Services Offered</h3>
                  <div className="services-list">
                    {selectedProfile.Services.map((service, idx) => (
                      <div key={idx} className="service-item">
                        <span className="service-name">{service.ServiceName}</span>
                        <span className="service-price">${service.Price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes Section */}
              <div className="review-section">
                <h3><i className="fas fa-sticky-note"></i> Admin Notes (Optional)</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any internal notes about this vendor..."
                  rows={3}
                />
              </div>

              {/* Rejection Reason Section */}
              {selectedProfile.ProfileStatus === 'pending_review' && (
                <div className="review-section rejection-section">
                  <h3><i className="fas fa-exclamation-triangle"></i> Rejection Reason (Required for rejection)</h3>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="If rejecting, explain why so the vendor can address the issues..."
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedProfile(null)}
              >
                Cancel
              </button>
              {selectedProfile.ProfileStatus === 'pending_review' && (
                <>
                  <button 
                    className="btn-danger"
                    onClick={() => handleReject(selectedProfile.VendorProfileID)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-times"></i>}
                    Reject
                  </button>
                  <button 
                    className="btn-success"
                    onClick={() => handleApprove(selectedProfile.VendorProfileID)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                    Approve Vendor
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorApprovalsPanel;
