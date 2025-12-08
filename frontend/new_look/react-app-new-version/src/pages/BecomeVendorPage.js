import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config';
import { showBanner } from '../utils/helpers';
import { parseQueryParams, trackPageView } from '../utils/urlHelpers';
import SimpleWorkingLocationStep from '../components/SimpleWorkingLocationStep';
import SetupIncompleteBanner from '../components/SetupIncompleteBanner';
import './BecomeVendorPage.css';

// Google Maps API Key is imported from config.js

const BecomeVendorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, setCurrentUser } = useAuth();
  
  // Initialize to step 1 (welcome page) if user is logged in, unless there's a target step
  const getInitialStep = () => {
    if (!currentUser) return 0;
    
    // Check if we're returning from a save (stored in sessionStorage)
    const savedStep = sessionStorage.getItem('vendorOnboardingStep');
    if (savedStep) {
      sessionStorage.removeItem('vendorOnboardingStep'); // Clear it after reading
      return parseInt(savedStep);
    }
    
    // If coming from "Complete Profile Setup", always start at step 1
    if (location.state?.resetToFirst) return 1;
    // If there's a target step, we'll handle it in useEffect
    return 1;
  };
  
  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [loading, setLoading] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [existingVendorData, setExistingVendorData] = useState(null);
  const [isExistingVendor, setIsExistingVendor] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
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

  // Available categories - matching main page
  const availableCategories = [
    { id: 'Venue', name: 'Venues', icon: '🏛️', description: 'Event spaces and locations' },
    { id: 'Photography', name: 'Photo/Video', icon: '📸', description: 'Photography and videography' },
    { id: 'Music', name: 'Music/DJ', icon: '🎵', description: 'Music and DJ services' },
    { id: 'Catering', name: 'Catering', icon: '🍽️', description: 'Food and beverage services' },
    { id: 'Entertainment', name: 'Entertainment', icon: '🎭', description: 'Performers and entertainers' },
    { id: 'Experiences', name: 'Experiences', icon: '⭐', description: 'Unique event experiences' },
    { id: 'Decorations', name: 'Decorations', icon: '🎨', description: 'Event decorations and styling' },
    { id: 'Beauty', name: 'Beauty', icon: '💄', description: 'Hair, makeup, and beauty services' },
    { id: 'Cake', name: 'Cake', icon: '🎂', description: 'Wedding and event cakes' },
    { id: 'Transportation', name: 'Transportation', icon: '🚗', description: 'Event transportation services' },
    { id: 'Planning', name: 'Planners', icon: '📋', description: 'Event planning and coordination' },
    { id: 'Fashion', name: 'Fashion', icon: '👗', description: 'Wedding and event fashion' },
    { id: 'Stationery', name: 'Stationery', icon: '✉️', description: 'Invitations and stationery' }
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
      title: currentUser ? `Welcome, ${currentUser.name}!` : 'Welcome to PlanHive',
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
      title: 'How can clients reach you?',
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
      id: 'business-hours',
      title: 'When are you available?',
      subtitle: 'Set your business hours',
      component: BusinessHoursStep,
      required: false,
      skippable: true
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
      required: false,
      skippable: true
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
      required: false,
      skippable: true
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
      title: 'Set your policies and answer common questions',
      subtitle: 'Help clients understand your terms and conditions',
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

  useEffect(() => {
    if (currentUser && formData.email === '') {
      setFormData(prev => ({ ...prev, email: currentUser.email }));
    }
  }, [currentUser]);

  // Fetch existing vendor profile data if user is already a vendor
  useEffect(() => {
    const fetchExistingVendorData = async () => {
      console.log('🔍 Checking if should load vendor data...');
      console.log('currentUser:', currentUser);
      console.log('currentUser.isVendor:', currentUser?.isVendor);
      console.log('currentUser.vendorProfileId:', currentUser?.vendorProfileId);
      
      if (!currentUser || !currentUser.isVendor || !currentUser.vendorProfileId) {
        console.log('❌ Not loading vendor data - conditions not met');
        return;
      }

      try {
        setLoadingProfile(true);
        console.log('✅ Fetching existing vendor profile for user:', currentUser.id);

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
          console.log('Existing vendor data loaded:', result.data);
          setExistingVendorData(result.data);
          setIsExistingVendor(true);

          // Pre-populate form with existing data
          const profile = result.data.profile;
          const categories = result.data.categories || [];
          const services = result.data.services || [];
          const businessHours = result.data.businessHours || [];
          const serviceAreas = result.data.serviceAreas || [];
          const socialMedia = result.data.socialMedia?.[0] || {};
          const images = result.data.images || [];
          const selectedFeatures = result.data.selectedFeatures || [];

          console.log('📋 Selected features from database:', selectedFeatures);

          // Map business hours from database format to form format
          const hoursMap = {};
          businessHours.forEach(hour => {
            const day = hour.DayOfWeek?.toLowerCase();
            if (day) {
              hoursMap[day] = {
                isAvailable: hour.IsAvailable || false,
                openTime: hour.OpenTime || '09:00',
                closeTime: hour.CloseTime || '17:00'
              };
            }
          });

          // Extract primary and additional categories
          console.log('📂 Categories from database:', categories);
          
          // Use 'Category' property instead of 'CategoryName'
          const primaryCat = categories.find(c => c.IsPrimary)?.Category || categories[0]?.Category || '';
          const additionalCats = categories.filter(c => !c.IsPrimary).map(c => c.Category);
          console.log('📂 Primary category:', primaryCat);
          console.log('📂 Additional categories:', additionalCats);

          // Map service areas to simple format
          const mappedServiceAreas = serviceAreas.map(area => ({
            id: area.VendorServiceAreaID,
            name: area.CityName,
            state: area.StateProvince,
            country: area.Country
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
            
            // Services
            selectedServices: services.map(s => ({
              id: s.VendorServiceID,
              categoryName: s.CategoryName,
              serviceName: s.ServiceName,
              description: s.ServiceDescription,
              price: s.Price,
              duration: s.DurationMinutes,
              maxAttendees: s.MaxAttendees
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
            
            // Social Media
            facebook: socialMedia.FacebookURL || '',
            instagram: socialMedia.InstagramURL || '',
            twitter: socialMedia.TwitterURL || '',
            linkedin: socialMedia.LinkedInURL || '',
            youtube: socialMedia.YouTubeURL || '',
            tiktok: socialMedia.TikTokURL || '',
            
            // Policies
            cancellationPolicy: profile.CancellationPolicy || '',
            depositPercentage: profile.DepositPercentage?.toString() || '',
            paymentTerms: profile.PaymentTerms || '',
            
            // Google Reviews
            googlePlaceId: profile.GooglePlaceId || ''
          };

          console.log('📝 Setting formData with loaded data:', updatedFormData);
          setFormData(updatedFormData);

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
  }, [currentUser]);

  // Handle navigation from SetupIncompleteBanner with targetStep (via URL param or state)
  useEffect(() => {
    // Check URL query parameter first (for new tab navigation)
    const urlParams = new URLSearchParams(location.search);
    const stepFromUrl = urlParams.get('step');
    
    // Check state (for same-tab navigation)
    const stepFromState = location.state?.targetStep;
    
    const targetStep = stepFromUrl || stepFromState;
    
    if (targetStep && steps.length > 0 && !location.state?.resetToFirst) {
      const targetStepIndex = steps.findIndex(s => s.id === targetStep);
      if (targetStepIndex !== -1) {
        console.log('Navigating to target step:', targetStep);
        setCurrentStep(targetStepIndex);
      }
      // Clear the state after using it (but keep URL param visible)
      if (stepFromState) {
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.search, location.state?.targetStep, steps]);
  
  // Update URL when step changes to keep it in sync
  useEffect(() => {
    if (steps.length > 0 && currentStep >= 0) {
      const currentStepId = steps[currentStep]?.id;
      if (currentStepId) {
        window.history.replaceState({}, document.title, `/become-a-vendor?step=${currentStepId}`);
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
      
      console.log('Sending save request to:', endpoint);
      console.log('Vendor data being saved:', JSON.stringify(vendorData, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(vendorData)
      });

      console.log('Save response status:', response.status);

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
      console.log('✅ Save successful! Result:', result);
      console.log('VendorProfileId:', result.vendorProfileId);
      
      // ALWAYS update currentUser with vendorProfileId (for both new and existing)
      if (result.vendorProfileId) {
        console.log('Updating currentUser with vendorProfileId:', result.vendorProfileId);
        
        setCurrentUser(prev => ({
          ...prev,
          vendorProfileId: result.vendorProfileId,
          isVendor: true
        }));
        setIsExistingVendor(true);
        
        // Update localStorage as well
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.vendorProfileId = result.vendorProfileId;
        storedUser.isVendor = true;
        localStorage.setItem('user', JSON.stringify(storedUser));
        
        console.log('Updated localStorage user:', storedUser);
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
  const isStepCompleted = (stepId) => {
    if (!isExistingVendor) return false;

    switch (stepId) {
      case 'account':
        return !!currentUser;
      case 'categories':
        return !!formData.primaryCategory;
      case 'business-details':
        return !!(formData.businessName && formData.displayName);
      case 'contact':
        return !!formData.businessPhone;
      case 'location':
        return !!(formData.city && formData.province && formData.serviceAreas.length > 0);
      case 'services':
        return formData.selectedServices.length > 0;
      case 'business-hours':
        return Object.values(formData.businessHours).some(h => h.isAvailable);
      case 'questionnaire':
        return formData.selectedFeatures.length > 0;
      case 'gallery':
        return formData.photoURLs.length > 0;
      case 'social-media':
        return !!(formData.facebook || formData.instagram || formData.twitter || formData.linkedin);
      case 'filters':
        return formData.selectedFilters.length > 0;
      case 'stripe':
        return !!formData.stripeConnected;
      case 'google-reviews':
        return !!formData.googlePlaceId;
      case 'policies':
        return !!(formData.cancellationPolicy || formData.depositPercentage || formData.paymentTerms || (formData.faqs && formData.faqs.length > 0));
      default:
        return false;
    }
  };

  const handleAccountCreated = (userData) => {
    // Update auth context
    setCurrentUser(userData);
    window.currentUser = userData;
    
    // If user is an existing vendor with a profile, stay on step 0 (welcome)
    // to let the useEffect fetch their data and show the progress indicators
    // This matches the behavior of "Complete Profile Setup" button
    if (userData.isVendor && userData.vendorProfileId) {
      console.log('Existing vendor logged in, staying on welcome step to load profile data');
      setCurrentStep(0);
      // The useEffect will fetch vendor data and show progress indicators
    } else {
      // New vendor - move to next step (categories)
      setCurrentStep(1);
    }
  };

  const handleNext = () => {
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
      
      setCurrentUser(prev => ({
        ...prev,
        isVendor: true,
        vendorProfileId: result.vendorProfileId || currentUser.vendorProfileId
      }));

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

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="become-vendor-page">
      <header className="become-vendor-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <img src="/planhive_logo.svg" alt="PlanHive" style={{ height: '50px', width: 'auto' }} />
          </div>
          <div className="header-actions">
            {isExistingVendor && (
              <span style={{ 
                marginRight: '1rem', 
                color: '#10b981', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fas fa-check-circle"></i>
                Editing Profile
              </span>
            )}
            <button className="btn-text" onClick={() => navigate('/')}>
              Exit
            </button>
          </div>
        </div>
      </header>

      <div className="progress-container">
        <div className="progress-bar" style={{ 
          width: `${progress}%`,
          background: '#5e72e4'
        }}></div>
      </div>

      <main className="become-vendor-main">
        {loadingProfile ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className={`step-container ${isTransitioning ? 'fade-out' : ''}`} key={currentStep}>
            <div className="step-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h1 className="step-title">{steps[currentStep].title}</h1>
                {isExistingVendor && currentStep > 0 && isStepCompleted(steps[currentStep].id) && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    <i className="fas fa-check-circle"></i>
                    Completed
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
              />
            </div>
          </div>
        )}
      </main>

      <footer className="become-vendor-footer">
        <div className="footer-content">
          <button
            className="btn-back"
            onClick={handleBack}
            disabled={currentStep === 0}
            style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
          >
            Back
          </button>
          
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {currentUser && currentStep > 0 && (
              <button
                className="btn-save"
                onClick={handleSaveProgress}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-small"></span>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save
                  </>
                )}
              </button>
            )}
            
            {steps[currentStep]?.skippable && (
              <button
                className="btn-skip"
                onClick={handleNext}
                disabled={loading}
              >
                Skip for now
              </button>
            )}
            
            <button
              className="btn-next"
              onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
              disabled={loading || (currentStep === 0 && !currentUser)}
            >
              {loading ? (
                <span className="spinner-small"></span>
              ) : currentStep === steps.length - 1 ? (
                isExistingVendor ? 'Save Changes' : 'Complete Setup'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// STEP COMPONENTS BELOW
// Due to file size, I'll add these as inline components

function AccountStep({ currentUser, setFormData, formData, onAccountCreated, isExistingVendor, steps, isStepCompleted, setCurrentStep }) {
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
    return (
      <div className="account-step">
        <div style={{ padding: '2rem 1rem' }}>

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
              maxWidth="900px"
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
            Welcome to PlanHive
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
                    boxSizing: 'border-box',
                    background: '#FFFEF0'
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
                    boxSizing: 'border-box',
                    background: '#FFFEF0'
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
                  backgroundColor: '#5B68F4',
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
                    color: '#5B68F4', 
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
                    boxSizing: 'border-box',
                    background: '#FFFEF0'
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
                    boxSizing: 'border-box',
                    background: '#FFFEF0'
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
                  backgroundColor: '#5B68F4',
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
                    color: '#5B68F4', 
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
                By signing up, you agree to our <a href="#" style={{ color: '#5B68F4' }}>Terms of Service</a> and <a href="#" style={{ color: '#5B68F4' }}>Privacy Policy</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoriesStep({ formData, onInputChange, categories }) {
  // Add logging to debug category loading
  console.log('📋 CategoriesStep - formData.primaryCategory:', formData.primaryCategory);
  console.log('📋 CategoriesStep - formData.additionalCategories:', formData.additionalCategories);
  console.log('📋 CategoriesStep - Available categories:', categories.map(c => c.id));

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

  return (
    <div className="categories-step">
      <h3 style={{ marginBottom: '1.5rem', color: '#222', fontSize: '1.125rem', fontWeight: '600' }}>Primary Category *</h3>
      <div className="categories-grid">
        {categories.map(category => {
          const isSelected = formData.primaryCategory === category.id;
          console.log(`Category ${category.id}: isSelected=${isSelected}, formData.primaryCategory=${formData.primaryCategory}`);
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

      <h3 style={{ marginTop: '2.5rem', marginBottom: '1.5rem', color: '#222', fontSize: '1.125rem', fontWeight: '600' }}>Additional Categories (Optional)</h3>
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
    </div>
  );
}

// Remaining Step Components

function BusinessDetailsStep({ formData, onInputChange }) {
  const [logoPreview, setLogoPreview] = useState(formData.profileLogo || '');

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        onInputChange('profileLogo', reader.result);
      };
      reader.readAsDataURL(file);
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
          {logoPreview && (
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              overflow: 'hidden',
              border: '2px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f9fafb'
            }}>
              <img 
                src={logoPreview} 
                alt="Logo preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Business Name *</label>
        <input
          type="text"
          value={formData.businessName}
          onChange={(e) => onInputChange('businessName', e.target.value)}
          className="form-input"
          placeholder="e.g., Elegant Events Catering"
        />
      </div>

      <div className="form-group">
        <label>Display Name *</label>
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
        <label>Business Phone *</label>
        <input
          type="tel"
          value={formData.businessPhone}
          onChange={(e) => onInputChange('businessPhone', e.target.value)}
          className="form-input"
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="form-group">
        <label>Email</label>
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
        console.log('✅ Google Maps ready, initializing autocomplete...');
        // Add small delay to ensure DOM elements are ready
        setTimeout(() => {
          initializeGoogleMaps();
        }, 100);
      } else {
        console.log('⏳ Google Maps not ready yet, retrying in 200ms...');
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
    console.log('🎉 Google Maps API loaded successfully!');
    console.log('🔍 LocationStep: Checking Google Maps...', {
      hasGoogle: !!window.google,
      hasMaps: !!window.google?.maps,
      hasPlaces: !!window.google?.maps?.places,
      hasAddressInput: !!addressInputRef.current,
      hasServiceAreaInput: !!serviceAreaInputRef.current
    });

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
      console.log('✅ Creating address autocomplete for:', addressInputRef.current);
      
      addressAutocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'ca' }
      });
      
      addressAutocompleteRef.current.addListener('place_changed', function() {
        const place = addressAutocompleteRef.current.getPlace();
        console.log('🎯 Address selected:', place);
        
        if (place.address_components) {
          const comps = place.address_components;
          const pick = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
          
          const streetNumber = pick('street_number');
          const route = pick('route');
          const fullAddress = streetNumber && route ? `${streetNumber} ${route}` : place.formatted_address;
          
          console.log('📋 Extracted address data:', {
            fullAddress,
            city: pick('locality') || pick('sublocality'),
            province: pick('administrative_area_level_1'),
            postalCode: pick('postal_code')
          });
          
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
          
          console.log('✅ Address fields updated in React state!');
        }
      });
      
      console.log('✅ Address autocomplete initialized');
    } catch (error) {
      console.error('❌ Error initializing address autocomplete:', error);
    }
    
    // Service Area Autocomplete - EXACT COPY FROM WORKING TEST PAGE
    if (serviceAreaInputRef.current) {
      try {
        console.log('✅ Creating city autocomplete for:', serviceAreaInputRef.current);
        
        serviceAreaAutocompleteRef.current = new window.google.maps.places.Autocomplete(serviceAreaInputRef.current, {
          types: ['(cities)'],
          componentRestrictions: { country: 'ca' }
        });
        
        serviceAreaAutocompleteRef.current.addListener('place_changed', function() {
          const place = serviceAreaAutocompleteRef.current.getPlace();
          console.log('🎯 City selected:', place);
          
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
              console.log('✅ Added service area:', areaToAdd);
            }
            
            if (serviceAreaInputRef.current) {
              serviceAreaInputRef.current.value = '';
            }
          }
        });
        
        console.log('✅ City autocomplete initialized');
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
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
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
                backgroundColor: '#6366f1',
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
              onMouseOver={(e) => e.target.style.backgroundColor = '#4f46e5'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
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
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #3b82f6',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    color: '#1e40af'
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

  useEffect(() => {
    console.log('🔄 ServicesStep useEffect triggered');
    console.log('🔄 Primary category:', formData.primaryCategory);
    console.log('🔄 Additional categories:', formData.additionalCategories);
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

  const loadServices = async () => {
    try {
      setLoading(true);
      const allCategories = [formData.primaryCategory, ...formData.additionalCategories].filter(Boolean);
      
      console.log('ServicesStep - Loading services for categories:', allCategories);
      console.log('ServicesStep - formData.primaryCategory:', formData.primaryCategory);
      console.log('ServicesStep - formData.additionalCategories:', formData.additionalCategories);
      
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
        allCategories.forEach(category => {
          if (servicesByCategory[category]) {
            console.log(`Found ${servicesByCategory[category].length} services for category: ${category}`);
            servicesByCategory[category].forEach(service => {
              filteredServices.push({ ...service, category });
            });
          } else {
            console.warn(`No services found for category: ${category}`);
          }
        });
        
        console.log('ServicesStep - Total filtered services:', filteredServices.length);
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

  const filteredServices = availableServices.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !formData.selectedServices.some(s => s.serviceId === service.id)
  );

  if (loading) {
    return <div className="loading">Loading services...</div>;
  }

  return (
    <div className="services-step">
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <i className="fas fa-info-circle" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}></i>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Select Your Services</h3>
        </div>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Select the services you offer and set your pricing. You can add more services later.
        </p>
      </div>

      {/* Selected Services List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', width: '100%' }}>
        {formData.selectedServices.map((service, index) => {
          const isEditing = editingServiceId === service.serviceId;
          
          const getCategoryIcon = () => {
            const catLower = (service.category || '').toLowerCase();
            const nameLower = (service.serviceName || '').toLowerCase();
            
            if (catLower.includes('photo') || nameLower.includes('photo')) return 'fa-camera';
            if (catLower.includes('video') || nameLower.includes('video')) return 'fa-video';
            if (catLower.includes('music') || catLower.includes('dj') || nameLower.includes('music') || nameLower.includes('dj')) return 'fa-music';
            if (catLower.includes('cater') || nameLower.includes('food') || nameLower.includes('cater')) return 'fa-utensils';
            if (catLower.includes('venue') || nameLower.includes('venue') || nameLower.includes('space')) return 'fa-building';
            if (catLower.includes('decor') || catLower.includes('floral') || nameLower.includes('decor') || nameLower.includes('flower')) return 'fa-leaf';
            if (catLower.includes('entertainment') || nameLower.includes('perform')) return 'fa-masks-theater';
            if (catLower.includes('transport') || nameLower.includes('transport')) return 'fa-car';
            if (catLower.includes('beauty') || catLower.includes('wellness') || nameLower.includes('makeup') || nameLower.includes('spa')) return 'fa-spa';
            return 'fa-concierge-bell';
          };
          
          const getPricingDisplay = () => {
            if (service.pricingModel === 'hourly' && service.baseRate) {
              return `$${parseFloat(service.baseRate).toFixed(0)} base + $${parseFloat(service.overtimeRate || 0).toFixed(0)}/hr overtime`;
            } else if (service.pricingModel === 'fixed' && service.baseRate) {
              return `$${parseFloat(service.baseRate).toFixed(0)} fixed`;
            } else if (service.pricingModel === 'per_person' && service.baseRate) {
              return `$${parseFloat(service.baseRate).toFixed(0)}/person`;
            }
            return 'Not configured';
          };
          
          return (
            <React.Fragment key={`service-${service.serviceId}-${index}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  flex: 1,
                  padding: '1.25rem', 
                  background: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px',
                  position: 'relative'
                }}>
                  {/* Pricing positioned at top right - matching vendor profile */}
                  <div style={{ 
                    position: 'absolute',
                    top: '1.25rem',
                    right: '1.25rem',
                    textAlign: 'right', 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.25rem'
                  }}>
                    <div style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 700, 
                      color: '#111827',
                      lineHeight: '1'
                    }}>
                      {service.baseRate ? `$${parseFloat(service.baseRate).toFixed(0)}` : '$0'}
                    </div>
                    <div style={{ 
                      fontSize: '0.625rem', 
                      color: '#9ca3af',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      lineHeight: '1'
                    }}>
                      {service.pricingModel === 'hourly' ? 'BASE PRICE' : service.pricingModel === 'fixed' ? 'FIXED PRICE' : 'PER PERSON'}
                    </div>
                    {service.pricingModel === 'hourly' && service.overtimeRate && (
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: '#111827',
                        lineHeight: '1',
                        marginTop: '0.25rem'
                      }}>
                        ${parseFloat(service.overtimeRate).toFixed(0)} <span style={{ 
                          fontSize: '0.75rem', 
                          color: '#9ca3af',
                          fontWeight: 400
                        }}>/hr overtime</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {/* Service Icon */}
                    <div style={{
                      flexShrink: 0,
                      width: '60px',
                      height: '60px',
                      borderRadius: '10px',
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className={`fas ${getCategoryIcon()}`} style={{ color: '#5e72e4', fontSize: '1.5rem' }}></i>
                    </div>
                    
                    {/* Service Details */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '120px' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0' }}>
                        {service.serviceName}
                      </h3>
                      
                      {/* Metadata row - all on same line */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        fontSize: '0.875rem', 
                        color: '#6b7280',
                        marginBottom: service.description ? '0.75rem' : 0,
                        flexWrap: 'wrap',
                        alignItems: 'center'
                      }}>
                        {service.category && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <i className="fas fa-tag"></i>
                            {service.category}
                          </span>
                        )}
                        {service.baseDuration && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <i className="fas fa-clock"></i>
                            {service.baseDuration >= 1 
                              ? Math.floor(service.baseDuration) + 'h' + (service.baseDuration % 1 > 0 ? ' ' + Math.round((service.baseDuration % 1) * 60) + 'm' : '')
                              : (service.baseDuration * 60) + 'm'}
                          </span>
                        )}
                      </div>
                      
                      {service.description && (
                        <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: '1.6', margin: 0 }}>
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons - Outside card on the right */}
                <div style={{ 
                  display: 'flex', 
                  gap: '0.375rem',
                  flexShrink: 0
                }}>
                  <button
                    type="button"
                    onClick={() => handleEditService(service)}
                    title="Edit"
                    style={{ 
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'white',
                      color: '#5e72e4',
                      border: '1.5px solid #5e72e4',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#5e72e4';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#5e72e4';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(service.serviceId)}
                    title="Remove"
                    style={{ 
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'white',
                      color: '#dc2626',
                      border: '1.5px solid #dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#dc2626';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

            </React.Fragment>
          );
        })}
      </div>

      {/* Add Service Button */}
      <button
        type="button"
        className="btn-add-service"
        onClick={() => setShowModal(true)}
      >
        + Add Service
      </button>

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

      {/* Edit Service Modal */}
      {showEditModal && editingService && (
        <div className="service-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="service-modal" onClick={(e) => e.stopPropagation()}>
            <div className="service-modal-header">
              <h3>Edit Service: {editingService.serviceName}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className="service-modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Pricing Model</label>
                  <select
                    value={editingService.pricingModel || 'hourly'}
                    onChange={(e) => handleEditModalUpdate('pricingModel', e.target.value)}
                    className="form-input"
                  >
                    <option value="hourly">Hourly Rate</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="per_person">Per Person</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Base Duration (hours)</label>
                  <input
                    type="number"
                    value={editingService.baseDuration || ''}
                    onChange={(e) => handleEditModalUpdate('baseDuration', e.target.value)}
                    className="form-input"
                    placeholder="2"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Base Rate ($)</label>
                  <input
                    type="number"
                    value={editingService.baseRate || ''}
                    onChange={(e) => handleEditModalUpdate('baseRate', e.target.value)}
                    className="form-input"
                    placeholder="100"
                    min="0"
                    step="1"
                  />
                </div>
                <div className="form-group">
                  <label>Overtime Rate ($/hr)</label>
                  <input
                    type="number"
                    value={editingService.overtimeRate || ''}
                    onChange={(e) => handleEditModalUpdate('overtimeRate', e.target.value)}
                    className="form-input"
                    placeholder="100"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingService.description || ''}
                  onChange={(e) => handleEditModalUpdate('description', e.target.value)}
                  className="form-textarea"
                  rows="3"
                  placeholder="Describe what's included in this service..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveEditedService}
                >
                  Save Changes
                </button>
              </div>
            </div>
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

  // Common timezones
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Toronto',
    'America/Vancouver',
    'America/Edmonton',
    'America/Winnipeg',
    'America/Halifax',
    'America/St_Johns',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];

  const handleHourChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-info-circle" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Set Your Regular Hours</h3>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
            These hours will be displayed on your public profile. You can still accept bookings outside these hours by arrangement.
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
              cursor: 'pointer'
            }}
          >
            <option value="">Select timezone...</option>
            {timezones.map(tz => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem', marginBottom: 0 }}>
            This timezone will be displayed to customers viewing your profile
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {daysOfWeek.map(day => (
            <div
              key={day.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: '1rem',
                alignItems: 'center',
                padding: '1.25rem',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                background: formData.businessHours[day.key]?.isAvailable === false ? '#f9fafb' : 'white',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{day.label}</div>
              
              {formData.businessHours[day.key]?.isAvailable !== false ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500 }}>Open:</label>
                    <input
                      type="time"
                      value={formData.businessHours[day.key]?.openTime || '09:00'}
                      onChange={(e) => handleHourChange(day.key, 'openTime', e.target.value)}
                      style={{ 
                        padding: '0.5rem', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>-</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500 }}>Close:</label>
                    <input
                      type="time"
                      value={formData.businessHours[day.key]?.closeTime || '17:00'}
                      onChange={(e) => handleHourChange(day.key, 'closeTime', e.target.value)}
                      style={{ 
                        padding: '0.5rem', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.95rem' }}>
                  Closed
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={formData.businessHours[day.key]?.isAvailable === false}
                  onChange={() => handleToggleClosed(day.key)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Closed</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Questionnaire Step - Full Implementation (uses dedicated API like dashboard)
function QuestionnaireStep({ formData, setFormData, currentUser }) {
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
      const response = await fetch(`${API_BASE_URL}/vendor-features/all-grouped`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
      
      // Load vendor's existing selections if vendorProfileId exists
      if (currentUser?.vendorProfileId) {
        const selectionsResponse = await fetch(`${API_BASE_URL}/vendor-features/vendor/${currentUser.vendorProfileId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (selectionsResponse.ok) {
          const selectionsData = await selectionsResponse.json();
          const selectedIds = new Set(
            selectionsData.selectedFeatures?.map(f => f.FeatureID) || []
          );
          setSelectedFeatureIds(selectedIds);
          // Also update formData
          setFormData(prev => ({ ...prev, selectedFeatures: Array.from(selectedIds) }));
          console.log('Loaded selected features:', selectedIds.size);
        }
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatureSelection = (featureId) => {
    setSelectedFeatureIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      // Update formData as well
      setFormData(prevData => ({ ...prevData, selectedFeatures: Array.from(newSet) }));
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
      const response = await fetch(`${API_BASE_URL}/vendor-features/vendor/${currentUser.vendorProfileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          featureIds: Array.from(selectedFeatureIds)
        })
      });
      
      if (response.ok) {
        showBanner('Features saved successfully!', 'success');
      } else {
        throw new Error('Failed to save features');
      }
    } catch (error) {
      console.error('Error saving features:', error);
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

  const getFilteredCategories = () => {
    const vendorCategories = [formData.primaryCategory, ...(formData.additionalCategories || [])].filter(Boolean);
    
    if (vendorCategories.length === 0) {
      return categories.filter(cat => !cat.applicableVendorCategories || cat.applicableVendorCategories === 'all');
    }
    
    return categories.filter(category => {
      if (!category.applicableVendorCategories) return true;
      if (category.applicableVendorCategories === 'all') return true;
      
      const applicableList = category.applicableVendorCategories.split(',').map(c => c.trim().toLowerCase());
      return vendorCategories.some(vendorCat => applicableList.includes(vendorCat.toLowerCase()));
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
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
                            onClick={() => toggleFeatureSelection(feature.featureID)}
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
                                color: isSelected ? 'var(--primary)' : '#6366f1', 
                                fontSize: '1.25rem', 
                                flexShrink: 0,
                                width: '24px',
                                textAlign: 'center'
                              }}
                            ></i>
                            <span style={{ 
                              fontSize: '0.9375rem', 
                              color: '#374151', 
                              flex: 1, 
                              fontWeight: isSelected ? 600 : 500,
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

        {filteredCategories.length > 0 && (
          <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', background: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.95rem' }}>
              <i className="fas fa-check-circle" style={{ color: 'var(--primary)' }}></i>
              <span><strong>{selectedFeatureIds.size}</strong> features selected</span>
            </div>
            {currentUser?.vendorProfileId && (
              <button
                onClick={handleSaveFeatures}
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
              >
                {saving ? 'Saving...' : 'Save Features'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Gallery Step - Full Implementation (uses dedicated API like dashboard)
function GalleryStep({ formData, setFormData, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Load existing photos
  useEffect(() => {
    if (currentUser?.vendorProfileId) {
      loadPhotos();
    } else {
      setLoading(false);
    }
  }, [currentUser?.vendorProfileId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const images = Array.isArray(data) ? data : [];
        setPhotos(images.map(img => ({
          id: img.id || img.ImageID,
          url: img.url || img.ImageURL,
          caption: img.caption || img.Caption,
          isPrimary: img.isPrimary || img.IsPrimary
        })));
        // Also update formData
        setFormData(prev => ({
          ...prev,
          photoURLs: images.map(img => img.url || img.ImageURL)
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
      const fileURLs = files.map(file => URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        photoURLs: [...(prev.photoURLs || []), ...fileURLs]
      }));
      showBanner('Photos added! They will be saved when you complete your profile.', 'success');
      return;
    }

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      files.forEach(file => formDataUpload.append('images', file));

      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataUpload
      });

      if (response.ok) {
        showBanner('Photos uploaded successfully!', 'success');
        loadPhotos();
      } else {
        throw new Error('Upload failed');
      }
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
      // If no vendorProfileId, just store locally
      setFormData(prev => ({
        ...prev,
        photoURLs: [...(prev.photoURLs || []), urlInput.trim()]
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
      // Fallback to local storage
      setFormData(prev => ({
        ...prev,
        photoURLs: [...(prev.photoURLs || []), urlInput.trim()]
      }));
      setUrlInput('');
      showBanner('Photo added locally. It will be saved when you complete your profile.', 'success');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId, index) => {
    if (!currentUser?.vendorProfileId || !photoId) {
      // Local delete
      setFormData(prev => ({
        ...prev,
        photoURLs: prev.photoURLs.filter((_, i) => i !== index)
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

  // Use photos from API if available, otherwise use formData
  const displayPhotos = photos.length > 0 ? photos : (formData.photoURLs || []).map((url, i) => ({ id: null, url, index: i }));

  return (
    <div className="gallery-step">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-images" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Showcase Your Work</h3>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Add photos to showcase your work and attract more clients. You can upload files or add images by URL.
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

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <div className="spinner"></div>
          </div>
        )}

        {/* Photo Grid */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {displayPhotos.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
                <i className="fas fa-images" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
                <p style={{ color: 'var(--text-light)', margin: 0 }}>No photos added yet</p>
              </div>
            ) : (
              displayPhotos.map((photo, index) => (
                <div
                  key={photo.id || index}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    background: '#f3f4f6'
                  }}
                >
                  <img
                    src={photo.url}
                    alt={`Gallery ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af"><i class="fas fa-image" style="font-size:2rem"></i></div>';
                    }}
                  />
                  {photo.isPrimary && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      left: '0.5rem',
                      background: 'var(--primary)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      Primary
                    </div>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(photo.id, index)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px'
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Upload Controls */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* File Upload */}
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-upload"></i> Upload Photos
            </h4>
            <input
              type="file"
              id="photo-upload-input"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-outline"
              onClick={() => document.getElementById('photo-upload-input').click()}
              disabled={uploading}
              style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
            >
              {uploading ? (
                <>
                  <span className="spinner-small"></span> Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-upload-alt"></i> Choose Files
                </>
              )}
            </button>
          </div>

          {/* URL Input */}
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-link"></i> Add Image by URL
            </h4>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
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
                    handleAddPhotoByUrl();
                  }
                }}
              />
              <button
                className="btn btn-primary"
                onClick={handleAddPhotoByUrl}
                style={{ padding: '0.875rem 1.5rem' }}
              >
                <i className="fas fa-plus"></i> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Social Media Step - Full Implementation
function SocialMediaStep({ formData, onInputChange }) {
  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', icon: 'fab fa-facebook', color: '#1877F2', prefix: 'facebook.com/' },
    { key: 'instagram', label: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F', prefix: 'instagram.com/' },
    { key: 'twitter', label: 'X (Twitter)', icon: 'fab fa-x-twitter', color: '#000000', prefix: 'x.com/' },
    { key: 'linkedin', label: 'LinkedIn', icon: 'fab fa-linkedin', color: '#0077B5', prefix: 'linkedin.com/in/' },
    { key: 'youtube', label: 'YouTube', icon: 'fab fa-youtube', color: '#FF0000', prefix: 'youtube.com/' },
    { key: 'tiktok', label: 'TikTok', icon: 'fab fa-tiktok', color: '#000000', prefix: 'tiktok.com/@' }
  ];

  return (
    <div className="social-media-step">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                  value={formData[platform.key] || ''}
                  onChange={(e) => onInputChange(platform.key, e.target.value)}
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
      console.error('Error loading filters:', error);
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.95rem' }}>
            <i className="fas fa-check-circle" style={{ color: 'var(--primary)' }}></i>
            <span><strong>{selectedFilters.length}</strong> badges selected</span>
          </div>
          {currentUser?.vendorProfileId && (
            <button
              onClick={handleSaveFilters}
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
            >
              {saving ? 'Saving...' : 'Save Filters'}
            </button>
          )}
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
        console.log('Stripe status:', data);
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
        console.log('Stripe onboard response:', data);
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                  gap: '0.75rem',
                  padding: '0.875rem 1.5rem',
                  fontSize: '1rem',
                  background: stripeStatus.connected ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'linear-gradient(135deg, #635bff 0%, #5469d4 100%)',
                  border: 'none',
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
                    <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                      {stripeStatus.detailsSubmitted ? '✓ Yes' : '✗ No'}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                      Charges Enabled
                    </label>
                    <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                      {stripeStatus.chargesEnabled ? '✓ Yes' : '✗ No'}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                      Payouts Enabled
                    </label>
                    <div style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                      {stripeStatus.payoutsEnabled ? '✓ Yes' : '✗ No'}
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

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fef3c7', borderRadius: '12px', border: '2px solid #fbbf24' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <i className="fas fa-info-circle" style={{ color: '#d97706', fontSize: '1.25rem', flexShrink: 0 }}></i>
            <div style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: 1.6 }}>
              <strong>Note:</strong> You can skip this step for now and set up Stripe later from your dashboard. However, connecting Stripe is required to accept online payments from clients.
            </div>
          </div>
        </div>
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
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc05 75%, #ea4335 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>
              Google Reviews Integration
            </h4>
            <p style={{ margin: '0 0 2rem', color: '#6b7280', fontSize: '1rem', lineHeight: 1.6, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              Showcase your Google Business reviews to build trust with potential clients. Your star rating and recent reviews will be displayed on your profile.
            </p>
          </div>

          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '1rem', color: '#374151' }}>
              Google Place ID
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                placeholder="Enter your Google Place ID"
                value={googlePlaceId}
                onChange={(e) => setGooglePlaceId(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.875rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              <button
                onClick={handleVerifyGooglePlace}
                disabled={verifying || !googlePlaceId.trim()}
                className="btn btn-primary"
                style={{ minWidth: '120px', padding: '0.875rem 1.5rem' }}
              >
                {verifying ? (
                  <span className="spinner-small"></span>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Verify
                  </>
                )}
              </button>
            </div>
            <small style={{ display: 'block', color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                <i className="fas fa-external-link-alt" style={{ marginRight: '0.5rem' }}></i>
                How to find your Google Place ID
              </a>
            </small>

            {verificationStatus === 'success' && (
              <div style={{ padding: '1rem 1.5rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fas fa-check-circle" style={{ color: '#16a34a', fontSize: '1.25rem' }}></i>
                <span style={{ color: '#15803d', fontSize: '1rem', fontWeight: 500 }}>Google reviews connected successfully!</span>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div style={{ padding: '1rem 1.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fas fa-exclamation-circle" style={{ color: '#dc2626', fontSize: '1.25rem' }}></i>
                <span style={{ color: '#991b1b', fontSize: '1rem', fontWeight: 500 }}>Invalid Place ID. Please check and try again.</span>
              </div>
            )}

            {/* Preview Section */}
            {previewData && verificationStatus === 'success' && (
              <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <img 
                    src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" 
                    alt="Google" 
                    style={{ width: '32px', height: '32px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>Google Reviews Preview</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Verified business reviews</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                    {(previewData.rating || 0).toFixed(1)}
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', color: '#fbbc04', marginBottom: '0.125rem' }}>
                      {'★'.repeat(Math.round(previewData.rating || 0))}{'☆'.repeat(5 - Math.round(previewData.rating || 0))}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Based on {(previewData.user_ratings_total || 0).toLocaleString()} reviews
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            {currentUser?.vendorProfileId && (
              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={handleSaveGoogleReviews}
                  disabled={saving || (googlePlaceId && verificationStatus !== 'success')}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 2rem' }}
                >
                  {saving ? 'Saving...' : 'Save Google Reviews Settings'}
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
              Benefits of connecting Google Reviews:
            </h5>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.8 }}>
              <li>Build trust with potential clients through authentic reviews</li>
              <li>Display your star rating prominently on your profile</li>
              <li>Showcase recent customer feedback automatically</li>
              <li>Improve your visibility in search results</li>
              <li>Stand out from competitors without reviews</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fef3c7', borderRadius: '12px', border: '2px solid #fbbf24' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <i className="fas fa-info-circle" style={{ color: '#d97706', fontSize: '1.25rem', flexShrink: 0 }}></i>
            <div style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: 1.6 }}>
              <strong>Note:</strong> You can skip this step for now and set up Google Reviews later from your dashboard. However, displaying reviews helps build trust and credibility with potential clients.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Policies Step - Full Implementation (uses dedicated API like dashboard)
function PoliciesStep({ formData, onInputChange, setFormData, currentUser }) {
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [savingFaq, setSavingFaq] = useState(false);

  // Load existing FAQs
  useEffect(() => {
    if (currentUser?.vendorProfileId) {
      loadFAQs();
    } else {
      setLoading(false);
    }
  }, [currentUser?.vendorProfileId]);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/faqs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const faqsArray = Array.isArray(data) ? data : (data.faqs || []);
        setFaqs(faqsArray.map(faq => ({
          id: faq.id || faq.FAQID,
          question: faq.question || faq.Question,
          answer: faq.answer || faq.Answer
        })));
        // Also update formData
        setFormData(prev => ({
          ...prev,
          faqs: faqsArray.map(faq => ({
            id: faq.id || faq.FAQID,
            question: faq.question || faq.Question,
            answer: faq.answer || faq.Answer
          }))
        }));
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaq = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      showBanner('Please fill in both question and answer', 'error');
      return;
    }

    if (!currentUser?.vendorProfileId) {
      // Store locally if no vendorProfileId
      const newFaqWithId = { ...newFaq, id: Date.now() };
      setFaqs(prev => [...prev, newFaqWithId]);
      setFormData(prev => ({
        ...prev,
        faqs: [...(prev.faqs || []), newFaqWithId]
      }));
      setNewFaq({ question: '', answer: '' });
      showBanner('FAQ added! It will be saved when you complete your profile.', 'success');
      return;
    }

    setSavingFaq(true);
    try {
      // Get existing FAQs and add new one
      const updatedFaqs = [...faqs, { question: newFaq.question, answer: newFaq.answer }];
      
      const response = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ faqs: updatedFaqs })
      });

      if (response.ok) {
        showBanner('FAQ added successfully!', 'success');
        setNewFaq({ question: '', answer: '' });
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
      // Local delete
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

  // Use faqs from API if available, otherwise use formData
  const displayFaqs = faqs.length > 0 ? faqs : (formData.faqs || []);

  return (
    <div className="policies-step">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-file-contract" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Set Your Policies</h3>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Define your business policies and answer common questions to help clients understand your terms.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Cancellation Policy */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '1rem' }}>
              <i className="fas fa-ban" style={{ color: 'var(--primary)', marginRight: '0.5rem' }}></i>
              Cancellation Policy
            </label>
            <textarea
              placeholder="Describe your cancellation policy (e.g., 'Full refund if cancelled 30 days before event...')"
              value={formData.cancellationPolicy || ''}
              onChange={(e) => onInputChange('cancellationPolicy', e.target.value)}
              rows="4"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.95rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Deposit & Payment */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '1rem' }}>
                  <i className="fas fa-percentage" style={{ color: 'var(--primary)', marginRight: '0.5rem' }}></i>
                  Deposit Percentage
                </label>
                <input
                  type="number"
                  placeholder="e.g., 25"
                  min="0"
                  max="100"
                  value={formData.depositPercentage || ''}
                  onChange={(e) => onInputChange('depositPercentage', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
                  Percentage of total cost required as deposit
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem', fontSize: '1rem' }}>
                  <i className="fas fa-credit-card" style={{ color: 'var(--primary)', marginRight: '0.5rem' }}></i>
                  Payment Terms
                </label>
                <textarea
                  placeholder="Describe your payment terms (e.g., '25% deposit required, balance due 7 days before event...')"
                  value={formData.paymentTerms || ''}
                  onChange={(e) => onInputChange('paymentTerms', e.target.value)}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-question-circle" style={{ color: 'var(--primary)' }}></i>
              Frequently Asked Questions
            </h4>

            {/* Loading State */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <div className="spinner"></div>
              </div>
            )}

            {/* Existing FAQs */}
            {!loading && displayFaqs.length > 0 && (
              <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>
                {displayFaqs.map((faq, index) => (
                  <div key={faq.id || index} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                        <span style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: 'var(--primary)', 
                          color: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          Q
                        </span>
                        <strong style={{ fontSize: '0.95rem' }}>{faq.question}</strong>
                      </div>
                      <button
                        onClick={() => handleDeleteFaq(faq.id, index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          fontSize: '1rem'
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    <div style={{ paddingLeft: '2rem', color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New FAQ */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
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
                    fontSize: '0.95rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Answer
                </label>
                <textarea
                  placeholder="Provide a detailed answer..."
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <button
                onClick={handleAddFaq}
                disabled={savingFaq || !newFaq.question.trim() || !newFaq.answer.trim()}
                className="btn btn-outline"
                style={{ justifySelf: 'start' }}
              >
                {savingFaq ? (
                  <><i className="fas fa-spinner fa-spin"></i> Adding...</>
                ) : (
                  <><i className="fas fa-plus"></i> Add FAQ</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Review Step - Full Implementation
function ReviewStep({ formData, categories }) {
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const allCategories = [formData.primaryCategory, ...(formData.additionalCategories || [])].filter(Boolean);

  return (
    <div className="review-step">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-check-circle" style={{ color: '#3b82f6', fontSize: '1.5rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Review Your Information</h3>
          </div>
          <p style={{ margin: 0, color: '#1e40af', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Please review your vendor profile information before submitting. You can always edit these details later from your dashboard.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Business Information */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <i className="fas fa-building"></i> Business Information
            </h4>
            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
              <div><strong>Business Name:</strong> {formData.businessName || 'Not provided'}</div>
              <div><strong>Display Name:</strong> {formData.displayName || 'Not provided'}</div>
              <div><strong>Categories:</strong> {allCategories.map(getCategoryName).join(', ') || 'Not selected'}</div>
              <div><strong>Description:</strong> {formData.businessDescription || 'Not provided'}</div>
              <div><strong>Years in Business:</strong> {formData.yearsInBusiness || 'Not provided'}</div>
            </div>
          </div>

          {/* Contact & Location */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <i className="fas fa-map-marker-alt"></i> Contact & Location
            </h4>
            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
              <div><strong>Email:</strong> {formData.email || 'Not provided'}</div>
              <div><strong>Phone:</strong> {formData.businessPhone || 'Not provided'}</div>
              <div><strong>Website:</strong> {formData.website || 'Not provided'}</div>
              <div><strong>Address:</strong> {formData.address || 'Not provided'}</div>
              <div><strong>City:</strong> {formData.city || 'Not provided'}</div>
              <div><strong>Province:</strong> {formData.province || 'Not provided'}</div>
              <div><strong>Service Areas:</strong> {(formData.serviceAreas || []).join(', ') || 'Not specified'}</div>
            </div>
          </div>

          {/* Additional Details */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <i className="fas fa-info-circle"></i> Additional Details
            </h4>
            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
              <div><strong>Features Selected:</strong> {(formData.selectedFeatures || []).length} features</div>
              <div><strong>Photos Added:</strong> {(formData.photoURLs || []).length} photos</div>
              <div><strong>Social Media:</strong> {Object.keys(formData).filter(k => ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'].includes(k) && formData[k]).length} platforms connected</div>
              <div><strong>Badges:</strong> {(formData.selectedFilters || []).length} badges enabled</div>
              <div><strong>FAQs:</strong> {(formData.faqs || []).length} questions added</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fef3c7', borderRadius: '12px', border: '2px solid #f59e0b' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <i className="fas fa-lightbulb" style={{ color: '#d97706', fontSize: '1.25rem', flexShrink: 0 }}></i>
            <div style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: 1.6 }}>
              <strong>Ready to go live?</strong> Click "Complete Setup" to create your vendor profile. You'll be redirected to your dashboard where you can manage your profile, view bookings, and connect with clients.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BecomeVendorPage;
