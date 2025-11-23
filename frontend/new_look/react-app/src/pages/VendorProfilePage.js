import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import VendorGallery from '../components/VendorGallery';
import { showBanner } from '../utils/helpers';

function VendorProfilePage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const loadVendorProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load vendor profile');
      }

      const data = await response.json();
      const vendorDetails = data.data;
      
      setVendor(vendorDetails);
      setIsFavorite(vendorDetails.isFavorite || false);
      
      // Update page title
      document.title = `${vendorDetails.profile.BusinessName || vendorDetails.profile.DisplayName} - PlanHive`;
    } catch (error) {
      console.error('Error loading vendor profile:', error);
      showBanner('Failed to load vendor profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [vendorId, currentUser]);

  useEffect(() => {
    if (vendorId) {
      loadVendorProfile();
    }
  }, [vendorId, loadVendorProfile]);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      showBanner('Please log in to save favorites', 'info');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: currentUser.id,
          vendorProfileId: vendorId
        })
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');

      const result = await response.json();
      setIsFavorite(result.IsFavorite);
      showBanner(
        result.IsFavorite ? 'Vendor saved to favorites' : 'Vendor removed from favorites',
        'favorite'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showBanner('Failed to update favorites', 'error');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const vendorName = vendor?.profile?.BusinessName || 'this vendor';

    if (navigator.share) {
      try {
        await navigator.share({
          title: vendorName,
          text: `Check out ${vendorName} on PlanHive!`,
          url: url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showBanner('Link copied to clipboard!', 'success');
    }).catch(() => {
      showBanner('Failed to copy link', 'error');
    });
  };

  const handleRequestBooking = () => {
    if (!currentUser) {
      showBanner('Please log in to request a booking', 'info');
      navigate('/');
      return;
    }
    // Navigate to booking wizard or modal
    console.log('Request booking for vendor:', vendorId);
  };

  const handleMessageVendor = () => {
    if (!currentUser) {
      showBanner('Please log in to message vendors', 'info');
      navigate('/');
      return;
    }
    console.log('Message vendor:', vendorId);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="profile-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-light)' }}>Vendor not found</p>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const profile = vendor.profile;
  const images = vendor.images || [];
  const services = vendor.services || [];
  const reviews = vendor.reviews || [];
  const faqs = vendor.faqs || [];
  const businessHours = vendor.businessHours || [];

  return (
    <div className="profile-container">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <i className="fas fa-arrow-left"></i>
        <span>Back to search</span>
      </button>

      {/* Image Gallery */}
      <VendorGallery images={images} />

      {/* Vendor Header */}
      <div className="vendor-profile-header">
        <div className="vendor-profile-info">
          <h1 id="vendor-business-name">{profile.BusinessName || profile.DisplayName}</h1>
          <p id="vendor-tagline">{profile.Tagline || 'Professional Event Services'}</p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-light)', marginBottom: '0.75rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
            {(profile.City || profile.State) && (
              <span>
                <i className="fas fa-map-marker-alt"></i> {[profile.City, profile.State].filter(Boolean).join(', ')}
              </span>
            )}
            {profile.YearsInBusiness && (
              <span>
                <i className="fas fa-trophy" style={{ color: '#fbbf24' }}></i> {profile.YearsInBusiness} years in business
              </span>
            )}
            <span style={{ color: '#fbbf24' }}>
              ☆☆☆☆☆ <span style={{ color: 'var(--text-light)' }}>({reviews.length} reviews)</span>
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="vendor-profile-actions">
          <div
            className={`vendor-action-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleToggleFavorite}
            title="Save to favorites"
          >
            <i className="fas fa-heart"></i>
          </div>
          <div
            className="vendor-action-btn"
            onClick={handleShare}
            title="Share this vendor"
          >
            <i className="fas fa-share-alt"></i>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="vendor-content-layout">
        {/* Main Content */}
        <div className="vendor-main-content">
          {/* About Section */}
          <div className="content-section">
            <h2>About this vendor</h2>
            <p>{profile.BusinessDescription || 'Welcome to our business! We provide exceptional event services tailored to your needs.'}</p>
          </div>

          {/* Services Section */}
          {services.length > 0 && (
            <div className="content-section">
              <h2>What we offer</h2>
              <div id="services-list">
                {services.map((service, index) => (
                  <div key={index} className="service-package-card">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="service-image-container">
                        <i className="fas fa-concierge-bell service-icon"></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <h3 className="service-card-title">{service.ServiceName || service.Name}</h3>
                            {service.Description && (
                              <p className="service-card-description">{service.Description}</p>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
                              ${parseFloat(service.Price || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Section */}
          {faqs.length > 0 && (
            <div className="content-section">
              <h2>Things to know</h2>
              <div id="faqs-list">
                {faqs.map((faq, index) => (
                  <div key={index} style={{ padding: '1.5rem 0', borderBottom: index < faqs.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{faq.Question}</div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>{faq.Answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="content-section">
            <h2>Reviews</h2>
            <div id="reviews-list">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <div key={index} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-name">{review.ReviewerName || 'Anonymous'}</div>
                      <div className="review-date">{new Date(review.CreatedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="review-rating">{'★'.repeat(review.Rating)}{'☆'.repeat(5 - review.Rating)}</div>
                    <div className="review-comment">{review.Comment}</div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No reviews yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="vendor-sidebar">
          {/* Request Booking Card */}
          <div className="sidebar-card">
            <h3>Request to Book</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Send a booking request to this vendor with your event details and service requirements.
            </p>
            <button className="btn btn-primary btn-full-width" onClick={handleRequestBooking}>
              <i className="fas fa-calendar-check"></i>
              <span>Request Booking</span>
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.75rem', textAlign: 'center' }}>
              <i className="fas fa-shield-alt" style={{ color: 'var(--primary)' }}></i> Free request • No payment required
            </p>
          </div>

          {/* Business Hours */}
          {businessHours.length > 0 && (
            <div className="sidebar-card">
              <h3>Business Hours</h3>
              <div style={{ fontSize: '0.9rem' }}>
                {businessHours.map((hour, index) => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                      <span style={{ fontWeight: 500 }}>{dayNames[hour.DayOfWeek]}</span>
                      <span>{hour.IsAvailable ? `${hour.OpenTime} - ${hour.CloseTime}` : 'Closed'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="sidebar-card">
            <h3>Contact Vendor</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
              Have questions? Get in touch!
            </p>
            <button className="btn btn-outline btn-full-width" onClick={handleMessageVendor}>
              <i className="fas fa-comment"></i>
              <span>Message Vendor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorProfilePage;
