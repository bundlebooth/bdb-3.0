import React, { useState } from 'react';

function FilterSidebar({ filters, onFilterChange, collapsed }) {
  const [location, setLocation] = useState(filters.location || '');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [within50Miles, setWithin50Miles] = useState(false);
  const [priceLevel, setPriceLevel] = useState(filters.priceLevel || '');
  const [minRating, setMinRating] = useState(filters.minRating || '');
  const [region, setRegion] = useState(filters.region || '');
  const [activeTags, setActiveTags] = useState(filters.tags || []);

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
    setWithin50Miles(false);
    onFilterChange({ ...filters, location: '', useCurrentLocation: false, within50Miles: false });
  };

  const resetPrice = () => {
    setPriceLevel('');
    onFilterChange({ ...filters, priceLevel: '' });
  };

  const resetRating = () => {
    setMinRating('');
    onFilterChange({ ...filters, minRating: '' });
  };

  if (collapsed) {
    return null;
  }

  return (
    <aside className="sidebar">
      <div className="filter-section">
        <h3 className="filter-title">
          Location
          <span className="filter-reset" onClick={resetLocation}>Reset</span>
        </h3>
        <input
          type="text"
          placeholder="City or ZIP code"
          className="search-input"
          id="location-input"
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            marginBottom: '1rem'
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
          <div className="filter-option">
            <input
              type="checkbox"
              id="within50"
              checked={within50Miles}
              onChange={(e) => {
                setWithin50Miles(e.target.checked);
                onFilterChange({ ...filters, within50Miles: e.target.checked });
              }}
            />
            <label htmlFor="within50">Within 50 miles</label>
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
