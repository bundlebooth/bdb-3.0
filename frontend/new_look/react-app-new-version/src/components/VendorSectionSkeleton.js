import React, { useState, useEffect, useRef } from 'react';
import '../styles/VendorSection.css';

/**
 * VendorSectionSkeleton Component
 * Loading skeleton for VendorSection while data is being fetched
 */
function VendorSectionSkeleton() {
  const containerRef = useRef(null);
  const [cardCount, setCardCount] = useState(4);

  useEffect(() => {
    const calculateCardCount = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const cardWidth = 250; // Match actual card width
      const gap = 16; // Match actual gap
      const count = Math.floor(containerWidth / (cardWidth + gap));
      setCardCount(Math.max(1, Math.min(count, 8))); // Between 1 and 8 cards
    };

    calculateCardCount();
    window.addEventListener('resize', calculateCardCount);
    return () => window.removeEventListener('resize', calculateCardCount);
  }, []);

  return (
    <div className="vendor-section" ref={containerRef}>
      <div className="vendor-section-header">
        <div className="vendor-section-title-wrapper">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Title skeleton */}
            <div className="skeleton" style={{ 
              height: '32px', 
              width: '200px', 
              borderRadius: '8px' 
            }}></div>
            {/* Description skeleton */}
            <div className="skeleton" style={{ 
              height: '20px', 
              width: '300px', 
              borderRadius: '6px' 
            }}></div>
          </div>
        </div>
        <div className="vendor-section-controls">
          {/* Show all button skeleton */}
          <div className="skeleton" style={{ 
            height: '36px', 
            width: '120px', 
            borderRadius: '8px' 
          }}></div>
          {/* Nav buttons skeleton */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ 
              height: '36px', 
              width: '36px', 
              borderRadius: '50%' 
            }}></div>
            <div className="skeleton" style={{ 
              height: '36px', 
              width: '36px', 
              borderRadius: '50%' 
            }}></div>
          </div>
        </div>
      </div>
    
      <div className="vendor-section-scroll-container">
        <div className="vendor-section-grid">
          {/* Show only full cards that fit in the container */}
          {Array.from({ length: cardCount }, (_, i) => i + 1).map((i) => (
            <div key={i} className="vendor-section-card-wrapper">
              <div style={{
                backgroundColor: 'transparent',
                overflow: 'hidden'
              }}>
                {/* Image skeleton - rectangular aspect ratio */}
                <div className="skeleton" style={{ 
                  height: '180px', 
                  width: '100%',
                  borderRadius: '12px',
                  marginBottom: '12px'
                }}></div>
                
                {/* Text lines below image */}
                <div style={{ padding: '0' }}>
                  {/* First line - wider */}
                  <div className="skeleton" style={{ 
                    height: '16px', 
                    width: '85%', 
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}></div>
                  
                  {/* Second line - medium */}
                  <div className="skeleton" style={{ 
                    height: '16px', 
                    width: '65%', 
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}></div>
                  
                  {/* Third line - shorter */}
                  <div className="skeleton" style={{ 
                    height: '16px', 
                    width: '45%', 
                    borderRadius: '8px'
                  }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VendorSectionSkeleton;
