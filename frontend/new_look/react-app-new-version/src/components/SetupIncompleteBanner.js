import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

/**
 * SetupIncompleteBanner - Shared banner component for vendor setup status
 * 
 * CRITICAL: This component MUST use the EXACT same data fetching and isStepCompleted
 * logic as BecomeVendorPage.js to ensure both banners show identical results.
 * 
 * The data is fetched using the same endpoints and transformed into the same
 * formData structure that BecomeVendorPage uses.
 * 
 * Props:
 * - steps: Array of step objects from BecomeVendorPage (optional - for inline mode)
 * - isStepCompleted: Function to check if a step is completed (optional - for inline mode)
 * - onStepClick: Callback when a step pill is clicked (optional - for inline mode)
 * - hideButtons: Boolean to hide Complete Profile/Dismiss buttons (optional)
 * - maxWidth: Custom max width for the banner (optional)
 */
function SetupIncompleteBanner({ 
  steps: externalSteps, 
  isStepCompleted: externalIsStepCompleted, 
  onStepClick,
  hideButtons = false,
  maxWidth
}) {
  const { currentUser } = useAuth();
  // formData structure MUST match BecomeVendorPage.js exactly
  const [formData, setFormData] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchStartedRef = useRef(false);

  // Determine if we're in "inline mode" (used within BecomeVendorPage with steps prop)
  const isInlineMode = externalSteps && externalIsStepCompleted;

  // EXACT same step definitions as BecomeVendorPage (excluding account and review)
  // These titles MUST match BecomeVendorPage.js lines 159-274 exactly
  const steps = [
    { id: 'categories', title: 'What services do you offer?' },
    { id: 'business-details', title: 'Tell us about your business' },
    { id: 'contact', title: 'How can clients reach you?' },
    { id: 'location', title: 'Where are you located?' },
    { id: 'services', title: 'What services do you provide?' },
    { id: 'business-hours', title: 'When are you available?' },
    { id: 'questionnaire', title: 'Tell guests what your place has to offer' },
    { id: 'gallery', title: 'Add photos to showcase your work' },
    { id: 'social-media', title: 'Connect your social profiles' },
    { id: 'filters', title: 'Enable special badges for your profile' },
    { id: 'stripe', title: 'Connect Stripe for Payments' },
    { id: 'google-reviews', title: 'Connect Google Reviews' },
    { id: 'policies', title: 'Set your policies and answer common questions' }
  ];

  useEffect(() => {
    // Skip API fetch if in inline mode
    if (isInlineMode) {
      setLoading(false);
      return;
    }

    if (!currentUser?.id) {
      console.log('[SetupBanner] No currentUser.id, not showing banner');
      setLoading(false);
      return;
    }

    console.log('[SetupBanner] Checking for vendor:', currentUser);
    
    // Check if banner was dismissed
    const dismissKey = `vv_hideSetupReminderUntilComplete_${currentUser.id}`;
    if (localStorage.getItem(dismissKey)) {
      console.log('[SetupBanner] Banner was dismissed');
      setDismissed(true);
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches using ref
    if (fetchStartedRef.current) {
      console.log('[SetupBanner] Fetch already started, skipping');
      return;
    }
    fetchStartedRef.current = true;
    fetchVendorData();
  }, [currentUser, isInlineMode]);

  /**
   * Fetch vendor data using EXACT same logic as BecomeVendorPage.js fetchExistingVendorData
   * This includes the same API calls for profile, stripe, filters, and social media
   */
  const fetchVendorData = async () => {
    try {
      // Check if user is a vendor first
      if (!currentUser.isVendor || !currentUser.vendorProfileId) {
        console.log('[SetupBanner] User is not a vendor or no vendorProfileId');
        setLoading(false);
        return;
      }

      console.log('[SetupBanner] Fetching vendor profile for userId:', currentUser.id);

      // STEP 1: Fetch main profile data (same as BecomeVendorPage line 326)
      const response = await fetch(`${API_BASE_URL}/vendors/profile?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        console.log('[SetupBanner] Profile fetch failed:', response.status);
        setLoading(false);
        return;
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        console.log('[SetupBanner] No data in result');
        setLoading(false);
        return;
      }

      const data = result.data;
      const profile = data.profile || {};
      const categories = data.categories || [];
      const services = data.services || [];
      const serviceAreas = data.serviceAreas || [];
      const businessHours = data.businessHours || [];
      const images = data.images || [];
      const selectedFeatures = data.selectedFeatures || [];
      const faqs = data.faqs || [];

      // Map business hours from database format to form format (same as BecomeVendorPage lines 366-379)
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const hoursMap = {};
      businessHours.forEach(hour => {
        const dayIndex = typeof hour.DayOfWeek === 'number' ? hour.DayOfWeek : parseInt(hour.DayOfWeek);
        const day = dayNames[dayIndex];
        if (day) {
          hoursMap[day] = {
            isAvailable: hour.IsAvailable || false,
            openTime: hour.OpenTime || '09:00',
            closeTime: hour.CloseTime || '17:00'
          };
        }
      });

      // Extract primary category (same as BecomeVendorPage lines 386-389)
      const primaryCat = categories.find(c => c.IsPrimary)?.Category || categories[0]?.Category || '';

      // Map service areas (same as BecomeVendorPage lines 392-397)
      const mappedServiceAreas = serviceAreas.map(area => ({
        id: area.VendorServiceAreaID,
        name: area.CityName,
        state: area.StateProvince,
        country: area.Country
      }));

      // Extract photo URLs (same as BecomeVendorPage line 400)
      const photoURLs = images.map(img => img.ImageURL || img.imageUrl).filter(Boolean);

      // Convert social media from array to object format (same as BecomeVendorPage lines 353-361)
      let socialMediaObj = {};
      if (data.socialMedia?.length > 0) {
        data.socialMedia.forEach(sm => {
          const platform = sm.Platform?.toLowerCase();
          if (platform) {
            socialMediaObj[platform] = sm.URL || '';
          }
        });
      }

      // Build formData structure EXACTLY like BecomeVendorPage (lines 402-475)
      const updatedFormData = {
        // Categories
        primaryCategory: primaryCat,
        additionalCategories: categories.filter(c => !c.IsPrimary).map(c => c.Category),
        
        // Business Details
        businessName: profile.BusinessName || '',
        displayName: profile.DisplayName || profile.BusinessName || '',
        businessDescription: profile.BusinessDescription || '',
        
        // Contact
        businessPhone: profile.BusinessPhone || '',
        website: profile.Website || '',
        
        // Location
        city: profile.City || '',
        province: profile.State || '',
        serviceAreas: mappedServiceAreas,
        
        // Services
        selectedServices: services.map(s => ({
          id: s.VendorServiceID,
          categoryName: s.CategoryName,
          serviceName: s.ServiceName
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
        
        // Questionnaire
        selectedFeatures: selectedFeatures,
        
        // Social Media
        facebook: socialMediaObj.facebook || '',
        instagram: socialMediaObj.instagram || '',
        twitter: socialMediaObj.twitter || '',
        linkedin: socialMediaObj.linkedin || '',
        
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
        googlePlaceId: profile.GooglePlaceId || profile.GooglePlaceID || '',
        
        // Stripe (will be updated below)
        stripeConnected: false,
        
        // Filters (will be updated below)
        selectedFilters: []
      };

      // STEP 2: Fetch Stripe status (same as BecomeVendorPage lines 478-489)
      try {
        const stripeRes = await fetch(`${API_BASE_URL}/payments/connect/status/${currentUser.vendorProfileId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (stripeRes.ok) {
          const stripeData = await stripeRes.json();
          updatedFormData.stripeConnected = stripeData.connected || false;
          console.log('[SetupBanner] Stripe connected:', updatedFormData.stripeConnected);
        }
      } catch (e) {
        console.log('[SetupBanner] Could not fetch Stripe status:', e);
      }

      // STEP 3: Fetch filters (same as BecomeVendorPage lines 492-505)
      try {
        const filtersRes = await fetch(`${API_BASE_URL}/vendors/${currentUser.vendorProfileId}/filters`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (filtersRes.ok) {
          const filtersData = await filtersRes.json();
          // Same logic as BecomeVendorPage lines 498-500
          if (filtersData.filters) {
            updatedFormData.selectedFilters = filtersData.filters.split(',').filter(f => f.trim());
          } else if (filtersData.isPremium || filtersData.isFeatured) {
            updatedFormData.selectedFilters = ['filter-premium'];
          }
          console.log('[SetupBanner] Filters loaded:', updatedFormData.selectedFilters);
        }
      } catch (e) {
        console.log('[SetupBanner] Could not fetch filters:', e);
      }

      // STEP 4: Fetch social media from dedicated endpoint (same as BecomeVendorPage lines 508-524)
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
          console.log('[SetupBanner] Social media loaded:', socialData);
        }
      } catch (e) {
        console.log('[SetupBanner] Could not fetch social media:', e);
      }

      // STEP 5: Fetch selected features from dedicated endpoint (more reliable than profile API)
      try {
        const featuresRes = await fetch(`${API_BASE_URL}/vendor-features/vendor/${currentUser.vendorProfileId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (featuresRes.ok) {
          const featuresData = await featuresRes.json();
          const featureIds = featuresData.selectedFeatures?.map(f => f.FeatureID) || [];
          updatedFormData.selectedFeatures = featureIds;
          console.log('[SetupBanner] Selected features loaded:', featureIds.length, 'features');
        }
      } catch (e) {
        console.log('[SetupBanner] Could not fetch selected features:', e);
      }

      console.log('[SetupBanner] Final formData:', updatedFormData);
      setFormData(updatedFormData);
      setLoading(false);
    } catch (error) {
      console.error('[SetupBanner] Failed to fetch vendor data:', error);
      setLoading(false);
    }
  };

  /**
   * EXACT same isStepCompleted logic as BecomeVendorPage.js lines 726-761
   * This function checks formData exactly like BecomeVendorPage does
   */
  const isStepCompleted = (stepId) => {
    if (!formData) return false;

    switch (stepId) {
      case 'categories':
        // BecomeVendorPage line 733: return !!formData.primaryCategory;
        return !!formData.primaryCategory;
      case 'business-details':
        // BecomeVendorPage line 735: return !!(formData.businessName && formData.displayName);
        return !!(formData.businessName && formData.displayName);
      case 'contact':
        // BecomeVendorPage line 737: return !!formData.businessPhone;
        return !!formData.businessPhone;
      case 'location':
        // BecomeVendorPage line 739: return !!(formData.city && formData.province && formData.serviceAreas.length > 0);
        return !!(formData.city && formData.province && formData.serviceAreas.length > 0);
      case 'services':
        // BecomeVendorPage line 741: return formData.selectedServices.length > 0;
        return formData.selectedServices.length > 0;
      case 'business-hours':
        // BecomeVendorPage line 743: return Object.values(formData.businessHours).some(h => h.isAvailable);
        return Object.values(formData.businessHours).some(h => h.isAvailable);
      case 'questionnaire':
        // BecomeVendorPage line 745: return formData.selectedFeatures.length > 0;
        return formData.selectedFeatures.length > 0;
      case 'gallery':
        // BecomeVendorPage line 747: return formData.photoURLs.length > 0;
        return formData.photoURLs.length > 0;
      case 'social-media':
        // BecomeVendorPage line 749: return !!(formData.facebook || formData.instagram || formData.twitter || formData.linkedin);
        return !!(formData.facebook || formData.instagram || formData.twitter || formData.linkedin);
      case 'filters':
        // BecomeVendorPage line 751: return formData.selectedFilters.length > 0;
        return formData.selectedFilters.length > 0;
      case 'stripe':
        // BecomeVendorPage line 753: return !!formData.stripeConnected;
        return !!formData.stripeConnected;
      case 'google-reviews':
        // BecomeVendorPage line 755: return !!formData.googlePlaceId;
        return !!formData.googlePlaceId;
      case 'policies':
        // BecomeVendorPage line 757: return !!(formData.cancellationPolicy || formData.depositPercentage || formData.paymentTerms || (formData.faqs && formData.faqs.length > 0));
        return !!(formData.cancellationPolicy || formData.depositPercentage || formData.paymentTerms || (formData.faqs && formData.faqs.length > 0));
      default:
        return false;
    }
  };

  const handleDismiss = () => {
    const dismissKey = `vv_hideSetupReminderUntilComplete_${currentUser.id}`;
    localStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  };

  const handleContinue = () => {
    window.open('/become-a-vendor', '_blank');
  };

  const handleSectionClick = (stepKey) => {
    window.open(`/become-a-vendor?step=${stepKey}`, '_blank');
  };

  // Handle step click - use custom handler if provided, otherwise open in new tab
  const handleStepClick = (stepKey) => {
    if (onStepClick) {
      onStepClick(stepKey);
    } else {
      handleSectionClick(stepKey);
    }
  };

  // Calculate steps based on mode
  let incompleteSteps = [];
  let completedSteps = [];
  let totalSteps = 0;

  if (isInlineMode) {
    // Inline mode: Use external steps from BecomeVendorPage
    const filteredSteps = externalSteps.filter(step => step.id !== 'account' && step.id !== 'review');
    incompleteSteps = filteredSteps
      .filter(step => !externalIsStepCompleted(step.id))
      .map(step => ({ key: step.id, label: step.title }));
    completedSteps = filteredSteps
      .filter(step => externalIsStepCompleted(step.id))
      .map(step => ({ key: step.id, label: step.title }));
    totalSteps = filteredSteps.length;

    if (incompleteSteps.length === 0) return null;
  } else {
    // API mode: Use fetched formData with same logic as BecomeVendorPage
    console.log('[SetupBanner] Render check - loading:', loading, 'formData:', !!formData, 'dismissed:', dismissed);
    if (loading) {
      console.log('[SetupBanner] Still loading, not showing banner');
      return null;
    }
    if (!formData) {
      console.log('[SetupBanner] No formData, not showing banner');
      return null;
    }
    if (dismissed) {
      console.log('[SetupBanner] Banner was dismissed');
      return null;
    }
    
    incompleteSteps = steps
      .filter(step => !isStepCompleted(step.id))
      .map(step => ({ key: step.id, label: step.title }));
    completedSteps = steps
      .filter(step => isStepCompleted(step.id))
      .map(step => ({ key: step.id, label: step.title }));
    totalSteps = steps.length;

    // If all complete, don't show banner
    if (incompleteSteps.length === 0) return null;
  }

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      padding: '16px',
      background: '#fffbeb',
      border: '1px solid #fde68a',
      borderRadius: '8px',
      margin: '1rem auto',
      ...(maxWidth && { maxWidth })
    }}>
      <div style={{ fontSize: '20px', lineHeight: 1, color: '#D97706' }}>
        <i className="fas fa-triangle-exclamation"></i>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>Setup Incomplete</div>
            <div style={{ fontSize: '.9rem', color: '#92400e' }}>
              Your profile will not be visible to clients until all required steps are complete.
            </div>
          </div>
          {!hideButtons && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={handleContinue}
                style={{
                  background: '#5e72e4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Complete Profile
              </button>
              <button 
                onClick={handleDismiss}
                style={{
                  background: 'transparent',
                  color: '#1f2937',
                  border: 'none',
                  padding: '8px 16px',
                  fontSize: '.9rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
        
        {incompleteSteps.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontWeight: 600, color: '#7c2d12', marginBottom: '6px', fontSize: '.9rem' }}>
              Incomplete ({incompleteSteps.length}/{totalSteps})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {incompleteSteps.map((step) => {
                const stepKey = step.key || step;
                return (
                  <span
                    key={stepKey}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#ffedd5',
                      color: '#7c2d12',
                      border: '1px solid #fed7aa',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      fontSize: '.85rem',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleStepClick(stepKey)}
                    title={`Click to complete: ${step.label || stepKey}`}
                  >
                    <i className="fas fa-circle-xmark"></i>
                    {step.label || stepKey}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontWeight: 600, color: '#166534', marginBottom: '6px', fontSize: '.9rem' }}>
            Completed ({completedSteps.length}/{totalSteps})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {completedSteps.map((step) => {
              const stepKey = step.key || step;
              return (
                <span
                  key={stepKey}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#d1fae5',
                    color: '#065f46',
                    border: '1px solid #6ee7b7',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '.85rem',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleStepClick(stepKey)}
                  title={`Review: ${step.label || stepKey}`}
                >
                  <i className="fas fa-circle-check"></i>
                  {step.label || stepKey}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetupIncompleteBanner;
