import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { PageLayout } from '../components/PageWrapper';
import Header from '../components/Header';
import CategoriesNav from '../components/CategoriesNav';
import VendorGrid from '../components/VendorGrid';
import VendorSection from '../components/VendorSection';
import VendorSectionSkeleton from '../components/VendorSectionSkeleton';
import FilterModal from '../components/FilterModal';
import ProfileModal from '../components/ProfileModal';
import MapView from '../components/MapView';
import Footer from '../components/Footer';
import MessagingWidget from '../components/MessagingWidget';
import { showBanner } from '../utils/helpers';
import './BrowsePage.css';

// Category key to label mapping
const categoryLabels = {
  'all': 'All Categories',
  'venue': 'Venues',
  'photo': 'Photo/Video',
  'music': 'Music/DJ',
  'catering': 'Catering',
  'entertainment': 'Entertainment',
  'experiences': 'Experiences',
  'decor': 'Decorations',
  'beauty': 'Beauty',
  'cake': 'Cake',
  'transport': 'Transportation',
  'planner': 'Planners',
  'fashion': 'Fashion',
  'stationery': 'Stationery'
};

// Discovery type to display info mapping
const discoveryTypes = {
  'trending': { title: 'Trending Vendors', icon: 'fa-fire', color: '#FF385C' },
  'top-rated': { title: 'Top Rated', icon: 'fa-star', color: '#FFB400' },
  'most-responsive': { title: 'Most Responsive', icon: 'fa-bolt', color: '#00A699' },
  'recently-reviewed': { title: 'Recently Reviewed', icon: 'fa-comment-dots', color: '#5E72E4' },
  'nearby': { title: 'Nearby Vendors', icon: 'fa-location-dot', color: '#8B5CF6' },
  'premium': { title: 'Premium Vendors', icon: 'fa-crown', color: '#F59E0B' },
  'popular': { title: 'Most Popular', icon: 'fa-heart', color: '#EC4899' },
  'new': { title: 'New Arrivals', icon: 'fa-sparkles', color: '#10B981' },
  'recommended': { title: 'Recommended', icon: 'fa-thumbs-up', color: '#3B82F6' }
};

function BrowsePage() {
  const { filter, subfilter } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  // Determine what type of filter we're dealing with
  const isCategory = filter && categoryLabels[filter.toLowerCase()];
  const isDiscovery = filter && discoveryTypes[filter.toLowerCase()];
  const isCity = filter && !isCategory && !isDiscovery;

  // Parse the filters
  const cityFilter = isCity ? filter : (subfilter && !categoryLabels[subfilter?.toLowerCase()] ? subfilter : null);
  const categoryFilter = isCategory ? filter.toLowerCase() : (subfilter && categoryLabels[subfilter?.toLowerCase()] ? subfilter.toLowerCase() : null);
  const discoveryFilter = isDiscovery ? filter.toLowerCase() : null;

  // State
  const [vendors, setVendors] = useState([]);
  const [categorySections, setCategorySections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [mapActive, setMapActive] = useState(false);
  const [showFullGrid, setShowFullGrid] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [filters, setFilters] = useState({
    location: cityFilter || '',
    priceLevel: '',
    minRating: '',
    tags: []
  });

  const pageSize = 24;
  const hasLoadedRef = useRef(false);

  // Build page title and description
  const getPageInfo = () => {
    let title = 'Browse Vendors';
    let description = 'Find the perfect vendors for your event';
    let icon = 'fa-store';
    let iconColor = '#6366F1';

    if (discoveryFilter && discoveryTypes[discoveryFilter]) {
      const discovery = discoveryTypes[discoveryFilter];
      title = discovery.title;
      icon = discovery.icon;
      iconColor = discovery.color;
      if (cityFilter) {
        title += ` in ${decodeURIComponent(cityFilter)}`;
      }
    } else if (categoryFilter && categoryLabels[categoryFilter]) {
      title = categoryLabels[categoryFilter];
      if (cityFilter) {
        title += ` in ${decodeURIComponent(cityFilter)}`;
      }
    } else if (cityFilter) {
      title = `Vendors in ${decodeURIComponent(cityFilter)}`;
    }

    return { title, description, icon, iconColor };
  };

  const pageInfo = getPageInfo();

  // Build breadcrumb items
  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'Home', path: '/' }];
    
    if (cityFilter) {
      crumbs.push({ 
        label: decodeURIComponent(cityFilter), 
        path: `/browse/${encodeURIComponent(cityFilter)}` 
      });
    }
    
    if (categoryFilter && categoryLabels[categoryFilter]) {
      const catPath = cityFilter 
        ? `/browse/${encodeURIComponent(cityFilter)}/${categoryFilter}`
        : `/browse/${categoryFilter}`;
      crumbs.push({ label: categoryLabels[categoryFilter], path: catPath });
    }
    
    if (discoveryFilter && discoveryTypes[discoveryFilter]) {
      crumbs.push({ 
        label: discoveryTypes[discoveryFilter].title, 
        path: `/browse/${discoveryFilter}` 
      });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Load favorites
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
  }, [currentUser?.id]);

  // Load vendors based on filters
  const loadVendors = useCallback(async (append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const nextPage = append ? currentPage + 1 : 1;
      const params = new URLSearchParams();
      params.set('pageNumber', String(nextPage));
      params.set('pageSize', String(pageSize));

      // Add city filter
      if (cityFilter) {
        params.set('city', decodeURIComponent(cityFilter));
      }

      // Add category filter
      if (categoryFilter && categoryFilter !== 'all') {
        params.set('category', categoryFilter);
      }

      // Add discovery type filters
      if (discoveryFilter) {
        switch (discoveryFilter) {
          case 'trending':
            params.set('sortBy', 'views');
            params.set('trending', 'true');
            break;
          case 'top-rated':
            params.set('sortBy', 'rating');
            params.set('minRating', '4');
            break;
          case 'most-responsive':
            params.set('sortBy', 'responseTime');
            break;
          case 'recently-reviewed':
            params.set('sortBy', 'recentReviews');
            break;
          case 'premium':
            params.set('isPremium', 'true');
            break;
          case 'popular':
            params.set('sortBy', 'bookings');
            break;
          case 'new':
            params.set('sortBy', 'newest');
            break;
          default:
            break;
        }
      }

      // Add sort
      if (sortBy && sortBy !== 'recommended') {
        switch (sortBy) {
          case 'price-low':
            params.set('sortBy', 'priceAsc');
            break;
          case 'price-high':
            params.set('sortBy', 'priceDesc');
            break;
          case 'rating':
            params.set('sortBy', 'rating');
            break;
          case 'nearest':
            params.set('sortBy', 'nearest');
            break;
          default:
            break;
        }
      }

      // Add additional filters
      if (filters.priceLevel) params.set('priceLevel', filters.priceLevel);
      if (filters.minRating) params.set('minRating', filters.minRating);

      let url = `${API_BASE_URL}/vendors?${params.toString()}`;

      // Use category search endpoint if category is specified
      if (categoryFilter && categoryFilter !== 'all') {
        url = `${API_BASE_URL}/vendors/search-by-categories?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const data = await response.json();
      let newVendors = [];
      let total = 0;
      let sections = [];

      // Handle different response formats
      if (Array.isArray(data.sections)) {
        // Response from search-by-categories - preserve sections for category display
        sections = data.sections.filter(s => s?.vendors?.length > 0);
        newVendors = data.sections.flatMap(s => s?.vendors || []);
        // Deduplicate
        const seen = new Set();
        newVendors = newVendors.filter(v => {
          const k = v.vendorProfileId || v.VendorProfileID || v.id;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        total = data.sections.reduce((acc, s) => acc + (s?.totalCount || s?.vendors?.length || 0), 0);
      } else {
        newVendors = data.vendors || data.data || [];
        total = data.totalCount || newVendors.length;
        
        // Group vendors by category for section display
        const categoryGroups = {};
        newVendors.forEach(vendor => {
          const cat = vendor.category || vendor.type || 'other';
          if (!categoryGroups[cat]) {
            categoryGroups[cat] = [];
          }
          categoryGroups[cat].push(vendor);
        });
        
        // Convert to sections array
        sections = Object.entries(categoryGroups).map(([category, vendors]) => ({
          id: category,
          title: categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1),
          category: category,
          vendors: vendors
        }));
      }
      
      setCategorySections(sections);

      if (append) {
        setVendors(prev => {
          const merged = [...prev, ...newVendors];
          const byId = new Map();
          for (const v of merged) {
            const key = v.vendorProfileId || v.VendorProfileID || v.id;
            byId.set(String(key || Math.random()), v);
          }
          return Array.from(byId.values());
        });
        setCurrentPage(nextPage);
      } else {
        setVendors(newVendors);
        setCurrentPage(1);
      }
      setTotalCount(total);

    } catch (error) {
      console.error('Error loading vendors:', error);
      showBanner('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cityFilter, categoryFilter, discoveryFilter, sortBy, filters, currentPage]);

  // Initial load
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadVendors();
      loadFavorites();
    }
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (hasLoadedRef.current) {
      loadVendors();
    }
  }, [filter, subfilter, sortBy]);

  // Handle category change from nav
  const handleCategoryChange = useCallback((category) => {
    if (cityFilter) {
      navigate(`/browse/${encodeURIComponent(cityFilter)}/${category}`);
    } else {
      navigate(`/browse/${category}`);
    }
  }, [cityFilter, navigate]);

  // Handle sort change
  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(async (vendorId) => {
    if (!currentUser) {
      setProfileModalOpen(true);
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
      if (result.IsFavorite) {
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

  // Handle view vendor
  const handleViewVendor = useCallback((vendorId) => {
    navigate(`/vendor/${vendorId}`);
  }, [navigate]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    loadVendors();
  }, [loadVendors]);

  // Handle map toggle
  const handleToggleMap = useCallback(() => {
    setMapActive(!mapActive);
  }, [mapActive]);

  // Handle vendor select from map
  const handleVendorSelectFromMap = useCallback((vendorId) => {
    setSelectedVendorId(vendorId);
    const card = document.querySelector(`[data-vendor-id="${vendorId}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Handle highlight vendor (for map interaction)
  const handleHighlightVendor = useCallback((vendorId, highlight) => {
    if (window.highlightMapMarker) {
      window.highlightMapMarker(vendorId, highlight);
    }
  }, []);

  // Toggle between section view and full grid view
  const handleShowFullGrid = useCallback(() => {
    setShowFullGrid(true);
    setMapActive(true);
  }, []);

  const hasMore = vendors.length < totalCount;

  return (
    <PageLayout variant="fullWidth" pageClassName="browse-page">
      <Header 
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
      />

      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <FilterModal 
        isOpen={filterModalOpen} 
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        vendorCount={totalCount}
      />

      <div className="browse-container">
        {/* Categories Navigation */}
        <CategoriesNav 
          activeCategory={categoryFilter || 'all'} 
          onCategoryChange={handleCategoryChange} 
          loading={loading}
        />

        <main className="browse-main">
          {/* Breadcrumb Navigation */}
          <nav className="browse-breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="breadcrumb-separator">›</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="breadcrumb-current">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="breadcrumb-link">{crumb.label}</Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Page Header */}
          <div className="browse-header">
            <div className="browse-title-section">
              <h1 className="browse-title">
                {discoveryFilter && discoveryTypes[discoveryFilter] && (
                  <span 
                    className="browse-title-icon"
                    style={{ 
                      backgroundColor: `${pageInfo.iconColor}15`, 
                      color: pageInfo.iconColor 
                    }}
                  >
                    <i className={`fas ${pageInfo.icon}`}></i>
                  </span>
                )}
                {pageInfo.title}
              </h1>
              <p className="browse-count">
                {loading ? (
                  <span className="skeleton" style={{ display: 'inline-block', height: '16px', width: '120px', borderRadius: '4px' }}></span>
                ) : (
                  `${totalCount} vendor${totalCount !== 1 ? 's' : ''} found`
                )}
              </p>
            </div>

            <div className="browse-controls">
              <button 
                className="browse-filter-btn"
                onClick={() => setFilterModalOpen(true)}
              >
                <i className="fas fa-sliders-h"></i>
                <span>Filters</span>
              </button>
              <select 
                className="browse-sort-select"
                value={sortBy} 
                onChange={handleSortChange}
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="nearest">Nearest to Me</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Vendor Display - Section View or Full Grid */}
          {showFullGrid ? (
            // Full grid view with map (like Airbnb's second image)
            <div className="browse-full-view">
              <div className="browse-content-wrapper" style={{ display: 'flex', width: '100%' }}>
                <div className="browse-vendors-panel" style={{ width: mapActive ? '55%' : '100%', transition: 'width 0.3s ease' }}>
                  <VendorGrid 
                    vendors={vendors}
                    loading={loading}
                    loadingMore={loadingMore}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onViewVendor={handleViewVendor}
                    onHighlightVendor={handleHighlightVendor}
                  />

                  {/* Load More Button */}
                  {hasMore && !loading && vendors.length > 0 && (
                    <div className="browse-load-more">
                      {loadingMore ? (
                        <div className="browse-loading-spinner">
                          <div className="spinner"></div>
                        </div>
                      ) : (
                        <button 
                          className="browse-load-more-btn"
                          onClick={() => loadVendors(true)}
                          disabled={loadingMore}
                        >
                          <span>Load More</span>
                          <i className="fas fa-chevron-down"></i>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Map Panel */}
                {mapActive && (
                  <div className="browse-map-panel" style={{ 
                    width: '45%', 
                    height: 'calc(100vh - 180px)', 
                    position: 'sticky', 
                    top: '180px',
                    borderLeft: '1px solid #e5e7eb'
                  }}>
                    <MapView 
                      vendors={vendors}
                      onVendorSelect={handleVendorSelectFromMap}
                      selectedVendorId={selectedVendorId}
                      loading={loading}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Section view (like Airbnb's first image - horizontal rows)
            <div className="browse-sections-view">
              {loading ? (
                // Show skeleton loaders while loading
                <>
                  <VendorSectionSkeleton />
                  <VendorSectionSkeleton />
                  <VendorSectionSkeleton />
                </>
              ) : categorySections.length > 0 ? (
                // Show category sections with horizontal scroll
                categorySections.map((section) => (
                  <VendorSection
                    key={section.id}
                    title={section.title}
                    description={section.description}
                    vendors={section.vendors.slice(0, 8)}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onViewVendor={handleViewVendor}
                    onHighlightVendor={handleHighlightVendor}
                    sectionType={section.category || section.id}
                    cityFilter={cityFilter ? decodeURIComponent(cityFilter) : null}
                    categoryFilter={section.category}
                  />
                ))
              ) : vendors.length > 0 ? (
                // Fallback: show single section with all vendors
                <VendorSection
                  title={pageInfo.title}
                  vendors={vendors.slice(0, 8)}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onViewVendor={handleViewVendor}
                  onHighlightVendor={handleHighlightVendor}
                  cityFilter={cityFilter ? decodeURIComponent(cityFilter) : null}
                />
              ) : (
                <div className="browse-no-results">
                  <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                  <h3>No vendors found</h3>
                  <p>Try adjusting your filters or search criteria</p>
                </div>
              )}
              
              {/* Show All Button - to switch to full grid view */}
              {!loading && vendors.length > 8 && (
                <div className="browse-show-all-wrapper">
                  <button 
                    className="browse-show-all-btn"
                    onClick={handleShowFullGrid}
                  >
                    <span>Show all {totalCount} vendors</span>
                    <i className="fas fa-th-large"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />
      <MessagingWidget />
    </PageLayout>
  );
}

export default BrowsePage;
