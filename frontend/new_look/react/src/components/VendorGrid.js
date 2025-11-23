import React from 'react';
import VendorCard from './VendorCard';
import { getVendorCardSkeletonHTML } from '../utils/skeletons';

function VendorGrid({ vendors, loading, favorites, onToggleFavorite, onViewVendor, onHighlightVendor }) {
  if (loading) {
    return (
      <div 
        className="vendor-grid skeleton-active" 
        id="vendor-grid" 
        data-skeleton="1"
        dangerouslySetInnerHTML={{ __html: getVendorCardSkeletonHTML(6) }}
      />
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
