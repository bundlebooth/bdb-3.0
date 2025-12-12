import React, { useEffect, useRef, useState, useCallback } from 'react';

function MapView({ vendors, onVendorSelect, selectedVendorId, loading = false, userLocation = null, onMapBoundsChange = null, searchOnDrag = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const markerClusterRef = useRef(null);
  const infoWindowRef = useRef(null);
  const userLocationMarkerRef = useRef(null); // Track user location marker
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userCity, setUserCity] = useState(''); // Store user's city name
  const [searchOnDragEnabled, setSearchOnDragEnabled] = useState(searchOnDrag);
  const isInitializingRef = useRef(false); // Prevent duplicate initialization
  const previousVendorsRef = useRef([]); // Track previous vendors to prevent unnecessary updates
  const dragTimeoutRef = useRef(null); // Debounce drag events
  const searchOnDragEnabledRef = useRef(searchOnDrag); // Ref to track current state for event listeners
  const onMapBoundsChangeRef = useRef(onMapBoundsChange); // Ref for callback

  // Helper function to create custom marker icon (grey by default, blue on hover/click)
  const createMarkerIcon = useCallback((color = '#9CA3AF', isHovered = false) => {
    // Small grey pin style matching Google Maps default
    const size = isHovered ? 28 : 20;
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
    // Image URL resolution - match VendorCard.js
    const imageUrl = vendor.LogoURL || 
                     vendor.FeaturedImageURL || 
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
    const businessName = vendor.BusinessName || vendor.name || 'Vendor';
    
    // Match the main vendor card style with proper image display - smaller size for map
    return `
      <div class="map-vendor-card" style="width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer;">
        <!-- Image Container with padding to create border effect -->
        <div style="padding: 2px 6px 0 6px;">
          <div style="position: relative; width: 100%; padding-top: 66.67%; overflow: hidden; border-radius: 6px;">
            <img 
              src="${imageUrl}" 
              alt="${businessName}"
              onerror="this.src='https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png';"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
            />
            
            ${isPremium ? `
            <div style="position: absolute; top: 8px; left: 8px; background: white; color: #222222; padding: 4px 8px; border-radius: 16px; font-size: 10px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 3px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" style="display: block; height: 11px; width: 11px; fill: #FF385C;">
                <path d="M8 12.5l-4.5 2.5 1-5L0 6l5-.5L8 1l3 4.5 5 .5-4.5 4 1 5z"/>
              </svg>
              Guest favorite
            </div>
            ` : ''}
            
            <!-- Heart and Share Icons -->
            <div style="position: absolute; top: 8px; right: 8px; display: flex; gap: 6px;">
              <button onclick="event.stopPropagation();" style="background: rgba(255,255,255,0.9); border: none; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.08);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="display: block; fill: none; height: 14px; width: 14px; stroke: rgba(0,0,0,0.5); stroke-width: 2; overflow: visible;">
                  <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"></path>
                </svg>
              </button>
              <button onclick="event.stopPropagation();" style="background: rgba(255,255,255,0.9); border: none; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.08);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="display: block; fill: none; height: 14px; width: 14px; stroke: rgba(0,0,0,0.5); stroke-width: 2; overflow: visible;">
                  <g fill="none">
                    <path d="M27 18v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9"></path>
                    <polyline points="16 3 16 17"></polyline>
                    <polyline points="22 10 16 3 10 10"></polyline>
                  </g>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Card Content -->
        <div style="padding: 10px; display: flex; flex-direction: column; gap: 3px;">
          <!-- Business Name - Blue Link Style -->
          <div style="font-size: 13px; color: #0066CC; line-height: 18px; font-weight: 400;">
            ${businessName}
          </div>
          
          <!-- Price, Rating, Response Time -->
          <div style="display: flex; align-items: center; gap: 3px; font-size: 12px; line-height: 16px; flex-wrap: wrap;">
            ${hourlyRate > 0 ? `
              <span style="font-weight: 400; color: #222222;">Starting from </span>
              <span style="font-weight: 600; color: #222222;">$${hourlyRate}</span>
              <span style="color: #222222; margin: 0 2px;">·</span>
            ` : ''}
            
            <!-- Rating with blue star -->
            <span style="display: flex; align-items: center; gap: 2px;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style="display: block; height: 11px; width: 11px; fill: #0066CC;">
                <path fill-rule="evenodd" d="M15.1 1.58l-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z"></path>
              </svg>
              <span style="font-weight: 400; color: #222222;">
                ${rating > 0 ? rating.toFixed(1) : '5.0'}
              </span>
              <span style="color: #222222;">
                ${reviewCount > 0 ? `(${reviewCount})` : '(0)'}
              </span>
            </span>
            
            <span style="color: #222222; margin: 0 2px;">·</span>
            
            <!-- Response Time - Blue -->
            <span style="color: #0066CC;">Responds ${responseTime}</span>
          </div>
          
          <!-- Location -->
          ${locationText ? `
          <div style="font-size: 12px; color: #222222; line-height: 16px;">
            ${locationText}
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }, []);

  const createLoadingSkeletonHTML = useCallback(() => {
    return `
      <div style="width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <!-- Image Skeleton -->
        <div style="position: relative; width: 100%; padding-top: 66.67%; overflow: hidden; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite;">
        </div>
        
        <!-- Content Skeleton -->
        <div style="padding: 10px; display: flex; flex-direction: column; gap: 6px;">
          <div style="height: 18px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; width: 70%;"></div>
          <div style="height: 16px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; width: 90%;"></div>
          <div style="height: 16px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; width: 50%;"></div>
        </div>
        
        <style>
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        </style>
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

    // Center on vendors if available, otherwise use a generic US center
    let mapCenter = { lat: 39.8283, lng: -98.5795 }; // Geographic center of US
    let mapZoom = 4; // Zoomed out to show whole US
    
    // If we have vendors, center on them
    if (vendors && vendors.length > 0) {
      const validVendors = vendors.filter(v => v.Latitude && v.Longitude);
      if (validVendors.length > 0) {
        // Calculate center of all vendors
        const avgLat = validVendors.reduce((sum, v) => sum + parseFloat(v.Latitude), 0) / validVendors.length;
        const avgLng = validVendors.reduce((sum, v) => sum + parseFloat(v.Longitude), 0) / validVendors.length;
        mapCenter = { lat: avgLat, lng: avgLng };
        mapZoom = validVendors.length === 1 ? 13 : 10; // Closer zoom if we have vendors
      }
    }

    console.log('Creating Google Map instance...');
    const map = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      mapTypeControl: false, // Remove Map/Satellite toggle
      streetViewControl: false,
      fullscreenControl: false, // Remove fullscreen button
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER
      },
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

    // Helper function to trigger bounds change callback
    const triggerBoundsChange = () => {
      console.log('🗺️ triggerBoundsChange called, searchOnDragEnabled:', searchOnDragEnabledRef.current);
      if (searchOnDragEnabledRef.current && onMapBoundsChangeRef.current) {
        // Debounce the search to avoid too many API calls
        if (dragTimeoutRef.current) {
          clearTimeout(dragTimeoutRef.current);
        }
        dragTimeoutRef.current = setTimeout(() => {
          const bounds = map.getBounds();
          const center = map.getCenter();
          if (bounds && center) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            console.log('🗺️ Calling onMapBoundsChange with center:', center.lat(), center.lng());
            onMapBoundsChangeRef.current({
              center: { lat: center.lat(), lng: center.lng() },
              bounds: {
                north: ne.lat(),
                south: sw.lat(),
                east: ne.lng(),
                west: sw.lng()
              },
              zoom: map.getZoom()
            });
          }
        }, 2500); // 2500ms debounce - wait for user to stop dragging
      }
    };

    // Add dragend listener for "search as you drag" functionality
    map.addListener('dragend', () => {
      console.log('🗺️ Map dragend event fired');
      triggerBoundsChange();
    });

    // Add zoom_changed listener for scroll/zoom events
    map.addListener('zoom_changed', () => {
      console.log('🗺️ Map zoom_changed event fired');
      triggerBoundsChange();
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
      
      // Create grey marker by default (smaller size)
      const greyIcon = createMarkerIcon('#9CA3AF', false);
      const blueIcon = createMarkerIcon('#5E72E4', true);
      
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: vendor.BusinessName || vendor.name,
        animation: window.google.maps.Animation.DROP,
        icon: {
          url: greyIcon,
          scaledSize: new window.google.maps.Size(20, 30),
          anchor: new window.google.maps.Point(10, 30)
        }
      });
      
      // Add hover effect - turn blue on mouseover
      marker.addListener('mouseover', () => {
        marker.setIcon({
          url: blueIcon,
          scaledSize: new window.google.maps.Size(28, 42),
          anchor: new window.google.maps.Point(14, 42)
        });
      });
      
      // Return to grey on mouseout (unless InfoWindow is open)
      marker.addListener('mouseout', () => {
        if (!infoWindowRef.current || infoWindowRef.current.anchor !== marker) {
          marker.setIcon({
            url: greyIcon,
            scaledSize: new window.google.maps.Size(20, 30),
            anchor: new window.google.maps.Point(10, 30)
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
              scaledSize: new window.google.maps.Size(20, 30),
              anchor: new window.google.maps.Point(10, 30)
            });
          }
        });
        
        // Keep clicked marker blue
        marker.setIcon({
          url: blueIcon,
          scaledSize: new window.google.maps.Size(28, 42),
          anchor: new window.google.maps.Point(14, 42)
        });
        
        // Close existing InfoWindow if any
        if (infoWindowRef.current) {
          console.log('Closing existing InfoWindow');
          infoWindowRef.current.close();
        }
        
        console.log('Creating InfoWindow with loading skeleton...');
        
        // Show loading skeleton first
        const loadingHTML = createLoadingSkeletonHTML();
        const infoWindow = new window.google.maps.InfoWindow({
          content: loadingHTML,
          maxWidth: 240
        });
        
        try {
          infoWindow.open(mapInstanceRef.current, marker);
          infoWindowRef.current = infoWindow;
          console.log('✅ Loading skeleton displayed');
          
          // After a brief delay, replace with actual card content
          setTimeout(() => {
            const cardHTML = createMiniVendorCardHTML(vendor);
            infoWindow.setContent(cardHTML);
            console.log('✅ Actual card content loaded');
          }, 300);
        } catch (error) {
          console.error('Error opening InfoWindow:', error);
        }
        
        // Listen for close events
        window.google.maps.event.addListener(infoWindow, 'closeclick', () => {
          console.log('❌ InfoWindow closed via closeclick event');
          marker.setIcon({
            url: greyIcon,
            scaledSize: new window.google.maps.Size(20, 30),
            anchor: new window.google.maps.Point(10, 30)
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
          
          // Style InfoWindow containers
          const iwContainer = document.querySelector('.gm-style-iw-c');
          if (iwContainer) {
            iwContainer.style.padding = '0';
            iwContainer.style.borderRadius = '12px';
            iwContainer.style.overflow = 'hidden';
          }
          
          const iwContent = document.querySelector('.gm-style-iw-d');
          if (iwContent) {
            iwContent.style.overflow = 'hidden';
            iwContent.style.padding = '0';
          }
          
          // Click on card to navigate to vendor profile page
          const cardDiv = document.querySelector('.map-vendor-card');
          if (cardDiv) {
            cardDiv.addEventListener('click', () => {
              console.log('Card clicked, navigating to vendor profile');
              const vendorId = marker.vendorId;
              // Navigate to vendor profile page
              window.location.href = `/vendor/${vendorId}`;
            });
          }
        });
      });

      markersRef.current.push(marker);
      bounds.extend(position);
      hasValidMarkers = true;
    });

    console.log('📍 Total markers added:', markersRef.current.length);
    console.log('📍 Marker vendor IDs:', markersRef.current.map(m => m.vendorId));

    // Show city-level view instead of zooming to individual vendors
    // This keeps the map at a city overview level
    if (hasValidMarkers) {
      // If we have user location, center on that city
      if (userLocation && userLocation.lat && userLocation.lng) {
        mapInstanceRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
        mapInstanceRef.current.setZoom(11); // City-level zoom
        console.log('📍 Map centered on user city location');
      } else {
        // Otherwise center on vendors but keep city-level zoom
        const center = bounds.getCenter();
        mapInstanceRef.current.setCenter(center);
        mapInstanceRef.current.setZoom(11); // City-level zoom, don't zoom in on vendors
        console.log('📍 Map centered on vendor area at city level');
      }
    } else {
      console.log('⚠️ No valid markers to display');
    }

    // No clustering - show all individual pins like Google Maps default
    // Clustering disabled to match the desired pin style
  }, [vendors, onVendorSelect, createMiniVendorCardHTML, createMarkerIcon, userLocation]);

  // Update user location marker - DISABLED per user request
  // User does not want the blue marker showing their current position
  const updateUserLocationMarker = useCallback(async () => {
    // Remove existing user location marker if any
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null);
      userLocationMarkerRef.current = null;
    }
    
    // Do NOT create a marker - user requested no blue location marker
    // Just return without doing anything
  }, []);

  const highlightMarker = useCallback((vendorId, shouldAnimate = false) => {
    const greyIcon = createMarkerIcon('#9CA3AF', false);
    const blueIcon = createMarkerIcon('#5E72E4', true);
    
    markersRef.current.forEach(marker => {
      if (marker.vendorId === vendorId) {
        marker.setIcon({
          url: blueIcon,
          scaledSize: new window.google.maps.Size(28, 42),
          anchor: new window.google.maps.Point(14, 42)
        });
        // Only animate if explicitly requested (e.g., when clicking from list)
        if (shouldAnimate) {
          marker.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => marker.setAnimation(null), 2000);
        }
      } else {
        marker.setIcon({
          url: greyIcon,
          scaledSize: new window.google.maps.Size(20, 30),
          anchor: new window.google.maps.Point(10, 30)
        });
      }
    });
  }, [createMarkerIcon]);

  // Keep refs in sync with state/props for event listeners (fixes closure issue)
  useEffect(() => {
    searchOnDragEnabledRef.current = searchOnDragEnabled;
    console.log('🗺️ searchOnDragEnabled state changed to:', searchOnDragEnabled);
  }, [searchOnDragEnabled]);

  useEffect(() => {
    onMapBoundsChangeRef.current = onMapBoundsChange;
  }, [onMapBoundsChange]);

  // Initialize map ONCE on mount
  useEffect(() => {
    if (!mapInstanceRef.current) {
      initializeMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when vendors change
  useEffect(() => {
    if (!mapLoaded || vendors.length === 0) return;
    
    // Check if vendors actually changed to prevent unnecessary updates
    const vendorsChanged = vendors.length !== previousVendorsRef.current.length ||
      vendors.some((v, i) => {
        const prev = previousVendorsRef.current[i];
        return !prev || (v.VendorProfileID || v.id) !== (prev.VendorProfileID || prev.id);
      });
    
    // Also update if we have vendors but no markers (initial load case)
    const needsInitialMarkers = vendors.length > 0 && markersRef.current.length === 0;
    
    if (vendorsChanged || needsInitialMarkers) {
      previousVendorsRef.current = vendors;
      updateMarkers();
    }
  }, [vendors, mapLoaded, updateMarkers]);

  useEffect(() => {
    if (mapLoaded && selectedVendorId) {
      highlightMarker(selectedVendorId, true); // Animate when selected from map
    }
  }, [selectedVendorId, mapLoaded, highlightMarker]);

  // Update user location marker when userLocation changes
  useEffect(() => {
    if (mapLoaded && userLocation) {
      updateUserLocationMarker();
    }
  }, [userLocation, mapLoaded, updateUserLocationMarker]);

  // Expose highlight function globally for card hover
  // Use a registry pattern to support multiple MapView instances (desktop + mobile)
  useEffect(() => {
    if (!window._mapViewInstances) {
      window._mapViewInstances = [];
    }
    
    const instanceId = Math.random().toString(36).substr(2, 9);
    const instance = {
      id: instanceId,
      markersRef: markersRef,
      createMarkerIcon: createMarkerIcon
    };
    
    window._mapViewInstances.push(instance);
    
    // Global function that updates markers on ALL map instances
    window.highlightMapMarker = (vendorId, highlight) => {
      if (!window.google) return;
      
      window._mapViewInstances.forEach((inst) => {
        const markers = inst.markersRef?.current;
        if (!markers || markers.length === 0) return;
        
        const greyIcon = inst.createMarkerIcon('#9CA3AF', false);
        const blueIcon = inst.createMarkerIcon('#5E72E4', true);
        
        if (highlight) {
          markers.forEach(marker => {
            if (String(marker.vendorId) === String(vendorId)) {
              marker.setIcon({
                url: blueIcon,
                scaledSize: new window.google.maps.Size(28, 42),
                anchor: new window.google.maps.Point(14, 42)
              });
            } else {
              marker.setIcon({
                url: greyIcon,
                scaledSize: new window.google.maps.Size(20, 30),
                anchor: new window.google.maps.Point(10, 30)
              });
            }
          });
        } else {
          markers.forEach(marker => {
            marker.setIcon({
              url: greyIcon,
              scaledSize: new window.google.maps.Size(20, 30),
              anchor: new window.google.maps.Point(10, 30)
            });
          });
        }
      });
    };

    return () => {
      if (window._mapViewInstances) {
        window._mapViewInstances = window._mapViewInstances.filter(inst => inst.id !== instanceId);
      }
      if (window._mapViewInstances?.length === 0) {
        delete window.highlightMapMarker;
        delete window._mapViewInstances;
      }
    };
  }, [createMarkerIcon]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px' }}>
      {/* Search as you drag toggle */}
      {onMapBoundsChange && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'white',
          borderRadius: '24px',
          padding: '8px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 500
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={searchOnDragEnabled}
              onChange={(e) => setSearchOnDragEnabled(e.target.checked)}
              style={{ 
                width: '18px', 
                height: '18px', 
                accentColor: '#5e72e4',
                cursor: 'pointer'
              }}
            />
            <span style={{ color: '#222' }}>Search as I move the map</span>
          </label>
        </div>
      )}
      
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
                margin: '0 auto'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;
