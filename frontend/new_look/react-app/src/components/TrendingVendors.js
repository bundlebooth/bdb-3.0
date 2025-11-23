import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { getVendorCardSkeletonHTML } from '../utils/skeletons';

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
              <div dangerouslySetInnerHTML={{ __html: getVendorCardSkeletonHTML(4) }} />
            ) : (
              trendingVendors.slice(currentIndex, currentIndex + 4).map((vendor) => (
                <div 
                  key={vendor.VendorProfileID || vendor.id}
                  className="trending-vendor-card"
                  onClick={() => onViewVendor(vendor.VendorProfileID || vendor.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ position: 'relative', paddingTop: '66.67%', borderRadius: '8px', overflow: 'hidden' }}>
                    <img 
                      src={vendor.ProfileImageURL || vendor.profileImage || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
                      alt={vendor.BusinessName || vendor.name}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '0.75rem 0' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                      {vendor.BusinessName || vendor.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {vendor.PrimaryCategory || vendor.category}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrendingVendors;
