import React from 'react';

/**
 * Unified ServiceCard component used across Vendor Profile, Business Profile, and Booking pages
 * Ensures consistent display of service information
 */
function ServiceCard({ service, variant = 'display', isSelected = false, onSelect = null }) {
  const serviceName = service.ServiceName || service.name || service.Name || 'Unnamed Service';
  const serviceDescription = service.Description || service.description || service.vendorDescription || '';
  const categoryName = service.CategoryName || service.category || service.Category || '';
  const durationMinutes = service.DurationMinutes || service.VendorDurationMinutes || service.DefaultDurationMinutes || service.vendorDuration || service.defaultDuration || 0;
  const capacity = service.MaxAttendees || service.maximumAttendees || service.Capacity || 0;
  const requiresDeposit = service.RequiresDeposit || false;
  const depositPercentage = service.DepositPercentage || 0;
  
  // Pricing logic
  const pricingModel = service.pricingModel || service.PricingModel || 'time_based';
  const baseRate = service.BaseRate || service.baseRate || null;
  const overtimeRate = service.OvertimeRatePerHour || service.overtimeRatePerHour || null;
  const fixedPrice = service.FixedPrice || service.fixedPrice || service.Price || service.VendorPrice || null;
  const pricePerPerson = service.PricePerPerson || service.pricePerPerson || null;
  
  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };
  
  // Format pricing display
  const getPricingDisplay = () => {
    if (pricingModel === 'time_based' && baseRate) {
      const base = `$${parseFloat(baseRate).toFixed(0)}`;
      const overtime = overtimeRate ? ` + $${parseFloat(overtimeRate).toFixed(0)}/hr` : '';
      return { main: base, sub: overtime ? `Base rate${overtime} overtime` : 'Base rate' };
    } else if (pricingModel === 'fixed_price' && fixedPrice) {
      return { main: `$${parseFloat(fixedPrice).toFixed(0)}`, sub: 'Fixed price' };
    } else if (pricingModel === 'per_attendee' && pricePerPerson) {
      return { main: `$${parseFloat(pricePerPerson).toFixed(0)}`, sub: 'Per person' };
    } else if (fixedPrice) {
      return { main: `$${parseFloat(fixedPrice).toFixed(0)}`, sub: 'Per service' };
    }
    return { main: 'Price on request', sub: '' };
  };
  
  const pricing = getPricingDisplay();
  
  // Get category icon
  const getCategoryIcon = () => {
    const catLower = categoryName.toLowerCase();
    const nameLower = serviceName.toLowerCase();
    
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
  
  const durationText = formatDuration(durationMinutes);
  
  // Selectable variant (for booking page)
  if (variant === 'selectable') {
    return (
      <div
        className={`service-card ${isSelected ? 'selected' : ''}`}
        onClick={onSelect}
        style={{
          padding: '1rem',
          background: isSelected ? '#f0f7ff' : '#fff',
          border: `2px solid ${isSelected ? '#5e72e4' : '#e5e7eb'}`,
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        <div style={{
          flexShrink: 0,
          width: '50px',
          height: '50px',
          borderRadius: '8px',
          background: isSelected ? '#5e72e4' : '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className={`fas ${getCategoryIcon()}`} style={{ color: isSelected ? 'white' : '#6b7280', fontSize: '1.25rem' }}></i>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem 0' }}>
            {serviceName}
          </h4>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280', flexWrap: 'wrap' }}>
            {categoryName && <span><i className="fas fa-tag" style={{ marginRight: '0.25rem' }}></i>{categoryName}</span>}
            {durationText && <span><i className="far fa-clock" style={{ marginRight: '0.25rem' }}></i>{durationText}</span>}
            <span style={{ fontWeight: 600, color: '#111827' }}>{pricing.main}</span>
          </div>
        </div>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: `2px solid ${isSelected ? '#5e72e4' : '#d1d5db'}`,
          background: isSelected ? '#5e72e4' : 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isSelected && <i className="fas fa-check" style={{ color: 'white', fontSize: '0.75rem' }}></i>}
        </div>
      </div>
    );
  }
  
  // Display variant (for vendor profile and business profile)
  return (
    <div className="service-card" style={{
      padding: '1.25rem',
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px'
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{
          flexShrink: 0,
          width: '60px',
          height: '60px',
          borderRadius: '10px',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className={`fas ${getCategoryIcon()}`} style={{ color: '#5e72e4', fontSize: '1.5rem' }}></i>
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
              {serviceName}
            </h3>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                {pricing.main}
              </div>
              {pricing.sub && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {pricing.sub}
                </div>
              )}
            </div>
          </div>
          
          {/* Metadata row - all on same line */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            fontSize: '0.875rem', 
            color: '#6b7280',
            marginBottom: serviceDescription ? '0.75rem' : 0,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {categoryName && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <i className="fas fa-tag"></i>
                {categoryName}
              </span>
            )}
            {durationText && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <i className="fas fa-clock"></i>
                {durationText}
              </span>
            )}
            {capacity > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <i className="fas fa-users"></i>
                Up to {capacity}
              </span>
            )}
            {requiresDeposit && depositPercentage > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#5e72e4' }}>
                <i className="fas fa-receipt"></i>
                {depositPercentage}% deposit
              </span>
            )}
          </div>
          
          {serviceDescription && (
            <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>
              {serviceDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceCard;
