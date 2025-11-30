import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';
import CategoriesNav from '../components/CategoriesNav';
import FilterModal from '../components/FilterModal';
import VendorGrid from '../components/VendorGrid';
import VendorSection from '../components/VendorSection';
import MapView from '../components/MapView';
import ProfileModal from '../components/ProfileModal';
import DashboardModal from '../components/DashboardModal';
import SetupIncompleteBanner from '../components/SetupIncompleteBanner';
import MessagingWidget from '../components/MessagingWidget';
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
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [mapActive, setMapActive] = useState(true); // Map open by default
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPageNumber, setServerPageNumber] = useState(1);
  const [serverTotalCount, setServerTotalCount] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState('dashboard');
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  
  // Vendor discovery sections state
  const [discoverySections, setDiscoverySections] = useState([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);
  
  // Track initial mount to prevent duplicate loads
  const isInitialMount = useRef(true);
  const hasLoadedOnce = useRef(false);
  const isLoadingRef = useRef(false); // Prevent concurrent API calls
  
  const vendorsPerPage = 12;
  const serverPageSize = 20;

  const [filters, setFilters] = useState({
    location: '',
    useCurrentLocation: false,
    distanceKm: 50,
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

  const loadDiscoverySections = useCallback(async () => {
    try {
      setLoadingDiscovery(true);
      
      const params = new URLSearchParams();
      params.set('limit', '8');
      params.set('_t', Date.now()); // Cache buster
      
      // Add category filter so trending vendors adjust based on selected category
      console.log('📋 Current category for discovery sections:', currentCategory);
      if (currentCategory && currentCategory !== 'all') {
        console.log('✅ Adding category to API params:', currentCategory);
        params.set('category', currentCategory);
      } else {
        console.log('⚠️ No category filter applied (showing all)');
      }
      
      if (filters.location) {
        params.set('city', filters.location);
      }
      
      if (userLocation?.lat && userLocation?.lng) {
        params.set('latitude', userLocation.lat);
        params.set('longitude', userLocation.lng);
      }
      
      // Add userId for personalized recommendations
      if (currentUser?.userId) {
        params.set('userId', currentUser.userId);
      }
      
      const url = `${API_BASE_URL}/vendor-discovery/sections?${params.toString()}`;
      console.log('🔍 Fetching discovery sections from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch discovery sections');
      }
      
      const data = await response.json();
      console.log('📦 Discovery sections loaded:', data);
      
      if (data.success && data.sections) {
        setDiscoverySections(data.sections);
      }
    } catch (error) {
      console.error('❌ Error loading discovery sections:', error);
      // Don't show error banner - discovery sections are optional
    } finally {
      setLoadingDiscovery(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.location, userLocation, currentUser, currentCategory]);

  // EXACT match to original applyClientSideFilters (line 26091-26120)
  const applyClientSideFiltersInternal = useCallback((vendorsToFilter) => {
    console.log('🔧 Applying client-side filters to', vendorsToFilter.length, 'vendors');
    
    const filtered = vendorsToFilter.filter(vendor => {
      // Category filter - check both category and type fields
      if (currentCategory !== 'all') {
        const vendorCategory = vendor.category || vendor.type || '';
        if (vendorCategory !== currentCategory) {
          console.log(`❌ Vendor ${vendor.name} filtered out: has "${vendorCategory}", need "${currentCategory}"`);
          return false;
        }
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
    // Prevent concurrent API calls
    if (isLoadingRef.current) {
      console.log('⏭️ Skipping loadVendors - already loading');
      return;
    }
    
    isLoadingRef.current = true;
    
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
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
          // Convert km to miles (1 km = 0.621371 miles)
          const radiusMiles = Math.round(filters.distanceKm * 0.621371);
          qp.set('radiusMiles', String(radiusMiles));
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
          // Convert km to miles (1 km = 0.621371 miles)
          const radiusMiles = Math.round(filters.distanceKm * 0.621371);
          qp.set('radiusMiles', String(radiusMiles));
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
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCategory, filters.priceLevel, filters.minRating, filters.region, filters.tags, userLocation, serverPageNumber]);

  const initializePage = useCallback(async () => {
    if (hasLoadedOnce.current) {
      console.log('⏭️ Skipping initializePage - already initialized');
      return; // Prevent duplicate initialization
    }
    hasLoadedOnce.current = true;
    console.log('🚀 Initializing page...');
    
    tryGetUserLocation();
    if (currentUser) {
      loadFavorites();
    }
    await loadDiscoverySections();
    await loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFilters = {};
    
    if (params.has('location')) urlFilters.location = params.get('location');
    if (params.has('priceLevel')) urlFilters.priceLevel = params.get('priceLevel');
    if (params.has('minRating')) urlFilters.minRating = params.get('minRating');
    if (params.has('region')) urlFilters.region = params.get('region');
    if (params.has('tags')) urlFilters.tags = params.get('tags').split(',');
    if (params.has('useCurrentLocation')) urlFilters.useCurrentLocation = params.get('useCurrentLocation') === 'true';
    if (params.has('within50Miles')) urlFilters.within50Miles = params.get('within50Miles') === 'true';
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  }, []);

  useEffect(() => {
    initializePage();
    // Set map-active class on initial load since map starts as true
    document.body.classList.add('map-active');
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.classList.add('map-active');
    
    // Mark initial mount as complete after first render
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 100);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for dashboard open events from ProfileModal
  useEffect(() => {
    const handleOpenDashboard = (event) => {
      setProfileModalOpen(false);
      if (event.detail && event.detail.section) {
        setDashboardSection(event.detail.section);
      }
      setDashboardModalOpen(true);
    };
    
    window.addEventListener('openDashboard', handleOpenDashboard);
    return () => window.removeEventListener('openDashboard', handleOpenDashboard);
  }, []);

  useEffect(() => {
    // Skip on initial mount - initializePage handles the first load
    if (isInitialMount.current) {
      return;
    }
    
    if (currentCategory) {
      setLoading(true); // Show loading state when category changes
      setServerPageNumber(1);
      loadVendors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCategory]);

  // Reload vendors when filters change (especially popular filters/tags)
  useEffect(() => {
    // Skip on initial mount - initializePage handles the first load
    if (isInitialMount.current) {
      return;
    }
    
    if (filters.priceLevel || filters.minRating || filters.region || filters.tags.length > 0) {
      setLoading(true); // Show loading state when filters change
      setServerPageNumber(1);
      loadVendors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.priceLevel, filters.minRating, filters.region, filters.tags]);

  useEffect(() => {
    // Skip on initial mount - loadVendors already applies filters
    if (isInitialMount.current) {
      return;
    }
    
    if (vendors.length > 0) {
      applyClientSideFiltersInternal(vendors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, filters, userLocation]);

  // Reload discovery sections when location or category changes
  useEffect(() => {
    console.log('🔄 Discovery sections useEffect triggered:', {
      isInitialMount: isInitialMount.current,
      currentCategory,
      userLocation,
      location: filters.location
    });
    
    // ALWAYS reload discovery sections when category changes (removed isInitialMount check)
    console.log('🔄 Reloading discovery sections due to category/location change');
    loadDiscoverySections();
  }, [currentCategory, filters.location]);

  const handleCategoryChange = useCallback((category) => {
    console.log('🎯 Category changed to:', category);
    setCurrentCategory(category);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((e) => {
    const newSortBy = e.target.value;
    console.log('🔧 Sort changed:', newSortBy);
    setSortBy(newSortBy);
    
    // Apply sorting to current vendors
    const sorted = [...filteredVendors];
    
    switch (newSortBy) {
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = a.PriceLevel || a.priceLevel || 0;
          const priceB = b.PriceLevel || b.priceLevel || 0;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = a.PriceLevel || a.priceLevel || 0;
          const priceB = b.PriceLevel || b.priceLevel || 0;
          return priceB - priceA;
        });
        break;
      case 'rating':
        sorted.sort((a, b) => {
          const ratingA = a.AverageRating || a.averageRating || 0;
          const ratingB = b.AverageRating || b.averageRating || 0;
          return ratingB - ratingA;
        });
        break;
      case 'nearest':
        if (userLocation) {
          sorted.sort((a, b) => {
            const distA = a.Distance || a.distance || 999999;
            const distB = b.Distance || b.distance || 999999;
            return distA - distB;
          });
        }
        break;
      default:
        // 'recommended' - keep original order
        break;
    }
    
    setFilteredVendors(sorted);
  }, [filteredVendors, userLocation]);

  const handleFilterChange = useCallback((newFilters) => {
    console.log('🔧 Filter changed:', newFilters);
    setFilters(newFilters);
    
    // Update URL with filter parameters
    const params = new URLSearchParams(window.location.search);
    
    // Add/update filter params
    if (newFilters.location) {
      params.set('location', newFilters.location);
    } else {
      params.delete('location');
    }
    
    if (newFilters.priceLevel) {
      params.set('priceLevel', newFilters.priceLevel);
    } else {
      params.delete('priceLevel');
    }
    
    if (newFilters.minRating) {
      params.set('minRating', newFilters.minRating);
    } else {
      params.delete('minRating');
    }
    
    if (newFilters.region) {
      params.set('region', newFilters.region);
    } else {
      params.delete('region');
    }
    
    if (newFilters.tags && newFilters.tags.length > 0) {
      params.set('tags', newFilters.tags.join(','));
    } else {
      params.delete('tags');
    }
    
    if (newFilters.useCurrentLocation) {
      params.set('useCurrentLocation', 'true');
    } else {
      params.delete('useCurrentLocation');
    }
    
    if (newFilters.within50Miles) {
      params.set('within50Miles', 'true');
    } else {
      params.delete('within50Miles');
    }
    
    // Update URL without reloading page
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    
    // Reset to page 1 and reload vendors with new filters
    setCurrentPage(1);
    setServerPageNumber(1);
    loadVendors(false);
  }, [loadVendors]);

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
      <FilterModal 
        isOpen={filterModalOpen} 
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        userLocation={userLocation}
        vendorCount={serverTotalCount}
      />
      <div className={`app-container sidebar-collapsed ${mapActive ? 'map-active' : ''}`} id="app-container" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <CategoriesNav activeCategory={currentCategory} onCategoryChange={handleCategoryChange} />
        <div className="content-wrapper" style={{ display: 'flex', width: '100%', flex: 1 }}>
          <main className="main-content" style={{ width: mapActive ? '65%' : '100%', padding: '2rem', overflowY: 'auto', transition: 'width 0.25s ease' }}>
          {currentUser?.vendorProfileId && (
            <>
              <SetupIncompleteBanner 
                onContinueSetup={() => {
                  setDashboardSection('vendor-settings');
                  setDashboardModalOpen(true);
                }}
              />
            </>
          )}
          <div className="content-header">
            <div>
              <h1 className="results-title">{loading ? <div className="skeleton" style={{ height: '32px', width: '280px', borderRadius: '8px' }}></div> : `Vendors ${filters.location || userLocation ? 'in ' + (filters.location || 'your area') : 'Near you'}`}</h1>
              <p className="results-count">{loading ? <span className="skeleton" style={{ display: 'inline-block', height: '16px', width: '150px', borderRadius: '6px', marginTop: '8px' }}></span> : `${serverTotalCount} vendors available`}</p>
            </div>
            <div className="view-controls">
              <button 
                className="filter-btn" 
                onClick={() => setFilterModalOpen(true)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  fontSize: '0.9rem',
                  color: '#222',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  fontWeight: 500
                }}
              >
                <i className="fas fa-sliders-h"></i>
                <span>Filters</span>
              </button>
              <select id="sort-select" value={sortBy} onChange={handleSortChange} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'white', fontSize: '0.9rem', color: 'var(--text)', cursor: 'pointer' }}><option value="recommended">Recommended</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="nearest">Nearest to Me</option><option value="rating">Highest Rated</option></select>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{mapActive ? 'Hide map' : 'Show map'}</span>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={mapActive} 
                    onChange={handleToggleMap}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: mapActive ? '#34D399' : '#E5E7EB',
                    borderRadius: '24px',
                    transition: 'background-color 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '20px',
                      width: '20px',
                      left: mapActive ? '22px' : '2px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: 'left 0.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {mapActive && <span style={{ color: '#34D399', fontSize: '12px' }}>✓</span>}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="map-overlay"></div>
          
          {/* Vendor Discovery Sections */}
          {!loadingDiscovery && discoverySections.length > 0 && (
            <div className="vendor-discovery-sections">
              {discoverySections.map((section) => (
                <VendorSection
                  key={section.id}
                  title={section.title}
                  description={section.description}
                  vendors={section.vendors}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onViewVendor={handleViewVendor}
                  onHighlightVendor={handleHighlightVendor}
                />
              ))}
            </div>
          )}
          
          {/* Main Vendor Grid */}
          <VendorGrid vendors={currentVendors} loading={loading} loadingMore={loadingMore} favorites={favorites} onToggleFavorite={handleToggleFavorite} onViewVendor={handleViewVendor} onHighlightVendor={handleHighlightVendor} />
          {showLoadMore && (
            <div id="load-more-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '3rem 0 2rem 0' }}>
              <button 
                className="btn" 
                id="load-more-btn"
                onClick={() => loadVendors(true)}
                disabled={loadingMore}
                style={{ 
                  backgroundColor: '#5e72e4', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.875rem 2.5rem', 
                  fontSize: '1rem', 
                  fontWeight: 500, 
                  borderRadius: '8px', 
                  cursor: loadingMore ? 'not-allowed' : 'pointer', 
                  boxShadow: '0 2px 8px rgba(94, 114, 228, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  opacity: loadingMore ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!loadingMore) {
                    e.currentTarget.style.backgroundColor = '#4a5acf';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 114, 228, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loadingMore) {
                    e.currentTarget.style.backgroundColor = '#5e72e4';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(94, 114, 228, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <span id="load-more-text">{loadingMore ? 'Loading...' : 'Load More'}</span>
                {!loadingMore && <i className="fas fa-chevron-down"></i>}
                {loadingMore && <i className="fas fa-spinner fa-spin"></i>}
              </button>
            </div>
          )}
        </main>
        <aside className="map-sidebar" style={{ 
          display: mapActive ? 'block' : 'none',
          width: '35%',
          height: 'calc(100vh - 120px)',
          position: 'sticky',
          top: '120px',
          borderLeft: '1px solid #e5e7eb'
        }}>
          <div className="map-sidebar-content">
            <MapView 
              vendors={filteredVendors} 
              onVendorSelect={handleVendorSelectFromMap} 
              selectedVendorId={selectedVendorId}
              loading={loading}
              userLocation={userLocation}
            />
          </div>
        </aside>
        </div>
      </div>
      <Footer />
      <MessagingWidget />
    </div>
  );
}

export default IndexPage;
