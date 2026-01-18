import React, { useState, useEffect } from 'react';
import { showBanner } from '../../utils/helpers';
import { apiGet, apiPost, apiDelete } from '../../utils/api';
import UniversalModal, { FormModal } from '../UniversalModal';
import { LoadingState, EmptyState, StatusBadge } from '../common/AdminComponents';
import { ActionButtonGroup, ActionButton as IconActionButton, ViewButton, EditButton, DeleteButton } from '../common/UIComponents';

const ReviewsPanel = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, flagged, pending, suspicious
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view', 'edit', 'flag', 'google'
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [stats, setStats] = useState({ total: 0, flagged: 0, avgRating: 0 });
  const [activeTab, setActiveTab] = useState('platform'); // 'platform' or 'google'

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filter, pagination.page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/admin/reviews?filter=${filter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        console.error('Failed to fetch reviews:', response.status);
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showBanner('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiGet('/admin/reviews/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    try {
      const response = await apiDelete(`/admin/reviews/${reviewId}`);
      if (response.ok) {
        showBanner('Review deleted', 'success');
        fetchReviews();
      }
    } catch (error) {
      showBanner('Failed to delete review', 'error');
    }
  };

  const handleFlagReview = async (reviewId, reason) => {
    try {
      const response = await apiPost(`/admin/reviews/${reviewId}/flag`, { flagged: true, reason });
      if (response.ok) {
        showBanner('Review flagged', 'success');
        fetchReviews();
        setSelectedReview(null);
        setModalType(null);
      }
    } catch (error) {
      showBanner('Failed to flag review', 'error');
    }
  };

  const handleUnflagReview = async (reviewId) => {
    try {
      const response = await apiPost(`/admin/reviews/${reviewId}/unflag`);
      if (response.ok) {
        showBanner('Review unflagged', 'success');
        fetchReviews();
      }
    } catch (error) {
      showBanner('Failed to unflag review', 'error');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <i
            key={star}
            className={`fas fa-star ${star <= rating ? 'filled' : ''}`}
          ></i>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-panel reviews-panel">
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-star" style={{ color: '#2563eb', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{pagination.total || stats.total || 0}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Reviews</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-flag" style={{ color: '#d97706', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{stats.flagged || 0}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Flagged</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-chart-line" style={{ color: '#059669', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{stats.avgRating?.toFixed(1) || '0.0'}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Avg Rating</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fab fa-google" style={{ color: '#7c3aed', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{stats.googleReviews || 0}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Google Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Platform vs Google Reviews */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('platform')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'platform' ? '#5e72e4' : '#f3f4f6',
            color: activeTab === 'platform' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fas fa-star"></i> Platform Reviews
        </button>
        <button
          onClick={() => setActiveTab('google')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'google' ? '#5e72e4' : '#f3f4f6',
            color: activeTab === 'google' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fab fa-google"></i> Google Reviews
        </button>
      </div>

      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {['all', 'flagged', 'pending', 'suspicious'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'flagged' && stats.flagged > 0 && <span className="badge">{stats.flagged}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchReviews()}
            />
          </div>
          <button className="btn-primary" onClick={fetchReviews}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      {activeTab === 'platform' ? (
        <div className="data-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-star" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }}></i>
              <h3>No reviews found</h3>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>Reviews from clients will appear here once they submit feedback</p>
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>Try adjusting your filters or search term</p>
            </div>
          ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Vendor</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.ReviewID} style={{ background: review.IsFlagged ? '#fffbeb' : 'transparent' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: '#5e72e4', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}>
                        {review.ReviewerName?.[0] || 'U'}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.9rem' }}>{review.ReviewerName}</strong>
                        <small style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{review.ReviewerEmail}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <i className="fas fa-store" style={{ color: '#5e72e4', fontSize: '0.8rem' }}></i>
                      <span style={{ fontSize: '0.9rem' }}>{review.VendorName}</span>
                    </div>
                    {review.BookingID && (
                      <small style={{ display: 'block', color: '#0369a1', fontSize: '0.75rem' }}>Booking #{review.BookingID}</small>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {renderStars(review.Rating)}
                      <span style={{ fontWeight: '600', marginLeft: '0.25rem' }}>{review.Rating}/5</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: '250px' }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.85rem', 
                      color: '#374151',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {review.ReviewText}
                    </p>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#6b7280' }}>
                    {new Date(review.CreatedAt).toLocaleDateString()}
                  </td>
                  <td>
                    {review.IsFlagged ? (
                      <span className="status-badge badge-warning">
                        <i className="fas fa-flag"></i> Flagged
                      </span>
                    ) : (
                      <span className="status-badge badge-success">
                        <i className="fas fa-check"></i> Active
                      </span>
                    )}
                  </td>
                  <td>
                    <ActionButtonGroup>
                      <ViewButton onClick={() => { setSelectedReview(review); setModalType('view'); }} />
                      <EditButton onClick={() => { setSelectedReview(review); setModalType('edit'); }} title="Add Note" />
                      {review.IsFlagged ? (
                        <IconActionButton action="approve" onClick={() => handleUnflagReview(review.ReviewID)} title="Unflag" />
                      ) : (
                        <IconActionButton action="flag" onClick={() => { setSelectedReview(review); setModalType('flag'); }} />
                      )}
                      <DeleteButton onClick={() => handleDeleteReview(review.ReviewID)} title="Remove" />
                    </ActionButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      ) : (
        <GoogleReviewsSection />
      )}

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
      {selectedReview && modalType === 'view' && (
        <ReviewViewModal
          review={selectedReview}
          onClose={() => { setSelectedReview(null); setModalType(null); }}
        />
      )}

      {selectedReview && modalType === 'edit' && (
        <AddNoteModal
          review={selectedReview}
          onClose={() => { setSelectedReview(null); setModalType(null); }}
          onSave={() => { fetchReviews(); setSelectedReview(null); setModalType(null); }}
        />
      )}

      {selectedReview && modalType === 'flag' && (
        <FlagReviewModal
          review={selectedReview}
          onClose={() => { setSelectedReview(null); setModalType(null); }}
          onFlag={(reason) => handleFlagReview(selectedReview.ReviewID, reason)}
        />
      )}
    </div>
  );
};

// Review View Modal
const ReviewViewModal = ({ review, onClose }) => {
  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title="Review Details"
      size="medium"
      footer={<button className="um-btn um-btn-secondary" onClick={onClose}>Close</button>}
    >
      <div className="detail-section">
        <div className="detail-row">
          <label>Reviewer:</label>
          <span>{review.ReviewerName} ({review.ReviewerEmail})</span>
        </div>
        <div className="detail-row">
          <label>Vendor:</label>
          <span>{review.VendorName}</span>
        </div>
        <div className="detail-row">
          <label>Rating:</label>
          <span>{review.Rating}/5</span>
        </div>
        <div className="detail-row">
          <label>Date:</label>
          <span>{new Date(review.CreatedAt).toLocaleString()}</span>
        </div>
        {review.BookingID && (
          <div className="detail-row">
            <label>Booking:</label>
            <span>#{review.BookingID}</span>
          </div>
        )}
      </div>
      <div className="detail-section">
        <label>Review Text:</label>
        <p className="review-text-full">{review.ReviewText}</p>
      </div>
      {review.VendorResponse && (
        <div className="detail-section">
          <label>Vendor Response:</label>
          <p className="vendor-response">{review.VendorResponse}</p>
        </div>
      )}
    </UniversalModal>
  );
};

// Add Note Modal
const AddNoteModal = ({ review, onClose, onSave }) => {
  const [note, setNote] = useState(review.AdminNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiPost(`/admin/reviews/${review.ReviewID}/note`, { note });

      if (response.ok) {
        showBanner('Note saved', 'success');
        onSave();
      }
    } catch (error) {
      showBanner('Failed to save note', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      title="Admin Note"
      onSave={handleSave}
      saving={saving}
      saveLabel="Save Note"
    >
      <div className="form-group">
        <label>Add internal note for this review</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Enter admin notes..." rows={4} />
      </div>
    </FormModal>
  );
};

// Flag Review Modal
const FlagReviewModal = ({ review, onClose, onFlag }) => {
  const [reason, setReason] = useState('');
  const flagReasons = [
    'Inappropriate language',
    'Spam or fake review',
    'Conflict of interest',
    'Harassment or threats',
    'Irrelevant content',
    'Other'
  ];

  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title="Flag Review"
      size="medium"
      footer={
        <>
          <button className="um-btn um-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="um-btn" style={{ background: '#f59e0b', color: 'white' }} onClick={() => onFlag(reason)} disabled={!reason}>
            Flag Review
          </button>
        </>
      }
    >
      <div className="form-group">
        <label>Select reason for flagging</label>
        <div className="reason-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {flagReasons.map(r => (
            <label key={r} className="radio-option" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="radio" name="flagReason" value={r} checked={reason === r} onChange={() => setReason(r)} />
              {r}
            </label>
          ))}
        </div>
      </div>
      {reason === 'Other' && (
        <div className="form-group">
          <label>Specify reason</label>
          <textarea placeholder="Enter specific reason..." rows={3} onChange={e => setReason(e.target.value)} />
        </div>
      )}
    </UniversalModal>
  );
};

// Google Reviews Section Component
const GoogleReviewsSection = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [googleReviews, setGoogleReviews] = useState([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [placeId, setPlaceId] = useState('');

  useEffect(() => {
    fetchVendorsWithGoogle();
  }, []);

  const fetchVendorsWithGoogle = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/admin/vendors?page=1&limit=100');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGooglePlace = async (vendorId) => {
    if (!placeId.trim()) {
      showBanner('Please enter a Google Place ID', 'error');
      return;
    }
    
    try {
      const response = await apiPost(`/admin/vendors/${vendorId}/google-place`, { googlePlaceId: placeId });

      if (response.ok) {
        showBanner('Google Place linked successfully', 'success');
        setLinkModalOpen(false);
        setPlaceId('');
        fetchVendorsWithGoogle();
      } else {
        showBanner('Failed to link Google Place', 'error');
      }
    } catch (error) {
      showBanner('Failed to link Google Place', 'error');
    }
  };

  const fetchGoogleReviews = async (vendorId, googlePlaceId) => {
    if (!googlePlaceId) {
      showBanner('This vendor does not have a linked Google Place', 'error');
      return;
    }
    
    try {
      const response = await apiGet(`/admin/vendors/${vendorId}/google-reviews`);
      if (response.ok) {
        const data = await response.json();
        setGoogleReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching Google reviews:', error);
      setGoogleReviews([]);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner"></div>
        <p>Loading vendors...</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
          <i className="fab fa-google" style={{ color: '#4285f4', marginRight: '8px' }}></i>
          Google Reviews Integration
        </h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Link vendor profiles to their Google Business listings to display Google reviews
        </p>
      </div>

      <div style={{ 
        background: '#f0f9ff', 
        border: '1px solid #bae6fd', 
        borderRadius: '8px', 
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-info-circle"></i> How to Link Google Reviews
        </h4>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#0c4a6e' }}>
          <li>Find the vendor's Google Business listing</li>
          <li>Copy the Place ID from the URL or use Google's Place ID Finder</li>
          <li>Click "Link Google" next to the vendor and paste the Place ID</li>
          <li>Google reviews will automatically sync to the vendor's profile</li>
        </ol>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Vendor</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Category</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Google Status</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.slice(0, 20).map(vendor => (
            <tr key={vendor.VendorProfileID} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px', 
                    background: '#5e72e4', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {vendor.BusinessName?.[0] || 'V'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>{vendor.BusinessName}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{vendor.Email}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                {vendor.Category || 'N/A'}
              </td>
              <td style={{ padding: '12px 16px' }}>
                {vendor.GooglePlaceId ? (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '4px 10px',
                    background: '#d1fae5',
                    color: '#059669',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    <i className="fas fa-check-circle"></i> Linked
                  </span>
                ) : (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '4px 10px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    <i className="fas fa-unlink"></i> Not Linked
                  </span>
                )}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {vendor.GooglePlaceId ? (
                    <button
                      onClick={() => {
                        setSelectedVendor(vendor);
                        fetchGoogleReviews(vendor.VendorProfileID, vendor.GooglePlaceId);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#dbeafe',
                        color: '#2563eb',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fas fa-eye"></i> View Reviews
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setLinkModalOpen(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#5e72e4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fab fa-google"></i> Link Google
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Link Google Place Modal */}
      {linkModalOpen && selectedVendor && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setLinkModalOpen(false)}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '24px',
              width: '450px',
              maxWidth: '90%'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
              Link Google Business
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Enter the Google Place ID for <strong>{selectedVendor.BusinessName}</strong>
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Google Place ID
              </label>
              <input
                type="text"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="e.g., ChIJN1t_tDeuEmsRUsoyG83frY4"
                style={{ 
                  width: '100%', 
                  padding: '10px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                Find Place IDs at: <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" style={{ color: '#5e72e4' }}>Google Place ID Finder</a>
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setLinkModalOpen(false);
                  setPlaceId('');
                }}
                style={{ 
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleLinkGooglePlace(selectedVendor.VendorProfileID)}
                style={{ 
                  padding: '10px 20px',
                  background: '#5e72e4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Link Google Place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPanel;
