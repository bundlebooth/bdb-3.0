import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const LocationMapPanel = () => {
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'vendors', 'users'
  const [stats, setStats] = useState({ totalVendors: 0, totalUsers: 0, totalLocations: 0 });
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    fetchLocations();
    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.log('Google Maps API key not configured');
      return;
    }
    
    if (window.google && window.google.maps) {
      setMapReady(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  };

  useEffect(() => {
    if (mapReady && mapContainerRef.current && !loading) {
      initializeMap();
    }
  }, [mapReady, loading, viewMode]);

  const initializeMap = () => {
    if (!window.google || !mapContainerRef.current) return;
    
    const allLocations = getVisibleLocations();
    const center = allLocations.length > 0 
      ? { lat: allLocations[0].lat, lng: allLocations[0].lng }
      : { lat: 43.6532, lng: -79.3832 }; // Toronto default
    
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 10,
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
      });
    }
    
    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    
    // Add new markers
    const bounds = new window.google.maps.LatLngBounds();
    
    allLocations.forEach(loc => {
      const marker = new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: mapInstanceRef.current,
        title: loc.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: loc.type === 'vendor' ? '#2563eb' : '#10b981',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2
        }
      });
      
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 180px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${loc.name}</div>
            <div style="font-size: 12px; color: #6b7280;">${loc.type === 'vendor' ? 'Vendor' : 'User'}</div>
            <div style="font-size: 13px; margin-top: 8px;">${loc.email}</div>
            ${loc.category ? `<div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">${loc.category}</div>` : ''}
          </div>
        `
      });
      
      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });
      
      markersRef.current.push(marker);
      bounds.extend({ lat: loc.lat, lng: loc.lng });
    });
    
    if (allLocations.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      const vendorsResponse = await fetch(`${API_BASE_URL}/admin/vendors?page=1&limit=500`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const usersResponse = await fetch(`${API_BASE_URL}/admin/users?page=1&limit=500`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      let vendorData = [];
      let userData = [];

      if (vendorsResponse.ok) {
        const data = await vendorsResponse.json();
        vendorData = (data.vendors || []);
      }

      if (usersResponse.ok) {
        const data = await usersResponse.json();
        userData = (data.users || []);
      }

      setVendors(vendorData);
      setUsers(userData);
      
      const vendorsWithLoc = vendorData.filter(v => v.Latitude && v.Longitude).length;
      const usersWithLoc = userData.filter(u => u.Latitude && u.Longitude).length;
      
      setStats({
        totalVendors: vendorsWithLoc,
        totalUsers: usersWithLoc,
        totalLocations: vendorsWithLoc + usersWithLoc
      });
    } catch (error) {
      console.error('Error fetching locations:', error);
      showBanner('Failed to load location data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getVisibleLocations = () => {
    let locations = [];
    
    if (viewMode === 'all' || viewMode === 'vendors') {
      locations = [...locations, ...vendors
        .filter(v => v.Latitude && v.Longitude)
        .map(v => ({
          type: 'vendor',
          id: `vendor-${v.VendorProfileID}`,
          lat: parseFloat(v.Latitude),
          lng: parseFloat(v.Longitude),
          name: v.BusinessName || 'Unknown Vendor',
          email: v.Email || '',
          category: v.Category || ''
        }))];
    }
    
    if (viewMode === 'all' || viewMode === 'users') {
      locations = [...locations, ...users
        .filter(u => u.Latitude && u.Longitude)
        .map(u => ({
          type: 'user',
          id: `user-${u.UserID}`,
          lat: parseFloat(u.Latitude),
          lng: parseFloat(u.Longitude),
          name: `${u.FirstName || ''} ${u.LastName || ''}`.trim() || 'Unknown User',
          email: u.Email || ''
        }))];
    }
    
    return locations.filter(m => !isNaN(m.lat) && !isNaN(m.lng));
  };

  const focusOnLocation = (lat, lng) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat, lng });
      mapInstanceRef.current.setZoom(15);
    }
  };

  return (
    <div className="admin-panel location-map-panel">
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-store" style={{ color: '#2563eb', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{stats.totalVendors}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Vendors with Location</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-users" style={{ color: '#10b981', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{stats.totalUsers}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Users with Location</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-map-marker-alt" style={{ color: '#f59e0b', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{stats.totalLocations}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Locations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'all', label: 'All Locations', icon: 'fa-globe' },
          { key: 'vendors', label: 'Vendors Only', icon: 'fa-store' },
          { key: 'users', label: 'Users Only', icon: 'fa-users' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            style={{
              padding: '10px 20px',
              background: viewMode === tab.key ? '#5e72e4' : '#f3f4f6',
              color: viewMode === tab.key ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
        <button
          onClick={fetchLocations}
          style={{
            marginLeft: 'auto',
            padding: '10px 20px',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      {/* Map Container */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#2563eb' }}></div>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Vendors</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#10b981' }}></div>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Users/Clients</span>
          </div>
        </div>

        {loading ? (
          <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <p style={{ color: '#6b7280' }}>Loading location data...</p>
            </div>
          </div>
        ) : !mapReady ? (
          <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <i className="fas fa-map" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px', display: 'block' }}></i>
              <h3 style={{ color: '#374151', marginBottom: '8px' }}>Google Maps</h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Add REACT_APP_GOOGLE_MAPS_API_KEY to .env to enable map view</p>
            </div>
          </div>
        ) : getVisibleLocations().length === 0 ? (
          <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <i className="fas fa-map-marker-alt" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px', display: 'block' }}></i>
              <h3 style={{ color: '#374151', marginBottom: '8px' }}>No Locations Found</h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Vendors and users with location data will appear on this map</p>
            </div>
          </div>
        ) : (
          <div 
            ref={mapContainerRef} 
            style={{ width: '100%', height: '500px', borderRadius: '12px' }}
          />
        )}
      </div>

      {/* Location List */}
      <div style={{ marginTop: '24px', background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          <i className="fas fa-list" style={{ color: '#5e72e4', marginRight: '8px' }}></i>
          Location Directory
        </h3>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Category</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getVisibleLocations().slice(0, 20).map(marker => (
                <tr key={marker.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: marker.type === 'vendor' ? '#dbeafe' : '#d1fae5',
                      color: marker.type === 'vendor' ? '#2563eb' : '#10b981',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      <i className={`fas ${marker.type === 'vendor' ? 'fa-store' : 'fa-user'}`}></i>
                      {marker.type === 'vendor' ? 'Vendor' : 'User'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500' }}>{marker.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{marker.email}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{marker.category || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => focusOnLocation(marker.lat, marker.lng)}
                      style={{
                        padding: '6px 12px',
                        background: '#5e72e4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <i className="fas fa-map-marker-alt"></i> View on Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LocationMapPanel;
