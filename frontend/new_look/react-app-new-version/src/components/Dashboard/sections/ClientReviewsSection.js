import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';

function ClientReviewsSection() {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/reviews`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user reviews');
      const reviewsData = await response.json();
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      console.error('Error loading user reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const renderReviewItem = (review) => {
    return (
      <div key={review.ReviewID || review.id} className="review-card">
        <div className="review-header">
          <div className="reviewer">{review.VendorName}</div>
          <div className="review-date">{new Date(review.CreatedAt).toLocaleDateString()}</div>
        </div>
        <div className="review-rating">
          {'★'.repeat(review.Rating)}{'☆'.repeat(5 - review.Rating)}
        </div>
        {review.Title && (
          <div className="review-title">{review.Title}</div>
        )}
        <div className="review-text">{review.Comment}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div id="reviews-section">
        <div className="dashboard-card">
          <div id="user-reviews">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div id="reviews-section">
        <div className="dashboard-card">
          <div id="user-reviews">
            <p>No reviews submitted yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="reviews-section">
      <div className="dashboard-card">
        <div id="user-reviews">
          {reviews.map(renderReviewItem)}
        </div>
      </div>
    </div>
  );
}

export default ClientReviewsSection;
