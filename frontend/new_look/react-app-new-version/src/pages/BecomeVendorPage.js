import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { showBanner } from '../utils/helpers';
import './BecomeVendorPage.css';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

const BecomeVendorPage = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(currentUser ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  
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
      title: 'Welcome to PlanHive',
      subtitle: currentUser ? `Welcome, ${currentUser.name}!` : 'Please log in to continue',
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
      component: LocationStep,
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
      title: 'Vendor Setup Questionnaire',
      subtitle: 'Select features that describe your services',
      component: QuestionnaireStep,
      required: false,
      skippable: true
    },
    {
      id: 'gallery',
      title: 'Gallery & Media',
      subtitle: 'Add photos to showcase your work',
      component: GalleryStep,
      required: false,
      skippable: true
    },
    {
      id: 'social-media',
      title: 'Social Media',
      subtitle: 'Connect your social profiles',
      component: SocialMediaStep,
      required: false,
      skippable: true
    },
    {
      id: 'filters',
      title: 'Popular Filters',
      subtitle: 'Enable special badges for your profile',
      component: FiltersStep,
      required: false,
      skippable: true
    },
    {
      id: 'policies',
      title: 'Policies & FAQs',
      subtitle: 'Set your policies and answer common questions',
      component: PoliciesStep,
      required: false,
      skippable: true
    },
    {
      id: 'review',
      title: 'Review & Complete',
      subtitle: 'Review your information and complete setup',
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
    if (currentStep === 4) {
      if (!formData.city || !formData.province) {
        showBanner('Please enter your city and province', 'error');
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
        <div className="step-container">
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

function LocationStep({ formData, onInputChange, googleMapsLoaded }) {
  const addressInputRef = React.useRef(null);
  const serviceAreaInputRef = React.useRef(null);
  const addressAutocompleteRef = React.useRef(null);
  const serviceAreaAutocompleteRef = React.useRef(null);
  const [serviceAreaInput, setServiceAreaInput] = React.useState('');

  React.useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }
    
    // Address Autocomplete - same as main page
    if (addressInputRef.current && !addressAutocompleteRef.current) {
      // Clear existing autocomplete if it exists
      if (addressAutocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(addressAutocompleteRef.current);
      }

      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'ca' }
      });

      addressAutocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place || !place.address_components) return;
        
        const comps = place.address_components;
        const pick = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
        
        onInputChange('address', place.formatted_address || '');
        onInputChange('city', pick('locality') || pick('sublocality') || '');
        onInputChange('province', pick('administrative_area_level_1') || '');
        onInputChange('country', pick('country') || 'Canada');
        onInputChange('postalCode', pick('postal_code') || '');
        
        const loc = place.geometry?.location;
        if (loc) {
          onInputChange('latitude', typeof loc.lat === 'function' ? loc.lat() : loc.lat);
          onInputChange('longitude', typeof loc.lng === 'function' ? loc.lng() : loc.lng);
        }
      });
    }
    
    // Service Area Autocomplete - same as main page
    if (serviceAreaInputRef.current && !serviceAreaAutocompleteRef.current) {
      // Clear existing autocomplete if it exists
      if (serviceAreaAutocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(serviceAreaAutocompleteRef.current);
      }

      const autocomplete = new window.google.maps.places.Autocomplete(serviceAreaInputRef.current, {
        types: ['(cities)'],
        componentRestrictions: { country: 'ca' }
      });

      serviceAreaAutocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          const areas = formData.serviceAreas || [];
          if (!areas.includes(place.formatted_address)) {
            onInputChange('serviceAreas', [...areas, place.formatted_address]);
          }
          setServiceAreaInput('');
        }
      });
    }
  }, [googleMapsLoaded]);

  const handleAddServiceArea = () => {
    const raw = serviceAreaInput.trim();
    if (!raw) return;
    const areas = formData.serviceAreas || [];
    if (!areas.includes(raw)) {
      onInputChange('serviceAreas', [...areas, raw]);
    }
    setServiceAreaInput('');
  };

  const handleRemoveServiceArea = (index) => {
    const areas = formData.serviceAreas || [];
    onInputChange('serviceAreas', areas.filter((_, i) => i !== index));
  };

  return (
    <div className="location-step">
      <div className="form-group">
        <label>Street Address *</label>
        <input
          type="text"
          className="form-input"
          ref={addressInputRef}
          value={formData.address || ''}
          onChange={(e) => onInputChange('address', e.target.value)}
          placeholder="Start typing your address..."
        />
        <small className="form-help">Google Maps will auto-complete your address</small>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            className="form-input"
            value={formData.city}
            onChange={(e) => onInputChange('city', e.target.value)}
            placeholder="Toronto"
          />
        </div>
        <div className="form-group">
          <label>Province *</label>
          <input
            type="text"
            className="form-input"
            value={formData.province}
            onChange={(e) => onInputChange('province', e.target.value)}
            placeholder="Ontario"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Postal Code *</label>
          <input
            type="text"
            className="form-input"
            value={formData.postalCode}
            onChange={(e) => onInputChange('postalCode', e.target.value)}
            placeholder="M5H 2N2"
          />
        </div>
        <div className="form-group">
          <label>Country</label>
          <input
            type="text"
            className="form-input"
            value={formData.country || 'Canada'}
            onChange={(e) => onInputChange('country', e.target.value)}
            placeholder="Canada"
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #EBEBEB' }}>
        <label>Service Areas *</label>
        <p className="form-help">Add the cities or regions where you offer your services</p>
        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <input
              type="text"
              className="form-input"
              ref={serviceAreaInputRef}
              placeholder="Start typing a city name..."
              value={serviceAreaInput || ''}
              onChange={(e) => setServiceAreaInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddServiceArea();
                }
              }}
            />
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleAddServiceArea}
            style={{ padding: '0.875rem 1.5rem', whiteSpace: 'nowrap' }}
          >
            <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>Add
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', minHeight: '2rem' }}>
          {(formData.serviceAreas || []).map((area, index) => (
            <span
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.875rem',
                background: '#F7F7F7',
                border: '1px solid #DDDDDD',
                color: '#222222',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              {area}
              <button
                type="button"
                onClick={() => handleRemoveServiceArea(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '0',
                  fontSize: '1.3rem',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </span>
          ))}
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

// Placeholder components for remaining steps - these need full implementation
function BusinessHoursStep({ formData, onInputChange }) {
  return <div className="business-hours-step"><p>Business Hours Step - Implementation needed</p></div>;
}

function QuestionnaireStep({ formData, setFormData }) {
  return <div className="questionnaire-step"><p>Questionnaire Step - Implementation needed</p></div>;
}

function GalleryStep({ formData, setFormData }) {
  return <div className="gallery-step"><p>Gallery Step - Implementation needed</p></div>;
}

function SocialMediaStep({ formData, onInputChange }) {
  return <div className="social-media-step"><p>Social Media Step - Implementation needed</p></div>;
}

function FiltersStep({ formData, onInputChange, filterOptions }) {
  return <div className="filters-step"><p>Filters Step - Implementation needed</p></div>;
}

function PoliciesStep({ formData, onInputChange, setFormData }) {
  return <div className="policies-step"><p>Policies Step - Implementation needed</p></div>;
}

function ReviewStep({ formData, categories }) {
  return <div className="review-step"><p>Review Step - Implementation needed</p></div>;
}

export default BecomeVendorPage;
