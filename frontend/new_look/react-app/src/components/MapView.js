import React, { useEffect, useRef, useState, useCallback } from 'react';

function MapView({ vendors, onVendorSelect, selectedVendorId, loading = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const markerClusterRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const isInitializingRef = useRef(false); // Prevent duplicate initialization
  const previousVendorsRef = useRef([]); // Track previous vendors to prevent unnecessary updates

  const createMiniVendorCardHTML = useCallback((vendor) => {
    const imageUrl = vendor.FeaturedImageURL || vendor.featuredImageURL || 
                     vendor.image || vendor.ImageURL || 
                     'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';
    
    const rawPrice = vendor.startingPrice ?? vendor.MinPriceNumeric ?? vendor.MinPrice ?? 
                     vendor.price ?? vendor.Price ?? vendor.HourlyRate ?? vendor.BasePrice;
    let hourlyRate = 0;
    if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
      if (typeof rawPrice === 'number') {
        hourlyRate = Math.round(rawPrice);
      } else if (typeof rawPrice === 'string') {
        const parsed = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsed)) hourlyRate = Math.round(parsed);
      }
    }
    
    const rating = parseFloat(vendor.averageRating ?? vendor.rating ?? vendor.AverageRating ?? 0) || 5.0;
    const reviewCount = vendor.totalReviews ?? vendor.reviewCount ?? vendor.TotalReviews ?? 0;
    const locationText = [vendor.City || vendor.city, vendor.State || vendor.state].filter(Boolean).join(', ');
    const responseTime = vendor.ResponseTime || vendor.responseTime || 'within a few hours';
    
    return `
      <div style="width: 280px; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="position: relative; width: 100%; padding-top: 66.67%; overflow: hidden; border-radius: 12px; margin-bottom: 8px;">
          <img src="${imageUrl}" alt="${vendor.BusinessName || vendor.name}" 
               style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" />
        </div>
        <div style="padding: 4px 0;">
          <div style="font-size: 14px; color: #0066CC; line-height: 18px; font-weight: 400; margin-bottom: 4px;">
            ${vendor.BusinessName || vendor.name}
          </div>
          <div style="display: flex; align-items: center; gap: 4px; font-size: 13px; line-height: 16px; flex-wrap: wrap; margin-bottom: 4px;">
            ${hourlyRate > 0 ? `<span style="font-weight: 400; color: #222222;">Starting from </span><span style="font-weight: 600; color: #222222;">$${hourlyRate}</span><span style="color: #222222; margin: 0 2px;">·</span>` : ''}
            <span style="display: flex; align-items: center; gap: 2px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="display: block; height: 11px; width: 11px; fill: #0066CC;">
                <path fill-rule="evenodd" d="M15.1 1.58l-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z"></path>
              </svg>
              <span style="font-weight: 400; color: #222222;">${rating.toFixed(2)}</span>
              ${reviewCount > 0 ? `<span style="color: #222222;"> (${reviewCount})</span>` : ''}
            </span>
            <span style="color: #222222; margin: 0 2px;">·</span>
            <span style="color: #0066CC;">Responds ${responseTime}</span>
          </div>
          ${locationText ? `<div style="font-size: 13px; color: #222222; line-height: 16px;">${locationText}</div>` : ''}
        </div>
      </div>
    `;
  }, []);

  const updateVendorsInViewport = useCallback(() => {
    if (!mapInstanceRef.current) return;

    const bounds = mapInstanceRef.current.getBounds();
    if (!bounds) return;

    const vendorsInView = vendors.filter(vendor => {
      const lat = parseFloat(vendor.Latitude || vendor.latitude || vendor.lat);
      const lng = parseFloat(vendor.Longitude || vendor.longitude || vendor.lng || vendor.lon);
      
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        return false;
      }

      const position = new window.google.maps.LatLng(lat, lng);
      return bounds.contains(position);
    });

    console.log(`${vendorsInView.length} vendors in viewport`);
  }, [vendors]);

  const createMap = useCallback(() => {
    if (!mapRef.current) return;

    // Default center (can be updated based on user location)
    const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // New York

    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 11,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Add bounds changed listener for viewport tracking
    map.addListener('bounds_changed', () => {
      updateVendorsInViewport();
    });

    console.log('Google Maps initialized');
  }, [updateVendorsInViewport]);

  const initializeMap = useCallback(async () => {
    // Prevent duplicate initialization
    if (isInitializingRef.current || mapInstanceRef.current) {
      return;
    }
    
    isInitializingRef.current = true;
    
    if (!window.google || !window.google.maps) {
      console.log('Waiting for Google Maps to load...');
      // Wait for Google Maps to be loaded from CDN
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          createMap();
          isInitializingRef.current = false;
        }
      }, 100);
      return;
    }
    
    createMap();
    isInitializingRef.current = false;
  }, [createMap]);

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) {
      console.log('Map not ready for markers');
      return;
    }

    console.log('🗺️ Updating markers for', vendors.length, 'vendors');

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Clear cluster if exists
    if (markerClusterRef.current) {
      markerClusterRef.current.clearMarkers();
    }

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidMarkers = false;

    // Create markers for each vendor
    vendors.forEach(vendor => {
      // Try multiple field name variations for coordinates
      const lat = parseFloat(vendor.Latitude || vendor.latitude || vendor.lat);
      const lng = parseFloat(vendor.Longitude || vendor.longitude || vendor.lng || vendor.lon);

      // Only check if coordinates exist and are valid numbers
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.log('⚠️ No valid coordinates for vendor:', vendor.BusinessName || vendor.name, 'lat:', lat, 'lng:', lng);
        return;
      }

      console.log('✅ Adding marker for:', vendor.BusinessName || vendor.name, 'at', lat, lng);

      const position = { lat, lng };
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: vendor.BusinessName || vendor.name,
        animation: window.google.maps.Animation.DROP,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        }
      });

      // Store vendor ID and data with marker
      marker.vendorId = vendor.VendorProfileID || vendor.id;
      marker.vendorData = vendor;

      // Add click listener to show InfoWindow with mini vendor card
      marker.addListener('click', () => {
        // Close existing InfoWindow if any
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
        
        // Create new InfoWindow with mini vendor card
        const infoWindow = new window.google.maps.InfoWindow({
          content: createMiniVendorCardHTML(vendor),
          maxWidth: 300
        });
        
        infoWindow.open(mapInstanceRef.current, marker);
        infoWindowRef.current = infoWindow;
        
        // Add click listener to InfoWindow content to open full profile
        window.google.maps.event.addListener(infoWindow, 'domready', () => {
          const content = document.querySelector('.gm-style-iw-c');
          if (content) {
            content.style.cursor = 'pointer';
            content.addEventListener('click', () => {
              if (onVendorSelect) {
                onVendorSelect(marker.vendorId);
              }
            });
          }
        });
      });

      markersRef.current.push(marker);
      bounds.extend(position);
      hasValidMarkers = true;
    });

    console.log('📍 Total markers added:', markersRef.current.length);

    // Fit map to markers
    if (hasValidMarkers) {
      mapInstanceRef.current.fitBounds(bounds);
      
      // Prevent too much zoom
      const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current.getZoom() > 15) {
          mapInstanceRef.current.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    } else {
      console.log('⚠️ No valid markers to display');
    }

    // Initialize marker clusterer if available
    if (window.markerClusterer && window.markerClusterer.MarkerClusterer) {
      markerClusterRef.current = new window.markerClusterer.MarkerClusterer({
        map: mapInstanceRef.current,
        markers: markersRef.current
      });
    }
  }, [vendors, onVendorSelect, createMiniVendorCardHTML]);

  const highlightMarker = useCallback((vendorId) => {
    markersRef.current.forEach(marker => {
      if (marker.vendorId === vendorId) {
        marker.setIcon({
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(50, 50)
        });
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 2000);
      } else {
        marker.setIcon({
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        });
      }
    });
  }, []);

  // Initialize map ONCE on mount
  useEffect(() => {
    if (!mapInstanceRef.current) {
      initializeMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when vendors change
  useEffect(() => {
    if (!mapLoaded || vendors.length === 0) {
      return;
    }
    
    // Check if vendors actually changed to prevent unnecessary updates
    const vendorsChanged = vendors.length !== previousVendorsRef.current.length ||
      vendors.some((v, i) => {
        const prev = previousVendorsRef.current[i];
        return !prev || (v.VendorProfileID || v.id) !== (prev.VendorProfileID || prev.id);
      });
    
    if (vendorsChanged) {
      previousVendorsRef.current = vendors;
      updateMarkers();
    }
  }, [vendors, mapLoaded, updateMarkers]);

  useEffect(() => {
    if (mapLoaded && selectedVendorId) {
      highlightMarker(selectedVendorId);
    }
  }, [selectedVendorId, mapLoaded, highlightMarker]);

  // Expose highlight function globally for card hover
  useEffect(() => {
    window.highlightMapMarker = (vendorId, highlight) => {
      if (highlight) {
        highlightMarker(vendorId);
      } else {
        // Reset all markers to default
        markersRef.current.forEach(marker => {
          marker.setIcon({
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(40, 40)
          });
        });
      }
    };

    return () => {
      delete window.highlightMapMarker;
    };
  }, [highlightMarker]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px' }}>
      {/* Map container - always rendered */}
      <div 
        ref={mapRef} 
        id="map-view" 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '500px',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
      />
      
      {/* Loading overlay */}
      {loading && (
        <div 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f9fafb',
            borderRadius: '12px',
            zIndex: 10
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid #e5e7eb',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px'
              }}
            />
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#6b7280' }}>
              Loading map...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;
