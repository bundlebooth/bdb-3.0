import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';
import VendorGallery from '../components/VendorGallery';
import VendorCard from '../components/VendorCard';
import ServiceCard from '../components/ServiceCard';
import SkeletonLoader from '../components/SkeletonLoader';
import ProfileModal from '../components/ProfileModal';
import DashboardModal from '../components/DashboardModal';
import Footer from '../components/Footer';
import MobileBottomNav from '../components/MobileBottomNav';
import Breadcrumb from '../components/Breadcrumb';
import SetupIncompleteBanner from '../components/SetupIncompleteBanner';
import MessagingWidget from '../components/MessagingWidget';
import { useVendorOnlineStatus } from '../hooks/useOnlineStatus';
import { showBanner } from '../utils/helpers';
import { extractVendorIdFromSlug, parseQueryParams, trackPageView, buildBookingUrl } from '../utils/urlHelpers';
import './VendorProfilePage.css';

function VendorProfilePage() {
  const { vendorSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract vendor ID from slug (supports both "138" and "business-name-138")
  const vendorId = extractVendorIdFromSlug(vendorSlug) || vendorSlug;
  const { currentUser } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState('dashboard');


  // Handle opening map - navigate to explore page with map open
  const handleOpenMap = () => {
    navigate('/?map=true');
  };
  const [vendorFeatures, setVendorFeatures] = useState([]);
  const [portfolioAlbums, setPortfolioAlbums] = useState([]);
  const [recommendations, setRecommendations] = useState({ similar: [], nearby: [], popular: [] });
  const [activeRecommendationTab, setActiveRecommendationTab] = useState('similar');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [socialMedia, setSocialMedia] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [team, setTeam] = useState([]);
  const [googleReviews, setGoogleReviews] = useState(null);
  const [googleReviewsLoading, setGoogleReviewsLoading] = useState(false);
  const [showGoogleReviews, setShowGoogleReviews] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(0);
  const [reviewsPerPage] = useState(5);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Get online status for this vendor
  const { statuses: onlineStatuses } = useVendorOnlineStatus(
    vendorId ? [vendorId] : [],
    { enabled: !!vendorId, refreshInterval: 180000 } // 3 minutes
  );
  const vendorOnlineStatus = vendorId ? onlineStatuses[vendorId] : null;

  const loadVendorProfile = useCallback(async () => {
    try {
      setLoading(true);
      const userId = currentUser?.id || '';
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load vendor profile');
      }

      const data = await response.json();
      const vendorDetails = data.data;
      
      setVendor(vendorDetails);
      setIsFavorite(vendorDetails.isFavorite || false);
      setSocialMedia(vendorDetails.socialMedia || []);
      setServiceAreas(vendorDetails.serviceAreas || []);
      setTeam(vendorDetails.team || []);
      
      // Load additional data
      if (vendorDetails.profile?.VendorProfileID) {
        loadVendorFeatures(vendorDetails.profile.VendorProfileID);
        loadPortfolioAlbums(vendorDetails.profile.VendorProfileID);
        loadRecommendations(vendorId, vendorDetails);
        
        // Load Google Reviews if Google Place ID exists
        if (vendorDetails.profile.GooglePlaceId) {
          loadGoogleReviews(vendorDetails.profile.GooglePlaceId);
        }

        // Auto-toggle to Google Reviews if no in-app reviews
        if (vendorDetails.reviews.length === 0 && vendorDetails.profile.GooglePlaceId) {
          setShowGoogleReviews(true);
        }
      }
      
      // Update page title
      document.title = `${vendorDetails.profile.BusinessName || vendorDetails.profile.DisplayName} - PlanBeau`;
      
      // Track page view with URL parameters
      const queryParams = parseQueryParams(location.search);
      trackPageView('Vendor Profile', {
        vendorId,
        vendorName: vendorDetails.profile.BusinessName,
        category: vendorDetails.profile.PrimaryCategory,
        ...queryParams
      });
    } catch (error) {
      console.error('Error loading vendor profile:', error);
      showBanner('Failed to load vendor profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [vendorId, currentUser, location.search]);

  // Load vendor features (questionnaire)
  const loadVendorFeatures = useCallback(async (vendorProfileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor-features/vendor/${vendorProfileId}`);
      if (response.ok) {
        const data = await response.json();
        setVendorFeatures(data.selectedFeatures || []);
      }
    } catch (error) {
      console.error('Error loading vendor features:', error);
    }
  }, []);

  // Load portfolio albums
  const loadPortfolioAlbums = useCallback(async (vendorProfileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/portfolio/albums/public`);
      if (response.ok) {
        const data = await response.json();
        setPortfolioAlbums(data.albums || []);
      }
    } catch (error) {
      console.error('Error loading portfolio albums:', error);
    }
  }, []);

  // Load Google Reviews
  const loadGoogleReviews = useCallback(async (googlePlaceId) => {
    try {
      setGoogleReviewsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/vendors/google-reviews/${googlePlaceId}`);
      if (response.ok) {
        const data = await response.json();
        setGoogleReviews(data.data);
      } else {
        console.warn('Google Reviews not available:', response.status);
      }
    } catch (error) {
      console.error('Error loading Google Reviews:', error);
    } finally {
      setGoogleReviewsLoading(false);
    }
  }, []);

  // Load recommendations
  const loadRecommendations = useCallback(async (vendorId, vendorData) => {
    try {
      // Load similar vendors
      const category = vendorData.profile?.PrimaryCategory || vendorData.profile?.Category;
      const similarUrl = category 
        ? `${API_BASE_URL}/vendors?category=${encodeURIComponent(category)}&pageSize=8`
        : `${API_BASE_URL}/vendors?pageSize=8&sortBy=rating`;
      
      const similarResponse = await fetch(similarUrl);
      if (similarResponse.ok) {
        const similarData = await similarResponse.json();
        const similar = (similarData.vendors || similarData.data || []).filter(v => v.VendorProfileID != vendorId);
        setRecommendations(prev => ({ ...prev, similar }));
      }

      // Load nearby vendors
      const latitude = vendorData.profile?.Latitude;
      const longitude = vendorData.profile?.Longitude;
      if (latitude && longitude) {
        const nearbyResponse = await fetch(
          `${API_BASE_URL}/vendors?latitude=${latitude}&longitude=${longitude}&radiusMiles=25&pageSize=8&sortBy=nearest`
        );
        if (nearbyResponse.ok) {
          const nearbyData = await nearbyResponse.json();
          const nearby = (nearbyData.data || []).filter(v => v.VendorProfileID !== vendorId);
          setRecommendations(prev => ({ ...prev, nearby }));
        }
      }

      // Load popular vendors
      const popularResponse = await fetch(`${API_BASE_URL}/vendors?pageSize=8&sortBy=rating`);
      if (popularResponse.ok) {
        const popularData = await popularResponse.json();
        const popular = (popularData.data || []).filter(v => v.VendorProfileID !== vendorId);
        setRecommendations(prev => ({ ...prev, popular }));
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  }, []);

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

  useEffect(() => {
    if (vendorId) {
      loadVendorProfile();
    }
  }, [vendorId, loadVendorProfile]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Track profile view when visiting vendor page
  useEffect(() => {
    if (vendorId) {
      // Generate or retrieve session ID for deduplication
      let sessionId = sessionStorage.getItem('vv_session_id');
      if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('vv_session_id', sessionId);
      }
      
      // Track the profile view
      const trackView = async () => {
        try {
          await fetch(`${API_BASE_URL}/analytics/track-view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              vendorId: vendorId,
              referrerUrl: document.referrer || window.location.href,
              sessionId: sessionId
            })
          });
        } catch (error) {
          // Silently fail - view tracking is not critical
          console.debug('Profile view tracking failed:', error);
        }
      };
      
      trackView();
    }
  }, [vendorId]);

  // Scroll to top when component mounts or vendorId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [vendorId]);

  const handleToggleFavorite = async () => {
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
        body: JSON.stringify({
          userId: currentUser.id,
          vendorProfileId: vendorId
        })
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');

      const result = await response.json();
      setIsFavorite(result.IsFavorite);
      showBanner(
        result.IsFavorite ? 'Vendor saved to favorites' : 'Vendor removed from favorites',
        'favorite'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showBanner('Failed to update favorites', 'error');
    }
  };

  // Handle favorite toggle for recommendation cards
  const handleRecommendationFavorite = async (recommendationVendorId) => {
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
        body: JSON.stringify({
          userId: currentUser.id,
          vendorProfileId: recommendationVendorId
        })
      });

      if (!response.ok) throw new Error('Failed to toggle favorite');

      const result = await response.json();
      
      // Update favorites list
      if (result.IsFavorite) {
        setFavorites(prev => [...prev, { vendorProfileId: recommendationVendorId }]);
      } else {
        setFavorites(prev => prev.filter(fav => fav.vendorProfileId !== recommendationVendorId));
      }
      
      showBanner(
        result.IsFavorite ? 'Vendor saved to favorites' : 'Vendor removed from favorites',
        'favorite'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showBanner('Failed to update favorites', 'error');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const vendorName = vendor?.profile?.BusinessName || 'this vendor';

    if (navigator.share) {
      try {
        await navigator.share({
          title: vendorName,
          text: `Check out ${vendorName} on PlanBeau!`,
          url: url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showBanner('Link copied to clipboard!', 'success');
    }).catch(() => {
      showBanner('Failed to copy link', 'error');
    });
  };

  const handleRequestBooking = () => {
    // Allow navigation to booking page without login - login will be required at submission
    const bookingUrl = buildBookingUrl(
      { 
        VendorProfileID: vendorId, 
        BusinessName: vendor?.BusinessName || vendor?.Name || 'vendor'
      },
      {
        source: 'profile'
      }
    );
    navigate(bookingUrl);
  };

  const handleMessageVendor = async () => {
    if (!currentUser) {
      setProfileModalOpen(true);
      return;
    }
    
    try {
      // Create or get existing conversation with this vendor
      const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          vendorProfileId: vendorId,
          subject: `Inquiry about ${profile?.BusinessName || 'your services'}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Dispatch custom event to open messaging widget with this conversation
        window.dispatchEvent(new CustomEvent('openMessagingWidget', { 
          detail: { 
            conversationId: data.conversationId,
            vendorName: profile?.BusinessName,
            vendorProfileId: vendorId
          } 
        }));
        showBanner('Opening conversation...', 'success');
      } else {
        // Fallback: just open the messaging widget
        window.dispatchEvent(new CustomEvent('openMessagingWidget', { 
          detail: { vendorProfileId: vendorId, vendorName: profile?.BusinessName } 
        }));
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      // Fallback: just open the messaging widget
      window.dispatchEvent(new CustomEvent('openMessagingWidget', { 
        detail: { vendorProfileId: vendorId, vendorName: profile?.BusinessName } 
      }));
    }
  };

  // Render social media icons
  const renderSocialMediaIcons = () => {
    if (!socialMedia || (socialMedia.length === 0 && !profile.Website)) {
      return null;
    }

    const platformIcons = {
      'facebook': 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
      'instagram': 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
      'twitter': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
      'x': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
      'linkedin': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
      'youtube': 'https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png'
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
        {socialMedia.map((social, index) => {
          const iconUrl = platformIcons[social.Platform.toLowerCase()] || 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Globe_icon.svg';
          const url = social.URL.startsWith('http') ? social.URL : `https://${social.URL}`;
          return (
            <a key={index} href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', opacity: 0.7, transition: 'all 0.2s' }}
               onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
               onMouseOut={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <img src={iconUrl} className="social-icon-small" alt={social.Platform} />
            </a>
          );
        })}
        {profile.Website && (
          <a href={profile.Website.startsWith('http') ? profile.Website : `https://${profile.Website}`} target="_blank" rel="noopener noreferrer"
             style={{ textDecoration: 'none', opacity: 0.7, transition: 'all 0.2s' }}
             onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
             onMouseOut={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Globe_icon.svg" className="social-icon-small" alt="Website" />
          </a>
        )}
      </div>
    );
  };

  // Icon mapping for vendor features
  const getFeatureIcon = (featureName, categoryName) => {
    const iconMap = {
      // Venue Features
      'Indoor Ceremony Space': 'home',
      'Outdoor Ceremony Space': 'tree',
      'Wheelchair Accessible': 'wheelchair',
      'Parking Available': 'parking',
      'Garden/Outdoor Space': 'leaf',
      'WiFi Available': 'wifi',
      'Dance Floor': 'music',
      'Stage/Platform': 'theater-masks',
      'On-Site Catering': 'utensils',
      'Sound System Included': 'volume-up',
      'Scenic Views': 'eye',
      'Private Dressing Rooms': 'door-closed',
      
      // Photography & Video
      'Engagement Session': 'heart',
      
      // Music & Entertainment
      'Live Band': 'guitar',
      
      // Catering & Bar
      'Full Bar Service': 'cocktail',
      'Beer Selection': 'beer',
      
      // Event Planning
      'Contract Review': 'file-contract',
      
      // Beauty & Fashion Services
      'On-Location Services': 'map-marker-alt',
      'Airbrush Makeup': 'spray-can',
      'Custom Gown Design': 'tshirt'
    };

    return iconMap[featureName] || iconMap[categoryName] || 'check';
  };

  // Render vendor features (questionnaire)
  const renderVendorFeatures = () => {
    if (!vendorFeatures || vendorFeatures.length === 0) return null;

    // Group features by category
    const categorizedFeatures = {};
    vendorFeatures.forEach(feature => {
      const category = feature.CategoryName || 'Other';
      if (!categorizedFeatures[category]) {
        categorizedFeatures[category] = [];
      }
      categorizedFeatures[category].push(feature);
    });

    return (
      <div className="content-section">
        <h2>What this place offers</h2>
        <div>
          {Object.keys(categorizedFeatures).map((categoryName, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '2rem', padding: '1.5rem 0', borderBottom: '1px solid #ebebeb', alignItems: 'start' }} className="vendor-feature-row">
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#222' }}>{categoryName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem 1.5rem' }} className="vendor-feature-grid">
                {categorizedFeatures[categoryName].map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <i className={`fas fa-${getFeatureIcon(feature.FeatureName, categoryName)}`} style={{ width: '14px', height: '14px', fontSize: '0.75rem', color: '#717171', flexShrink: 0 }}></i>
                    <span style={{ fontSize: '0.9375rem', color: '#222', lineHeight: 1.4 }}>{feature.FeatureName}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render location and service areas with enhanced Google Maps
  const renderLocationAndServiceAreas = () => {
    const hasLocation = profile.Latitude && profile.Longitude;
    const hasAddress = profile.Address || profile.City;
    const hasServiceAreas = serviceAreas && serviceAreas.length > 0;

    if (!hasLocation && !hasAddress && !hasServiceAreas) return null;

    return (
      <div className="content-section" id="location-section">
        <h2>Where you'll find us</h2>
        
        {/* Google Maps - Show if we have coordinates OR address */}
        {(hasLocation || hasAddress) && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <iframe
                width="100%"
                height="400"
                frameBorder="0"
                style={{ border: 0, display: 'block' }}
                referrerPolicy="no-referrer-when-downgrade"
                src={hasLocation 
                  ? `https://maps.google.com/maps?q=${profile.Latitude},${profile.Longitude}&hl=en&z=15&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent([profile.Address, profile.City, profile.State].filter(Boolean).join(', '))}&hl=en&z=15&output=embed`
                }
                allowFullScreen
                loading="lazy"
              ></iframe>
              
              {/* Address overlay */}
              <div style={{ 
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)',
                color: 'white',
                padding: '1.5rem 1rem 1rem',
                backdropFilter: 'blur(4px)'
              }}>
                <div style={{ 
                  fontSize: '0.875rem', 
                  opacity: 0.9,
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fas fa-map-marker-alt"></i>
                  <span>Business Location</span>
                </div>
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '500',
                  lineHeight: '1.4'
                }}>
                  {[profile.Address, profile.City, profile.State, profile.PostalCode, profile.Country].filter(Boolean).join(', ') || 'Address available upon booking'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Areas */}
        {hasServiceAreas && (
          <div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              color: '#111827',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-route" style={{ color: '#3b82f6', fontSize: '0.875rem' }}></i>
              Areas We Serve
            </h3>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '0.5rem' 
            }}>
              {serviceAreas.map((area, index) => {
                const location = [area.CityName, area.StateProvince, area.Country].filter(Boolean).join(', ');
                return (
                  <div key={index} style={{ 
                    background: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px', 
                    padding: '0.5rem 0.75rem',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.875rem'
                  }}>
                    <i className="fas fa-map-marker-alt" style={{ 
                      color: '#3b82f6', 
                      fontSize: '0.7rem' 
                    }}></i>
                    <span style={{ fontWeight: 500, color: '#111827' }}>{location}</span>
                    {area.TravelCost && parseFloat(area.TravelCost) > 0 && (
                      <span style={{ color: '#6b7280', fontSize: '0.8rem', marginLeft: '0.25rem' }}>
                        (${parseFloat(area.TravelCost).toFixed(0)} fee)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render portfolio albums
  const renderPortfolioAlbums = () => {
    if (!portfolioAlbums || portfolioAlbums.length === 0) return null;

    return (
      <div className="content-section">
        <h2>Portfolio</h2>
        <div className="portfolio-grid">
          {portfolioAlbums.map((album, index) => (
            <div key={index} className="portfolio-album" onClick={() => {}}>
              <div style={{ position: 'relative', paddingTop: '66%', background: 'var(--bg-dark)' }}>
                {album.CoverImageURL ? (
                  <img src={album.CoverImageURL} alt={album.AlbumName} className="portfolio-album-image" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-folder-open" style={{ fontSize: '3rem', color: 'var(--text-light)', opacity: 0.5 }}></i>
                  </div>
                )}
                <div className="portfolio-album-badge">
                  <i className="fas fa-images"></i> {album.ImageCount || 0}
                </div>
              </div>
              <div className="portfolio-album-info">
                <h4>{album.AlbumName}</h4>
                {album.AlbumDescription && <p>{album.AlbumDescription}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render team members
  const renderTeam = () => {
    if (!team || team.length === 0) return null;

    return (
      <div className="content-section">
        <h2>Meet the team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {team.map((member, index) => (
            <div key={index} className="team-member-card">
              {member.PhotoURL && <img src={member.PhotoURL} alt={member.Name} className="team-member-photo" />}
              <h4 className="team-member-name">{member.Name}</h4>
              <p className="team-member-role">{member.Role}</p>
              {member.Bio && <p className="team-member-bio">{member.Bio}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render enhanced services with better formatting using unified ServiceCard
  const renderEnhancedServices = () => {
    if (!services || services.length === 0) return null;

    return (
      <div className="content-section">
        <h2>What we offer</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {services.map((service, index) => (
            <ServiceCard key={index} service={service} variant="display" />
          ))}
        </div>
      </div>
    );
  };

  // Render enhanced FAQs with multiple choice support
  const renderEnhancedFAQs = () => {
    if (!faqs || faqs.length === 0) return null;

    return (
      <div className="content-section">
        <h2>Things to know</h2>
        <div>
          {faqs.map((faq, index) => {
            const answerType = (faq.AnswerType || '').trim().toLowerCase();
            const hasAnswerOptions = faq.AnswerOptions && faq.AnswerOptions !== 'null' && faq.AnswerOptions !== '';
            
            let answerContent = null;

            if ((answerType === 'multiple choice' || answerType === 'multiple_choice') && hasAnswerOptions) {
              try {
                let options = typeof faq.AnswerOptions === 'string' ? JSON.parse(faq.AnswerOptions) : faq.AnswerOptions;
                
                if (Array.isArray(options) && options.length > 0) {
                  if (options[0] && typeof options[0] === 'object' && 'label' in options[0]) {
                    const checkedOptions = options.filter(opt => opt.checked === true).map(opt => opt.label);
                    
                    if (checkedOptions.length > 0) {
                      answerContent = (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                          {checkedOptions.map((label, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="fas fa-check" style={{ color: '#3b82f6', fontSize: '0.875rem' }}></i>
                              <span style={{ color: '#2d3748', fontSize: '0.9375rem' }}>{label}</span>
                            </div>
                          ))}
                        </div>
                      );
                    } else {
                      answerContent = <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>No options selected</div>;
                    }
                  } else {
                    answerContent = (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {options.map((option, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-check" style={{ color: '#3b82f6', fontSize: '0.875rem' }}></i>
                            <span style={{ color: '#2d3748', fontSize: '0.9375rem' }}>{option}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                } else {
                  answerContent = <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>{faq.Answer || 'No answer provided'}</div>;
                }
              } catch (e) {
                answerContent = <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>{faq.Answer || 'No answer provided'}</div>;
              }
            } else {
              answerContent = <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.6 }}>{faq.Answer || 'No answer provided'}</div>;
            }

            return (
              <div key={index} style={{ padding: '1.5rem 0', borderBottom: index < faqs.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '1rem', marginBottom: '0.75rem' }}>
                  {faq.Question}
                </div>
                {answerContent}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render reviews section with toggle switch
  const renderReviewsSection = () => {
    const hasGoogleReviews = googleReviews && (googleReviews.reviews?.length > 0 || googleReviews.rating > 0);
    const hasPlatformReviews = reviews && reviews.length > 0;
    
    // Don't show section if no reviews at all
    if (!hasGoogleReviews && !hasPlatformReviews && !googleReviewsLoading) return null;

    // Get current reviews to display
    const currentReviews = showGoogleReviews ? (googleReviews?.reviews || []) : reviews;
    const totalReviews = currentReviews.length;
    const startIndex = currentReviewPage * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    const displayedReviews = currentReviews.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalReviews / reviewsPerPage);

    // Get vendor name
    const vendorName = vendor?.profile?.BusinessName || vendor?.profile?.DisplayName || 'This Vendor';

    return (
      <div className="content-section" id="reviews-section">
        {/* Header */}
        <h2 style={{ marginBottom: '1.5rem' }}>Reviews for {vendorName}</h2>

        {/* Rating with Toggle on same row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)'
        }}>
          {/* Rating Display - Left side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 700, 
              color: 'var(--text)', 
              lineHeight: 1
            }}>
              {showGoogleReviews ? (googleReviews?.rating?.toFixed(1) || '4.8') : '4.9'}
            </div>
            <div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--primary)',
                marginBottom: '0.125rem'
              }}>
                {'★'.repeat(5)}
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-light)'
              }}>
                Based on {showGoogleReviews ? (googleReviews?.user_ratings_total || 565) : (reviews?.length || 91)} {showGoogleReviews ? 'Google ' : ''}reviews
              </div>
            </div>
          </div>

          {/* Toggle Switch - Right side, same row */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem'
          }}>
            <span style={{ 
              fontSize: '0.75rem', 
              color: showGoogleReviews ? 'var(--text-light)' : 'var(--primary)', 
              fontWeight: showGoogleReviews ? 400 : 600,
              transition: 'all 0.2s'
            }}>
              PlanBeau
            </span>
            
            <div 
              onClick={() => {
                setShowGoogleReviews(!showGoogleReviews);
                setCurrentReviewPage(0);
              }}
              style={{
                width: '40px',
                height: '20px',
                backgroundColor: showGoogleReviews ? 'var(--primary)' : '#e2e8f0',
                borderRadius: '10px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                backgroundColor: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: showGoogleReviews ? '22px' : '2px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
              }} />
            </div>
            
            <span style={{ 
              fontSize: '0.75rem', 
              color: showGoogleReviews ? 'var(--primary)' : 'var(--text-light)', 
              fontWeight: showGoogleReviews ? 600 : 400,
              transition: 'all 0.2s'
            }}>
              Google
            </span>
          </div>
        </div>

        {/* Review Content */}
        <div>
          {googleReviewsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-light)' }}>Loading reviews...</div>
            </div>
          ) : displayedReviews.length > 0 ? (
            <>
              {displayedReviews.map((review, index) => (
                <div key={index} style={{ 
                  padding: '1.5rem 0', 
                  borderBottom: index < displayedReviews.length - 1 ? '1px solid var(--border)' : 'none' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    {/* Reviewer Avatar */}
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: showGoogleReviews && review.profile_photo_url ? `url(${review.profile_photo_url})` : 'var(--primary)', 
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}>
                      {(!showGoogleReviews || !review.profile_photo_url) && (
                        showGoogleReviews 
                          ? (review.author_name?.charAt(0) || '?')
                          : (review.ReviewerName?.charAt(0) || 'A')
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      {/* Reviewer Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>
                          {showGoogleReviews ? (review.author_name || 'Anonymous') : (review.ReviewerName || 'Anonymous')}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                          {showGoogleReviews 
                            ? (review.relative_time_description || '')
                            : new Date(review.CreatedAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long' 
                              })
                          }
                        </div>
                      </div>

                      {/* Rating */}
                      <div style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                        {'★'.repeat(showGoogleReviews ? (review.rating || 0) : review.Rating)}{'☆'.repeat(5 - (showGoogleReviews ? (review.rating || 0) : review.Rating))}
                      </div>

                      {/* Review Text */}
                      <div style={{ 
                        color: 'var(--text)', 
                        fontSize: '0.95rem', 
                        lineHeight: 1.6
                      }}>
                        {showGoogleReviews ? (
                          <>
                            {review.text && (review.text.length > 300 ? `${review.text.substring(0, 300)}...` : review.text)}
                            {review.text && review.text.length > 300 && (
                              <button style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--primary)', 
                                cursor: 'pointer', 
                                textDecoration: 'underline',
                                marginLeft: '0.5rem',
                                fontWeight: 500
                              }}>
                                Read more
                              </button>
                            )}
                          </>
                        ) : (
                          review.Comment
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '2rem',
                  padding: '1.5rem 0',
                  borderTop: '1px solid var(--border)'
                }}>
                  <button
                    onClick={() => setCurrentReviewPage(Math.max(0, currentReviewPage - 1))}
                    disabled={currentReviewPage === 0}
                    className="btn btn-outline"
                    style={{
                      opacity: currentReviewPage === 0 ? 0.5 : 1,
                      cursor: currentReviewPage === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <i className="fas fa-chevron-left"></i> Previous
                  </button>
                  
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 500 }}>
                    Page {currentReviewPage + 1} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentReviewPage(Math.min(totalPages - 1, currentReviewPage + 1))}
                    disabled={currentReviewPage === totalPages - 1}
                    className="btn btn-outline"
                    style={{
                      opacity: currentReviewPage === totalPages - 1 ? 0.5 : 1,
                      cursor: currentReviewPage === totalPages - 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
              <i className="fas fa-comment" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
              <div style={{ fontSize: '0.9rem' }}>No {showGoogleReviews ? 'Google' : 'in-app'} reviews yet.</div>
            </div>
          )}
        </div>

        {/* View on Google Link */}
        {hasGoogleReviews && showGoogleReviews && googleReviews?.url && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            marginTop: '1.5rem',
            padding: '1rem 0',
            borderTop: '1px solid var(--border)'
          }}>
            <a 
              href={googleReviews.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--primary)', 
                textDecoration: 'none', 
                fontSize: '0.9rem', 
                fontWeight: 500,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'var(--bg-light)'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              <img 
                src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" 
                alt="Google" 
                style={{ height: '16px' }} 
              />
              View on Google
              <i className="fas fa-external-link-alt" style={{ fontSize: '0.75rem' }}></i>
            </a>
          </div>
        )}
      </div>
    );
  };

  // Render recommendations section as full-width carousel with arrows
  const renderRecommendations = () => {
    const currentRecs = recommendations[activeRecommendationTab] || [];
    const itemWidth = 220;
    const gap = 16;
    const scrollAmount = (itemWidth + gap) * 3; // Scroll 3 cards at a time

    const handleTabChange = (tab) => {
      setActiveRecommendationTab(tab);
      setCarouselIndex(0);
    };

    const scrollLeft = () => {
      setCarouselIndex(prev => Math.max(prev - scrollAmount, 0));
    };

    const scrollRight = () => {
      const maxScroll = Math.max(0, currentRecs.length * (itemWidth + gap) - (typeof window !== 'undefined' ? window.innerWidth - 160 : 1000));
      setCarouselIndex(prev => Math.min(prev + scrollAmount, maxScroll));
    };

    const canScrollLeft = carouselIndex > 0;
    const canScrollRight = currentRecs.length > 4;

    return (
      <div style={{ 
        padding: '3rem 0 2rem 0', 
        marginTop: '2rem',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        background: '#fafafa'
      }}>
        <div style={{ 
          maxWidth: '100%', 
          padding: '0 4rem',
          position: 'relative'
        }}>
          {/* Header with title and navigation arrows */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h2 style={{ 
                fontSize: '1.375rem', 
                fontWeight: '600', 
                color: '#222222',
                marginBottom: '0.75rem'
              }}>
                {activeRecommendationTab === 'similar' && 'Similar vendors'}
                {activeRecommendationTab === 'nearby' && 'Nearby vendors'}
                {activeRecommendationTab === 'popular' && 'Popular vendors'}
              </h2>
              
              {/* Tab buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handleTabChange('similar')}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '16px',
                    border: '1px solid #dddddd',
                    backgroundColor: activeRecommendationTab === 'similar' ? '#222222' : '#ffffff',
                    color: activeRecommendationTab === 'similar' ? '#ffffff' : '#222222',
                    fontWeight: '500',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Similar
                </button>
                <button 
                  onClick={() => handleTabChange('nearby')}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '16px',
                    border: '1px solid #dddddd',
                    backgroundColor: activeRecommendationTab === 'nearby' ? '#222222' : '#ffffff',
                    color: activeRecommendationTab === 'nearby' ? '#ffffff' : '#222222',
                    fontWeight: '500',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Nearby
                </button>
                <button 
                  onClick={() => handleTabChange('popular')}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '16px',
                    border: '1px solid #dddddd',
                    backgroundColor: activeRecommendationTab === 'popular' ? '#222222' : '#ffffff',
                    color: activeRecommendationTab === 'popular' ? '#ffffff' : '#222222',
                    fontWeight: '500',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Popular
                </button>
              </div>
            </div>
            
            {/* Navigation arrows at top right */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #222',
                  backgroundColor: '#fff',
                  cursor: canScrollLeft ? 'pointer' : 'not-allowed',
                  opacity: canScrollLeft ? 1 : 0.3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="fas fa-chevron-left" style={{ fontSize: '12px' }}></i>
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #222',
                  backgroundColor: '#fff',
                  cursor: canScrollRight ? 'pointer' : 'not-allowed',
                  opacity: canScrollRight ? 1 : 0.3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="fas fa-chevron-right" style={{ fontSize: '12px' }}></i>
              </button>
            </div>
          </div>
          
          {/* Horizontal Carousel - Single Row */}
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              transform: `translateX(-${carouselIndex}px)`,
              transition: 'transform 0.3s ease-in-out',
              gap: `${gap}px`
            }}>
              {currentRecs.length > 0 ? (
                currentRecs.map((venue, index) => (
                  <div
                    key={venue.VendorProfileID || venue.id || index}
                    style={{
                      flex: `0 0 ${itemWidth}px`,
                      width: `${itemWidth}px`
                    }}
                  >
                    <VendorCard
                      vendor={venue}
                      isFavorite={favorites.some(fav => fav.vendorProfileId === (venue.VendorProfileID || venue.id))}
                      onToggleFavorite={(vendorId) => handleRecommendationFavorite(vendorId)}
                      onView={(vendorId) => navigate(`/vendor/${vendorId}`)}
                    />
                  </div>
                ))
              ) : (
                <div style={{
                  width: '100%',
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#6b7280'
                }}>
                  <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                  <div>Loading recommendations...</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Header 
          onSearch={() => {}} 
          onProfileClick={() => setProfileModalOpen(true)} 
          onWishlistClick={() => setProfileModalOpen(true)} 
          onChatClick={() => setProfileModalOpen(true)} 
          onNotificationsClick={() => {}} 
        />
        <div style={{ background: '#ffffff', minHeight: '100vh' }}>
          <div className="profile-container" style={{ background: '#ffffff' }}>
            {/* Back Button Skeleton */}
            <div className="skeleton" style={{ width: '150px', height: '40px', borderRadius: '12px', marginBottom: '2rem', background: '#e5e7eb' }}></div>

            {/* Image Gallery Skeleton - White background, no side bars */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '8px', 
              borderRadius: '12px', 
              overflow: 'hidden',
              marginBottom: '1.5rem',
              background: '#ffffff'
            }}>
              {/* Large image */}
              <div style={{ 
                aspectRatio: '4/3', 
                background: '#e5e7eb',
                borderRadius: '12px 0 0 12px',
                animation: 'skeleton-shimmer 1.5s infinite',
                backgroundImage: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                backgroundSize: '200% 100%'
              }}></div>
              {/* Thumbnails grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '8px' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ 
                    background: '#e5e7eb',
                    borderRadius: i === 2 ? '0 12px 0 0' : i === 4 ? '0 0 12px 0' : '0',
                    animation: 'skeleton-shimmer 1.5s infinite',
                    backgroundImage: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
                    backgroundSize: '200% 100%'
                  }}></div>
                ))}
              </div>
            </div>

            {/* Header Skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '60%', height: '36px', marginBottom: '0.75rem', background: '#e5e7eb' }}></div>
                <div className="skeleton" style={{ width: '40%', height: '20px', marginBottom: '0.5rem', background: '#e5e7eb' }}></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#e5e7eb' }}></div>
                <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#e5e7eb' }}></div>
              </div>
            </div>

            {/* Content Layout Skeleton */}
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                {/* About Section Skeleton */}
                <div style={{ marginBottom: '2rem' }}>
                  <div className="skeleton" style={{ width: '200px', height: '28px', marginBottom: '1rem', background: '#e5e7eb' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '20px', marginBottom: '0.5rem', background: '#e5e7eb' }}></div>
                  <div className="skeleton" style={{ width: '90%', height: '20px', marginBottom: '0.5rem', background: '#e5e7eb' }}></div>
                  <div className="skeleton" style={{ width: '80%', height: '20px', background: '#e5e7eb' }}></div>
                </div>

                {/* Services Section Skeleton */}
                <div style={{ marginBottom: '2rem' }}>
                  <div className="skeleton" style={{ width: '180px', height: '28px', marginBottom: '1rem', background: '#e5e7eb' }}></div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ 
                      padding: '1rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '12px', 
                      marginBottom: '1rem',
                      background: '#ffffff'
                    }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#e5e7eb' }}></div>
                        <div style={{ flex: 1 }}>
                          <div className="skeleton" style={{ width: '60%', height: '20px', marginBottom: '0.5rem', background: '#e5e7eb' }}></div>
                          <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '0.5rem', background: '#e5e7eb' }}></div>
                          <div className="skeleton" style={{ width: '40%', height: '16px', background: '#e5e7eb' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div style={{ width: '350px', flexShrink: 0 }}>
                <div style={{ 
                  padding: '1.5rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px',
                  background: '#ffffff'
                }}>
                  <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '12px', marginBottom: '1rem', background: '#e5e7eb' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '48px', borderRadius: '12px', background: '#e5e7eb' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!vendor) {
    return (
      <div className="profile-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-light)' }}>Vendor not found</p>
          <button className="btn btn-primary" onClick={() => {
            // If this page was opened in a new tab, close it
            // Otherwise, navigate to home
            if (window.opener || window.history.length <= 1) {
              window.close();
            } else {
              navigate('/');
            }
          }} style={{ marginTop: '1rem' }}>
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const profile = vendor.profile;
  const images = vendor.images || [];
  const services = vendor.services || [];
  const reviews = vendor.reviews || [];
  const faqs = vendor.faqs || [];
  const businessHours = vendor.businessHours || [];
  const categories = vendor.categories || [];

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', width: '100%' }}>
      <Header 
        onSearch={() => {}} 
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
      <div className="profile-container">
        {/* Back Button - Close tab and go back to main page */}
        <button className="back-button" onClick={() => {
          // If this page was opened in a new tab, close it
          // Otherwise, navigate back
          if (window.opener || window.history.length <= 1) {
            window.close();
          } else {
            navigate(-1);
          }
        }}>
          <i className="fas fa-arrow-left"></i>
          <span>Back to search</span>
        </button>

        {/* Setup Incomplete Banner for Vendors */}
        {currentUser?.vendorProfileId && (
          <SetupIncompleteBanner 
            onContinueSetup={() => {
              setDashboardSection('vendor-settings');
              setDashboardModalOpen(true);
            }}
          />
        )}

        {/* Breadcrumb Navigation with Save/Share */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <Breadcrumb items={[
            { 
              label: profile.City || 'City', 
              path: `/browse/${encodeURIComponent(profile.City || 'City')}` 
            },
            { 
              label: categories[0]?.CategoryName || categories[0]?.Category || profile.CategoryName || profile.PrimaryCategory || profile.Category || 'Services',
              path: `/browse/${encodeURIComponent(profile.City || 'City')}/${(categories[0]?.CategoryKey || profile.CategoryKey || 'all').toLowerCase()}`
            },
            profile.BusinessName || profile.DisplayName || 'Vendor Name',
            'Profile'
          ]} />
          
          {/* Compact Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleToggleFavorite}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: isFavorite ? '#fff0f0' : 'white',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: isFavorite ? '#e11d48' : '#222',
                transition: 'all 0.2s'
              }}
            >
              <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`} style={{ fontSize: '0.75rem', color: isFavorite ? '#e11d48' : '#717171' }}></i>
              Save
            </button>
            <button
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#222',
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-share-alt" style={{ fontSize: '0.7rem', color: '#717171' }}></i>
              Share
            </button>
          </div>
        </div>

        {/* Image Gallery */}
        <VendorGallery images={images} />

        {/* Main Layout Grid - Sidebar starts at vendor name level */}
        <div className="vendor-profile-layout">
          {/* Left Column - Vendor Info + Content */}
          <div>
            {/* Vendor Title and Rating */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Business Logo */}
              {(profile.LogoURL || profile.FeaturedImageURL) && (
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  overflow: 'hidden', 
                  border: '2px solid var(--border)',
                  background: 'var(--secondary)',
                  flexShrink: 0
                }}>
                  <img 
                    src={profile.LogoURL || profile.FeaturedImageURL} 
                    alt={`${profile.BusinessName || profile.DisplayName} logo`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h1 style={{ fontSize: '1.625rem', fontWeight: 600, color: '#222', lineHeight: 1.25, margin: 0 }}>
                    {profile.BusinessName || profile.DisplayName}
                  </h1>
                  {/* Online Status Indicator */}
                  {vendorOnlineStatus && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      backgroundColor: vendorOnlineStatus.isOnline ? '#dcfce7' : '#f3f4f6',
                      flexShrink: 0
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: vendorOnlineStatus.isOnline ? '#22c55e' : '#9ca3af'
                      }} />
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 500,
                        color: vendorOnlineStatus.isOnline ? '#16a34a' : '#6b7280'
                      }}>
                        {vendorOnlineStatus.isOnline ? 'Online' : vendorOnlineStatus.lastActiveText || 'Offline'}
                      </span>
                    </div>
                  )}
                </div>
              
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.95rem' }}>
                  {/* Rating with blue star - clickable */}
                  <span 
                    onClick={() => {
                      const reviewsSection = document.getElementById('reviews-section');
                      if (reviewsSection) {
                        reviewsSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" style={{ 
                      display: 'block', 
                      height: '14px', 
                      width: '14px', 
                      fill: '#0066CC'
                    }}>
                      <path fillRule="evenodd" d="M15.1 1.58l-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z"></path>
                    </svg>
                    <span style={{ fontWeight: 600, color: '#000' }}>
                      {reviews.length > 0 ? '4.9' : '5.0'}
                    </span>
                    {reviews.length > 0 && (
                      <span style={{ color: '#717171' }}>({reviews.length})</span>
                    )}
                  </span>
                  
                  <span style={{ color: '#717171', margin: '0 0.25rem' }}>·</span>
                  
                  {/* Location - clickable */}
                  {(profile.City || profile.State) && (
                    <>
                      <span 
                        onClick={() => {
                          const locationSection = document.getElementById('location-section');
                          if (locationSection) {
                            locationSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        style={{ 
                          color: '#000', 
                          textDecoration: 'underline', 
                          fontWeight: 500, 
                          cursor: 'pointer' 
                        }}
                      >
                        {[profile.City, profile.State, profile.Country].filter(Boolean).join(', ')}
                      </span>
                      <span style={{ color: '#717171', margin: '0 0.25rem' }}>·</span>
                    </>
                  )}
                  
                  {/* Category */}
                  <span style={{ color: '#000' }}>{profile.Tagline || profile.CategoryName || 'Event Services'}</span>
                </div>
              </div>
                </div>
              </div>

              {/* Social Media Icons */}
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #ebebeb' }}>
                {renderSocialMediaIcons()}
              </div>
            </div>

            {/* Main Content */}
            <div style={{ marginTop: '1.9rem', paddingTop: '1.9rem', borderTop: '1px solid #ebebeb' }}>
          {/* 1. About This Vendor */}
          <div className="content-section">
            <h2>About this vendor</h2>
            <p>{profile.BusinessDescription || 'Welcome to our business! We provide exceptional event services tailored to your needs.'}</p>
          </div>

          {/* 2. What This Place Offers (Questionnaire of Services) */}
          {renderVendorFeatures()}

          {/* 3. What We Offer (Service Pricing) */}
          {renderEnhancedServices()}

          {/* 4. Portfolio (Media Gallery) */}
          {renderPortfolioAlbums()}

          {/* 5. Things to Know */}
          {renderEnhancedFAQs()}

          {/* 6. Where You'll Find Us (Map + Cities Served) */}
          {renderLocationAndServiceAreas()}

          {/* 7. Reviews */}
          {renderReviewsSection()}

          {/* Team Section - optional at bottom */}
              {renderTeam()}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="vendor-sidebar">
          {/* Business Hours - First */}
          {businessHours.length > 0 && (
            <div className="sidebar-card">
              <h3 style={{ marginBottom: '0.75rem' }}>Business Hours</h3>
              {/* Timezone Display */}
              {profile.TimeZone && (() => {
                // Helper to get timezone info
                const getTimezoneInfo = (tz) => {
                  const tzMap = {
                    'America/Toronto': { abbr: 'EST', offset: '-5:00' },
                    'America/New_York': { abbr: 'EST', offset: '-5:00' },
                    'America/Chicago': { abbr: 'CST', offset: '-6:00' },
                    'America/Denver': { abbr: 'MST', offset: '-7:00' },
                    'America/Los_Angeles': { abbr: 'PST', offset: '-8:00' },
                    'America/Vancouver': { abbr: 'PST', offset: '-8:00' },
                    'Europe/London': { abbr: 'GMT', offset: '+0:00' },
                    'Europe/Paris': { abbr: 'CET', offset: '+1:00' },
                    'Asia/Tokyo': { abbr: 'JST', offset: '+9:00' },
                    'Australia/Sydney': { abbr: 'AEST', offset: '+10:00' },
                  };
                  return tzMap[tz] || { abbr: '', offset: '' };
                };
                const tzInfo = getTimezoneInfo(profile.TimeZone);
                const abbr = profile.TimeZoneAbbr || tzInfo.abbr;
                const offset = profile.GMTOffset || tzInfo.offset;
                
                return (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    marginBottom: '1rem',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <i className="fas fa-globe" style={{ fontSize: '0.8rem', color: '#5e72e4' }}></i>
                    <span style={{ fontSize: '0.8rem', color: '#717171' }}>
                      {profile.TimeZone}{abbr ? ` (${abbr})` : ''}{offset ? ` GMT ${offset}` : ''}
                    </span>
                  </div>
                );
              })()}
              <div style={{ fontSize: '0.9rem' }}>
                {businessHours.map((hour, index) => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  
                  // Format time to 12-hour format (e.g., 5:00 PM)
                  const formatTime = (timeStr) => {
                    if (!timeStr) return '';
                    const [hours, minutes] = timeStr.split(':');
                    const hour = parseInt(hours, 10);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const hour12 = hour % 12 || 12;
                    return `${hour12}:${minutes} ${ampm}`;
                  };
                  
                  return (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: index < businessHours.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <span style={{ fontWeight: 500, color: '#222', flex: '0 0 100px' }}>{dayNames[hour.DayOfWeek]}</span>
                      <span style={{ color: '#717171', textAlign: 'center', flex: 1 }}>
                        {hour.IsAvailable ? `${formatTime(hour.OpenTime)} - ${formatTime(hour.CloseTime)}` : 'Closed'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Request Booking Card - Second */}
          <div className="sidebar-card">
            <h3>Request to Book</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Send a booking request to this vendor with your event details and service requirements.
            </p>
            <button className="btn btn-primary btn-full-width" onClick={handleRequestBooking}>
              <i className="fas fa-calendar-check"></i>
              <span>Request Booking</span>
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.75rem', textAlign: 'center' }}>
              <i className="fas fa-shield-alt" style={{ color: 'var(--primary)' }}></i> Free request • No payment required
            </p>
          </div>

          {/* Contact - Third */}
          <div className="sidebar-card">
            <h3>Message Vendor</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
              Have questions? Get in touch!
            </p>
            <button className="btn btn-primary btn-full-width" onClick={handleMessageVendor}>
              <i className="fas fa-comment"></i>
              <span>Send Message</span>
            </button>
          </div>
          </div>
        </div>
      
      {/* Recommendations Section */}
      {renderRecommendations()}
      
      {/* Mobile Sticky Booking Bar - styled like bottom nav */}
      <div className="sticky-booking-bar">
        <button 
          className="message-btn" 
          onClick={handleMessageVendor}
        >
          <i className="fas fa-comment"></i>
          <span>Message</span>
        </button>
        <button 
          className="book-btn" 
          onClick={handleRequestBooking}
        >
          <i className="fas fa-calendar-check"></i>
          <span>Request Booking</span>
        </button>
      </div>
      
      {/* Footer - Full Width */}
      <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <Footer />
      </div>
      <MessagingWidget />
      <MobileBottomNav 
        onOpenDashboard={(section) => {
          if (section) {
            const sectionMap = {
              'messages': currentUser?.isVendor ? 'vendor-messages' : 'messages',
              'dashboard': 'dashboard'
            };
            setDashboardSection(sectionMap[section] || section);
          }
          setDashboardModalOpen(true);
        }}
        onCloseDashboard={() => setDashboardModalOpen(false)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenMap={handleOpenMap}
        onOpenMessages={() => {
          window.dispatchEvent(new CustomEvent('openMessagingWidget', { detail: {} }));
        }}
      />
    </div>
    </div>
  );
}

export default VendorProfilePage;
