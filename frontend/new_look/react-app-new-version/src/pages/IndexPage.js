import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import { PageLayout } from '../components/PageWrapper';
import Header from '../components/Header';
import FilterModal from '../components/FilterModal';
import CategoriesNav from '../components/CategoryPills';
import VendorGrid from '../components/VendorGrid';
import VendorSection from '../components/VendorSection';
import VendorSectionSkeleton from '../components/VendorSectionSkeleton';
import MapView from '../components/MapView';
import ProfileModal from '../components/ProfileModal';
import SetupIncompleteBanner from '../components/SetupIncompleteBanner';
import MessagingWidget from '../components/MessagingWidget';
import AnnouncementDisplay from '../components/AnnouncementDisplay';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import { showBanner } from '../utils/helpers';
import { EditButton } from '../components/common/UIComponents';
import LocationSearchModal from '../components/LocationSearchModal';

function IndexPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  // Initialize category from URL params
  const [currentCategory, setCurrentCategory] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('category') || 'all';
  });
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [mobileMapOpen, setMobileMapOpen] = useState(false); // Mobile fullscreen map
  const [locationModalOpen, setLocationModalOpen] = useState(false); // Location search modal

  // Prevent background scrolling when mobile map overlay is open
  useEffect(() => {
    if (mobileMapOpen) {
      document.body.classList.add('modal-open');
      // Notify MobileBottomNav that map is open
      window.dispatchEvent(new CustomEvent('mobileMapOpened'));
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [mobileMapOpen]);

  // Listen for closeMobileMap event from MobileBottomNav
  useEffect(() => {
    const handleCloseMobileMap = () => {
      setMobileMapOpen(false);
    };
    window.addEventListener('closeMobileMap', handleCloseMobileMap);
    return () => window.removeEventListener('closeMobileMap', handleCloseMobileMap);
  }, []);
  
  // Vendor discovery sections state
  const [discoverySections, setDiscoverySections] = useState([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);
  
  // Track initial mount to prevent duplicate loads
  const isInitialMount = useRef(true);
  const hasLoadedOnce = useRef(false);
  const isLoadingRef = useRef(false); // Prevent concurrent API calls
  
  const vendorsPerPage = 12;
  const serverPageSize = 200;

  // Initialize filters from URL params
  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      location: params.get('location') || '',
      useCurrentLocation: params.get('useCurrentLocation') === 'true',
      distanceKm: 50,
      priceLevel: params.get('priceLevel') || '',
      minRating: params.get('minRating') || '',
      region: params.get('region') || '',
      tags: params.get('tags') ? params.get('tags').split(',') : [],
      // Availability filters
      eventDate: null,
      dayOfWeek: null,
      startTime: null,
      endTime: null
    };
  });

  const loadFavorites = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const response = await apiGet(`/favorites/user/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // State for detected city name from IP geolocation
  const [detectedCity, setDetectedCity] = useState('');
  
  // Auto-detect user's city using IP geolocation (no permission required)
  // Using IP-based services first (no permission needed), then browser geolocation for accuracy
  const detectCityFromIP = useCallback(async () => {
    // IP-based geolocation services (no permission needed, works immediately)
    const geoServices = [
      {
        name: 'ipwho.is',
        url: 'https://ipwho.is/',
        parse: (data) => data.success && data.city ? {
          city: data.city,
          region: data.region,
          lat: data.latitude,
          lng: data.longitude
        } : null
      },
      {
        name: 'ip-api (via backend proxy)',
        url: `${API_BASE_URL}/geo/ip-location`,
        parse: (data) => data.success && data.city ? {
          city: data.city,
          region: data.region,
          lat: data.lat,
          lng: data.lng
        } : null
      }
    ];

    for (const service of geoServices) {
      try {
        const response = await fetch(service.url);
        if (response.ok) {
          const data = await response.json();
          const parsed = service.parse(data);
          if (parsed && parsed.lat && parsed.lng) {
            const cityString = `${parsed.city}, ${parsed.region}`;
            setDetectedCity(parsed.city);
            setUserLocation({
              lat: parsed.lat,
              lng: parsed.lng,
              city: cityString
            });
            setFilters(prev => ({ ...prev, location: parsed.city }));
            return; // Success, exit loop
          }
        }
      } catch (error) {
        // Try next service
        continue;
      }
    }
  }, []);

  const tryGetUserLocation = useCallback(() => {
    // First try IP-based geolocation (no permission needed)
    detectCityFromIP();
    
    // Then try browser geolocation for more accuracy (requires permission)
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        },
        () => {}
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectCityFromIP]);

  // Discovery sections are now loaded from the same /vendors endpoint
  // No separate API call needed - they come from the unified query
  const loadDiscoverySections = useCallback(async (overrideFilters = null) => {
    // This function is now a no-op - discovery sections are loaded with vendors
    // Keeping for backwards compatibility with any code that calls it directly
  }, []);

  // Handler for map bounds change - search as user drags map
  const handleMapBoundsChange = useCallback(async (boundsData) => {
    // Calculate radius based on map bounds (approximate)
    const latDiff = Math.abs(boundsData.bounds.north - boundsData.bounds.south);
    const radiusMiles = Math.max(10, Math.min(100, Math.round(latDiff * 69 / 2))); // ~69 miles per degree latitude
    
    // Show loading state while fetching
    setLoading(true);
    setLoadingDiscovery(true);
    
    // Fetch vendors within the map bounds using coordinates directly
    try {
      const qp = new URLSearchParams();
      qp.set('latitude', String(boundsData.center.lat));
      qp.set('longitude', String(boundsData.center.lng));
      qp.set('radiusMiles', String(radiusMiles));
      qp.set('pageSize', '100');
      qp.set('includeDiscoverySections', 'true'); // Include discovery sections
      
      if (currentCategory && currentCategory !== 'all') {
        qp.set('category', currentCategory);
      }
      
      const searchUrl = `${API_BASE_URL}/vendors?${qp.toString()}`;
      
      const vendorResponse = await fetch(searchUrl);
      if (vendorResponse.ok) {
        const data = await vendorResponse.json();
        const newVendors = data.vendors || data.data || data || [];
        
        // Try to get city from first vendor's location
        let mapCity = 'this area';
        if (newVendors.length > 0) {
          const firstVendor = newVendors[0];
          mapCity = firstVendor.City || firstVendor.city || firstVendor.Location || 'this area';
        }
        
        // Update detected city and user location
        setDetectedCity(mapCity);
        setUserLocation({
          lat: boundsData.center.lat,
          lng: boundsData.center.lng,
          city: mapCity
        });
        
        // Clear the search bar location filter so it doesn't show fixed city
        setFilters(prev => ({ ...prev, location: '' }));
        
        // Always update vendors, even if empty (to show "no vendors" message)
        setVendors(newVendors);
        setFilteredVendors(newVendors);
        
        // Update the vendor count display
        setServerTotalCount(data.totalCount || newVendors.length);
        
        // Update discovery sections if available in response
        if (data.discoverySections && Array.isArray(data.discoverySections)) {
          setDiscoverySections(data.discoverySections);
        } else if (newVendors.length > 0) {
          // Create basic discovery sections from the vendors
          const sections = [
            {
              id: 'nearby',
              title: `Vendors Near ${mapCity}`,
              type: 'nearby',
              vendors: newVendors.slice(0, 8)
            }
          ];
          setDiscoverySections(sections);
        }
      } else {
        console.error('🗺️ API error:', vendorResponse.status, vendorResponse.statusText);
      }
    } catch (fetchError) {
      console.error('Error fetching vendors for map bounds:', fetchError);
    } finally {
      setLoading(false);
      setLoadingDiscovery(false);
    }
  }, [currentCategory]);

  // EXACT match to original applyClientSideFilters (line 26091-26120)
  const applyClientSideFiltersInternal = useCallback((vendorsToFilter) => {
    const filtered = vendorsToFilter.filter(vendor => {
      // Category filter - check both category and type fields
      if (currentCategory !== 'all') {
        const vendorCategory = vendor.category || vendor.type || '';
        if (vendorCategory !== currentCategory) {
          return false;
        }
      }
      
      // Location filter - ALWAYS apply city filter when location is set
      if (filters.location) {
        const location = filters.location.toLowerCase();
        // Check both lowercase and uppercase property names (API returns lowercase, some code uses uppercase)
        const vendorCity = vendor.city || vendor.City || '';
        const vendorState = vendor.state || vendor.State || '';
        const vendorLocation = `${vendorCity} ${vendorState}`.toLowerCase();
        if (!vendorLocation.includes(location)) {
          return false;
        }
      }
      
      return true;
    });
    
    setFilteredVendors(filtered);
    setCurrentPage(1); // Reset to first page (line 26112)
  }, [currentCategory, filters.location, userLocation]);

  const loadVendors = useCallback(async (append = false) => {
    // Prevent concurrent API calls
    if (isLoadingRef.current) return;
    
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
        
        // Add city filter if location is set
        if (filters.location) {
          qp.set('city', filters.location);
        }
        
        // Add availability filters if set
        if (filters.eventDate) qp.set('eventDate', filters.eventDate);
        if (filters.dayOfWeek) qp.set('dayOfWeek', filters.dayOfWeek);
        if (filters.startTime) qp.set('startTime', filters.startTime);
        if (filters.endTime) qp.set('endTime', filters.endTime);
        
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
        
        // Include discovery sections for category searches too
        qp.set('includeDiscoverySections', 'true');
        qp.set('pageSize', '200'); // Get more vendors for discovery sections
        
        url = `${API_BASE_URL}/vendors/search-by-categories?${qp.toString()}`;
      } else {
        // Use regular /vendors endpoint
        const qp = new URLSearchParams();
        qp.set('pageNumber', String(nextPage));
        qp.set('pageSize', String(serverPageSize));
        
        // Add city filter if location is set
        if (filters.location) {
          qp.set('city', filters.location);
        }
        
        // Add availability filters if set
        if (filters.eventDate) qp.set('eventDate', filters.eventDate);
        if (filters.dayOfWeek) qp.set('dayOfWeek', filters.dayOfWeek);
        if (filters.startTime) qp.set('startTime', filters.startTime);
        if (filters.endTime) qp.set('endTime', filters.endTime);
        
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
        
        // Include discovery sections in the same query (unified endpoint)
        qp.set('includeDiscoverySections', 'true');
        qp.set('pageSize', '200'); // Get more vendors for discovery sections
        
        url = `${API_BASE_URL}/vendors?${qp.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error('Failed to fetch vendors');
      }
      const data = await response.json();
      
      // Handle response EXACTLY like original (line 26238-26258)
      let newVendors = [];
      let totalCount = 0;
      
      if (hasCategoryQuery && Array.isArray(data.sections)) {
        // Response from /vendors/search-by-categories has sections
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
        
        // Handle discovery sections from category search (filtered by category)
        // ALSO filter discovery section vendors by city
        if (data.discoverySections && Array.isArray(data.discoverySections)) {
          // Filter each section's vendors by city if location is set
          const cityFilter = filters.location?.toLowerCase();
          const filteredSections = data.discoverySections.map(section => ({
            ...section,
            vendors: cityFilter 
              ? section.vendors.filter(v => {
                  const vendorCity = (v.city || v.City || '').toLowerCase();
                  return vendorCity.includes(cityFilter);
                })
              : section.vendors
          })).filter(section => section.vendors.length > 0);
          setDiscoverySections(filteredSections);
          setLoadingDiscovery(false);
        }
      } else {
        // Regular /vendors response (line 26256-26258)
        newVendors = data.vendors || [];
        totalCount = data.totalCount || newVendors.length;
        
        // Handle discovery sections from unified endpoint
        // ALSO filter discovery section vendors by city
        if (data.discoverySections && Array.isArray(data.discoverySections)) {
          // Filter each section's vendors by city if location is set
          const cityFilter = filters.location?.toLowerCase();
          const filteredSections = data.discoverySections.map(section => ({
            ...section,
            vendors: cityFilter 
              ? section.vendors.filter(v => {
                  const vendorCity = (v.city || v.City || '').toLowerCase();
                  return vendorCity.includes(cityFilter);
                })
              : section.vendors
          })).filter(section => section.vendors.length > 0);
          setDiscoverySections(filteredSections);
          setLoadingDiscovery(false);
        }
      }
      // Always set loadingDiscovery to false after processing response
      setLoadingDiscovery(false);
      
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
        setVendors(updatedVendors);
        setServerPageNumber(nextPage);
      } else {
        updatedVendors = newVendors;
        setVendors(newVendors);
        setServerPageNumber(1);
      }
      setServerTotalCount(totalCount);
      
      // Apply client-side filters
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
      return; // Prevent duplicate initialization
    }
    hasLoadedOnce.current = true;
    
    tryGetUserLocation();
    if (currentUser) {
      loadFavorites();
    }
    await loadDiscoverySections();
    await loadVendors();
  }, [loadDiscoverySections, loadVendors, tryGetUserLocation, loadFavorites, currentUser, currentCategory, filters.location]);

  // Initialize page on mount - URL params are already loaded in useState initializers
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

  // Respond to URL parameter changes (e.g., when navigating from landing page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCategory = params.get('category') || 'all';
    const urlLocation = params.get('location') || '';
    const openMap = params.get('openMap') === 'true';
    
    // Handle openMap parameter from MobileBottomNav
    if (openMap) {
      setMobileMapOpen(true);
      // Remove the openMap param from URL to prevent re-triggering
      const newParams = new URLSearchParams(location.search);
      newParams.delete('openMap');
      const newUrl = newParams.toString() ? `${location.pathname}?${newParams.toString()}` : location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
    // Check if URL params differ from current state
    const categoryChanged = urlCategory !== currentCategory;
    const locationChanged = urlLocation !== filters.location;
    
    if (categoryChanged || locationChanged) {
      if (categoryChanged) {
        setCurrentCategory(urlCategory);
      }
      if (locationChanged) {
        setFilters(prev => ({ ...prev, location: urlLocation }));
      }
      
      // Reset loading state and reload vendors
      setLoading(true);
      setLoadingDiscovery(true);
      hasLoadedOnce.current = false; // Allow re-initialization
      isLoadingRef.current = false; // Reset loading ref
      
      // Reload vendors with new params
      setTimeout(() => {
        loadVendors();
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Listen for dashboard open events from ProfileModal
  useEffect(() => {
    const handleOpenDashboard = (event) => {
      setProfileModalOpen(false);
      const section = event.detail?.section || 'dashboard';
      navigate(`/dashboard?section=${section}`);
    };
    
    window.addEventListener('openDashboard', handleOpenDashboard);
    return () => window.removeEventListener('openDashboard', handleOpenDashboard);
  }, [navigate]);

  useEffect(() => {
    // Skip on initial mount - initializePage handles the first load
    if (isInitialMount.current) {
      return;
    }
    
    if (currentCategory) {
      setLoading(true); // Show loading state when category changes
      setLoadingDiscovery(true); // Also show loading for discovery sections
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

  // Track if we're in the middle of an enhanced search to prevent useEffect from overwriting results
  const isEnhancedSearchRef = useRef(false);
  
  useEffect(() => {
    // Skip on initial mount - loadVendors already applies filters
    if (isInitialMount.current) {
      return;
    }
    
    // Skip if we just did an enhanced search - it already set filteredVendors directly
    if (isEnhancedSearchRef.current) {
      isEnhancedSearchRef.current = false;
      return;
    }
    
    if (vendors.length > 0) {
      applyClientSideFiltersInternal(vendors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, filters, userLocation]);

  // Discovery sections are now loaded with vendors - this useEffect is kept for logging only
  useEffect(() => {
  }, [currentCategory, filters.location]);

  const handleCategoryChange = useCallback((category) => {
    setCurrentCategory(category);
    setCurrentPage(1);
    
    // Update URL with category parameter
    const params = new URLSearchParams(window.location.search);
    if (category && category !== 'all') {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newUrl);
  }, []);

  const handleSortChange = useCallback((e) => {
    const newSortBy = e.target.value;
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
      setProfileModalOpen(true);
      return;
    }
    try {
      const response = await apiPost('/favorites/toggle', { userId: currentUser.id, vendorProfileId: vendorId });
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
    if (window.highlightMapMarker) {
      window.highlightMapMarker(vendorId, highlight);
    }
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
    if (appContainer) {
      appContainer.classList.toggle('map-active');
    }
    // Use requestAnimationFrame to ensure DOM has updated before triggering resize
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }, [mapActive]);

  const handleEnhancedSearch = useCallback(async (searchParams) => {
    // Mark that we're doing an enhanced search so useEffect doesn't overwrite our results
    isEnhancedSearchRef.current = true;
    
    try {
      const cityName = searchParams.location ? searchParams.location.split(',')[0].trim() : '';
      
      // Update userLocation if coordinates are provided (from LocationSearchModal)
      // This will cause the MapView to center on the new location
      if (searchParams.userLocation && searchParams.userLocation.latitude && searchParams.userLocation.longitude) {
        setUserLocation({
          lat: searchParams.userLocation.latitude,
          lng: searchParams.userLocation.longitude,
          city: searchParams.userLocation.city || cityName
        });
        setDetectedCity(cityName);
      }
      
      // Calculate day of week if date is provided
      let dayOfWeek = null;
      if (searchParams.date) {
        const date = new Date(searchParams.date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        dayOfWeek = days[date.getDay()];
      }
      
      // Update filters SYNCHRONOUSLY
      const newFilters = {
        ...filters,
        location: cityName || filters.location,
        eventDate: searchParams.date || null,
        dayOfWeek: dayOfWeek || null,
        startTime: searchParams.startTime || null,
        endTime: searchParams.endTime || null
      };
      
      setFilters(newFilters);
      setServerPageNumber(1);
      setLoading(true);
      
      // Reload immediately with new filters
      try {
        // Build query params
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('limit', '20');
        
        if (newFilters.location) params.set('city', newFilters.location);
        if (newFilters.eventDate) params.set('eventDate', newFilters.eventDate);
        if (newFilters.dayOfWeek) params.set('dayOfWeek', newFilters.dayOfWeek);
        if (newFilters.startTime) params.set('startTime', newFilters.startTime);
        if (newFilters.endTime) params.set('endTime', newFilters.endTime);
        if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
        
        const url = `${API_BASE_URL}/vendors?${params.toString()}`;
        
        // Fetch vendors
        const vendorsResponse = await fetch(url);
        const vendorsData = await vendorsResponse.json();
        
        if (vendorsData.success && vendorsData.vendors) {
          setVendors(vendorsData.vendors);
          setFilteredVendors(vendorsData.vendors);
          setServerTotalCount(vendorsData.totalCount || 0);
          
          if (vendorsData.vendors.length === 0) {
            showBanner(`No vendors found in ${cityName} for the selected criteria`, 'info');
          } else {
            showBanner(`Found ${vendorsData.vendors.length} vendor${vendorsData.vendors.length !== 1 ? 's' : ''}`, 'success');
          }
        }
        
        // Load discovery sections with the NEW filters (not stale state)
        await loadDiscoverySections(newFilters);
        
      } catch (error) {
        console.error('Error loading vendors:', error);
        showBanner('Failed to load vendors', 'error');
      } finally {
        setLoading(false);
      }

    } catch (error) {
      console.error('Enhanced search error:', error);
      showBanner('Search failed. Please try again.', 'error');
      setLoading(false);
    }
  }, [filters, currentCategory, loadDiscoverySections, showBanner]);

  // Show ALL vendors from filteredVendors (no client-side pagination, matches original)
  const currentVendors = filteredVendors;
  const hasMore = vendors.length < serverTotalCount;
  const showLoadMore = hasMore && !loading && filteredVendors.length > 0;
  
  return (
    <PageLayout variant="fullWidth" pageClassName="index-page">
      {/* Announcement Banners, Popups, and Toasts */}
      <AnnouncementDisplay />
      
      <Header 
        onSearch={handleEnhancedSearch} 
        onProfileClick={() => {
          if (currentUser) {
            navigate('/dashboard');
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onWishlistClick={() => {
          if (currentUser) {
            navigate('/dashboard?section=favorites');
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onChatClick={() => {
          if (currentUser) {
            const section = currentUser.isVendor ? 'vendor-messages' : 'messages';
            navigate(`/dashboard?section=${section}`);
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onNotificationsClick={() => {}} 
      />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <FilterModal 
        isOpen={filterModalOpen} 
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        userLocation={userLocation}
        vendorCount={serverTotalCount}
      />
      <LocationSearchModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onApply={(locationData) => {
          setLocationModalOpen(false);
          if (locationData.location) {
            // Update filters with new location
            handleFilterChange({ location: locationData.location });
            // Update user location coordinates if provided
            if (locationData.coordinates) {
              setUserLocation({
                latitude: locationData.coordinates.lat,
                longitude: locationData.coordinates.lng
              });
            }
          }
        }}
        initialLocation={detectedCity || filters.location || ''}
        initialRadius={filters.radius || 50}
      />
      {/* Category Navigation - pill style buttons with page-wrapper for alignment */}
      <div style={{ width: '100%', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
        <div className="page-wrapper">
          <CategoriesNav 
            activeCategory={currentCategory} 
            onCategoryChange={handleCategoryChange} 
            loading={loading} 
          />
        </div>
      </div>
      <div className="page-wrapper" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <div className={`app-container sidebar-collapsed ${mapActive ? 'map-active' : ''}`} id="app-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'visible' }}>
        <div className="content-wrapper" style={{ display: 'flex', width: '100%', flex: 1, overflow: 'visible' }}>
          <main className="main-content" style={{ width: mapActive ? '65%' : '100%', overflowY: 'auto', overflowX: 'visible', transition: 'width 0.3s ease', padding: '2rem 1.5rem 2rem 0' }}>
          {/* Only show setup banner for users who are vendors with a vendor profile */}
          {currentUser?.isVendor && currentUser?.vendorProfileId && (
            <>
              <SetupIncompleteBanner 
                onContinueSetup={() => navigate('/dashboard?section=vendor-settings')}
              />
            </>
          )}
          <div className="content-header">
            <div>
              <h1 className="results-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {loading ? (
                  <div className="skeleton" style={{ height: '32px', width: '280px', borderRadius: '8px' }}></div>
                ) : (
                  <>
                    <span>Vendors {detectedCity || filters.location ? 'Near ' + (detectedCity || filters.location) : 'Near You'}</span>
                    <EditButton
                      onClick={() => setLocationModalOpen(true)}
                      title="Change location"
                    />
                  </>
                )}
              </h1>
              <p className="results-count">{loading ? <span className="skeleton" style={{ display: 'inline-block', height: '16px', width: '150px', borderRadius: '6px', marginTop: '8px' }}></span> : `${serverTotalCount} vendors available`}</p>
            </div>
            <div className="view-controls">
              {!loading && (
                <>
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
                        backgroundColor: mapActive ? '#3b82f6' : '#E5E7EB',
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
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                        </span>
                      </span>
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="map-overlay"></div>
          
          {/* Vendor Discovery Sections - Only show when there are vendors in main grid */}
          {(filteredVendors.length > 0 || loading) && (
          <div className="vendor-discovery-sections">
            {loadingDiscovery ? (
              // Show skeleton loaders while discovery sections are loading
              <>
                <VendorSectionSkeleton />
                <VendorSectionSkeleton />
                <VendorSectionSkeleton />
              </>
            ) : (
              // Show actual discovery sections when loaded
              discoverySections.length > 0 && discoverySections.map((section, index) => (
                <React.Fragment key={section.id}>
                  <VendorSection
                    title={section.title}
                    description={section.description}
                    vendors={section.vendors}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onViewVendor={handleViewVendor}
                    onHighlightVendor={handleHighlightVendor}
                    showViewCount={section.showViewCount || false}
                    showResponseTime={section.showResponseTime || false}
                    showAnalyticsBadge={section.showAnalyticsBadge || false}
                    analyticsBadgeType={section.analyticsBadgeType || null}
                    sectionType={section.type || section.id}
                    cityFilter={detectedCity || filters.location}
                    categoryFilter={currentCategory}
                  />
                </React.Fragment>
              ))
            )}
          </div>
          )}
          
          {/* Divider between discovery sections and main vendor grid */}
          {(filteredVendors.length > 0 || loading) && !loadingDiscovery && discoverySections.length > 0 && (
            <div className="section-divider" style={{
              maxWidth: '100%',
              margin: '40px 0',
              height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(0, 0, 0, 0.08), transparent)'
            }}></div>
          )}
          
          {/* Main Vendor Grid */}
          <VendorGrid vendors={currentVendors} loading={loading} loadingMore={loadingMore} favorites={favorites} onToggleFavorite={handleToggleFavorite} onViewVendor={handleViewVendor} onHighlightVendor={handleHighlightVendor} />
          {showLoadMore && (
            <div id="load-more-wrapper" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '3rem 0 2rem 0', position: 'relative' }}>
              {/* Loading overlay with spinner */}
              {loadingMore && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #5e72e4',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}
              {!loadingMore && (
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
                    cursor: 'pointer', 
                    boxShadow: '0 2px 8px rgba(94, 114, 228, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#4a5acf';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 114, 228, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#5e72e4';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(94, 114, 228, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span id="load-more-text">Load More</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
              )}
            </div>
          )}
          </main>
          <aside className="map-sidebar" style={{ 
            display: mapActive ? 'block' : 'none',
            width: mapActive ? '35%' : '0',
            height: 'calc(100vh - 64px)',
            position: 'sticky',
            top: '64px',
            borderLeft: 'none',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            alignSelf: 'flex-start',
            background: 'transparent'
          }}>
          <div className="map-sidebar-content">
            <MapView 
              vendors={filteredVendors} 
              onVendorSelect={handleVendorSelectFromMap} 
              selectedVendorId={selectedVendorId}
              loading={loading}
              userLocation={userLocation}
              onMapBoundsChange={handleMapBoundsChange}
            />
          </div>
          </aside>
        </div>
      </div>
      </div>
      
      {/* Mobile Map Button - Floating - Only show when no modals are open */}
      {!profileModalOpen && !filterModalOpen && (
        <button 
          className="mobile-map-button"
          onClick={() => setMobileMapOpen(true)}
        >
          <i className="fas fa-map"></i>
          <span>Show map</span>
        </button>
      )}
      
      {/* Mobile Fullscreen Map Overlay */}
      <div className={`mobile-map-overlay ${mobileMapOpen ? 'active' : ''}`}>
        <Header 
          onSearch={() => {}} 
          onProfileClick={() => currentUser ? navigate('/dashboard') : setProfileModalOpen(true)} 
          onWishlistClick={() => {
            if (currentUser) {
              navigate('/dashboard?section=favorites');
            } else {
              setProfileModalOpen(true);
            }
          }} 
          onChatClick={() => {
            if (currentUser) {
              const section = currentUser.isVendor ? 'vendor-messages' : 'messages';
              navigate(`/dashboard?section=${section}`);
            } else {
              setProfileModalOpen(true);
            }
          }} 
          onNotificationsClick={() => {}} 
        />
        <button 
          className="mobile-map-close-btn"
          onClick={() => setMobileMapOpen(false)}
          aria-label="Close map"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1001,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: '#374151'
          }}
        >
          ×
        </button>
        <div className="map-content">
          <MapView 
            vendors={filteredVendors} 
            onVendorSelect={(vendor) => {
              setMobileMapOpen(false);
              handleVendorSelectFromMap(vendor);
            }} 
            selectedVendorId={selectedVendorId}
            loading={loading}
            userLocation={userLocation}
            onMapBoundsChange={handleMapBoundsChange}
          />
        </div>
      </div>
      
      <Footer />
      <MessagingWidget />
      <MobileBottomNav 
        onOpenDashboard={(section) => {
          const sectionMap = {
            'messages': currentUser?.isVendor ? 'vendor-messages' : 'messages',
            'dashboard': 'dashboard'
          };
          const targetSection = section ? (sectionMap[section] || section) : 'dashboard';
          navigate(`/dashboard?section=${targetSection}`);
        }}
        onCloseDashboard={() => {}}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenMap={() => setMobileMapOpen(true)}
        onOpenMessages={() => {
          // Dispatch event to open messaging widget
          window.dispatchEvent(new CustomEvent('openMessagingWidget', { detail: {} }));
        }}
      />
    </PageLayout>
  );
}

export default IndexPage;
