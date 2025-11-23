import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';
import CategoriesNav from '../components/CategoriesNav';
import FilterSidebar from '../components/FilterSidebar';
import VendorGrid from '../components/VendorGrid';
import TrendingVendors from '../components/TrendingVendors';
import MapView from '../components/MapView';
import ProfileModal from '../components/ProfileModal';
import DashboardModal from '../components/DashboardModal';
import { showBanner } from '../utils/helpers';

function IndexPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mapActive, setMapActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPageNumber, setServerPageNumber] = useState(1);
  const [serverTotalCount, setServerTotalCount] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState('dashboard');
  
  const vendorsPerPage = 12;
  const serverPageSize = 20;

  const [filters, setFilters] = useState({
    location: '',
    useCurrentLocation: false,
    within50Miles: false,
    priceLevel: '',
    minRating: '',
    region: '',
    tags: []
  });

  const loadFavorites = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, [currentUser]);

  const tryGetUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Geolocation error:', error)
      );
    }
  }, []);

  const loadVendors = useCallback(async (append = false) => {
    try {
      if (!append) setLoading(true);
      const params = new URLSearchParams();
      const nextPage = append ? serverPageNumber + 1 : 1;
      params.set('pageNumber', String(nextPage));
      params.set('pageSize', String(serverPageSize));
      if (userLocation) {
        params.set('latitude', String(userLocation.lat));
        params.set('longitude', String(userLocation.lng));
        params.set('radiusMiles', '50');
      }
      if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
      if (filters.priceLevel) params.set('priceLevel', filters.priceLevel);
      if (filters.minRating) params.set('minRating', filters.minRating);
      if (filters.region) params.set('region', filters.region);
      if (filters.tags.includes('premium')) params.set('isPremium', 'true');
      if (filters.tags.includes('eco-friendly')) params.set('isEcoFriendly', 'true');
      if (filters.tags.includes('award-winning')) params.set('isAwardWinning', 'true');
      if (filters.tags.includes('certified')) params.set('isCertified', 'true');
      if (filters.tags.includes('insured')) params.set('isInsured', 'true');
      if (filters.tags.includes('local')) params.set('isLocal', 'true');
      if (filters.tags.includes('mobile')) params.set('isMobile', 'true');
      const url = `${API_BASE_URL}/vendors?${params.toString()}`;
      console.log('🔍 Fetching vendors from:', url);
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      console.log('📦 Received data:', data);
      const newVendors = data.vendors || [];
      const totalCount = data.totalCount || newVendors.length;
      console.log('✅ Vendors loaded:', newVendors.length, 'Total count:', totalCount);
      if (append) {
        setVendors(prev => [...prev, ...newVendors]);
      } else {
        setVendors(newVendors);
      }
      setServerPageNumber(nextPage);
      setServerTotalCount(totalCount);
    } catch (error) {
      console.error('❌ Error loading vendors:', error);
      showBanner('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentCategory, filters.priceLevel, filters.minRating, filters.region, filters.tags, userLocation, serverPageNumber]);

  const initializePage = useCallback(async () => {
    tryGetUserLocation();
    if (currentUser) {
      loadFavorites();
    }
    await loadVendors();
  }, [tryGetUserLocation, currentUser, loadFavorites, loadVendors]);

  const applyFilters = useCallback(() => {
    console.log('🔧 Applying filters. Vendors count:', vendors.length);
    let filtered = [...vendors];
    if (filters.location && !userLocation) {
      const searchTerm = filters.location.toLowerCase();
      filtered = filtered.filter(vendor => {
        const location = `${vendor.City || ''} ${vendor.State || ''}`.toLowerCase();
        return location.includes(searchTerm);
      });
    }
    console.log('✨ Filtered vendors count:', filtered.length);
    setFilteredVendors(filtered);
  }, [filters, vendors, userLocation]);

  useEffect(() => {
    initializePage();
  }, [initializePage]);

  // Listen for dashboard open events from ProfileModal
  useEffect(() => {
    const handleOpenDashboard = () => {
      setProfileModalOpen(false);
      setDashboardModalOpen(true);
    };
    
    window.addEventListener('openDashboard', handleOpenDashboard);
    return () => window.removeEventListener('openDashboard', handleOpenDashboard);
  }, []);

  useEffect(() => {
    if (currentCategory) {
      loadVendors();
    }
  }, [currentCategory, loadVendors]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCategoryChange = useCallback((category) => {
    setCurrentCategory(category);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters) => setFilters(newFilters), []);

  const handleToggleFavorite = useCallback(async (vendorId) => {
    if (!currentUser) {
      showBanner('Please log in to save favorites', 'info');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId: currentUser.id, vendorProfileId: vendorId })
      });
      if (!response.ok) throw new Error('Failed to toggle favorite');
      const result = await response.json();
      const isFavorite = result.IsFavorite;
      if (isFavorite) {
        setFavorites(prev => [...prev, vendorId]);
        showBanner('Vendor saved to your favorites', 'favorite', 'Added to Favorites!');
      } else {
        setFavorites(prev => prev.filter(id => id !== vendorId));
        showBanner('Vendor removed from favorites', 'favorite', 'Removed from Favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showBanner('Failed to update favorites', 'error');
    }
  }, [currentUser]);

  const handleViewVendor = useCallback((vendorId) => navigate(`/vendor/${vendorId}`), [navigate]);

  const handleHighlightVendor = useCallback((vendorId, highlight) => {
    if (window.highlightMapMarker) window.highlightMapMarker(vendorId, highlight);
  }, []);

  const handleVendorSelectFromMap = useCallback((vendorId) => {
    setSelectedVendorId(vendorId);
    const card = document.querySelector(`[data-vendor-id="${vendorId}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleToggleFilters = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.classList.toggle('sidebar-collapsed');
  }, [sidebarCollapsed]);

  const handleToggleMap = useCallback(() => {
    setMapActive(!mapActive);
    document.body.classList.toggle('map-active');
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.classList.toggle('map-active');
  }, [mapActive]);

  const startIndex = (currentPage - 1) * vendorsPerPage;
  const endIndex = startIndex + vendorsPerPage;
  const currentVendors = filteredVendors.slice(startIndex, endIndex);
  const hasMore = vendors.length < serverTotalCount;
  
  console.log('📊 Render state:', { 
    vendorsCount: vendors.length, 
    filteredVendorsCount: filteredVendors.length, 
    currentVendorsCount: currentVendors.length,
    loading,
    currentPage,
    hasMore
  });

  return (
    <div>
      <Header 
        onSearch={(q) => console.log(q)} 
        onProfileClick={() => {
          if (currentUser) {
            setDashboardModalOpen(true);
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onWishlistClick={() => {
          if (currentUser) {
            setDashboardSection('favorites');
            setDashboardModalOpen(true);
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onChatClick={() => {
          if (currentUser) {
            const section = currentUser.isVendor ? 'vendor-messages' : 'messages';
            setDashboardSection(section);
            setDashboardModalOpen(true);
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onNotificationsClick={() => {}} 
      />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <DashboardModal 
        isOpen={dashboardModalOpen} 
        onClose={() => setDashboardModalOpen(false)}
        initialSection={dashboardSection}
      />
      <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mapActive ? 'map-active' : ''}`} id="app-container" style={{ display: 'grid' }}>
        <CategoriesNav activeCategory={currentCategory} onCategoryChange={handleCategoryChange} />
        <FilterSidebar filters={filters} onFilterChange={handleFilterChange} collapsed={sidebarCollapsed} />
        <main className="main-content">
          <div className="content-header">
            <div>
              <h1 className="results-title">{loading ? <div className="skeleton-line" style={{ height: '32px', width: '280px', borderRadius: '8px' }}></div> : `Vendors ${filters.location || userLocation ? 'in ' + (filters.location || 'your area') : 'Near you'}`}</h1>
              <p className="results-count">{loading ? <div className="skeleton-line" style={{ height: '16px', width: '150px', borderRadius: '6px', marginTop: '8px' }}></div> : `${serverTotalCount} vendors available`}</p>
            </div>
            <div className="view-controls">
              <button className="mobile-filter-btn"><i className="fas fa-sliders-h"></i><span>Filters</span></button>
              <button className="btn btn-outline" onClick={handleToggleFilters} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><i className="fas fa-sliders-h"></i><span>Filters</span></button>
              <select id="sort-select" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'white', fontSize: '0.9rem', color: 'var(--text)' }}><option value="recommended">Recommended</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="nearest">Nearest to Me</option><option value="rating">Highest Rated</option></select>
              <button className="btn btn-outline" onClick={handleToggleMap} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><i className="fas fa-map-marked-alt"></i><span>{mapActive ? 'Hide Map' : 'Show Map'}</span></button>
            </div>
          </div>
          <TrendingVendors onViewVendor={handleViewVendor} />
          <div className="map-overlay"></div>
          <VendorGrid vendors={currentVendors} loading={loading} favorites={favorites} onToggleFavorite={handleToggleFavorite} onViewVendor={handleViewVendor} onHighlightVendor={handleHighlightVendor} />
          {hasMore && !loading && <div style={{ display: 'flex', justifyContent: 'center', margin: '3rem 0 2rem 0' }}><button className="btn" onClick={() => loadVendors(true)} style={{ backgroundColor: '#5e72e4', color: 'white', border: 'none', padding: '0.875rem 2.5rem', fontSize: '1rem', fontWeight: 500, borderRadius: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(94, 114, 228, 0.2)' }}>Load More <i className="fas fa-chevron-down"></i></button></div>}
        </main>
        <aside className="map-sidebar"><div className="map-sidebar-content">{mapActive && <MapView vendors={filteredVendors} onVendorSelect={handleVendorSelectFromMap} selectedVendorId={selectedVendorId} />}</div></aside>
      </div>
    </div>
  );
}

export default IndexPage;
