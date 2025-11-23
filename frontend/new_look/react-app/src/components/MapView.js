import React, { useEffect, useRef, useState, useCallback } from 'react';

function MapView({ vendors, onVendorSelect, selectedVendorId }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const markerClusterRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const updateVendorsInViewport = useCallback(() => {
    if (!mapInstanceRef.current) return;

    const bounds = mapInstanceRef.current.getBounds();
    if (!bounds) return;

    const vendorsInView = vendors.filter(vendor => {
      const lat = parseFloat(vendor.Latitude);
      const lng = parseFloat(vendor.Longitude);
      
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
    if (!window.google || !window.google.maps) {
      console.log('Waiting for Google Maps to load...');
      // Wait for Google Maps to be loaded from CDN
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          createMap();
        }
      }, 100);
      return;
    }
    
    createMap();
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
      const lat = parseFloat(vendor.Latitude);
      const lng = parseFloat(vendor.Longitude);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.log('⚠️ Invalid coordinates for vendor:', vendor.BusinessName, lat, lng);
        return;
      }

      console.log('✅ Adding marker for:', vendor.BusinessName, 'at', lat, lng);

      const position = { lat, lng };
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: vendor.BusinessName || vendor.name,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#5e72e4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Store vendor ID with marker
      marker.vendorId = vendor.VendorProfileID || vendor.id;

      // Add click listener
      marker.addListener('click', () => {
        if (onVendorSelect) {
          onVendorSelect(marker.vendorId);
        }
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
  }, [vendors, onVendorSelect]);

  const highlightMarker = useCallback((vendorId) => {
    markersRef.current.forEach(marker => {
      if (marker.vendorId === vendorId) {
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#ff385c',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        });
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 2000);
      } else {
        marker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#5e72e4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        });
      }
    });
  }, []);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  useEffect(() => {
    if (mapLoaded && vendors.length > 0) {
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
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#5e72e4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          });
        });
      }
    };

    return () => {
      delete window.highlightMapMarker;
    };
  }, [highlightMarker]);

  return (
    <div 
      ref={mapRef} 
      id="map-view" 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '500px'
      }}
    />
  );
}

export default MapView;
