import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getVendorBadges } from '../utils/helpers';

function MapView({ vendors, onVendorSelect, selectedVendorId, loading = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const markerClusterRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const isInitializingRef = useRef(false); // Prevent duplicate initialization
  const previousVendorsRef = useRef([]); // Track previous vendors to prevent unnecessary updates

  // Helper function to create custom marker icon (grey by default, blue on hover/click)
  const createMarkerIcon = useCallback((color = '#6B7280', isHovered = false) => {
    // EXACT Airbnb style - simple round pin with pointed bottom
    const size = isHovered ? 32 : 28;
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 27 43" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" fill-rule="evenodd">
          <path d="M13.5 0C6.044 0 0 6.044 0 13.5c0 1.45.228 2.853.65 4.165C2.723 25.45 13.5 43 13.5 43s10.777-17.55 12.85-25.335c.422-1.312.65-2.715.65-4.165C27 6.044 20.956 0 13.5 0z" 
                fill="${color}"/>
          <ellipse fill="#FFFFFF" cx="13.5" cy="13.5" rx="5.5" ry="5.5"/>
        </g>
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }, []);

  const createMiniVendorCardHTML = useCallback((vendor) => {
    const imageUrl = vendor.FeaturedImageURL || vendor.featuredImageURL || 
                     vendor.image || vendor.ImageURL || 
                     'https://via.placeholder.com/400x300/f5f5f5/999999?text=No+Image';
    
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
    const businessName = vendor.BusinessName || vendor.name || 'Vendor';
    
    // Get vendor badges
    const badges = getVendorBadges(vendor);
    const topBadges = badges.slice(0, 2); // Show max 2 badges
    
    // SMALL card, smaller image with border, left-aligned text, heart icon
    return `
      <div style="width: 180px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <div style="padding: 4px 8px 8px 8px; background: white;">
          <div style="position: relative; width: 100%; height: 100px; background-image: url('${imageUrl}'); background-size: cover; background-position: center center; background-repeat: no-repeat; background-color: #f5f5f5; border-radius: 6px;">
            <div style="position: absolute; top: 6px; right: 6px;">
              <div style="background: rgba(255,255,255,0.9); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="display: block; fill: none; height: 12px; width: 12px; stroke: #222; stroke-width: 2;">
                  <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div style="padding: 0 10px 10px 10px; text-align: left;">
          <div style="font-size: 12px; color: #222; font-weight: 600; margin-bottom: 2px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${businessName}
          </div>
          <div style="font-size: 13px; color: #222; font-weight: 700; margin-bottom: 1px;">
            $${hourlyRate > 0 ? hourlyRate.toLocaleString() : '1,000'}<span style="font-weight: 400; font-size: 11px;">/hr</span>
          </div>
          <div style="font-size: 10px; color: #717171;">
            ${responseTime}
          </div>
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
    console.log('🗺️ createMap called');
    console.log('mapRef.current:', mapRef.current);
    console.log('window.google:', window.google);
    
    if (!mapRef.current) {
      console.error('❌ mapRef.current is null!');
      return;
    }

    // Default center (can be updated based on user location)
    const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // New York

    console.log('Creating Google Map instance...');
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

    console.log('✅ Google Maps initialized successfully');
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
      
      // Create grey marker by default
      const greyIcon = createMarkerIcon('#6B7280', false);
      const blueIcon = createMarkerIcon('#5E72E4', true);
      
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: vendor.BusinessName || vendor.name,
        animation: window.google.maps.Animation.DROP,
        icon: {
          url: greyIcon,
          scaledSize: new window.google.maps.Size(28, 43),
          anchor: new window.google.maps.Point(14, 43)
        }
      });
      
      // Add hover effect - turn blue on mouseover
      marker.addListener('mouseover', () => {
        marker.setIcon({
          url: blueIcon,
          scaledSize: new window.google.maps.Size(32, 48),
          anchor: new window.google.maps.Point(16, 48)
        });
      });
      
      // Return to grey on mouseout (unless InfoWindow is open)
      marker.addListener('mouseout', () => {
        if (!infoWindowRef.current || infoWindowRef.current.anchor !== marker) {
          marker.setIcon({
            url: greyIcon,
            scaledSize: new window.google.maps.Size(28, 43),
            anchor: new window.google.maps.Point(14, 43)
          });
        }
      });

      // Store vendor ID and data with marker
      marker.vendorId = vendor.VendorProfileID || vendor.id;
      marker.vendorData = vendor;

      // Add click listener to show InfoWindow with mini vendor card
      marker.addListener('click', () => {
        console.log('🔵 MARKER CLICKED:', vendor.BusinessName || vendor.name);
        
        // Reset all markers to grey
        markersRef.current.forEach(m => {
          if (m !== marker) {
            m.setIcon({
              url: greyIcon,
              scaledSize: new window.google.maps.Size(28, 43),
              anchor: new window.google.maps.Point(14, 43)
            });
          }
        });
        
        // Keep clicked marker blue
        marker.setIcon({
          url: blueIcon,
          scaledSize: new window.google.maps.Size(32, 48),
          anchor: new window.google.maps.Point(16, 48)
        });
        
        // Close existing InfoWindow if any
        if (infoWindowRef.current) {
          console.log('Closing existing InfoWindow');
          infoWindowRef.current.close();
        }
        
        console.log('Creating InfoWindow...');
        
        // Create Airbnb-style vendor card
        const cardHTML = createMiniVendorCardHTML(vendor);
        console.log('Card HTML created, length:', cardHTML.length);
        
        // Create new InfoWindow with vendor card
        const infoWindow = new window.google.maps.InfoWindow({
          content: cardHTML,
          maxWidth: 200
        });
        
        console.log('Opening InfoWindow...');
        
        try {
          infoWindow.open(mapInstanceRef.current, marker);
          infoWindowRef.current = infoWindow;
          console.log('✅ InfoWindow opened successfully');
        } catch (error) {
          console.error('Error opening InfoWindow:', error);
        }
        
        // Listen for close events to debug
        window.google.maps.event.addListener(infoWindow, 'closeclick', () => {
          console.log('❌ InfoWindow closed via closeclick event');
          marker.setIcon({
            url: greyIcon,
            scaledSize: new window.google.maps.Size(28, 43),
            anchor: new window.google.maps.Point(14, 43)
          });
        });
        
        // Style and add interactions when DOM is ready
        window.google.maps.event.addListener(infoWindow, 'domready', () => {
          console.log('✅ InfoWindow DOM ready');
          
          // HIDE Google's default close button
          const closeButton = document.querySelector('button[title="Close"]');
          if (closeButton) {
            closeButton.style.display = 'none';
          }
          
          // Style ALL InfoWindow containers to CENTER content
          const iwContainer = document.querySelector('.gm-style-iw-c');
          if (iwContainer) {
            iwContainer.style.padding = '0';
            iwContainer.style.borderRadius = '8px';
            iwContainer.style.overflow = 'hidden';
            iwContainer.style.textAlign = 'center';
            iwContainer.style.display = 'flex';
            iwContainer.style.justifyContent = 'center';
            iwContainer.style.alignItems = 'center';
          }
          
          // Fix the inner content container
          const iwContent = document.querySelector('.gm-style-iw-d');
          if (iwContent) {
            iwContent.style.overflow = 'hidden';
            iwContent.style.textAlign = 'center';
            iwContent.style.display = 'flex';
            iwContent.style.justifyContent = 'center';
            iwContent.style.alignItems = 'center';
          }
          
          // Click on card to open vendor profile
          const cardDiv = document.querySelector('.gm-style-iw-c > div');
          if (cardDiv && onVendorSelect) {
            cardDiv.style.cursor = 'pointer';
            cardDiv.addEventListener('click', () => {
              console.log('Card clicked, opening vendor profile');
              onVendorSelect(marker.vendorId);
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
  }, [vendors, onVendorSelect, createMiniVendorCardHTML, createMarkerIcon]);

  const highlightMarker = useCallback((vendorId) => {
    const greyIcon = createMarkerIcon('#6B7280', false);
    const blueIcon = createMarkerIcon('#5E72E4', true);
    
    markersRef.current.forEach(marker => {
      if (marker.vendorId === vendorId) {
        marker.setIcon({
          url: blueIcon,
          scaledSize: new window.google.maps.Size(32, 48),
          anchor: new window.google.maps.Point(16, 48)
        });
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 2000);
      } else {
        marker.setIcon({
          url: greyIcon,
          scaledSize: new window.google.maps.Size(28, 43),
          anchor: new window.google.maps.Point(14, 43)
        });
      }
    });
  }, [createMarkerIcon]);

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
        // Reset all markers to grey
        const greyIcon = createMarkerIcon('#6B7280', false);
        markersRef.current.forEach(marker => {
          marker.setIcon({
            url: greyIcon,
            scaledSize: new window.google.maps.Size(28, 43),
            anchor: new window.google.maps.Point(14, 43)
          });
        });
      }
    };

    return () => {
      delete window.highlightMapMarker;
    };
  }, [highlightMarker, createMarkerIcon]);

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
