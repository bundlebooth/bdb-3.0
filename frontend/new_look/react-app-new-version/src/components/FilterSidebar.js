import React, { useState, useEffect, useRef } from 'react';

function FilterSidebar({ filters, onFilterChange, collapsed, userLocation }) {
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [location, setLocation] = useState(filters.location || '');
  const [useCurrentLocation, setUseCurrentLocation] = useState(filters.useCurrentLocation || false);
  const [distanceKm, setDistanceKm] = useState(filters.distanceKm || 50);
  const [priceLevel, setPriceLevel] = useState(filters.priceLevel || '');
  const [minRating, setMinRating] = useState(filters.minRating || '');
  const [region, setRegion] = useState(filters.region || '');
  const [activeTags, setActiveTags] = useState(filters.tags || []);
  
  // Auto-check "Use my location" when geolocation is approved
  useEffect(() => {
    if (userLocation && !useCurrentLocation) {
      setUseCurrentLocation(true);
      onFilterChange({ ...filters, useCurrentLocation: true });
    }
  }, [userLocation]);
  
  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!locationInputRef.current || useCurrentLocation) return;
    
    // Check if Google Maps API is loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      // Initialize autocomplete with Canada restriction
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          componentRestrictions: { country: 'ca' }, // Restrict to Canada
          fields: ['address_components', 'geometry', 'formatted_address'],
          types: ['(cities)'] // Prefer cities, but also allow addresses
        }
      );
      
      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (place.geometry) {
          // Extract city name from address components
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
          onFilterChange({ 
            ...filters, 
            location: locationValue,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          });
        }
      });
    }
    
    return () => {
      // Cleanup autocomplete listeners
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [useCurrentLocation]);

  const trendingTags = [
    { key: 'premium', icon: 'fa-crown', color: '#FFD700', label: 'Premium' },
    { key: 'eco-friendly', icon: 'fa-leaf', color: '#22c55e', label: 'Eco-Friendly' },
    { key: 'award-winning', icon: 'fa-trophy', color: '#f59e0b', label: 'Award Winning' },
    { key: 'last-minute', icon: 'fa-bolt', color: '#3b82f6', label: 'Last Minute' },
    { key: 'certified', icon: 'fa-award', color: '#8b5cf6', label: 'Certified' },
    { key: 'insured', icon: 'fa-shield-alt', color: '#10b981', label: 'Insured' },
    { key: 'local', icon: 'fa-map-marker-alt', color: '#ef4444', label: 'Local' },
    { key: 'mobile', icon: 'fa-wheelchair', color: '#06b6d4', label: 'Accessible' }
  ];

  const handleLocationChange = (value) => {
    setLocation(value);
    onFilterChange({ ...filters, location: value });
  };

  const handlePriceLevelChange = (value) => {
    setPriceLevel(value);
    onFilterChange({ ...filters, priceLevel: value });
  };

  const handleRatingChange = (value) => {
    setMinRating(value);
    onFilterChange({ ...filters, minRating: value });
  };

  const handleRegionChange = (value) => {
    setRegion(value);
    onFilterChange({ ...filters, region: value });
  };

  const toggleTag = (tag) => {
    const newTags = activeTags.includes(tag)
      ? activeTags.filter(t => t !== tag)
      : [...activeTags, tag];
    setActiveTags(newTags);
    onFilterChange({ ...filters, tags: newTags });
  };

  const resetLocation = () => {
    setLocation('');
    setUseCurrentLocation(false);
    setDistanceKm(50);
    onFilterChange({ ...filters, location: '', useCurrentLocation: false, distanceKm: 50 });
  };

  const resetPrice = () => {
    setPriceLevel('');
    onFilterChange({ ...filters, priceLevel: '' });
  };

  const resetRating = () => {
    setMinRating('');
    onFilterChange({ ...filters, minRating: '' });
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ display: collapsed ? 'none' : 'block' }}>
      <div className="filter-section">
        <h3 className="filter-title">
          Location
          <span className="filter-reset" onClick={resetLocation}>Reset</span>
        </h3>
        <input
          ref={locationInputRef}
          type="text"
          placeholder="City or Postal Code"
          className="search-input"
          id="location-input"
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          disabled={useCurrentLocation}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            marginBottom: '1rem',
            backgroundColor: useCurrentLocation ? '#f3f4f6' : 'white',
            cursor: useCurrentLocation ? 'not-allowed' : 'text'
          }}
        />
        <div className="filter-group">
          <div className="filter-option">
            <input
              type="checkbox"
              id="current-location"
              checked={useCurrentLocation}
              onChange={(e) => {
                setUseCurrentLocation(e.target.checked);
                onFilterChange({ ...filters, useCurrentLocation: e.target.checked });
              }}
            />
            <label htmlFor="current-location">Use my location</label>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="distance-range" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                Distance
              </label>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#5e72e4' }}>
                {distanceKm} km
              </span>
            </div>
            <input
              type="range"
              id="distance-range"
              min="10"
              max="200"
              step="10"
              value={distanceKm}
              onChange={(e) => {
                const newDistance = parseInt(e.target.value);
                setDistanceKm(newDistance);
                onFilterChange({ ...filters, distanceKm: newDistance });
              }}
              className="distance-slider"
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, #5e72e4 0%, #5e72e4 ${((distanceKm - 10) / 190) * 100}%, #e5e7eb ${((distanceKm - 10) / 190) * 100}%, #e5e7eb 100%)`,
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              <span>10 km</span>
              <span>200 km</span>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">
          Price Range
          <span className="filter-reset" onClick={resetPrice}>Reset</span>
        </h3>
        <select
          className="form-control"
          id="price-level-filter"
          value={priceLevel}
          onChange={(e) => handlePriceLevelChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'white'
          }}
        >
          <option value="">All Price Ranges</option>
          <option value="$">$ - Inexpensive</option>
          <option value="$$">$$ - Moderate</option>
          <option value="$$$">$$$ - Expensive</option>
          <option value="$$$$">$$$$ - Luxury</option>
        </select>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">
          Minimum Rating
          <span className="filter-reset" onClick={resetRating}>Reset</span>
        </h3>
        <select
          className="form-control"
          id="rating-filter"
          value={minRating}
          onChange={(e) => handleRatingChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'white'
          }}
        >
          <option value="">All Ratings</option>
          <option value="4">★★★★ 4+ Stars</option>
          <option value="3">★★★ 3+ Stars</option>
          <option value="2">★★ 2+ Stars</option>
          <option value="1">★ 1+ Star</option>
        </select>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Region</h3>
        <select
          className="region-select"
          id="region-select"
          value={region}
          onChange={(e) => handleRegionChange(e.target.value)}
        >
          <option value="">All Regions</option>
          <option value="north">Northern Region</option>
          <option value="south">Southern Region</option>
          <option value="east">Eastern Region</option>
          <option value="west">Western Region</option>
          <option value="central">Central Region</option>
        </select>
      </div>

      <div className="trending-section">
        <h3 className="filter-title">Popular Filters</h3>
        <div className="trending-tags">
          {trendingTags.map((tag) => (
            <div
              key={tag.key}
              className={`trending-tag ${activeTags.includes(tag.key) ? 'active' : ''}`}
              data-filter={tag.key}
              onClick={() => toggleTag(tag.key)}
            >
              <i className={`fas ${tag.icon}`} style={{ color: tag.color, marginRight: '6px' }}></i>
              {tag.label}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default FilterSidebar;
