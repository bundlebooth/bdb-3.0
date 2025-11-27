import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
// Removed skeleton import - using simple loading state
import VendorCard from './VendorCard';

function TrendingVendors({ onViewVendor }) {
  const [trendingVendors, setTrendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = React.useRef(null);

  useEffect(() => {
    loadTrendingVendors();
  }, []);

  const loadTrendingVendors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/trending`);
      if (response.ok) {
        const data = await response.json();
        setTrendingVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Failed to load trending vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  if (!loading && trendingVendors.length === 0) {
    return null;
  }

  return (
    <div id="trending-vendors-section-main" style={{ marginBottom: '3rem', paddingTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 
          style={{ 
            color: '#222222', 
            margin: '0', 
            fontSize: '1.375rem', 
            fontWeight: 600,
            letterSpacing: '-0.01em'
          }}
        >
          Trending Vendors
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={handlePrev}
            aria-label="Previous vendors"
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid #DDDDDD',
              borderRadius: '50%',
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              padding: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <i className="fas fa-chevron-left" style={{ fontSize: '0.75rem', color: '#222222' }}></i>
          </button>
          <button 
            onClick={handleNext}
            aria-label="Next vendors"
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid #DDDDDD',
              borderRadius: '50%',
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              padding: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem', color: '#222222' }}></i>
          </button>
        </div>
      </div>
      <div style={{ position: 'relative', margin: '0 -24px' }}>
        <div 
          ref={carouselRef}
          style={{ 
            display: 'flex',
            gap: '16px',
            overflowX: 'scroll',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            padding: '0 24px'
          }}
        >
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} style={{ 
                flex: '0 0 auto',
                width: '260px',
                background: '#f8f9fa', 
                borderRadius: '12px', 
                padding: '1rem', 
                height: '320px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6c757d'
              }}>
                <i className="fas fa-spinner fa-spin"></i>
                <span style={{ marginLeft: '0.5rem' }}>Loading...</span>
              </div>
            ))
          ) : (
            trendingVendors.map((vendor) => (
              <div key={vendor.VendorProfileID || vendor.id} style={{ flex: '0 0 auto', width: '260px' }}>
                <VendorCard
                  vendor={vendor}
                  isFavorite={false}
                  onToggleFavorite={() => {}}
                  onView={onViewVendor}
                  onHighlight={() => {}}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TrendingVendors;
