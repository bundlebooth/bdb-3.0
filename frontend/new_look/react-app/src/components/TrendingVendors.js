import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
// Removed skeleton import - using simple loading state
import VendorCard from './VendorCard';

function TrendingVendors({ onViewVendor }) {
  const [trendingVendors, setTrendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

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
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(trendingVendors.length - 4, prev + 1));
  };

  if (!loading && trendingVendors.length === 0) {
    return null;
  }

  return (
    <div id="trending-vendors-section-main" style={{ display: 'block', marginBottom: '2rem' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
        <h3 
          id="trending-header-main" 
          style={{ 
            color: '#1a202c', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            margin: '0 0 1.5rem 0', 
            fontSize: '1.25rem', 
            fontWeight: 700 
          }}
        >
          <i className="fas fa-fire" style={{ color: '#ff6b6b' }}></i>
          Trending Right Now
          <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 400, marginLeft: 'auto' }}>
            Most Viewed This Month
          </span>
        </h3>
        <div id="trending-vendors-carousel-wrapper-main" style={{ position: 'relative' }}>
          <button 
            className="trending-carousel-nav trending-carousel-prev" 
            id="trending-prev-main"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous vendor"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button 
            className="trending-carousel-nav trending-carousel-next" 
            id="trending-next-main"
            onClick={handleNext}
            disabled={currentIndex >= trendingVendors.length - 4}
            aria-label="Next vendor"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          <div 
            id="trending-vendors-carousel-main" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
              gap: '1.25rem',
              transition: 'transform 0.3s ease'
            }}
            data-skeleton={loading ? "1" : "0"}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} style={{ 
                  background: '#f8f9fa', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  height: '300px',
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
              trendingVendors.slice(currentIndex, currentIndex + 4).map((vendor) => (
                <VendorCard
                  key={vendor.VendorProfileID || vendor.id}
                  vendor={vendor}
                  isFavorite={false}
                  onToggleFavorite={() => {}}
                  onView={onViewVendor}
                  onHighlight={() => {}}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrendingVendors;
