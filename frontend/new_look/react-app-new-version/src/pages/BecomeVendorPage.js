import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config';
import { showBanner } from '../utils/helpers';
import SimpleWorkingLocationStep from '../components/SimpleWorkingLocationStep';
import './BecomeVendorPage.css';

// Google Maps API Key is imported from config.js

const BecomeVendorPage = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(currentUser ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
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
    faqs: []
  });

  // Available categories - matching database
  const availableCategories = [
    { id: 'Venue', name: 'Venue', icon: '🏛️', description: 'Event spaces and locations' },
    { id: 'Catering', name: 'Catering', icon: '🍽️', description: 'Food and beverage services' },
    { id: 'Photography', name: 'Photography', icon: '📸', description: 'Photography and videography' },
    { id: 'Music', name: 'Music/DJ', icon: '🎵', description: 'Music and entertainment' },
    { id: 'Decorations', name: 'Decorations', icon: '🎨', description: 'Event decorations and styling' },
    { id: 'Entertainment', name: 'Entertainment', icon: '🎭', description: 'Performers and entertainers' },
    { id: 'Planning', name: 'Event Planning', icon: '📋', description: 'Event planning and coordination' },
    { id: 'Rentals', name: 'Rentals', icon: '🎪', description: 'Equipment and furniture rentals' }
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
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  useEffect(() => {
    if (currentUser && formData.email === '') {
      setFormData(prev => ({ ...prev, email: currentUser.email }));
    }
  }, [currentUser]);


  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAccountCreated = (userData) => {
    // Update auth context
    setCurrentUser(userData);
    window.currentUser = userData;
    
    // Move to next step
    setCurrentStep(1);
  };

  const handleNext = () => {
    // Validation
    if (currentStep === 0 && !currentUser) {
      showBanner('Please log in to continue', 'error');
      return;
    }
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
        country: formData.country,
        postalCode: formData.postalCode || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        primaryCategory: formData.primaryCategory,
        categories: allCategories,
        serviceAreas: formData.serviceAreas.length > 0 ? formData.serviceAreas : [formData.city],
        selectedServices: formData.selectedServices,
        businessHours: formData.businessHours,
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
        faqs: formData.faqs
      };

      const response = await fetch(`${API_BASE_URL}/vendors/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(vendorData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create vendor profile');
      }

      const result = await response.json();
      
      setCurrentUser(prev => ({
        ...prev,
        isVendor: true,
        vendorProfileId: result.vendorProfileId
      }));

      showBanner('Vendor profile created successfully! 🎉', 'success');
      
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
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <img src="/planhive_logo.svg" alt="PlanHive" style={{ height: '50px', width: 'auto' }} />
          </div>
          <div className="header-actions">
            <button className="btn-text" onClick={() => navigate('/')}>
              Exit
            </button>
          </div>
        </div>
      </header>

      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>

      <main className="become-vendor-main">
        <div className={`step-container ${isTransitioning ? 'fade-out' : ''}`} key={currentStep}>
          <div className="step-header">
            <h1 className="step-title">{steps[currentStep].title}</h1>
            <p className="step-subtitle">{steps[currentStep].subtitle}</p>
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
            />
          </div>
        </div>
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
                'Complete Setup'
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

function AccountStep({ currentUser, setFormData, formData, onAccountCreated }) {
  const [mode, setMode] = useState('signup'); // 'signup' or 'login'
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  if (currentUser) {
    return (
      <div className="account-step">
        <div className="welcome-card">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>Welcome, {currentUser.name}!</h2>
          <p>Let's set up your vendor profile and start getting bookings.</p>
          <div className="account-info">
            <div className="info-item">
              <i className="fas fa-envelope"></i>
              <span>{currentUser.email}</span>
            </div>
          </div>
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
      
      // Create user object
      const userData = {
        id: data.userId || data.user?.id,
        userId: data.userId || data.user?.id,
        name: accountData.name || data.user?.name || data.name,
        email: accountData.email || data.user?.email || data.email,
        userType: 'vendor',
        isVendor: true,
        vendorProfileId: data.vendorProfileId || data.user?.vendorProfileId
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

  return (
    <div className="account-step">
      <div className="auth-container">
        <div className="auth-header">
          <h2>{mode === 'signup' ? 'Create Your Vendor Account' : 'Welcome Back'}</h2>
          <p>{mode === 'signup' ? 'Join thousands of vendors on PlanHive' : 'Log in to continue setting up your profile'}</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Log In
          </button>
        </div>

        <form onSubmit={handleAccountSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={accountData.name}
                onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                className="form-input"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={accountData.email}
              onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
              className="form-input"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={accountData.password}
              onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
              className="form-input"
              placeholder="••••••••"
              required
              minLength="6"
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                value={accountData.confirmPassword}
                onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                className="form-input"
                placeholder="••••••••"
                required
                minLength="6"
              />
            </div>
          )}

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? (
              <span className="spinner-small"></span>
            ) : mode === 'signup' ? (
              'Create Account & Continue'
            ) : (
              'Log In & Continue'
            )}
          </button>

          {mode === 'signup' && (
            <p className="auth-terms">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function CategoriesStep({ formData, onInputChange, categories }) {
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
        {categories.map(category => (
          <div
            key={category.id}
            className={`category-card ${formData.primaryCategory === category.id ? 'selected primary' : ''}`}
            onClick={() => handlePrimaryChange(category.id)}
          >
            <div className="category-icon">{category.icon}</div>
            <div className="category-card-content">
              <h4 className="category-name">{category.name}</h4>
              <p className="category-description">{category.description}</p>
            </div>
            {formData.primaryCategory === category.id && (
              <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', color: '#222222' }}></i>
            )}
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: '2.5rem', marginBottom: '1.5rem', color: '#222', fontSize: '1.125rem', fontWeight: '600' }}>Additional Categories (Optional)</h3>
      <div className="categories-grid">
        {categories
          .filter(c => c.id !== formData.primaryCategory)
          .map(category => (
            <div
              key={category.id}
              className={`category-card ${formData.additionalCategories.includes(category.id) ? 'selected' : ''}`}
              onClick={() => handleAdditionalToggle(category.id)}
            >
              <div className="category-icon">{category.icon}</div>
              <div className="category-card-content">
                <h4 className="category-name">{category.name}</h4>
                <p className="category-description">{category.description}</p>
              </div>
              {formData.additionalCategories.includes(category.id) && (
                <i className="fas fa-check-circle" style={{ fontSize: '1.5rem', color: '#222222' }}></i>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

// Remaining Step Components

function BusinessDetailsStep({ formData, onInputChange }) {
  return (
    <div className="business-details-step">
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
  const [selectedServiceIds, setSelectedServiceIds] = useState(new Set());

  useEffect(() => {
    loadServices();
  }, [formData.primaryCategory, formData.additionalCategories]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendors/predefined-services`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const servicesByCategory = data.servicesByCategory || {};
        
        const allCategories = [formData.primaryCategory, ...formData.additionalCategories].filter(Boolean);
        
        const filteredServices = [];
        allCategories.forEach(category => {
          if (servicesByCategory[category]) {
            servicesByCategory[category].forEach(service => {
              filteredServices.push({ ...service, category });
            });
          }
        });
        
        setAvailableServices(filteredServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (service) => {
    const newSet = new Set(selectedServiceIds);
    if (newSet.has(service.id)) {
      newSet.delete(service.id);
      setFormData(prev => ({
        ...prev,
        selectedServices: prev.selectedServices.filter(s => s.serviceId !== service.id)
      }));
    } else {
      newSet.add(service.id);
      setFormData(prev => ({
        ...prev,
        selectedServices: [...prev.selectedServices, {
          serviceId: service.id,
          serviceName: service.name,
          price: 0,
          pricingModel: 'fixed_price'
        }]
      }));
    }
    setSelectedServiceIds(newSet);
  };

  const handlePriceChange = (serviceId, price) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s =>
        s.serviceId === serviceId ? { ...s, price: parseFloat(price) || 0 } : s
      )
    }));
  };

  if (loading) {
    return <div className="loading">Loading services...</div>;
  }

  return (
    <div className="services-step">
      <div className="step-info-banner">
        <p>💡 Select the services you offer and set your pricing. You can add more services later.</p>
      </div>

      {availableServices.length === 0 ? (
        <div className="no-services">
          <p>No services available for your selected categories. You can add custom services later in your dashboard.</p>
        </div>
      ) : (
        <div className="services-list">
          {availableServices.map(service => {
            const isSelected = selectedServiceIds.has(service.id);
            const selectedService = formData.selectedServices.find(s => s.serviceId === service.id);
            
            return (
              <div key={service.id} className={`service-item ${isSelected ? 'selected' : ''}`}>
                <div className="service-header">
                  <label className="service-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleServiceToggle(service)}
                    />
                    <span className="service-name">{service.name}</span>
                  </label>
                  <span className="service-category-badge">{service.category}</span>
                </div>
                {service.description && (
                  <p className="service-description">{service.description}</p>
                )}
                {isSelected && (
                  <div className="service-pricing">
                    <label>Your Price (CAD)</label>
                    <input
                      type="number"
                      value={selectedService?.price || ''}
                      onChange={(e) => handlePriceChange(service.id, e.target.value)}
                      className="form-input"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
            );
          })}
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

// Questionnaire Step - Full Implementation
function QuestionnaireStep({ formData, setFormData }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestionnaire();
  }, [formData.primaryCategory, formData.additionalCategories]);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor-features/all-grouped`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatureSelection = (featureId) => {
    setFormData(prev => {
      const currentFeatures = prev.selectedFeatures || [];
      const newFeatures = currentFeatures.includes(featureId)
        ? currentFeatures.filter(id => id !== featureId)
        : [...currentFeatures, featureId];
      
      return { ...prev, selectedFeatures: newFeatures };
    });
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
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Loading features...</p>
      </div>
    );
  }

  return (
    <div className="questionnaire-step">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <i className="fas fa-clipboard-check" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Select Your Features</h3>
          </div>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Choose the features and services that apply to your business. This helps clients understand what you offer.
          </p>
        </div>

        {filteredCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
            <i className="fas fa-info-circle" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', margin: 0 }}>
              No features available for your selected categories yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {filteredCategories.map(category => {
              if (!category.features || category.features.length === 0) return null;
              
              return (
                <div key={category.categoryName} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '2px solid #f3f4f6' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <i className={`fas fa-${getCategoryIcon(category.categoryIcon)}`}></i>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{category.categoryName}</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                    {category.features.map(feature => {
                      const isSelected = (formData.selectedFeatures || []).includes(feature.featureID);
                      return (
                        <div
                          key={feature.featureID}
                          onClick={() => toggleFeatureSelection(feature.featureID)}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            borderRadius: '8px',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid #e5e7eb',
                            background: isSelected ? '#f0f9ff' : 'white'
                          }}
                        >
                          <i className={`fas fa-${getFeatureIcon(feature.featureIcon)}`} style={{ color: 'var(--primary)', fontSize: '1.1rem', flexShrink: 0 }}></i>
                          <span style={{ fontSize: '0.9rem', color: '#374151', flex: 1, fontWeight: isSelected ? 600 : 400 }}>{feature.featureName}</span>
                          {isSelected && (
                            <i className="fas fa-check-circle" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}></i>
                          )}
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
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.95rem' }}>
              <i className="fas fa-check-circle" style={{ color: 'var(--primary)' }}></i>
              <span><strong>{(formData.selectedFeatures || []).length}</strong> features selected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Gallery Step - Full Implementation
function GalleryStep({ formData, setFormData }) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploading(true);
      
      // For now, we'll just store the file names/URLs in formData
      // In production, you'd upload to a server or cloud storage
      const fileURLs = files.map(file => URL.createObjectURL(file));
      
      setFormData(prev => ({
        ...prev,
        photoURLs: [...(prev.photoURLs || []), ...fileURLs]
      }));
      
      showBanner('Photos added successfully!', 'success');
    } catch (error) {
      console.error('Error uploading:', error);
      showBanner('Failed to add photos', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddPhotoByUrl = () => {
    if (!urlInput.trim()) {
      showBanner('Please enter a valid URL', 'error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      photoURLs: [...(prev.photoURLs || []), urlInput.trim()]
    }));
    
    setUrlInput('');
    showBanner('Photo added successfully!', 'success');
  };

  const handleDeletePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photoURLs: prev.photoURLs.filter((_, i) => i !== index)
    }));
    showBanner('Photo removed', 'success');
  };

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

        {/* Photo Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {(formData.photoURLs || []).length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '12px', border: '2px dashed #e5e7eb' }}>
              <i className="fas fa-images" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
              <p style={{ color: 'var(--text-light)', margin: 0 }}>No photos added yet</p>
            </div>
          ) : (
            (formData.photoURLs || []).map((url, index) => (
              <div
                key={index}
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
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af"><i class="fas fa-image" style="font-size:2rem"></i></div>';
                  }}
                />
                <button
                  onClick={() => handleDeletePhoto(index)}
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

// Filters Step - Full Implementation
function FiltersStep({ formData, setFormData, filterOptions }) {
  const handleToggleFilter = (filterId) => {
    setFormData(prev => {
      const currentFilters = prev.selectedFilters || [];
      const newFilters = currentFilters.includes(filterId)
        ? currentFilters.filter(f => f !== filterId)
        : [...currentFilters, filterId];
      
      return { ...prev, selectedFilters: newFilters };
    });
  };

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
            const isSelected = (formData.selectedFilters || []).includes(filter.id);
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

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.95rem' }}>
          <i className="fas fa-check-circle" style={{ color: 'var(--primary)' }}></i>
          <span><strong>{(formData.selectedFilters || []).length}</strong> badges selected</span>
        </div>
      </div>
    </div>
  );
}

// Policies Step - Full Implementation
function PoliciesStep({ formData, onInputChange, setFormData }) {
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  const handleAddFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      showBanner('Please fill in both question and answer', 'error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), { ...newFaq, id: Date.now() }]
    }));

    setNewFaq({ question: '', answer: '' });
    showBanner('FAQ added successfully!', 'success');
  };

  const handleDeleteFaq = (index) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

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

            {/* Existing FAQs */}
            {(formData.faqs || []).length > 0 && (
              <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem' }}>
                {formData.faqs.map((faq, index) => (
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
                        onClick={() => handleDeleteFaq(index)}
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
                className="btn btn-outline"
                style={{ justifySelf: 'start' }}
              >
                <i className="fas fa-plus"></i> Add FAQ
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
