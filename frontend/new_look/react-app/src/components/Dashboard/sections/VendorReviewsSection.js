import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';

function VendorReviewsSection() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [vendorProfileId, setVendorProfileId] = useState(null);

  useEffect(() => {
    getVendorProfileId();
  }, [currentUser]);

  useEffect(() => {
    if (vendorProfileId) {
      loadReviews();
    }
  }, [vendorProfileId]);

  const getVendorProfileId = async () => {
    if (!currentUser?.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/profile?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVendorProfileId(data.vendorProfileId);
      }
    } catch (error) {
      console.error('Error getting vendor profile:', error);
    }
  };

  const loadReviews = useCallback(async () => {
    if (!vendorProfileId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/reviews/all`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch all vendor reviews');
      const reviewsData = await response.json();
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (error) {
      console.error('Error loading all vendor reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const renderReviewItem = (review) => {
    return (
      <div key={review.ReviewID || review.id} className="review-card">
        <div className="review-header">
          <div className="reviewer">{review.ClientName || review.ReviewerName || 'Client'}</div>
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
      <div id="vendor-reviews-section">
        <div className="dashboard-card">
          <div id="vendor-reviews">
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
      <div id="vendor-reviews-section">
        <div className="dashboard-card">
          <div id="vendor-reviews">
            <p>No reviews submitted yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="vendor-reviews-section">
      <div className="dashboard-card">
        <div id="vendor-reviews">
          {reviews.map(renderReviewItem)}
        </div>
      </div>
    </div>
  );
}

export default VendorReviewsSection;
