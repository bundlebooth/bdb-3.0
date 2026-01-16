import React from 'react';
import './PackageServiceCard.css';

/**
 * Universal Package/Service Card Component
 * Used consistently across VendorProfilePage, BookingPage, ServicesPackagesPanel, and BecomeVendorPage
 */

// Helper function to get category icon
const getCategoryIcon = (category, name) => {
  const catLower = (category || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();
  
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

// Service Card Component
export const ServiceCard = ({ 
  service, 
  isSelected = false, 
  onClick, 
  onEdit,
  onDelete,
  showActions = false,
  selectable = false 
}) => {
  const name = service.ServiceName || service.serviceName || service.name || service.Name || '';
  const description = service.ServiceDescription || service.Description || service.description || service.vendorDescription || service.VendorDescription || service.PredefinedDescription || '';
  const imageURL = service.ImageURL || service.imageURL || service.Image || '';
  const category = service.CategoryName || service.category || service.Category || '';
  const duration = service.DurationMinutes || service.durationMinutes || service.VendorDurationMinutes || service.baseDuration || service.vendorDuration || service.baseDurationMinutes || service.Duration || null;
  
  // Sale price support
  const salePrice = service.SalePrice || service.salePrice || null;
  const originalPrice = service.OriginalPrice || service.originalPrice || null;
  const isOnSale = salePrice && parseFloat(salePrice) > 0 && originalPrice && parseFloat(originalPrice) > parseFloat(salePrice);
  
  // Get pricing info - check all possible field names from different API endpoints
  const getPricing = () => {
    // Check for different pricing formats from various API responses
    // VendorPrice comes from selected-services endpoint
    if (service.VendorPrice !== undefined && service.VendorPrice !== null && parseFloat(service.VendorPrice) > 0) {
      return { price: parseFloat(service.VendorPrice), type: service.PriceType || service.pricingModel || 'service' };
    }
    if (service.Price !== undefined && service.Price !== null && parseFloat(service.Price) > 0) {
      return { price: parseFloat(service.Price), type: service.PriceType || 'service' };
    }
    if (service.BasePrice !== undefined && service.BasePrice !== null && parseFloat(service.BasePrice) > 0) {
      return { price: parseFloat(service.BasePrice), type: service.PriceType || 'service' };
    }
    // baseRate comes from unified pricing model
    if (service.baseRate !== undefined && service.baseRate !== null && parseFloat(service.baseRate) > 0) {
      return { price: parseFloat(service.baseRate), type: service.pricingModel || 'hourly' };
    }
    if (service.BaseRate !== undefined && service.BaseRate !== null && parseFloat(service.BaseRate) > 0) {
      return { price: parseFloat(service.BaseRate), type: service.pricingModel || 'hourly' };
    }
    // fixedPrice for fixed pricing model
    if (service.fixedPrice !== undefined && service.fixedPrice !== null && parseFloat(service.fixedPrice) > 0) {
      return { price: parseFloat(service.fixedPrice), type: 'fixed' };
    }
    if (service.FixedPrice !== undefined && service.FixedPrice !== null && parseFloat(service.FixedPrice) > 0) {
      return { price: parseFloat(service.FixedPrice), type: 'fixed' };
    }
    // pricePerPerson for per-attendee pricing
    if (service.pricePerPerson !== undefined && service.pricePerPerson !== null && parseFloat(service.pricePerPerson) > 0) {
      return { price: parseFloat(service.pricePerPerson), type: 'per_person' };
    }
    if (service.PricePerPerson !== undefined && service.PricePerPerson !== null && parseFloat(service.PricePerPerson) > 0) {
      return { price: parseFloat(service.PricePerPerson), type: 'per_person' };
    }
    return { price: 0, type: 'service' };
  };

  const pricing = getPricing();
  const priceDisplay = pricing.price > 0 ? `$${pricing.price.toFixed(0)}` : 'Price TBD';
  
  // Get min/max attendees for per_attendee pricing
  const minAttendees = service.MinimumAttendees || service.minimumAttendees || null;
  const maxAttendees = service.MaximumAttendees || service.maximumAttendees || null;
  
  const getPriceSuffix = () => {
    const pricingModel = service.pricingModel || service.PricingModel || pricing.type;
    switch (pricingModel) {
      case 'per_person':
      case 'per_attendee':
        if (minAttendees && maxAttendees) {
          return `/ person (${minAttendees}-${maxAttendees} guests)`;
        } else if (minAttendees) {
          return `/ person (min ${minAttendees})`;
        } else if (maxAttendees) {
          return `/ person (max ${maxAttendees})`;
        }
        return '/ person';
      case 'per_hour':
      case 'hourly':
      case 'time_based':
        return '/ hour';
      case 'fixed':
      case 'fixed_price':
        return 'fixed price';
      default:
        return '';
    }
  };

  // Format duration
  const formatDuration = (mins) => {
    if (!mins) return null;
    const minutes = parseInt(mins);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      if (remainingMins > 0) {
        return `${hours}h ${remainingMins}m`;
      }
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} min`;
  };

  return (
    <div 
      className={`psc-card ${isSelected ? 'psc-card-selected' : ''} ${selectable ? 'psc-card-selectable' : ''}`}
      onClick={onClick}
    >
      <div className="psc-card-content">
        {/* Image/Icon */}
        <div className="psc-card-image">
          {imageURL ? (
            <img src={imageURL} alt={name} />
          ) : (
            <i className={`fas ${getCategoryIcon(category, name)}`}></i>
          )}
        </div>
        
        {/* Details */}
        <div className="psc-card-details">
          <div className="psc-card-header">
            <div className="psc-card-info">
              <h3 className="psc-card-title">
                {name}
                {isOnSale && <span className="psc-sale-badge">SALE!</span>}
              </h3>
              
              {/* Pricing - with sale price support */}
              <div className="psc-card-pricing">
                {isOnSale ? (
                  <>
                    <span className="psc-price">${parseFloat(salePrice).toFixed(0)}</span>
                    <span className="psc-price-original">${parseFloat(originalPrice).toFixed(0)}</span>
                  </>
                ) : (
                  <span className="psc-price">{priceDisplay}</span>
                )}
                <span className="psc-price-suffix">{getPriceSuffix()}</span>
              </div>
              
              {/* Tags - Pricing Model, Duration and Category */}
              <div className="psc-card-tags">
                {(() => {
                  const pricingModel = service.pricingModel || service.PricingModel || pricing.type;
                  if (pricingModel === 'time_based' || pricingModel === 'hourly' || pricingModel === 'per_hour') {
                    return <span className="psc-tag"><i className="far fa-clock" style={{ marginRight: '4px' }}></i>Hourly</span>;
                  } else if (pricingModel === 'fixed_price' || pricingModel === 'fixed') {
                    return <span className="psc-tag"><i className="fas fa-tag" style={{ marginRight: '4px' }}></i>Fixed</span>;
                  } else if (pricingModel === 'per_attendee' || pricingModel === 'per_person') {
                    return <span className="psc-tag"><i className="fas fa-users" style={{ marginRight: '4px' }}></i>Per Person</span>;
                  }
                  return null;
                })()}
                {formatDuration(duration) && (
                  <span className="psc-tag">
                    <i className="far fa-clock" style={{ marginRight: '4px' }}></i>
                    {formatDuration(duration)}
                  </span>
                )}
                {category && (
                  <span className="psc-tag">{category}</span>
                )}
              </div>
            </div>
            
            {/* Selection Indicator or Actions */}
            <div className="psc-card-actions">
              {selectable && (
                <div className={`psc-selection-indicator ${isSelected ? 'selected' : ''}`}>
                  {isSelected && <i className="fas fa-check"></i>}
                </div>
              )}
              {showActions && (
                <div className="psc-action-buttons">
                  {onEdit && (
                    <button 
                      type="button" 
                      className="psc-btn-edit"
                      onClick={(e) => { e.stopPropagation(); onEdit(service); }}
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      type="button" 
                      className="psc-btn-delete"
                      onClick={(e) => { e.stopPropagation(); onDelete(service); }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Package Card Component
export const PackageCard = ({ 
  pkg, 
  isSelected = false, 
  onClick, 
  onEdit,
  onDelete,
  showActions = false,
  selectable = false 
}) => {
  const name = pkg.PackageName || pkg.name || '';
  const description = pkg.Description || pkg.description || '';
  const imageURL = pkg.ImageURL || pkg.imageURL || '';
  const price = parseFloat(pkg.Price || pkg.price || 0);
  const salePrice = pkg.SalePrice ? parseFloat(pkg.SalePrice) : null;
  const priceType = pkg.PriceType || pkg.priceType || 'package';
  const includedServices = pkg.IncludedServices || pkg.includedServices || [];
  const isOnSale = salePrice && salePrice < price;
  const duration = pkg.DurationMinutes || pkg.Duration || pkg.duration || null;

  // Format duration
  const formatDuration = (mins) => {
    if (!mins) return null;
    const minutes = parseInt(mins);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      if (remainingMins > 0) {
        return `${hours}h ${remainingMins}m`;
      }
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} min`;
  };

  return (
    <div 
      className={`psc-card ${isSelected ? 'psc-card-selected' : ''} ${selectable ? 'psc-card-selectable' : ''}`}
      onClick={onClick}
    >
      <div className="psc-card-content">
        {/* Image/Icon */}
        <div className="psc-card-image">
          {imageURL ? (
            <img src={imageURL} alt={name} />
          ) : (
            <i className="fas fa-box"></i>
          )}
        </div>
        
        {/* Details */}
        <div className="psc-card-details">
          <div className="psc-card-header">
            <div className="psc-card-info">
              <h3 className="psc-card-title">
                {name}
                {isOnSale && <span className="psc-sale-badge">SALE!</span>}
              </h3>
              
              {/* Pricing */}
              <div className="psc-card-pricing">
                {isOnSale ? (
                  <>
                    <span className="psc-price">${salePrice.toFixed(0)}</span>
                    <span className="psc-price-original">${price.toFixed(0)}</span>
                  </>
                ) : (
                  <span className="psc-price">${price.toFixed(0)}</span>
                )}
                <span className="psc-price-suffix">
                  / {priceType === 'per_person' ? 'person' : 'package'}
                </span>
              </div>
              
              {/* Tags - Duration and Included Services */}
              <div className="psc-card-tags">
                {formatDuration(duration) && (
                  <span className="psc-tag">
                    <i className="far fa-clock"></i>
                    {formatDuration(duration)}
                  </span>
                )}
                {includedServices.length > 0 && (
                  <span className="psc-tag">
                    <i className="fas fa-layer-group"></i>
                    {includedServices.length} service{includedServices.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            {/* Selection Indicator or Actions */}
            <div className="psc-card-actions">
              {selectable && (
                <div className={`psc-selection-indicator ${isSelected ? 'selected' : ''}`}>
                  {isSelected && <i className="fas fa-check"></i>}
                </div>
              )}
              {showActions && (
                <div className="psc-action-buttons">
                  {onEdit && (
                    <button 
                      type="button" 
                      className="psc-btn-edit"
                      onClick={(e) => { e.stopPropagation(); onEdit(pkg); }}
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      type="button" 
                      className="psc-btn-delete"
                      onClick={(e) => { e.stopPropagation(); onDelete(pkg); }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Packages/Services Toggle Tabs Component
export const PackageServiceTabs = ({ 
  activeTab, 
  onTabChange, 
  packagesCount = 0, 
  servicesCount = 0 
}) => {
  return (
    <div className="psc-tabs">
      <button
        type="button"
        className={`psc-tab ${activeTab === 'packages' ? 'active' : ''}`}
        onClick={() => onTabChange('packages')}
      >
        <i className="fas fa-box"></i>
        Packages
        {packagesCount > 0 && <span className="psc-tab-count">{packagesCount}</span>}
      </button>
      <button
        type="button"
        className={`psc-tab ${activeTab === 'services' ? 'active' : ''}`}
        onClick={() => onTabChange('services')}
      >
        <i className="fas fa-concierge-bell"></i>
        Services
        {servicesCount > 0 && <span className="psc-tab-count">{servicesCount}</span>}
      </button>
    </div>
  );
};

// Empty State Component
export const PackageServiceEmpty = ({ type = 'packages', message }) => {
  const defaultMessage = type === 'packages' 
    ? 'No packages available.' 
    : 'No services available.';
  
  return (
    <div className="psc-empty">
      <i className={`fas ${type === 'packages' ? 'fa-box' : 'fa-concierge-bell'}`}></i>
      <p>{message || defaultMessage}</p>
    </div>
  );
};

// List Container Component
export const PackageServiceList = ({ children }) => {
  return (
    <div className="psc-list">
      {children}
    </div>
  );
};

export default { ServiceCard, PackageCard, PackageServiceTabs, PackageServiceEmpty, PackageServiceList };
