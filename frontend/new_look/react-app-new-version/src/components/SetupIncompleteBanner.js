import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

/**
 * SetupIncompleteBanner - Shared banner component for vendor setup status
 * 
 * This component fetches vendor profile data and uses the EXACT same step definitions
 * and isStepCompleted logic as BecomeVendorPage to ensure both banners are in sync.
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
  const [vendorData, setVendorData] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine if we're in "inline mode" (used within BecomeVendorPage with steps prop)
  const isInlineMode = externalSteps && externalIsStepCompleted;

  // EXACT same step definitions as BecomeVendorPage (excluding account and review)
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
    { id: 'policies', title: 'FAQ Section' }
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

    fetchVendorData();
  }, [currentUser, isInlineMode]);

  // Fetch vendor profile data - SAME endpoint as BecomeVendorPage fetchExistingVendorData
  const fetchVendorData = async () => {
    try {
      // Check if user is a vendor first
      if (!currentUser.isVendor || !currentUser.vendorProfileId) {
        console.log('[SetupBanner] User is not a vendor or no vendorProfileId:', {
          isVendor: currentUser.isVendor,
          vendorProfileId: currentUser.vendorProfileId
        });
        setLoading(false);
        return;
      }

      console.log('[SetupBanner] Fetching vendor profile for userId:', currentUser.id);

      // Fetch vendor profile using SAME endpoint as BecomeVendorPage
      const response = await fetch(`${API_BASE_URL}/vendors/profile?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        console.log('[SetupBanner] Profile fetch failed:', response.status);
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('[SetupBanner] Profile result:', result);
      
      if (result.success && result.data) {
        // Also fetch vendor features (categoryAnswers) for questionnaire step
        let categoryAnswers = [];
        try {
          const featuresRes = await fetch(`${API_BASE_URL}/vendor-features/vendor/${currentUser.vendorProfileId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (featuresRes.ok) {
            const featuresData = await featuresRes.json();
            categoryAnswers = featuresData.features || featuresData.data || [];
          }
        } catch (e) {
          console.log('[SetupBanner] Could not fetch vendor features:', e);
        }

        console.log('[SetupBanner] Setting vendor data with', Object.keys(result.data).length, 'keys');
        setVendorData({
          ...result.data,
          categoryAnswers
        });
      } else {
        console.log('[SetupBanner] No data in result');
      }
      setLoading(false);
    } catch (error) {
      console.error('[SetupBanner] Failed to fetch vendor data:', error);
      setLoading(false);
    }
  };

  // EXACT same isStepCompleted logic as BecomeVendorPage
  const isStepCompleted = (stepId) => {
    if (!vendorData) return false;

    const profile = vendorData.profile || vendorData;
    const categories = vendorData.categories || [];
    const services = vendorData.services || [];
    const businessHours = vendorData.businessHours || [];
    const images = vendorData.images || [];
    const socialMedia = vendorData.socialMedia || [];
    const faqs = vendorData.faqs || [];
    const categoryAnswers = vendorData.categoryAnswers || [];
    const serviceAreas = vendorData.serviceAreas || [];

    switch (stepId) {
      case 'categories':
        return categories.length > 0;
      case 'business-details':
        return !!(profile.BusinessName && (profile.DisplayName || profile.BusinessName));
      case 'contact':
        return !!profile.BusinessPhone;
      case 'location':
        return !!((profile.City || profile.Address) && serviceAreas.length > 0);
      case 'services':
        return services.length > 0;
      case 'business-hours':
        return businessHours.some(h => h.IsAvailable);
      case 'questionnaire':
        return categoryAnswers.length > 0;
      case 'gallery':
        return images.length > 0;
      case 'social-media':
        return socialMedia.length > 0;
      case 'filters':
        return !!(profile.IsPremium || profile.IsEcoFriendly || profile.IsAwardWinning || 
                  profile.IsLastMinute || profile.IsCertified || profile.IsInsured);
      case 'stripe':
        return !!(profile.StripeAccountID);
      case 'google-reviews':
        return !!(profile.GooglePlaceID);
      case 'policies':
        // Match BecomeVendorPage: cancellationPolicy || depositPercentage || paymentTerms
        return !!(profile.CancellationPolicy || profile.DepositPercentage || profile.PaymentTerms || faqs.length > 0);
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
    // API mode: Use fetched vendor data with same logic as BecomeVendorPage
    if (loading || !vendorData || dismissed) return null;
    
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
            <div style={{ fontWeight: 600, color: '#7c2d12', marginBottom: '6px', fontSize: '.9rem' }}>Incomplete</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {incompleteSteps.slice(0, 6).map((step) => {
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
              {incompleteSteps.length > 6 && (
                <span style={{ fontSize: '.85rem', color: '#7c2d12' }}>
                  +{incompleteSteps.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontWeight: 600, color: '#166534', marginBottom: '6px', fontSize: '.9rem' }}>
            Completed ({completedSteps.length}/{totalSteps})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {completedSteps.slice(0, 6).map((step) => {
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
