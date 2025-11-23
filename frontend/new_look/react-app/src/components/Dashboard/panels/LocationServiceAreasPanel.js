import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function LocationServiceAreasPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [serviceAreaInput, setServiceAreaInput] = useState('');
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
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
          postalCode: data.PostalCode || '',
          country: data.Country || '',
          serviceAreas: data.ServiceAreas ? data.ServiceAreas.split(',').filter(Boolean) : []
        });
      }
    } catch (error) {
      console.error('Error loading location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddServiceArea = () => {
    if (serviceAreaInput.trim()) {
      setFormData({
        ...formData,
        serviceAreas: [...formData.serviceAreas, serviceAreaInput.trim()]
      });
      setServiceAreaInput('');
    }
  };

  const handleRemoveServiceArea = (index) => {
    setFormData({
      ...formData,
      serviceAreas: formData.serviceAreas.filter((_, i) => i !== index)
    });
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
          PostalCode: formData.postalCode,
          Country: formData.country,
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
          Set your business address and define the geographic areas you serve to help clients find you.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        <form id="vendor-location-form" onSubmit={handleSubmit}>
          {/* Row 1: Street Address and City */}
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="loc-address">Street Address</label>
                <input
                  type="text"
                  id="loc-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="loc-city">City</label>
                <input
                  type="text"
                  id="loc-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Province and Country */}
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="loc-state">Province</label>
                <input
                  type="text"
                  id="loc-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="loc-country">Country</label>
                <input
                  type="text"
                  id="loc-country"
                  placeholder="Canada"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Postal Code */}
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="loc-postal">Postal Code</label>
                <input
                  type="text"
                  id="loc-postal"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
            </div>
            <div className="form-col"></div>
          </div>

          {/* Service Areas Section */}
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>
              Service Areas <span style={{ color: 'var(--accent)' }}>*</span>
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              Add the cities or regions where you offer your services
            </p>

            <div className="form-row" style={{ marginBottom: '0.5rem' }}>
              <div className="form-col">
                <div className="form-group">
                  <label htmlFor="service-area-input">Add City/Region</label>
                  <input
                    type="text"
                    id="service-area-input"
                    placeholder="e.g., Toronto, ON"
                    value={serviceAreaInput}
                    onChange={(e) => setServiceAreaInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddServiceArea();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="form-col">
                <div className="form-group">
                  <label style={{ visibility: 'hidden' }}>Action</label>
                  <button
                    type="button"
                    className="btn btn-primary"
                    id="add-service-area-btn"
                    onClick={handleAddServiceArea}
                  >
                    <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>Add
                  </button>
                </div>
              </div>
            </div>

            <div
              id="service-areas-list"
              style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', minHeight: '2rem', marginBottom: '0.5rem' }}
            >
              {formData.serviceAreas.map((area, index) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.875rem'
                  }}
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => handleRemoveServiceArea(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '1rem',
                      lineHeight: 1
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Save Location
          </button>
        </form>
      </div>
    </div>
  );
}

export default LocationServiceAreasPanel;
