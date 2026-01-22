import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import { PageLayout } from '../components/PageWrapper';
import Header from '../components/Header';
import VendorSection from '../components/VendorSection';
import VendorCard from '../components/VendorCard';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import MessagingWidget from '../components/MessagingWidget';
import ProfileModal from '../components/ProfileModal';
import { useTranslation } from '../hooks/useTranslation';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  
  const [discoverySections, setDiscoverySections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const observerRef = useRef(null);
  
  // Hero slideshow data - each slide has an icon and background image
  // Images are stored in /public/images/landing/
  const heroSlides = [
    { 
      icon: 'fa-camera', 
      label: 'Photography',
      image: '/images/landing/slide-photography.jpg'
    },
    { 
      icon: 'fa-utensils', 
      label: 'Catering',
      image: '/images/landing/slide-catering.jpg'
    },
    { 
      icon: 'fa-music', 
      label: 'Music & DJ',
      image: '/images/landing/slide-music.jpg'
    },
    { 
      icon: 'fa-users', 
      label: 'Events',
      image: '/images/landing/slide-events.jpg'
    }
  ];
  
  // Search bar state
  const [searchLocation, setSearchLocation] = useState('');
  const [searchGuests, setSearchGuests] = useState('');
  const [eventType, setEventType] = useState('');
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Handle scroll for header transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all animated sections
    document.querySelectorAll('.animate-section').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [loading]);

  // Auto-rotate slideshow every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places && locationInputRef.current) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(locationInputRef.current, {
          types: ['(cities)'],
          componentRestrictions: { country: 'ca' }
        });
        
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place.formatted_address) {
            setSearchLocation(place.formatted_address);
          } else if (place.name) {
            setSearchLocation(place.name);
          }
        });
      }
    };

    // Check if Google Maps is loaded
    if (window.google && window.google.maps) {
      initAutocomplete();
    } else {
      // Load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    }
  }, []);

  // Load discovery sections from API (same as IndexPage)
  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors?pageSize=200&includeDiscoverySections=true`);
      if (response.ok) {
        const data = await response.json();
        
        // Use discovery sections from API if available
        if (data.discoverySections && Array.isArray(data.discoverySections)) {
          // Filter out Budget-Friendly Options section
          const filteredSections = data.discoverySections.filter(
            section => !section.title?.toLowerCase().includes('budget')
          );
          setDiscoverySections(filteredSections);
        } else {
          // Fallback: create sections from vendors
          const vendors = data.vendors || [];
          const sections = [];
          
          // Top Rated
          const topRated = vendors.filter(v => (v.AverageRating || v.averageRating || 0) >= 4.5).slice(0, 8);
          if (topRated.length > 0) {
            sections.push({ id: 'top-rated', title: 'Top Rated Vendors', description: 'Highly rated by our community', vendors: topRated });
          }
          
          // Premium
          const premium = vendors.filter(v => v.IsPremium || v.isPremium).slice(0, 8);
          if (premium.length > 0) {
            sections.push({ id: 'premium', title: 'Premium Vendors', description: 'Exclusive premium services', vendors: premium });
          }
          
          // Most Responsive
          const responsive = vendors.filter(v => v.ResponseTime || v.responseTime).slice(0, 8);
          if (responsive.length > 0) {
            sections.push({ id: 'responsive', title: 'Most Responsive', description: 'Quick to respond to inquiries', vendors: responsive });
          }
          
          // Popular
          const popular = vendors.slice(0, 8);
          if (popular.length > 0) {
            sections.push({ id: 'popular', title: 'Popular vendors to book', description: 'Highly rated vendors loved by our community', vendors: popular });
          }
          
          setDiscoverySections(sections);
        }
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);


  const handleSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.set('location', searchLocation);
    if (eventType) params.set('category', eventType.toLowerCase());
    if (searchGuests) params.set('guests', searchGuests);
    window.scrollTo(0, 0);
    navigate(`/explore?${params.toString()}`);
  };

  const handleCityClick = (cityName) => {
    // Extract just the city name without province for API compatibility
    const city = cityName.split(',')[0].trim();
    window.scrollTo(0, 0);
    navigate(`/explore?location=${encodeURIComponent(city)}`);
  };

  const handleCategoryClick = (categorySlug) => {
    window.scrollTo(0, 0);
    navigate(`/explore?category=${encodeURIComponent(categorySlug)}`);
  };

  const handleToggleFavorite = (vendorId) => {
    if (!currentUser) {
      setProfileModalOpen(true);
      return;
    }
    setFavorites(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const eventTypes = [
    'Wedding', 'Corporate Event', 'Birthday Party', 'Conference', 
    'Product Launch', 'Networking Event', 'Workshop', 'Gala'
  ];

  const vendorCategories = [
    { name: 'Venues', slug: 'Venues', icon: 'fa-building', image: '/images/landing/meeting-venue.jpg', count: 150 },
    { name: 'Caterers', slug: 'Catering', icon: 'fa-utensils', image: '/images/landing/slide-catering.jpg', count: 85 },
    { name: 'Photographers', slug: 'Photo/Video', icon: 'fa-camera', image: '/images/landing/slide-photography.jpg', count: 120 },
    { name: 'DJs & Music', slug: 'Music/DJ', icon: 'fa-music', image: '/images/landing/slide-music.jpg', count: 65 },
    { name: 'Decorators', slug: 'Decorations', icon: 'fa-palette', image: '/images/landing/creative-space.jpg', count: 45 },
    { name: 'Event Planners', slug: 'Entertainment', icon: 'fa-clipboard-list', image: '/images/landing/slide-events.jpg', count: 55 }
  ];

  const cities = [
    { name: 'Toronto, ON', shortName: 'Toronto', image: '/images/landing/city-toronto.jpg', vendorCount: 180, description: 'Canada\'s largest city with incredible venues' },
    { name: 'Vancouver, BC', shortName: 'Vancouver', image: '/images/landing/city-vancouver.jpg', vendorCount: 95, description: 'Beautiful coastal event spaces' },
    { name: 'Montreal, QC', shortName: 'Montreal', image: '/images/landing/city-montreal.jpg', vendorCount: 75, description: 'Historic charm meets modern elegance' },
    { name: 'Calgary, AB', shortName: 'Calgary', image: '/images/landing/city-calgary.jpg', vendorCount: 60, description: 'Mountain city celebrations' },
    { name: 'Ottawa, ON', shortName: 'Ottawa', image: '/images/landing/city-ottawa.jpg', vendorCount: 45, description: 'Capital city sophistication' },
    { name: 'Edmonton, AB', shortName: 'Edmonton', image: '/images/landing/city-edmonton.jpg', vendorCount: 40, description: 'Festival city venues' }
  ];

  const features = [
    {
      icon: 'fa-search',
      title: 'Discover unique spaces for any event',
      description: 'Browse hundreds of vendors across Canada. Find the right one among venues, caterers, photographers, and more.'
    },
    {
      icon: 'fa-sliders-h',
      title: 'Find the perfect fit with smart tools',
      description: 'Use intuitive filters to customize your search by budget, guest count, amenities, and availability.'
    },
    {
      icon: 'fa-star',
      title: 'Check verified reviews before you book',
      description: 'Read real reviews from people who have hosted events. Make confident decisions with trusted feedback.'
    },
    {
      icon: 'fa-shield-alt',
      title: 'Make a secure, hassle-free booking',
      description: 'Pay securely, chat directly with vendors, and manage everything with your free account.'
    }
  ];

  return (
    <PageLayout variant="fullWidth" pageClassName="landing-page">
      {/* Standard Header */}
      <Header 
        onSearch={() => navigate('/explore')} 
        onProfileClick={() => setProfileModalOpen(true)}
        onWishlistClick={() => navigate('/explore')}
        onChatClick={() => navigate('/explore')}
        onNotificationsClick={() => {}}
      />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

      {/* Hero Section - Tagvenue style with overlapping image */}
      <section className="landing-hero">
        <div className="landing-hero-container">
          {/* Hero Image - positioned on right, extends below search bar */}
          <div className="landing-hero-images">
            <div className="landing-hero-slideshow">
              {heroSlides.map((slide, index) => (
                <div 
                  key={index}
                  className={`landing-hero-slide ${index === activeSlide ? 'active' : ''}`}
                >
                  <img src={slide.image} alt={slide.label} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Text Content and Search Bar - positioned on left */}
          <div className="landing-hero-content">
            <div className="landing-hero-badge">
              <span>{t('landing.over500Vendors', 'Over 500 vendors')}</span>
              <span className="badge-dot">·</span>
              <span>{t('landing.trustedBy', 'Trusted by 10K+ customers')}</span>
            </div>
            
            <h1 className="landing-hero-title">
              {t('landing.heroTitle', 'Find and book venues')}<br/>
              {t('landing.heroTitle2', 'for any event')}<br/>
              {t('landing.heroTitle3', 'imaginable')}
            </h1>
            
            {/* Search Bar - inside content, extends into image area */}
            <form className="landing-search-bar" onSubmit={handleSearch}>
              <div className="landing-search-field">
                <svg className="landing-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <div className="landing-search-field-inner">
                  <span className="landing-search-label">{t('landing.eventType', 'EVENT TYPE')}</span>
                  <select 
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="landing-search-select"
                  >
                    <option value="">{t('landing.whatPlanning', 'What are you planning?')}</option>
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="landing-search-divider"></div>
              
              <div className="landing-search-field">
                <svg className="landing-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                </svg>
                <div className="landing-search-field-inner">
                  <span className="landing-search-label">{t('landing.guests', 'GUESTS')}</span>
                  <input 
                    type="text" 
                    placeholder={t('landing.numberOfGuests', 'Number of guests')}
                    value={searchGuests}
                    onChange={(e) => setSearchGuests(e.target.value)}
                    className="landing-search-input"
                  />
                </div>
              </div>
              
              <div className="landing-search-divider"></div>
              
              <div className="landing-search-field">
                <svg className="landing-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <div className="landing-search-field-inner">
                  <span className="landing-search-label">{t('landing.location', 'LOCATION')}</span>
                  <input 
                    ref={locationInputRef}
                    type="text" 
                    placeholder={t('landing.locationPlaceholder', 'Toronto')}
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="landing-search-input"
                  />
                </div>
              </div>
              
              <button type="submit" className="landing-search-btn">
                {t('common.search')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 1. Find the perfect vendors for your event (Lead Section) */}
      <section className="feature-showcase-section">
        <div 
          id="feature-discover" 
          className={`feature-row animate-section ${visibleSections.has('feature-discover') ? 'visible' : ''}`}
        >
          <div className="feature-row-content">
            <div className="feature-text-side">
              <div className="feature-badge">
                <i className="fas fa-compass"></i>
                <span>{t('landing.discover', 'Discover')}</span>
              </div>
              <h2>{t('landing.findPerfectVendors', 'Find the perfect vendors for your event')}</h2>
              <p>{t('landing.browseVendorsDesc', "Browse 500+ verified vendors across Canada. From photographers to caterers, venues to DJs — we've curated the best so you don't have to search endlessly.")}</p>
              <ul className="feature-list">
                <li><i className="fas fa-check-circle"></i> Photographers & Videographers</li>
                <li><i className="fas fa-check-circle"></i> Caterers & Food Services</li>
                <li><i className="fas fa-check-circle"></i> Venues & Event Spaces</li>
                <li><i className="fas fa-check-circle"></i> DJs, Musicians & Entertainment</li>
              </ul>
              <button className="feature-cta" onClick={() => { window.scrollTo(0, 0); navigate('/explore'); }}>
                {t('landing.exploreVendors', 'Explore Vendors')} <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            <div className="feature-image-side">
              <div className="feature-image-stack">
                <img src="/images/landing/slide-photography.jpg" alt="Photography" className="stack-img stack-img-1" />
                <img src="/images/landing/slide-catering.jpg" alt="Catering" className="stack-img stack-img-2" />
                <div className="floating-stat floating-stat-1">
                  <i className="fas fa-star"></i>
                  <span>4.9 avg rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Bar (Trust Builder) */}
      <section 
        id="stats-section" 
        className={`stats-counter-section animate-section ${visibleSections.has('stats-section') ? 'visible' : ''}`}
      >
        <div className="section-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number" data-target="500">500+</div>
              <div className="stat-label">{t('landing.verifiedVendors', 'Verified Vendors')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" data-target="10000">10K+</div>
              <div className="stat-label">{t('landing.eventsBooked', 'Events Booked')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" data-target="50">50+</div>
              <div className="stat-label">{t('landing.citiesCovered', 'Cities Covered')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" data-target="4.9">4.9</div>
              <div className="stat-label">{t('landing.averageRating', 'Average Rating')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Browse by vendor type (Navigation) */}
      <section className="category-carousel-section">
        <div className="section-container">
          <h2>{t('landing.browseByType', 'Browse by vendor type')}</h2>
          <p className="section-subtitle">{t('landing.browseByTypeDesc', 'Find the perfect vendors for every aspect of your event')}</p>
          <div className="carousel-wrapper">
            <div className="carousel-scroll">
              {vendorCategories.map((category, index) => (
                <div 
                  key={index} 
                  className="carousel-card"
                  onClick={() => handleCategoryClick(category.slug)}
                >
                  <div className="carousel-card-image">
                    <img src={category.image} alt={category.name} />
                    <div className="carousel-card-overlay">
                      <h3>{category.name}</h3>
                      <p>{category.count}+ vendors</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Value Card (Why Planbeau - Benefits) */}
      <section className="why-planhive-section">
        <div className="section-container">
          <div className="why-planhive-content">
            <div className="why-planhive-card">
              <div className="why-item">
                <div className="why-icon">
                  <i className="fas fa-th-large"></i>
                </div>
                <div className="why-text">
                  <h3>The perfect vendors</h3>
                  <p>From <span className="highlight">professional photographers</span> to <span className="highlight">top-rated caterers</span> or <span className="highlight">stunning venues</span>, you can find your perfect fit.</p>
                </div>
              </div>
              <div className="why-item">
                <div className="why-icon">
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <div className="why-text">
                  <h3>Simple budgeting</h3>
                  <p>With <span className="highlight">clear pricing</span> and no surprise fees, you'll know what you're <span className="highlight">paying for</span>, right from the get-go.</p>
                </div>
              </div>
              <div className="why-item">
                <div className="why-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="why-text">
                  <h3>Cover your booking</h3>
                  <p><span className="highlight">Things happen.</span> Get the liability and damage protection <span className="highlight">you need</span> for any event or <span className="highlight">production.</span></p>
                </div>
              </div>
            </div>
            <div className="why-planhive-image">
              <img 
                src="/images/landing/venue-feature.jpg" 
                alt="Beautiful venue"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Browse Our Vendors (Showcase) */}
      {!loading && discoverySections[0] && discoverySections[0].vendors?.length > 0 && (
        <section className="featured-vendors-section browse-vendors-section">
          <div className="section-container">
            <div className="browse-vendors-header">
              <h2>Browse Our Vendors</h2>
              <p>Explore top-rated professionals for your next event</p>
            </div>
            <div className="landing-discovery-row">
              <VendorSection
                title=""
                description=""
                vendors={discoverySections[0].vendors}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onViewVendor={(vendorId) => { window.scrollTo(0, 0); navigate(`/vendor/${vendorId}`); }}
              />
            </div>
          </div>
        </section>
      )}

      {/* 6. Find your perfect match in seconds (How-To Part 1) */}
      <section className="feature-showcase-section">
        <div 
          id="feature-search" 
          className={`feature-row feature-row-reverse animate-section ${visibleSections.has('feature-search') ? 'visible' : ''}`}
        >
          <div className="feature-row-content">
            <div className="feature-text-side">
              <div className="feature-badge feature-badge-purple">
                <i className="fas fa-sliders-h"></i>
                <span>Smart Tools</span>
              </div>
              <h2>Find your perfect match in seconds</h2>
              <p>Our <strong>intelligent search</strong> helps you filter by budget, location, availability, and more. See real prices and response times upfront — no surprises.</p>
              <div className="feature-highlights">
                <div className="highlight-item">
                  <div className="highlight-icon"><i className="fas fa-dollar-sign"></i></div>
                  <div>
                    <strong>Transparent Pricing</strong>
                    <span>Know costs upfront</span>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><i className="fas fa-map-marker-alt"></i></div>
                  <div>
                    <strong>Location-Based</strong>
                    <span>Find vendors near you</span>
                  </div>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon"><i className="fas fa-calendar-check"></i></div>
                  <div>
                    <strong>Real-Time Availability</strong>
                    <span>Book instantly</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-image-side">
              <div className="feature-mockup">
                <div className="mockup-browser">
                  <div className="browser-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <div className="mockup-content">
                    <div className="mock-filter-bar">
                      <div className="mock-filter"><i className="fas fa-map-marker-alt"></i> Toronto</div>
                      <div className="mock-filter"><i className="fas fa-users"></i> 50-100</div>
                      <div className="mock-filter"><i className="fas fa-dollar-sign"></i> $$</div>
                    </div>
                    <div className="mock-results">
                      <div className="mock-card"></div>
                      <div className="mock-card"></div>
                      <div className="mock-card"></div>
                    </div>
                  </div>
                </div>
                <div className="floating-stat floating-stat-2">
                  <i className="fas fa-bolt"></i>
                  <span>Avg 2hr response</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Book securely, stress-free (How-To Part 2) */}
      <section className="feature-showcase-section">
        <div 
          id="feature-booking" 
          className={`feature-row animate-section ${visibleSections.has('feature-booking') ? 'visible' : ''}`}
        >
          <div className="feature-row-content">
            <div className="feature-text-side">
              <div className="feature-badge feature-badge-blue">
                <i className="fas fa-shield-alt"></i>
                <span>Secure & Easy</span>
              </div>
              <h2>Book securely, stress-free</h2>
              <p>Pay safely through our platform, chat directly with vendors, and manage everything from your <strong>free account</strong>. Our support team has your back.</p>
              <div className="security-badges">
                <div className="security-badge">
                  <i className="fas fa-lock"></i>
                  <span>Secure Payments</span>
                </div>
                <div className="security-badge">
                  <i className="fas fa-comments"></i>
                  <span>Direct Messaging</span>
                </div>
                <div className="security-badge">
                  <i className="fas fa-headset"></i>
                  <span>24/7 Support</span>
                </div>
              </div>
              <button className="feature-cta feature-cta-dark" onClick={() => { window.scrollTo(0, 0); navigate('/explore'); }}>
                Start Planning <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            <div className="feature-image-side">
              <div className="booking-visual">
                <div className="booking-card">
                  <div className="booking-header">
                    <i className="fas fa-calendar-check"></i>
                    <span>Booking Confirmed</span>
                  </div>
                  <div className="booking-details">
                    <div className="booking-vendor">
                      <img src="/images/landing/slide-music.jpg" alt="Vendor" />
                      <div>
                        <strong>Elite Photography</strong>
                        <span>Wedding Package</span>
                      </div>
                    </div>
                    <div className="booking-info">
                      <div><i className="fas fa-calendar"></i> June 15, 2024</div>
                      <div><i className="fas fa-clock"></i> 4:00 PM - 10:00 PM</div>
                    </div>
                    <div className="booking-status">
                      <i className="fas fa-check-circle"></i> Payment Secured
                    </div>
                  </div>
                </div>
                <div className="floating-stat floating-stat-3">
                  <i className="fas fa-heart"></i>
                  <span>10K+ happy customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Discover top event spaces in Canada (Location Discovery) */}
      <section className="cities-section">
        <div className="section-container">
          <h2>Discover top event spaces in Canada</h2>
          <p className="section-subtitle">Explore vendors in popular Canadian cities</p>
          <div className="cities-grid">
            {cities.map((city, index) => (
              <div 
                key={index} 
                className="city-card"
                onClick={() => handleCityClick(city.name)}
              >
                <img src={city.image} alt={city.name} />
                <div className="city-overlay">
                  <h3>{city.shortName}</h3>
                  <p>{city.vendorCount}+ vendors</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Book with confidence (Social Proof) */}
      <section className="feature-showcase-section">
        <div 
          id="feature-reviews" 
          className={`feature-row feature-row-reverse animate-section ${visibleSections.has('feature-reviews') ? 'visible' : ''}`}
        >
          <div className="feature-row-content">
            <div className="feature-text-side">
              <div className="feature-badge feature-badge-green">
                <i className="fas fa-star"></i>
                <span>Verified Reviews</span>
              </div>
              <h2>Book with confidence</h2>
              <p>Read <strong>authentic reviews</strong> from real customers who've hosted events. Every review is verified, so you can trust what you read.</p>
              <div className="review-preview">
                <div className="review-card">
                  <div className="review-header">
                    <div className="reviewer-avatar">JM</div>
                    <div>
                      <strong>Jessica M.</strong>
                      <div className="review-stars">
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                      </div>
                    </div>
                  </div>
                  <p>"Found our wedding photographer through Planbeau. The process was so easy and the results were amazing!"</p>
                </div>
              </div>
            </div>
            <div className="feature-image-side">
              <div className="reviews-collage">
                <img src="/images/landing/slide-events.jpg" alt="Events" className="collage-main" />
                <div className="review-bubble review-bubble-1">
                  <div className="bubble-stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
                  <span>"Absolutely perfect!"</span>
                </div>
                <div className="review-bubble review-bubble-2">
                  <div className="bubble-stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
                  <span>"Best decision ever"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. List your business for free (Footer CTA) */}
      <section className="vendor-cta-banner">
        <div className="section-container">
          <div className="vendor-cta-content">
            <div className="vendor-cta-image">
              <img src="/images/landing/venue-feature.jpg" alt="Grow your business" />
            </div>
            <div className="vendor-cta-text">
              <h2>List your business for free and get more bookings!</h2>
              <p>We are Canada's fastest-growing online marketplace for event vendors, giving you direct access to the right customers.</p>
              <button className="vendor-cta-btn" onClick={() => { window.scrollTo(0, 0); navigate('/become-a-vendor'); }}>
                Become a Vendor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      <MessagingWidget />
      <MobileBottomNav 
        onOpenDashboard={(section) => {
          // LandingPage is for unauthenticated users, so just open profile modal
          setProfileModalOpen(true);
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
      />
    </PageLayout>
  );
}

export default LandingPage;
