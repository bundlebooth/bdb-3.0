import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function ServicesPackagesPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState({});

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
      console.log('Loading services for vendorProfileId:', vendorProfileId);
      
      // Fetch available predefined services (all categories)
      const servicesResponse = await fetch(`${API_BASE_URL}/vendors/predefined-services`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        const servicesByCategory = servicesData.servicesByCategory || {};
        
        // Flatten services from all categories
        const allServices = [];
        Object.keys(servicesByCategory).forEach(category => {
          (servicesByCategory[category] || []).forEach(service => {
            allServices.push({ ...service, category });
          });
        });
        
        setAvailableServices(allServices);
        console.log('Loaded available services:', allServices.length);
        
        // Fetch vendor's selected services
        const vendorServicesResponse = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/selected-services`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (vendorServicesResponse.ok) {
          const vendorData = await vendorServicesResponse.json();
          const selectedServices = vendorData.selectedServices || [];
          
          // Map selected services to full service objects
          const mappedServices = selectedServices.map(s => {
            const match = allServices.find(a => String(a.id) === String(s.PredefinedServiceID));
            if (match) {
              return {
                ...match,
                vendorPrice: s.VendorPrice,
                vendorDuration: s.VendorDurationMinutes,
                vendorDescription: s.VendorDescription,
                imageURL: s.ImageURL
              };
            }
            return null;
          }).filter(Boolean);
          
          setServices(mappedServices);
          setSelectedCount(mappedServices.length);
          console.log('Loaded selected services:', mappedServices.length);
        }
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = (service) => {
    const newService = {
      ...service,
      vendorDuration: service.defaultDuration || 60,
      vendorPrice: 0,
      vendorDescription: '',
      pricingModel: 'time_based',
      baseRate: null,
      overtimeRatePerHour: null,
      fixedPrice: null,
      pricePerPerson: null,
      minimumAttendees: null,
      maximumAttendees: null
    };
    setServices([...services, newService]);
    setSelectedCount(selectedCount + 1);
    setShowServicePicker(false);
    setSearchQuery('');
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setEditForm({
      pricingModel: service.pricingModel || 'time_based',
      vendorDuration: service.vendorDuration || service.defaultDuration || 60,
      baseRate: service.baseRate || '',
      overtimeRatePerHour: service.overtimeRatePerHour || '',
      fixedPrice: service.fixedPrice || '',
      pricePerPerson: service.pricePerPerson || '',
      minimumAttendees: service.minimumAttendees || '',
      maximumAttendees: service.maximumAttendees || '',
      vendorDescription: service.vendorDescription || ''
    });
  };

  const handleSaveEdit = () => {
    setServices(services.map(s => 
      s.id === editingService.id 
        ? { ...s, ...editForm }
        : s
    ));
    setEditingService(null);
    setEditForm({});
  };

  const handleRemoveService = (serviceId) => {
    setServices(services.filter(s => s.id !== serviceId));
    setSelectedCount(selectedCount - 1);
  };

  const handleSaveServices = async () => {
    try {
      // Derive service categories from current selection
      const serviceCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean)))
        .map((name, i) => ({ name, description: null, displayOrder: i }));
      
      const payload = {
        vendorProfileId: vendorProfileId,
        serviceCategories,
        selectedPredefinedServices: services.map(s => ({
          predefinedServiceId: s.id,
          name: s.name,
          description: s.vendorDescription || s.description || '',
          durationMinutes: parseInt(s.vendorDuration) || s.defaultDuration || 60,
          imageURL: s.imageURL || null,
          pricingModel: s.pricingModel || 'time_based',
          baseDurationMinutes: parseInt(s.vendorDuration) || s.defaultDuration || 60,
          baseRate: s.baseRate ? parseFloat(s.baseRate) : null,
          overtimeRatePerHour: s.overtimeRatePerHour ? parseFloat(s.overtimeRatePerHour) : null,
          minimumBookingFee: s.minimumBookingFee ? parseFloat(s.minimumBookingFee) : null,
          fixedPricingType: s.pricingModel === 'per_attendee' ? 'per_attendee' : (s.pricingModel === 'fixed_price' ? 'fixed_price' : null),
          fixedPrice: s.fixedPrice ? parseFloat(s.fixedPrice) : null,
          pricePerPerson: s.pricePerPerson ? parseFloat(s.pricePerPerson) : null,
          minimumAttendees: s.minimumAttendees ? parseInt(s.minimumAttendees) : null,
          maximumAttendees: s.maximumAttendees ? parseInt(s.maximumAttendees) : null,
          price: s.vendorPrice || s.fixedPrice || 0
        })),
        services: services.map(s => ({
          name: s.name,
          description: s.vendorDescription || s.description || '',
          imageURL: s.imageURL || null,
          pricingModel: s.pricingModel || 'time_based',
          baseDurationMinutes: parseInt(s.vendorDuration) || s.defaultDuration || 60,
          baseRate: s.baseRate ? parseFloat(s.baseRate) : null,
          overtimeRatePerHour: s.overtimeRatePerHour ? parseFloat(s.overtimeRatePerHour) : null,
          minimumBookingFee: s.minimumBookingFee ? parseFloat(s.minimumBookingFee) : null,
          fixedPricingType: s.pricingModel === 'per_attendee' ? 'per_attendee' : (s.pricingModel === 'fixed_price' ? 'fixed_price' : null),
          fixedPrice: s.fixedPrice ? parseFloat(s.fixedPrice) : null,
          pricePerPerson: s.pricePerPerson ? parseFloat(s.pricePerPerson) : null,
          minimumAttendees: s.minimumAttendees ? parseInt(s.minimumAttendees) : null,
          maximumAttendees: s.maximumAttendees ? parseInt(s.maximumAttendees) : null,
          durationMinutes: parseInt(s.vendorDuration) || s.defaultDuration || 60,
          linkedPredefinedServiceId: s.id,
          categoryName: s.category || null
        }))
      };
      
      console.log('Saving services:', payload);
      
      const response = await fetch(`${API_BASE_URL}/vendors/setup/step3-services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        showBanner('Services saved successfully!', 'success');
        loadServices();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save services');
      }
    } catch (error) {
      console.error('Error saving services:', error);
      showBanner('Failed to save services: ' + error.message, 'error');
    }
  };

  const filteredServices = availableServices.filter(s =>
    !services.some(selected => selected.id === s.id) &&
    (searchQuery === '' ||
     s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase())))
  );



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
        <div id="vendor-settings-services-container" style={{ display: !loading ? 'block' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h5 style={{ margin: 0, color: 'var(--primary)' }}>Available Services</h5>
            <span id="vendor-settings-selected-count" style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              {selectedCount} added
            </span>
          </div>

          <div id="vendor-settings-services-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', width: '100%' }}>
            {services.map((service) => {
              const getCategoryIcon = () => {
                const catLower = (service.category || '').toLowerCase();
                const nameLower = (service.name || '').toLowerCase();
                
                if (catLower.includes('photo') || nameLower.includes('photo')) return 'fa-camera';
                if (catLower.includes('video') || nameLower.includes('video')) return 'fa-video';
                if (catLower.includes('music') || catLower.includes('dj') || nameLower.includes('music') || nameLower.includes('dj')) return 'fa-music';
                if (catLower.includes('cater') || nameLower.includes('food') || nameLower.includes('cater')) return 'fa-utensils';
                if (catLower.includes('venue') || nameLower.includes('venue') || nameLower.includes('space')) return 'fa-building';
                if (catLower.includes('decor') || catLower.includes('floral') || nameLower.includes('decor') || nameLower.includes('flower')) return 'fa-leaf';
                if (catLower.includes('entertainment') || nameLower.includes('perform')) return 'fa-masks-theater';
                if (catLower.includes('transport') || nameLower.includes('transport')) return 'fa-car';
                if (catLower.includes('beauty') || catLower.includes('wellness') || nameLower.includes('makeup') || nameLower.includes('spa')) return 'fa-spa';
                return 'fa-concierge-bell';
              };
              
              const getPricingDisplay = () => {
                if (service.pricingModel === 'time_based' && service.baseRate) {
                  return `$${parseFloat(service.baseRate).toFixed(0)} base + $${parseFloat(service.overtimeRatePerHour || 0).toFixed(0)}/hr overtime`;
                } else if (service.pricingModel === 'fixed_price' && service.fixedPrice) {
                  return `$${parseFloat(service.fixedPrice).toFixed(0)} fixed`;
                } else if (service.pricingModel === 'per_attendee' && service.pricePerPerson) {
                  return `$${parseFloat(service.pricePerPerson).toFixed(0)}/person`;
                }
                return 'Not configured';
              };
              
              return (
                <div key={service.id} style={{ padding: '1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* Service Icon */}
                    <div style={{
                      flexShrink: 0,
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      background: 'var(--secondary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className={`fas ${getCategoryIcon()}`} style={{ color: 'var(--primary)', fontSize: '1.5rem' }}></i>
                    </div>
                    
                    {/* Service Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 0.35rem 0' }}>
                            {service.name}
                          </h3>
                          
                          {/* Category & Duration Row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>
                            {service.category && (
                              <span>
                                <i className="fas fa-tag" style={{ marginRight: '0.25rem' }}></i>
                                {service.category}
                              </span>
                            )}
                            <span>
                              <i className="fas fa-clock" style={{ marginRight: '0.25rem' }}></i>
                              {service.vendorDuration 
                                ? (service.vendorDuration >= 60 
                                    ? Math.floor(service.vendorDuration/60) + ' hour' + (service.vendorDuration >= 120 ? 's' : '') 
                                    : service.vendorDuration + ' min')
                                : 'Not set'}
                            </span>
                          </div>
                          
                          {/* Pricing Info Row */}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            <i className="fas fa-dollar-sign" style={{ marginRight: '0.25rem' }}></i>
                            <span>{getPricingDisplay()}</span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleEditService(service)}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            <i className="fas fa-edit" style={{ marginRight: '0.25rem' }}></i>Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(service.id)}
                            style={{ padding: '0.4rem 0.65rem', background: '#fee', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Add Service Card */}
            <div 
              className="add-service-card"
              onClick={() => setShowServicePicker(true)}
              style={{
                width: '100%',
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = '#f0f4ff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = '#f8fafc';
              }}
            >
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '28px', lineHeight: 1, marginBottom: '8px' }}>
                  <i className="fas fa-plus-circle"></i>
                </div>
                <div style={{ fontWeight: 600 }}>Add a service</div>
                <div style={{ fontSize: '0.85rem' }}>Click to choose from the list</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" id="vendor-settings-save-services" onClick={handleSaveServices}>
              Save Services
            </button>
          </div>
        </div>

        {/* Service Picker Modal */}
        {showServicePicker && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
            onClick={() => setShowServicePicker(false)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Add Service</h3>
                  <button
                    onClick={() => setShowServicePicker(false)}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ overflowY: 'auto', padding: '8px' }}>
                {filteredServices.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                    {searchQuery ? 'No services found' : 'All services have been added'}
                  </div>
                ) : (
                  filteredServices.map(service => (
                    <div
                      key={service.id}
                      onClick={() => handleAddService(service)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontWeight: 500 }}>{service.name}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        background: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {service.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Service Modal */}
        {editingService && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}
            onClick={() => setEditingService(null)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{editingService.name}</h3>
                  <button
                    onClick={() => setEditingService(null)}
                    style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto' }}>
                {/* Pricing Model */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Pricing Model *
                  </label>
                  <select
                    value={editForm.pricingModel}
                    onChange={(e) => setEditForm({ ...editForm, pricingModel: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f9fafb'
                    }}
                  >
                    <option value="time_based">Time-based (Hourly)</option>
                    <option value="fixed_price">Fixed Price</option>
                    <option value="per_attendee">Per Attendee</option>
                  </select>
                </div>

                {/* Time-based Fields */}
                {editForm.pricingModel === 'time_based' && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Base Duration (min) *
                        </label>
                        <input
                          type="number"
                          value={editForm.vendorDuration}
                          onChange={(e) => setEditForm({ ...editForm, vendorDuration: e.target.value })}
                          min="15"
                          step="15"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Base Rate ($) *
                        </label>
                        <input
                          type="number"
                          value={editForm.baseRate}
                          onChange={(e) => setEditForm({ ...editForm, baseRate: e.target.value })}
                          min="0"
                          step="0.01"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Overtime ($/hr) *
                        </label>
                        <input
                          type="number"
                          value={editForm.overtimeRatePerHour}
                          onChange={(e) => setEditForm({ ...editForm, overtimeRatePerHour: e.target.value })}
                          min="0"
                          step="0.01"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Fixed Price Fields */}
                {editForm.pricingModel === 'fixed_price' && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      Fixed Price ($) *
                    </label>
                    <input
                      type="number"
                      value={editForm.fixedPrice}
                      onChange={(e) => setEditForm({ ...editForm, fixedPrice: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: '#f9fafb'
                      }}
                    />
                  </div>
                )}

                {/* Per Attendee Fields */}
                {editForm.pricingModel === 'per_attendee' && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Price Per Person ($) *
                        </label>
                        <input
                          type="number"
                          value={editForm.pricePerPerson}
                          onChange={(e) => setEditForm({ ...editForm, pricePerPerson: e.target.value })}
                          min="0"
                          step="0.01"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Min Attendees *
                        </label>
                        <input
                          type="number"
                          value={editForm.minimumAttendees}
                          onChange={(e) => setEditForm({ ...editForm, minimumAttendees: e.target.value })}
                          min="1"
                          step="1"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                          Max Attendees *
                        </label>
                        <input
                          type="number"
                          value={editForm.maximumAttendees}
                          onChange={(e) => setEditForm({ ...editForm, maximumAttendees: e.target.value })}
                          min="1"
                          step="1"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            background: '#f9fafb'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Your Description *
                  </label>
                  <textarea
                    value={editForm.vendorDescription}
                    onChange={(e) => setEditForm({ ...editForm, vendorDescription: e.target.value })}
                    placeholder="Add any specific details about how you provide this service..."
                    rows="3"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#f9fafb',
                      resize: 'vertical',
                      minHeight: '100px',
                      fontFamily: 'inherit',
                      lineHeight: '1.5'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setEditingService(null)}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    background: 'transparent',
                    color: '#6366f1',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#eef2ff'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    background: '#6366f1',
                    color: 'white',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#4f46e5'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#6366f1'}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ServicesPackagesPanel;
