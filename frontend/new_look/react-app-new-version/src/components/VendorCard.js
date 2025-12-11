import React, { memo } from 'react';
import { getCategoryIconHtml, mapTypeToCategory } from '../utils/helpers';
import { buildVendorProfileUrl } from '../utils/urlHelpers';

const VendorCard = memo(function VendorCard({ vendor, isFavorite, onToggleFavorite, onView, onHighlight, showViewCount, showResponseTime, showAnalyticsBadge, analyticsBadgeType }) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const vendorId = vendor.VendorProfileID || vendor.id;
  
  // Build array of all available images for carousel
  const getAllImages = () => {
    const images = [];
    
    // Add featured image first
    if (vendor.featuredImage?.url) images.push(vendor.featuredImage.url);
    else if (vendor.featuredImage?.optimizedUrl) images.push(vendor.featuredImage.optimizedUrl);
    else if (vendor.FeaturedImageURL) images.push(vendor.FeaturedImageURL);
    else if (vendor.featuredImageURL) images.push(vendor.featuredImageURL);
    
    // Add images from images array
    if (vendor.images && Array.isArray(vendor.images)) {
      vendor.images.forEach(img => {
        const url = img.url || img.optimizedUrl || img.thumbnailUrl || img.ImageURL;
        if (url && !images.includes(url)) images.push(url);
      });
    }
    
    // Add other image fields if not already included
    const otherImages = [
      vendor.image,
      vendor.ImageURL,
      vendor.imageURL,
      vendor.imageUrl,
      vendor.ProfileImageURL,
      vendor.profileImage
    ].filter(Boolean);
    
    otherImages.forEach(url => {
      if (!images.includes(url)) images.push(url);
    });
    
    // Return at least placeholder if no images
    return images.length > 0 ? images : ['https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'];
  };
  
  const allImages = getAllImages();
  const hasMultipleImages = allImages.length > 1;
  
  // Image URL resolution - use current index from carousel
  const imageUrl = allImages[currentImageIndex] || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
  
  // Logo URL resolution
  const logoUrl = vendor.LogoURL || 
                  vendor.logoURL ||
                  vendor.logoUrl ||
                  vendor.logo ||
                  vendor.Logo ||
                  null;
  
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

  // Rating and reviews - prioritize in-app reviews, fallback to Google reviews
  const inAppRating = (() => {
    const r = parseFloat(vendor.averageRating ?? vendor.rating ?? vendor.AverageRating ?? 0);
    return isNaN(r) || r === 0 ? 0 : r;
  })();
  const inAppReviewCount = vendor.totalReviews ?? vendor.reviewCount ?? vendor.TotalReviews ?? 0;
  
  // Google reviews fallback
  const googleRating = (() => {
    const r = parseFloat(vendor.GoogleRating ?? vendor.googleRating ?? 0);
    return isNaN(r) || r === 0 ? 0 : r;
  })();
  const googleReviewCount = vendor.GoogleReviewCount ?? vendor.googleReviewCount ?? 0;
  
  // Use Google reviews if no in-app reviews
  const rating = inAppReviewCount > 0 ? inAppRating : googleRating;
  const reviewCount = inAppReviewCount > 0 ? inAppReviewCount : googleReviewCount;
  const isGoogleReview = inAppReviewCount === 0 && googleReviewCount > 0;
  
  // Location
  const locCity = vendor.City || vendor.city || '';
  const locState = vendor.State || vendor.state || '';
  const locationText = (vendor.location && vendor.location.trim()) || 
                       [locCity, locState].filter(Boolean).join(', ');
  
  // Response time - only show if explicitly passed showResponseTime prop
  const responseTime = vendor.ResponseTime || vendor.responseTime || null;
  
  // Analytics data for discovery sections
  const viewCount = vendor.viewCount || 0;
  const avgResponseMinutes = vendor.avgResponseMinutes || 0;
  
  // Category
  const primaryCategory = vendor.PrimaryCategory || vendor.primaryCategory || 
                         vendor.Category || vendor.category || '';
  const categoryKey = mapTypeToCategory(primaryCategory);
  const categoryIconHtml = getCategoryIconHtml(categoryKey);

  const handleCardClick = () => {
    // Build professional URL with slug and tracking parameters
    const url = buildVendorProfileUrl(vendor, {
      source: 'search',
      category: primaryCategory,
      previousSection: '1000' // Similar to Airbnb's tracking
    });
    
    // Always open vendor profile in new tab
    window.open(url, '_blank');
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(vendorId);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onHighlight) {
      onHighlight(vendorId, true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
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
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        border: 'none',
        outline: 'none',
        boxShadow: 'none'
      }}
    >
      {/* Image Container - Square aspect ratio like Airbnb */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', borderRadius: '12px' }}>
        <img
          src={imageUrl}
          alt={vendor.BusinessName || vendor.name}
          onError={(e) => {
            e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          className="vendor-card-image"
        />
        
        {/* Image Navigation Arrows - Only show on hover and if multiple images */}
        {hasMultipleImages && isHovered && (
          <>
            {/* Left Arrow */}
            {currentImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(prev => prev - 1);
                }}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(-50%)'; }}
              >
                <svg viewBox="0 0 16 16" style={{ width: '10px', height: '10px', fill: '#222' }}>
                  <path d="M10.5 13.5L5 8l5.5-5.5" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            
            {/* Right Arrow */}
            {currentImageIndex < allImages.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(prev => prev + 1);
                }}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(-50%)'; }}
              >
                <svg viewBox="0 0 16 16" style={{ width: '10px', height: '10px', fill: '#222' }}>
                  <path d="M5.5 2.5L11 8l-5.5 5.5" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </>
        )}
        
        {/* Image Dots Indicator */}
        {hasMultipleImages && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            zIndex: 5
          }}>
            {allImages.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: idx === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                  transition: 'background 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              />
            ))}
            {allImages.length > 5 && (
              <div style={{ color: 'white', fontSize: '8px', marginLeft: '2px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>+{allImages.length - 5}</div>
            )}
          </div>
        )}
        
        {/* Hover Darkening Overlay */}
        <div 
          className="vendor-card-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0)',
            transition: 'background-color 0.3s ease',
            pointerEvents: 'none',
            zIndex: 1
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
        {/* Title - Blue Link Style with Logo */}
        <div style={{ 
          fontSize: '15px', 
          color: '#0066CC', 
          lineHeight: '20px',
          fontWeight: 400,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {logoUrl && (
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid #E5E7EB',
              background: '#FFFFFF'
            }}>
              <img 
                src={logoUrl} 
                alt={`${vendor.BusinessName || vendor.name} logo`}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}
          <span 
            className="vendor-card-business-name"
            style={{ 
              flex: 1, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              transition: 'text-decoration 0.2s ease'
            }}
          >
            {vendor.BusinessName || vendor.name}
          </span>
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
              {rating > 0 ? rating.toFixed(1) : '5.0'}
            </span>
            <span style={{ color: '#222222' }}>
              {reviewCount > 0 ? ` (${reviewCount})` : ' (0)'}
            </span>
          </span>
          
          {/* Separator */}
          <span style={{ color: '#222222', margin: '0 2px' }}>·</span>
          
          {/* Response Time - Only show if showResponseTime is true AND we have response time data */}
          {showResponseTime && responseTime && (
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
        
        {/* Analytics badge for discovery sections - shows section-specific metric */}
        {showAnalyticsBadge && vendor.analyticsBadge && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            fontSize: '12px',
            color: analyticsBadgeType === 'response' ? '#00A699' : 
                   analyticsBadgeType === 'rating' ? '#FFB400' :
                   analyticsBadgeType === 'bookings' ? '#EC4899' :
                   analyticsBadgeType === 'distance' ? '#8B5CF6' :
                   analyticsBadgeType === 'reviews' ? '#5E72E4' : '#FF385C',
            marginTop: '4px',
            fontWeight: 500
          }}>
            <i className={`fas ${
              analyticsBadgeType === 'response' ? 'fa-bolt' :
              analyticsBadgeType === 'rating' ? 'fa-star' :
              analyticsBadgeType === 'bookings' ? 'fa-calendar-check' :
              analyticsBadgeType === 'distance' ? 'fa-location-dot' :
              analyticsBadgeType === 'reviews' ? 'fa-comment-dots' : 'fa-fire'
            }`} style={{ fontSize: '11px' }}></i>
            <span>{vendor.analyticsBadge}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default VendorCard;
