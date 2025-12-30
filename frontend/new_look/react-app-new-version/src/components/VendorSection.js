import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorCard from './VendorCard';
import { useVendorOnlineStatus } from '../hooks/useOnlineStatus';
import '../styles/VendorSection.css';

/**
 * VendorSection Component
 * Displays a horizontal scrollable section of vendor cards
 * Similar to Airbnb's grouped listings
 */
function VendorSection({ 
  title, 
  description, 
  vendors, 
  favorites = [], 
  onToggleFavorite, 
  onViewVendor, 
  onHighlightVendor,
  icon = null,
  showViewCount = false,
  showResponseTime = false,
  showAnalyticsBadge = false,
  analyticsBadgeType = null,
  sectionType = null,
  cityFilter = null,
  categoryFilter = null
}) {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  // Memoize vendors length to avoid unnecessary re-renders
  const vendorsLength = vendors?.length || 0;

  const calculateVisibleCount = useCallback(() => {
    if (!scrollContainerRef.current) return 4;
    const containerWidth = scrollContainerRef.current.offsetWidth;
    
    // On mobile (768px or less), show 4 cards for 2x2 grid
    if (window.innerWidth <= 768) {
      return 4;
    }
    
    const cardWidth = 240; // Match main grid minmax(240px, 1fr)
    const gap = 16;
    // Less conservative margin to fit more cards
    const availableWidth = containerWidth - 20; // Reduced safety margin
    const count = Math.floor(availableWidth / (cardWidth + gap));
    return Math.max(1, Math.min(count, 8)); // Increased cap to 8 cards max
  }, []);

  // Update visible count on mount and resize only - run once
  useEffect(() => {
    const count = calculateVisibleCount();
    setVisibleCount(count);
    
    const handleResize = () => {
      const newCount = calculateVisibleCount();
      setVisibleCount(newCount);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency - only run on mount
  
  // Compute scroll button states directly (no useEffect needed)
  const maxIndex = Math.max(0, vendorsLength - visibleCount);
  const computedCanScrollLeft = currentIndex > 0;
  const computedCanScrollRight = currentIndex < maxIndex;

  const scroll = (direction) => {
    const scrollAmount = 1; // Always scroll one card at a time
    const maxIndex = Math.max(0, vendors.length - visibleCount);
    
    if (direction === 'left') {
      setCurrentIndex(prev => Math.max(0, prev - scrollAmount));
    } else {
      setCurrentIndex(prev => Math.min(maxIndex, prev + scrollAmount));
    }
  };

  // Get icon and color based on section title if not provided
  const getIconConfig = () => {
    if (icon) return { icon, color: '#FF385C' };
    
    const titleLower = title.toLowerCase();
    if (titleLower.includes('trending')) return { icon: 'fa-fire', color: '#FF385C' };
    if (titleLower.includes('top rated') || titleLower.includes('rated')) return { icon: 'fa-star', color: '#FFB400' };
    if (titleLower.includes('responsive')) return { icon: 'fa-bolt', color: '#00A699' };
    if (titleLower.includes('reviewed') || titleLower.includes('review')) return { icon: 'fa-comment-dots', color: '#5E72E4' };
    if (titleLower.includes('near') || titleLower.includes('nearby')) return { icon: 'fa-location-dot', color: '#8B5CF6' };
    if (titleLower.includes('premium')) return { icon: 'fa-crown', color: '#F59E0B' };
    if (titleLower.includes('booked') || titleLower.includes('popular')) return { icon: 'fa-heart', color: '#EC4899' };
    if (titleLower.includes('new') || titleLower.includes('added')) return { icon: 'fa-sparkles', color: '#10B981' };
    if (titleLower.includes('recommended')) return { icon: 'fa-thumbs-up', color: '#3B82F6' };
    return { icon: 'fa-store', color: '#6366F1' };
  };

  const iconConfig = getIconConfig();

  // Memoize vendor IDs to prevent infinite loop in useVendorOnlineStatus
  const vendorIds = useMemo(() => {
    return vendors?.map(v => v.vendorProfileId || v.VendorProfileID || v.id).filter(Boolean) || [];
  }, [vendors]);
  
  const { statuses: onlineStatuses } = useVendorOnlineStatus(vendorIds, { 
    enabled: vendorIds.length > 0, 
    refreshInterval: 300000 // 5 minutes for landing page
  });

  if (!vendors || vendors.length === 0) {
    return null;
  }

  return (
    <>
      <div className="vendor-section">
        <div className="vendor-section-header">
          <div className="vendor-section-title-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 className="vendor-section-title" style={{ margin: 0 }}>
                <span className="vendor-section-icon" style={{ backgroundColor: `${iconConfig.color}15`, color: iconConfig.color }}>
                  <i className={`fas ${iconConfig.icon}`}></i>
                </span>
                {title}
              </h2>
              {description && (
                <p className="vendor-section-description" style={{ margin: 0 }}>{description}</p>
              )}
            </div>
          </div>
          <div className="vendor-section-controls">
            <button 
              className="vendor-section-show-all"
              onClick={() => {
                // Build browse URL based on section type
                let browseUrl = '/browse/';
                
                // Determine the discovery type from title
                const titleLower = title.toLowerCase();
                let discoveryType = sectionType;
                
                if (!discoveryType) {
                  if (titleLower.includes('trending')) discoveryType = 'trending';
                  else if (titleLower.includes('top rated') || titleLower.includes('rated')) discoveryType = 'top-rated';
                  else if (titleLower.includes('responsive')) discoveryType = 'most-responsive';
                  else if (titleLower.includes('reviewed') || titleLower.includes('review')) discoveryType = 'recently-reviewed';
                  else if (titleLower.includes('near') || titleLower.includes('nearby')) discoveryType = 'nearby';
                  else if (titleLower.includes('premium')) discoveryType = 'premium';
                  else if (titleLower.includes('booked') || titleLower.includes('popular')) discoveryType = 'popular';
                  else if (titleLower.includes('new') || titleLower.includes('added')) discoveryType = 'new';
                  else if (titleLower.includes('recommended')) discoveryType = 'recommended';
                }
                
                // Build URL: /browse/city/category or /browse/discovery-type
                if (cityFilter) {
                  browseUrl += encodeURIComponent(cityFilter);
                  if (categoryFilter && categoryFilter !== 'all') {
                    browseUrl += '/' + categoryFilter;
                  }
                } else if (categoryFilter && categoryFilter !== 'all') {
                  browseUrl += categoryFilter;
                } else if (discoveryType) {
                  browseUrl += discoveryType;
                } else {
                  // Fallback: show modal for unknown types
                  setShowModal(true);
                  return;
                }
                
                navigate(browseUrl);
              }}
            >
              Show all ({vendors.length})
            </button>
            <div className="vendor-section-nav">
              <button 
                className="vendor-section-nav-btn vendor-section-nav-btn-left"
                onClick={() => scroll('left')}
                disabled={!computedCanScrollLeft}
                aria-label="Scroll left"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                className="vendor-section-nav-btn vendor-section-nav-btn-right"
                onClick={() => scroll('right')}
                disabled={!computedCanScrollRight}
                aria-label="Scroll right"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      
        <div className="vendor-section-scroll-container" ref={scrollContainerRef}>
          <div 
            className="vendor-section-carousel"
            style={{
              display: 'flex',
              gap: '16px',
              transform: `translateX(-${currentIndex * 236}px)`,
              transition: 'transform 0.3s ease-in-out'
            }}
          >
            {vendors.map((vendor) => {
              const vendorId = vendor.vendorProfileId || vendor.VendorProfileID || vendor.id;
              return (
                <div 
                  key={vendorId}
                  style={{
                    flex: '0 0 220px',
                    width: '220px'
                  }}
                >
                  <VendorCard
                    vendor={vendor}
                    isFavorite={favorites.includes(vendorId)}
                    onToggleFavorite={onToggleFavorite}
                    onView={onViewVendor}
                    onHighlight={onHighlightVendor}
                    showViewCount={showViewCount}
                    showResponseTime={showResponseTime}
                    showAnalyticsBadge={showAnalyticsBadge}
                    analyticsBadgeType={analyticsBadgeType}
                    onlineStatus={onlineStatuses[vendorId]}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal for showing all vendors */}
      {showModal && (
        <div className="vendor-section-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="vendor-section-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-section-modal-header">
              <h2>
                <span className="vendor-section-icon" style={{ backgroundColor: `${iconConfig.color}15`, color: iconConfig.color }}>
                  <i className={`fas ${iconConfig.icon}`}></i>
                </span>
                {title}
              </h2>
              <button 
                className="vendor-section-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="vendor-section-modal-content">
              <div className="vendor-section-modal-grid">
                {vendors && vendors.length > 0 ? (
                  vendors.map((vendor) => {
                    const vendorId = vendor.vendorProfileId || vendor.VendorProfileID || vendor.id;
                    if (!vendorId) {
                      console.warn('Vendor missing ID:', vendor);
                      return null;
                    }
                    return (
                      <VendorCard
                        key={vendorId}
                        vendor={vendor}
                        isFavorite={favorites.includes(vendorId)}
                        onToggleFavorite={onToggleFavorite}
                        onView={(id) => {
                          setShowModal(false);
                          onViewVendor(id);
                        }}
                        onHighlight={onHighlightVendor}
                        showAnalyticsBadge={showAnalyticsBadge}
                        analyticsBadgeType={analyticsBadgeType}
                        onlineStatus={onlineStatuses[vendorId]}
                      />
                    );
                  })
                ) : (
                  <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#6b7280'
                  }}>
                    <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No vendors found</div>
                    <div style={{ fontSize: '0.9rem' }}>Try adjusting your filters or check back later</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VendorSection;
