import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function ServicesPackagesPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    if (vendorProfileId) {
      loadServices();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // Fetch available predefined services
      const servicesResponse = await fetch(`${API_BASE_URL}/services`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setAvailableServices(servicesData.services || []);
        
        // Fetch vendor's selected services
        const vendorServicesResponse = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/services`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (vendorServicesResponse.ok) {
          const vendorData = await vendorServicesResponse.json();
          setServices(vendorData.services || []);
          setSelectedCount((vendorData.services || []).length);
        }
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServices = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ services })
      });
      
      if (response.ok) {
        showBanner('Services updated successfully!', 'success');
        loadServices();
      } else {
        throw new Error('Failed to update services');
      }
    } catch (error) {
      console.error('Error saving services:', error);
      showBanner('Failed to save services', 'error');
    }
  };



  return (
    <div>
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
      </button>
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-briefcase"></i>
          </span>
          Services
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Select and manage the services you offer. Add services to make it easier for clients to find and book you.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        {/* Loading State */}
        <div id="vendor-settings-services-loading" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', display: loading ? 'block' : 'none' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>

        {/* Services Container */}
        <div id="vendor-settings-services-container" style={{ display: !loading && availableServices.length > 0 ? 'block' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h5 style={{ margin: 0, color: 'var(--primary)' }}>Available Services</h5>
            <span id="vendor-settings-selected-count" style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              {selectedCount} added
            </span>
          </div>

          <div id="vendor-settings-services-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', width: '100%' }}>
            {services.length === 0 && (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>
                No services added yet. Click the button below to add services.
              </p>
            )}
            {services.map((service) => (
              <div key={service.id} style={{ padding: '1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{service.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      {service.category && `${service.category} • `}
                      {service.price && `$${service.price}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setServices(services.filter(s => s.id !== service.id));
                      setSelectedCount(selectedCount - 1);
                    }}
                    style={{ padding: '0.4rem 0.65rem', background: '#fee', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" id="vendor-settings-save-services" onClick={handleSaveServices}>
              Save Services
            </button>
          </div>
        </div>

        {/* No Services Available */}
        <div id="vendor-settings-no-services" style={{ display: !loading && availableServices.length === 0 ? 'block' : 'none', textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
          <i className="fas fa-info-circle" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--primary)' }}></i>
          <h6 style={{ marginBottom: '0.5rem' }}>No predefined services available</h6>
          <p style={{ margin: 0 }}>No services match your business categories. Update your categories in Business Profile.</p>
        </div>
      </div>
    </div>
  );
}

export default ServicesPackagesPanel;
