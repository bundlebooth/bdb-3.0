import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function ClientReviewsSection() {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/reviews/user/${currentUser.id}`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        console.error('Failed to load reviews');
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      showBanner('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const renderReviewItem = (review) => {
    const reviewDate = new Date(review.CreatedAt);
    const formattedDate = reviewDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return (
      <div key={review.ReviewId} className="review-item">
        <div className="review-header">
          <div className="review-vendor">
            <i className="fas fa-store"></i>
            <span>{review.VendorName || 'Vendor'}</span>
          </div>
          <div className="review-rating">
            {[1, 2, 3, 4, 5].map(star => (
              <i 
                key={star}
                className={`fas fa-star ${star <= review.Rating ? 'filled' : ''}`}
              ></i>
            ))}
          </div>
        </div>
        <div className="review-date">{formattedDate}</div>
        <div className="review-text">{review.ReviewText}</div>
        {review.Response && (
          <div className="review-response">
            <strong>Vendor Response:</strong>
            <p>{review.Response}</p>
          </div>
        )}
        <div className="review-actions">
          <button className="btn btn-outline btn-sm">
            <i className="fas fa-edit"></i> Edit
          </button>
          <button className="btn btn-outline btn-sm">
            <i className="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div id="reviews-section">
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">My Reviews</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : reviews.length > 0 ? (
          <div id="user-reviews" className="reviews-list">
            {reviews.map(renderReviewItem)}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-star" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p>No reviews yet.</p>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              After completing a booking, you can leave a review for the vendor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientReviewsSection;
