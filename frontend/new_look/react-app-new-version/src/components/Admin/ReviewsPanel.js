import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const ReviewsPanel = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, flagged, pending, suspicious
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view', 'edit', 'flag'
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchReviews();
  }, [filter, pagination.page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/reviews?filter=${filter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showBanner('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

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
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ flagged: true, reason })
      });

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
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}/unflag`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

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
                {status === 'flagged' && <span className="badge">3</span>}
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

      {/* Reviews List */}
      <div className="reviews-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-star"></i>
            <h3>No reviews found</h3>
            <p>Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review.ReviewID} className={`review-card ${review.IsFlagged ? 'flagged' : ''}`}>
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">
                      {review.ReviewerName?.[0] || 'U'}
                    </div>
                    <div>
                      <strong>{review.ReviewerName}</strong>
                      <span className="review-date">
                        {new Date(review.CreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="review-rating">
                    {renderStars(review.Rating)}
                    <span className="rating-value">{review.Rating}/5</span>
                  </div>
                </div>

                <div className="review-vendor">
                  <i className="fas fa-store"></i>
                  <span>{review.VendorName}</span>
                  {review.BookingID && (
                    <span className="booking-ref">Booking #{review.BookingID}</span>
                  )}
                </div>

                <div className="review-content">
                  <p>{review.ReviewText}</p>
                </div>

                {review.IsFlagged && (
                  <div className="flag-info">
                    <i className="fas fa-flag"></i>
                    <span>Flagged: {review.FlagReason}</span>
                  </div>
                )}

                {review.AdminNotes && (
                  <div className="admin-notes">
                    <i className="fas fa-sticky-note"></i>
                    <span>Admin Note: {review.AdminNotes}</span>
                  </div>
                )}

                <div className="review-actions">
                  <button
                    className="action-btn view"
                    onClick={() => { setSelectedReview(review); setModalType('view'); }}
                  >
                    <i className="fas fa-eye"></i> View
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => { setSelectedReview(review); setModalType('edit'); }}
                  >
                    <i className="fas fa-sticky-note"></i> Add Note
                  </button>
                  {review.IsFlagged ? (
                    <button
                      className="action-btn approve"
                      onClick={() => handleUnflagReview(review.ReviewID)}
                    >
                      <i className="fas fa-check"></i> Unflag
                    </button>
                  ) : (
                    <button
                      className="action-btn flag"
                      onClick={() => { setSelectedReview(review); setModalType('flag'); }}
                    >
                      <i className="fas fa-flag"></i> Flag
                    </button>
                  )}
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteReview(review.ReviewID)}
                  >
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
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

      {/* Suspicious Patterns Section */}
      <div className="section-card">
        <h3><i className="fas fa-exclamation-triangle"></i> Suspicious Review Patterns</h3>
        <div className="patterns-list">
          <div className="pattern-item warning">
            <div className="pattern-icon"><i className="fas fa-user-friends"></i></div>
            <div className="pattern-info">
              <strong>Multiple reviews from same IP</strong>
              <p>3 reviews for "Elite Catering" from 192.168.1.xxx</p>
            </div>
            <button className="btn-secondary">Investigate</button>
          </div>
          <div className="pattern-item warning">
            <div className="pattern-icon"><i className="fas fa-clock"></i></div>
            <div className="pattern-info">
              <strong>Rapid review submission</strong>
              <p>5 reviews submitted within 10 minutes for "Perfect Events"</p>
            </div>
            <button className="btn-secondary">Investigate</button>
          </div>
          <div className="pattern-item info">
            <div className="pattern-icon"><i className="fas fa-star"></i></div>
            <div className="pattern-info">
              <strong>Unusual rating pattern</strong>
              <p>"Photo Studio Pro" received 10 five-star reviews in 24 hours</p>
            </div>
            <button className="btn-secondary">Investigate</button>
          </div>
        </div>
      </div>

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review Details</h2>
          <button className="modal-close" onClick={onClose}>
            
          </button>
        </div>
        <div className="modal-body">
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
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Add Note Modal
const AddNoteModal = ({ review, onClose, onSave }) => {
  const [note, setNote] = useState(review.AdminNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${review.ReviewID}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ note })
      });

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Admin Note</h2>
          <button className="modal-close" onClick={onClose}>
            
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Add internal note for this review</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Enter admin notes..."
              rows={4}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Flag Review</h2>
          <button className="modal-close" onClick={onClose}>
            
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Select reason for flagging</label>
            <div className="reason-options">
              {flagReasons.map(r => (
                <label key={r} className="radio-option">
                  <input
                    type="radio"
                    name="flagReason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>
          {reason === 'Other' && (
            <div className="form-group">
              <label>Specify reason</label>
              <textarea
                placeholder="Enter specific reason..."
                rows={3}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-warning"
            onClick={() => onFlag(reason)}
            disabled={!reason}
          >
            Flag Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPanel;
