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

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [vendors]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const cardWidth = 300;
      const gap = 16;
      const scrollAmount = (cardWidth + gap) * 4; // Scroll 4 cards at a time
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Get icon based on section title if not provided
  const getIcon = () => {
    if (icon) return icon;
    
    const titleLower = title.toLowerCase();
    if (titleLower.includes('trending')) return 'fa-fire';
    if (titleLower.includes('top rated') || titleLower.includes('rated')) return 'fa-star';
    if (titleLower.includes('responsive')) return 'fa-bolt';
    if (titleLower.includes('reviewed') || titleLower.includes('review')) return 'fa-comment-dots';
    if (titleLower.includes('near') || titleLower.includes('nearby')) return 'fa-location-dot';
    if (titleLower.includes('premium')) return 'fa-crown';
    if (titleLower.includes('booked') || titleLower.includes('popular')) return 'fa-heart';
    if (titleLower.includes('new') || titleLower.includes('added')) return 'fa-sparkles';
    if (titleLower.includes('recommended')) return 'fa-thumbs-up';
    return 'fa-store';
  };

  if (!vendors || vendors.length === 0) {
    return null;
  }

  return (
    <>
      <div className="vendor-section">
        <div className="vendor-section-header">
          <div className="vendor-section-title-wrapper">
            <h2 className="vendor-section-title">
              <i className={`fas ${getIcon()}`}></i>
              {title}
            </h2>
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
            {vendors.map((vendor) => {
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
                <i className={`fas ${getIcon()}`}></i>
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
