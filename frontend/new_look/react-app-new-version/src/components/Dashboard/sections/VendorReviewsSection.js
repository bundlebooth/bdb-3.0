import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';

function VendorReviewsSection() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [googleReviews, setGoogleReviews] = useState(null);
  const [googleReviewsLoading, setGoogleReviewsLoading] = useState(false);
  const [vendorProfileId, setVendorProfileId] = useState(null);
  const [googlePlaceId, setGooglePlaceId] = useState(null);
  const [showGoogleReviews, setShowGoogleReviews] = useState(false);

  useEffect(() => {
    getVendorProfileId();
  }, [currentUser]);

  useEffect(() => {
    if (vendorProfileId) {
      loadReviews();
      loadVendorProfile();
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

  const loadVendorProfile = useCallback(async () => {
    if (!vendorProfileId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        const placeId = data.data?.profile?.GooglePlaceId;
        if (placeId) {
          setGooglePlaceId(placeId);
          loadGoogleReviews(placeId);
        }
      }
    } catch (error) {
      console.error('Error loading vendor profile:', error);
    }
  }, [vendorProfileId]);

  const loadGoogleReviews = useCallback(async (placeId) => {
    if (!placeId) return;
    try {
      setGoogleReviewsLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/google-reviews/${placeId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setGoogleReviews(data.data);
      }
    } catch (error) {
      console.error('Error loading Google reviews:', error);
    } finally {
      setGoogleReviewsLoading(false);
    }
  }, []);

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

  const renderReviewItem = (review, isGoogle = false) => {
    if (isGoogle) {
      return (
        <div key={review.author_name + review.time} className="review-card" style={{ 
          padding: '1rem', 
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '0.5rem'
        }}>
          <div className="review-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {review.profile_photo_url && (
              <img 
                src={review.profile_photo_url} 
                alt={review.author_name} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <div>
              <div className="reviewer" style={{ fontWeight: 600, color: '#111827' }}>{review.author_name || 'Anonymous'}</div>
              <div className="review-date" style={{ fontSize: '0.85rem', color: '#6b7280' }}>{review.relative_time_description}</div>
            </div>
          </div>
          <div className="review-rating" style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>
            {'★'.repeat(review.rating || 0)}{'☆'.repeat(5 - (review.rating || 0))}
          </div>
          <div className="review-text" style={{ color: '#374151', lineHeight: 1.5 }}>{review.text}</div>
        </div>
      );
    }
    
    return (
      <div key={review.ReviewID || review.id} className="review-card" style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '0.5rem'
      }}>
        <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div className="reviewer" style={{ fontWeight: 600, color: '#111827' }}>{review.ClientName || review.ReviewerName || 'Client'}</div>
          <div className="review-date" style={{ fontSize: '0.85rem', color: '#6b7280' }}>{(() => {
            if (!review.CreatedAt) return 'N/A';
            const date = new Date(review.CreatedAt);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString();
          })()}</div>
        </div>
        <div className="review-rating" style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>
          {'★'.repeat(review.Rating)}{'☆'.repeat(5 - review.Rating)}
        </div>
        {review.Title && (
          <div className="review-title" style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{review.Title}</div>
        )}
        <div className="review-text" style={{ color: '#374151', lineHeight: 1.5 }}>{review.Comment}</div>
      </div>
    );
  };

  const hasGoogleReviews = googleReviews && (googleReviews.reviews?.length > 0 || googleReviews.rating > 0);
  const hasPlatformReviews = reviews && reviews.length > 0;
  const currentReviews = showGoogleReviews ? (googleReviews?.reviews || []) : reviews;

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

  return (
    <div id="vendor-reviews-section">
      <div className="dashboard-card">
        {/* Toggle Switch for In-App vs Google Reviews */}
        {(hasGoogleReviews || googlePlaceId) && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end',
            gap: '0.5rem',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ 
              fontSize: '0.85rem', 
              color: showGoogleReviews ? '#6b7280' : '#5e72e4', 
              fontWeight: showGoogleReviews ? 400 : 600
            }}>
              In-App ({reviews.length})
            </span>
            
            <div 
              onClick={() => setShowGoogleReviews(!showGoogleReviews)}
              style={{
                width: '44px',
                height: '22px',
                backgroundColor: showGoogleReviews ? '#5e72e4' : '#e2e8f0',
                borderRadius: '11px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                backgroundColor: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: showGoogleReviews ? '24px' : '2px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
              }} />
            </div>
            
            <span style={{ 
              fontSize: '0.85rem', 
              color: showGoogleReviews ? '#5e72e4' : '#6b7280', 
              fontWeight: showGoogleReviews ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <img 
                src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" 
                alt="Google" 
                style={{ height: '14px' }} 
              />
              ({googleReviews?.user_ratings_total || googleReviews?.reviews?.length || 0})
            </span>
          </div>
        )}

        {/* Rating Summary */}
        {(showGoogleReviews ? hasGoogleReviews : hasPlatformReviews) && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            marginBottom: '1rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827' }}>
              {showGoogleReviews ? (googleReviews?.rating?.toFixed(1) || '0.0') : '5.0'}
            </div>
            <div>
              <div style={{ color: '#f59e0b', marginBottom: '0.25rem' }}>
                {'★'.repeat(Math.round(showGoogleReviews ? (googleReviews?.rating || 0) : 5))}
                {'☆'.repeat(5 - Math.round(showGoogleReviews ? (googleReviews?.rating || 0) : 5))}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Based on {showGoogleReviews ? (googleReviews?.user_ratings_total || googleReviews?.reviews?.length || 0) : reviews.length} {showGoogleReviews ? 'Google ' : ''}reviews
              </div>
            </div>
          </div>
        )}

        <div id="vendor-reviews">
          {googleReviewsLoading && showGoogleReviews ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Loading Google reviews...
            </div>
          ) : currentReviews.length > 0 ? (
            currentReviews.map(review => renderReviewItem(review, showGoogleReviews))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <i className="fas fa-comment" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.3, display: 'block' }}></i>
              <p>No {showGoogleReviews ? 'Google' : 'in-app'} reviews yet.</p>
              {!showGoogleReviews && googlePlaceId && (
                <button 
                  onClick={() => setShowGoogleReviews(true)}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#5e72e4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  View Google Reviews
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VendorReviewsSection;
