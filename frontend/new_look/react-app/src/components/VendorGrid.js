import React from 'react';
import VendorCard from './VendorCard';

function VendorGrid({ vendors, loading, favorites, onToggleFavorite, onViewVendor, onHighlightVendor }) {
  console.log('🎯 VendorGrid render - loading:', loading, 'vendors count:', vendors?.length);
  
  if (loading && (!vendors || vendors.length === 0)) {
    console.log('✅ VendorGrid: Showing skeleton cards NOW!');
    return (
      <div 
        className="vendor-grid" 
        id="vendor-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          padding: '1rem 0'
        }}
      >
        {Array(6).fill(0).map((_, index) => (
          <div 
            key={index} 
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'transparent',
              cursor: 'default'
            }}
          >
            {/* Image Container */}
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              paddingTop: '66.67%', 
              overflow: 'hidden', 
              borderRadius: '12px',
              background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-shimmer 1.5s infinite'
            }}></div>
            
            {/* Card Content */}
            <div style={{ padding: '10px 0 4px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Title line */}
              <div style={{
                height: '20px',
                width: '70%',
                background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.5s infinite',
                borderRadius: '4px'
              }}></div>
              
              {/* Price/Rating line */}
              <div style={{
                height: '18px',
                width: '100%',
                background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.5s infinite',
                borderRadius: '4px'
              }}></div>
              
              {/* Location line */}
              <div style={{
                height: '18px',
                width: '50%',
                background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.5s infinite',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!vendors || vendors.length === 0) {
    return (
      <div className="vendor-grid" id="vendor-grid">
        <div style={{ 
          gridColumn: '1 / -1', 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#6b7280' 
        }}>
          <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
          <h3 style={{ marginBottom: '0.5rem' }}>No vendors found</h3>
          <p>Try adjusting your filters or search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-grid" id="vendor-grid">
      {vendors.map((vendor) => {
        const vendorId = vendor.VendorProfileID || vendor.id;
        const isFavorite = favorites.includes(vendorId);
        
        return (
          <VendorCard
            key={vendorId}
            vendor={vendor}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            onView={onViewVendor}
            onHighlight={onHighlightVendor}
          />
        );
      })}
    </div>
  );
}

export default VendorGrid;
