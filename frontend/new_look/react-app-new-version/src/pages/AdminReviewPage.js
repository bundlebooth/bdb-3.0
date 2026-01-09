import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { PageLayout } from '../components/PageWrapper';
import { showBanner } from '../utils/helpers';
import './AdminReviewPage.css';

const AdminReviewPage = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;

    if (!currentUser) {
      showBanner('Please log in to access this page', 'error');
      navigate('/');
      return;
    }

    // Fetch pending profiles - admin check is done via the button visibility
    // and backend will also verify admin status
    fetchPendingProfiles();
  }, [currentUser, authLoading, navigate]);

  const fetchPendingProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/admin/pending-reviews`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending reviews');
      }

      const data = await response.json();
      setPendingProfiles(data.profiles || []);
    } catch (error) {
      console.error('Error fetching pending profiles:', error);
      showBanner('Failed to load pending reviews', 'error');
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

      if (!response.ok) {
        throw new Error('Failed to approve profile');
      }

      showBanner('Profile approved successfully! The vendor is now live.', 'success');
      setSelectedProfile(null);
      setAdminNotes('');
      fetchPendingProfiles();
    } catch (error) {
      console.error('Error approving profile:', error);
      showBanner('Failed to approve profile', 'error');
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

      if (!response.ok) {
        throw new Error('Failed to reject profile');
      }

      showBanner('Profile rejected. The vendor will be notified.', 'success');
      setSelectedProfile(null);
      setRejectionReason('');
      setAdminNotes('');
      fetchPendingProfiles();
    } catch (error) {
      console.error('Error rejecting profile:', error);
      showBanner('Failed to reject profile', 'error');
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

  // Show loading while auth is checking or data is loading
  if (authLoading || loading) {
    return (
      <div className="admin-review-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{authLoading ? 'Checking authentication...' : 'Loading pending reviews...'}</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout variant="admin" pageClassName="admin-review-page-layout">
      <div className="admin-review-page">
      <header className="admin-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <img src="/images/logo.png" alt="PlanBeau" style={{ height: '140px', width: 'auto' }} />
          </div>
          <h1>Admin: Vendor Profile Reviews</h1>
          <button className="btn-back" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i> Back to Home
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-number">{pendingProfiles.length}</span>
            <span className="stat-label">Pending Reviews</span>
          </div>
        </div>

        {pendingProfiles.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-check-circle"></i>
            <h2>All Caught Up!</h2>
            <p>There are no vendor profiles pending review at this time.</p>
          </div>
        ) : (
          <div className="profiles-grid">
            {pendingProfiles.map((profile) => (
              <div key={profile.VendorProfileID} className="profile-card">
                <div className="profile-header">
                  {profile.PrimaryImage ? (
                    <img src={profile.PrimaryImage} alt={profile.BusinessName} className="profile-image" />
                  ) : (
                    <div className="profile-image-placeholder">
                      <i className="fas fa-store"></i>
                    </div>
                  )}
                  <div className="profile-info">
                    <h3>{profile.DisplayName || profile.BusinessName}</h3>
                    <p className="business-name">{profile.BusinessName}</p>
                    <div className="profile-meta">
                      <span><i className="fas fa-map-marker-alt"></i> {profile.City}, {profile.State}</span>
                      <span><i className="fas fa-tags"></i> {profile.Categories || 'No categories'}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-details">
                  <div className="detail-row">
                    <span className="label">Owner:</span>
                    <span className="value">{profile.OwnerName} ({profile.OwnerEmail})</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Phone:</span>
                    <span className="value">{profile.BusinessPhone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Website:</span>
                    <span className="value">
                      {profile.Website ? (
                        <a href={profile.Website} target="_blank" rel="noopener noreferrer">{profile.Website}</a>
                      ) : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Submitted:</span>
                    <span className="value">{formatDate(profile.SubmittedForReviewAt)}</span>
                  </div>
                </div>

                {profile.BusinessDescription && (
                  <div className="profile-description">
                    <p>{profile.BusinessDescription.substring(0, 200)}{profile.BusinessDescription.length > 200 ? '...' : ''}</p>
                  </div>
                )}

                <div className="profile-actions">
                  <button 
                    className="btn-view"
                    onClick={() => window.open(`/vendor/${profile.VendorProfileID}`, '_blank')}
                  >
                    <i className="fas fa-eye"></i> View Profile
                  </button>
                  <button 
                    className="btn-approve"
                    onClick={() => handleApprove(profile.VendorProfileID)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-check"></i> Approve
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => setSelectedProfile(profile)}
                    disabled={actionLoading}
                  >
                    <i className="fas fa-times"></i> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Rejection Modal */}
      {selectedProfile && (
        <div className="modal-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Profile: {selectedProfile.BusinessName}</h2>
              <button className="modal-close" onClick={() => setSelectedProfile(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Rejection Reason (Required)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection. This will be shown to the vendor."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Admin Notes (Optional, internal only)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes for admin reference..."
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setSelectedProfile(null)}>
                Cancel
              </button>
              <button 
                className="btn-reject-confirm"
                onClick={() => handleReject(selectedProfile.VendorProfileID)}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PageLayout>
  );
};

export default AdminReviewPage;
