import React, { useState, useEffect, useRef, useCallback } from 'react';
import UniversalModal from './UniversalModal';
import { API_BASE_URL } from '../config';

function FilterModal({ isOpen, onClose, filters, onFilterChange, userLocation, onApply, vendorCount = 0 }) {
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [location, setLocation] = useState(filters.location || '');
  const [useCurrentLocation, setUseCurrentLocation] = useState(filters.useCurrentLocation || false);
  const [distanceKm, setDistanceKm] = useState(filters.distanceKm || 50);
  const [priceLevel, setPriceLevel] = useState(filters.priceLevel || '');
  const [minRating, setMinRating] = useState(filters.minRating || '');
  const [region, setRegion] = useState(filters.region || '');
  const [activeTags, setActiveTags] = useState(filters.tags || []);
  const [previewCount, setPreviewCount] = useState(vendorCount);
  const [loadingCount, setLoadingCount] = useState(false);
  const debounceRef = useRef(null);

  // Fetch preview count when filters change
  const fetchPreviewCount = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      setLoadingCount(true);
      const params = new URLSearchParams();
      
      // Add location params
      if (userLocation) {
        params.set('latitude', String(userLocation.lat));
        params.set('longitude', String(userLocation.lng));
      }
      
      // Add distance filter (convert km to miles)
      const radiusMiles = Math.round(distanceKm * 0.621371);
      params.set('radiusMiles', String(radiusMiles));
      
      // Add other filters
      if (priceLevel) params.set('priceLevel', priceLevel);
      if (minRating) params.set('minRating', minRating);
      if (region) params.set('region', region);
      if (activeTags.length > 0) params.set('tags', activeTags.join(','));
      
      params.set('countOnly', 'true');
      
      const response = await fetch(`${API_BASE_URL}/vendors?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewCount(data.totalCount || data.count || (data.vendors || data.data || []).length || 0);
      }
    } catch (error) {
      console.error('Error fetching preview count:', error);
    } finally {
      setLoadingCount(false);
    }
  }, [isOpen, userLocation, distanceKm, priceLevel, minRating, region, activeTags]);

  // Debounced fetch when filters change
  useEffect(() => {
    if (!isOpen) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchPreviewCount();
    }, 300);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchPreviewCount, isOpen]);

  // Reset preview count when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewCount(vendorCount);
    }
  }, [isOpen, vendorCount]);
  
  // Auto-check "Use my location" when geolocation is approved
  useEffect(() => {
    if (userLocation && !useCurrentLocation) {
      setUseCurrentLocation(true);
    }
  }, [userLocation]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);
  
  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!locationInputRef.current || useCurrentLocation || !isOpen) return;
    
    // Check if Google Maps API is loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      // Initialize autocomplete with Canada restriction
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          componentRestrictions: { country: 'ca' },
          fields: ['address_components', 'geometry', 'formatted_address'],
          types: ['(cities)']
        }
      );
      
      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (place.geometry) {
          let cityName = '';
          let postalCode = '';
          
          if (place.address_components) {
            for (const component of place.address_components) {
              if (component.types.includes('locality')) {
                cityName = component.long_name;
              }
              if (component.types.includes('postal_code')) {
                postalCode = component.long_name;
              }
            }
          }
          
          const locationValue = cityName || postalCode || place.formatted_address;
          setLocation(locationValue);
        }
      });
    }
    
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [useCurrentLocation, isOpen]);

  const trendingTags = [
    { key: 'premium', icon: 'fa-crown', color: '#FFD700', label: 'Premium' },
    { key: 'eco-friendly', icon: 'fa-leaf', color: '#22c55e', label: 'Eco-Friendly' },
    { key: 'award-winning', icon: 'fa-trophy', color: '#f59e0b', label: 'Award Winning' },
    { key: 'last-minute', icon: 'fa-bolt', color: '#3b82f6', label: 'Last Minute' },
    { key: 'certified', icon: 'fa-award', color: '#8b5cf6', label: 'Certified' },
    { key: 'insured', icon: 'fa-shield-alt', color: '#10b981', label: 'Insured' }
  ];

  const handleClearAll = () => {
    setLocation('');
    setUseCurrentLocation(false);
    setDistanceKm(50);
    setPriceLevel('');
    setMinRating('');
    setRegion('');
    setActiveTags([]);
  };

  const handleApply = () => {
    const updatedFilters = {
      location,
      useCurrentLocation,
      distanceKm,
      priceLevel,
      minRating,
      region,
      tags: activeTags
    };
    
    if (locationInputRef.current && autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.geometry) {
        updatedFilters.latitude = place.geometry.location.lat();
        updatedFilters.longitude = place.geometry.location.lng();
      }
    }
    
    onFilterChange(updatedFilters);
    if (onApply) onApply();
    onClose();
  };

  const toggleTag = (tag) => {
    const newTags = activeTags.includes(tag)
      ? activeTags.filter(t => t !== tag)
      : [...activeTags, tag];
    setActiveTags(newTags);
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      size="medium"
      showFooter={false}
    >
      <div className="filter-modal-content">
          {/* Location */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: 600, 
                margin: 0,
                color: '#111827'
              }}>
                Location
              </h3>
              <button
                onClick={() => {
                  setLocation('');
                  setUseCurrentLocation(false);
                  setDistanceKm(50);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Reset
              </button>
            </div>
            <input
              ref={locationInputRef}
              type="text"
              placeholder="City or Postal Code"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={useCurrentLocation}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                marginBottom: '1rem',
                backgroundColor: useCurrentLocation ? '#f3f4f6' : 'white',
                cursor: useCurrentLocation ? 'not-allowed' : 'text',
                fontSize: '0.875rem'
              }}
            />
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              <input
                type="checkbox"
                checked={useCurrentLocation}
                onChange={(e) => setUseCurrentLocation(e.target.checked)}
                style={{ 
                  marginRight: '0.5rem',
                  cursor: 'pointer',
                  accentColor: '#6366f1'
                }}
              />
              Use my location
            </label>
            
            {/* Distance */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                  Distance
                </label>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6366f1' }}>
                  {distanceKm} km
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((distanceKm - 10) / 190) * 100}%, #e5e7eb ${((distanceKm - 10) / 190) * 100}%, #e5e7eb 100%)`,
                  outline: 'none',
                  cursor: 'pointer',
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                <span>10 km</span>
                <span>200 km</span>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: 600, 
                margin: 0,
                color: '#111827'
              }}>
                Price Range
              </h3>
              <button
                onClick={() => setPriceLevel('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Reset
              </button>
            </div>
            <select
              value={priceLevel}
              onChange={(e) => setPriceLevel(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '0.875rem'
              }}
            >
              <option value="">All Price Ranges</option>
              <option value="$">$ - Inexpensive</option>
              <option value="$$">$$ - Moderate</option>
              <option value="$$$">$$$ - Expensive</option>
              <option value="$$$$">$$$$ - Luxury</option>
            </select>
          </div>

          {/* Minimum Rating */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: 600, 
                margin: 0,
                color: '#111827'
              }}>
                Minimum Rating
              </h3>
              <button
                onClick={() => setMinRating('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Reset
              </button>
            </div>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '0.875rem'
              }}
            >
              <option value="">All Ratings</option>
              <option value="4">★★★★ 4+ Stars</option>
              <option value="3">★★★ 3+ Stars</option>
              <option value="2">★★ 2+ Stars</option>
              <option value="1">★ 1+ Star</option>
            </select>
          </div>

          {/* Region */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 600, 
              marginBottom: '1rem',
              color: '#111827'
            }}>
              Region
            </h3>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                fontSize: '0.875rem'
              }}
            >
              <option value="">All Regions</option>
              <option value="north">Northern Region</option>
              <option value="south">Southern Region</option>
              <option value="east">Eastern Region</option>
              <option value="west">Western Region</option>
              <option value="central">Central Region</option>
            </select>
          </div>

          {/* Popular Filters */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 600, 
              marginBottom: '1rem',
              color: '#111827'
            }}>
              Popular Filters
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '0.75rem' 
            }}>
              {trendingTags.map((tag) => (
                <label 
                  key={tag.key}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    padding: '0.5rem',
                    border: activeTags.includes(tag.key) ? '2px solid #6366f1' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: activeTags.includes(tag.key) ? '#f0f9ff' : 'white'
                  }}
                  onClick={() => toggleTag(tag.key)}
                >
                  <i className={`fas ${tag.icon}`} style={{ color: tag.color, marginRight: '8px', fontSize: '0.875rem' }}></i>
                  {tag.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={handleClearAll}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'transparent',
              color: '#111827',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Clear all
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
            }}
          >
            {loadingCount ? 'Loading...' : `Show ${previewCount} listing${previewCount !== 1 ? 's' : ''}`}
          </button>
        </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        /* Custom range slider styling */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #6366f1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #6366f1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        /* Scrollbar styling */
        .filter-modal > div:nth-child(2)::-webkit-scrollbar {
          width: 8px;
        }

        .filter-modal > div:nth-child(2)::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }

        .filter-modal > div:nth-child(2)::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .filter-modal > div:nth-child(2)::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </UniversalModal>
  );
}

export default FilterModal;
