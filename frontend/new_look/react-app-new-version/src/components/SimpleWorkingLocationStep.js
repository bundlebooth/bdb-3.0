import React, { useEffect, useRef } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../config';

function SimpleWorkingLocationStep({ formData, setFormData }) {
  const addressInputRef = useRef(null);
  const serviceAreaInputRef = useRef(null);
  const addressAutocompleteRef = useRef(null);
  const serviceAreaAutocompleteRef = useRef(null);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeGooglePlaces();
    } else {
      loadGoogleMapsAPI();
    }
  }, []);

  // Reinitialize when component mounts
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setTimeout(() => {
        initializeGooglePlaces();
      }, 100);
    }
  }, []);

  const loadGoogleMapsAPI = () => {
    if (window.google) return;
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeGooglePlaces;
    document.head.appendChild(script);
  };

  const initializeGooglePlaces = () => {
    // ADDRESS AUTOCOMPLETE - EXACT PATTERN FROM EnhancedSearchBar
    if (!addressInputRef.current) return;
    
    const addressInput = addressInputRef.current.querySelector('input');
    if (!addressInput) return;
    
    // Clear existing autocomplete if it exists
    if (addressAutocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(addressAutocompleteRef.current);
    }

    const addressAutocomplete = new window.google.maps.places.Autocomplete(addressInput, {
      types: ['address'],
      componentRestrictions: { country: 'ca' }
    });

    addressAutocompleteRef.current = addressAutocomplete;

    addressAutocomplete.addListener('place_changed', () => {
      const place = addressAutocomplete.getPlace();
      
      if (place.address_components) {
        const comps = place.address_components;
        const pick = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
        
        const streetNumber = pick('street_number');
        const route = pick('route');
        const fullAddress = streetNumber && route ? `${streetNumber} ${route}` : place.formatted_address;
        
        setFormData(prev => ({
          ...prev,
          address: fullAddress || '',
          city: pick('locality') || pick('sublocality') || '',
          province: pick('administrative_area_level_1') || '',
          postalCode: pick('postal_code') || '',
          country: pick('country') || 'Canada',
          latitude: place.geometry?.location?.lat() || null,
          longitude: place.geometry?.location?.lng() || null
        }));
        
      }
    });

    // SERVICE AREA AUTOCOMPLETE - EXACT PATTERN FROM EnhancedSearchBar
    if (!serviceAreaInputRef.current) return;
    
    const serviceAreaInput = serviceAreaInputRef.current.querySelector('input');
    if (!serviceAreaInput) return;
    
    // Clear existing autocomplete if it exists
    if (serviceAreaAutocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(serviceAreaAutocompleteRef.current);
    }

    const serviceAreaAutocomplete = new window.google.maps.places.Autocomplete(serviceAreaInput, {
      types: ['(cities)'],
      componentRestrictions: { country: 'ca' }
    });

    serviceAreaAutocompleteRef.current = serviceAreaAutocomplete;

    serviceAreaAutocomplete.addListener('place_changed', () => {
      const place = serviceAreaAutocomplete.getPlace();
      
      if (place.address_components) {
        const comps = place.address_components;
        const pick = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
        const city = pick('locality') || pick('postal_town') || pick('administrative_area_level_3') || '';
        const province = pick('administrative_area_level_1') || '';
        const country = pick('country') || 'Canada';
        const loc = place.geometry?.location;
        
        const newArea = {
          placeId: place.place_id || null,
          city,
          province,
          country,
          latitude: loc ? (typeof loc.lat === 'function' ? loc.lat() : loc.lat) : null,
          longitude: loc ? (typeof loc.lng === 'function' ? loc.lng() : loc.lng) : null,
          formattedAddress: place.formatted_address || [city, province, country].filter(Boolean).join(', '),
          placeType: Array.isArray(place.types) ? place.types[0] : 'locality',
          serviceRadius: 25.0
        };
        
        // Check for duplicates
        const exists = (formData.serviceAreas || []).some(a => 
          (newArea.placeId && a.placeId && a.placeId === newArea.placeId) ||
          (a.city && a.city.toLowerCase() === newArea.city.toLowerCase() && 
           a.province && a.province.toLowerCase() === newArea.province.toLowerCase())
        );
        
        if (!exists) {
          setFormData(prev => ({
            ...prev,
            serviceAreas: [...(prev.serviceAreas || []), newArea]
          }));
        }
        
        // Clear input
        serviceAreaInput.value = '';
        
        // Hide Google Maps dropdown
        const pacContainers = document.querySelectorAll('.pac-container');
        pacContainers.forEach(container => {
          container.style.display = 'none';
        });
        
        // Remove focus from input
        if (serviceAreaInput) {
          serviceAreaInput.blur();
        }
      }
    });
  };

  const handleRemoveServiceArea = (index) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="location-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        
        {/* Street Address with Google Autocomplete */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            Street Address <span style={{ color: 'red' }}>*</span>
          </label>
          <div ref={addressInputRef}>
            <input
              type="text"
              className="form-input"
              placeholder="Start typing your address..."
              autoComplete="off"
              defaultValue={formData.address || ''}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* City and Province Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              City <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.city || ''}
              readOnly
              className="form-input"
              placeholder="Auto-filled from address"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                backgroundColor: '#f3f4f6',
                boxSizing: 'border-box',
                cursor: 'not-allowed'
              }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Province <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.province || ''}
              readOnly
              className="form-input"
              placeholder="Auto-filled from address"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                backgroundColor: '#f3f4f6',
                boxSizing: 'border-box',
                cursor: 'not-allowed'
              }}
            />
          </div>
        </div>

        {/* Postal Code and Country Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Postal Code <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.postalCode || ''}
              readOnly
              className="form-input"
              placeholder="Auto-filled from address"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                backgroundColor: '#f3f4f6',
                boxSizing: 'border-box',
                cursor: 'not-allowed'
              }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Country
            </label>
            <input
              type="text"
              value={formData.country || 'Canada'}
              readOnly
              className="form-input"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                backgroundColor: '#f3f4f6',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />

        {/* Service Areas Section */}
        <div className="form-group">
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            Service Areas <span style={{ color: 'red' }}>*</span>
          </label>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Add the cities or regions where you offer your services
          </p>
          
          <div ref={serviceAreaInputRef} style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Start typing a city name..."
              autoComplete="off"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Service Areas Tags - Matching Business Profile Style */}
          {formData.serviceAreas && formData.serviceAreas.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
              {formData.serviceAreas.map((area, index) => {
                // Handle both object format and string format for service areas
                let label;
                if (typeof area === 'string') {
                  label = area;
                } else {
                  // Use city + province, or formattedAddress, or just the area name
                  const city = area.city || area.name || '';
                  const province = area.province || area.state || '';
                  label = [city, province].filter(Boolean).join(', ') || area.formattedAddress || 'Unknown';
                }
                return (
                  <span
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.875rem',
                      background: '#f0f4ff',
                      border: '1px solid #d0ddff',
                      color: '#333',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceArea(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        padding: '0',
                        fontSize: '1.3rem',
                        lineHeight: 1,
                        marginLeft: '4px'
                      }}
                      onMouseOver={(e) => e.target.style.color = '#ef4444'}
                      onMouseOut={(e) => e.target.style.color = '#999'}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimpleWorkingLocationStep;
