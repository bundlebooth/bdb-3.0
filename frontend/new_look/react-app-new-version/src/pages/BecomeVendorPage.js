import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config';
import { apiGet, apiPost, apiPut, apiPostFormData } from '../utils/api';
import { showBanner, formatDateTime } from '../utils/helpers';
import { parseQueryParams, trackPageView } from '../utils/urlHelpers';
import SimpleWorkingLocationStep from '../components/SimpleWorkingLocationStep';
import SetupIncompleteBanner from '../components/SetupIncompleteBanner';
import { ServiceCard, PackageCard, PackageServiceTabs, PackageServiceList } from '../components/PackageServiceCard';
import UniversalModal from '../components/UniversalModal';
import {
  AccountStep,
  CategoriesStep,
  BusinessDetailsStep,
  ContactStep,
  ServicesStep,
  CancellationPolicyStep,
  BusinessHoursStep,
  QuestionnaireStep,
  GalleryStep,
  SocialMediaStep,
  FiltersStep,
  StripeStep,
  GoogleReviewsStep,
  PoliciesStep,
  ReviewStep
} from '../components/VendorOnboarding';
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
  const [submittedAt, setSubmittedAt] = useState(null); // Timestamp when vendor submitted for review
  const [reviewedAt, setReviewedAt] = useState(null); // Timestamp when support reviewed
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
      title: currentUser ? `Welcome, ${currentUser.name}!` : 'Welcome to Planbeau',
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
          // Load timestamps for status display
          if (profile.SubmittedForReviewAt) {
            setSubmittedAt(profile.SubmittedForReviewAt);
          }
          if (profile.ReviewedAt) {
            setReviewedAt(profile.ReviewedAt);
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
            
            // Google Reviews - googlePlaceId is at top level of API response, not inside profile
            googlePlaceId: result.googlePlaceId || profile.GooglePlaceId || ''
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

          // Fetch Google Place ID from dedicated endpoint (more reliable than profile API)
          try {
            const googleRes = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/google-reviews-settings`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (googleRes.ok) {
              const googleData = await googleRes.json();
              updatedFormData.googlePlaceId = googleData.GooglePlaceId || '';
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
            // Extract just the IDs - features may be objects {id, name} or just numbers
            const featureIdsOnly = formData.selectedFeatures.map(f => 
              typeof f === 'object' ? f.id : f
            ).filter(id => id != null);
            
            const featuresResponse = await fetch(`${API_BASE_URL}/vendors/features/vendor/${vendorProfileId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ featureIds: featureIdsOnly })
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
        // OPTIONAL (temporarily bypassed): Stripe connection not required for submission
        return true;
      case 'google-reviews':
        // Optional - Google reviews
        return !!(formData.googlePlaceId && formData.googlePlaceId.trim().length > 0);
      case 'policies':
        // Optional - FAQs
        return !!(formData.faqs && formData.faqs.length > 0);
      case 'cancellation-policy':
        // Optional - cancellation policy
        return !!(formData.cancellationPolicy);
      case 'review':
        // Review step is always complete (it's just a summary view)
        return true;
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
          // Extract just the IDs - features may be objects {id, name} or just numbers
          const featureIdsOnly = currentFeatures.map(f => 
            typeof f === 'object' ? f.id : f
          ).filter(id => id != null);
          
          const featuresResponse = await fetch(`${API_BASE_URL}/vendors/features/vendor/${vendorProfileId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ featureIds: featureIdsOnly })
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
            <img src="/images/logo.png" alt="Planbeau" style={{ height: '50px', width: 'auto' }} />
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
                {/* Completed badge - only show green checkmark circle */}
                {isExistingVendor && currentStep > 0 && isStepCompleted(steps[currentStep].id) && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    fontSize: '1.1rem'
                  }}>
                    <i className="fas fa-check-circle"></i>
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
                submittedAt={submittedAt}
                reviewedAt={reviewedAt}
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

export default BecomeVendorPage;
