import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config';
import { showBanner } from '../utils/helpers';
import { parseQueryParams, trackPageView } from '../utils/urlHelpers';
import SimpleWorkingLocationStep from '../components/SimpleWorkingLocationStep';
import SetupIncompleteBanner from '../components/SetupIncompleteBanner';
import { ServiceCard, PackageCard, PackageServiceTabs, PackageServiceList } from '../components/PackageServiceCard';
import './BecomeVendorPage.css';

// Google Maps API Key is imported from config.js

const BecomeVendorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, setCurrentUser } = useAuth();
  
  // Step IDs for mapping URL params to step indices
  const stepIds = ['account', 'categories', 'business-details', 'contact', 'location', 'services', 'cancellation-policy', 'business-hours', 'questionnaire', 'gallery', 'social-media', 'filters', 'stripe', 'google-reviews', 'policies', 'review'];

  // Check URL step param ONCE at mount time - this is the source of truth
  const urlStepRef = useRef(null);
  if (urlStepRef.current === null) {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    if (stepParam) {
      const targetIndex = stepIds.indexOf(stepParam);
      urlStepRef.current = targetIndex !== -1 ? targetIndex : false;
    } else {
      urlStepRef.current = false;
    }
  }

  // Initialize step - URL param takes absolute priority
  const getInitialStep = () => {
    // URL step param is the highest priority
    if (urlStepRef.current !== false) {
      return urlStepRef.current;
    }
    
    if (!currentUser) return 0;
    
    // Check if we're returning from a save (stored in sessionStorage)
    const savedStep = sessionStorage.getItem('vendorOnboardingStep');
    if (savedStep) {
      sessionStorage.removeItem('vendorOnboardingStep'); // Clear it after reading
      return parseInt(savedStep);
    }
    
    // If coming from "Complete Profile Setup" via state, always start at step 1
    if (location.state?.resetToFirst) return 1;
    
    // If navigating to a specific step from banner click via state
    if (location.state?.targetStep) {
      const targetIndex = stepIds.indexOf(location.state.targetStep);
      if (targetIndex !== -1) return targetIndex;
    }
    
    return 1;
  };
  
  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [loading, setLoading] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [existingVendorData, setExistingVendorData] = useState(null);
  const [isExistingVendor, setIsExistingVendor] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [featuresLoadedFromDB, setFeaturesLoadedFromDB] = useState(false); // Track if features were loaded from database
  const [initialDataLoaded, setInitialDataLoaded] = useState(false); // Prevent re-fetching after save
  const [profileStatus, setProfileStatus] = useState('draft'); // 'draft', 'pending_review', 'approved', 'rejected'
  const [rejectionReason, setRejectionReason] = useState(''); // Reason for rejection if profile was rejected
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Success modal after Go Live
  
  // Form data state
  const [formData, setFormData] = useState({
    // Categories
    primaryCategory: '',
    additionalCategories: [],
    
    // Business Details
    businessName: '',
    displayName: '',
    businessDescription: '',
    yearsInBusiness: '',
    tagline: '',
    priceRange: '',
    profileLogo: '',
    
    // Contact
    businessPhone: '',
    website: '',
    email: currentUser?.email || '',
    
    // Location
    address: '',
    city: '',
    province: '',
    country: 'Canada',
    postalCode: '',
    latitude: null,
    longitude: null,
    serviceAreas: [],
    
    // Services (category-based selection)
    selectedServices: [],
    
    // Business Hours
    businessHours: {
      monday: { isAvailable: true, openTime: '09:00', closeTime: '17:00' },
      tuesday: { isAvailable: true, openTime: '09:00', closeTime: '17:00' },
      wednesday: { isAvailable: true, openTime: '09:00', closeTime: '17:00' },
      thursday: { isAvailable: true, openTime: '09:00', closeTime: '17:00' },
      friday: { isAvailable: true, openTime: '09:00', closeTime: '17:00' },
      saturday: { isAvailable: false, openTime: '10:00', closeTime: '16:00' },
      sunday: { isAvailable: false, openTime: '10:00', closeTime: '16:00' }
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Vendor Questionnaire
    selectedFeatures: [],
    
    // Gallery
    uploadedPhotos: [],
    photoURLs: [],
    
    // Social Media
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    
    // Popular Filters
    selectedFilters: [],
    
    // Policies & FAQs
    cancellationPolicy: '',
    depositPercentage: '',
    paymentTerms: '',
    faqs: [],
    
    // Google Reviews
    googlePlaceId: '',
    
    // Stripe
    stripeConnected: false
  });

  // Available categories - matching BusinessInformationPanel IDs
  const availableCategories = [
    { id: 'venue', name: 'Venues', icon: '🏛️', description: 'Event spaces and locations' },
    { id: 'photo', name: 'Photo/Video', icon: '📸', description: 'Photography and videography' },
    { id: 'music', name: 'Music/DJ', icon: '🎵', description: 'Music and DJ services' },
    { id: 'catering', name: 'Catering', icon: '🍽️', description: 'Food and beverage services' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎭', description: 'Performers and entertainers' },
    { id: 'experiences', name: 'Experiences', icon: '⭐', description: 'Unique event experiences' },
    { id: 'decor', name: 'Decorations', icon: '🎨', description: 'Event decorations and styling' },
    { id: 'beauty', name: 'Beauty', icon: '💄', description: 'Hair, makeup, and beauty services' },
    { id: 'cake', name: 'Cake', icon: '🎂', description: 'Wedding and event cakes' },
    { id: 'transport', name: 'Transportation', icon: '🚗', description: 'Event transportation services' },
    { id: 'planner', name: 'Planners', icon: '📋', description: 'Event planning and coordination' },
    { id: 'fashion', name: 'Fashion', icon: '👗', description: 'Wedding and event fashion' },
    { id: 'stationery', name: 'Stationery', icon: '✉️', description: 'Invitations and stationery' }
  ];

  const canadianProvinces = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon'
  ];

  const canadianCities = [
    'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 
    'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener',
    'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor'
  ];

  const filterOptions = [
    { id: 'filter-premium', label: 'Premium', icon: 'fa-crown', color: '#fbbf24' },
    { id: 'filter-eco-friendly', label: 'Eco-Friendly', icon: 'fa-leaf', color: '#10b981' },
    { id: 'filter-award-winning', label: 'Award Winning', icon: 'fa-trophy', color: '#f59e0b' },
    { id: 'filter-last-minute', label: 'Last Minute Availability', icon: 'fa-bolt', color: '#3b82f6' },
    { id: 'filter-certified', label: 'Certified', icon: 'fa-award', color: '#8b5cf6' },
    { id: 'filter-insured', label: 'Insured', icon: 'fa-shield-alt', color: '#10b981' },
    { id: 'filter-local', label: 'Local', icon: 'fa-map-marker-alt', color: '#ef4444' },
    { id: 'filter-accessible', label: 'Accessible', icon: 'fa-wheelchair', color: '#06b6d4' }
  ];

  const steps = [
    {
      id: 'account',
      title: currentUser ? `Welcome, ${currentUser.name}!` : 'Welcome to PlanBeau',
      subtitle: 'Please log in or create an account to continue',
      component: AccountStep,
      required: true
    },
    {
      id: 'categories',
      title: 'What services do you offer?',
      subtitle: 'Select your primary category and any additional categories',
      component: CategoriesStep,
      required: true
    },
    {
      id: 'business-details',
      title: 'Tell us about your business',
      subtitle: 'Help clients understand what makes you unique',
      component: BusinessDetailsStep,
      required: true
    },
    {
      id: 'contact',
      title: 'How can we reach you?',
      subtitle: 'Provide your contact information',
      component: ContactStep,
      required: true
    },
    {
      id: 'location',
      title: 'Where are you located?',
      subtitle: 'Set your business address and service areas',
      component: SimpleWorkingLocationStep,
      required: true
    },
    {
      id: 'services',
      title: 'What services do you provide?',
      subtitle: 'Select services from your categories and set pricing',
      component: ServicesStep,
      required: false,
      skippable: true
    },
    {
      id: 'cancellation-policy',
      title: 'Set your cancellation policy',
      subtitle: 'Protect your business while giving clients confidence when booking',
      component: CancellationPolicyStep,
      required: false,
      skippable: true
    },
    {
      id: 'business-hours',
      title: 'When are you available?',
      subtitle: 'Set your business hours',
      component: BusinessHoursStep,
      required: true
    },
    {
      id: 'questionnaire',
      title: 'Tell guests what your place has to offer',
      subtitle: 'Select features that describe your services',
      component: QuestionnaireStep,
      required: false,
      skippable: true
    },
    {
      id: 'gallery',
      title: 'Add photos to showcase your work',
      subtitle: 'You can add more photos after you publish your listing',
      component: GalleryStep,
      required: true
    },
    {
      id: 'social-media',
      title: 'Connect your social profiles',
      subtitle: 'Link your social media to increase engagement',
      component: SocialMediaStep,
      required: false,
      skippable: true
    },
    {
      id: 'filters',
      title: 'Enable special badges for your profile',
      subtitle: 'These help clients find you when browsing vendors',
      component: FiltersStep,
      required: false,
      skippable: true
    },
    {
      id: 'stripe',
      title: 'Connect Stripe for Payments',
      subtitle: 'Set up payment processing to accept online payments',
      component: StripeStep,
      required: false // Temporarily disabled for testing
    },
    {
      id: 'google-reviews',
      title: 'Connect Google Reviews',
      subtitle: 'Display your Google Business reviews on your profile',
      component: GoogleReviewsStep,
      required: false,
      skippable: true
    },
    {
      id: 'policies',
      title: 'Frequently Asked Questions',
      subtitle: 'Add common questions to help clients learn about your services',
      component: PoliciesStep,
      required: false,
      skippable: true
    },
    {
      id: 'review',
      title: 'Review your information',
      subtitle: 'Make sure everything looks good before completing setup',
      component: ReviewStep,
      required: true
    }
  ];

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setGoogleMapsLoaded(true);
    } else {
      // Google Maps already loaded by main app, just wait for it
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setGoogleMapsLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      
      return () => clearInterval(checkGoogle);
    }
    
    // Track page view with query parameters
    const queryParams = parseQueryParams(location.search);
    trackPageView('Become a Vendor', {
      step: currentStep,
      ...queryParams
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Force user to step 0 when profile is pending review or approved - block all navigation
  // BUT allow URL step param to override this for direct navigation
  useEffect(() => {
    if (profileStatus === 'pending_review' || profileStatus === 'approved') {
      // If URL step param was set at mount, respect it - don't force to step 0
      if (urlStepRef.current === false) {
        setCurrentStep(0);
      }
    }
  }, [profileStatus]);

  useEffect(() => {
    if (currentUser && formData.email === '') {
      setFormData(prev => ({ ...prev, email: currentUser.email }));
    }
  }, [currentUser]);

  // Fetch existing vendor profile data if user is already a vendor
  useEffect(() => {
    const fetchExistingVendorData = async () => {
      if (!currentUser || !currentUser.isVendor || !currentUser.vendorProfileId) {
        return;
      }
      
      // Skip re-fetching if we've already loaded data (prevents reset after save)
      if (initialDataLoaded) {
        return;
      }

      try {
        setLoadingProfile(true);

        const response = await fetch(`${API_BASE_URL}/vendors/profile?userId=${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch vendor profile');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setExistingVendorData(result.data);
          setIsExistingVendor(true);

          // Pre-populate form with existing data
          const profile = result.data.profile;
          
          // Load profile status for review workflow
          if (profile.ProfileStatus) {
            setProfileStatus(profile.ProfileStatus);
          }
          // Load rejection reason if profile was rejected
          if (profile.RejectionReason) {
            setRejectionReason(profile.RejectionReason);
          }
          const categories = result.data.categories || [];
          const services = result.data.services || [];
          const serviceAreas = result.data.serviceAreas || [];
          const businessHours = result.data.businessHours || [];
          const images = result.data.images || [];
          const selectedFeatures = result.data.selectedFeatures || [];
          const faqs = result.data.faqs || [];
          
          // Social media - convert from array format to object format
          let socialMedia = {};
          if (result.data.socialMedia?.length > 0) {
            result.data.socialMedia.forEach(sm => {
              const platform = sm.Platform?.toLowerCase();
              if (platform) {
                socialMedia[platform] = sm.URL || '';
              }
            });
          }

          // Map business hours from database format to form format
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const hoursMap = {};
          
          // Helper to format time for HTML time input (HH:MM format)
          const formatTimeForInput = (timeStr) => {
            if (!timeStr) return null;
            // Handle various time formats: "09:00:00", "09:00", "9:00 AM", etc.
            const str = String(timeStr);
            // If it's already in HH:MM format, return as-is
            if (/^\d{2}:\d{2}$/.test(str)) return str;
            // If it has seconds (HH:MM:SS), strip them
            if (/^\d{2}:\d{2}:\d{2}$/.test(str)) return str.substring(0, 5);
            // Try to parse other formats
            const match = str.match(/(\d{1,2}):(\d{2})/);
            if (match) {
              const hours = match[1].padStart(2, '0');
              const mins = match[2];
              return `${hours}:${mins}`;
            }
            return null;
          };
          
          businessHours.forEach(hour => {
            // DayOfWeek is a number 0-6 (Sunday=0, Monday=1, etc.)
            const dayIndex = typeof hour.DayOfWeek === 'number' ? hour.DayOfWeek : parseInt(hour.DayOfWeek);
            const day = dayNames[dayIndex];
            if (day) {
              hoursMap[day] = {
                isAvailable: hour.IsAvailable !== false && hour.IsAvailable !== 0,
                openTime: formatTimeForInput(hour.OpenTime) || '09:00',
                closeTime: formatTimeForInput(hour.CloseTime) || '17:00'
              };
            }
          });

          // Extract primary and additional categories
          // Use 'Category' property instead of 'CategoryName'
          const primaryCat = categories.find(c => c.IsPrimary)?.Category || categories[0]?.Category || '';
          const additionalCats = categories.filter(c => !c.IsPrimary).map(c => c.Category);

          // Map service areas to format expected by SimpleWorkingLocationStep
          const mappedServiceAreas = serviceAreas.map(area => ({
            id: area.VendorServiceAreaID,
            city: area.CityName || area.City || '',
            province: area.StateProvince || area.Province || area.State || '',
            state: area.StateProvince || area.Province || area.State || '',
            country: area.Country || 'Canada',
            name: area.CityName || area.City || '',
            placeId: area.PlaceID || null,
            formattedAddress: [area.CityName || area.City, area.StateProvince || area.Province].filter(Boolean).join(', ')
          }));

          // Extract photo URLs from images
          const photoURLs = images.map(img => img.ImageURL || img.imageUrl).filter(Boolean);

          const updatedFormData = {
            ...formData,
            // Categories
            primaryCategory: primaryCat,
            additionalCategories: additionalCats,
            
            // Business Details
            businessName: profile.BusinessName || '',
            displayName: profile.DisplayName || profile.BusinessName || '',
            businessDescription: profile.BusinessDescription || '',
            yearsInBusiness: profile.YearsInBusiness?.toString() || '',
            tagline: profile.Tagline || '',
            priceRange: profile.PriceRange || '',
            profileLogo: profile.ProfileLogo || profile.LogoURL || '',
            
            // Contact
            businessPhone: profile.BusinessPhone || '',
            website: profile.Website || '',
            email: profile.BusinessEmail || currentUser.email || '',
            
            // Location
            address: profile.Address || '',
            city: profile.City || '',
            province: profile.State || '',
            country: profile.Country || 'Canada',
            postalCode: profile.PostalCode || '',
            latitude: profile.Latitude || null,
            longitude: profile.Longitude || null,
            serviceAreas: mappedServiceAreas,
            
            // Services - map to the format expected by ServicesStep
            selectedServices: services.map(s => ({
              serviceId: s.VendorServiceID || s.PredefinedServiceID,
              serviceName: s.ServiceName,
              category: s.CategoryName,
              description: s.ServiceDescription || s.VendorDescription || '',
              imageURL: s.ImageURL || s.imageURL || '',
              pricingModel: s.PricingModel === 'time_based' ? 'hourly' : 
                           s.PricingModel === 'fixed_price' ? 'fixed' : 
                           s.PricingModel === 'per_attendee' ? 'per_person' : 'hourly',
              baseRate: s.BaseRate || s.FixedPrice || s.PricePerPerson || s.Price || '',
              baseDuration: s.BaseDurationMinutes ? (s.BaseDurationMinutes / 60).toString() : 
                           s.DurationMinutes ? (s.DurationMinutes / 60).toString() : '2',
              overtimeRate: s.OvertimeRatePerHour || '',
              minAttendees: s.MinimumAttendees || '',
              maxAttendees: s.MaximumAttendees || s.MaxAttendees || ''
            })),
            
            // Business Hours
            businessHours: {
              monday: hoursMap.monday || { isAvailable: true, openTime: '09:00', closeTime: '17:00' },
              tuesday: hoursMap.tuesday || { isAvailable: true, openTime: '09:00', closeTime: '17:00' },
              wednesday: hoursMap.wednesday || { isAvailable: true, openTime: '09:00', closeTime: '17:00' },
              thursday: hoursMap.thursday || { isAvailable: true, openTime: '09:00', closeTime: '17:00' },
              friday: hoursMap.friday || { isAvailable: true, openTime: '09:00', closeTime: '17:00' },
              saturday: hoursMap.saturday || { isAvailable: false, openTime: '10:00', closeTime: '16:00' },
              sunday: hoursMap.sunday || { isAvailable: false, openTime: '10:00', closeTime: '16:00' }
            },
            
            // Gallery
            photoURLs: photoURLs,
            
            // Questionnaire (selected features)
            selectedFeatures: selectedFeatures,
            
            // Social Media (keys are lowercase from our mapping above)
            facebook: socialMedia.facebook || '',
            instagram: socialMedia.instagram || '',
            twitter: socialMedia.twitter || '',
            linkedin: socialMedia.linkedin || '',
            youtube: socialMedia.youtube || '',
            tiktok: socialMedia.tiktok || '',
            
            // Policies & FAQs
            cancellationPolicy: profile.CancellationPolicy || '',
            depositPercentage: profile.DepositPercentage?.toString() || '',
            paymentTerms: profile.PaymentTerms || '',
            faqs: faqs.map(faq => ({
              id: faq.id || faq.FAQID,
              question: faq.question || faq.Question,
              answer: faq.answer || faq.Answer
            })),
            
            // Google Reviews
            googlePlaceId: profile.GooglePlaceId || ''
          };

          // Fetch Stripe status
          try {
            const stripeRes = await fetch(`${API_BASE_URL}/payments/connect/status/${currentUser.vendorProfileId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (stripeRes.ok) {
              const stripeData = await stripeRes.json();
              updatedFormData.stripeConnected = stripeData.connected || false;
            }
          } catch (e) {
          }

          // Fetch filters
          try {
            const filtersRes = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/filters`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (filtersRes.ok) {
              const filtersData = await filtersRes.json();
              // Check for filters string first, then fall back to boolean fields
              if (filtersData.filters) {
                updatedFormData.selectedFilters = filtersData.filters.split(',').filter(f => f.trim());
              } else if (filtersData.isPremium || filtersData.isFeatured) {
                updatedFormData.selectedFilters = ['filter-premium'];
              }
            }
          } catch (e) {
          }

          // Fetch social media from dedicated endpoint (more reliable than profile API)
          try {
            const socialRes = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/social`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (socialRes.ok) {
              const socialData = await socialRes.json();
              updatedFormData.facebook = socialData.facebook || '';
              updatedFormData.instagram = socialData.instagram || '';
              updatedFormData.twitter = socialData.twitter || '';
              updatedFormData.linkedin = socialData.linkedin || '';
              updatedFormData.youtube = socialData.youtube || '';
              updatedFormData.tiktok = socialData.tiktok || '';
            }
          } catch (e) {
          }

          // Fetch selected features from dedicated endpoint (more reliable than profile API)
          try {
            const featuresRes = await fetch(`${API_BASE_URL}/vendors/features/vendor/${currentUser.vendorProfileId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (featuresRes.ok) {
              const featuresData = await featuresRes.json();
              // Store feature objects with names for display in ReviewStep
              const featureObjects = featuresData.selectedFeatures?.map(f => ({
                id: f.FeatureID,
                name: f.FeatureName || f.Name || `Feature ${f.FeatureID}`
              })) || [];
              updatedFormData.selectedFeatures = featureObjects;
              setFeaturesLoadedFromDB(true); // Mark that we've loaded features from DB
            } else {
              setFeaturesLoadedFromDB(true); // Still mark as loaded even if empty
            }
          } catch (e) {
            setFeaturesLoadedFromDB(true); // Still mark as loaded even on error
          }

          // Fetch packages from dedicated endpoint
          try {
            const packagesRes = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/packages`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (packagesRes.ok) {
              const packagesData = await packagesRes.json();
              updatedFormData.packages = (packagesData.packages || []).map(pkg => ({
                id: pkg.PackageID || pkg.id,
                name: pkg.PackageName || pkg.name,
                description: pkg.Description || pkg.description || '',
                price: pkg.Price || pkg.price || 0,
                salePrice: pkg.SalePrice || pkg.salePrice || null,
                priceType: pkg.PriceType || pkg.priceType || 'flat',
                includedServices: pkg.IncludedServices || pkg.includedServices || [],
                imageURL: pkg.ImageURL || pkg.imageURL || '',
                duration: pkg.Duration || pkg.DurationMinutes || pkg.duration || '',
                finePrint: pkg.FinePrint || pkg.finePrint || '',
                isActive: pkg.IsActive !== undefined ? pkg.IsActive : true
              }));
            }
          } catch (e) {
            console.error('Error fetching packages:', e);
          }

          setFormData(updatedFormData);
          setInitialDataLoaded(true); // Mark that initial data has been loaded

          showBanner('Your existing profile data has been loaded', 'success');
        }
      } catch (error) {
        console.error('Error fetching vendor profile:', error);
        // Don't show error banner - just let them fill out the form
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchExistingVendorData();
  }, [currentUser, initialDataLoaded]);

  // Update URL when step changes to keep it in sync (but don't on initial mount if URL already has step)
  const hasUpdatedUrl = useRef(false);
  useEffect(() => {
    if (steps.length > 0 && currentStep >= 0) {
      // Skip first update if URL already had a step param
      if (!hasUpdatedUrl.current && urlStepRef.current !== false) {
        hasUpdatedUrl.current = true;
        return;
      }
      hasUpdatedUrl.current = true;
      const currentStepId = steps[currentStep]?.id;
      if (currentStepId) {
        window.history.replaceState({}, document.title, `/become-a-vendor/setup?step=${currentStepId}`);
      }
    }
  }, [currentStep, steps]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save progress without moving to next step
  const handleSaveProgress = async () => {
    if (!currentUser) {
      showBanner('Please log in first', 'error');
      return;
    }

    setLoading(true);
    try {
      const allCategories = [formData.primaryCategory, ...formData.additionalCategories].filter(Boolean);

      // Format service areas properly - backend expects city, state, country properties
      const formattedServiceAreas = formData.serviceAreas.length > 0 
        ? formData.serviceAreas.map(area => {
            if (typeof area === 'string') {
              return { 
                city: area, 
                state: formData.province, 
                country: 'Canada',
                placeId: '' // Empty string for placeId
              };
            }
            return {
              city: area.name || area.city || area,
              state: area.state || area.province || formData.province,
              country: area.country || 'Canada',
              placeId: area.placeId ? String(area.placeId) : (area.id ? String(area.id) : ''), // Convert to string
              latitude: area.latitude || null,
              longitude: area.longitude || null
            };
          })
        : [{ 
            city: formData.city, 
            state: formData.province, 
            country: 'Canada',
            placeId: '' // Empty string for placeId
          }];

      const vendorData = {
        userId: currentUser.id,
        businessName: formData.businessName,
        displayName: formData.displayName || formData.businessName,
        businessDescription: formData.businessDescription,
        yearsInBusiness: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness) : null,
        tagline: formData.tagline,
        priceRange: formData.priceRange,
        profileLogo: formData.profileLogo,
        businessPhone: formData.businessPhone,
        website: formData.website,
        email: formData.email || currentUser.email,
        address: formData.address || null,
        city: formData.city,
        province: formData.province,
        country: formData.country || 'Canada',
        postalCode: formData.postalCode || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        primaryCategory: formData.primaryCategory,
        categories: allCategories,
        serviceAreas: formattedServiceAreas,
        selectedServices: formData.selectedServices,
        businessHours: formData.businessHours,
        timezone: formData.timezone,
        selectedFeatures: formData.selectedFeatures,
        photoURLs: formData.photoURLs,
        socialMedia: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          youtube: formData.youtube,
          tiktok: formData.tiktok
        },
        filters: formData.selectedFilters,
        cancellationPolicy: formData.cancellationPolicy,
        depositPercentage: formData.depositPercentage ? parseInt(formData.depositPercentage) : null,
        paymentTerms: formData.paymentTerms,
        faqs: formData.faqs,
        googlePlaceId: formData.googlePlaceId
      };

      // Always use POST - the backend handles both create and update
      const endpoint = `${API_BASE_URL}/vendors/onboarding`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(vendorData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save failed - Response:', errorText);
        let errorMessage = 'Failed to save progress';
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      const vendorProfileId = result.vendorProfileId;
      
      // ALWAYS update currentUser with vendorProfileId (for both new and existing)
      if (vendorProfileId) {
        
        setCurrentUser(prev => ({
          ...prev,
          vendorProfileId: vendorProfileId,
          isVendor: true
        }));
        setIsExistingVendor(true);
        
        // Update localStorage as well
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.vendorProfileId = vendorProfileId;
        storedUser.isVendor = true;
        localStorage.setItem('user', JSON.stringify(storedUser));
        
        // Also save features to dedicated endpoint if any are selected
        if (formData.selectedFeatures && formData.selectedFeatures.length > 0) {
          try {
            const featuresResponse = await fetch(`${API_BASE_URL}/vendors/features/vendor/${vendorProfileId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ featureIds: formData.selectedFeatures })
            });
            if (featuresResponse.ok) {
            } else {
              console.error('[Save] Failed to save features:', await featuresResponse.text());
            }
          } catch (featuresError) {
            console.error('[Save] Error saving features:', featuresError);
          }
        }
        
        // Also save filters to dedicated endpoint if any are selected
        if (formData.selectedFilters && formData.selectedFilters.length > 0) {
          try {
            const filtersResponse = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/filters`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ filters: formData.selectedFilters.join(',') })
            });
            if (filtersResponse.ok) {
            } else {
              console.error('[Save] Failed to save filters:', await filtersResponse.text());
            }
          } catch (filtersError) {
            console.error('[Save] Error saving filters:', filtersError);
          }
        }

        // Save services with imageURL to step3-services endpoint
        if (formData.selectedServices && formData.selectedServices.length > 0) {
          try {
            const serviceCategories = Array.from(new Set(formData.selectedServices.map(s => s.category).filter(Boolean)))
              .map((name, i) => ({ name, description: null, displayOrder: i }));
            
            const servicesPayload = {
              vendorProfileId: vendorProfileId,
              serviceCategories,
              selectedPredefinedServices: formData.selectedServices.map(s => ({
                predefinedServiceId: s.serviceId,
                name: s.serviceName,
                description: s.description || '',
                durationMinutes: parseInt(s.baseDuration) * 60 || 60,
                imageURL: s.imageURL || null,
                pricingModel: s.pricingModel || 'time_based',
                baseDurationMinutes: parseInt(s.baseDuration) * 60 || 60,
                baseRate: s.baseRate ? parseFloat(s.baseRate) : null,
                overtimeRatePerHour: s.overtimeRate ? parseFloat(s.overtimeRate) : null,
                fixedPrice: s.fixedPrice ? parseFloat(s.fixedPrice) : null,
                pricePerPerson: s.pricePerPerson ? parseFloat(s.pricePerPerson) : null,
                minimumAttendees: s.minimumAttendees ? parseInt(s.minimumAttendees) : null,
                maximumAttendees: s.maximumAttendees ? parseInt(s.maximumAttendees) : null,
                salePrice: s.salePrice ? parseFloat(s.salePrice) : null,
                price: s.baseRate || s.fixedPrice || s.pricePerPerson || 0
              })),
              services: formData.selectedServices.map(s => ({
                name: s.serviceName,
                description: s.description || '',
                imageURL: s.imageURL || null,
                pricingModel: s.pricingModel || 'time_based',
                baseDurationMinutes: parseInt(s.baseDuration) * 60 || 60,
                baseRate: s.baseRate ? parseFloat(s.baseRate) : null,
                overtimeRatePerHour: s.overtimeRate ? parseFloat(s.overtimeRate) : null,
                fixedPrice: s.fixedPrice ? parseFloat(s.fixedPrice) : null,
                pricePerPerson: s.pricePerPerson ? parseFloat(s.pricePerPerson) : null,
                minimumAttendees: s.minimumAttendees ? parseInt(s.minimumAttendees) : null,
                maximumAttendees: s.maximumAttendees ? parseInt(s.maximumAttendees) : null,
                salePrice: s.salePrice ? parseFloat(s.salePrice) : null,
                durationMinutes: parseInt(s.baseDuration) * 60 || 60,
                linkedPredefinedServiceId: s.serviceId,
                categoryName: s.category || null
              }))
            };
            
            const servicesResponse = await fetch(`${API_BASE_URL}/vendors/setup/step3-services`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify(servicesPayload)
            });
            if (!servicesResponse.ok) {
              console.error('[Save] Failed to save services:', await servicesResponse.text());
            }
          } catch (servicesError) {
            console.error('[Save] Error saving services:', servicesError);
          }
        }
      }

      showBanner('Progress saved successfully! You can continue editing or move to the next step.', 'success');
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error details:', error.message);
      showBanner(error.message || 'Failed to save progress', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check if a step is completed based on form data
  // Only returns true if the step has been saved successfully with valid data
  const isStepCompleted = (stepId) => {
    if (!isExistingVendor) return false;

    switch (stepId) {
      case 'account':
        return !!currentUser;
      case 'categories':
        // MANDATORY: Must have a primary category selected
        return !!(formData.primaryCategory && formData.primaryCategory.trim());
      case 'business-details':
        // MANDATORY: Must have business name AND display name (required fields)
        const hasBusinessName = formData.businessName && formData.businessName.trim().length > 0;
        const hasDisplayName = formData.displayName && formData.displayName.trim().length > 0;
        return !!(hasBusinessName && hasDisplayName);
      case 'contact':
        // MANDATORY: Must have business phone AND email filled in
        const hasPhone = formData.businessPhone && formData.businessPhone.trim().length > 0;
        const hasEmail = formData.email && formData.email.trim().length > 0;
        return !!(hasPhone && hasEmail);
      case 'location':
        // MANDATORY: Must have city, province, and at least one service area
        const hasCity = formData.city && formData.city.trim().length > 0;
        const hasProvince = formData.province && formData.province.trim().length > 0;
        const hasServiceAreas = formData.serviceAreas && formData.serviceAreas.length > 0;
        return !!(hasCity && hasProvince && hasServiceAreas);
      case 'services':
        // Optional - at least one service
        return formData.selectedServices && formData.selectedServices.length > 0;
      case 'business-hours':
        // MANDATORY: Must have at least one day with availability set
        return formData.businessHours && Object.values(formData.businessHours).some(h => h.isAvailable);
      case 'questionnaire':
        // Optional - features
        if (!featuresLoadedFromDB && isExistingVendor) return true;
        return formData.selectedFeatures && formData.selectedFeatures.length > 0;
      case 'gallery':
        // MANDATORY: Must have at least 5 photos uploaded
        return formData.photoURLs && formData.photoURLs.length >= 5;
      case 'social-media':
        // Optional - at least one social media link
        return !!(formData.facebook || formData.instagram || formData.twitter || formData.linkedin);
      case 'filters':
        // Optional - badges
        return formData.selectedFilters && formData.selectedFilters.length > 0;
      case 'stripe':
        // MANDATORY: Must have Stripe connected
        return !!formData.stripeConnected;
      case 'google-reviews':
        // Optional - Google reviews
        return !!(formData.googlePlaceId && formData.googlePlaceId.trim().length > 0);
      case 'policies':
        // Optional - FAQs
        return !!(formData.faqs && formData.faqs.length > 0);
      case 'cancellation-policy':
        // Optional - cancellation policy
        return !!(formData.cancellationPolicy);
      default:
        return false;
    }
  };

  const handleAccountCreated = (userData) => {
    // Update auth context
    setCurrentUser(userData);
    window.currentUser = userData;
    
    // If URL step param was set at mount, respect it
    if (urlStepRef.current !== false) {
      setCurrentStep(urlStepRef.current);
      return;
    }
    
    // If user is an existing vendor with a profile, stay on step 0 (welcome)
    // to let the useEffect fetch their data and show the progress indicators
    // This matches the behavior of "Complete Profile Setup" button
    if (userData.isVendor && userData.vendorProfileId) {
      setCurrentStep(0);
      // The useEffect will fetch vendor data and show progress indicators
    } else {
      // New vendor - move to next step (categories)
      setCurrentStep(1);
    }
  };

  const handleNext = () => {
    // Block navigation if profile is pending review or approved (unless URL step param was used)
    if ((profileStatus === 'pending_review' || profileStatus === 'approved') && urlStepRef.current === false) {
      return;
    }
    
    // Only validate required steps
    const currentStepData = steps[currentStep];
    
    if (currentStep === 0 && !currentUser) {
      showBanner('Please log in to continue', 'error');
      return;
    }
    
    // Only validate if step is required and not skippable
    if (currentStepData?.required && !currentStepData?.skippable) {
      if (currentStep === 1 && !formData.primaryCategory) {
        showBanner('Please select a primary category', 'error');
        return;
      }
      if (currentStep === 2) {
        if (!formData.businessName.trim() || !formData.displayName.trim()) {
          showBanner('Please enter business name and display name', 'error');
          return;
        }
      }
      if (currentStep === 3 && !formData.businessPhone.trim()) {
        showBanner('Please enter your business phone number', 'error');
        return;
      }
      
      // Validation for location step (step 4)
      if (currentStep === 4) {
        if (!formData.city.trim()) {
          showBanner('Please enter your city', 'error');
          return;
        }
        if (!formData.province.trim()) {
          showBanner('Please select your province', 'error');
          return;
        }
        if (formData.serviceAreas.length === 0) {
          showBanner('Please add at least one service area', 'error');
          return;
        }
      }
    }

    if (currentStep < steps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleBack = () => {
    // Block navigation if profile is pending review or approved (unless URL step param was used)
    if ((profileStatus === 'pending_review' || profileStatus === 'approved') && urlStepRef.current === false) {
      return;
    }
    
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!currentUser) {
        showBanner('Please log in to complete setup', 'error');
        return;
      }

      // If features haven't been loaded yet and user is an existing vendor, fetch them now
      let currentFeatures = formData.selectedFeatures || [];
      if (currentUser.vendorProfileId && (!featuresLoadedFromDB || currentFeatures.length === 0)) {
        try {
          const featuresRes = await fetch(`${API_BASE_URL}/vendors/features/vendor/${currentUser.vendorProfileId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (featuresRes.ok) {
            const featuresData = await featuresRes.json();
            const featureIds = featuresData.selectedFeatures?.map(f => f.FeatureID) || [];
            if (featureIds.length > 0) {
              currentFeatures = featureIds;
              // Update formData with the fetched features
              setFormData(prev => ({ ...prev, selectedFeatures: featureIds }));
            }
          }
        } catch (e) {
        }
      }

      const allCategories = [formData.primaryCategory, ...formData.additionalCategories].filter(Boolean);

      // Format service areas properly - backend expects city, state, country properties
      const formattedServiceAreas = formData.serviceAreas.length > 0 
        ? formData.serviceAreas.map(area => {
            if (typeof area === 'string') {
              return { 
                city: area, 
                state: formData.province, 
                country: 'Canada',
                placeId: '' // Empty string for placeId
              };
            }
            return {
              city: area.name || area.city || area,
              state: area.state || area.province || formData.province,
              country: area.country || 'Canada',
              placeId: area.placeId ? String(area.placeId) : (area.id ? String(area.id) : ''), // Convert to string
              latitude: area.latitude || null,
              longitude: area.longitude || null
            };
          })
        : [{ 
            city: formData.city, 
            state: formData.province, 
            country: 'Canada',
            placeId: '' // Empty string for placeId
          }];

      const vendorData = {
        userId: currentUser.id,
        businessName: formData.businessName,
        displayName: formData.displayName,
        businessDescription: formData.businessDescription,
        businessPhone: formData.businessPhone,
        website: formData.website || null,
        yearsInBusiness: parseInt(formData.yearsInBusiness) || 1,
        address: formData.address || null,
        city: formData.city,
        state: formData.province,
        province: formData.province,
        country: formData.country,
        postalCode: formData.postalCode || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        primaryCategory: formData.primaryCategory,
        categories: allCategories,
        serviceAreas: formattedServiceAreas,
        selectedServices: formData.selectedServices,
        businessHours: formData.businessHours,
        timezone: formData.timezone,
        selectedFeatures: formData.selectedFeatures,
        photoURLs: formData.photoURLs,
        socialMedia: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          twitter: formData.twitter,
          linkedin: formData.linkedin,
          youtube: formData.youtube,
          tiktok: formData.tiktok
        },
        filters: formData.selectedFilters,
        cancellationPolicy: formData.cancellationPolicy,
        depositPercentage: formData.depositPercentage ? parseInt(formData.depositPercentage) : null,
        paymentTerms: formData.paymentTerms,
        faqs: formData.faqs,
        googlePlaceId: formData.googlePlaceId
      };

      // Use currentFeatures which may have been fetched from API if not already loaded
      vendorData.selectedFeatures = currentFeatures;

      // Always use POST - the backend handles both create and update
      const endpoint = `${API_BASE_URL}/vendors/onboarding`;
      
      const method = 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(vendorData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${isExistingVendor ? 'update' : 'create'} vendor profile`);
      }

      const result = await response.json();
      const vendorProfileId = result.vendorProfileId || currentUser.vendorProfileId;
      
      setCurrentUser(prev => ({
        ...prev,
        isVendor: true,
        vendorProfileId: vendorProfileId
      }));

      // Save features to dedicated endpoint to ensure they're properly saved
      // This is important because the onboarding endpoint may not save features correctly
      if (vendorProfileId && currentFeatures && currentFeatures.length > 0) {
        try {
          const featuresResponse = await fetch(`${API_BASE_URL}/vendors/features/vendor/${vendorProfileId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ featureIds: currentFeatures })
          });
          if (!featuresResponse.ok) {
            console.error('[handleSubmit] Failed to save features:', await featuresResponse.text());
          }
        } catch (featuresError) {
          console.error('[handleSubmit] Error saving features:', featuresError);
        }
      }

      // Save filters to dedicated endpoint if any are selected
      if (vendorProfileId && formData.selectedFilters && formData.selectedFilters.length > 0) {
        try {
          const filtersResponse = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}/filters`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ filters: formData.selectedFilters.join(',') })
          });
          if (!filtersResponse.ok) {
            console.error('[handleSubmit] Failed to save filters:', await filtersResponse.text());
          }
        } catch (filtersError) {
          console.error('[handleSubmit] Error saving filters:', filtersError);
        }
      }

      showBanner(
        isExistingVendor 
          ? 'Vendor profile updated successfully! 🎉' 
          : 'Vendor profile created successfully! 🎉', 
        'success'
      );
      
      setTimeout(() => {
        navigate('/?dashboard=vendor-business-profile');
      }, 1500);

    } catch (error) {
      console.error('Error creating vendor profile:', error);
      showBanner(error.message || 'Failed to create vendor profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check if all mandatory steps are complete
  const areMandatoryStepsComplete = () => {
    const mandatorySteps = steps.filter(step => step.required);
    const incompleteSteps = mandatorySteps.filter(step => !isStepCompleted(step.id));
    return {
      allComplete: incompleteSteps.length === 0,
      incompleteSteps: incompleteSteps.map(s => s.title)
    };
  };

  // Handle Go Live - Submit profile for admin review
  const handleGoLive = async () => {
    try {
      setLoading(true);

      if (!currentUser || !currentUser.vendorProfileId) {
        showBanner('Please complete your profile first', 'error');
        return;
      }

      // Check if all mandatory steps are complete before allowing submission
      const { allComplete, incompleteSteps } = areMandatoryStepsComplete();
      if (!allComplete) {
        const stepNames = incompleteSteps.slice(0, 3).join(', ');
        const moreCount = incompleteSteps.length > 3 ? ` and ${incompleteSteps.length - 3} more` : '';
        showBanner(`Please complete all required steps before submitting: ${stepNames}${moreCount}`, 'error');
        setLoading(false);
        return;
      }

      // Prevent re-submission if already pending review
      if (profileStatus === 'pending_review') {
        showBanner('Your profile is already under review. Please wait for approval or feedback.', 'info');
        setLoading(false);
        return;
      }

      // First save the current profile data
      await handleSaveProgress();

      // Then submit for review
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/submit-for-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit profile for review');
      }

      const result = await response.json();
      setProfileStatus('pending_review');
      
      // Show success modal with confetti instead of banner
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error submitting for review:', error);
      showBanner(error.message || 'Failed to submit profile for review', 'error');
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="become-vendor-page">
      <header 
        className="become-vendor-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          backgroundColor: '#ffffff'
        }}
      >
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <img src="/images/logo.png" alt="PlanBeau" style={{ height: '50px', width: 'auto' }} />
          </div>
          <div className="header-actions">
            <button className="btn-text" onClick={() => navigate('/')}>
              Exit
            </button>
          </div>
        </div>
        {/* Progress bar inside header - inherits sticky positioning */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#f3f4f6'
        }}>
          <div style={{ 
            width: `${progress}%`,
            height: '100%',
            background: '#5e72e4',
            transition: 'width 0.4s ease',
            borderRadius: '0 2px 2px 0'
          }}></div>
        </div>
      </header>

      <main className="become-vendor-main" style={{ paddingBottom: '100px' }}>
        {loadingProfile ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="spinner"></div>
          </div>
        ) : profileStatus === 'pending_review' && urlStepRef.current === false ? (
          /* Show pending review message only if NOT navigating via URL step param */
          <div style={{ padding: '3rem 1rem', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', 
              borderRadius: '16px', 
              padding: '2.5rem',
              border: '2px solid #222222',
              textAlign: 'center'
            }}>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#222222',
                marginBottom: '1.5rem'
              }}>
                <i className="fas fa-hourglass-half" style={{ fontSize: '2rem', color: 'white' }}></i>
              </div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#111827', fontWeight: '700' }}>
                Profile Already Submitted
              </h2>
              <p style={{ color: '#374151', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Your vendor profile has already been submitted and is currently being reviewed by our support team. 
                Please wait for a response before making any changes. This process typically takes <strong>1-2 business days</strong>.
              </p>
              <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ margin: '0 0 0.75rem', color: '#1f2937', fontSize: '1rem', fontWeight: 600 }}>
                  What happens next?
                </h4>
                <ul style={{ 
                  margin: 0, 
                  padding: '0 0 0 1.25rem', 
                  textAlign: 'left',
                  color: '#4b5563',
                  fontSize: '0.95rem',
                  lineHeight: 1.8
                }}>
                  <li>Our team will review your business information</li>
                  <li>You'll receive an email notification once approved</li>
                  <li>If changes are needed, we'll let you know what to update</li>
                  <li>Once approved, your profile will be live and visible to clients</li>
                </ul>
              </div>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#222222',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 500,
                marginBottom: '1.5rem'
              }}>
                <i className="fas fa-clock"></i>
                <span>Status: Pending Review</span>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button 
                  onClick={() => navigate('/')}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'white',
                    border: '2px solid #222222',
                    borderRadius: '8px',
                    color: '#222222',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        ) : profileStatus === 'approved' && urlStepRef.current === false ? (
          /* Show approved message only if NOT navigating via URL step param */
          <div style={{ padding: '3rem 1rem', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
              borderRadius: '16px', 
              padding: '2.5rem',
              textAlign: 'center'
            }}>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#10b981',
                marginBottom: '1.5rem'
              }}>
                <i className="fas fa-check-circle" style={{ fontSize: '2rem', color: 'white' }}></i>
              </div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#166534', fontWeight: '700' }}>
                Profile Approved!
              </h2>
              <p style={{ color: '#15803d', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Congratulations! Your vendor profile has been approved and is now live. 
                Clients can find and book your services.
              </p>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#10b981',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 500,
                marginBottom: '1.5rem'
              }}>
                <i className="fas fa-check"></i>
                <span>Status: Approved & Live</span>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button 
                  onClick={() => navigate('/dashboard')}
                  style={{
                    padding: '0.75rem 2rem',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`step-container ${isTransitioning ? 'fade-out' : ''}`} key={currentStep}>
            <div className="step-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 className="step-title">{steps[currentStep].title}</h1>
                {/* Mandatory/Optional badge */}
                {currentStep > 0 && currentStep < steps.length - 1 && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.35rem 0.75rem',
                    background: steps[currentStep].required ? '#fef3c7' : '#f3f4f6',
                    color: steps[currentStep].required ? '#92400e' : '#6b7280',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.025em'
                  }}>
                    {steps[currentStep].required ? 'Required' : 'Optional'}
                  </span>
                )}
                {/* Completed badge - only show if step has required fields filled */}
                {isExistingVendor && currentStep > 0 && isStepCompleted(steps[currentStep].id) && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.75rem',
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    <i className="fas fa-check"></i>
                    Complete
                  </span>
                )}
              </div>
              <p className="step-subtitle">
                {isExistingVendor && isStepCompleted(steps[currentStep].id) 
                  ? 'This section is already set up. You can review and update if needed.' 
                  : steps[currentStep].subtitle}
              </p>
            </div>

            <div className="step-content">
              <CurrentStepComponent
                formData={formData}
                onInputChange={handleInputChange}
                setFormData={setFormData}
                categories={availableCategories}
                provinces={canadianProvinces}
                cities={canadianCities}
                filterOptions={filterOptions}
                googleMapsLoaded={googleMapsLoaded}
                currentUser={currentUser}
                onAccountCreated={handleAccountCreated}
                isExistingVendor={isExistingVendor}
                isCompleted={isStepCompleted(steps[currentStep].id)}
                steps={steps}
                isStepCompleted={isStepCompleted}
                setCurrentStep={setCurrentStep}
                setFeaturesLoadedFromDB={setFeaturesLoadedFromDB}
                profileStatus={profileStatus}
                rejectionReason={rejectionReason}
              />
            </div>
          </div>
        )}
      </main>

      {/* Fixed footer navigation - v2 */}
      {(!(profileStatus === 'pending_review' || profileStatus === 'approved') || urlStepRef.current !== false) && (
      <div 
        id="vendor-footer-fixed"
        style={{
          position: 'fixed',
          bottom: '0px',
          left: '0px',
          right: '0px',
          zIndex: 99999,
          backgroundColor: '#ffffff',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.15)',
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%'
        }}>
          <button
            className="btn-back"
            onClick={handleBack}
            disabled={currentStep === 0}
            style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
          >
            Back
          </button>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {currentUser && currentStep > 0 && (
              <button
                className="btn-save"
                onClick={handleSaveProgress}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-small"></span>
                ) : (
                  'Save'
                )}
              </button>
            )}
            
            {steps[currentStep]?.skippable && (
              <button
                className="btn-skip"
                onClick={handleNext}
                disabled={loading}
              >
                <span className="skip-full">Skip for now</span>
                <span className="skip-short">Skip</span>
              </button>
            )}
            
            <button
              className="btn-next"
              onClick={currentStep === steps.length - 1 ? handleGoLive : handleNext}
              disabled={loading || (currentStep === 0 && !currentUser) || (currentStep === steps.length - 1 && (profileStatus === 'pending_review' || !areMandatoryStepsComplete().allComplete))}
              style={currentStep === steps.length - 1 ? { 
                background: profileStatus === 'pending_review' ? '#9ca3af' : (!areMandatoryStepsComplete().allComplete ? '#9ca3af' : '#10b981'),
                cursor: profileStatus === 'pending_review' || !areMandatoryStepsComplete().allComplete ? 'not-allowed' : 'pointer'
              } : {}}
              title={currentStep === steps.length - 1 && !areMandatoryStepsComplete().allComplete ? 'Complete all required steps to submit' : ''}
            >
              {loading ? (
                <span className="spinner-small"></span>
              ) : currentStep === steps.length - 1 ? (
                profileStatus === 'pending_review' ? 'Pending Review' : 'Go Live'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Success Modal with Confetti - After Go Live Submission */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          {/* Confetti Animation */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  background: ['#fbbf24', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  animation: `confetti-fall ${Math.random() * 3 + 2}s linear forwards`,
                  animationDelay: `${Math.random() * 2}s`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>

          {/* Modal Content */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
            }}>
              <i className="fas fa-check" style={{ fontSize: '2.5rem', color: 'white' }}></i>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
              Profile Submitted! 🎉
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your vendor profile has been submitted for review.
            </p>

            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-clock" style={{ color: '#f59e0b' }}></i>
                What happens next?
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 1.25rem', color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.8 }}>
                <li>Our team will review your profile within <strong>1-2 business days</strong></li>
                <li>You'll receive an email notification once approved</li>
                <li>If changes are needed, we'll let you know what to update</li>
                <li>Once approved, your profile will be live and visible to clients</li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => navigate('/?dashboard=vendor-business-profile')}
                style={{
                  width: '100%',
                  padding: '0.875rem 1.5rem',
                  background: '#222222',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Go to Profile Management
              </button>
              <button
                onClick={() => navigate('/vendors')}
                style={{
                  width: '100%',
                  padding: '0.875rem 1.5rem',
                  background: 'white',
                  color: '#222222',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Browse Vendors
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// STEP COMPONENTS BELOW
// Due to file size, I'll add these as inline components

function AccountStep({ currentUser, setFormData, formData, onAccountCreated, isExistingVendor, steps, isStepCompleted, setCurrentStep, profileStatus, rejectionReason }) {
  const [mode, setMode] = useState('signup'); // 'signup' or 'login'
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  // Check if user is an existing vendor (either from state or from currentUser data)
  const isVendorWithProfile = isExistingVendor || (currentUser?.isVendor && currentUser?.vendorProfileId);

  if (currentUser) {
    // Show pending review message if profile is submitted
    if (profileStatus === 'pending_review') {
      return (
        <div className="account-step" style={{ width: '100%' }}>
          <div style={{ width: '100%' }}>
            {/* Title and message - matching incomplete profile banner layout */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginBottom: '0.5rem',
                color: '#111827',
                fontSize: '1.1rem',
                fontWeight: 600
              }}>
                <i className="fas fa-hourglass-half" style={{ color: '#6b7280' }}></i>
                Profile Under Review
              </div>
              <p style={{ 
                margin: 0, 
                color: '#6b7280', 
                fontSize: '0.95rem',
                lineHeight: 1.5
              }}>
                Your vendor profile has been submitted and is currently being reviewed by our support team. 
                This process typically takes <strong>1-2 business days</strong>.
              </p>
            </div>

            {/* What happens next section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                fontWeight: 600, 
                color: '#374151', 
                marginBottom: '1rem', 
                fontSize: '1rem'
              }}>
                What happens next?
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {[
                  'Our team will review your business information',
                  "You'll receive an email notification once approved",
                  "If changes are needed, we'll let you know what to update",
                  'Once approved, your profile will be live and visible to clients'
                ].map((item, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(107, 114, 128, 0.08)',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '999px',
                      padding: '0.625rem 1.25rem',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <i className="fas fa-circle" style={{ color: '#6b7280', fontSize: '0.4rem' }}></i>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Status badge */}
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#222222',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 500
            }}>
              <i className="fas fa-clock"></i>
              <span>Status: Pending Review</span>
            </div>
          </div>
        </div>
      );
    }

    // Show approved message if profile is approved
    if (profileStatus === 'approved') {
      return (
        <div className="account-step">
          <div style={{ padding: '2rem 1rem', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
              borderRadius: '16px', 
              padding: '2.5rem',
              textAlign: 'center'
            }}>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#10b981',
                marginBottom: '1.5rem'
              }}>
                <i className="fas fa-check-circle" style={{ fontSize: '2rem', color: 'white' }}></i>
              </div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#166534', fontWeight: '700' }}>
                Profile Approved!
              </h2>
              <p style={{ color: '#15803d', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Congratulations! Your vendor profile has been approved and is now live. 
                Clients can find and book your services.
              </p>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#10b981',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 500
              }}>
                <i className="fas fa-check"></i>
                <span>Status: Approved & Live</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show rejected message if profile needs changes
    if (profileStatus === 'rejected') {
      return (
        <div className="account-step" style={{ width: '100%' }}>
          <div style={{ width: '100%' }}>
            {/* Title and message - matching incomplete profile banner layout */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginBottom: '0.5rem',
                color: '#991b1b',
                fontSize: '1.1rem',
                fontWeight: 600
              }}>
                <i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }}></i>
                Changes Requested
              </div>
              <p style={{ 
                margin: 0, 
                color: '#6b7280', 
                fontSize: '0.95rem',
                lineHeight: 1.5
              }}>
                Our team has reviewed your profile and requested some changes. 
                Please review the feedback below and update your profile accordingly.
              </p>
            </div>

            {/* Rejection Reason Section */}
            {rejectionReason && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  fontWeight: 600, 
                  color: '#991b1b', 
                  marginBottom: '1rem', 
                  fontSize: '1rem'
                }}>
                  <i className="fas fa-comment-alt" style={{ marginRight: '0.5rem' }}></i>
                  Feedback from our team:
                </div>
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  color: '#991b1b',
                  fontSize: '0.95rem',
                  lineHeight: 1.7
                }}>
                  {rejectionReason}
                </div>
              </div>
            )}

            {/* Status badge */}
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#ef4444',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 500,
              marginBottom: '2rem'
            }}>
              <i className="fas fa-edit"></i>
              <span>Status: Changes Requested</span>
            </div>
            
            {/* Show steps so they can make changes */}
            {isVendorWithProfile && steps && (
              <SetupIncompleteBanner
                steps={steps}
                isStepCompleted={isStepCompleted}
                onStepClick={(stepKey) => {
                  const stepIndex = steps.findIndex(s => s.id === stepKey);
                  if (stepIndex !== -1) {
                    setCurrentStep(stepIndex);
                  }
                }}
                hideButtons={true}
                showAllSteps={true}
              />
            )}
          </div>
        </div>
      );
    }

    // Default: Show normal step progress for draft profiles
    return (
      <div className="account-step" style={{ width: '100%' }}>
        <div style={{ width: '100%' }}>

          {/* Section Progress Indicators - Using shared SetupIncompleteBanner component */}
          {isVendorWithProfile && steps && (
            <SetupIncompleteBanner
              steps={steps}
              isStepCompleted={isStepCompleted}
              onStepClick={(stepKey) => {
                const stepIndex = steps.findIndex(s => s.id === stepKey);
                if (stepIndex !== -1) {
                  setCurrentStep(stepIndex);
                }
              }}
              hideButtons={true}
              showAllSteps={true}
            />
          )}

          {!isVendorWithProfile && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#5e72e4',
                marginBottom: '1rem'
              }}>
                <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', color: 'white' }}></i>
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: '600' }}>Welcome, {currentUser.name}!</h2>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Let's set up your vendor profile and start getting bookings.</p>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                borderRadius: '8px',
                color: '#6b7280',
                fontSize: '0.9rem'
              }}>
                <i className="fas fa-envelope"></i>
                <span>{currentUser.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'signup') {
      if (accountData.password !== accountData.confirmPassword) {
        showBanner('Passwords do not match', 'error');
        return;
      }
      if (accountData.password.length < 6) {
        showBanner('Password must be at least 6 characters', 'error');
        return;
      }
    }

    try {
      setLoading(true);
      const endpoint = mode === 'signup' ? '/users/register' : '/users/login';
      
      const payload = mode === 'signup' 
        ? {
            name: accountData.name,
            email: accountData.email,
            password: accountData.password,
            isVendor: true,
            accountType: 'vendor'
          }
        : {
            email: accountData.email,
            password: accountData.password
          };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `${mode === 'signup' ? 'Registration' : 'Login'} failed`);
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem('token', data.token);
      
      // Create user object - check if user is already a vendor from API response
      const existingVendorProfileId = data.vendorProfileId || data.user?.vendorProfileId;
      const isExistingVendor = data.isVendor || data.user?.isVendor || !!existingVendorProfileId;
      
      const userData = {
        id: data.userId || data.user?.id,
        userId: data.userId || data.user?.id,
        name: accountData.name || data.user?.name || data.name,
        email: accountData.email || data.user?.email || data.email,
        userType: isExistingVendor ? 'vendor' : 'client',
        isVendor: isExistingVendor,
        vendorProfileId: existingVendorProfileId
      };
      
      // Store user session
      localStorage.setItem('userSession', JSON.stringify(userData));
      
      // Update form data with email
      setFormData(prev => ({ ...prev, email: accountData.email }));
      
      showBanner(`${mode === 'signup' ? 'Account created' : 'Logged in'} successfully!`, 'success');
      
      // Call callback to update auth and move to next step
      if (onAccountCreated) {
        onAccountCreated(userData);
      }

    } catch (error) {
      console.error('Account error:', error);
      showBanner(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Consistent modal-style login matching ProfileModal
  return (
    <div className="account-step">
      <div style={{ 
        maxWidth: '440px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '0',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1F2937',
            margin: 0
          }}>
            Welcome to PlanBeau
          </h3>
        </div>
        
        <div style={{ padding: '24px' }}>
          {mode === 'login' ? (
            <form onSubmit={handleAccountSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Email</label>
                <input
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Password</label>
                <input
                  type="password"
                  value={accountData.password}
                  onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  width: '100%', 
                  padding: '14px',
                  backgroundColor: '#222222',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ color: '#6B7280', fontSize: '14px' }}>Don't have an account? </span>
                <button 
                  type="button" 
                  onClick={() => setMode('signup')} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#222222', 
                    fontSize: '14px', 
                    cursor: 'pointer', 
                    padding: 0, 
                    fontFamily: 'inherit',
                    fontWeight: '500'
                  }}
                >
                  Sign up
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
                <div style={{ padding: '0 16px', color: '#9CA3AF', fontSize: '14px', fontWeight: '500' }}>OR</div>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>
              </div>
              <p style={{ 
                textAlign: 'center', 
                fontSize: '12px', 
                color: '#9CA3AF',
                marginTop: '16px',
                marginBottom: 0
              }}>
                By signing up, you agree to our <a href="/terms-of-service" style={{ color: '#5B68F4' }}>Terms of Service</a> and <a href="/privacy-policy" style={{ color: '#5B68F4' }}>Privacy Policy</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleAccountSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Full Name *</label>
                <input
                  type="text"
                  value={accountData.name}
                  onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                  placeholder="John Doe"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Email *</label>
                <input
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  placeholder="your@email.com"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Password *</label>
                <input
                  type="password"
                  value={accountData.password}
                  onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                  minLength="6"
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Confirm Password *</label>
                <input
                  type="password"
                  value={accountData.confirmPassword}
                  onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                  minLength="6"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  width: '100%', 
                  padding: '14px',
                  backgroundColor: '#222222',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account & Continue'}
              </button>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ color: '#6B7280', fontSize: '14px' }}>Already have an account? </span>
                <button 
                  type="button" 
                  onClick={() => setMode('login')} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#222222', 
                    fontSize: '14px', 
                    cursor: 'pointer', 
                    padding: 0, 
                    fontFamily: 'inherit',
                    fontWeight: '500'
                  }}
                >
                  Log in
                </button>
              </div>
              <p style={{ 
                textAlign: 'center', 
                fontSize: '12px', 
                color: '#9CA3AF',
                margin: 0
              }}>
                By signing up, you agree to our <a href="/terms-of-service" style={{ color: '#5B68F4' }}>Terms of Service</a> and <a href="/privacy-policy" style={{ color: '#5B68F4' }}>Privacy Policy</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoriesStep({ formData, onInputChange, categories }) {
  const [additionalExpanded, setAdditionalExpanded] = useState(false);
  
  const handlePrimaryChange = (categoryId) => {
    onInputChange('primaryCategory', categoryId);
    const newAdditional = formData.additionalCategories.filter(c => c !== categoryId);
    onInputChange('additionalCategories', newAdditional);
  };

  const handleAdditionalToggle = (categoryId) => {
    if (categoryId === formData.primaryCategory) return;
    
    const newAdditional = formData.additionalCategories.includes(categoryId)
      ? formData.additionalCategories.filter(c => c !== categoryId)
      : [...formData.additionalCategories, categoryId];
    
    onInputChange('additionalCategories', newAdditional);
  };

  // Auto-expand if user has already selected additional categories
  const hasAdditionalSelected = formData.additionalCategories && formData.additionalCategories.length > 0;

  return (
    <div className="categories-step">
      <h3 style={{ marginBottom: '1.5rem', color: '#222', fontSize: '1.125rem', fontWeight: '600' }}>Primary Category <span style={{ color: '#ef4444' }}>*</span></h3>
      <div className="categories-grid">
        {categories.map(category => {
          const isSelected = formData.primaryCategory === category.id;
          return (
            <div
              key={category.id}
              className={`category-card ${isSelected ? 'selected primary' : ''}`}
              onClick={() => handlePrimaryChange(category.id)}
            >
              <div className="category-icon">{category.icon}</div>
              <div className="category-card-content">
                <h4 className="category-name">{category.name}</h4>
                <p className="category-description">{category.description}</p>
              </div>
              {isSelected && (
                <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', color: '#222222' }}></i>
              )}
            </div>
          );
        })}
      </div>

      {/* Collapsible Additional Categories Section - just header, no container */}
      <h3 
        onClick={() => setAdditionalExpanded(!additionalExpanded)}
        style={{ 
          marginTop: '2.5rem', 
          marginBottom: '1.5rem', 
          color: '#222', 
          fontSize: '1.125rem', 
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        Additional Categories (Optional)
        {hasAdditionalSelected && (
          <span style={{
            background: '#222222',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {formData.additionalCategories.length} selected
          </span>
        )}
        <i 
          className={`fas fa-chevron-${additionalExpanded || hasAdditionalSelected ? 'up' : 'down'}`}
          style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: 'auto' }}
        ></i>
      </h3>
      
      {(additionalExpanded || hasAdditionalSelected) && (
        <div className="categories-grid">
          {categories
            .filter(c => c.id !== formData.primaryCategory)
            .map(category => {
              const isSelected = formData.additionalCategories.includes(category.id);
              return (
                <div
                  key={category.id}
                  className={`category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleAdditionalToggle(category.id)}
                >
                  <div className="category-icon">{category.icon}</div>
                  <div className="category-card-content">
                    <h4 className="category-name">{category.name}</h4>
                    <p className="category-description">{category.description}</p>
                  </div>
                  {isSelected && (
                    <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', color: '#222222' }}></i>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// Remaining Step Components

function BusinessDetailsStep({ formData, onInputChange }) {
  const [logoPreview, setLogoPreview] = useState(formData.profileLogo || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Compress image to reduce size and prevent "request entity too large" error
  const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size - if over 500KB, compress it
      const maxSizeKB = 500;
      const fileSizeKB = file.size / 1024;
      
      setUploadingLogo(true);
      try {
        let imageData;
        if (fileSizeKB > maxSizeKB) {
          // Compress the image
          imageData = await compressImage(file, 400, 400, 0.7);
        } else {
          // Still compress slightly for consistency
          imageData = await compressImage(file, 600, 600, 0.85);
        }
        setLogoPreview(imageData);
        onInputChange('profileLogo', imageData);
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback to original method if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result);
          onInputChange('profileLogo', reader.result);
        };
        reader.readAsDataURL(file);
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  return (
    <div className="business-details-step">
      <div className="form-group">
        <label>Profile Logo</label>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="form-input"
              style={{ padding: '0.5rem' }}
            />
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Upload your business logo (JPG, PNG, or GIF)
            </p>
          </div>
          {(logoPreview || uploadingLogo) && (
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              overflow: 'hidden',
              border: '2px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb',
              position: 'relative'
            }}>
              {uploadingLogo ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: '#6b7280',
                  fontSize: '12px'
                }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px' }}></i>
                  <span>Processing...</span>
                </div>
              ) : (
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Business Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          type="text"
          value={formData.businessName}
          onChange={(e) => onInputChange('businessName', e.target.value)}
          className="form-input"
          placeholder="e.g., Elegant Events Catering"
        />
      </div>

      <div className="form-group">
        <label>Display Name <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => onInputChange('displayName', e.target.value)}
          className="form-input"
          placeholder="How you want to appear to clients"
        />
      </div>

      <div className="form-group">
        <label>Tagline</label>
        <input
          type="text"
          value={formData.tagline}
          onChange={(e) => onInputChange('tagline', e.target.value)}
          className="form-input"
          placeholder="A catchy phrase that describes your business"
          maxLength="100"
        />
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
          {formData.tagline?.length || 0}/100 characters
        </p>
      </div>

      <div className="form-group">
        <label>Business Description</label>
        <textarea
          value={formData.businessDescription}
          onChange={(e) => onInputChange('businessDescription', e.target.value)}
          className="form-textarea"
          rows="5"
          placeholder="Tell clients about your business, what makes you unique, and what they can expect..."
        />
      </div>

      <div className="form-group">
        <label>Price Range</label>
        <select
          value={formData.priceRange}
          onChange={(e) => onInputChange('priceRange', e.target.value)}
          className="form-input"
        >
          <option value="">Select price range</option>
          <option value="$">$ - Budget Friendly</option>
          <option value="$$">$$ - Moderate</option>
          <option value="$$$">$$$ - Premium</option>
          <option value="$$$$">$$$$ - Luxury</option>
        </select>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
          Help clients understand your pricing level
        </p>
      </div>

      <div className="form-group">
        <label>Years in Business</label>
        <input
          type="number"
          value={formData.yearsInBusiness}
          onChange={(e) => onInputChange('yearsInBusiness', e.target.value)}
          className="form-input"
          min="0"
          placeholder="e.g., 5"
        />
      </div>
    </div>
  );
}

function ContactStep({ formData, onInputChange }) {
  return (
    <div className="contact-step">
      <div className="form-group">
        <label>Business Phone <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          type="tel"
          value={formData.businessPhone}
          onChange={(e) => onInputChange('businessPhone', e.target.value)}
          className="form-input"
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="form-group">
        <label>Email <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          className="form-input"
          placeholder="your@email.com"
        />
      </div>

      <div className="form-group">
        <label>Website</label>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => onInputChange('website', e.target.value)}
          className="form-input"
          placeholder="https://yourwebsite.com"
        />
      </div>
    </div>
  );
}

// Location Step - With Google Places API Integration
function LocationStep({ formData, onInputChange, setFormData, provinces, googleMapsLoaded }) {
  const addressInputRef = useRef(null);
  const serviceAreaInputRef = useRef(null);
  const addressAutocompleteRef = useRef(null);
  const serviceAreaAutocompleteRef = useRef(null);
  const [serviceAreaInput, setServiceAreaInput] = useState('');

  // Initialize Google Places Autocomplete - EXACTLY like LocationServiceAreasPanel
  useEffect(() => {
    // Add retry mechanism in case Google Maps hasn't loaded yet
    const tryInitialize = () => {
      if (window.google?.maps?.places) {
        // Add small delay to ensure DOM elements are ready
        setTimeout(() => {
          initializeGoogleMaps();
        }, 100);
      } else {
        setTimeout(tryInitialize, 200);
      }
    };
    
    tryInitialize();
    
    // Cleanup
    return () => {
      if (addressAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(addressAutocompleteRef.current);
      }
      if (serviceAreaAutocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(serviceAreaAutocompleteRef.current);
      }
    };
  }, []); // Empty dependency - only run once on mount

  const initializeGoogleMaps = () => {

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('❌ Google Maps not ready yet');
      return;
    }
    
    if (!addressInputRef.current) {
      console.error('❌ Address input ref not ready');
      return;
    }
    
    // Address Autocomplete - EXACT COPY FROM WORKING TEST PAGE
    try {
      addressAutocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'ca' }
      });
      
      addressAutocompleteRef.current.addListener('place_changed', function() {
        const place = addressAutocompleteRef.current.getPlace();
        
        if (place.address_components) {
          const comps = place.address_components;
          const pick = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
          
          const streetNumber = pick('street_number');
          const route = pick('route');
          const fullAddress = streetNumber && route ? `${streetNumber} ${route}` : place.formatted_address;
          
          // Update form data
          setFormData(prev => ({
            ...prev,
            address: fullAddress || '',
            city: pick('locality') || pick('sublocality') || pick('postal_town') || '',
            province: pick('administrative_area_level_1') || '',
            country: pick('country') || 'Canada',
            postalCode: pick('postal_code') || '',
            latitude: place.geometry?.location?.lat() || null,
            longitude: place.geometry?.location?.lng() || null
          }));
        }
      });
    } catch (error) {
      console.error('❌ Error initializing address autocomplete:', error);
    }
    
    // Service Area Autocomplete - EXACT COPY FROM WORKING TEST PAGE
    if (serviceAreaInputRef.current) {
      try {
        serviceAreaAutocompleteRef.current = new window.google.maps.places.Autocomplete(serviceAreaInputRef.current, {
          types: ['(cities)'],
          componentRestrictions: { country: 'ca' }
        });
        
        serviceAreaAutocompleteRef.current.addListener('place_changed', function() {
          const place = serviceAreaAutocompleteRef.current.getPlace();
          
          if (place.address_components) {
            const comps = place.address_components;
            const pick = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
            const city = pick('locality') || pick('postal_town') || '';
            const areaToAdd = city || place.name || place.formatted_address?.split(',')[0];
            
            if (areaToAdd && !formData.serviceAreas.includes(areaToAdd)) {
              setFormData(prev => ({
                ...prev,
                serviceAreas: [...prev.serviceAreas, areaToAdd]
              }));
            }
            
            if (serviceAreaInputRef.current) {
              serviceAreaInputRef.current.value = '';
            }
          }
        });
      } catch (error) {
        console.error('❌ Error initializing city autocomplete:', error);
      }
    }
  };

  const handleAddServiceArea = () => {
    const inputValue = serviceAreaInputRef.current?.value?.trim();
    if (inputValue && !formData.serviceAreas.includes(inputValue)) {
      setFormData(prev => ({
        ...prev,
        serviceAreas: [...prev.serviceAreas, inputValue]
      }));
      if (serviceAreaInputRef.current) {
        serviceAreaInputRef.current.value = '';
      }
    }
  };

  const handleRemoveServiceArea = (area) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter(a => a !== area)
    }));
  };

  return (
    <div className="location-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        {/* Street Address with Google Autocomplete */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            Street Address <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            ref={addressInputRef}
            type="text"
            className="form-input"
            placeholder="Start typing your address..."
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.95rem'
            }}
          />
          <small style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: '#f59e0b', fontSize: '0.85rem' }}>
            <span>🔥</span> Start typing your address and Google will suggest it!
          </small>
        </div>

        {/* City and Province Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              City <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => onInputChange('city', e.target.value)}
              className="form-input"
              placeholder="Toronto"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                backgroundColor: '#f3f4f6'
              }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Province <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.province}
              onChange={(e) => onInputChange('province', e.target.value)}
              className="form-input"
              placeholder="Ontario"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                backgroundColor: '#f3f4f6'
              }}
            />
          </div>
        </div>

        {/* Postal Code and Country Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Postal Code <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => onInputChange('postalCode', e.target.value)}
              className="form-input"
              placeholder="M5H 2N2"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                backgroundColor: '#f3f4f6'
              }}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => onInputChange('country', e.target.value)}
              className="form-input"
              placeholder="Canada"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                backgroundColor: '#f3f4f6'
              }}
              readOnly
            />
          </div>
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />

        {/* Service Areas Section */}
        <div className="form-group">
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            Service Areas <span style={{ color: 'red' }}>*</span>
          </label>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Add the cities or regions where you offer your services
          </p>
          
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <input
              ref={serviceAreaInputRef}
              type="text"
              className="form-input"
              placeholder="Start typing a city name..."
              style={{
                flex: 1,
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddServiceArea();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddServiceArea}
              style={{
                padding: '0.875rem 1.5rem',
                backgroundColor: '#222222',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#000000'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#222222'}
            >
              <i className="fas fa-plus"></i> Add
            </button>
          </div>

          <small style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#f59e0b', fontSize: '0.85rem' }}>
            <span>🔥</span> Start typing a city name and Google will suggest it!
          </small>

          {/* Service Areas Tags */}
          {formData.serviceAreas.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
              {formData.serviceAreas.map((area, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    color: '#374151'
                  }}
                >
                  <i className="fas fa-map-marker-alt" style={{ fontSize: '0.8rem' }}></i>
                  {area}
                  <button
                    type="button"
                    onClick={() => handleRemoveServiceArea(area)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '0',
                      marginLeft: '0.25rem',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {formData.serviceAreas.length === 0 && (
            <div style={{ 
              padding: '1.5rem', 
              background: '#f9fafb', 
              borderRadius: '8px', 
              border: '2px dashed #e5e7eb',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <i className="fas fa-map-marked-alt" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
              No service areas added yet. Add cities where you provide services.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function ServicesStep({ formData, setFormData }) {
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  // Tabs and Packages state
  const [activeTab, setActiveTab] = useState('services');
  const [packages, setPackages] = useState(formData.packages || []);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageServiceSearch, setPackageServiceSearch] = useState('');
  const [uploadingPackageImage, setUploadingPackageImage] = useState(false);

  useEffect(() => {
    loadServices();
  }, [formData.primaryCategory, JSON.stringify(formData.additionalCategories)]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (showModal || showEditModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showModal, showEditModal]);

  // Map frontend category IDs to database category names
  const categoryToDbMapping = {
    'venue': ['Wedding', 'Event Planning'], // Venues serve weddings and events
    'photo': ['Photography'],
    'music': ['Music & Entertainment'],
    'catering': ['Catering'],
    'entertainment': ['Music & Entertainment', 'Event Planning'],
    'experiences': ['Event Planning'],
    'florist': ['Wedding'], // Florists are often wedding-related
    'beauty': ['Wedding'], // Beauty services often wedding-related
    'stationery': ['Wedding'],
    'rentals': ['Event Planning'],
    'transport': ['Wedding', 'Event Planning'],
    'officiant': ['Wedding'],
    'planner': ['Event Planning', 'Wedding']
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const allCategories = [formData.primaryCategory, ...formData.additionalCategories].filter(Boolean);
      
      if (allCategories.length === 0) {
        console.warn('ServicesStep - No categories selected yet');
        setAvailableServices([]);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/vendors/predefined-services`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const servicesByCategory = data.servicesByCategory || {};
        
        const filteredServices = [];
        const addedServiceIds = new Set(); // Prevent duplicates
        
        allCategories.forEach(frontendCategory => {
          // Get the database category names that map to this frontend category
          const dbCategories = categoryToDbMapping[frontendCategory] || [frontendCategory];
          
          dbCategories.forEach(dbCategory => {
            if (servicesByCategory[dbCategory]) {
              servicesByCategory[dbCategory].forEach(service => {
                if (!addedServiceIds.has(service.id)) {
                  addedServiceIds.add(service.id);
                  filteredServices.push({ ...service, category: frontendCategory });
                }
              });
            }
          });
        });
        
        setAvailableServices(filteredServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service) => {
    const isAlreadySelected = formData.selectedServices.some(s => s.serviceId === service.id);
    
    if (!isAlreadySelected) {
      const newService = {
        serviceId: service.id,
        serviceName: service.name,
        category: service.category,
        pricingModel: 'hourly',
        baseRate: '',
        baseDuration: '2',
        overtimeRate: '',
        description: ''
      };
      
      setFormData(prev => ({
        ...prev,
        selectedServices: [...prev.selectedServices, newService]
      }));
      
      // Auto-open edit mode for new service
      setEditingServiceId(service.id);
    }
    setShowModal(false);
    setSearchQuery('');
  };

  const handleRemoveService = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(s => s.serviceId !== serviceId)
    }));
    if (editingServiceId === serviceId) {
      setEditingServiceId(null);
    }
  };

  const handleServiceUpdate = (serviceId, field, value) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s =>
        s.serviceId === serviceId ? { ...s, [field]: value } : s
      )
    }));
  };

  const handleEditService = (service) => {
    setEditingService({ ...service });
    setShowEditModal(true);
  };

  const handleSaveEditedService = () => {
    if (editingService) {
      setFormData(prev => ({
        ...prev,
        selectedServices: prev.selectedServices.map(s =>
          s.serviceId === editingService.serviceId ? editingService : s
        )
      }));
      setShowEditModal(false);
      setEditingService(null);
    }
  };

  const handleEditModalUpdate = (field, value) => {
    setEditingService(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Package handlers
  const handleAddPackage = () => {
    setEditingPackage({ 
      name: '', 
      description: '', 
      price: '', 
      salePrice: '',
      priceType: 'fixed_price',
      baseRate: '',
      overtimeRate: '',
      fixedPrice: '',
      pricePerPerson: '',
      minAttendees: '',
      maxAttendees: '',
      includedServices: [],
      imageURL: '',
      finePrint: '',
      duration: ''
    });
    setPackageServiceSearch('');
    setShowPackageModal(true);
  };

  const handleEditPackage = (pkg, index) => {
    setEditingPackage({ 
      ...pkg, 
      _index: index,
      salePrice: pkg.salePrice || '',
      imageURL: pkg.imageURL || '',
      finePrint: pkg.finePrint || '',
      duration: pkg.duration || ''
    });
    setPackageServiceSearch('');
    setShowPackageModal(true);
  };

  // Package image upload handler
  const handlePackageImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingPackageImage(true);
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await fetch(`${API_BASE_URL}/vendors/service-image/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setEditingPackage(prev => ({ ...prev, imageURL: data.imageUrl }));
      }
    } catch (error) {
      console.error('Error uploading package image:', error);
    } finally {
      setUploadingPackageImage(false);
    }
  };

  const handleSavePackage = () => {
    if (!editingPackage?.name) return;
    
    // Determine price based on pricing model
    let priceValue = 0;
    const priceType = editingPackage.priceType || 'fixed_price';
    
    if (priceType === 'time_based') {
      if (!editingPackage.baseRate) return;
      priceValue = parseFloat(editingPackage.baseRate);
    } else if (priceType === 'per_attendee') {
      if (!editingPackage.pricePerPerson) return;
      priceValue = parseFloat(editingPackage.pricePerPerson);
    } else {
      // fixed_price
      if (!editingPackage.fixedPrice && !editingPackage.price) return;
      priceValue = parseFloat(editingPackage.fixedPrice || editingPackage.price);
    }
    
    const packageData = { 
      ...editingPackage, 
      id: editingPackage.id || Date.now(), 
      price: priceValue,
      salePrice: editingPackage.salePrice ? parseFloat(editingPackage.salePrice) : null,
      baseRate: editingPackage.baseRate ? parseFloat(editingPackage.baseRate) : null,
      overtimeRate: editingPackage.overtimeRate ? parseFloat(editingPackage.overtimeRate) : null,
      fixedPrice: editingPackage.fixedPrice ? parseFloat(editingPackage.fixedPrice) : null,
      pricePerPerson: editingPackage.pricePerPerson ? parseFloat(editingPackage.pricePerPerson) : null,
      minAttendees: editingPackage.minAttendees ? parseInt(editingPackage.minAttendees) : null,
      maxAttendees: editingPackage.maxAttendees ? parseInt(editingPackage.maxAttendees) : null,
      durationMinutes: editingPackage.duration ? Math.round(parseFloat(editingPackage.duration) * 60) : null
    };
    delete packageData._index;
    
    let updatedPackages;
    if (editingPackage._index !== undefined) {
      updatedPackages = [...packages];
      updatedPackages[editingPackage._index] = packageData;
    } else {
      updatedPackages = [...packages, packageData];
    }
    
    setPackages(updatedPackages);
    setFormData(prev => ({ ...prev, packages: updatedPackages }));
    setShowPackageModal(false);
    setEditingPackage(null);
  };

  const handleDeletePackage = (index) => {
    const updatedPackages = packages.filter((_, i) => i !== index);
    setPackages(updatedPackages);
    setFormData(prev => ({ ...prev, packages: updatedPackages }));
  };

  const toggleServiceInPackage = (serviceId) => {
    setEditingPackage(prev => ({
      ...prev,
      includedServices: prev.includedServices.includes(serviceId)
        ? prev.includedServices.filter(id => id !== serviceId)
        : [...prev.includedServices, serviceId]
    }));
  };

  const filteredServices = availableServices.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !formData.selectedServices.some(s => s.serviceId === service.id)
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="services-step">
      {/* Tabs */}
      <PackageServiceTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        packagesCount={packages.length}
        servicesCount={formData.selectedServices.length}
      />

      {/* Services Tab */}
      {activeTab === 'services' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h5 style={{ margin: 0, color: '#222', fontWeight: 600, fontSize: '1.25rem' }}>Your Services</h5>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '10px 20px',
                background: '#222',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <i className="fas fa-plus"></i> Add Service
            </button>
          </div>

      {/* Selected Services List - Using Universal ServiceCard Component */}
      <PackageServiceList>
        {formData.selectedServices.map((service, index) => (
          <ServiceCard
            key={`service-${service.serviceId}-${index}`}
            service={service}
            showActions={true}
            onEdit={() => handleEditService(service)}
            onDelete={() => handleRemoveService(service.serviceId)}
          />
        ))}
      </PackageServiceList>

      {/* Service Selection Modal */}
      {showModal && (
        <div className="service-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="service-modal" onClick={(e) => e.stopPropagation()}>
            <div className="service-modal-header">
              <h3>Add Service</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="service-modal-search">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="service-modal-list">
              {filteredServices.length === 0 ? (
                <div className="no-results">
                  {searchQuery ? 'No services found matching your search.' : 'All available services have been added.'}
                </div>
              ) : (
                filteredServices.map(service => (
                  <div
                    key={service.id}
                    className="service-modal-item"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <span className="service-modal-name">{service.name}</span>
                    <span className="service-modal-category">{service.category}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

        </>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}><i className="fas fa-info-circle" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>Create packages to bundle services together at a special price.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h5 style={{ margin: 0, color: '#222', fontWeight: 600, fontSize: '1.25rem' }}>Your Packages</h5>
            <button type="button" onClick={handleAddPackage} style={{ padding: '10px 20px', background: '#222', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-plus"></i> Create Package
            </button>
          </div>

          <PackageServiceList>
            {packages.map((pkg, index) => {
              // Map includedServices - handle both ID arrays and object arrays
              const rawIncluded = pkg.includedServices || pkg.IncludedServices || [];
              const mappedIncludedServices = rawIncluded.map(item => {
                // If item is already an object with name, use it directly
                if (typeof item === 'object' && item !== null) {
                  return { name: item.name || item.ServiceName || item.serviceName, serviceName: item.name || item.ServiceName || item.serviceName };
                }
                // If item is an ID, look it up in selectedServices
                const svc = formData.selectedServices.find(s => s.serviceId === item);
                return svc ? { name: svc.serviceName, serviceName: svc.serviceName } : null;
              }).filter(Boolean);
              
              return (
                <PackageCard
                  key={pkg.id || index}
                  pkg={{
                    ...pkg,
                    PackageName: pkg.name,
                    Price: pkg.price,
                    SalePrice: pkg.salePrice,
                    PriceType: pkg.priceType,
                    ImageURL: pkg.imageURL,
                    DurationMinutes: pkg.duration ? parseFloat(pkg.duration) * 60 : null,
                    IncludedServices: mappedIncludedServices
                  }}
                  showActions={true}
                  onEdit={() => handleEditPackage(pkg, index)}
                  onDelete={() => handleDeletePackage(index)}
                />
              );
            })}
          </PackageServiceList>
        </div>
      )}

      {/* Package Modal - Matching ServicesPackagesPanel Style */}
      {showPackageModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setShowPackageModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  {editingPackage?._index !== undefined ? 'Edit Package' : 'Create Package'}
                </h3>
                <button
                  onClick={() => setShowPackageModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', padding: 0 }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Package Image */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Package Image
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    width: '120px',
                    height: '90px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb'
                  }}>
                    {editingPackage?.imageURL ? (
                      <img src={editingPackage.imageURL} alt="Package" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-image" style={{ fontSize: '2rem', color: '#d1d5db' }}></i>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePackageImageUpload}
                      style={{ display: 'none' }}
                      id="become-vendor-package-image-upload"
                    />
                    <label
                      htmlFor="become-vendor-package-image-upload"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#f3f4f6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500
                      }}
                    >
                      {uploadingPackageImage ? 'Uploading...' : 'Upload Image'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Package Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Package Name *
                </label>
                <input
                  type="text"
                  value={editingPackage?.name || ''}
                  onChange={(e) => setEditingPackage(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Friday / Sunday Wedding"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Description
                </label>
                <textarea
                  value={editingPackage?.description || ''}
                  onChange={(e) => setEditingPackage(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what's included in this package..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Pricing Model - First */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Pricing Model *
                </label>
                <select
                  value={editingPackage?.priceType || 'time_based'}
                  onChange={(e) => setEditingPackage(prev => ({ ...prev, priceType: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="time_based">Time-based (Hourly)</option>
                  <option value="fixed_price">Fixed Price</option>
                  <option value="per_attendee">Per Attendee</option>
                </select>
              </div>

              {/* Dynamic Pricing Fields based on Price Type */}
              {editingPackage?.priceType === 'time_based' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Duration (hours) *
                    </label>
                    <input
                      type="number"
                      value={editingPackage?.duration || ''}
                      onChange={(e) => setEditingPackage(prev => ({ ...prev, duration: e.target.value }))}
                      min="0.5"
                      step="0.5"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Base Rate ($) *
                    </label>
                    <input
                      type="number"
                      value={editingPackage?.baseRate || ''}
                      onChange={(e) => setEditingPackage(prev => ({ ...prev, baseRate: e.target.value }))}
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Overtime ($/hr)
                    </label>
                    <input
                      type="number"
                      value={editingPackage?.overtimeRate || ''}
                      onChange={(e) => setEditingPackage(prev => ({ ...prev, overtimeRate: e.target.value }))}
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                </div>
              )}

              {editingPackage?.priceType === 'fixed_price' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Fixed Price ($) *
                    </label>
                    <input
                      type="number"
                      value={editingPackage?.fixedPrice || editingPackage?.price || ''}
                      onChange={(e) => setEditingPackage(prev => ({ ...prev, fixedPrice: e.target.value, price: e.target.value }))}
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={editingPackage?.duration || ''}
                      onChange={(e) => setEditingPackage(prev => ({ ...prev, duration: e.target.value }))}
                      min="0.5"
                      step="0.5"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                </div>
              )}

              {editingPackage?.priceType === 'per_attendee' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Price/Person ($) *
                      </label>
                      <input
                        type="number"
                        value={editingPackage?.pricePerPerson || editingPackage?.price || ''}
                        onChange={(e) => setEditingPackage(prev => ({ ...prev, pricePerPerson: e.target.value, price: e.target.value }))}
                        min="0"
                        step="0.01"
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Min Attendees
                      </label>
                      <input
                        type="number"
                        value={editingPackage?.minAttendees || ''}
                        onChange={(e) => setEditingPackage(prev => ({ ...prev, minAttendees: e.target.value }))}
                        min="1"
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Max Attendees
                      </label>
                      <input
                        type="number"
                        value={editingPackage?.maxAttendees || ''}
                        onChange={(e) => setEditingPackage(prev => ({ ...prev, maxAttendees: e.target.value }))}
                        min="1"
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={editingPackage?.duration || ''}
                      onChange={(e) => setEditingPackage(prev => ({ ...prev, duration: e.target.value }))}
                      min="0.5"
                      step="0.5"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                </>
              )}

              {/* Sale Price - Only for non-hourly pricing models */}
              {editingPackage?.priceType !== 'time_based' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Sale Price ($)
                    </label>
                    <input
                      type="number"
                      value={editingPackage?.salePrice || ''}
                      onChange={(e) => setEditingPackage(prev => ({ ...prev, salePrice: e.target.value }))}
                      placeholder="Leave empty if no sale"
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6b7280' }}>
                      If set, this price will be shown with the regular price crossed out.
                    </p>
                  </div>
                </>
              )}

              {/* Included Services */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Included Services
                </label>
                <input
                  type="text"
                  value={packageServiceSearch}
                  onChange={(e) => setPackageServiceSearch(e.target.value)}
                  placeholder="Search services to add..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                />
                
                {/* Selected Services Tags */}
                {editingPackage?.includedServices?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '12px' }}>
                    {editingPackage.includedServices.map((serviceId, idx) => {
                      const svc = formData.selectedServices.find(s => s.serviceId === serviceId);
                      if (!svc) return null;
                      return (
                        <span 
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#f3f4f6',
                            color: '#222',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          {svc.serviceName}
                          <button
                            onClick={() => toggleServiceInPackage(serviceId)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                          >
                            <i className="fas fa-times" style={{ fontSize: '0.7rem', color: '#6b7280' }}></i>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Available Services List */}
                {formData.selectedServices.length > 0 && (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fafafa' }}>
                    {formData.selectedServices
                      .filter(svc => 
                        packageServiceSearch === '' ||
                        svc.serviceName.toLowerCase().includes(packageServiceSearch.toLowerCase())
                      )
                      .map((svc, idx) => {
                        const isSelected = editingPackage?.includedServices?.includes(svc.serviceId);
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleServiceInPackage(svc.serviceId)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #e5e7eb',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: isSelected ? '#eff6ff' : 'white',
                              transition: 'background 0.15s'
                            }}
                            onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                            onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'white'; }}
                          >
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#222' }}>{svc.serviceName}</span>
                            {isSelected && <i className="fas fa-check-circle" style={{ color: '#16a34a', fontSize: '1rem' }}></i>}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Fine Print */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Fine Print / Terms
                </label>
                <textarea
                  value={editingPackage?.finePrint || ''}
                  onChange={(e) => setEditingPackage(prev => ({ ...prev, finePrint: e.target.value }))}
                  placeholder="e.g., Available on Friday or Sunday. Not available on long weekends."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowPackageModal(false)}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #222',
                  background: 'transparent',
                  color: '#222',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePackage}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: '#222',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#000'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#222'; }}
              >
                {editingPackage?._index !== undefined ? 'Update Package' : 'Save Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal - Matching ServicesPackagesPanel Style */}
      {showEditModal && editingService && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Edit Service</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280', padding: '4px 8px', borderRadius: '6px' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              {/* Service Image Upload */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Service Image
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '12px',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb'
                  }}>
                    {editingService.imageURL ? (
                      <img src={editingService.imageURL} alt="Service" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="fas fa-image" style={{ color: '#9ca3af', fontSize: '2rem' }}></i>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                          const formData = new FormData();
                          formData.append('image', file);
                          const response = await fetch(`${API_BASE_URL}/vendors/service-image/upload`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                            body: formData
                          });
                          if (response.ok) {
                            const data = await response.json();
                            handleEditModalUpdate('imageURL', data.imageUrl);
                          }
                        } catch (error) {
                          console.error('Error uploading image:', error);
                        }
                      }}
                      style={{ display: 'none' }}
                      id="service-image-upload-become-vendor"
                    />
                    <label
                      htmlFor="service-image-upload-become-vendor"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#374151'
                      }}
                    >
                      Upload Image
                    </label>
                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                      Recommended: 400x400px, JPG or PNG
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Model */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Pricing Model *
                </label>
                <select
                  value={editingService.pricingModel || 'time_based'}
                  onChange={(e) => handleEditModalUpdate('pricingModel', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="time_based">Time-based (Hourly)</option>
                  <option value="fixed_price">Fixed Price</option>
                  <option value="per_attendee">Per Attendee</option>
                </select>
              </div>

              {/* Time-based (Hourly) Fields */}
              {editingService.pricingModel === 'time_based' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Duration (hours) *
                    </label>
                    <input
                      type="number"
                      value={editingService.baseDuration || ''}
                      onChange={(e) => handleEditModalUpdate('baseDuration', e.target.value)}
                      min="0.5"
                      step="0.5"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Base Rate ($) *
                    </label>
                    <input
                      type="number"
                      value={editingService.baseRate || ''}
                      onChange={(e) => handleEditModalUpdate('baseRate', e.target.value)}
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Overtime ($/hr)
                    </label>
                    <input
                      type="number"
                      value={editingService.overtimeRate || ''}
                      onChange={(e) => handleEditModalUpdate('overtimeRate', e.target.value)}
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                </div>
              )}

              {/* Fixed Price Fields */}
              {editingService.pricingModel === 'fixed_price' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Fixed Price ($) *
                    </label>
                    <input
                      type="number"
                      value={editingService.fixedPrice || ''}
                      onChange={(e) => handleEditModalUpdate('fixedPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={editingService.baseDuration || ''}
                      onChange={(e) => handleEditModalUpdate('baseDuration', e.target.value)}
                      min="0.5"
                      step="0.5"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                </div>
              )}

              {/* Per Attendee Fields */}
              {editingService.pricingModel === 'per_attendee' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Price/Person ($) *
                      </label>
                      <input
                        type="number"
                        value={editingService.pricePerPerson || ''}
                        onChange={(e) => handleEditModalUpdate('pricePerPerson', e.target.value)}
                        min="0"
                        step="0.01"
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Min Attendees
                      </label>
                      <input
                        type="number"
                        value={editingService.minimumAttendees || ''}
                        onChange={(e) => handleEditModalUpdate('minimumAttendees', e.target.value)}
                        min="1"
                        step="1"
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Max Attendees
                      </label>
                      <input
                        type="number"
                        value={editingService.maximumAttendees || ''}
                        onChange={(e) => handleEditModalUpdate('maximumAttendees', e.target.value)}
                        min="1"
                        step="1"
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={editingService.baseDuration || ''}
                      onChange={(e) => handleEditModalUpdate('baseDuration', e.target.value)}
                      min="0.5"
                      step="0.5"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                </>
              )}

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Description
                </label>
                <textarea
                  value={editingService.description || ''}
                  onChange={(e) => handleEditModalUpdate('description', e.target.value)}
                  rows="3"
                  placeholder="Describe what's included in this service..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Sale Price Section - only for non-hourly pricing models */}
              {editingService.pricingModel !== 'time_based' && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Sale Price ($)
                    </label>
                    <input
                      type="number"
                      value={editingService.salePrice || ''}
                      onChange={(e) => handleEditModalUpdate('salePrice', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Leave empty if no sale"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6b7280' }}>
                      If set, this price will be shown with the regular price crossed out.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: 'transparent',
                  color: '#222',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedService}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: '#222',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Cancellation Policy Step - Matches CancellationPolicyPanel UI
function CancellationPolicyStep({ formData, setFormData }) {
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState({
    policyType: 'flexible',
    fullRefundDays: 7,
    partialRefundDays: 3,
    partialRefundPercent: 50,
    noRefundDays: 1,
    customTerms: ''
  });

  const policyTypes = [
    {
      id: 'flexible',
      name: 'Flexible',
      description: 'Full refund up to 24 hours before the event',
      icon: 'fa-shield-alt',
      color: '#10b981',
      bg: '#ecfdf5'
    },
    {
      id: 'moderate',
      name: 'Moderate',
      description: 'Full refund 7 days before, 50% refund 3 days before',
      icon: 'fa-shield-alt',
      color: '#f59e0b',
      bg: '#fffbeb'
    },
    {
      id: 'strict',
      name: 'Strict',
      description: '50% refund 14 days before, no refund after',
      icon: 'fa-shield-alt',
      color: '#ef4444',
      bg: '#fef2f2'
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Set your own cancellation terms',
      icon: 'fa-shield-alt',
      color: '#8b5cf6',
      bg: '#f5f3ff'
    }
  ];

  // Load existing policy on mount
  useEffect(() => {
    const loadPolicy = async () => {
      if (!currentUser?.vendorProfileId) return;
      try {
        const response = await fetch(`${API_BASE_URL}/payments/vendor/${currentUser.vendorProfileId}/cancellation-policy`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.policy) {
            const loadedPolicy = {
              policyType: data.policy.PolicyType || 'flexible',
              fullRefundDays: data.policy.FullRefundDays || 7,
              partialRefundDays: data.policy.PartialRefundDays || 3,
              partialRefundPercent: data.policy.PartialRefundPercent || 50,
              noRefundDays: data.policy.NoRefundDays || 1,
              customTerms: data.policy.CustomTerms || ''
            };
            setPolicy(loadedPolicy);
            setFormData(prev => ({ ...prev, cancellationPolicy: loadedPolicy }));
          }
        }
      } catch (error) {
        console.error('Error loading cancellation policy:', error);
      }
    };
    loadPolicy();
  }, [currentUser?.vendorProfileId]);

  // Also load from formData if it exists
  useEffect(() => {
    if (formData.cancellationPolicy && typeof formData.cancellationPolicy === 'object') {
      setPolicy(formData.cancellationPolicy);
    }
  }, []);

  const handlePolicyTypeChange = (type) => {
    const defaults = {
      flexible: { fullRefundDays: 1, partialRefundDays: 0, partialRefundPercent: 0, noRefundDays: 0 },
      moderate: { fullRefundDays: 7, partialRefundDays: 3, partialRefundPercent: 50, noRefundDays: 1 },
      strict: { fullRefundDays: 14, partialRefundDays: 7, partialRefundPercent: 50, noRefundDays: 3 },
      custom: { fullRefundDays: policy.fullRefundDays, partialRefundDays: policy.partialRefundDays, partialRefundPercent: policy.partialRefundPercent, noRefundDays: policy.noRefundDays }
    };
    const newPolicy = { ...policy, policyType: type, ...defaults[type] };
    setPolicy(newPolicy);
    setFormData(prev => ({ ...prev, cancellationPolicy: newPolicy }));
  };

  const handlePolicyChange = (field, value) => {
    const newPolicy = { ...policy, [field]: value };
    setPolicy(newPolicy);
    setFormData(prev => ({ ...prev, cancellationPolicy: newPolicy }));
  };

  const handleSave = async () => {
    if (!currentUser?.vendorProfileId) {
      showBanner('Please complete your profile first', 'error');
      return;
    }
    setSaving(true);
    try {
      console.log('Saving cancellation policy:', policy);
      const response = await fetch(`${API_BASE_URL}/payments/vendor/${currentUser.vendorProfileId}/cancellation-policy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(policy)
      });
      const data = await response.json();
      console.log('Save response:', data);
      if (response.ok && data.success) {
        showBanner('Cancellation policy saved!', 'success');
      } else {
        throw new Error(data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving cancellation policy:', error);
      showBanner('Failed to save cancellation policy: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cancellation-policy-step">
      {/* Info Box */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <i className="fas fa-shield-alt" style={{ color: '#22c55e', marginTop: '0.15rem' }}></i>
        <div>
          <strong style={{ color: '#166534' }}>Protect your business</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#166534', fontSize: '0.9rem' }}>
            A clear cancellation policy protects your business while giving clients confidence when booking.
          </p>
        </div>
      </div>

      {/* Policy Type Selection - 2x2 Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>
          Select Policy Type
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {policyTypes.map(type => (
            <div
              key={type.id}
              onClick={() => handlePolicyTypeChange(type.id)}
              style={{
                padding: '1.25rem',
                border: `2px solid ${policy.policyType === type.id ? type.color : '#e5e7eb'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                background: policy.policyType === type.id ? `${type.color}10` : 'white',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: `${type.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className={`fas ${type.icon}`} style={{ color: type.color }}></i>
                </div>
                <strong style={{ color: '#1f2937' }}>{type.name}</strong>
                {policy.policyType === type.id && (
                  <i className="fas fa-check-circle" style={{ color: type.color, marginLeft: 'auto' }}></i>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Settings */}
      {policy.policyType === 'custom' && (
        <div style={{
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>
            Custom Policy Settings
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
                Full Refund (days before event)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={policy.fullRefundDays}
                onChange={(e) => handlePolicyChange('fullRefundDays', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              />
              <small style={{ color: '#6b7280' }}>100% refund if cancelled this many days before</small>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
                Partial Refund (days before event)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={policy.partialRefundDays}
                onChange={(e) => handlePolicyChange('partialRefundDays', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
                Partial Refund Percentage
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={policy.partialRefundPercent}
                onChange={(e) => handlePolicyChange('partialRefundPercent', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              />
              <small style={{ color: '#6b7280' }}>Percentage refunded during partial period</small>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
                No Refund (days before event)
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={policy.noRefundDays}
                onChange={(e) => handlePolicyChange('noRefundDays', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              />
              <small style={{ color: '#6b7280' }}>No refund if cancelled within this period</small>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>
              Additional Terms (Optional)
            </label>
            <textarea
              value={policy.customTerms}
              onChange={(e) => handlePolicyChange('customTerms', e.target.value)}
              placeholder="Add any additional cancellation terms or conditions..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}

// Business Hours Step - Full Implementation
function BusinessHoursStep({ formData, setFormData }) {
  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  // Canadian timezones only
  const timezones = [
    { value: 'America/St_Johns', label: 'Newfoundland (NST) GMT -3:30' },
    { value: 'America/Halifax', label: 'Atlantic (AST) GMT -4:00' },
    { value: 'America/Toronto', label: 'Eastern (EST) GMT -5:00' },
    { value: 'America/Winnipeg', label: 'Central (CST) GMT -6:00' },
    { value: 'America/Edmonton', label: 'Mountain (MST) GMT -7:00' },
    { value: 'America/Vancouver', label: 'Pacific (PST) GMT -8:00' }
  ];

  const [timeError, setTimeError] = useState(null);

  const handleHourChange = (day, field, value) => {
    setFormData(prev => {
      const currentDayHours = prev.businessHours[day];
      const newOpenTime = field === 'openTime' ? value : currentDayHours?.openTime || '09:00';
      const newCloseTime = field === 'closeTime' ? value : currentDayHours?.closeTime || '17:00';
      
      // Validate: close time must be after open time (no overnight hours)
      if (newCloseTime <= newOpenTime) {
        // If setting open time and it would be >= close time, auto-adjust close time
        if (field === 'openTime') {
          const [hours, mins] = value.split(':').map(Number);
          const adjustedHours = hours + 1 > 23 ? 23 : hours + 1;
          const adjustedClose = `${String(adjustedHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
          setTimeError({ day, message: 'Close time adjusted - overnight hours not supported' });
          setTimeout(() => setTimeError(null), 3000);
          return {
            ...prev,
            businessHours: {
              ...prev.businessHours,
              [day]: {
                ...currentDayHours,
                openTime: value,
                closeTime: adjustedClose
              }
            }
          };
        }
        // If setting close time and it would be <= open time, show error and don't allow it
        if (field === 'closeTime') {
          setTimeError({ day, message: 'Close time must be after open time - overnight hours not supported' });
          setTimeout(() => setTimeError(null), 3000);
          return prev; // Don't update, keep current value
        }
      }
      
      setTimeError(null);
      return {
        ...prev,
        businessHours: {
          ...prev.businessHours,
          [day]: {
            ...currentDayHours,
            [field]: value
          }
        }
      };
    });
  };

  const handleToggleClosed = (day) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          isAvailable: !prev.businessHours[day].isAvailable
        }
      }
    }));
  };

  const handleTimezoneChange = (timezone) => {
    setFormData(prev => ({
      ...prev,
      timezone: timezone
    }));
  };

  return (
    <div className="business-hours-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-info-circle" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Set Your Regular Hours <span style={{ color: '#ef4444' }}>*</span></h3>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Set at least one day as available. These hours will be displayed on your public profile.
          </p>
        </div>

        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <i className="fas fa-globe" style={{ color: 'var(--primary)', fontSize: '1rem' }}></i>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>Timezone</label>
          </div>
          <select
            value={formData.timezone || ''}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.9rem',
              background: 'white',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: 'url(\'data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23666%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e\')',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.25rem',
              paddingRight: '3rem'
            }}
          >
            <option value="" disabled>Select timezone...</option>
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem', marginBottom: 0 }}>
            This timezone will be displayed to customers viewing your profile
          </p>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {daysOfWeek.map(day => (
            <div
              key={day.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr auto',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: formData.businessHours[day.key]?.isAvailable === false ? '#f9fafb' : 'white'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{day.label}</div>
              
              {formData.businessHours[day.key]?.isAvailable !== false ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Open:</label>
                      <input
                        type="time"
                        value={formData.businessHours[day.key]?.openTime || '09:00'}
                        onChange={(e) => handleHourChange(day.key, 'openTime', e.target.value)}
                        max="22:59"
                        style={{ padding: '0.4rem 0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <span style={{ color: '#6b7280' }}>-</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Close:</label>
                      <input
                        type="time"
                        value={formData.businessHours[day.key]?.closeTime || '17:00'}
                        min={formData.businessHours[day.key]?.openTime || '09:00'}
                        onChange={(e) => handleHourChange(day.key, 'closeTime', e.target.value)}
                        style={{ 
                          padding: '0.4rem 0.5rem', 
                          border: timeError?.day === day.key ? '1px solid #ef4444' : '1px solid #e5e7eb', 
                          borderRadius: '6px', 
                          fontSize: '0.85rem',
                          backgroundColor: timeError?.day === day.key ? '#fef2f2' : 'white'
                        }}
                      />
                    </div>
                  </div>
                  {timeError?.day === day.key && (
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <i className="fas fa-exclamation-circle"></i>
                      {timeError.message}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.85rem' }}>Closed</div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={formData.businessHours[day.key]?.isAvailable === false}
                  onChange={() => handleToggleClosed(day.key)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Closed</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Questionnaire Step - Full Implementation (uses dedicated API like dashboard)
function QuestionnaireStep({ formData, setFormData, currentUser, setFeaturesLoadedFromDB }) {
  const [categories, setCategories] = useState([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState(new Set(formData.selectedFeatures || []));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuestionnaire();
  }, [formData.primaryCategory, formData.additionalCategories, currentUser?.vendorProfileId]);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      
      // Fetch all features grouped by category
      const response = await fetch(`${API_BASE_URL}/vendors/features/all-grouped`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        console.error('[BecomeVendor Questionnaire] Failed to fetch, status:', response.status);
      }
      
      // Load vendor's existing selections if vendorProfileId exists
      if (currentUser?.vendorProfileId) {
        const selectionsResponse = await fetch(`${API_BASE_URL}/vendors/features/vendor/${currentUser.vendorProfileId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (selectionsResponse.ok) {
          const selectionsData = await selectionsResponse.json();
          const selectedIds = new Set(
            selectionsData.selectedFeatures?.map(f => f.FeatureID) || []
          );
          setSelectedFeatureIds(selectedIds);
          // Store feature objects with names for display in ReviewStep
          const selectedFeatureObjects = selectionsData.selectedFeatures?.map(f => ({
            id: f.FeatureID,
            name: f.FeatureName || f.Name || `Feature ${f.FeatureID}`
          })) || [];
          setFormData(prev => ({ ...prev, selectedFeatures: selectedFeatureObjects }));
          // Mark that features have been loaded from DB
          if (setFeaturesLoadedFromDB) setFeaturesLoadedFromDB(true);
        } else {
          // Still mark as loaded even if response not OK
          if (setFeaturesLoadedFromDB) setFeaturesLoadedFromDB(true);
        }
      }
    } catch (error) {
      console.error('[BecomeVendor Questionnaire] Error loading:', error);
      // Still mark as loaded even on error
      if (setFeaturesLoadedFromDB) setFeaturesLoadedFromDB(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatureSelection = (featureId, featureName) => {
    setSelectedFeatureIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      // Update formData with feature objects (id + name) for display in ReviewStep
      setFormData(prevData => {
        const currentFeatures = prevData.selectedFeatures || [];
        if (newSet.has(featureId)) {
          // Add feature object
          const exists = currentFeatures.some(f => (typeof f === 'object' ? f.id : f) === featureId);
          if (!exists) {
            return { ...prevData, selectedFeatures: [...currentFeatures, { id: featureId, name: featureName }] };
          }
        } else {
          // Remove feature
          return { ...prevData, selectedFeatures: currentFeatures.filter(f => (typeof f === 'object' ? f.id : f) !== featureId) };
        }
        return prevData;
      });
      return newSet;
    });
  };

  const handleSaveFeatures = async () => {
    if (!currentUser?.vendorProfileId) {
      showBanner('Please complete your basic profile first', 'warning');
      return;
    }
    
    setSaving(true);
    try {
      const featureIdsArray = Array.from(selectedFeatureIds);
      
      const response = await fetch(`${API_BASE_URL}/vendors/features/vendor/${currentUser.vendorProfileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          featureIds: featureIdsArray
        })
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        showBanner('Features saved successfully!', 'success');
      } else {
        throw new Error(responseData.message || 'Failed to save features');
      }
    } catch (error) {
      console.error('[BecomeVendor Questionnaire] Error saving:', error);
      showBanner('Failed to save features: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getFeatureIcon = (iconName) => {
    if (!iconName) return 'check';
    const iconMap = {
      'church': 'church', 'chef-hat': 'hat-chef', 'accessibility': 'wheelchair',
      'car-front': 'car', 'speaker': 'volume-up', 'wifi': 'wifi', 'trees': 'tree',
      'eye': 'eye', 'disc': 'circle', 'presentation': 'chalkboard', 'door-closed': 'door-closed',
      'bed': 'bed', 'plane': 'plane', 'users': 'users', 'camera-off': 'camera',
      'zap': 'bolt', 'heart': 'heart', 'file': 'file', 'images': 'images',
      'printer': 'print', 'book-open': 'book-open', 'video': 'video', 'film': 'film',
      'radio': 'broadcast-tower', 'mic': 'microphone', 'volume-2': 'volume-up',
      'lightbulb': 'lightbulb', 'glass-water': 'glass-martini', 'list-music': 'list',
      'guitar': 'guitar', 'mic-vocal': 'microphone-alt', 'lamp': 'lamp', 'cloud': 'cloud',
      'truck': 'truck', 'badge-check': 'check-circle', 'leaf': 'leaf', 'wheat-off': 'ban',
      'utensils-crossed': 'utensils', 'wine': 'wine-glass', 'arrow-right-circle': 'arrow-circle-right',
      'beer': 'beer', 'scroll-text': 'scroll', 'cake': 'birthday-cake', 'coffee': 'coffee',
      'flower': 'flower', 'hexagon': 'hexagon', 'rainbow': 'rainbow', 'trending-up': 'arrow-up',
      'armchair': 'couch', 'layers': 'layer-group', 'lamp-desk': 'lamp', 'wallpaper': 'image',
      'signpost': 'sign', 'flame': 'fire', 'circle': 'circle', 'drama': 'theater-masks',
      'wand': 'magic', 'flame-kindling': 'fire-alt', 'person-standing': 'walking',
      'baby': 'baby', 'gamepad-2': 'gamepad', 'bus': 'bus', 'bus-front': 'bus',
      'key-round': 'key', 'move': 'arrows-alt', 'palette': 'palette', 'scissors': 'cut',
      'spray-can': 'spray-can', 'calendar-check': 'calendar-check', 'map-pin': 'map-marker-alt',
      'users-round': 'users', 'hand': 'hand-paper', 'clipboard-check': 'clipboard-check',
      'clipboard-list': 'clipboard-list', 'calendar-days': 'calendar-alt', 'handshake': 'handshake',
      'dollar-sign': 'dollar-sign', 'clock': 'clock'
    };
    return iconMap[iconName] || iconName.replace('fa-', '');
  };

  const getCategoryIcon = (icon) => {
    if (!icon) return 'list';
    return icon.replace('fa-', '');
  };

  // Filter categories based on selected primary and additional categories
  const getFilteredCategories = () => {
    const selectedCategoryIds = [
      formData.primaryCategory,
      ...(formData.additionalCategories || [])
    ].filter(Boolean);
    
    if (selectedCategoryIds.length === 0) {
      return categories; // Show all if no categories selected
    }
    
    // Filter using applicableVendorCategories field from API
    // Each feature category has an applicableVendorCategories field like "venue" or "photo,music"
    return categories.filter(cat => {
      const applicableCategories = (cat.applicableVendorCategories || '').toLowerCase().split(',').map(c => c.trim());
      return selectedCategoryIds.some(vendorCat => 
        applicableCategories.includes(vendorCat.toLowerCase())
      );
    });
  };

  const filteredCategories = getFilteredCategories();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="questionnaire-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        {filteredCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
            <i className="fas fa-info-circle" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', margin: 0 }}>
              No features available for your selected categories yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '2.5rem' }}>
            {filteredCategories.map(category => {
              if (!category.features || category.features.length === 0) return null;
              
              return (
                <div key={category.categoryName} style={{ background: 'white', borderRadius: '16px', padding: '2rem 0' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', padding: '0 2rem', fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
                    {category.categoryName}
                  </h3>
                  <div className="features-grid-3col" style={{ padding: '0 2rem' }}>
                    {category.features.map(feature => {
                      const isSelected = selectedFeatureIds.has(feature.featureID);
                      return (
                        <div key={feature.featureID} style={{ display: 'flex' }}>
                          <div
                            onClick={() => toggleFeatureSelection(feature.featureID, feature.featureName)}
                            style={{
                              padding: '1rem 1.25rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.875rem',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid var(--primary)' : '1px solid #e5e7eb',
                              background: isSelected ? '#f0f9ff' : 'white',
                              boxShadow: isSelected ? '0 1px 3px rgba(0, 123, 255, 0.1)' : 'none',
                              width: '100%'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = '#d1d5db';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                          >
                            <i 
                              className={`fas fa-${getFeatureIcon(feature.featureIcon)}`} 
                              style={{ 
                                color: '#717171', 
                                fontSize: '0.875rem', 
                                flexShrink: 0,
                                width: '14px',
                                textAlign: 'center'
                              }}
                            ></i>
                            <span style={{ 
                              fontSize: '0.9375rem', 
                              color: '#222', 
                              flex: 1, 
                              fontWeight: isSelected ? 600 : 400,
                              lineHeight: 1.4
                            }}>
                              {feature.featureName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// Gallery Step - Full Implementation with Drag-to-Reorder and Cover Photo Selection (Airbnb style)
function GalleryStep({ formData, setFormData, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumForm, setAlbumForm] = useState({ name: '', description: '', coverImageURL: '', isPublic: true });
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [showAddPhotosModal, setShowAddPhotosModal] = useState(false);
  const [albumPhotoUrl, setAlbumPhotoUrl] = useState('');
  const [addingAlbumPhoto, setAddingAlbumPhoto] = useState(false);
  
  const MIN_PHOTOS = 5;

  // Load existing photos and albums
  useEffect(() => {
    if (currentUser?.vendorProfileId) {
      loadPhotos();
      loadAlbums();
    } else {
      // Initialize from formData if no vendorProfileId
      const existingPhotos = (formData.photoURLs || []).map((url, i) => ({
        id: `local-${i}`,
        url,
        isPrimary: i === 0,
        sortOrder: i
      }));
      setPhotos(existingPhotos);
      setLoading(false);
    }
  }, [currentUser?.vendorProfileId]);

  const loadAlbums = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${currentUser.vendorProfileId}/portfolio/albums`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error('Error loading albums:', error);
    }
  };

  const handleAddPhotoToAlbum = async () => {
    if (!albumPhotoUrl.trim() || !selectedAlbum) return;
    
    setAddingAlbumPhoto(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/${currentUser.vendorProfileId}/portfolio/albums/${selectedAlbum.AlbumID}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ imageUrl: albumPhotoUrl.trim() })
      });
      
      if (response.ok) {
        showBanner('Photo added to album!', 'success');
        setAlbumPhotoUrl('');
        loadAlbums(); // Refresh albums to get updated image count
      } else {
        const data = await response.json();
        showBanner(data.message || 'Failed to add photo', 'error');
      }
    } catch (error) {
      console.error('Error adding photo to album:', error);
      showBanner('Failed to add photo to album', 'error');
    } finally {
      setAddingAlbumPhoto(false);
    }
  };

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const images = Array.isArray(data) ? data : [];
        const mappedPhotos = images.map((img, idx) => ({
          id: img.id || img.ImageID,
          url: img.url || img.ImageURL,
          caption: img.caption || img.Caption,
          isPrimary: img.isPrimary || img.IsPrimary || idx === 0,
          sortOrder: img.sortOrder || img.SortOrder || idx
        })).sort((a, b) => a.sortOrder - b.sortOrder);
        
        // Ensure first photo is marked as primary if none is set
        if (mappedPhotos.length > 0 && !mappedPhotos.some(p => p.isPrimary)) {
          mappedPhotos[0].isPrimary = true;
        }
        
        setPhotos(mappedPhotos);
        setFormData(prev => ({
          ...prev,
          photoURLs: mappedPhotos.map(img => img.url)
        }));
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!currentUser?.vendorProfileId) {
      // If no vendorProfileId, just store locally
      const newPhotos = files.map((file, i) => ({
        id: `local-${Date.now()}-${i}`,
        url: URL.createObjectURL(file),
        isPrimary: photos.length === 0 && i === 0,
        sortOrder: photos.length + i
      }));
      
      const updatedPhotos = [...photos, ...newPhotos];
      // Ensure first photo is cover if none set
      if (!updatedPhotos.some(p => p.isPrimary) && updatedPhotos.length > 0) {
        updatedPhotos[0].isPrimary = true;
      }
      
      setPhotos(updatedPhotos);
      setFormData(prev => ({
        ...prev,
        photoURLs: updatedPhotos.map(p => p.url)
      }));
      showBanner('Photos added! They will be saved when you complete your profile.', 'success');
      return;
    }

    try {
      setUploading(true);
      
      // Upload files one at a time using service-image/upload endpoint (WORKING endpoint)
      for (const file of files) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        // Use the WORKING service-image/upload endpoint, then save URL to vendor images
        const uploadResponse = await fetch(`${API_BASE_URL}/vendors/service-image/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataUpload
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }
        
        const uploadData = await uploadResponse.json();
        
        // Now save the uploaded image URL to vendor images
        const saveResponse = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images/url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ url: uploadData.imageUrl })
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save image');
        }
      }
      
      showBanner('Photos uploaded successfully!', 'success');
      loadPhotos();
    } catch (error) {
      console.error('Error uploading:', error);
      showBanner('Failed to upload photos', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddPhotoByUrl = async () => {
    if (!urlInput.trim()) {
      showBanner('Please enter a valid URL', 'error');
      return;
    }

    if (!currentUser?.vendorProfileId) {
      const newPhoto = {
        id: `local-${Date.now()}`,
        url: urlInput.trim(),
        isPrimary: photos.length === 0,
        sortOrder: photos.length
      };
      
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      setFormData(prev => ({
        ...prev,
        photoURLs: updatedPhotos.map(p => p.url)
      }));
      setUrlInput('');
      showBanner('Photo added! It will be saved when you complete your profile.', 'success');
      return;
    }

    try {
      setUploading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ url: urlInput.trim() })
      });

      if (response.ok) {
        showBanner('Photo added successfully!', 'success');
        setUrlInput('');
        loadPhotos();
      } else {
        throw new Error('Failed to add photo');
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      const newPhoto = {
        id: `local-${Date.now()}`,
        url: urlInput.trim(),
        isPrimary: photos.length === 0,
        sortOrder: photos.length
      };
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      setFormData(prev => ({
        ...prev,
        photoURLs: updatedPhotos.map(p => p.url)
      }));
      setUrlInput('');
      showBanner('Photo added locally. It will be saved when you complete your profile.', 'success');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId, index) => {
    if (!currentUser?.vendorProfileId || !photoId || String(photoId).startsWith('local-')) {
      // Local delete
      const updatedPhotos = photos.filter((_, i) => i !== index);
      // If deleted photo was primary, make first remaining photo primary
      if (photos[index]?.isPrimary && updatedPhotos.length > 0) {
        updatedPhotos[0].isPrimary = true;
      }
      setPhotos(updatedPhotos);
      setFormData(prev => ({
        ...prev,
        photoURLs: updatedPhotos.map(p => p.url)
      }));
      showBanner('Photo removed', 'success');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        showBanner('Photo deleted successfully!', 'success');
        loadPhotos();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      showBanner('Failed to delete photo', 'error');
    }
  };

  // Set photo as cover
  const handleSetAsCover = async (photoId, index) => {
    const updatedPhotos = photos.map((p, i) => ({
      ...p,
      isPrimary: i === index
    }));
    
    // Move the cover photo to first position
    const coverPhoto = updatedPhotos.splice(index, 1)[0];
    updatedPhotos.unshift(coverPhoto);
    
    // Update sort orders
    updatedPhotos.forEach((p, i) => {
      p.sortOrder = i;
    });
    
    setPhotos(updatedPhotos);
    setFormData(prev => ({
      ...prev,
      photoURLs: updatedPhotos.map(p => p.url)
    }));

    // If we have a vendorProfileId, save to API
    if (currentUser?.vendorProfileId && photoId && !String(photoId).startsWith('local-')) {
      try {
        await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images/${photoId}/primary`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Also save the new order
        await savePhotoOrder(updatedPhotos);
      } catch (error) {
        console.error('Error setting cover photo:', error);
      }
    }
    
    showBanner('Cover photo updated!', 'success');
  };

  // Save photo order to API - same as GalleryMediaPanel
  const savePhotoOrder = async (orderedPhotos) => {
    if (!currentUser?.vendorProfileId) return;
    
    try {
      const orderData = orderedPhotos
        .filter(p => p.id && !String(p.id).startsWith('local-'))
        .map((p, idx) => ({
          imageId: p.id,
          displayOrder: idx + 1
        }));
      
      if (orderData.length > 0) {
        const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images/reorder`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ images: orderData })
        });
        
        if (response.ok) {
          showBanner('Photos reordered!', 'success');
        }
      }
    } catch (error) {
      console.error('Error saving photo order:', error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedPhotos = [...photos];
    const [draggedPhoto] = updatedPhotos.splice(draggedIndex, 1);
    updatedPhotos.splice(dropIndex, 0, draggedPhoto);
    
    // Update sort orders and primary status
    updatedPhotos.forEach((p, i) => {
      p.sortOrder = i;
      p.isPrimary = i === 0; // First photo is always cover
    });

    setPhotos(updatedPhotos);
    setFormData(prev => ({
      ...prev,
      photoURLs: updatedPhotos.map(p => p.url)
    }));
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    // Save order to API (this will show the success banner)
    await savePhotoOrder(updatedPhotos);
  };

  const photosNeeded = Math.max(0, MIN_PHOTOS - photos.length);
  const hasEnoughPhotos = photos.length >= MIN_PHOTOS;

  return (
    <div className="gallery-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        {/* Required photos notice */}
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem', 
          background: photos.length >= MIN_PHOTOS ? '#f0fdf4' : '#fef3c7', 
          borderRadius: '8px', 
          border: `1px solid ${photos.length >= MIN_PHOTOS ? '#86efac' : '#fcd34d'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <i className={`fas ${photos.length >= MIN_PHOTOS ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} style={{ color: photos.length >= MIN_PHOTOS ? '#16a34a' : '#d97706' }}></i>
          <p style={{ margin: 0, color: photos.length >= MIN_PHOTOS ? '#166534' : '#92400e', fontSize: '0.9rem' }}>
            <strong>At least {MIN_PHOTOS} photos required <span style={{ color: '#ef4444' }}>*</span></strong>
            {photos.length > 0 ? ` — ${photos.length}/${MIN_PHOTOS} photo${photos.length > 1 ? 's' : ''} uploaded` : ' — Upload photos to showcase your work'}
          </p>
        </div>

        {!currentUser?.vendorProfileId && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#e0f2fe', borderRadius: '8px', border: '1px solid #7dd3fc' }}>
            <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
              <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
              Photos added here will be saved when you complete your profile setup.
            </p>
          </div>
        )}

        {/* Rearrange hint */}
        {photos.length > 1 && (
          <p style={{ color: '#717171', fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic' }}>
            Rearrange by dragging.
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <div className="spinner"></div>
          </div>
        )}

        {/* Photo Grid - Layout like image 2 with cover photo large and 2x2 grid below */}
        {!loading && (
          <>
            {/* Cover Photo - Large at top */}
            <div 
              draggable={photos.length > 0}
              onDragStart={(e) => photos.length > 0 && handleDragStart(e, 0)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, 0)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 0)}
              onClick={() => photos.length === 0 ? document.getElementById('photo-upload-input').click() : null}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '8px',
                background: photos.length > 0 ? 'transparent' : '#f9f9f9',
                border: dragOverIndex === 0 ? '2px solid #222' : '1px solid #e5e7eb',
                cursor: photos.length === 0 ? 'pointer' : 'grab',
                opacity: draggedIndex === 0 ? 0.5 : 1
              }}
            >
              {photos.length > 0 ? (
                <>
                  <img
                    src={photos[0].url}
                    alt="Cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                  />
                  {/* Cover Photo badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'white',
                    color: '#222',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    Cover Photo
                  </div>
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photos[0].id, 0);
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'white',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}
                  >
                    <i className="fas fa-trash-alt" style={{ fontSize: '14px' }}></i>
                  </button>
                </>
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <i className="far fa-image" style={{ fontSize: '2.5rem', color: '#9ca3af', marginBottom: '8px' }}></i>
                </div>
              )}
            </div>

            {/* Grid of smaller photos - 2x2 grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px', 
              marginBottom: '1.5rem' 
            }} id="vendor-photos-grid">
              {/* Slot 1 (index 1) */}
              {photos.length > 1 ? (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 1)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, 1)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 1)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'grab',
                    border: dragOverIndex === 1 ? '2px solid #222' : '1px solid #e5e7eb',
                    opacity: draggedIndex === 1 ? 0.5 : 1,
                    transition: 'border-color 0.2s, opacity 0.2s'
                  }}
                >
                  <img src={photos[1].url} alt="Gallery 2" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} onLoad={(e) => e.target.style.opacity = 1} onError={(e) => e.target.style.opacity = 0.5} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photos[1].id, 1); }} className="photo-delete-btn" style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'white', color: '#222', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', opacity: 0, transition: 'opacity 0.2s' }}>
                    <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                  </button>
                </div>
              ) : (
                <div onClick={() => document.getElementById('photo-upload-input').click()} style={{ aspectRatio: '1', borderRadius: '8px', border: '1px dashed #d1d5db', background: '#f9f9f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  {uploading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                  ) : (
                    <i className="far fa-image" style={{ fontSize: '1.75rem', color: '#9ca3af' }}></i>
                  )}
                </div>
              )}

              {/* Slot 2 (index 2) */}
              {photos.length > 2 ? (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 2)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, 2)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 2)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'grab',
                    border: dragOverIndex === 2 ? '2px solid #222' : '1px solid #e5e7eb',
                    opacity: draggedIndex === 2 ? 0.5 : 1,
                    transition: 'border-color 0.2s, opacity 0.2s'
                  }}
                >
                  <img src={photos[2].url} alt="Gallery 3" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} onLoad={(e) => e.target.style.opacity = 1} onError={(e) => e.target.style.opacity = 0.5} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photos[2].id, 2); }} className="photo-delete-btn" style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'white', color: '#222', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', opacity: 0, transition: 'opacity 0.2s' }}>
                    <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                  </button>
                </div>
              ) : (
                <div onClick={() => document.getElementById('photo-upload-input').click()} style={{ aspectRatio: '1', borderRadius: '8px', border: '1px dashed #d1d5db', background: '#f9f9f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  {uploading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                  ) : (
                    <i className="far fa-image" style={{ fontSize: '1.75rem', color: '#9ca3af' }}></i>
                  )}
                </div>
              )}

              {/* Slot 3 (index 3) */}
              {photos.length > 3 ? (
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 3)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, 3)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 3)}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'grab',
                    border: dragOverIndex === 3 ? '2px solid #222' : '1px solid #e5e7eb',
                    opacity: draggedIndex === 3 ? 0.5 : 1,
                    transition: 'border-color 0.2s, opacity 0.2s'
                  }}
                >
                  <img src={photos[3].url} alt="Gallery 4" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} onLoad={(e) => e.target.style.opacity = 1} onError={(e) => e.target.style.opacity = 0.5} />
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photos[3].id, 3); }} className="photo-delete-btn" style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'white', color: '#222', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', opacity: 0, transition: 'opacity 0.2s' }}>
                    <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                  </button>
                </div>
              ) : (
                <div onClick={() => document.getElementById('photo-upload-input').click()} style={{ aspectRatio: '1', borderRadius: '8px', border: '1px dashed #d1d5db', background: '#f9f9f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  {uploading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                  ) : (
                    <i className="far fa-image" style={{ fontSize: '1.75rem', color: '#9ca3af' }}></i>
                  )}
                </div>
              )}

              {/* Slot 4 - "Add more" card */}
              <div 
                onClick={() => document.getElementById('photo-upload-input').click()}
                style={{
                  aspectRatio: '1',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: '#f9f9f9',
                  transition: 'border-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#222'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <i className="fas fa-plus" style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '4px' }}></i>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Add more</span>
              </div>

              {/* Additional photos beyond slot 4 */}
              {photos.slice(4).map((photo, idx) => {
                const index = idx + 4;
                return (
                  <div
                    key={photo.id || index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'grab',
                      border: dragOverIndex === index ? '2px solid #222' : '1px solid #e5e7eb',
                      opacity: draggedIndex === index ? 0.5 : 1,
                      transition: 'border-color 0.2s, opacity 0.2s'
                    }}
                  >
                    <img src={photo.url} alt={`Gallery ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id, index); }} className="photo-delete-btn" style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'white', color: '#222', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)', opacity: 0, transition: 'opacity 0.2s' }}>
                      <i className="fas fa-times" style={{ fontSize: '12px' }}></i>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Show delete buttons on hover - CSS */}
        <style>{`
          #vendor-photos-grid > div:hover .photo-delete-btn {
            opacity: 1 !important;
          }
        `}</style>

        {/* Hidden file input */}
        <input
          type="file"
          id="photo-upload-input"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* URL Input section - same as GalleryMediaPanel */}
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
          <div style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px', color: '#222' }}>Add Image by URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPhotoByUrl();
                }
              }}
            />
          </div>
          <div style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px', color: '#222' }}>Caption (optional)</label>
            <input
              type="text"
              placeholder=""
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            />
          </div>
          <div style={{ margin: 0, display: 'flex', gap: '0.5rem', alignItems: 'center', paddingBottom: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: '#222' }}>
              <input type="checkbox" />
              Primary
            </label>
            <button 
              type="button" 
              onClick={handleAddPhotoByUrl}
              disabled={uploading}
              style={{
                padding: '0.625rem 1rem',
                background: '#222',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Photo Albums Section */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '2rem', marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#222', margin: '0 0 1rem 0' }}>
            {albums.length > 0 ? 'Your Albums' : 'Create your first album'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {/* Existing albums */}
            {albums.map(album => (
              <div 
                key={album.AlbumID}
                onClick={() => { setSelectedAlbum(album); setShowAddPhotosModal(true); }}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'white',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ aspectRatio: '4/3', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {album.CoverImageURL ? (
                    <img src={album.CoverImageURL} alt={album.AlbumName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="far fa-image" style={{ fontSize: '2rem', color: '#d1d5db' }}></i>
                  )}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#222', marginBottom: '0.25rem' }}>{album.AlbumName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{album.ImageCount || 0} photos</div>
                </div>
              </div>
            ))}
            
            {/* Create new album card */}
            <div 
              onClick={() => setShowAlbumModal(true)}
              style={{
                border: '1px dashed #d1d5db',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: '#f9f9f9',
                transition: 'border-color 0.2s, background 0.2s',
                minHeight: '180px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = '#f5f5f5'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9f9f9'; }}
            >
              <i className="fas fa-plus" style={{ fontSize: '1.5rem', color: '#6b7280', marginBottom: '0.5rem' }}></i>
              <span style={{ fontWeight: 500, color: '#222', marginBottom: '4px' }}>Create album</span>
              <span style={{ fontSize: '0.8rem', color: '#717171' }}>Organize photos</span>
            </div>
          </div>
        </div>

        {/* Add Photos to Album Modal */}
        {showAddPhotosModal && selectedAlbum && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '1rem'
            }}
            onClick={() => { setShowAddPhotosModal(false); setSelectedAlbum(null); }}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#222' }}>
                  Add Photos to "{selectedAlbum.AlbumName}"
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowAddPhotosModal(false); setSelectedAlbum(null); }}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280', padding: '4px' }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ padding: '24px' }}>
                <p style={{ margin: '0 0 1rem', color: '#6b7280', fontSize: '0.9rem' }}>
                  Add photos to this album by uploading or entering image URLs.
                </p>
                
                {/* Upload button */}
                <div style={{ marginBottom: '1rem' }}>
                  <label 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '10px 20px',
                      background: 'var(--primary)',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    <i className="fas fa-cloud-upload-alt"></i>
                    Upload Photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files);
                        if (!files.length) return;
                        
                        setAddingAlbumPhoto(true);
                        for (const file of files) {
                          const formData = new FormData();
                          formData.append('image', file);
                          formData.append('folder', 'venuevue/albums');
                          
                          try {
                            const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                              body: formData
                            });
                            const uploadData = await uploadResponse.json();
                            if (uploadData.success && uploadData.url) {
                              await fetch(`${API_BASE_URL}/vendor/${currentUser.vendorProfileId}/portfolio/albums/${selectedAlbum.AlbumID}/images`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({ imageUrl: uploadData.url })
                              });
                            }
                          } catch (error) {
                            console.error('Upload error:', error);
                          }
                        }
                        setAddingAlbumPhoto(false);
                        showBanner(`${files.length} photo(s) added to album!`, 'success');
                        loadAlbums();
                      }}
                    />
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                  <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>or add by URL</span>
                  <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="url"
                    value={albumPhotoUrl}
                    onChange={(e) => setAlbumPhotoUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                  <button
                    onClick={handleAddPhotoToAlbum}
                    disabled={addingAlbumPhoto || !albumPhotoUrl.trim()}
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: '#222',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: addingAlbumPhoto || !albumPhotoUrl.trim() ? 'not-allowed' : 'pointer',
                      opacity: addingAlbumPhoto || !albumPhotoUrl.trim() ? 0.5 : 1,
                      fontWeight: 500
                    }}
                  >
                    {addingAlbumPhoto ? 'Adding...' : 'Add'}
                  </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setShowAddPhotosModal(false); setSelectedAlbum(null); }}
                    style={{
                      padding: '0.6rem 1.25rem',
                      background: 'white',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Album Create Modal */}
        {showAlbumModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '1rem'
            }}
            onClick={() => setShowAlbumModal(false)}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#222' }}>
                  Create Album
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAlbumModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280', padding: '4px' }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
                {/* Album Details Section */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: '#222' }}>Album Name *</label>
                    <input
                      type="text"
                      value={albumForm.name}
                      onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                      placeholder="e.g., Weddings 2024"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.95rem' }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: '#222' }}>Description</label>
                    <textarea
                      value={albumForm.description}
                      onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                      placeholder="Brief description of this album"
                      rows="3"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      id="album-public-setup"
                      checked={albumForm.isPublic}
                      onChange={(e) => setAlbumForm({ ...albumForm, isPublic: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#222' }}
                    />
                    <label htmlFor="album-public-setup" style={{ margin: 0, fontSize: '0.9rem', color: '#374151' }}>Make album public (visible to clients)</label>
                  </div>
                </div>

                {/* Cover Image Section */}
                <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', color: '#222' }}>Cover Image</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    {/* Cover Preview */}
                    <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '8px', 
                      border: '1px solid #e5e7eb',
                      overflow: 'hidden',
                      background: '#f9fafb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {albumForm.coverImageURL ? (
                        <img 
                          src={albumForm.coverImageURL} 
                          alt="Cover preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <i className="fas fa-image" style={{ fontSize: '2rem', color: '#d1d5db' }}></i>
                      )}
                    </div>
                    {/* Upload and URL Input */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <label 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '8px 16px',
                            background: 'var(--primary)',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500
                          }}
                        >
                          <i className="fas fa-cloud-upload-alt"></i>
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              
                              const formData = new FormData();
                              formData.append('image', file);
                              formData.append('folder', 'venuevue/albums');
                              
                              try {
                                const response = await fetch(`${API_BASE_URL}/upload/image`, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                                  body: formData
                                });
                                const data = await response.json();
                                if (data.success && data.url) {
                                  setAlbumForm({ ...albumForm, coverImageURL: data.url });
                                } else {
                                  showBanner('Failed to upload image', 'error');
                                }
                              } catch (error) {
                                console.error('Upload error:', error);
                                showBanner('Failed to upload image', 'error');
                              }
                            }}
                          />
                        </label>
                        <span style={{ alignSelf: 'center', color: '#6b7280', fontSize: '0.85rem' }}>or</span>
                      </div>
                      <input
                        type="url"
                        value={albumForm.coverImageURL}
                        onChange={(e) => setAlbumForm({ ...albumForm, coverImageURL: e.target.value })}
                        placeholder="Paste image URL..."
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAlbumModal(false)}
                  style={{
                    padding: '10px 24px',
                    background: 'white',
                    color: '#222',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!albumForm.name.trim()) {
                      showBanner('Please enter an album name', 'error');
                      return;
                    }
                    if (!currentUser?.vendorProfileId) {
                      showBanner('Albums will be saved when you complete your profile setup.', 'info');
                      setShowAlbumModal(false);
                      return;
                    }
                    try {
                      const albumData = {
                        albumId: null,
                        albumName: albumForm.name.trim(),
                        albumDescription: albumForm.description.trim(),
                        coverImageURL: albumForm.coverImageURL.trim() || null,
                        isPublic: albumForm.isPublic
                      };
                      const response = await fetch(`${API_BASE_URL}/vendor/${currentUser.vendorProfileId}/portfolio/albums/upsert`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(albumData)
                      });
                      const data = await response.json();
                      if (response.ok && data.success) {
                        showBanner('Album created successfully!', 'success');
                        setShowAlbumModal(false);
                        setAlbumForm({ name: '', description: '', coverImageURL: '', isPublic: true });
                        loadAlbums(); // Refresh albums list
                      } else {
                        console.error('Album creation failed:', data);
                        showBanner(data.message || 'Failed to create album', 'error');
                      }
                    } catch (error) {
                      console.error('Error creating album:', error);
                      showBanner('Failed to create album. Please try again.', 'error');
                    }
                  }}
                  style={{
                    padding: '10px 24px',
                    background: '#222',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Create Album
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Social Media Step - Full Implementation (uses dedicated API like dashboard)
function SocialMediaStep({ formData, onInputChange, setFormData, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localData, setLocalData] = useState({
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    tiktok: ''
  });

  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', icon: 'fab fa-facebook', color: '#1877F2', prefix: 'facebook.com/' },
    { key: 'instagram', label: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F', prefix: 'instagram.com/' },
    { key: 'twitter', label: 'X (Twitter)', icon: 'fab fa-x-twitter', color: '#000000', prefix: 'x.com/' },
    { key: 'linkedin', label: 'LinkedIn', icon: 'fab fa-linkedin', color: '#0077B5', prefix: 'linkedin.com/in/' },
    { key: 'youtube', label: 'YouTube', icon: 'fab fa-youtube', color: '#FF0000', prefix: 'youtube.com/' },
    { key: 'tiktok', label: 'TikTok', icon: 'fab fa-tiktok', color: '#000000', prefix: 'tiktok.com/@' }
  ];

  // Load existing social media from API
  useEffect(() => {
    if (currentUser?.vendorProfileId) {
      loadSocialMedia();
    } else {
      // Use formData if no vendorProfileId
      setLocalData({
        facebook: formData.facebook || '',
        instagram: formData.instagram || '',
        twitter: formData.twitter || '',
        linkedin: formData.linkedin || '',
        youtube: formData.youtube || '',
        tiktok: formData.tiktok || ''
      });
      setLoading(false);
    }
  }, [currentUser?.vendorProfileId]);

  const loadSocialMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/social`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const newData = {
          facebook: data.facebook || '',
          instagram: data.instagram || '',
          twitter: data.twitter || '',
          linkedin: data.linkedin || '',
          youtube: data.youtube || '',
          tiktok: data.tiktok || ''
        };
        setLocalData(newData);
        // Update formData too
        setFormData(prev => ({ ...prev, ...newData }));
      }
    } catch (error) {
      console.error('Error loading social media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setLocalData(prev => ({ ...prev, [key]: value }));
    onInputChange(key, value);
  };

  const handleSave = async () => {
    if (!currentUser?.vendorProfileId) return;
    
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(localData)
      });
      
      if (response.ok) {
        showBanner('Social media links saved successfully!', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving social media:', error);
      showBanner('Failed to save social media links', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="social-media-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-share-alt" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Connect Your Social Media</h3>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Link your social media profiles to increase engagement and make it easier for clients to connect with you.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {socialPlatforms.map(platform => (
            <div key={platform.key} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
                <i className={platform.icon} style={{ color: platform.color, fontSize: '1.5rem' }}></i>
                {platform.label}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', overflow: 'hidden' }}>
                <span style={{ padding: '0.875rem 1rem', color: '#6b7280', fontSize: '0.9rem', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                  {platform.prefix}
                </span>
                <input
                  type="text"
                  placeholder={`your${platform.key}`}
                  value={localData[platform.key] || ''}
                  onChange={(e) => handleChange(platform.key, e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    padding: '0.875rem 1rem',
                    flex: 1,
                    fontSize: '0.95rem',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// Filters Step - Full Implementation (uses dedicated API like dashboard)
function FiltersStep({ formData, setFormData, filterOptions, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);

  // Load existing filters
  useEffect(() => {
    if (currentUser?.vendorProfileId) {
      loadFilters();
    } else {
      setSelectedFilters(formData.selectedFilters || []);
      setLoading(false);
    }
  }, [currentUser?.vendorProfileId]);

  const loadFilters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/filters`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const filters = data.filters ? data.filters.split(',').filter(f => f) : [];
        setSelectedFilters(filters);
        setFormData(prev => ({ ...prev, selectedFilters: filters }));
      }
    } catch (error) {
      console.error('[FiltersStep] Error loading filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFilter = (filterId) => {
    setSelectedFilters(prev => {
      const newFilters = prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId];
      
      // Also update formData
      setFormData(prevData => ({ ...prevData, selectedFilters: newFilters }));
      return newFilters;
    });
  };

  const handleSaveFilters = async () => {
    if (!currentUser?.vendorProfileId) {
      showBanner('Please complete your basic profile first', 'warning');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/filters`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          filters: selectedFilters.join(',')
        })
      });

      if (response.ok) {
        showBanner('Filters saved successfully!', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving filters:', error);
      showBanner('Failed to save filters', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="filters-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-tags" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Enable Special Badges</h3>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Select badges that apply to your business. These help clients find you when browsing and filtering vendors.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {filterOptions.map(filter => {
            const isSelected = selectedFilters.includes(filter.id);
            return (
              <div
                key={filter.id}
                onClick={() => handleToggleFilter(filter.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  background: isSelected ? '#f0f9ff' : 'white',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: filter.color + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className={`fas ${filter.icon}`} style={{ color: filter.color, fontSize: '1.5rem' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem', color: '#111827' }}>
                    {filter.label}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.5 }}>
                    {filter.description || `Enable ${filter.label} badge for your profile`}
                  </div>
                </div>
                {isSelected && (
                  <i className="fas fa-check-circle" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}></i>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

// Stripe Connect Step (uses same API as dashboard)
function StripeStep({ formData, setFormData, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [stripeStatus, setStripeStatus] = useState({
    connected: false,
    accountId: null,
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false
  });

  // Check Stripe connection status on mount
  useEffect(() => {
    if (currentUser?.vendorProfileId) {
      loadStripeStatus();
    } else {
      setLoading(false);
    }
  }, [currentUser?.vendorProfileId]);

  const loadStripeStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/payments/connect/status/${currentUser.vendorProfileId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
        // Update formData so step completion can check it
        if (data.connected) {
          setFormData(prev => ({ ...prev, stripeConnected: true }));
        }
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!currentUser?.vendorProfileId) {
      showBanner('Please complete your profile first before connecting Stripe.', 'info');
      return;
    }

    setConnecting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payments/connect/onboard/${currentUser.vendorProfileId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Check for authUrl or url (dashboard uses both)
        if (data.authUrl || data.url) {
          window.location.href = data.authUrl || data.url;
        } else {
          showBanner('Stripe Connect is not configured yet. Please contact support.', 'warning');
        }
      } else {
        const errorData = await response.json();
        console.error('Stripe onboard error:', errorData);
        showBanner(errorData.message || 'Failed to initiate Stripe connection', 'error');
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      showBanner('Failed to connect to Stripe. Please try again.', 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleManageStripe = async () => {
    try {
      showBanner('Opening Stripe dashboard...', 'info');
      const response = await fetch(`${API_BASE_URL}/payments/connect/dashboard/${currentUser.vendorProfileId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const url = data.dashboardUrl || data.url || data.link;
        if (url) {
          window.open(url, '_blank');
        } else {
          showBanner('Could not get Stripe dashboard URL. Please try again.', 'error');
        }
      } else {
        // For Standard accounts, redirect to Stripe login
        if (data.error && data.error.includes('Express Dashboard')) {
          window.open('https://dashboard.stripe.com/login', '_blank');
          showBanner('Redirecting to Stripe Dashboard login...', 'info');
        } else {
          showBanner('Failed to open Stripe dashboard. Please try again.', 'error');
        }
      }
    } catch (error) {
      console.error('Error opening Stripe dashboard:', error);
      showBanner('Failed to open Stripe dashboard', 'error');
    }
  };

  return (
    <div className="stripe-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <i className="fab fa-stripe" style={{ color: '#635bff', fontSize: '1.5rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Connect Stripe for Payments</h3>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Set up payment processing to accept online payments from clients securely through Stripe.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <div className="spinner"></div>
          </div>
        )}

        {/* Main Content */}
        {!loading && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '2rem' }}>
            {/* Connection Status */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                Connection Status
              </label>
              <div style={{ 
                padding: '0.875rem 1rem', 
                background: '#f9fafb', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <i className={`fas ${stripeStatus.connected ? 'fa-check-circle' : 'fa-times-circle'}`} 
                   style={{ color: stripeStatus.connected ? '#16a34a' : '#6b7280' }}></i>
                <span style={{ fontWeight: 500 }}>
                  {!currentUser?.vendorProfileId 
                    ? 'Complete profile first'
                    : !stripeStatus.connected 
                      ? 'Not connected' 
                      : stripeStatus.detailsSubmitted 
                        ? 'Connected and active' 
                        : 'Connected - setup incomplete'}
                </span>
              </div>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {!currentUser?.vendorProfileId 
                  ? 'You need to complete your basic profile before connecting Stripe.'
                  : !stripeStatus.connected 
                    ? 'Connect your Stripe account to accept credit cards, debit cards, and other payment methods.'
                    : stripeStatus.detailsSubmitted
                      ? 'Your account is ready to receive payments.'
                      : 'Complete your Stripe setup to start accepting payments.'}
              </p>
            </div>

            {/* Connect/Manage Button */}
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                onClick={stripeStatus.connected ? handleManageStripe : handleConnectStripe}
                disabled={connecting || !currentUser?.vendorProfileId}
                className="btn btn-primary"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.95rem',
                  background: '#222222',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: (connecting || !currentUser?.vendorProfileId) ? 'not-allowed' : 'pointer',
                  opacity: (connecting || !currentUser?.vendorProfileId) ? 0.7 : 1
                }}
              >
                {connecting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Connecting...
                  </>
                ) : (
                  <>
                    <i className={stripeStatus.connected ? "fas fa-external-link-alt" : "fab fa-stripe"} style={{ fontSize: '1.1rem' }}></i>
                    {stripeStatus.connected 
                      ? (stripeStatus.detailsSubmitted ? 'Manage Stripe Account' : 'Complete Stripe Setup')
                      : 'Connect Stripe Account'}
                  </>
                )}
              </button>
            </div>

            {/* Account Details - Only show when connected */}
            {stripeStatus.connected && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                      Account ID
                    </label>
                    <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {stripeStatus.accountId || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                      Details Submitted
                    </label>
                    <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {stripeStatus.detailsSubmitted ? (
                        <><i className="fas fa-check-circle" style={{ color: '#16a34a' }}></i> <span style={{ color: '#16a34a', fontWeight: 500 }}>Yes</span></>
                      ) : (
                        <><i className="fas fa-times-circle" style={{ color: '#dc2626' }}></i> <span style={{ color: '#dc2626', fontWeight: 500 }}>No</span></>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                      Charges Enabled
                    </label>
                    <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {stripeStatus.chargesEnabled ? (
                        <><i className="fas fa-check-circle" style={{ color: '#16a34a' }}></i> <span style={{ color: '#16a34a', fontWeight: 500 }}>Yes</span></>
                      ) : (
                        <><i className="fas fa-times-circle" style={{ color: '#dc2626' }}></i> <span style={{ color: '#dc2626', fontWeight: 500 }}>No</span></>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                      Payouts Enabled
                    </label>
                    <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {stripeStatus.payoutsEnabled ? (
                        <><i className="fas fa-check-circle" style={{ color: '#16a34a' }}></i> <span style={{ color: '#16a34a', fontWeight: 500 }}>Yes</span></>
                      ) : (
                        <><i className="fas fa-times-circle" style={{ color: '#dc2626' }}></i> <span style={{ color: '#dc2626', fontWeight: 500 }}>No</span></>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Why Connect Stripe - Only show when not connected */}
            {!stripeStatus.connected && (
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px' }}>
                <h5 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                  Why connect Stripe?
                </h5>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.8 }}>
                  <li>Accept credit cards, debit cards, and digital wallets</li>
                  <li>Secure payment processing with industry-leading security</li>
                  <li>Automatic payouts to your bank account</li>
                  <li>Built-in fraud protection and dispute management</li>
                  <li>Detailed transaction reporting and analytics</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Google Reviews Step (uses dedicated API like dashboard)
function GoogleReviewsStep({ formData, setFormData, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Load existing Google Reviews settings
  useEffect(() => {
    if (currentUser?.vendorProfileId) {
      loadGoogleReviewsSettings();
    } else {
      setLoading(false);
    }
  }, [currentUser?.vendorProfileId]);

  const loadGoogleReviewsSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/google-reviews-settings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const placeId = data.GooglePlaceId || '';
        setGooglePlaceId(placeId);
        setFormData(prev => ({ ...prev, googlePlaceId: placeId }));
        
        // If Place ID exists, verify it to show preview
        if (placeId) {
          verifyPlaceId(placeId, false);
        }
      }
    } catch (error) {
      console.error('Error loading Google Reviews settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPlaceId = async (placeId, showMessage = true) => {
    if (!placeId || placeId.trim() === '') {
      setVerificationStatus(null);
      setPreviewData(null);
      return;
    }

    try {
      setVerifying(true);
      const response = await fetch(`${API_BASE_URL}/vendors/google-reviews/${placeId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus('success');
        setPreviewData(data.data || data);
        setFormData(prev => ({ ...prev, googlePlaceId: placeId }));
        
        if (showMessage) {
          showBanner('✓ Valid Google Place ID! Preview loaded.', 'success');
        }
      } else {
        setVerificationStatus('error');
        setPreviewData(null);
        
        if (showMessage) {
          showBanner('Invalid Google Place ID. Please check and try again.', 'error');
        }
      }
    } catch (error) {
      console.error('Error verifying Place ID:', error);
      setVerificationStatus('error');
      setPreviewData(null);
      
      if (showMessage) {
        showBanner('Failed to verify Place ID. Please try again.', 'error');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyGooglePlace = () => {
    verifyPlaceId(googlePlaceId, true);
  };

  const handleSaveGoogleReviews = async () => {
    if (!currentUser?.vendorProfileId) {
      showBanner('Please complete your basic profile first', 'warning');
      return;
    }

    if (googlePlaceId && verificationStatus !== 'success') {
      showBanner('Please verify your Google Place ID before saving.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/google-reviews-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          GooglePlaceId: googlePlaceId,
          GoogleBusinessUrl: ''
        })
      });

      if (response.ok) {
        showBanner('Google Reviews settings saved successfully!', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving Google Reviews:', error);
      showBanner('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="google-reviews-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Connect Google Reviews</h3>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Display your Google Business reviews on your profile to build trust and credibility with potential clients.
          </p>
        </div>

        {/* Main Content */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '2rem' }}>
          {/* Connection Status */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Connection Status
            </label>
            <div style={{ 
              padding: '0.875rem 1rem', 
              background: '#f9fafb', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <i className={`fas ${verificationStatus === 'success' ? 'fa-check-circle' : 'fa-times-circle'}`} 
                 style={{ color: verificationStatus === 'success' ? '#16a34a' : '#6b7280' }}></i>
              <span style={{ fontWeight: 500 }}>
                {!currentUser?.vendorProfileId 
                  ? 'Complete profile first'
                  : verificationStatus === 'success' 
                    ? 'Connected and verified' 
                    : 'Not connected'}
              </span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {!currentUser?.vendorProfileId 
                ? 'You need to complete your basic profile before connecting Google Reviews.'
                : verificationStatus === 'success'
                  ? 'Your Google Reviews will be displayed on your profile.'
                  : 'Enter your Google Place ID to display reviews on your profile.'}
            </p>
          </div>

          {/* Google Place ID Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Google Place ID
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter your Google Place ID"
                value={googlePlaceId}
                onChange={(e) => setGooglePlaceId(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '0.625rem 0.875rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
              <button
                onClick={handleVerifyGooglePlace}
                disabled={verifying || !googlePlaceId.trim()}
                className="btn btn-primary"
                style={{ 
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  background: '#222222',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: (verifying || !googlePlaceId.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (verifying || !googlePlaceId.trim()) ? 0.6 : 1
                }}
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            <small style={{ display: 'block', color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                <i className="fas fa-external-link-alt" style={{ marginRight: '0.35rem', fontSize: '0.7rem' }}></i>
                How to find your Google Place ID
              </a>
            </small>
          </div>

          {/* Preview Section - Only show when connected */}
          {verificationStatus === 'success' && previewData && (
            <>
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>
                  Google Reviews Preview
                </label>
                <div style={{ padding: '1.25rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>Google Reviews</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Verified business reviews</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{(previewData.rating || 0).toFixed(1)}</span>
                    <div>
                      <div style={{ color: '#fbbc04', fontSize: '1rem', marginBottom: '0.125rem' }}>{'★'.repeat(Math.round(previewData.rating || 0))}{'☆'.repeat(5 - Math.round(previewData.rating || 0))}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Based on {(previewData.user_ratings_total || 0).toLocaleString()} reviews</div>
                    </div>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/place/?q=place_id:${googlePlaceId}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '1rem', color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 500 }}
                  >
                    View on Google Maps <i className="fas fa-external-link-alt" style={{ fontSize: '0.75rem' }}></i>
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Why Connect - Only show when not connected */}
          {verificationStatus !== 'success' && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px' }}>
              <h5 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                Why connect Google Reviews?
              </h5>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.8 }}>
                <li>Build trust with potential clients through authentic reviews</li>
                <li>Display your star rating prominently on your profile</li>
                <li>Showcase recent customer feedback automatically</li>
                <li>Improve your visibility in search results</li>
                <li>Stand out from competitors without reviews</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Policies Step - Full Implementation (uses dedicated API like dashboard)
function PoliciesStep({ formData, onInputChange, setFormData, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [newFaq, setNewFaq] = useState({ question: '', answers: [''] });
  const [savingFaq, setSavingFaq] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null); // { index, question, answers }
  const [cancellationPolicy, setCancellationPolicy] = useState({
    policyType: 'flexible',
    fullRefundDays: 7,
    partialRefundDays: 3,
    partialRefundPercent: 50,
    noRefundDays: 1
  });
  const [savingPolicy, setSavingPolicy] = useState(false);

  const policyTypes = [
    { id: 'flexible', name: 'Flexible', description: 'Full refund up to 24 hours before', color: '#10b981' },
    { id: 'moderate', name: 'Moderate', description: 'Full refund 7 days before, 50% refund 3 days before', color: '#f59e0b' },
    { id: 'strict', name: 'Strict', description: '50% refund 14 days before, no refund after', color: '#ef4444' },
    { id: 'custom', name: 'Custom', description: 'Set your own terms', color: '#6366f1' }
  ];

  // Load existing FAQs and cancellation policy
  useEffect(() => {
    if (currentUser?.vendorProfileId) {
      loadFAQs();
      loadCancellationPolicy();
    } else {
      setLoading(false);
    }
  }, [currentUser?.vendorProfileId]);

  const loadCancellationPolicy = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/vendor/${currentUser.vendorProfileId}/cancellation-policy`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.policy) {
          setCancellationPolicy({
            policyType: data.policy.PolicyType || 'flexible',
            fullRefundDays: data.policy.FullRefundDays || 7,
            partialRefundDays: data.policy.PartialRefundDays || 3,
            partialRefundPercent: data.policy.PartialRefundPercent || 50,
            noRefundDays: data.policy.NoRefundDays || 1
          });
        }
      }
    } catch (error) {
      console.error('Error loading cancellation policy:', error);
    }
  };

  const handleSaveCancellationPolicy = async () => {
    if (!currentUser?.vendorProfileId) {
      showBanner('Please complete your profile first', 'error');
      return;
    }
    setSavingPolicy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payments/vendor/${currentUser.vendorProfileId}/cancellation-policy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(cancellationPolicy)
      });
      if (response.ok) {
        showBanner('Cancellation policy saved!', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      showBanner('Failed to save cancellation policy', 'error');
    } finally {
      setSavingPolicy(false);
    }
  };

  const handlePolicyTypeChange = (type) => {
    const defaults = {
      flexible: { fullRefundDays: 1, partialRefundDays: 0, partialRefundPercent: 0, noRefundDays: 0 },
      moderate: { fullRefundDays: 7, partialRefundDays: 3, partialRefundPercent: 50, noRefundDays: 1 },
      strict: { fullRefundDays: 14, partialRefundDays: 7, partialRefundPercent: 50, noRefundDays: 3 },
      custom: { fullRefundDays: cancellationPolicy.fullRefundDays, partialRefundDays: cancellationPolicy.partialRefundDays, partialRefundPercent: cancellationPolicy.partialRefundPercent, noRefundDays: cancellationPolicy.noRefundDays }
    };
    setCancellationPolicy({ ...cancellationPolicy, policyType: type, ...defaults[type] });
  };

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/faqs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const faqsArray = Array.isArray(data) ? data : (data.faqs || []);
        const mappedFaqs = faqsArray.map(faq => {
          const answer = faq.answer || faq.Answer || '';
          // Check if answer contains multiple answers (separated by newlines or bullet points)
          let answers = [];
          if (answer.includes('\n• ') || answer.includes('\n- ')) {
            answers = answer.split(/\n[•-]\s*/).filter(a => a.trim());
          } else if (answer.includes('\n')) {
            answers = answer.split('\n').filter(a => a.trim());
          } else {
            answers = [answer];
          }
          return {
            id: faq.id || faq.FAQID,
            question: faq.question || faq.Question,
            answers: answers.length > 0 ? answers : ['']
          };
        });
        setFaqs(mappedFaqs);
        setFormData(prev => ({
          ...prev,
          faqs: mappedFaqs
        }));
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnswer = () => {
    setNewFaq(prev => ({ ...prev, answers: [...prev.answers, ''] }));
  };

  const handleRemoveAnswer = (index) => {
    if (newFaq.answers.length > 1) {
      setNewFaq(prev => ({
        ...prev,
        answers: prev.answers.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAnswerChange = (index, value) => {
    setNewFaq(prev => ({
      ...prev,
      answers: prev.answers.map((a, i) => i === index ? value : a)
    }));
  };

  const handleAddFaq = async () => {
    const validAnswers = newFaq.answers.filter(a => a.trim());
    if (!newFaq.question.trim() || validAnswers.length === 0) {
      showBanner('Please fill in the question and at least one answer', 'error');
      return;
    }

    // Format answers - if multiple, use bullet points
    const formattedAnswer = validAnswers.length === 1 
      ? validAnswers[0] 
      : validAnswers.map(a => `• ${a}`).join('\n');

    if (!currentUser?.vendorProfileId) {
      const newFaqWithId = { 
        id: Date.now(), 
        question: newFaq.question, 
        answers: validAnswers 
      };
      setFaqs(prev => [...prev, newFaqWithId]);
      setFormData(prev => ({
        ...prev,
        faqs: [...(prev.faqs || []), newFaqWithId]
      }));
      setNewFaq({ question: '', answers: [''] });
      showBanner('FAQ added! It will be saved when you complete your profile.', 'success');
      return;
    }

    setSavingFaq(true);
    try {
      const updatedFaqs = [...faqs, { question: newFaq.question, answer: formattedAnswer }];
      
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ faqs: updatedFaqs.map(f => ({ 
          question: f.question, 
          answer: f.answers ? (f.answers.length === 1 ? f.answers[0] : f.answers.map(a => `• ${a}`).join('\n')) : f.answer 
        })) })
      });

      if (response.ok) {
        showBanner('FAQ added successfully!', 'success');
        setNewFaq({ question: '', answers: [''] });
        loadFAQs();
      } else {
        throw new Error('Failed to add FAQ');
      }
    } catch (error) {
      console.error('Error adding FAQ:', error);
      showBanner('Failed to add FAQ', 'error');
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDeleteFaq = async (faqId, index) => {
    if (!currentUser?.vendorProfileId || !faqId) {
      setFaqs(prev => prev.filter((_, i) => i !== index));
      setFormData(prev => ({
        ...prev,
        faqs: prev.faqs.filter((_, i) => i !== index)
      }));
      showBanner('FAQ removed', 'success');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/faqs/${faqId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        showBanner('FAQ deleted successfully!', 'success');
        loadFAQs();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      showBanner('Failed to delete FAQ', 'error');
    }
  };

  const handleEditFaq = (index) => {
    const faq = displayFaqs[index];
    setEditingFaq({
      index,
      id: faq.id,
      question: faq.question,
      answers: faq.answers || [faq.answer || '']
    });
  };

  const handleCancelEdit = () => {
    setEditingFaq(null);
  };

  const handleEditAnswerChange = (answerIndex, value) => {
    setEditingFaq(prev => ({
      ...prev,
      answers: prev.answers.map((a, i) => i === answerIndex ? value : a)
    }));
  };

  const handleAddEditAnswer = () => {
    setEditingFaq(prev => ({
      ...prev,
      answers: [...prev.answers, '']
    }));
  };

  const handleRemoveEditAnswer = (answerIndex) => {
    if (editingFaq.answers.length > 1) {
      setEditingFaq(prev => ({
        ...prev,
        answers: prev.answers.filter((_, i) => i !== answerIndex)
      }));
    }
  };

  const handleSaveEdit = async () => {
    const validAnswers = editingFaq.answers.filter(a => a.trim());
    if (!editingFaq.question.trim() || validAnswers.length === 0) {
      showBanner('Please fill in the question and at least one answer', 'error');
      return;
    }

    const formattedAnswer = validAnswers.length === 1 
      ? validAnswers[0] 
      : validAnswers.map(a => `• ${a}`).join('\n');

    if (!currentUser?.vendorProfileId) {
      // Local update
      const updatedFaqs = [...faqs];
      updatedFaqs[editingFaq.index] = {
        ...updatedFaqs[editingFaq.index],
        question: editingFaq.question,
        answers: validAnswers
      };
      setFaqs(updatedFaqs);
      setFormData(prev => ({ ...prev, faqs: updatedFaqs }));
      setEditingFaq(null);
      showBanner('FAQ updated!', 'success');
      return;
    }

    setSavingFaq(true);
    try {
      const updatedFaqs = faqs.map((f, i) => {
        if (i === editingFaq.index) {
          return { question: editingFaq.question, answer: formattedAnswer };
        }
        return { 
          question: f.question, 
          answer: f.answers ? (f.answers.length === 1 ? f.answers[0] : f.answers.map(a => `• ${a}`).join('\n')) : f.answer 
        };
      });

      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ faqs: updatedFaqs })
      });

      if (response.ok) {
        showBanner('FAQ updated successfully!', 'success');
        setEditingFaq(null);
        loadFAQs();
      } else {
        throw new Error('Failed to update FAQ');
      }
    } catch (error) {
      console.error('Error updating FAQ:', error);
      showBanner('Failed to update FAQ', 'error');
    } finally {
      setSavingFaq(false);
    }
  };

  const displayFaqs = faqs.length > 0 ? faqs : (formData.faqs || []);

  return (
    <div className="policies-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        {/* FAQs Section Header */}
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-question-circle" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Frequently Asked Questions</h3>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Add common questions and answers to help potential clients learn more about your services.
          </p>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
          </div>
        )}

        {!loading && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Existing FAQs */}
            {displayFaqs.length > 0 && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {displayFaqs.map((faq, index) => (
                  <div 
                    key={faq.id || index} 
                    style={{ 
                      background: 'white', 
                      borderRadius: '12px', 
                      border: '1px solid #e5e7eb',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Edit Mode */}
                    {editingFaq && editingFaq.index === index ? (
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                            Question
                          </label>
                          <input
                            type="text"
                            value={editingFaq.question}
                            onChange={(e) => setEditingFaq(prev => ({ ...prev, question: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.95rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                              Answer{editingFaq.answers.length > 1 ? 's' : ''}
                            </label>
                            <button
                              type="button"
                              onClick={handleAddEditAnswer}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 500
                              }}
                            >
                              <i className="fas fa-plus"></i> Add answer
                            </button>
                          </div>
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {editingFaq.answers.map((answer, ansIdx) => (
                              <div key={ansIdx} style={{ display: 'flex', gap: '0.5rem' }}>
                                <textarea
                                  value={answer}
                                  onChange={(e) => handleEditAnswerChange(ansIdx, e.target.value)}
                                  rows={2}
                                  style={{
                                    flex: 1,
                                    padding: '0.75rem 1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '0.95rem',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                  }}
                                />
                                {editingFaq.answers.length > 1 && (
                                  <button
                                    type="button"
                                    className="action-btn action-btn-delete"
                                    onClick={() => handleRemoveEditAnswer(ansIdx)}
                                    title="Remove answer"
                                    style={{ alignSelf: 'flex-start' }}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            onClick={handleSaveEdit}
                            disabled={savingFaq}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                          >
                            {savingFaq ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* View Mode */}
                        <div style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: '0.75rem'
                          }}>
                            <strong style={{ fontSize: '0.95rem', color: '#111827', flex: 1 }}>{faq.question}</strong>
                            <div className="action-btn-group">
                              <button
                                type="button"
                                className="action-btn action-btn-edit"
                                onClick={() => handleEditFaq(index)}
                                title="Edit FAQ"
                              >
                                <i className="fas fa-pen"></i>
                              </button>
                              <button
                                type="button"
                                className="action-btn action-btn-delete"
                                onClick={() => handleDeleteFaq(faq.id, index)}
                                title="Delete FAQ"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </div>
                          {/* Display answers - clean text format */}
                          {(() => {
                            let answers = faq.answers || [faq.answer || ''];
                            if (!Array.isArray(answers)) answers = [answers];
                            answers = answers.map(a => String(a || '').replace(/^[•\-]\s*/, '').trim()).filter(a => a);
                            
                            if (answers.length === 0) {
                              return <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' }}>No answer provided</p>;
                            }
                            
                            return (
                              <div style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                {answers.map((answer, ansIdx) => (
                                  <p key={ansIdx} style={{ margin: ansIdx > 0 ? '0.25rem 0 0' : 0 }}>{answer}</p>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New FAQ Card */}
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              border: '1px solid #e5e7eb',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                    Question
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Do you travel for events?"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: 500, fontSize: '0.875rem', color: '#374151' }}>
                      Answer{newFaq.answers.length > 1 ? 's' : ''}
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewFaq({ ...newFaq, answers: [...newFaq.answers, ''] })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        padding: '0.25rem 0.5rem'
                      }}
                    >
                      <i className="fas fa-plus"></i> Add answer
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {newFaq.answers.map((answer, ansIdx) => (
                      <div key={ansIdx} style={{ display: 'flex', gap: '0.5rem' }}>
                        <textarea
                          placeholder="Provide a detailed answer..."
                          value={answer}
                          onChange={(e) => {
                            const updatedAnswers = [...newFaq.answers];
                            updatedAnswers[ansIdx] = e.target.value;
                            setNewFaq({ ...newFaq, answers: updatedAnswers });
                          }}
                          rows={2}
                          style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box'
                          }}
                        />
                        {newFaq.answers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedAnswers = newFaq.answers.filter((_, i) => i !== ansIdx);
                              setNewFaq({ ...newFaq, answers: updatedAnswers });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              alignSelf: 'flex-start'
                            }}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleAddFaq}
                  disabled={savingFaq || !newFaq.question.trim() || !newFaq.answers.some(a => a.trim())}
                  className="btn btn-primary"
                  style={{ justifySelf: 'start', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
                >
                  {savingFaq ? (
                    <><i className="fas fa-spinner fa-spin"></i> Adding...</>
                  ) : (
                    <><i className="fas fa-plus"></i> Add FAQ</>
                  )}
                </button>
              </div>
            </div>

            {/* Empty State */}
            {displayFaqs.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                background: '#f9fafb', 
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <i className="fas fa-comments" style={{ fontSize: '2.5rem', color: '#d1d5db', marginBottom: '1rem', display: 'block' }}></i>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>
                  No FAQs added yet. Add your first question above to help clients learn more about your services.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Review Step - Full Implementation
function ReviewStep({ formData, categories, profileStatus, steps, isStepCompleted, filterOptions }) {
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Helper to get badge label from filter ID
  const getBadgeLabel = (filterId) => {
    const filter = filterOptions?.find(f => f.id === filterId);
    return filter ? filter.label : filterId.replace('filter-', '').replace(/-/g, ' ');
  };

  const allCategories = [formData.primaryCategory, ...(formData.additionalCategories || [])].filter(Boolean);
  
  // Format service areas for display
  const formatServiceAreas = () => {
    if (!formData.serviceAreas || formData.serviceAreas.length === 0) return null;
    return formData.serviceAreas.map(area => {
      if (typeof area === 'string') return area;
      const city = area.city || area.name || '';
      const province = area.province || area.state || '';
      return [city, province].filter(Boolean).join(', ') || area.formattedAddress || 'Unknown';
    }).join('; ');
  };

  // Format business hours for display
  const formatBusinessHours = () => {
    if (!formData.businessHours) return null;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const openDays = days.filter(day => formData.businessHours[day]?.isAvailable !== false);
    if (openDays.length === 0) return 'All days closed';
    if (openDays.length === 7) return 'Open all week';
    return `Open ${openDays.length} days/week`;
  };

  // Helper to render status badge
  const StatusBadge = ({ isRequired, isComplete }) => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <span style={{
        padding: '0.25rem 0.5rem',
        background: isRequired ? '#fef3c7' : '#f3f4f6',
        color: isRequired ? '#92400e' : '#6b7280',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {isRequired ? 'Required' : 'Optional'}
      </span>
      {isComplete ? (
        <span style={{ color: '#10b981', fontSize: '0.85rem' }}>
          <i className="fas fa-check-circle"></i>
        </span>
      ) : isRequired ? (
        <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>
          <i className="fas fa-exclamation-circle"></i>
        </span>
      ) : null}
    </div>
  );

  // Helper to render a field row
  const FieldRow = ({ label, value, isProvided }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.5rem' }}>
      <span style={{ color: '#6b7280' }}>{label}:</span>
      <span style={{ color: isProvided ? '#111827' : '#9ca3af' }}>
        {isProvided ? value : 'Not provided'}
      </span>
    </div>
  );

  // Count services
  const servicesCount = (formData.selectedServices || []).length;
  
  // Count social links
  const socialLinksCount = Object.keys(formData).filter(k => ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'].includes(k) && formData[k]).length;

  return (
    <div className="review-step">
      <div style={{ maxWidth: '100%', width: '100%' }}>
        {/* Pending Review Notice */}
        {profileStatus === 'pending_review' && (
          <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f3f4f6', borderRadius: '12px', border: '2px solid #222222' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <i className="fas fa-hourglass-half" style={{ color: '#222222', fontSize: '1.5rem', flexShrink: 0 }}></i>
              <div>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                  Profile Under Review
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                  Your profile has been submitted and is currently under review by our team. This typically takes 1-2 business days. 
                  You'll receive an email notification once your profile is approved or if any changes are requested. 
                  You can still make edits from your dashboard while waiting.
                </p>
              </div>
            </div>
          </div>
        )}



        {/* Required Steps Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ padding: '0.25rem 0.5rem', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Required</span>
            Mandatory Information
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Categories - Required */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Categories</h4>
                <StatusBadge isRequired={true} isComplete={allCategories.length > 0} />
              </div>
              <FieldRow label="Primary" value={getCategoryName(formData.primaryCategory)} isProvided={!!formData.primaryCategory} />
              {formData.additionalCategories?.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <FieldRow label="Additional" value={formData.additionalCategories.map(getCategoryName).join(', ')} isProvided={true} />
                </div>
              )}
            </div>

            {/* Business Details - Required */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Business Details</h4>
                <StatusBadge isRequired={true} isComplete={!!(formData.businessName && formData.displayName)} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                <FieldRow label="Business Name" value={formData.businessName} isProvided={!!formData.businessName} />
                <FieldRow label="Display Name" value={formData.displayName} isProvided={!!formData.displayName} />
                <FieldRow label="Description" value={formData.businessDescription ? (formData.businessDescription.length > 150 ? formData.businessDescription.substring(0, 150) + '...' : formData.businessDescription) : null} isProvided={!!formData.businessDescription} />
                <FieldRow label="Years in Business" value={formData.yearsInBusiness} isProvided={!!formData.yearsInBusiness} />
              </div>
            </div>

            {/* Contact - Required */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Contact Information</h4>
                <StatusBadge isRequired={true} isComplete={!!(formData.businessPhone && formData.email)} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                <FieldRow label="Phone" value={formData.businessPhone} isProvided={!!formData.businessPhone} />
                <FieldRow label="Email" value={formData.email} isProvided={!!formData.email} />
                <FieldRow label="Website" value={formData.website} isProvided={!!formData.website} />
              </div>
            </div>

            {/* Location - Required */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Location</h4>
                <StatusBadge isRequired={true} isComplete={!!(formData.city && formData.province && formData.serviceAreas?.length > 0)} />
              </div>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                <FieldRow label="City" value={formData.city} isProvided={!!formData.city} />
                <FieldRow label="Province" value={formData.province} isProvided={!!formData.province} />
                <FieldRow label="Service Areas" value={formatServiceAreas()} isProvided={!!formatServiceAreas()} />
                <FieldRow label="Address" value={formData.address} isProvided={!!formData.address} />
              </div>
            </div>

            {/* Business Hours - Required */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Business Hours</h4>
                <StatusBadge isRequired={true} isComplete={!!formatBusinessHours()} />
              </div>
              {formData.businessHours ? (
                <div style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                    const hours = formData.businessHours[day];
                    return (
                      <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{day}</span>
                        <span style={{ color: hours?.isAvailable ? '#111827' : '#9ca3af' }}>
                          {hours?.isAvailable ? `${hours.openTime || '9:00 AM'} - ${hours.closeTime || '5:00 PM'}` : 'Closed'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Not set</span>
              )}
            </div>

            {/* Photos - Required (5 minimum) */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Photos</h4>
                <StatusBadge isRequired={true} isComplete={(formData.photoURLs || []).length >= 5} />
              </div>
              {(formData.photoURLs || []).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                  {(formData.photoURLs || []).slice(0, 8).map((photo, idx) => (
                    <div key={idx} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <img src={typeof photo === 'string' ? photo : photo.url} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                  {(formData.photoURLs || []).length > 8 && (
                    <div style={{ aspectRatio: '1', borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#6b7280' }}>
                      +{(formData.photoURLs || []).length - 8} more
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>No photos uploaded</span>
              )}
            </div>

            {/* Stripe - Required */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Stripe Payments</h4>
                <StatusBadge isRequired={true} isComplete={!!formData.stripeConnected} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <i className="fab fa-stripe" style={{ fontSize: '1.5rem', color: formData.stripeConnected ? '#635bff' : '#9ca3af' }}></i>
                <span style={{ color: formData.stripeConnected ? '#16a34a' : '#9ca3af' }}>
                  {formData.stripeConnected ? 'Connected and ready to accept payments' : 'Not connected - required to accept bookings'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Steps Section */}
        <div>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ padding: '0.25rem 0.5rem', background: '#f3f4f6', color: '#6b7280', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Optional</span>
            Profile Enhancements
          </h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#6b7280' }}>
            These sections help improve your profile visibility and client engagement. You can complete them anytime.
          </p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Services - Optional */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Services</h4>
                <StatusBadge isRequired={false} isComplete={servicesCount > 0} />
              </div>
              {servicesCount > 0 ? (
                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ color: '#111827' }}>{servicesCount} service{servicesCount > 1 ? 's' : ''} configured</span>
                  {formData.selectedServices && formData.selectedServices.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {formData.selectedServices.slice(0, 5).map((service, idx) => (
                        <span key={idx} style={{ padding: '0.25rem 0.5rem', background: '#f3f4f6', borderRadius: '4px', fontSize: '0.8rem', color: '#374151' }}>
                          {service.name || service.serviceName || `Service ${idx + 1}`}
                        </span>
                      ))}
                      {formData.selectedServices.length > 5 && (
                        <span style={{ padding: '0.25rem 0.5rem', background: '#e5e7eb', borderRadius: '4px', fontSize: '0.8rem', color: '#6b7280' }}>
                          +{formData.selectedServices.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>No services added</span>
              )}
            </div>

            {/* Features - Optional */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Features & Amenities</h4>
                <StatusBadge isRequired={false} isComplete={(formData.selectedFeatures || []).length > 0} />
              </div>
              {(formData.selectedFeatures || []).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(formData.selectedFeatures || []).slice(0, 10).map((feature, idx) => {
                    // Handle different feature formats: object with name, string, or number (ID)
                    const featureName = typeof feature === 'object' && feature !== null 
                      ? (feature.name || feature.featureName || feature.label || `Feature ${feature.id || idx + 1}`)
                      : typeof feature === 'string' 
                        ? feature 
                        : `Feature ${idx + 1}`;
                    return (
                      <span key={idx} style={{ padding: '0.35rem 0.75rem', background: '#f3f4f6', borderRadius: '20px', fontSize: '0.8rem', color: '#374151', border: '1px solid #e5e7eb' }}>
                        {featureName}
                      </span>
                    );
                  })}
                  {(formData.selectedFeatures || []).length > 10 && (
                    <span style={{ padding: '0.35rem 0.75rem', background: '#f3f4f6', borderRadius: '20px', fontSize: '0.8rem', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                      +{(formData.selectedFeatures || []).length - 10} more
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>No features selected</span>
              )}
            </div>

            {/* Social Media - Optional */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Social Media</h4>
                <StatusBadge isRequired={false} isComplete={socialLinksCount > 0} />
              </div>
              {socialLinksCount > 0 ? (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {formData.facebook && (
                    <a href={formData.facebook} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.9rem', color: '#374151' }}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" style={{ width: '20px', height: '20px' }} />
                      <span>Facebook</span>
                    </a>
                  )}
                  {formData.instagram && (
                    <a href={formData.instagram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.9rem', color: '#374151' }}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" style={{ width: '20px', height: '20px' }} />
                      <span>Instagram</span>
                    </a>
                  )}
                  {formData.twitter && (
                    <a href={formData.twitter} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.9rem', color: '#374151' }}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg" alt="X" style={{ width: '18px', height: '18px' }} />
                      <span>X</span>
                    </a>
                  )}
                  {formData.linkedin && (
                    <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.9rem', color: '#374151' }}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" style={{ width: '20px', height: '20px' }} />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {formData.youtube && (
                    <a href={formData.youtube} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.9rem', color: '#374151' }}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png" alt="YouTube" style={{ width: '20px', height: '20px' }} />
                      <span>YouTube</span>
                    </a>
                  )}
                  {formData.tiktok && (
                    <a href={formData.tiktok} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.9rem', color: '#374151' }}>
                      <img src="https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg" alt="TikTok" style={{ width: '20px', height: '20px' }} />
                      <span>TikTok</span>
                    </a>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>No social links added</span>
              )}
            </div>

            {/* Badges - Optional */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Special Badges</h4>
                <StatusBadge isRequired={false} isComplete={(formData.selectedFilters || []).length > 0} />
              </div>
              {(formData.selectedFilters || []).length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(formData.selectedFilters || []).map((filter, idx) => {
                    const filterObj = filterOptions?.find(f => f.id === filter);
                    return (
                      <span key={idx} style={{ 
                        padding: '0.35rem 0.75rem', 
                        background: filterObj?.color ? `${filterObj.color}20` : '#fef3c7', 
                        borderRadius: '20px', 
                        fontSize: '0.8rem', 
                        color: filterObj?.color || '#92400e',
                        border: `1px solid ${filterObj?.color || '#fcd34d'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        {filterObj?.icon && <i className={`fas ${filterObj.icon}`} style={{ fontSize: '0.7rem' }}></i>}
                        {getBadgeLabel(filter)}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>No badges enabled</span>
              )}
            </div>

            {/* FAQs - Optional */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>FAQs</h4>
                <StatusBadge isRequired={false} isComplete={(formData.faqs || []).length > 0} />
              </div>
              {(formData.faqs || []).length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {(formData.faqs || []).slice(0, 3).map((faq, idx) => (
                    <div key={idx} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem', color: '#111827', marginBottom: '0.25rem' }}>
                        <i className="fas fa-question-circle" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>
                        {faq.question}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', paddingLeft: '1.5rem' }}>
                        {faq.answer?.length > 100 ? faq.answer.substring(0, 100) + '...' : faq.answer}
                      </div>
                    </div>
                  ))}
                  {(formData.faqs || []).length > 3 && (
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>+{(formData.faqs || []).length - 3} more FAQs</span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>No FAQs added</span>
              )}
            </div>

            {/* Google Reviews - Optional */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#111827' }}>Google Reviews</h4>
                <StatusBadge isRequired={false} isComplete={!!formData.googlePlaceId} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                  <path fill={formData.googlePlaceId ? '#4285F4' : '#9ca3af'} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill={formData.googlePlaceId ? '#34A853' : '#9ca3af'} d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill={formData.googlePlaceId ? '#FBBC05' : '#9ca3af'} d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill={formData.googlePlaceId ? '#EA4335' : '#9ca3af'} d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span style={{ color: formData.googlePlaceId ? '#16a34a' : '#9ca3af' }}>
                  {formData.googlePlaceId ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BecomeVendorPage;
