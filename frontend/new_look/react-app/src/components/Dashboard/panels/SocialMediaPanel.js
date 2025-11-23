import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function SocialMediaPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    bookingLink: ''
  });

  useEffect(() => {
    if (vendorProfileId) {
      loadSocialMedia();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadSocialMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/social`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData({
          facebook: data.FacebookUrl || '',
          instagram: data.InstagramUrl || '',
          twitter: data.TwitterUrl || '',
          bookingLink: data.BookingLink || ''
        });
      }
    } catch (error) {
      console.error('Error loading social media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          FacebookUrl: formData.facebook,
          InstagramUrl: formData.instagram,
          TwitterUrl: formData.twitter,
          BookingLink: formData.bookingLink
        })
      });
      
      if (response.ok) {
        showBanner('Social media links updated successfully!', 'success');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showBanner('Failed to save changes', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
        </button>
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
      </button>
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-share-alt"></i>
          </span>
          Social Media & Booking
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Connect your social media profiles and external booking link.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="facebook-url">
              <i className="fab fa-facebook" style={{ marginRight: '0.5rem', color: '#1877f2' }}></i>
              Facebook URL
            </label>
            <input
              type="url"
              id="facebook-url"
              placeholder="https://facebook.com/yourbusiness"
              value={formData.facebook}
              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="instagram-url">
              <i className="fab fa-instagram" style={{ marginRight: '0.5rem', color: '#e4405f' }}></i>
              Instagram URL
            </label>
            <input
              type="url"
              id="instagram-url"
              placeholder="https://instagram.com/yourbusiness"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="twitter-url">
              <i className="fab fa-twitter" style={{ marginRight: '0.5rem', color: '#1da1f2' }}></i>
              Twitter URL
            </label>
            <input
              type="url"
              id="twitter-url"
              placeholder="https://twitter.com/yourbusiness"
              value={formData.twitter}
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="booking-link">
              <i className="fas fa-link" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>
              External Booking Link
            </label>
            <input
              type="url"
              id="booking-link"
              placeholder="https://yourbooking.com"
              value={formData.bookingLink}
              onChange={(e) => setFormData({ ...formData, bookingLink: e.target.value })}
            />
            <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
              If you have an external booking system, add the link here
            </small>
          </div>

          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default SocialMediaPanel;
