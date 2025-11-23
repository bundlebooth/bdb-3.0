import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';

function VendorReviewsSection() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/reviews`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div style={{ color: '#fbbf24', fontSize: '1rem' }}>
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </div>
    );
  };

  if (loading) {
    return (
      <div id="vendor-reviews-section">
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="vendor-reviews-section">
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">Reviews</h2>
        
        {reviews.length > 0 && (
          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#f8fafc', 
            borderRadius: '12px', 
            marginBottom: '2rem',
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)' }}>
                {stats.averageRating.toFixed(1)}
              </div>
              <div style={{ color: '#fbbf24', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {'★'.repeat(Math.round(stats.averageRating))}{'☆'.repeat(5 - Math.round(stats.averageRating))}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>
        )}

        <div id="vendor-reviews">
          {reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {reviews.map(review => (
                <div key={review.ReviewID} style={{
                  padding: '1.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {review.ReviewerName || 'Anonymous'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        {new Date(review.CreatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {renderStars(review.Rating)}
                  </div>
                  <p style={{ color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                    {review.Comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-star" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
              <p>No reviews yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VendorReviewsSection;
