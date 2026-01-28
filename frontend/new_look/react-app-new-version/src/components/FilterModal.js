import React, { useState, useEffect, useRef, useCallback } from 'react';
import UniversalModal from './UniversalModal';
import { API_BASE_URL } from '../config';

// Experience range options
const EXPERIENCE_RANGES = [
  { key: '0-1', label: 'Less than 1 year' },
  { key: '1-2', label: '1-2 years' },
  { key: '2-5', label: '2-5 years' },
  { key: '5-10', label: '5-10 years' },
  { key: '10-15', label: '10-15 years' },
  { key: '15+', label: '15+ years' }
];

// Service location options
const SERVICE_LOCATIONS = [
  { key: 'Local', label: 'Local (within city)' },
  { key: 'Regional', label: 'Regional (within province)' },
  { key: 'National', label: 'National (across Canada)' },
  { key: 'International', label: 'International' }
];

// Review count options
const REVIEW_COUNT_OPTIONS = [
  { key: '', label: 'Any' },
  { key: '5', label: '5+ reviews' },
  { key: '10', label: '10+ reviews' },
  { key: '25', label: '25+ reviews' },
  { key: '50', label: '50+ reviews' },
  { key: '100', label: '100+ reviews' }
];

// Fresh listings options (days)
const FRESH_LISTING_OPTIONS = [
  { key: '', label: 'Any time' },
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '60', label: 'Last 60 days' },
  { key: '90', label: 'Last 90 days' }
];

// Day of week options for availability
const DAY_OF_WEEK_OPTIONS = [
  { key: '0', label: 'Sunday' },
  { key: '1', label: 'Monday' },
  { key: '2', label: 'Tuesday' },
  { key: '3', label: 'Wednesday' },
  { key: '4', label: 'Thursday' },
  { key: '5', label: 'Friday' },
  { key: '6', label: 'Saturday' }
];

function FilterModal({ isOpen, onClose, filters, onFilterChange, userLocation, onApply, vendorCount = 0, category, city }) {
  // Filter state
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 10000]);
  const [minRating, setMinRating] = useState(filters.minRating || '');
  const [instantBookingOnly, setInstantBookingOnly] = useState(filters.instantBookingOnly || false);
  const [selectedEventTypes, setSelectedEventTypes] = useState(filters.eventTypes || []);
  const [selectedCultures, setSelectedCultures] = useState(filters.cultures || []);
  const [experienceRange, setExperienceRange] = useState(filters.experienceRange || '');
  const [serviceLocation, setServiceLocation] = useState(filters.serviceLocation || '');
  
  // NEW: Enhanced filter state
  const [minReviewCount, setMinReviewCount] = useState(filters.minReviewCount || '');
  const [freshListingsDays, setFreshListingsDays] = useState(filters.freshListingsDays || '');
  const [hasGoogleReviews, setHasGoogleReviews] = useState(filters.hasGoogleReviews || false);
  const [availabilityDate, setAvailabilityDate] = useState(filters.availabilityDate || '');
  const [availabilityDayOfWeek, setAvailabilityDayOfWeek] = useState(filters.availabilityDayOfWeek || '');
  
  // Lookup data
  const [eventTypes, setEventTypes] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [eventTypeAvailability, setEventTypeAvailability] = useState({});
  const [cultureAvailability, setCultureAvailability] = useState({});
  
  // UI state
  const [previewCount, setPreviewCount] = useState(vendorCount);
  const [loadingCount, setLoadingCount] = useState(false);
  const [showAllEventTypes, setShowAllEventTypes] = useState(false);
  const [showAllCultures, setShowAllCultures] = useState(false);
  const debounceRef = useRef(null);

  // Sync local state with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setPriceRange([filters.minPrice || 0, filters.maxPrice || 10000]);
      setMinRating(filters.minRating || '');
      setInstantBookingOnly(filters.instantBookingOnly || false);
      setSelectedEventTypes(filters.eventTypes || []);
      setSelectedCultures(filters.cultures || []);
      setExperienceRange(filters.experienceRange || '');
      setServiceLocation(filters.serviceLocation || '');
      // NEW: Sync enhanced filter state
      setMinReviewCount(filters.minReviewCount || '');
      setFreshListingsDays(filters.freshListingsDays || '');
      setHasGoogleReviews(filters.hasGoogleReviews || false);
      setAvailabilityDate(filters.availabilityDate || '');
      setAvailabilityDayOfWeek(filters.availabilityDayOfWeek || '');
    }
  }, [isOpen, filters]);

  // Fetch event types and cultures on mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [eventTypesRes, culturesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/vendors/lookup/event-types`),
          fetch(`${API_BASE_URL}/vendors/lookup/cultures`)
        ]);
        
        if (eventTypesRes.ok) {
          const data = await eventTypesRes.json();
          setEventTypes(data.eventTypes || []);
        }
        if (culturesRes.ok) {
          const data = await culturesRes.json();
          setCultures(data.cultures || []);
        }
      } catch (error) {
        console.error('Error fetching filter lookups:', error);
      }
    };
    
    if (isOpen) {
      fetchLookups();
    }
  }, [isOpen]);

  // Fetch preview count and availability when filters change
  const fetchPreviewCount = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      setLoadingCount(true);
      
      // Use the new filter-count endpoint
      const response = await fetch(`${API_BASE_URL}/vendors/filter-count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category || null,
          city: city || null,
          latitude: userLocation?.lat || null,
          longitude: userLocation?.lng || null,
          radiusMiles: 100, // Use a larger radius for filter count to show more options
          eventTypes: selectedEventTypes,
          cultures: selectedCultures,
          experienceRange: experienceRange || null,
          serviceLocation: serviceLocation || null,
          minPrice: priceRange[0] > 0 ? priceRange[0] : null,
          maxPrice: priceRange[1] < 10000 ? priceRange[1] : null,
          instantBookingOnly,
          minRating: minRating || null,
          // NEW: Enhanced filter parameters
          minReviewCount: minReviewCount || null,
          freshListingsDays: freshListingsDays || null,
          hasGoogleReviews: hasGoogleReviews || null,
          availabilityDate: availabilityDate || null,
          availabilityDayOfWeek: availabilityDayOfWeek || null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreviewCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching preview count:', error);
      // Fallback to old method
      try {
        const params = new URLSearchParams();
        if (userLocation) {
          params.set('latitude', String(userLocation.lat));
          params.set('longitude', String(userLocation.lng));
        }
        if (minRating) params.set('minRating', minRating);
        if (instantBookingOnly) params.set('instantBookingOnly', 'true');
        if (selectedEventTypes.length > 0) params.set('eventTypes', selectedEventTypes.join(','));
        if (selectedCultures.length > 0) params.set('cultures', selectedCultures.join(','));
        // NEW: Enhanced filter parameters for fallback
        if (minReviewCount) params.set('minReviewCount', minReviewCount);
        if (freshListingsDays) params.set('freshListingsDays', freshListingsDays);
        if (hasGoogleReviews) params.set('hasGoogleReviews', 'true');
        if (availabilityDate) params.set('availabilityDate', availabilityDate);
        if (availabilityDayOfWeek) params.set('availabilityDayOfWeek', availabilityDayOfWeek);
        params.set('pageSize', '1');
        
        const fallbackRes = await fetch(`${API_BASE_URL}/vendors?${params.toString()}`);
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setPreviewCount(data.totalCount || 0);
        }
      } catch (e) {
        console.error('Fallback count fetch failed:', e);
      }
    } finally {
      setLoadingCount(false);
    }
  }, [isOpen, userLocation, category, city, priceRange, minRating, instantBookingOnly, selectedEventTypes, selectedCultures, experienceRange, serviceLocation, minReviewCount, freshListingsDays, hasGoogleReviews, availabilityDate, availabilityDayOfWeek]);

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

  const handleClearAll = () => {
    setPriceRange([0, 10000]);
    setMinRating('');
    setInstantBookingOnly(false);
    setSelectedEventTypes([]);
    setSelectedCultures([]);
    setExperienceRange('');
    setServiceLocation('');
    // NEW: Clear enhanced filters
    setMinReviewCount('');
    setFreshListingsDays('');
    setHasGoogleReviews(false);
    setAvailabilityDate('');
    setAvailabilityDayOfWeek('');
  };

  const handleApply = () => {
    const updatedFilters = {
      minPrice: priceRange[0] > 0 ? priceRange[0] : null,
      maxPrice: priceRange[1] < 10000 ? priceRange[1] : null,
      minRating,
      instantBookingOnly,
      eventTypes: selectedEventTypes,
      cultures: selectedCultures,
      experienceRange,
      serviceLocation,
      // NEW: Enhanced filter values
      minReviewCount: minReviewCount || null,
      freshListingsDays: freshListingsDays || null,
      hasGoogleReviews,
      availabilityDate: availabilityDate || null,
      availabilityDayOfWeek: availabilityDayOfWeek || null
    };
    
    console.log('[FilterModal] Applying filters:', updatedFilters);
    onFilterChange(updatedFilters);
    if (onApply) onApply();
    onClose();
  };

  // Toggle event type selection
  const toggleEventType = (eventTypeId) => {
    setSelectedEventTypes(prev => 
      prev.includes(eventTypeId) 
        ? prev.filter(id => id !== eventTypeId)
        : [...prev, eventTypeId]
    );
  };

  // Toggle culture selection
  const toggleCulture = (cultureId) => {
    setSelectedCultures(prev => 
      prev.includes(cultureId) 
        ? prev.filter(id => id !== cultureId)
        : [...prev, cultureId]
    );
  };

  // Count active filters
  const activeFilterCount = [
    priceRange[0] > 0 || priceRange[1] < 10000,
    minRating,
    instantBookingOnly,
    selectedEventTypes.length > 0,
    selectedCultures.length > 0,
    experienceRange,
    serviceLocation,
    // NEW: Enhanced filter counts
    minReviewCount,
    freshListingsDays,
    hasGoogleReviews,
    availabilityDate,
    availabilityDayOfWeek
  ].filter(Boolean).length;

  // Chip style helper
  const getChipStyle = (isSelected, isDisabled = false) => ({
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: isSelected ? '2px solid #5086E8' : '1px solid #d1d5db',
    background: isSelected ? '#eff6ff' : isDisabled ? '#f9fafb' : 'white',
    color: isSelected ? '#5086E8' : isDisabled ? '#9ca3af' : '#374151',
    fontWeight: isSelected ? 600 : 400,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    opacity: isDisabled ? 0.5 : 1
  });

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      size="large"
      showFooter={false}
    >
      <div className="filter-modal-content" style={{ 
        maxHeight: 'calc(80vh - 140px)', 
        overflowY: 'auto',
        padding: '0 1.5rem'
      }}>
        
        {/* Price Range Section - Dual slider with min/max */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            margin: '0 0 1rem 0',
            color: '#111827'
          }}>
            Price Range
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#5086E8' }}>
              <strong>${priceRange[0].toLocaleString()}</strong>
            </span>
            <span style={{ fontSize: '0.875rem', color: '#5086E8' }}>
              <strong>${priceRange[1] >= 10000 ? '10,000+' : priceRange[1].toLocaleString()}</strong>
            </span>
          </div>
          <div style={{ position: 'relative', height: '6px', marginBottom: '1.5rem' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: '#e5e7eb',
              borderRadius: '3px'
            }} />
            <div style={{
              position: 'absolute',
              top: 0,
              left: `${(priceRange[0] / 10000) * 100}%`,
              right: `${100 - (priceRange[1] / 10000) * 100}%`,
              height: '6px',
              background: '#5086E8',
              borderRadius: '3px'
            }} />
            {/* Min price slider */}
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={priceRange[0]}
              onChange={(e) => {
                const newMin = parseInt(e.target.value);
                if (newMin < priceRange[1]) {
                  setPriceRange([newMin, priceRange[1]]);
                }
              }}
              style={{
                position: 'absolute',
                top: '-6px',
                left: 0,
                width: '100%',
                height: '18px',
                background: 'transparent',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                pointerEvents: 'auto',
                zIndex: 2
              }}
            />
            {/* Max price slider */}
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={priceRange[1]}
              onChange={(e) => {
                const newMax = parseInt(e.target.value);
                if (newMax > priceRange[0]) {
                  setPriceRange([priceRange[0], newMax]);
                }
              }}
              style={{
                position: 'absolute',
                top: '-6px',
                left: 0,
                width: '100%',
                height: '18px',
                background: 'transparent',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                pointerEvents: 'auto',
                zIndex: 1
              }}
            />
          </div>
          {/* Quick price presets */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Under $500', min: 0, max: 500 },
              { label: '$500 - $1,000', min: 500, max: 1000 },
              { label: '$1,000 - $2,500', min: 1000, max: 2500 },
              { label: '$2,500 - $5,000', min: 2500, max: 5000 },
              { label: '$5,000+', min: 5000, max: 10000 }
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setPriceRange([preset.min, preset.max])}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '16px',
                  border: (priceRange[0] === preset.min && priceRange[1] === preset.max) 
                    ? '2px solid #5086E8' : '1px solid #d1d5db',
                  background: (priceRange[0] === preset.min && priceRange[1] === preset.max) 
                    ? '#eff6ff' : 'white',
                  color: (priceRange[0] === preset.min && priceRange[1] === preset.max) 
                    ? '#5086E8' : '#6b7280',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Event Types Section - Giggster style chips */}
        {eventTypes.length > 0 && (
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Event Types
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
              Select the types of events you're planning
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(showAllEventTypes ? eventTypes : eventTypes.slice(0, 10)).map((et) => {
                const isSelected = selectedEventTypes.includes(et.EventTypeID);
                return (
                  <button
                    key={et.EventTypeID}
                    onClick={() => toggleEventType(et.EventTypeID)}
                    style={getChipStyle(isSelected)}
                  >
                    {et.EventTypeName}
                  </button>
                );
              })}
            </div>
            {eventTypes.length > 10 && (
              <button
                onClick={() => setShowAllEventTypes(!showAllEventTypes)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5086E8',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  marginTop: '0.75rem',
                  padding: 0
                }}
              >
                {showAllEventTypes ? 'Show less' : `Show all (${eventTypes.length})`} ↓
              </button>
            )}
          </div>
        )}

        {/* Cultures Served Section - Giggster style chips */}
        {cultures.length > 0 && (
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              margin: '0 0 1rem 0',
              color: '#111827'
            }}>
              Cultures Served
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
              Find vendors who specialize in your cultural traditions
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(showAllCultures ? cultures : cultures.slice(0, 12)).map((culture) => {
                const isSelected = selectedCultures.includes(culture.CultureID);
                return (
                  <button
                    key={culture.CultureID}
                    onClick={() => toggleCulture(culture.CultureID)}
                    style={getChipStyle(isSelected)}
                  >
                    {culture.CultureName}
                  </button>
                );
              })}
            </div>
            {cultures.length > 12 && (
              <button
                onClick={() => setShowAllCultures(!showAllCultures)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5086E8',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  marginTop: '0.75rem',
                  padding: 0
                }}
              >
                {showAllCultures ? 'Show less' : `Show all (${cultures.length})`} ↓
              </button>
            )}
          </div>
        )}

        {/* Service Location Section - Radio buttons like Giggster */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            margin: '0 0 1rem 0',
            color: '#111827'
          }}>
            Service Location
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
            How far is the vendor willing to travel?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {SERVICE_LOCATIONS.map((loc) => {
              const isSelected = serviceLocation === loc.key;
              return (
                <label
                  key={loc.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #5086E8' : '1px solid #d1d5db',
                    background: isSelected ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flex: '1 1 calc(50% - 0.5rem)',
                    minWidth: '140px'
                  }}
                >
                  <input
                    type="radio"
                    name="serviceLocation"
                    value={loc.key}
                    checked={isSelected}
                    onChange={(e) => setServiceLocation(e.target.value)}
                    style={{ accentColor: '#5086E8' }}
                  />
                  <span style={{ fontWeight: isSelected ? 600 : 400, fontSize: '0.875rem' }}>
                    {loc.label}
                  </span>
                </label>
              );
            })}
          </div>
          {serviceLocation && (
            <button
              onClick={() => setServiceLocation('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#5086E8',
                fontSize: '0.875rem',
                cursor: 'pointer',
                marginTop: '0.5rem',
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Years of Experience Section */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            margin: '0 0 1rem 0',
            color: '#111827'
          }}>
            Years of Experience
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
            How experienced should the vendor be?
          </p>
          <select
            value={experienceRange}
            onChange={(e) => setExperienceRange(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '0.9rem',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Any experience level</option>
            {EXPERIENCE_RANGES.map(range => (
              <option key={range.key} value={range.key}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filters - Toggle Section */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            margin: '0 0 1rem 0',
            color: '#111827'
          }}>
            Quick Filters
          </h3>
          
          {/* Instant Booking Toggle */}
          <label 
            style={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#374151',
              marginBottom: '1rem'
            }}
          >
            <div style={{
              width: '48px',
              height: '26px',
              borderRadius: '13px',
              background: instantBookingOnly ? '#5086E8' : '#d1d5db',
              position: 'relative',
              marginRight: '1rem',
              transition: 'background 0.2s',
              flexShrink: 0
            }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '2px',
                left: instantBookingOnly ? '24px' : '2px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
              <input
                type="checkbox"
                checked={instantBookingOnly}
                onChange={() => setInstantBookingOnly(!instantBookingOnly)}
                style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>Instant Booking</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                Book immediately without waiting for vendor approval
              </div>
            </div>
          </label>

          {/* Has Google Business Profile Toggle */}
          <label 
            style={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#374151'
            }}
          >
            <div style={{
              width: '48px',
              height: '26px',
              borderRadius: '13px',
              background: hasGoogleReviews ? '#5086E8' : '#d1d5db',
              position: 'relative',
              marginRight: '1rem',
              transition: 'background 0.2s',
              flexShrink: 0
            }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '2px',
                left: hasGoogleReviews ? '24px' : '2px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
              <input
                type="checkbox"
                checked={hasGoogleReviews}
                onChange={() => setHasGoogleReviews(!hasGoogleReviews)}
                style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#111827', fontSize: '1rem' }}>Google Business Profile</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                Show vendors with a linked Google Business profile
              </div>
            </div>
          </label>
        </div>

        {/* Fresh Listings Section */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            margin: '0 0 1rem 0',
            color: '#111827'
          }}>
            Fresh Listings
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Show newly added vendors
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {FRESH_LISTING_OPTIONS.map((option) => {
              const isSelected = freshListingsDays === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => setFreshListingsDays(option.key)}
                  style={getChipStyle(isSelected)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Review Count Section */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            margin: '0 0 1rem 0',
            color: '#111827'
          }}>
            Number of Reviews
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Filter by minimum review count
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {REVIEW_COUNT_OPTIONS.map((option) => {
              const isSelected = minReviewCount === option.key;
              return (
                <button
                  key={option.key}
                  onClick={() => setMinReviewCount(option.key)}
                  style={getChipStyle(isSelected)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability Section */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            margin: '0 0 1rem 0',
            color: '#111827'
          }}>
            Availability
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
            Filter by vendor availability
          </p>
          
          {/* Date picker */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#374151' }}>
              Available on specific date
            </label>
            <input
              type="date"
              value={availabilityDate}
              onChange={(e) => setAvailabilityDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                maxWidth: '200px',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
                background: 'white',
                cursor: 'pointer'
              }}
            />
            {availabilityDate && (
              <button
                onClick={() => setAvailabilityDate('')}
                style={{
                  marginLeft: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: '#5086E8',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Day of week */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#374151' }}>
              Or available on day of week
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {DAY_OF_WEEK_OPTIONS.map((day) => {
                const isSelected = availabilityDayOfWeek === day.key;
                return (
                  <button
                    key={day.key}
                    onClick={() => setAvailabilityDayOfWeek(isSelected ? '' : day.key)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #5086E8' : '1px solid #d1d5db',
                      background: isSelected ? '#eff6ff' : 'white',
                      color: isSelected ? '#5086E8' : '#374151',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {day.label.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Minimum Rating */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            margin: '0 0 1rem 0',
            color: '#111827'
          }}>
            Minimum Rating
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['', '3', '4', '4.5'].map((rating) => {
              const isSelected = minRating === rating;
              const label = rating === '' ? 'Any' : `${rating}+ ★`;
              return (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    border: isSelected ? '2px solid #5086E8' : '1px solid #d1d5db',
                    background: isSelected ? '#eff6ff' : 'white',
                    color: isSelected ? '#5086E8' : '#374151',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        background: 'white'
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
            padding: '0.875rem 2rem',
            border: 'none',
            borderRadius: '8px',
            background: '#5086E8',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
            minWidth: '180px'
          }}
          onMouseEnter={(e) => e.target.style.background = '#4070D0'}
          onMouseLeave={(e) => e.target.style.background = '#5086E8'}
        >
          {loadingCount ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span className="spinner-small" style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Loading...
            </span>
          ) : (
            `Show ${previewCount.toLocaleString()} listing${previewCount !== 1 ? 's' : ''}`
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
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
          border: 2px solid #5086E8;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #5086E8;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        /* Scrollbar styling */
        .filter-modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .filter-modal-content::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }

        .filter-modal-content::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .filter-modal-content::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </UniversalModal>
  );
}

export default FilterModal;
