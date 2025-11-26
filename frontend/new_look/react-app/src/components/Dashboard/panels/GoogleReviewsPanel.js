import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function GoogleReviewsPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [formData, setFormData] = useState({
    googlePlaceId: '',
    googleBusinessUrl: ''
  });
  const [previewData, setPreviewData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    if (vendorProfileId) {
      loadGoogleReviewsSettings();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadGoogleReviewsSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/google-reviews-settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData({
          googlePlaceId: data.GooglePlaceId || '',
          googleBusinessUrl: data.GoogleBusinessUrl || ''
        });
        
        // If Place ID exists, verify it
        if (data.GooglePlaceId) {
          verifyPlaceId(data.GooglePlaceId, false);
        }
      }
    } catch (error) {
      console.error('Error loading Google Reviews settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPlaceId = async (placeId, showMessage = true) => {
    if (!placeId || placeId.trim() === '') {
      setVerificationStatus(null);
      setPreviewData(null);
      return;
    }

    try {
      setVerifying(true);
      const response = await fetch(`${API_BASE_URL}/vendors/google-reviews/${placeId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const reviewData = data.data || data;
        
        setVerificationStatus('success');
        setPreviewData(reviewData);
        
        if (showMessage) {
          showBanner('✓ Valid Google Place ID! Preview loaded.', 'success');
        }
      } else {
        setVerificationStatus('error');
        setPreviewData(null);
        
        if (showMessage) {
          showBanner('Invalid Google Place ID. Please check and try again.', 'error');
        }
      }
    } catch (error) {
      console.error('Error verifying Place ID:', error);
      setVerificationStatus('error');
      setPreviewData(null);
      
      if (showMessage) {
        showBanner('Failed to verify Place ID. Please try again.', 'error');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyClick = () => {
    verifyPlaceId(formData.googlePlaceId, true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verify before saving
    if (formData.googlePlaceId && verificationStatus !== 'success') {
      showBanner('Please verify your Google Place ID before saving.', 'warning');
      return;
    }
    
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/google-reviews-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          GooglePlaceId: formData.googlePlaceId,
          GoogleBusinessUrl: formData.googleBusinessUrl
        })
      });
      
      if (response.ok) {
        showBanner('Google Reviews integration updated successfully!', 'success');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showBanner('Failed to save changes', 'error');
    } finally {
      setSaving(false);
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
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.1rem' }}>
            <i className="fab fa-google"></i>
          </span>
          Google Reviews Integration
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Display your Google Reviews directly on your VenueVue profile to build trust and credibility with potential clients.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        {/* Info Banner */}
        <div style={{ 
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
          border: '1px solid #bae6fd', 
          borderRadius: 'var(--radius)', 
          padding: '1rem 1.25rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <i className="fas fa-info-circle" style={{ color: '#0284c7', fontSize: '1.25rem', marginTop: '0.15rem' }}></i>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e', fontSize: '0.95rem', fontWeight: 600 }}>
              Why integrate Google Reviews?
            </h4>
            <p style={{ margin: 0, color: '#0369a1', fontSize: '0.875rem', lineHeight: '1.5' }}>
              Your Google Reviews will appear on your vendor profile page, showcasing your reputation and helping clients make informed decisions. Reviews are automatically synced and displayed with ratings, reviewer names, and timestamps.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Google Place ID Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 className="dashboard-card-subtitle" style={{ margin: '0 0 1rem 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-map-marker-alt"></i>
              Google Place ID
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 500, 
                background: '#fee2e2', 
                color: '#991b1b', 
                padding: '0.15rem 0.5rem', 
                borderRadius: '4px',
                marginLeft: '0.5rem'
              }}>
                Required
              </span>
            </h3>
            
            <div className="form-group">
              <label htmlFor="google-place-id" style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                Enter your Google Place ID
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    id="google-place-id"
                    className="form-control"
                    placeholder="e.g., ChIJN1t_tDeuEmsRUsoyG83frY4"
                    value={formData.googlePlaceId}
                    onChange={(e) => {
                      setFormData({ ...formData, googlePlaceId: e.target.value });
                      setVerificationStatus(null);
                      setPreviewData(null);
                    }}
                    style={{ 
                      borderColor: verificationStatus === 'success' ? '#10b981' : verificationStatus === 'error' ? '#ef4444' : 'var(--border)'
                    }}
                  />
                  {verificationStatus === 'success' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: '#10b981', fontSize: '0.875rem' }}>
                      <i className="fas fa-check-circle"></i>
                      <span>Valid Place ID verified</span>
                    </div>
                  )}
                  {verificationStatus === 'error' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
                      <i className="fas fa-times-circle"></i>
                      <span>Invalid Place ID</span>
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={handleVerifyClick}
                  disabled={!formData.googlePlaceId || verifying}
                  style={{ 
                    minWidth: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {verifying ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      Verify
                    </>
                  )}
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                Your Google Place ID is a unique identifier for your business on Google Maps. 
                <a 
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'var(--primary)', textDecoration: 'none', marginLeft: '0.25rem' }}
                >
                  Learn how to find it <i className="fas fa-external-link-alt" style={{ fontSize: '0.7rem' }}></i>
                </a>
              </p>
            </div>
          </div>

          {/* Preview Section */}
          {previewData && (
            <div style={{ 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)', 
              border: '1px solid #e5e7eb', 
              borderRadius: 'var(--radius)', 
              padding: '1.5rem', 
              marginBottom: '2rem' 
            }}>
              <h4 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fas fa-eye" style={{ color: 'var(--primary)' }}></i>
                Preview
              </h4>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
                    {(previewData.rating || 0).toFixed(1)}
                  </div>
                  <div style={{ color: '#fbbc04', fontSize: '1.1rem', letterSpacing: '1px' }}>
                    {'★'.repeat(Math.floor(previewData.rating || 0))}{'☆'.repeat(5 - Math.floor(previewData.rating || 0))}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    {(previewData.user_ratings_total || 0).toLocaleString()} reviews
                  </div>
                </div>
                
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)', lineHeight: '1.6' }}>
                    <i className="fas fa-check-circle" style={{ color: '#10b981', marginRight: '0.5rem' }}></i>
                    Your Google Reviews will be displayed on your vendor profile page
                  </p>
                  {previewData.url && (
                    <a 
                      href={previewData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.75rem',
                        fontSize: '0.875rem',
                        color: 'var(--primary)',
                        textDecoration: 'none'
                      }}
                    >
                      <i className="fab fa-google"></i>
                      View on Google Maps
                      <i className="fas fa-external-link-alt" style={{ fontSize: '0.7rem' }}></i>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Google Business URL (Optional) */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 className="dashboard-card-subtitle" style={{ margin: '0 0 1rem 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-link"></i>
              Google Business Profile URL
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 500, 
                background: '#e0e7ff', 
                color: '#3730a3', 
                padding: '0.15rem 0.5rem', 
                borderRadius: '4px',
                marginLeft: '0.5rem'
              }}>
                Optional
              </span>
            </h3>
            
            <div className="form-group">
              <label htmlFor="google-business-url" style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                Direct link to your Google Business Profile
              </label>
              <input
                type="url"
                id="google-business-url"
                className="form-control"
                placeholder="https://www.google.com/maps/place/..."
                value={formData.googleBusinessUrl}
                onChange={(e) => setFormData({ ...formData, googleBusinessUrl: e.target.value })}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                This link will be used for the "View on Google" button on your profile.
              </p>
            </div>
          </div>

          {/* How to Find Your Place ID */}
          <div style={{ 
            background: '#fef3c7', 
            border: '1px solid #fcd34d', 
            borderRadius: 'var(--radius)', 
            padding: '1rem 1.25rem', 
            marginBottom: '2rem' 
          }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              color: '#78350f',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-lightbulb"></i>
              How to find your Google Place ID
            </h4>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#92400e', fontSize: '0.85rem', lineHeight: '1.8' }}>
              <li>Go to <a href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" target="_blank" rel="noopener noreferrer" style={{ color: '#b45309', textDecoration: 'underline' }}>Google Place ID Finder</a></li>
              <li>Search for your business name or address</li>
              <li>Click on your business location on the map</li>
              <li>Copy the Place ID that appears (starts with "ChIJ...")</li>
              <li>Paste it in the field above and click "Verify"</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving || (formData.googlePlaceId && verificationStatus !== 'success')}
              style={{ minWidth: '150px' }}
            >
              {saving ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '0.5rem' }}></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Save Settings
                </>
              )}
            </button>
            
            {formData.googlePlaceId && verificationStatus !== 'success' && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#dc2626' }}>
                <i className="fas fa-exclamation-triangle"></i> Please verify your Place ID before saving
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default GoogleReviewsPanel;
