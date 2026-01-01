import React, { useState, useEffect, useCallback } from 'react';

function VendorGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const validImages = images && images.length > 0 
    ? images.filter(img => img && (img.url || img.URL || img.ImageURL))
    : [];

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

  return (
    <>
      <div className="image-gallery" id="image-gallery">
        {/* Large Image (Left Side) */}
        <div 
          className="gallery-item large-image" 
          onClick={() => validImages.length > 0 ? openLightbox(0) : null}
          style={{ 
            cursor: validImages.length > 0 ? 'pointer' : 'default',
            borderRadius: '16px 0 0 16px',
            overflow: 'hidden'
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

        {/* Show All Photos Button */}
        {validImages.length > 1 && (
          <button 
            className="show-all-photos-btn"
            onClick={() => openLightbox(0)}
          >
            <i className="fas fa-th"></i> Show all photos
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
