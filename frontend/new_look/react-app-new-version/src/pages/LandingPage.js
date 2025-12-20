import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config';
import VendorSection from '../components/VendorSection';
import VendorCard from '../components/VendorCard';
import Footer from '../components/Footer';
import MessagingWidget from '../components/MessagingWidget';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [discoverySections, setDiscoverySections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  
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
      navigate('/explore');
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
    <div className="landing-page">
      {/* Header */}
      <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-header-content">
          <div className="landing-logo" onClick={() => navigate('/')}>
            <img src="/planhive_logo.svg" alt="PlanHive" />
          </div>
          <nav className="landing-nav">
            <a href="/become-a-vendor" className="nav-link">Become a Vendor</a>
            {currentUser ? (
              <button className="nav-btn login-btn" onClick={() => { window.scrollTo(0, 0); navigate('/explore'); }}>
                Go to App
              </button>
            ) : (
              <button className="nav-btn login-btn" onClick={() => { window.scrollTo(0, 0); navigate('/explore'); }}>
                Log in
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section - Full Screen Slideshow */}
      <section className="hero-section-fullscreen">
        {/* Background Slideshow */}
        <div className="hero-slideshow">
          {heroSlides.map((slide, index) => (
            <div 
              key={index}
              className={`hero-slide ${index === activeSlide ? 'active' : ''}`}
            >
              <img 
                src={slide.image} 
                alt={slide.label}
              />
            </div>
          ))}
          <div className="hero-overlay"></div>
        </div>
        
        <div className="hero-center-content">
          {/* Clickable Icons */}
          <div className="hero-icons">
            {heroSlides.map((slide, index) => (
              <button
                key={index}
                className={`hero-icon-btn ${index === activeSlide ? 'active' : ''}`}
                onClick={() => setActiveSlide(index)}
                title={slide.label}
              >
                <i className={`fas ${slide.icon}`}></i>
              </button>
            ))}
          </div>
          
          {/* Fixed Title - doesn't change with slides to prevent layout shift */}
          <h1>Celebrate<br/>in venues big and small</h1>
          
          {/* Search Bar - Image 1 Style (Where + When + Search) */}
          <form className="hero-search-bar-styled" onSubmit={handleSearch}>
            <div className="search-field-group">
              <label>Where?</label>
              <div className="field-input-wrapper">
                <input 
                  ref={locationInputRef}
                  type="text" 
                  placeholder="Toronto, Ontario"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
                <i className="fas fa-crosshairs location-icon"></i>
              </div>
            </div>
            <div className="search-divider-line"></div>
            <div className="search-field-group">
              <label>When?</label>
              <input 
                type="text" 
                placeholder="Pick the date"
                value={searchGuests}
                onChange={(e) => setSearchGuests(e.target.value)}
              />
            </div>
            <button type="submit" className="search-btn-styled">
              <i className="fas fa-search"></i>
              Search
            </button>
          </form>
        </div>
        
        <div className="hero-scroll-indicator">
          <div className="scroll-dots">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === activeSlide ? 'active' : ''}`}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Discover Cities Section */}
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

      {/* Browse by Category Section - Horizontal Scroll */}
      <section className="category-carousel-section">
        <div className="section-container">
          <h2>Browse by vendor type</h2>
          <p className="section-subtitle">Find the perfect vendors for every aspect of your event</p>
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

      {/* Divider before discovery sections */}
      <div className="section-divider"></div>

      {/* First Discovery Section */}
      {!loading && discoverySections[0] && discoverySections[0].vendors?.length > 0 && (
        <section className="featured-vendors-section">
          <div className="section-container">
            <div className="landing-discovery-row">
              <VendorSection
                title={discoverySections[0].title}
                description={discoverySections[0].description}
                vendors={discoverySections[0].vendors}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onViewVendor={(vendorId) => { window.scrollTo(0, 0); navigate(`/vendor/${vendorId}`); }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Why PlanHive Section - Image 5 Style (Moved Higher) */}
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

      {/* Second Discovery Section */}
      {!loading && discoverySections[1] && discoverySections[1].vendors?.length > 0 && (
        <section className="featured-vendors-section">
          <div className="section-container">
            <div className="landing-discovery-row">
              <VendorSection
                title={discoverySections[1].title}
                description={discoverySections[1].description}
                vendors={discoverySections[1].vendors}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onViewVendor={(vendorId) => { window.scrollTo(0, 0); navigate(`/vendor/${vendorId}`); }}
              />
            </div>
          </div>
        </section>
      )}

      {/* PlanHive - Your Trusted Vendor Marketplace Section */}
      <section className="trusted-marketplace-section">
        <div className="section-container">
          <h2>PlanHive - your trusted vendor marketplace</h2>
          <p className="marketplace-subtitle">
            Join thousands of event organizers enjoying a stress-free vendor search every month. With us, any event can find the right vendors, and vendors can grow their business.
          </p>
          <div className="marketplace-features">
            <div className="marketplace-feature">
              <div className="feature-icon-box">
                <i className="fas fa-th-large"></i>
              </div>
              <h3>Discover unique vendors for any event</h3>
              <p>We list over 500+ vendors across Canada. You'll find the right one among photographers, caterers, venues, DJs, decorators, and more.</p>
            </div>
            <div className="marketplace-feature">
              <div className="feature-icon-box">
                <i className="fas fa-sliders-h"></i>
              </div>
              <h3>Find the perfect fit with smart tools</h3>
              <p>Use intuitive filters to customize your search by budget, guest count, amenities, cancellation flexibility, and more. See real prices and response times upfront.</p>
            </div>
            <div className="marketplace-feature">
              <div className="feature-icon-box">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Check verified reviews before you book</h3>
              <p>Feel confident in your choice by hearing from people who have been there: read reviews from real users who have hosted events with vendors on our platform.</p>
            </div>
            <div className="marketplace-feature">
              <div className="feature-icon-box">
                <i className="fas fa-handshake"></i>
              </div>
              <h3>Make a secure, hassle-free booking</h3>
              <p>Pay for your booking securely, chat directly with vendors, and manage everything with your free account. It's quick, easy, and backed by our dedicated support team.</p>
            </div>
          </div>
        </div>
      </section>


      {/* Vendor CTA Section - List Your Business */}
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


      {/* Fourth Discovery Section */}
      {!loading && discoverySections[3] && discoverySections[3].vendors?.length > 0 && (
        <section className="featured-vendors-section">
          <div className="section-container">
            <div className="landing-discovery-row">
              <VendorSection
                title={discoverySections[3].title}
                description={discoverySections[3].description}
                vendors={discoverySections[3].vendors}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onViewVendor={(vendorId) => { window.scrollTo(0, 0); navigate(`/vendor/${vendorId}`); }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Engagement CTA Section */}
      <section className="engagement-cta-section">
        <div className="section-container">
          <div className="engagement-content">
            <h2>Ready to Plan Your Perfect Event?</h2>
            <p>Browse thousands of verified vendors across Canada. Find photographers, caterers, venues, DJs, and more.</p>
            <div className="engagement-buttons">
              <button className="cta-primary" onClick={() => { window.scrollTo(0, 0); navigate('/explore'); }}>
                Explore Vendors
              </button>
              <button className="cta-secondary" onClick={() => { window.scrollTo(0, 0); navigate('/become-a-vendor'); }}>
                Become a Vendor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      <MessagingWidget />
    </div>
  );
}

export default LandingPage;
