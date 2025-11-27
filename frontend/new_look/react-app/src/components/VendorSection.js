import React, { useRef, useState, useEffect } from 'react';
import VendorCard from './VendorCard';
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
  icon = null 
}) {
  const scrollContainerRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  const calculateVisibleCount = () => {
    if (!scrollContainerRef.current) return 3;
    const containerWidth = scrollContainerRef.current.offsetWidth;
    const cardWidth = 260;
    const gap = 16;
    // Be more conservative - subtract extra margin to ensure no overflow
    const availableWidth = containerWidth - 40; // Extra safety margin
    const count = Math.floor(availableWidth / (cardWidth + gap));
    return Math.max(1, Math.min(count, 6)); // Cap at 6 cards max
  };

  const checkScrollButtons = () => {
    const maxIndex = Math.max(0, vendors.length - visibleCount);
    setCanScrollLeft(currentIndex > 0);
    setCanScrollRight(currentIndex < maxIndex);
  };

  useEffect(() => {
    const updateLayout = () => {
      const count = calculateVisibleCount();
      setVisibleCount(count);
      checkScrollButtons();
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => {
      window.removeEventListener('resize', updateLayout);
    };
  }, [vendors, currentIndex, visibleCount]);

  const scroll = (direction) => {
    const scrollAmount = Math.floor(visibleCount / 2) || 1; // Scroll half of visible cards
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

  if (!vendors || vendors.length === 0) {
    return null;
  }

  return (
    <>
      <div className="vendor-section">
        <div className="vendor-section-header">
          <div className="vendor-section-title-wrapper">
            <h2 className="vendor-section-title">
              <span className="vendor-section-icon" style={{ backgroundColor: `${iconConfig.color}15`, color: iconConfig.color }}>
                <i className={`fas ${iconConfig.icon}`}></i>
              </span>
              {title}
            </h2>
            {description && (
              <p className="vendor-section-description">{description}</p>
            )}
          </div>
          <div className="vendor-section-controls">
            <button 
              className="vendor-section-show-all"
              onClick={() => setShowModal(true)}
            >
              Show all ({vendors.length})
            </button>
            <div className="vendor-section-nav">
              <button 
                className="vendor-section-nav-btn vendor-section-nav-btn-left"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                className="vendor-section-nav-btn vendor-section-nav-btn-right"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      
        <div className="vendor-section-scroll-container" ref={scrollContainerRef}>
          <div className="vendor-section-grid">
            {vendors.slice(currentIndex, currentIndex + visibleCount).map((vendor) => {
              const vendorId = vendor.vendorProfileId || vendor.VendorProfileID || vendor.id;
              return (
                <div key={vendorId} className="vendor-section-card-wrapper">
                  <VendorCard
                    vendor={vendor}
                    isFavorite={favorites.includes(vendorId)}
                    onToggleFavorite={onToggleFavorite}
                    onView={onViewVendor}
                    onHighlight={onHighlightVendor}
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
                {vendors.map((vendor) => {
                  const vendorId = vendor.vendorProfileId || vendor.VendorProfileID || vendor.id;
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
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VendorSection;
