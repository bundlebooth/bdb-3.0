import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function LocationServiceAreasPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    serviceRadius: '25',
    serviceAreas: []
  });

  useEffect(() => {
    if (vendorProfileId) {
      loadLocationData();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadLocationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/location`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData({
          address: data.Address || '',
          city: data.City || '',
          state: data.State || '',
          zipCode: data.ZipCode || '',
          country: data.Country || 'United States',
          serviceRadius: data.ServiceRadius || '25',
          serviceAreas: data.ServiceAreas ? data.ServiceAreas.split(',') : []
        });
      }
    } catch (error) {
      console.error('Error loading location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          Address: formData.address,
          City: formData.city,
          State: formData.state,
          ZipCode: formData.zipCode,
          Country: formData.country,
          ServiceRadius: formData.serviceRadius,
          ServiceAreas: formData.serviceAreas.join(',')
        })
      });
      
      if (response.ok) {
        showBanner('Location updated successfully!', 'success');
      } else {
        throw new Error('Failed to update location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
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
            <i className="fas fa-map-marker-alt"></i>
          </span>
          Location & Service Areas
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Set your business address and define the areas you serve.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="vendor-address">Street Address <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              id="vendor-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-city">City <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  id="vendor-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-state">State <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  id="vendor-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-zip">ZIP Code <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  id="vendor-zip"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-country">Country</label>
                <input
                  type="text"
                  id="vendor-country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vendor-service-radius">Service Radius (miles)</label>
            <select
              id="vendor-service-radius"
              value={formData.serviceRadius}
              onChange={(e) => setFormData({ ...formData, serviceRadius: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
            >
              <option value="10">10 miles</option>
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
              <option value="100">100 miles</option>
              <option value="unlimited">Unlimited</option>
            </select>
            <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
              How far are you willing to travel for events?
            </small>
          </div>

          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default LocationServiceAreasPanel;
