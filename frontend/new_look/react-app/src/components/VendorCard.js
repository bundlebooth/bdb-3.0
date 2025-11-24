import React, { memo } from 'react';
import { getCategoryIconHtml, mapTypeToCategory } from '../utils/helpers';

const VendorCard = memo(function VendorCard({ vendor, isFavorite, onToggleFavorite, onView, onHighlight }) {
  const vendorId = vendor.VendorProfileID || vendor.id;
  
  // Image URL resolution - EXACT match to original (line 24986-24997)
  const imageUrl = vendor.FeaturedImageURL || 
                   vendor.featuredImageURL ||
                   vendor.featuredImageUrl ||
                   vendor.FeaturedImageUrl ||
                   vendor.image || 
                   vendor.ImageURL ||
                   vendor.imageURL ||
                   vendor.imageUrl ||
                   vendor.ProfileImageURL ||
                   vendor.profileImage ||
                   vendor.featuredImage?.url || 
                   vendor.featuredImage?.thumbnailUrl || 
                   (vendor.images && vendor.images.length > 0 ? vendor.images[0].url : null) ||
                   'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
  
  // Premium status
  const isPremium = vendor.IsPremium || vendor.isPremium || false;
  
  // Price resolution
  const rawPrice = vendor.startingPrice ?? vendor.MinPriceNumeric ?? vendor.MinPrice ?? 
                   vendor.price ?? vendor.Price ?? vendor.minPrice ?? vendor.starting_price ?? 
                   vendor.HourlyRate ?? vendor.BasePrice;
  let hourlyRate = 0;
  if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
    if (typeof rawPrice === 'number') {
      hourlyRate = Math.round(rawPrice);
    } else if (typeof rawPrice === 'string') {
      const parsed = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) hourlyRate = Math.round(parsed);
    }
  }

  // Rating and reviews
  const rating = (() => {
    const r = parseFloat(vendor.averageRating ?? vendor.rating ?? vendor.AverageRating ?? 0);
    return isNaN(r) || r === 0 ? 0 : r;
  })();
  const reviewCount = vendor.totalReviews ?? vendor.reviewCount ?? vendor.TotalReviews ?? 0;
  
  // Location
  const locCity = vendor.City || vendor.city || '';
  const locState = vendor.State || vendor.state || '';
  const locationText = (vendor.location && vendor.location.trim()) || 
                       [locCity, locState].filter(Boolean).join(', ');
  
  // Response time
  const responseTime = vendor.ResponseTime || vendor.responseTime || 'within a few hours';
  
  // Category
  const primaryCategory = vendor.PrimaryCategory || vendor.primaryCategory || 
                         vendor.Category || vendor.category || '';
  const categoryKey = mapTypeToCategory(primaryCategory);
  const categoryIconHtml = getCategoryIconHtml(categoryKey);

  const handleCardClick = () => {
    if (onView) {
      onView(vendorId);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(vendorId);
    }
  };

  const handleMouseEnter = () => {
    if (onHighlight) {
      onHighlight(vendorId, true);
    }
  };

  const handleMouseLeave = () => {
    if (onHighlight) {
      onHighlight(vendorId, false);
    }
  };

  return (
    <div
      className="vendor-card"
      data-vendor-id={vendorId}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Image Container */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '66.67%', overflow: 'hidden', borderRadius: '12px' }}>
        <img
          src={imageUrl}
          alt={vendor.BusinessName || vendor.name}
          onError={(e) => {
            e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        {/* Guest Favorite Badge */}
        {isPremium && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'white',
            color: '#222222',
            padding: '6px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" style={{ 
              display: 'block', 
              height: '14px', 
              width: '14px', 
              fill: '#FF385C'
            }}>
              <path d="M8 12.5l-4.5 2.5 1-5L0 6l5-.5L8 1l3 4.5 5 .5-4.5 4 1 5z"/>
            </svg>
            Guest favorite
          </div>
        )}
        
        {/* Heart and Share Icons */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={handleFavoriteClick}
            className={isFavorite ? 'active' : ''}
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style={{ display: 'block', fill: isFavorite ? '#FF385C' : 'rgba(0,0,0,0.5)', height: '16px', width: '16px', stroke: 'currentColor', strokeWidth: 2, overflow: 'visible' }}>
              <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"></path>
            </svg>
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style={{ display: 'block', fill: 'none', height: '16px', width: '16px', stroke: 'currentColor', strokeWidth: 2, overflow: 'visible' }}>
              <g fill="none">
                <path d="M27 18v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9"></path>
                <polyline points="16 3 16 17"></polyline>
                <polyline points="22 10 16 3 10 10"></polyline>
              </g>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Card Content */}
      <div style={{ padding: '10px 0 4px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Title - Blue Link Style */}
        <div style={{ 
          fontSize: '15px', 
          color: '#0066CC', 
          lineHeight: '20px',
          fontWeight: 400
        }}>
          {vendor.BusinessName || vendor.name}
        </div>
        
        {/* Price, Rating, Response Time - ALL ON ONE LINE */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px', 
          fontSize: '14px',
          lineHeight: '18px',
          flexWrap: 'wrap'
        }}>
          {/* Price */}
          {hourlyRate > 0 && (
            <>
              <span style={{ fontWeight: 400, color: '#222222' }}>Starting from </span>
              <span style={{ fontWeight: 600, color: '#222222' }}>${hourlyRate}</span>
            </>
          )}
          
          {/* Separator */}
          {hourlyRate > 0 && (
            <span style={{ color: '#222222', margin: '0 2px' }}>·</span>
          )}
          
          {/* Rating with blue star - Use 5.0 as placeholder */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style={{ 
              display: 'block', 
              height: '12px', 
              width: '12px', 
              fill: '#0066CC'
            }}>
              <path fillRule="evenodd" d="M15.1 1.58l-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z"></path>
            </svg>
            <span style={{ fontWeight: 400, color: '#222222' }}>
              {rating > 0 ? rating.toFixed(2) : '5.0'}
            </span>
            {reviewCount > 0 && (
              <span style={{ color: '#222222' }}> ({reviewCount})</span>
            )}
          </span>
          
          {/* Separator */}
          <span style={{ color: '#222222', margin: '0 2px' }}>·</span>
          
          {/* Response Time - Blue */}
          {responseTime && (
            <span style={{ color: '#0066CC' }}>Responds {responseTime}</span>
          )}
          
          {/* Separator */}
          {isPremium && (
            <>
              <span style={{ color: '#222222', margin: '0 2px' }}>·</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" style={{ 
                display: 'block', 
                height: '14px', 
                width: '14px', 
                fill: '#222222'
              }}>
                <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z"/>
              </svg>
            </>
          )}
        </div>
        
        {/* Location - Black */}
        {locationText && (
          <div style={{ 
            fontSize: '14px', 
            color: '#222222',
            lineHeight: '18px'
          }}>
            {locationText}
          </div>
        )}
      </div>
    </div>
  );
});

export default VendorCard;
