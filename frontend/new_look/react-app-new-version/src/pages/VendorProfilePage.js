import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { PageLayout, ContentWrapper } from '../components/PageWrapper';
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

  // Album viewer state
  const [albumViewerOpen, setAlbumViewerOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumImages, setAlbumImages] = useState([]);
  const [albumImagesLoading, setAlbumImagesLoading] = useState(false);

  // Description modal state
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);

  // Vendor badges state
  const [vendorBadges, setVendorBadges] = useState([]);

  // Vendor packages state
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageModalOpen, setPackageModalOpen] = useState(false);

  // Cancellation policy state
  const [cancellationPolicy, setCancellationPolicy] = useState(null);

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
        loadReviewsWithSurvey(vendorDetails.profile.VendorProfileID);
        loadVendorBadges(vendorDetails.profile.VendorProfileID);
        loadVendorPackages(vendorDetails.profile.VendorProfileID);
        loadCancellationPolicy(vendorDetails.profile.VendorProfileID);
        
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
      const response = await fetch(`${API_BASE_URL}/vendors/features/vendor/${vendorProfileId}`);
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

  // Load vendor badges
  const loadVendorBadges = useCallback(async (vendorProfileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/badges`);
      if (response.ok) {
        const data = await response.json();
        setVendorBadges(data.badges || []);
      }
    } catch (error) {
      console.error('Error loading vendor badges:', error);
    }
  }, []);

  // Load vendor packages
  const loadVendorPackages = useCallback(async (vendorProfileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/packages`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Error loading vendor packages:', error);
    }
  }, []);

  // Load cancellation policy
  const loadCancellationPolicy = useCallback(async (vendorProfileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/vendor/${vendorProfileId}/cancellation-policy`);
      if (response.ok) {
        const data = await response.json();
        setCancellationPolicy(data.policy);
      }
    } catch (error) {
      console.error('Error loading cancellation policy:', error);
    }
  }, []);

  // Load album images when album is clicked
  const loadAlbumImages = useCallback(async (album) => {
    try {
      setAlbumImagesLoading(true);
      setSelectedAlbum(album);
      setAlbumViewerOpen(true);
      
      const url = `${API_BASE_URL}/vendor/${vendor?.profile?.VendorProfileID}/portfolio/albums/${album.AlbumID}/images/public`;
      console.log('Loading album images from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('Album images response:', data);
      
      if (response.ok && data.success) {
        setAlbumImages(data.images || []);
      } else {
        console.error('Failed to load album images:', data);
        setAlbumImages([]);
      }
    } catch (error) {
      console.error('Error loading album images:', error);
      setAlbumImages([]);
    } finally {
      setAlbumImagesLoading(false);
    }
  }, [vendor?.profile?.VendorProfileID]);

  // Load reviews with survey ratings (separate call to get full review data)
  const loadReviewsWithSurvey = useCallback(async (vendorProfileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.reviews) {
          // Update vendor state with full review data including survey ratings
          setVendor(prev => prev ? { ...prev, reviews: data.reviews } : prev);
        }
      }
    } catch (error) {
      console.error('Error loading reviews with survey:', error);
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

  // Icon mapping for vendor features - comprehensive mapping
  const getFeatureIcon = (featureName, categoryName) => {
    // Normalize feature name for matching
    const normalizedName = featureName?.toLowerCase() || '';
    
    // Category-based icon defaults
    const categoryIcons = {
      'Venue Features': 'building',
      'Venue': 'building',
      'Photography': 'camera',
      'Photography & Video': 'camera',
      'Videography': 'video',
      'Music': 'music',
      'Music & Entertainment': 'music',
      'Entertainment': 'theater-masks',
      'Catering': 'utensils',
      'Catering & Bar': 'utensils',
      'Bar': 'cocktail',
      'Event Planning': 'clipboard-list',
      'Planning': 'clipboard-list',
      'Beauty': 'spa',
      'Beauty & Fashion': 'spa',
      'Fashion': 'tshirt',
      'Floral': 'seedling',
      'Flowers': 'seedling',
      'Decor': 'palette',
      'Decoration': 'palette',
      'Transportation': 'car',
      'Rentals': 'couch',
      'Lighting': 'lightbulb',
      'Audio': 'volume-up',
      'Officiant': 'book',
      'Cake': 'birthday-cake',
      'Bakery': 'birthday-cake',
      'Invitations': 'envelope',
      'Stationery': 'envelope',
      'Jewelry': 'gem',
      'Favors': 'gift',
      'Other': 'star'
    };

    // Keyword-based icon mapping
    const keywordIcons = [
      // Venue & Space
      { keywords: ['indoor', 'inside'], icon: 'home' },
      { keywords: ['outdoor', 'outside', 'garden', 'patio'], icon: 'tree' },
      { keywords: ['wheelchair', 'accessible', 'handicap'], icon: 'wheelchair' },
      { keywords: ['parking', 'valet'], icon: 'parking' },
      { keywords: ['wifi', 'internet'], icon: 'wifi' },
      { keywords: ['dance', 'dancing'], icon: 'music' },
      { keywords: ['stage', 'platform'], icon: 'theater-masks' },
      { keywords: ['view', 'scenic', 'waterfront', 'ocean', 'lake'], icon: 'mountain' },
      { keywords: ['dressing', 'changing', 'bridal suite'], icon: 'door-closed' },
      { keywords: ['kitchen', 'prep'], icon: 'blender' },
      { keywords: ['air condition', 'ac', 'climate', 'heating'], icon: 'snowflake' },
      { keywords: ['elevator', 'lift'], icon: 'arrows-alt-v' },
      { keywords: ['restroom', 'bathroom', 'washroom'], icon: 'restroom' },
      { keywords: ['pool', 'swimming'], icon: 'swimming-pool' },
      { keywords: ['fireplace', 'fire pit'], icon: 'fire' },
      { keywords: ['tent', 'canopy'], icon: 'campground' },
      
      // Photography & Video
      { keywords: ['photo', 'photography', 'photographer'], icon: 'camera' },
      { keywords: ['video', 'videography', 'film', 'cinemat'], icon: 'video' },
      { keywords: ['drone', 'aerial'], icon: 'plane' },
      { keywords: ['album', 'print'], icon: 'book-open' },
      { keywords: ['edit', 'retouch', 'post-production'], icon: 'magic' },
      { keywords: ['engagement', 'pre-wedding'], icon: 'heart' },
      { keywords: ['portrait', 'headshot'], icon: 'user' },
      { keywords: ['candid', 'documentary'], icon: 'camera-retro' },
      
      // Music & Entertainment
      { keywords: ['dj', 'disc jockey'], icon: 'headphones' },
      { keywords: ['band', 'live music'], icon: 'guitar' },
      { keywords: ['singer', 'vocalist'], icon: 'microphone' },
      { keywords: ['piano', 'pianist'], icon: 'music' },
      { keywords: ['string', 'quartet', 'violin'], icon: 'music' },
      { keywords: ['mc', 'emcee', 'host'], icon: 'bullhorn' },
      { keywords: ['sound', 'audio', 'speaker'], icon: 'volume-up' },
      { keywords: ['lighting', 'lights'], icon: 'lightbulb' },
      { keywords: ['photo booth'], icon: 'camera-retro' },
      { keywords: ['magic', 'magician'], icon: 'hat-wizard' },
      { keywords: ['dance', 'choreograph'], icon: 'shoe-prints' },
      
      // Catering & Food
      { keywords: ['catering', 'food', 'meal'], icon: 'utensils' },
      { keywords: ['bar', 'cocktail', 'drink', 'beverage'], icon: 'cocktail' },
      { keywords: ['wine'], icon: 'wine-glass-alt' },
      { keywords: ['beer'], icon: 'beer' },
      { keywords: ['coffee', 'espresso'], icon: 'coffee' },
      { keywords: ['cake', 'dessert', 'pastry'], icon: 'birthday-cake' },
      { keywords: ['vegetarian', 'vegan', 'dietary'], icon: 'leaf' },
      { keywords: ['kosher', 'halal'], icon: 'check-circle' },
      { keywords: ['tasting', 'sample'], icon: 'utensil-spoon' },
      { keywords: ['buffet'], icon: 'concierge-bell' },
      { keywords: ['plated', 'served'], icon: 'concierge-bell' },
      
      // Beauty & Fashion
      { keywords: ['makeup', 'cosmetic'], icon: 'paint-brush' },
      { keywords: ['hair', 'styling', 'hairstyl'], icon: 'cut' },
      { keywords: ['nail', 'manicure'], icon: 'hand-sparkles' },
      { keywords: ['spa', 'massage', 'relax'], icon: 'spa' },
      { keywords: ['dress', 'gown', 'bridal wear'], icon: 'tshirt' },
      { keywords: ['suit', 'tuxedo', 'formal wear'], icon: 'user-tie' },
      { keywords: ['alteration', 'tailor', 'fitting'], icon: 'ruler' },
      { keywords: ['accessory', 'accessories'], icon: 'gem' },
      { keywords: ['jewelry', 'ring'], icon: 'ring' },
      
      // Floral & Decor
      { keywords: ['flower', 'floral', 'bouquet'], icon: 'seedling' },
      { keywords: ['centerpiece', 'arrangement'], icon: 'vase' },
      { keywords: ['decor', 'decoration', 'design'], icon: 'palette' },
      { keywords: ['linen', 'tablecloth', 'napkin'], icon: 'scroll' },
      { keywords: ['chair', 'seating'], icon: 'chair' },
      { keywords: ['table'], icon: 'border-all' },
      { keywords: ['arch', 'backdrop'], icon: 'archway' },
      { keywords: ['balloon'], icon: 'circle' },
      { keywords: ['candle', 'candel'], icon: 'fire-alt' },
      
      // Planning & Coordination
      { keywords: ['planning', 'planner', 'coordinator'], icon: 'clipboard-list' },
      { keywords: ['day-of', 'on-site'], icon: 'calendar-day' },
      { keywords: ['full service', 'full-service'], icon: 'concierge-bell' },
      { keywords: ['partial', 'month-of'], icon: 'calendar-alt' },
      { keywords: ['budget', 'financial'], icon: 'dollar-sign' },
      { keywords: ['vendor', 'referral'], icon: 'users' },
      { keywords: ['timeline', 'schedule'], icon: 'clock' },
      { keywords: ['contract', 'legal'], icon: 'file-contract' },
      { keywords: ['consultation', 'consult'], icon: 'comments' },
      
      // Transportation
      { keywords: ['limo', 'limousine'], icon: 'car-side' },
      { keywords: ['car', 'vehicle', 'transport'], icon: 'car' },
      { keywords: ['bus', 'shuttle'], icon: 'bus' },
      { keywords: ['horse', 'carriage'], icon: 'horse' },
      { keywords: ['boat', 'yacht'], icon: 'ship' },
      
      // Rentals & Equipment
      { keywords: ['rental', 'rent'], icon: 'box' },
      { keywords: ['furniture'], icon: 'couch' },
      { keywords: ['tent', 'marquee'], icon: 'campground' },
      { keywords: ['generator', 'power'], icon: 'bolt' },
      { keywords: ['heater', 'heating'], icon: 'temperature-high' },
      { keywords: ['fan', 'cooling'], icon: 'fan' },
      
      // Invitations & Stationery
      { keywords: ['invitation', 'invite'], icon: 'envelope-open-text' },
      { keywords: ['save the date'], icon: 'calendar-plus' },
      { keywords: ['menu', 'program'], icon: 'file-alt' },
      { keywords: ['signage', 'sign'], icon: 'sign' },
      { keywords: ['calligraphy'], icon: 'pen-fancy' },
      
      // Other Services
      { keywords: ['officiant', 'ceremony'], icon: 'book' },
      { keywords: ['favor', 'gift'], icon: 'gift' },
      { keywords: ['guest', 'accommodation', 'hotel'], icon: 'bed' },
      { keywords: ['insurance'], icon: 'shield-alt' },
      { keywords: ['security'], icon: 'user-shield' },
      { keywords: ['childcare', 'babysit', 'kids'], icon: 'child' },
      { keywords: ['pet', 'dog', 'animal'], icon: 'paw' },
      { keywords: ['firework', 'pyro'], icon: 'star' },
      { keywords: ['lantern', 'release'], icon: 'paper-plane' }
    ];

    // First check keyword matches
    for (const mapping of keywordIcons) {
      if (mapping.keywords.some(kw => normalizedName.includes(kw))) {
        return mapping.icon;
      }
    }

    // Then check category
    if (categoryName && categoryIcons[categoryName]) {
      return categoryIcons[categoryName];
    }

    // Default icon based on first letter or generic
    return 'check-circle';
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

  // Render portfolio albums - Airbnb style horizontal scroll on mobile, grid on desktop
  const renderPortfolioAlbums = () => {
    if (!portfolioAlbums || portfolioAlbums.length === 0) return null;

    return (
      <div className="content-section">
        <h2>Portfolio</h2>
        {/* Mobile: Horizontal scroll with side-by-side cards */}
        <div 
          className="portfolio-albums-container"
          style={{ 
            display: 'flex',
            gap: '12px',
            marginTop: '1rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '8px',
            marginLeft: '-16px',
            marginRight: '-16px',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          {portfolioAlbums.map((album, index) => (
            <div 
              key={index} 
              onClick={() => loadAlbumImages(album)}
              style={{
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                flex: '0 0 calc(50% - 6px)',
                minWidth: '150px',
                maxWidth: '200px',
                scrollSnapAlign: 'start'
              }}
            >
              {/* Album Cover Image */}
              <div style={{ 
                position: 'relative', 
                aspectRatio: '1/1',
                background: '#f3f4f6',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                {album.CoverImageURL ? (
                  <img 
                    src={album.CoverImageURL} 
                    alt={album.AlbumName} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }} 
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}>
                    <i className="fas fa-images" style={{ fontSize: '2rem', color: 'white', opacity: 0.8 }}></i>
                  </div>
                )}
              </div>
              
              {/* Album Info - Below image */}
              <div style={{ padding: '8px 0 0 0' }}>
                <h4 style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 600, 
                  color: '#222', 
                  margin: '0 0 2px 0',
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {album.AlbumName}
                </h4>
                <p style={{ 
                  fontSize: '0.8rem', 
                  color: '#717171', 
                  margin: 0
                }}>
                  {album.ImageCount || 0} {(album.ImageCount || 0) === 1 ? 'photo' : 'photos'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <style>{`
          @media (min-width: 768px) {
            .portfolio-albums-container {
              display: grid !important;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
              gap: 1.5rem !important;
              overflow-x: visible !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            .portfolio-albums-container > div {
              flex: none !important;
              min-width: unset !important;
              max-width: unset !important;
            }
          }
        `}</style>
      </div>
    );
  };

  // Render vendor badges section
  const renderVendorBadges = () => {
    if (!vendorBadges || vendorBadges.length === 0) return null;

    const getBadgeStyle = (badgeType) => {
      const styles = {
        'new_vendor': { bg: '#e0f2fe', color: '#0369a1', icon: 'fa-sparkles', label: 'New Vendor' },
        'top_rated': { bg: '#fef3c7', color: '#d97706', icon: 'fa-star', label: 'Top Rated' },
        'choice_award': { bg: '#fee2e2', color: '#dc2626', icon: 'fa-award', label: 'Choice Award' },
        'premium': { bg: '#f3e8ff', color: '#7c3aed', icon: 'fa-crown', label: 'Premium' },
        'verified': { bg: '#d1fae5', color: '#059669', icon: 'fa-check-circle', label: 'Verified' },
        'featured': { bg: '#fce7f3', color: '#db2777', icon: 'fa-fire', label: 'Featured' }
      };
      return styles[badgeType] || { bg: '#f3f4f6', color: '#6b7280', icon: 'fa-certificate', label: badgeType };
    };

    return (
      <div className="content-section" style={{ paddingTop: '1.5rem', borderTop: '1px solid #ebebeb' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 600, marginBottom: '1rem' }}>Badges</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {vendorBadges.map((badge, index) => {
            const style = getBadgeStyle(badge.BadgeType || badge.badgeType);
            return (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1rem 1.5rem',
                  background: style.bg,
                  borderRadius: '12px',
                  minWidth: '100px'
                }}
              >
                {badge.ImageURL ? (
                  <img 
                    src={badge.ImageURL} 
                    alt={badge.BadgeName || style.label}
                    style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '0.5rem' }}
                  />
                ) : (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <i className={`fas ${style.icon}`} style={{ fontSize: '1.5rem', color: style.color }}></i>
                  </div>
                )}
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 600, 
                  color: style.color,
                  textAlign: 'center'
                }}>
                  {badge.BadgeName || style.label}
                </span>
                {badge.Year && (
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {badge.Year}
                  </span>
                )}
              </div>
            );
          })}
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

  // Render enhanced services with better formatting - show both services and packages
  const renderEnhancedServices = () => {
    const hasPackages = packages && packages.length > 0;
    const services = vendor?.services || [];
    const hasServices = services && services.length > 0;
    
    // Show nothing if no services and no packages
    if (!hasPackages && !hasServices) return null;

    return (
      <div className="content-section">
        <h2>What we offer</h2>
        
        {/* Services Section */}
        {hasServices && (
          <div style={{ marginBottom: hasPackages ? '2rem' : 0 }}>
            {hasPackages && <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#222', marginBottom: '1rem' }}>Services</h3>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {services.map((service, index) => (
                <div 
                  key={service.ServiceID || index}
                  style={{
                    padding: '1rem',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#222', margin: '0 0 0.25rem 0' }}>
                      {service.ServiceName || service.serviceName}
                    </h4>
                    {service.ServiceDescription && (
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.4 }}>
                        {service.ServiceDescription.length > 80 ? service.ServiceDescription.substring(0, 80) + '...' : service.ServiceDescription}
                      </p>
                    )}
                    {service.DurationMinutes && (
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                        <i className="far fa-clock" style={{ marginRight: '4px' }}></i>
                        {service.DurationMinutes} min
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#222' }}>
                      ${parseFloat(service.Price || service.BasePrice || 0).toFixed(0)}
                    </div>
                    {service.PriceType && service.PriceType !== 'flat' && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        / {service.PriceType === 'per_person' ? 'person' : service.PriceType === 'per_hour' ? 'hour' : service.PriceType}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Packages Section - Horizontal Cards */}
        {hasPackages && (
          <>
            {hasServices && <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#222', marginBottom: '1rem' }}>Packages</h3>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {packages.map((pkg, index) => (
            <div 
              key={pkg.PackageID || index}
              onClick={() => { setSelectedPackage(pkg); setPackageModalOpen(true); }}
              style={{
                padding: '1rem',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Package Image/Icon */}
                <div style={{
                  flexShrink: 0,
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {pkg.ImageURL ? (
                    <img src={pkg.ImageURL} alt={pkg.PackageName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fas fa-box" style={{ color: '#9ca3af', fontSize: '2rem' }}></i>
                  )}
                </div>
                
                {/* Package Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#222', margin: '0 0 0.35rem 0' }}>
                        {pkg.PackageName}
                        {pkg.SalePrice && parseFloat(pkg.SalePrice) < parseFloat(pkg.Price) && (
                          <span style={{ background: 'transparent', color: '#dc2626', padding: '0', fontSize: '0.8rem', fontWeight: 700, marginLeft: '0.5rem', verticalAlign: 'middle' }}>SALE!</span>
                        )}
                      </h3>
                      
                      {/* Pricing */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {pkg.SalePrice && parseFloat(pkg.SalePrice) < parseFloat(pkg.Price) ? (
                          <>
                            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#222' }}>
                              ${parseFloat(pkg.SalePrice).toFixed(0)}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                              ${parseFloat(pkg.Price).toFixed(0)}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#222' }}>
                            ${parseFloat(pkg.Price).toFixed(0)}
                          </span>
                        )}
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          / {pkg.PriceType === 'per_person' ? 'person' : 'package'}
                        </span>
                      </div>
                      
                      {/* Description */}
                      {pkg.Description && (
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.5 }}>
                          {pkg.Description.length > 120 ? pkg.Description.substring(0, 120) + '...' : pkg.Description}
                        </p>
                      )}
                      
                      {/* Included Services */}
                      {pkg.IncludedServices && pkg.IncludedServices.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {pkg.IncludedServices.slice(0, 4).map((svc, idx) => (
                            <span key={idx} style={{ 
                              background: '#f3f4f6', 
                              color: '#374151', 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              fontSize: '0.8rem', 
                              fontWeight: 500 
                            }}>
                              {svc.name || svc.ServiceName}
                            </span>
                          ))}
                          {pkg.IncludedServices.length > 4 && (
                            <span style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500, padding: '4px 0' }}>
                              +{pkg.IncludedServices.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // Render cancellation policy section (Airbnb style)
  const renderCancellationPolicy = () => {
    if (!cancellationPolicy) return null;

    const policyDescriptions = {
      flexible: {
        title: 'Flexible',
        color: '#10b981',
        icon: 'fa-check-circle',
        description: 'Full refund if cancelled at least 24 hours before the event.'
      },
      moderate: {
        title: 'Moderate', 
        color: '#f59e0b',
        icon: 'fa-clock',
        description: 'Full refund if cancelled 7+ days before. 50% refund if cancelled 3-7 days before.'
      },
      strict: {
        title: 'Strict',
        color: '#ef4444',
        icon: 'fa-exclamation-circle',
        description: '50% refund if cancelled 14+ days before. No refund within 14 days of event.'
      },
      custom: {
        title: 'Custom Policy',
        color: '#6366f1',
        icon: 'fa-cog',
        description: null
      }
    };

    const policyType = cancellationPolicy.PolicyType || 'flexible';
    const policyInfo = policyDescriptions[policyType] || policyDescriptions.flexible;

    // Build custom description if custom policy
    let description = policyInfo.description;
    if (policyType === 'custom') {
      const parts = [];
      if (cancellationPolicy.FullRefundDays > 0) {
        parts.push(`Full refund if cancelled ${cancellationPolicy.FullRefundDays}+ days before`);
      }
      if (cancellationPolicy.PartialRefundDays > 0 && cancellationPolicy.PartialRefundPercent > 0) {
        parts.push(`${cancellationPolicy.PartialRefundPercent}% refund if cancelled ${cancellationPolicy.PartialRefundDays}-${cancellationPolicy.FullRefundDays} days before`);
      }
      if (cancellationPolicy.NoRefundDays > 0) {
        parts.push(`No refund within ${cancellationPolicy.NoRefundDays} day(s) of event`);
      }
      description = parts.join('. ') + '.';
      if (cancellationPolicy.CustomTerms) {
        description += ' ' + cancellationPolicy.CustomTerms;
      }
    }

    return (
      <div className="content-section" style={{ marginTop: '2rem' }}>
        <h2>Cancellation policy</h2>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ flexShrink: 0 }}>
            <i className="far fa-calendar-alt" style={{ fontSize: '1.5rem', color: '#222' }}></i>
          </div>
          <div>
            <p style={{ margin: 0, color: '#717171', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render enhanced FAQs with multiple choice support
  const renderEnhancedFAQs = () => {
    if (!faqs || faqs.length === 0) return null;

    // Helper to parse answers (handles bullet points, newlines, etc.)
    const parseAnswers = (answer) => {
      if (!answer) return [];
      const answerStr = String(answer);
      // Clean up bullet points and split by newlines
      const cleaned = answerStr.replace(/^[•\-]\s*/gm, '').trim();
      if (cleaned.includes('\n')) {
        return cleaned.split('\n').map(a => a.replace(/^[•\-]\s*/, '').trim()).filter(a => a);
      }
      return [cleaned];
    };

    return (
      <div className="content-section">
        <h2>Things to know</h2>
        <div style={{ marginTop: '1.5rem' }}>
          {faqs.map((faq, index) => {
            const answerType = (faq.AnswerType || '').trim().toLowerCase();
            const hasAnswerOptions = faq.AnswerOptions && faq.AnswerOptions !== 'null' && faq.AnswerOptions !== '';
            
            let answerItems = [];

            if ((answerType === 'multiple choice' || answerType === 'multiple_choice') && hasAnswerOptions) {
              try {
                let options = typeof faq.AnswerOptions === 'string' ? JSON.parse(faq.AnswerOptions) : faq.AnswerOptions;
                
                if (Array.isArray(options) && options.length > 0) {
                  if (options[0] && typeof options[0] === 'object' && 'label' in options[0]) {
                    answerItems = options.filter(opt => opt.checked === true).map(opt => opt.label);
                  } else {
                    answerItems = options;
                  }
                }
              } catch (e) {
                answerItems = parseAnswers(faq.Answer);
              }
            } else {
              answerItems = parseAnswers(faq.Answer);
            }

            return (
              <div 
                key={index} 
                style={{ 
                  padding: '1.25rem 0',
                  borderBottom: index < faqs.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}
              >
                <div style={{ 
                  fontWeight: 600, 
                  color: '#111827', 
                  fontSize: '1rem', 
                  marginBottom: '0.75rem'
                }}>
                  {faq.Question}
                </div>
                <div style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.7 }}>
                  {answerItems.length === 0 ? (
                    <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No answer provided</span>
                  ) : answerItems.length === 1 ? (
                    <span>{answerItems[0]}</span>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.25rem' }}>
                      {answerItems.map((item, idx) => (
                        <div key={idx}>{item}</div>
                      ))}
                    </div>
                  )}
                </div>
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
              {showGoogleReviews 
                ? (googleReviews?.rating?.toFixed(1) || 'N/A') 
                : (reviews && reviews.length > 0 
                    ? (reviews.reduce((sum, r) => sum + (r.Rating || 0), 0) / reviews.length).toFixed(1)
                    : 'N/A'
                  )
              }
            </div>
            <div>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--primary)',
                marginBottom: '0.125rem'
              }}>
                {'★'.repeat(Math.round(reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.Rating || 0), 0) / reviews.length : 5))}
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-light)'
              }}>
                Based on {showGoogleReviews ? (googleReviews?.user_ratings_total || 0) : (reviews?.length || 0)} {showGoogleReviews ? 'Google ' : ''}reviews
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

        {/* Average Survey Ratings - Only show for PlanBeau reviews */}
        {!showGoogleReviews && reviews && reviews.length > 0 && (() => {
          // Calculate averages for each survey category
          const surveyCategories = [
            { key: 'QualityRating', label: 'Quality of Service' },
            { key: 'CommunicationRating', label: 'Communication' },
            { key: 'ValueRating', label: 'Value for Money' },
            { key: 'PunctualityRating', label: 'Punctuality' },
            { key: 'ProfessionalismRating', label: 'Professionalism' }
          ];
          
          const averages = surveyCategories.map(cat => {
            const validRatings = reviews.filter(r => r[cat.key] != null && r[cat.key] > 0);
            if (validRatings.length === 0) return null;
            const avg = validRatings.reduce((sum, r) => sum + r[cat.key], 0) / validRatings.length;
            return { label: cat.label, value: avg };
          }).filter(Boolean);
          
          if (averages.length === 0) return null;
          
          return (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px 24px',
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              marginBottom: '1.5rem'
            }}>
              {averages.map(avg => (
                <div key={avg.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                  <span style={{ fontSize: '13px', color: '#374151', whiteSpace: 'nowrap' }}>{avg.label}</span>
                  <div style={{ 
                    width: '60px', 
                    height: '6px', 
                    background: '#e5e7eb', 
                    borderRadius: '3px',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      width: `${(avg.value / 5) * 100}%`, 
                      height: '100%', 
                      background: '#5e72e4',
                      borderRadius: '3px'
                    }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                    {avg.value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}

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
                      background: showGoogleReviews 
                        ? (review.profile_photo_url ? `url(${review.profile_photo_url})` : 'var(--primary)')
                        : (review.ReviewerAvatar ? `url(${review.ReviewerAvatar})` : 'var(--primary)'), 
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
                      {showGoogleReviews 
                        ? (!review.profile_photo_url && (review.author_name?.charAt(0) || '?'))
                        : (!review.ReviewerAvatar && (review.ReviewerName?.charAt(0) || 'A'))
                      }
                    </div>

                    <div style={{ flex: 1 }}>
                      {/* Reviewer Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>
                          {showGoogleReviews ? (review.author_name || 'Anonymous') : (review.ReviewerName || 'Anonymous')}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                          {showGoogleReviews 
                            ? (review.relative_time_description || '')
                            : (() => {
                                const rawDate = review.CreatedAt || review.createdAt || review.ReviewDate || review.created_at;
                                if (!rawDate) {
                                  return 'recently';
                                }
                                const date = new Date(rawDate);
                                if (isNaN(date.getTime())) {
                                  return 'recently';
                                }
                                
                                const now = new Date();
                                const diffMs = now - date;
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                const diffWeeks = Math.floor(diffDays / 7);
                                const diffMonths = Math.floor(diffDays / 30);
                                const diffYears = Math.floor(diffDays / 365);
                                
                                if (diffDays === 0) return 'today';
                                if (diffDays === 1) return 'yesterday';
                                if (diffDays < 7) return `${diffDays} days ago`;
                                if (diffWeeks === 1) return '1 week ago';
                                if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
                                if (diffMonths === 1) return '1 month ago';
                                if (diffMonths < 12) return `${diffMonths} months ago`;
                                if (diffYears === 1) return '1 year ago';
                                return `${diffYears} years ago`;
                              })()
                          }
                        </span>
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
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    
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
            {/* Breadcrumb Skeleton */}
            <div className="skeleton" style={{ width: isMobile ? '200px' : '300px', height: '20px', borderRadius: '6px', marginBottom: '1rem' }}></div>

            {/* Image Gallery Skeleton - Responsive */}
            {isMobile ? (
              /* Mobile: Single image */
              <div style={{ 
                aspectRatio: '16/10',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}>
                <div className="skeleton" style={{ 
                  width: '100%', 
                  height: '100%',
                  borderRadius: '12px'
                }}></div>
              </div>
            ) : (
              /* Desktop: Grid layout */
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px', 
                borderRadius: '12px', 
                overflow: 'hidden',
                marginBottom: '1.5rem',
                height: '400px'
              }}>
                <div className="skeleton" style={{ 
                  height: '100%',
                  borderRadius: '12px 0 0 12px'
                }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '8px' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton" style={{ 
                      borderRadius: i === 2 ? '0 12px 0 0' : i === 4 ? '0 0 12px 0' : '0'
                    }}></div>
                  ))}
                </div>
              </div>
            )}

            {/* Header Skeleton */}
            <div style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
              <div className="skeleton" style={{ width: isMobile ? '80%' : '60%', height: isMobile ? '28px' : '36px', marginBottom: '0.5rem' }}></div>
              <div className="skeleton" style={{ width: isMobile ? '60%' : '40%', height: '18px', marginBottom: '0.5rem' }}></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: '12px' }}></div>
                <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '12px' }}></div>
              </div>
            </div>

            {/* Content Layout Skeleton - Responsive */}
            <div style={{ 
              display: isMobile ? 'flex' : 'grid',
              flexDirection: 'column',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
              gap: isMobile ? '1.5rem' : '3rem'
            }}>
              {/* Main Content */}
              <div>
                {/* About Section Skeleton */}
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  <div className="skeleton" style={{ width: '150px', height: '24px', marginBottom: '1rem' }}></div>
                  <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '0.5rem' }}></div>
                  <div className="skeleton" style={{ width: '95%', height: '16px', marginBottom: '0.5rem' }}></div>
                  <div className="skeleton" style={{ width: '85%', height: '16px' }}></div>
                </div>

                {/* Services Section Skeleton */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="skeleton" style={{ width: '140px', height: '24px', marginBottom: '1rem' }}></div>
                  {[1, 2].map((i) => (
                    <div key={i} style={{ 
                      padding: '1rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '12px', 
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '8px', flexShrink: 0 }}></div>
                        <div style={{ flex: 1 }}>
                          <div className="skeleton" style={{ width: '70%', height: '18px', marginBottom: '0.5rem' }}></div>
                          <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '0.25rem' }}></div>
                          <div className="skeleton" style={{ width: '50%', height: '14px' }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Skeleton - Hidden on mobile (shown as sticky bar) */}
              {!isMobile && (
                <div>
                  <div style={{ 
                    padding: '1.5rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                  }}>
                    <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '8px', marginBottom: '1rem' }}></div>
                    <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '8px' }}></div>
                  </div>
                </div>
              )}
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
    <PageLayout variant="fullWidth" pageClassName="vendor-profile-page">
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
        <VendorGallery 
          images={images} 
          onBack={() => navigate(-1)}
          onShare={handleShare}
          onFavorite={handleToggleFavorite}
          isFavorite={isFavorite}
        />

        {/* Mobile Content Sheet - overlaps image with rounded corners */}
        <div className="mobile-content-sheet">
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
          {/* 1. About This Vendor - with Show More for long descriptions */}
          <div className="content-section">
            <h2>About this vendor</h2>
            {(() => {
              const description = profile.BusinessDescription || 'Welcome to our business! We provide exceptional event services tailored to your needs.';
              const maxLength = 400;
              const isLong = description.length > maxLength;
              
              return (
                <>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>
                    {isLong ? `${description.substring(0, maxLength)}...` : description}
                  </p>
                  {isLong && (
                    <button
                      onClick={() => setDescriptionModalOpen(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#222',
                        fontWeight: 600,
                        fontSize: '1rem',
                        padding: '0.5rem 0',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        marginTop: '0.5rem'
                      }}
                    >
                      Show more <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem', marginLeft: '4px' }}></i>
                    </button>
                  )}
                </>
              );
            })()}
          </div>

          {/* 2. Badges Section */}
          {renderVendorBadges()}

          {/* 3. What This Place Offers (Questionnaire of Services) */}
          {renderVendorFeatures()}

          {/* 4. What We Offer (Service Pricing) */}
          {renderEnhancedServices()}

          {/* 5. Portfolio (Media Gallery) */}
          {renderPortfolioAlbums()}

          {/* 6. Things to Know */}
          {renderEnhancedFAQs()}

          {/* 7. Cancellation Policy */}
          {renderCancellationPolicy()}

          {/* 7. Where You'll Find Us (Map + Cities Served) */}
          {renderLocationAndServiceAreas()}

          {/* 8. Reviews */}
          {renderReviewsSection()}

          {/* Team Section - optional at bottom */}
              {renderTeam()}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="vendor-sidebar">
          {/* 1. Business Hours - First */}
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

          {/* 2. Hosted By Card */}
          <div className="sidebar-card" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {/* Host Avatar */}
              <div 
                onClick={() => navigate(`/host/${vendor.userId || vendorId}`)}
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                  border: '2px solid #f0f0f0'
                }}
              >
                <img 
                  src={profile.HostProfileImage || profile.LogoURL || profile.FeaturedImageURL || 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'}
                  alt={profile.HostName || profile.ContactName || 'Host'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://res.cloudinary.com/dxgy4apj5/image/upload/v1755105530/image_placeholder.png'; }}
                />
              </div>
              
              {/* Host Info */}
              <div style={{ flex: 1 }}>
                <div 
                  onClick={() => navigate(`/host/${vendor.userId || vendorId}`)}
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#222',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Hosted by {profile.HostName || profile.ContactName || profile.BusinessName?.split(' ')[0] || 'Host'}
                  {profile.IsVerified && (
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      color: 'white',
                      fontSize: '10px'
                    }}>
                      <i className="fas fa-check"></i>
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#717171', marginTop: '2px' }}>
                  {profile.ResponseRating && (
                    <span>Response rating: <strong style={{ color: '#222' }}>{profile.ResponseRating}</strong></span>
                  )}
                  {!profile.ResponseRating && reviews.length > 0 && (
                    <span>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  )}
                  {!profile.ResponseRating && reviews.length === 0 && (
                    <span>New host</span>
                  )}
                </div>
                {profile.ResponseTime && (
                  <div style={{ fontSize: '0.85rem', color: '#717171' }}>
                    Response time: <strong style={{ color: '#222' }}>{profile.ResponseTime}</strong>
                  </div>
                )}
              </div>
            </div>
            
            {/* Message Host Button */}
            <button 
              className="btn btn-outline btn-full-width" 
              onClick={handleMessageVendor}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                border: '1px solid #222',
                borderRadius: '8px',
                background: 'white',
                color: '#222',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f7f7f7'}
              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
              Message Host
            </button>
          </div>

          {/* 3. Book This Space Card */}
          <div className="sidebar-card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Book this space</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Send a booking request with your event details.
            </p>
            <button 
              className="btn btn-primary btn-full-width" 
              onClick={handleRequestBooking}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 16px',
                background: '#222',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Reserve
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.75rem', textAlign: 'center' }}>
              <i className="fas fa-shield-alt" style={{ color: 'var(--primary)', marginRight: '4px' }}></i>
              Free cancellation within 24 hours
            </p>
          </div>

          </div>
        </div>
      
      {/* Recommendations Section */}
      {renderRecommendations()}
      </div>{/* End mobile-content-sheet */}
      </div>{/* End profile-container */}
      
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

      {/* Album Viewer Modal - Unified photo viewer like "Show all photos" */}
      {albumViewerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#fff',
            zIndex: 9998,
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div style={{
            position: 'sticky',
            top: 0,
            background: '#fff',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #ebebeb',
            zIndex: 10
          }}>
            <button
              onClick={() => {
                setAlbumViewerOpen(false);
                setSelectedAlbum(null);
                setAlbumImages([]);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#222',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f7f7f7'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
            >
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              {selectedAlbum?.AlbumName || 'Album'}
            </h3>
            <div style={{ width: '80px' }}></div>
          </div>

          {/* Photo Grid */}
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '24px'
          }}>
            {albumImagesLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#717171' }}></i>
                <p style={{ color: '#717171', marginTop: '1rem' }}>Loading photos...</p>
              </div>
            ) : albumImages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fas fa-images" style={{ fontSize: '3rem', color: '#d1d5db' }}></i>
                <p style={{ color: '#717171', marginTop: '1rem' }}>No photos in this album yet</p>
              </div>
            ) : (
              <>
                {/* First large image */}
                {albumImages[0] && (
                  <div
                    onClick={() => {
                      setLightboxImages(albumImages.map(img => ({ url: img.ImageURL || img.URL })));
                      setLightboxIndex(0);
                      setLightboxOpen(true);
                    }}
                    style={{
                      width: '100%',
                      aspectRatio: '16/10',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <img
                      src={albumImages[0].ImageURL || albumImages[0].URL}
                      alt="Photo 1"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}

                {/* Grid of remaining images - 2 columns */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}>
                  {albumImages.slice(1).map((img, idx) => (
                    <div
                      key={idx + 1}
                      onClick={() => {
                        setLightboxImages(albumImages.map(i => ({ url: i.ImageURL || i.URL })));
                        setLightboxIndex(idx + 1);
                        setLightboxOpen(true);
                      }}
                      style={{
                        aspectRatio: '1/1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                    >
                      <img
                        src={img.ImageURL || img.URL}
                        alt={`Photo ${idx + 2}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox for album images */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#000',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Top Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            color: 'white'
          }}>
            <button
              onClick={() => {
                setLightboxOpen(false);
                setLightboxImages([]);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                padding: '8px 12px',
                borderRadius: '8px'
              }}
            >
              <i className="fas fa-times"></i>
              Close
            </button>
            
            <div style={{ fontSize: '14px', fontWeight: 500 }}>
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>

            <div style={{ width: '80px' }}></div>
          </div>

          {/* Main Image Area */}
          <div 
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '0 60px'
            }}
            onClick={() => {
              setLightboxOpen(false);
              setLightboxImages([]);
            }}
          >
            {/* Previous Button */}
            {lightboxImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
                }}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  color: '#222',
                  fontSize: '16px',
                  cursor: 'pointer',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
            )}

            {/* Image */}
            <img
              src={lightboxImages[lightboxIndex]?.url}
              alt={`Photo ${lightboxIndex + 1}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 120px)',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />

            {/* Next Button */}
            {lightboxImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
                }}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  color: '#222',
                  fontSize: '16px',
                  cursor: 'pointer',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Package Detail Modal - Clean Airbnb Style */}
      {packageModalOpen && selectedPackage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => { setPackageModalOpen(false); setSelectedPackage(null); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Modal Header - Minimal */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid #ebebeb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#222' }}>
                {selectedPackage.PackageName}
              </h2>
              <button
                onClick={() => { setPackageModalOpen(false); setSelectedPackage(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: '#717171',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
              {/* Package Image */}
              {selectedPackage.ImageURL && (
                <div style={{ width: '100%', aspectRatio: '16/9', background: '#f7f7f7' }}>
                  <img 
                    src={selectedPackage.ImageURL} 
                    alt={selectedPackage.PackageName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
              )}
              
              {/* Modal Content */}
              <div style={{ padding: '20px' }}>
                {/* Pricing - Prominent */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedPackage.SalePrice && parseFloat(selectedPackage.SalePrice) < parseFloat(selectedPackage.Price) ? (
                      <>
                        <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#222' }}>
                          ${parseFloat(selectedPackage.SalePrice).toFixed(0)}
                        </span>
                        <span style={{ fontSize: '1rem', color: '#717171', textDecoration: 'line-through' }}>
                          ${parseFloat(selectedPackage.Price).toFixed(0)}
                        </span>
                        <span style={{ color: '#e31c5f', fontSize: '0.875rem', fontWeight: 600 }}>SALE!</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#222' }}>
                        ${parseFloat(selectedPackage.Price).toFixed(0)}
                      </span>
                    )}
                    <span style={{ fontSize: '1rem', color: '#717171' }}>
                      / {selectedPackage.PriceType === 'per_person' ? 'person' : 'package'}
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                {selectedPackage.Description && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: 0, color: '#484848', fontSize: '0.95rem', lineHeight: 1.6 }}>{selectedPackage.Description}</p>
                  </div>
                )}
                
                {/* Included Services */}
                {selectedPackage.IncludedServices && selectedPackage.IncludedServices.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#222', margin: '0 0 12px 0' }}>What's included</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedPackage.IncludedServices.map((svc, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#00a699', fontSize: '0.9rem' }}>✓</span>
                          <span style={{ color: '#484848', fontSize: '0.9rem' }}>{svc.name || svc.ServiceName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Fine Print */}
                {selectedPackage.FinePrint && (
                  <div style={{ marginBottom: '20px', padding: '12px', background: '#f7f7f7', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: '#717171', fontSize: '0.85rem', lineHeight: 1.5 }}>{selectedPackage.FinePrint}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Fixed Footer with Button */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #ebebeb', background: '#fff' }}>
              
              {/* Book Now Button */}
              <button
                onClick={() => {
                  setPackageModalOpen(false);
                  setSelectedPackage(null);
                  navigate(`/booking/${vendorId}`);
                }}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: '#222',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Request Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Description Modal */}
      {descriptionModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setDescriptionModalOpen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              position: 'sticky',
              top: 0,
              background: 'white',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #ebebeb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>About this vendor</h3>
              <button
                onClick={() => setDescriptionModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#717171',
                  padding: '0.5rem'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {/* Modal Content */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{ 
                margin: 0, 
                lineHeight: 1.7, 
                color: '#222',
                whiteSpace: 'pre-wrap'
              }}>
                {vendor?.profile?.BusinessDescription || 'Welcome to our business! We provide exceptional event services tailored to your needs.'}
              </p>
            </div>
          </div>
        </div>
      )}

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
    </PageLayout>
  );
}

export default VendorProfilePage;
