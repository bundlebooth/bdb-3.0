import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function ServicesPackagesPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration: ''
  });

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
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/services`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newService)
      });
      
      if (response.ok) {
        showBanner('Service added successfully!', 'success');
        setNewService({ name: '', description: '', price: '', duration: '' });
        loadServices();
      } else {
        throw new Error('Failed to add service');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      showBanner('Failed to add service', 'error');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        showBanner('Service deleted successfully!', 'success');
        loadServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      showBanner('Failed to delete service', 'error');
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
            <i className="fas fa-briefcase"></i>
          </span>
          Services & Packages
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Manage your service offerings and pricing packages.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        {/* Add New Service Form */}
        <form onSubmit={handleAddService} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Add New Service</h3>
          
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="service-name">Service Name <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  id="service-name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="service-price">Price <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="number"
                  id="service-price"
                  placeholder="0.00"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="service-duration">Duration (hours)</label>
                <input
                  type="number"
                  id="service-duration"
                  placeholder="e.g., 2"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                />
              </div>
            </div>
            <div className="form-col">
              {/* Spacer */}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="service-description">Description</label>
            <textarea
              id="service-description"
              rows="3"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary">
            <i className="fas fa-plus"></i> Add Service
          </button>
        </form>

        {/* Services List */}
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Your Services</h3>
        {services.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-briefcase" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p>No services added yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {services.map(service => (
              <div key={service.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>{service.name}</h4>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{service.description}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                      <span><strong>Price:</strong> ${service.price}</span>
                      {service.duration && <span><strong>Duration:</strong> {service.duration} hours</span>}
                    </div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleDeleteService(service.id)}
                    style={{ color: 'var(--error)' }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ServicesPackagesPanel;
