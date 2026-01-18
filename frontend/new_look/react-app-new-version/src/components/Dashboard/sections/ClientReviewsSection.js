import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiGet, apiPost } from '../../../utils/api';
import { showBanner } from '../../../utils/banners';

function ClientReviewsSection() {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'submitted'
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Review form state - start with 0 stars (empty)
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    comment: '',
    qualityRating: 0,
    communicationRating: 0,
    valueRating: 0,
    punctualityRating: 0,
    professionalismRating: 0,
    wouldRecommend: true
  });

  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      
      // Load submitted reviews
      const reviewsResp = await apiGet(`/users/${currentUser.id}/reviews`);
      const reviewsData = reviewsResp.ok ? await reviewsResp.json() : [];
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      
      // Load all bookings to find past ones that can be reviewed
      const bookingsResp = await apiGet(`/users/${currentUser.id}/bookings/all`);
      const bookingsData = bookingsResp.ok ? await bookingsResp.json() : [];
      
      // Filter for past, paid bookings that haven't been reviewed
      const reviewedBookingIds = new Set((Array.isArray(reviewsData) ? reviewsData : []).map(r => r.BookingID));
      const now = new Date();
      const pastPaidBookings = (Array.isArray(bookingsData) ? bookingsData : []).filter(b => {
        const eventDate = new Date(b.EventDate);
        const isPast = eventDate < now;
        const isPaid = b.FullAmountPaid === true || b.FullAmountPaid === 1 || 
                       (b.Status || '').toLowerCase() === 'paid';
        const notReviewed = !reviewedBookingIds.has(b.BookingID);
        return isPast && isPaid && notReviewed;
      });
      
      setPastBookings(pastPaidBookings);
    } catch (error) {
      console.error('Error loading reviews data:', error);
      setReviews([]);
      setPastBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setReviewForm({
      rating: 0,
      title: '',
      comment: '',
      qualityRating: 0,
      communicationRating: 0,
      valueRating: 0,
      punctualityRating: 0,
      professionalismRating: 0,
      wouldRecommend: true
    });
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedBooking || !reviewForm.comment.trim()) return;
    
    setSubmitting(true);
    try {
      const resp = await apiPost('/vendors/reviews/submit', {
        userId: currentUser.id,
        vendorProfileId: selectedBooking.VendorProfileID,
        bookingId: selectedBooking.BookingID,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        qualityRating: reviewForm.qualityRating,
        communicationRating: reviewForm.communicationRating,
        valueRating: reviewForm.valueRating,
        punctualityRating: reviewForm.punctualityRating,
        professionalismRating: reviewForm.professionalismRating,
        wouldRecommend: reviewForm.wouldRecommend
      });
      
      const data = await resp.json();
      if (data.success) {
        setShowReviewModal(false);
        showBanner('Your review has been submitted successfully!', 'success');
        loadData(); // Reload to update lists
      } else {
        alert(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              color: star <= value ? '#5e72e4' : '#d1d5db',
              padding: '2px',
              transition: 'transform 0.1s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.2)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  const renderPendingBooking = (booking) => {
    const itemId = booking.RequestID || booking.BookingID;
    
    return (
      <div key={itemId} style={{
        padding: '16px 20px',
        background: 'white',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Vendor Logo/Image */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#e2e8f0',
          flexShrink: 0
        }}>
          <img 
            src={booking.VendorLogo || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
            alt={booking.VendorName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }}
          />
        </div>
        {/* Booking Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: '15px', marginBottom: '2px' }}>
            {booking.VendorName || 'Vendor'}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
            {booking.ServiceName || 'Service'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
            {booking.EventDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i className="fas fa-calendar-alt" style={{ fontSize: '12px' }}></i>
                {new Date(booking.EventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {booking.TotalAmount != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i className="fas fa-dollar-sign" style={{ fontSize: '12px' }}></i>
                ${Number(booking.TotalAmount).toLocaleString()} CAD
              </span>
            )}
            {(booking.Location || booking.EventLocation) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i className="fas fa-map-marker-alt" style={{ fontSize: '12px' }}></i>
                {booking.Location || booking.EventLocation}
              </span>
            )}
          </div>
        </div>
        {/* Write Review Button */}
        <button
          onClick={() => openReviewModal(booking)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '6px 14px',
            background: '#5e72e4',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            flexShrink: 0,
            width: 'auto',
            minWidth: 'unset',
            flex: 'none'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#4c5fd7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#5e72e4'; }}
        >
          <i className="fas fa-pen" style={{ fontSize: '10px' }}></i>
          Write Review
        </button>
      </div>
    );
  };

  const renderReviewItem = (review) => {
    const surveyRatings = [
      { label: 'Quality', value: review.QualityRating },
      { label: 'Communication', value: review.CommunicationRating },
      { label: 'Value', value: review.ValueRating },
      { label: 'Punctuality', value: review.PunctualityRating },
      { label: 'Professionalism', value: review.ProfessionalismRating }
    ].filter(r => r.value != null);

    return (
      <div key={review.ReviewID || review.id} style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#111827', fontSize: '16px' }}>
              {review.VendorName || 'Vendor'}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              {(() => {
                const rawDate = review.CreatedAt || review.createdAt || review.ReviewDate || review.reviewDate || review.DateCreated;
                if (!rawDate) return '';
                const date = new Date(rawDate);
                if (isNaN(date.getTime())) return '';
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              })()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#5e72e4', fontSize: '18px' }}>
              {'★'.repeat(review.Rating)}{'☆'.repeat(5 - review.Rating)}
            </span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{review.Rating}/5</span>
          </div>
        </div>
        
        {review.Title && (
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            {review.Title}
          </div>
        )}
        
        {/* Only show Comment if it's different from Title */}
        {review.Comment && review.Comment !== review.Title && (
          <div style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: '12px' }}>
            {review.Comment}
          </div>
        )}
        
        {surveyRatings.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px', 
            padding: '12px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            marginTop: '12px'
          }}>
            {surveyRatings.map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{r.label}:</span>
                <span style={{ color: '#5e72e4', fontSize: '12px' }}>
                  {'★'.repeat(r.value)}{'☆'.repeat(5 - r.value)}
                </span>
              </div>
            ))}
            {review.WouldRecommend != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>Would Recommend:</span>
                <span style={{ 
                  color: review.WouldRecommend ? '#10b981' : '#ef4444',
                  fontWeight: 500,
                  fontSize: '13px'
                }}>
                  {review.WouldRecommend ? 'Yes' : 'No'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div id="reviews-section">
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="reviews-section">
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0', 
        marginBottom: '20px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid #5e72e4' : '2px solid transparent',
            marginBottom: '-2px',
            color: activeTab === 'pending' ? '#5e72e4' : '#6b7280',
            fontWeight: activeTab === 'pending' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '15px'
          }}
        >
          Pending Reviews ({pastBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('submitted')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'submitted' ? '2px solid #5e72e4' : '2px solid transparent',
            marginBottom: '-2px',
            color: activeTab === 'submitted' ? '#5e72e4' : '#6b7280',
            fontWeight: activeTab === 'submitted' ? 600 : 400,
            cursor: 'pointer',
            fontSize: '15px'
          }}
        >
          My Reviews ({reviews.length})
        </button>
      </div>

      <div className="dashboard-card">
        {activeTab === 'pending' ? (
          pastBookings.length > 0 ? (
            <div className="bookings-list">{pastBookings.map(renderPendingBooking)}</div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              <i className="fas fa-star" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px', display: 'block' }}></i>
              <p style={{ margin: 0 }}>No pending reviews. Complete a booking to leave a review!</p>
            </div>
          )
        ) : (
          reviews.length > 0 ? (
            <div className="bookings-list">{reviews.map(renderReviewItem)}</div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              <i className="fas fa-comment-alt" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px', display: 'block' }}></i>
              <p style={{ margin: 0 }}>No reviews submitted yet.</p>
            </div>
          )
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#111827', fontWeight: 600 }}>Write a Review</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Booking Card - Date section style */}
            <div style={{
              margin: '16px 24px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {/* Date Section */}
              <div style={{
                textAlign: 'center',
                minWidth: '50px',
                padding: '8px 0',
                borderRight: '1px solid #e2e8f0',
                paddingRight: '16px'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 500 }}>
                  {selectedBooking.EventDate ? new Date(selectedBooking.EventDate).toLocaleDateString('en-US', { month: 'short' }) : 'TBD'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
                  {selectedBooking.EventDate ? new Date(selectedBooking.EventDate).getDate() : '--'}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {selectedBooking.EventDate ? new Date(selectedBooking.EventDate).toLocaleDateString('en-US', { weekday: 'short' }) : ''}
                </div>
              </div>
              {/* Booking Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#111827', fontSize: '15px', marginBottom: '4px' }}>
                  {selectedBooking.VendorName || 'Vendor'}
                </div>
                <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '4px' }}>
                  {selectedBooking.ServiceName || 'Service'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                  {selectedBooking.TotalAmount != null && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fas fa-dollar-sign" style={{ fontSize: '11px' }}></i>
                      ${Number(selectedBooking.TotalAmount).toLocaleString()} CAD
                    </span>
                  )}
                  {(selectedBooking.Location || selectedBooking.EventLocation) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fas fa-map-marker-alt" style={{ fontSize: '11px' }}></i>
                      {selectedBooking.Location || selectedBooking.EventLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '0 24px 24px' }}>
              {/* Overall Rating */}
              <StarRating
                label="Overall Rating"
                value={reviewForm.rating}
                onChange={(v) => setReviewForm(f => ({ ...f, rating: v }))}
              />

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
                  Review Title (optional)
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Summarize your experience"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Comment */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
                  Your Review *
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Share your experience with this vendor..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Survey Section */}
              <div style={{ 
                background: '#f9fafb', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#374151' }}>
                  Rate Your Experience
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <StarRating
                    label="Quality of Service"
                    value={reviewForm.qualityRating}
                    onChange={(v) => setReviewForm(f => ({ ...f, qualityRating: v }))}
                  />
                  <StarRating
                    label="Communication"
                    value={reviewForm.communicationRating}
                    onChange={(v) => setReviewForm(f => ({ ...f, communicationRating: v }))}
                  />
                  <StarRating
                    label="Value for Money"
                    value={reviewForm.valueRating}
                    onChange={(v) => setReviewForm(f => ({ ...f, valueRating: v }))}
                  />
                  <StarRating
                    label="Punctuality"
                    value={reviewForm.punctualityRating}
                    onChange={(v) => setReviewForm(f => ({ ...f, punctualityRating: v }))}
                  />
                  <StarRating
                    label="Professionalism"
                    value={reviewForm.professionalismRating}
                    onChange={(v) => setReviewForm(f => ({ ...f, professionalismRating: v }))}
                  />
                </div>

                {/* Would Recommend */}
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#374151', fontSize: '14px' }}>
                    Would you recommend this vendor?
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setReviewForm(f => ({ ...f, wouldRecommend: true }))}
                      style={{
                        padding: '10px 24px',
                        border: reviewForm.wouldRecommend ? '2px solid #10b981' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: reviewForm.wouldRecommend ? '#ecfdf5' : 'white',
                        color: reviewForm.wouldRecommend ? '#10b981' : '#6b7280',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fas fa-thumbs-up"></i> Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewForm(f => ({ ...f, wouldRecommend: false }))}
                      style={{
                        padding: '10px 24px',
                        border: !reviewForm.wouldRecommend ? '2px solid #ef4444' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: !reviewForm.wouldRecommend ? '#fef2f2' : 'white',
                        color: !reviewForm.wouldRecommend ? '#ef4444' : '#6b7280',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fas fa-thumbs-down"></i> No
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting || !reviewForm.comment.trim()}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: submitting || !reviewForm.comment.trim() ? '#9ca3af' : '#5e72e4',
                  color: 'white',
                  fontWeight: 500,
                  cursor: submitting || !reviewForm.comment.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {submitting && <div className="spinner" style={{ width: '16px', height: '16px' }}></div>}
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientReviewsSection;
