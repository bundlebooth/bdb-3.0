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
import SetupIncompleteBanner from '../components/SetupIncompleteBanner';
import Footer from '../components/Footer';
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
      const response = await fetch(`${API_BASE_URL}/favorites/user/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const tryGetUserLocation = useCallback(() => {
    if (navigator.geolocation && !userLocation) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // EXACT match to original applyClientSideFilters (line 26091-26120)
  const applyClientSideFiltersInternal = useCallback((vendorsToFilter) => {
    console.log('🔧 Applying client-side filters to', vendorsToFilter.length, 'vendors');
    
    const filtered = vendorsToFilter.filter(vendor => {
      // Category filter (line 26093-26096)
      if (currentCategory !== 'all' && vendor.category !== currentCategory) {
        return false;
      }
      
      // Location filter - only apply text-based filter if we DON'T have user coordinates (line 26098-26107)
      const hasUserCoords = userLocation?.lat && userLocation?.lng;
      if (filters.location && !hasUserCoords) {
        const location = filters.location.toLowerCase();
        const vendorLocation = `${vendor.City || ''} ${vendor.State || ''}`.toLowerCase();
        if (!vendorLocation.includes(location)) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log('✨ Filtered vendors count:', filtered.length);
    setFilteredVendors(filtered);
    setCurrentPage(1); // Reset to first page (line 26112)
  }, [currentCategory, filters.location, userLocation]);

  const loadVendors = useCallback(async (append = false) => {
    try {
      if (!append) setLoading(true);
      
      // Match original logic (line 26133-26162)
      const hasCategoryQuery = currentCategory && currentCategory !== 'all';
      const nextPage = append ? serverPageNumber + 1 : 1;
      const hasUserLocation = userLocation?.lat && userLocation?.lng;
      
      let url = '';
      
      // Build URL exactly like original (line 26162-26227)
      if (hasCategoryQuery) {
        // Use /vendors/search-by-categories for category queries
        const qp = new URLSearchParams();
        qp.set('category', currentCategory);
        qp.set('pageNumber', String(nextPage));
        qp.set('pageSize', String(serverPageSize));
        
        if (hasUserLocation) {
          qp.set('latitude', String(userLocation.lat));
          qp.set('longitude', String(userLocation.lng));
          qp.set('radiusMiles', '50');
        }
        
        if (filters.priceLevel) qp.set('priceLevel', filters.priceLevel);
        if (filters.minRating) qp.set('minRating', filters.minRating);
        if (filters.region) qp.set('region', filters.region);
        if (filters.tags.includes('premium')) qp.set('isPremium', 'true');
        if (filters.tags.includes('eco-friendly')) qp.set('isEcoFriendly', 'true');
        if (filters.tags.includes('award-winning')) qp.set('isAwardWinning', 'true');
        if (filters.tags.includes('certified')) qp.set('isCertified', 'true');
        if (filters.tags.includes('insured')) qp.set('isInsured', 'true');
        if (filters.tags.includes('local')) qp.set('isLocal', 'true');
        if (filters.tags.includes('mobile')) qp.set('isMobile', 'true');
        
        url = `${API_BASE_URL}/vendors/search-by-categories?${qp.toString()}`;
      } else {
        // Use regular /vendors endpoint
        const qp = new URLSearchParams();
        qp.set('pageNumber', String(nextPage));
        qp.set('pageSize', String(serverPageSize));
        
        if (hasUserLocation) {
          qp.set('latitude', String(userLocation.lat));
          qp.set('longitude', String(userLocation.lng));
          qp.set('radiusMiles', '50');
        }
        
        if (filters.priceLevel) qp.set('priceLevel', filters.priceLevel);
        if (filters.minRating) qp.set('minRating', filters.minRating);
        if (filters.region) qp.set('region', filters.region);
        if (filters.tags.includes('premium')) qp.set('isPremium', 'true');
        if (filters.tags.includes('eco-friendly')) qp.set('isEcoFriendly', 'true');
        if (filters.tags.includes('award-winning')) qp.set('isAwardWinning', 'true');
        if (filters.tags.includes('certified')) qp.set('isCertified', 'true');
        if (filters.tags.includes('insured')) qp.set('isInsured', 'true');
        if (filters.tags.includes('local')) qp.set('isLocal', 'true');
        if (filters.tags.includes('mobile')) qp.set('isMobile', 'true');
        
        url = `${API_BASE_URL}/vendors?${qp.toString()}`;
      }
      
      console.log('🔍 Fetching vendors from:', url);
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error('Failed to fetch vendors');
      }
      const data = await response.json();
      console.log('📦 Raw API response:', data);
      
      // Handle response EXACTLY like original (line 26238-26258)
      let newVendors = [];
      let totalCount = 0;
      
      if (hasCategoryQuery && Array.isArray(data.sections)) {
        // Response from /vendors/search-by-categories has sections
        console.log('📦 Response has sections format');
        newVendors = data.sections.flatMap(s => s?.vendors || []);
        
        // Deduplicate vendors by profile ID or id (EXACT match to line 26242-26250)
        const seen = new Set();
        const unique = [];
        for (const v of newVendors) {
          const k = v.vendorProfileId || v.VendorProfileID || v.id;
          if (k == null) { unique.push(v); continue; }
          if (!seen.has(k)) { seen.add(k); unique.push(v); }
        }
        newVendors = unique;
        
        // Sum section totals when available (line 26252-26254)
        try {
          totalCount = data.sections.reduce((acc, s) => acc + (s?.totalCount || (s?.vendors?.length || 0)), 0);
        } catch { 
          totalCount = newVendors.length; 
        }
      } else {
        // Regular /vendors response (line 26256-26258)
        console.log('📦 Response has regular format');
        newVendors = data.vendors || [];
        totalCount = data.totalCount || newVendors.length;
      }
      console.log('✅ Vendors loaded:', newVendors.length, 'Total count:', totalCount);
      if (newVendors.length > 0) {
        console.log('📋 First vendor sample:', newVendors[0]);
      }
      // EXACT match to original (line 26284-26300)
      let updatedVendors;
      if (append) {
        // Merge with existing and dedupe using Map (line 26285-26292)
        const merged = [...vendors, ...newVendors];
        const byId = new Map();
        for (const v of merged) {
          const key = v.vendorProfileId || v.VendorProfileID || v.id;
          byId.set(String(key || Math.random()), v);
        }
        updatedVendors = Array.from(byId.values());
        console.log('🔄 Appending vendors. Before:', vendors.length, 'After merge:', merged.length, 'After dedupe:', updatedVendors.length);
        setVendors(updatedVendors);
        setServerPageNumber(nextPage);
      } else {
        updatedVendors = newVendors;
        setVendors(newVendors);
        setServerPageNumber(1);
      }
      setServerTotalCount(totalCount);
      
      // Apply client-side filters (line 26297)
      applyClientSideFiltersInternal(updatedVendors);
    } catch (error) {
      console.error('❌ Error loading vendors:', error);
      showBanner('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentCategory, filters.priceLevel, filters.minRating, filters.region, filters.tags, userLocation, applyClientSideFiltersInternal, vendors, serverPageNumber, serverPageSize]);

  const initializePage = useCallback(async () => {
    tryGetUserLocation();
    if (currentUser) {
      loadFavorites();
    }
    await loadVendors();
  }, []);

  useEffect(() => {
    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setServerPageNumber(1);
      loadVendors();
    }
  }, [currentCategory]);

  useEffect(() => {
    if (vendors.length > 0) {
      applyClientSideFiltersInternal(vendors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, filters, userLocation]);

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

  // Show ALL vendors from filteredVendors (no client-side pagination, matches original)
  const currentVendors = filteredVendors;
  const hasMore = vendors.length < serverTotalCount;
  const showLoadMore = hasMore && !loading && filteredVendors.length > 0;
  
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
          {currentUser?.vendorProfileId && (
            <SetupIncompleteBanner 
              onContinueSetup={() => {
                setDashboardSection('vendor-settings');
                setDashboardModalOpen(true);
              }}
            />
          )}
          <div className="content-header">
            <div>
              <h1 className="results-title">{loading ? <div className="skeleton-line" style={{ height: '32px', width: '280px', borderRadius: '8px' }}></div> : `Vendors ${filters.location || userLocation ? 'in ' + (filters.location || 'your area') : 'Near you'}`}</h1>
              <p className="results-count">{loading ? <span className="skeleton-line" style={{ display: 'inline-block', height: '16px', width: '150px', borderRadius: '6px', marginTop: '8px' }}></span> : `${serverTotalCount} vendors available`}</p>
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
          {showLoadMore && (
            <div id="load-more-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '3rem 0 2rem 0' }}>
              <button 
                className="btn" 
                id="load-more-btn"
                onClick={() => loadVendors(true)}
                disabled={loading}
                style={{ 
                  backgroundColor: '#5e72e4', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.875rem 2.5rem', 
                  fontSize: '1rem', 
                  fontWeight: 500, 
                  borderRadius: '8px', 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  boxShadow: '0 2px 8px rgba(94, 114, 228, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#4a5acf';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 114, 228, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#5e72e4';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(94, 114, 228, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span id="load-more-text">{loading ? 'Loading...' : 'Load More'}</span>
                {!loading && <i className="fas fa-chevron-down"></i>}
                {loading && <i className="fas fa-spinner fa-spin"></i>}
              </button>
            </div>
          )}
        </main>
        <aside className="map-sidebar"><div className="map-sidebar-content">{mapActive && <MapView vendors={filteredVendors} onVendorSelect={handleVendorSelectFromMap} selectedVendorId={selectedVendorId} />}</div></aside>
      </div>
      <Footer />
    </div>
  );
}

export default IndexPage;
