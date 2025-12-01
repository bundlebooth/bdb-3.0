import React, { useEffect, useRef } from 'react';

function NewLocationStep({ formData = {}, onInputChange = () => {} }) {
  const addressInputRef = useRef(null);
  const cityInputRef = useRef(null);

  useEffect(() => {
    console.log('🔍 Checking Google Maps availability...');
    console.log('window.google:', window.google);
    console.log('window.google?.maps:', window.google?.maps);
    console.log('window.google?.maps?.places:', window.google?.maps?.places);

    // SIMPLE TEST - just try to create autocomplete
    const testAutocomplete = () => {
      if (!addressInputRef.current) {
        console.log('❌ Address input ref not ready');
        setTimeout(testAutocomplete, 100);
        return;
      }

      if (!window.google?.maps?.places?.Autocomplete) {
        console.log('❌ Google Maps Autocomplete not available');
        setTimeout(testAutocomplete, 500);
        return;
      }

      try {
        console.log('✅ Creating autocomplete...');
        
        // Create address autocomplete
        const addressAutocomplete = new window.google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            types: ['address'],
            componentRestrictions: { country: 'ca' }
          }
        );

        console.log('✅ Address autocomplete created:', addressAutocomplete);

        // FORCE SHOW GOOGLE DROPDOWN - ADD CSS TO HEAD
        const style = document.createElement('style');
        style.textContent = `
          .pac-container {
            background-color: white !important;
            z-index: 9999999 !important;
            position: absolute !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            border: 1px solid #ccc !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            margin-top: 2px !important;
          }
          .pac-item {
            padding: 12px 16px !important;
            cursor: pointer !important;
            border-bottom: 1px solid #f0f0f0 !important;
            font-size: 14px !important;
          }
          .pac-item:hover {
            background-color: #f7f7f7 !important;
          }
        `;
        document.head.appendChild(style);

        // Listen for selection
        addressAutocomplete.addListener('place_changed', () => {
          console.log('🎯 PLACE CHANGED FIRED!');
          const place = addressAutocomplete.getPlace();
          console.log('📍 Selected place:', place);

          if (!place || !place.address_components) {
            console.log('❌ No address components');
            return;
          }

          // Extract components
          const getComponent = (type) => {
            const comp = place.address_components.find(c => c.types.includes(type));
            return comp?.long_name || '';
          };

          const streetNum = getComponent('street_number');
          const route = getComponent('route');
          const street = (streetNum + ' ' + route).trim();
          const city = getComponent('locality') || getComponent('sublocality');
          const province = getComponent('administrative_area_level_1');
          const postal = getComponent('postal_code');

          console.log('📋 Extracted:', { street, city, province, postal });

          // Update fields
          onInputChange('address', street);
          onInputChange('city', city);
          onInputChange('province', province);
          onInputChange('postalCode', postal);
          onInputChange('country', 'Canada');

          if (place.geometry?.location) {
            const lat = typeof place.geometry.location.lat === 'function' 
              ? place.geometry.location.lat() 
              : place.geometry.location.lat;
            const lng = typeof place.geometry.location.lng === 'function'
              ? place.geometry.location.lng()
              : place.geometry.location.lng;
            
            onInputChange('latitude', lat);
            onInputChange('longitude', lng);
            console.log('🗺️ Coordinates:', lat, lng);
          }

          console.log('✅ ALL FIELDS SHOULD BE UPDATED NOW!');
        });

        // Create city autocomplete if element exists
        if (cityInputRef.current) {
          const cityAutocomplete = new window.google.maps.places.Autocomplete(
            cityInputRef.current,
            {
              types: ['(cities)'],
              componentRestrictions: { country: 'ca' }
            }
          );

          cityAutocomplete.addListener('place_changed', () => {
            const place = cityAutocomplete.getPlace();
            if (place.formatted_address) {
              const areas = formData.serviceAreas || [];
              if (!areas.includes(place.formatted_address)) {
                onInputChange('serviceAreas', [...areas, place.formatted_address]);
              }
              cityInputRef.current.value = '';
            }
          });

          console.log('✅ City autocomplete created');
        }

      } catch (error) {
        console.error('❌ Error creating autocomplete:', error);
      }
    };

    testAutocomplete();
  }, [formData.serviceAreas]);

  const removeServiceArea = (index) => {
    const areas = formData.serviceAreas || [];
    onInputChange('serviceAreas', areas.filter((_, i) => i !== index));
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Where are you located?</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Set your business address and service areas
      </p>

      {/* Address */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Street Address *
        </label>
        <input
          ref={addressInputRef}
          type="text"
          placeholder="Start typing your address..."
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '15px',
            boxSizing: 'border-box'
          }}
        />
        <small style={{ color: '#666', fontSize: '13px' }}>
          Google will suggest addresses as you type
        </small>
      </div>

      {/* City and Province */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            City *
          </label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => onInputChange('city', e.target.value)}
            placeholder="Toronto"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Province *
          </label>
          <input
            type="text"
            value={formData.province || ''}
            onChange={(e) => onInputChange('province', e.target.value)}
            placeholder="Ontario"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Postal Code and Country */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Postal Code *
          </label>
          <input
            type="text"
            value={formData.postalCode || ''}
            onChange={(e) => onInputChange('postalCode', e.target.value)}
            placeholder="M5H 2N2"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Country
          </label>
          <input
            type="text"
            value={formData.country || 'Canada'}
            onChange={(e) => onInputChange('country', e.target.value)}
            placeholder="Canada"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Service Areas */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '30px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Service Areas *
        </label>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          Add cities where you offer your services
        </p>
        <input
          ref={cityInputRef}
          type="text"
          placeholder="Start typing a city name..."
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '15px',
            marginBottom: '15px',
            boxSizing: 'border-box'
          }}
        />
        <small style={{ color: '#666', fontSize: '13px', display: 'block', marginBottom: '15px' }}>
          Google will suggest cities as you type
        </small>

        {/* Service Areas List */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {(formData.serviceAreas || []).map((area, index) => (
            <div
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: '#f7f7f7',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              {area}
              <button
                type="button"
                onClick={() => removeServiceArea(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewLocationStep;
