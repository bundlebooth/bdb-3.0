import React, { useState, useEffect, useCallback, useRef } from 'react';

function VendorGallery({ images, onBack, onShare, onFavorite, isFavorite }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const carouselRef = useRef(null);

  // Check for mobile on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const validImages = images && images.length > 0 
    ? images.filter(img => img && (img.url || img.URL || img.ImageURL))
    : [];

  // Swipe handlers for mobile carousel
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < validImages.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const getImageUrl = (img) => {
    return img.url || img.URL || img.ImageURL || '';
  };

  const mainImage = validImages[currentIndex];
  const thumbnails = validImages.slice(0, 5);

  const handleThumbnailClick = (index) => {
    setCurrentIndex(index);
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const nextLightboxImage = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prevLightboxImage = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  // Keyboard navigation for lightbox - must be before any conditional returns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextLightboxImage();
      if (e.key === 'ArrowLeft') prevLightboxImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, closeLightbox, nextLightboxImage, prevLightboxImage]);

  // Prevent background scrolling when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [lightboxOpen]);

  // Create placeholder images if no images available
  const placeholderImages = validImages.length === 0 ? 
    Array(5).fill(null).map((_, index) => ({
      url: 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png',
      isPlaceholder: true
    })) : validImages;

  const displayImages = validImages.length === 0 ? placeholderImages : validImages;

  // Mobile Airbnb-style carousel with overlays
  if (isMobile) {
    return (
      <>
        <div 
          className="mobile-gallery-container"
          style={{
            position: 'relative',
            width: '100vw',
            marginLeft: 'calc(-50vw + 50%)',
            aspectRatio: '4 / 3',
            backgroundColor: '#f3f4f6',
            overflow: 'hidden'
          }}
          ref={carouselRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Swipeable Image */}
          <div
            style={{
              display: 'flex',
              width: `${displayImages.length * 100}%`,
              height: '100%',
              transform: `translateX(-${currentIndex * (100 / displayImages.length)}%)`,
              transition: 'transform 0.3s ease-out'
            }}
          >
            {displayImages.map((img, idx) => (
              <div
                key={idx}
                style={{
                  width: `${100 / displayImages.length}%`,
                  height: '100%',
                  flexShrink: 0
                }}
                onClick={() => validImages.length > 0 ? openLightbox(idx) : null}
              >
                <img
                  src={getImageUrl(img)}
                  alt={`Image ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top Navigation Overlay - Back, Share, Favorite */}
          <div
            className="mobile-gallery-top-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 2,
              pointerEvents: 'none'
            }}
          >
            {/* Back Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onBack) onBack();
                else window.history.back();
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                pointerEvents: 'auto'
              }}
            >
              <i className="fas fa-arrow-left"></i>
            </button>

            {/* Right Actions - Share & Favorite */}
            <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onShare) onShare();
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '14px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <i className="fas fa-share-alt"></i>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onFavorite) onFavorite();
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isFavorite ? '#e31c5f' : 'white',
                  fontSize: '14px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
              </button>
            </div>
          </div>

          {/* Bottom-Right Image Counter - positioned above where panel overlaps */}
          {validImages.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '32px',
                right: '16px',
                padding: '6px 10px',
                fontSize: '12px',
                color: 'white',
                background: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '6px',
                zIndex: 2,
                fontWeight: 500
              }}
            >
              {currentIndex + 1} / {validImages.length}
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <div
            id="lightbox-modal"
            style={{
              display: 'flex',
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.95)',
              zIndex: 9999,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#f3f4f6',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                prevLightboxImage();
              }}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextLightboxImage();
              }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>

            <img
              src={getImageUrl(validImages[lightboxIndex])}
              alt="Lightbox"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain'
              }}
            />

            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                fontSize: '1rem',
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '0.5rem 1rem',
                borderRadius: '20px'
              }}
            >
              {lightboxIndex + 1} / {validImages.length}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop gallery (original layout)
  return (
    <>
      <div 
        className="image-gallery" 
        id="image-gallery"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          width: '100%',
          maxWidth: '1120px',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Large Image (Left Side) */}
        <div 
          className="gallery-item large-image" 
          onClick={() => validImages.length > 0 ? openLightbox(0) : null}
          style={{ 
            cursor: validImages.length > 0 ? 'pointer' : 'default',
            borderRadius: '12px 0 0 12px',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '1 / 1'
          }}
        >
          <img
            src={getImageUrl(displayImages[0])}
            alt="Main"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '16px 0 0 16px'
            }}
            onError={(e) => {
              e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
            }}
          />
        </div>

        {/* Thumbnails Grid (Right Side) - 2x2 Grid */}
        <div className="thumbnails-container">
          {[1, 2, 3, 4].map((index) => {
            // Border radius only on outer corners
            const getBorderRadius = (idx) => {
              if (idx === 2) return '0 16px 0 0'; // top-right
              if (idx === 4) return '0 0 16px 0'; // bottom-right
              return '0';
            };
            const radius = getBorderRadius(index);
            return (
            <div
              key={index}
              className="gallery-item"
              onClick={() => validImages.length > index ? openLightbox(index) : null}
              style={{ 
                cursor: validImages.length > index ? 'pointer' : 'default',
                position: 'relative',
                borderRadius: radius,
                overflow: 'hidden'
              }}
            >
              {displayImages[index] ? (
                <>
                  <img
                    src={getImageUrl(displayImages[index])}
                    alt={`Image ${index + 1}`}
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: radius
                    }}
                    onError={(e) => {
                      e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
                    }}
                  />
                  {/* Show "Show all photos" overlay on last thumbnail if more images exist */}
                  {index === 4 && validImages.length > 5 && (
                    <div className="see-all-overlay">
                      <i className="fas fa-th"></i> Show all photos
                    </div>
                  )}
                </>
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fas fa-image" style={{ color: '#d1d5db', fontSize: '2rem' }}></i>
                </div>
              )}
            </div>
            );
          })}
        </div>

        {/* Show All Photos Button - Airbnb style */}
        {validImages.length > 1 && (
          <button 
            className="show-all-photos-btn"
            onClick={() => openLightbox(0)}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 15px',
              background: 'white',
              border: '1px solid #222',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#222',
              cursor: 'pointer'
            }}
          >
            <svg viewBox="0 0 16 16" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
              <circle cx="3" cy="3" r="1.5"/>
              <circle cx="8" cy="3" r="1.5"/>
              <circle cx="13" cy="3" r="1.5"/>
              <circle cx="3" cy="8" r="1.5"/>
              <circle cx="8" cy="8" r="1.5"/>
              <circle cx="13" cy="8" r="1.5"/>
              <circle cx="3" cy="13" r="1.5"/>
              <circle cx="8" cy="13" r="1.5"/>
              <circle cx="13" cy="13" r="1.5"/>
            </svg>
            Show all photos
          </button>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          id="lightbox-modal"
          style={{
            display: 'flex',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={closeLightbox}
        >
          <button
            id="lightbox-close"
            className="modal-close-btn"
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: '#f3f4f6',
              width: '36px',
              height: '36px'
            }}
          >
            ×
          </button>

          <button
            id="lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              prevLightboxImage();
            }}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <button
            id="lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              nextLightboxImage();
            }}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <i className="fas fa-chevron-right"></i>
          </button>

          <img
            id="lightbox-image"
            src={getImageUrl(validImages[lightboxIndex])}
            alt="Lightbox"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain'
            }}
          />

          <div
            id="lightbox-counter"
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '1rem',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)'
            }}
          >
            {lightboxIndex + 1} / {validImages.length}
          </div>
        </div>
      )}
    </>
  );
}

export default VendorGallery;
