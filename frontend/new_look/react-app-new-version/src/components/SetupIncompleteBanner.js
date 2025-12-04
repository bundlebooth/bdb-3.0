import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

function SetupIncompleteBanner({ onContinueSetup }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [setupStatus, setSetupStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) {
      console.log('No user ID, hiding banner');
      return;
    }
    
    // Check if banner was dismissed
    const dismissKey = `vv_hideSetupReminderUntilComplete_${currentUser.id}`;
    if (localStorage.getItem(dismissKey)) {
      console.log('Banner was dismissed, hiding');
      setDismissed(true);
      return;
    }

    console.log('Checking vendor status and setup for user:', currentUser.id);
    checkVendorStatusAndLoadSetup();
  }, [currentUser]);

  // EXACT match to original (line 1316-1380)
  const checkVendorStatusAndLoadSetup = async () => {
    try {
      // Step 1: Verify vendor status (line 1317-1330)
      console.log('Step 1: Checking vendor status...');
      const statusRes = await fetch(`${API_BASE_URL}/vendors/status?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!statusRes.ok) {
        console.log('Vendor status check failed, hiding banner');
        return;
      }
      
      const status = await statusRes.json();
      console.log('Vendor status:', status);
      
      if (!status.isVendor) {
        console.log('User is not a vendor, hiding banner');
        return;
      }
      
      // Step 2: Get detailed setup status (line 1333-1380)
      console.log('Step 2: Loading setup status...');
      const setupRes = await fetch(`${API_BASE_URL}/vendor/${currentUser.id}/setup-status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!setupRes.ok) {
        console.log('Setup status check failed, hiding banner');
        return;
      }
      
      const setup = await setupRes.json();
      console.log('Setup status data:', setup);
      
      const allComplete = setup.allRequiredComplete ?? setup?.setupStatus?.allRequiredComplete;
      
      if (allComplete) {
        console.log('Setup is complete, hiding banner');
        // Clear dismiss flag (line 1374-1377)
        try {
          localStorage.removeItem(`vv_hideSetupReminderUntilComplete_${currentUser.id}`);
        } catch (_) {}
        return;
      }
      
      // Filter incomplete steps (line 1344-1348)
      const rawIncompleteSteps = setup.incompleteSteps ?? setup?.setupStatus?.incompleteSteps ?? [];
      const incompleteSteps = rawIncompleteSteps.filter(s => {
        const key = s?.key || s;
        return key !== 'verification' && key !== 'policies';
      });
      
      // Get completed steps (line 1362-1365)
      const stepsObj = setup.steps ?? setup?.setupStatus?.steps ?? {};
      const requiredKeys = ['basics','location','additionalDetails','social','servicesPackages','faq','gallery','availability','stripe'];
      const completedStepKeys = requiredKeys.filter(k => stepsObj[k]);
      
      const completedSteps = completedStepKeys.map(k => ({ key: k, label: getLabelForKey(k) }));
      const incompleteWithLabels = incompleteSteps.map(s => ({ 
        key: s?.key || s, 
        label: getLabelForKey(s?.key || s) 
      }));
      
      setSetupStatus({
        isComplete: false,
        incompleteSteps: incompleteWithLabels,
        completedSteps: completedSteps,
        totalSteps: requiredKeys.length
      });
      
    } catch (error) {
      console.error('Failed to check vendor status:', error);
    }
  };
  
  const getLabelForKey = (key) => {
    const labelMap = {
      basics: 'Business Basics',
      location: 'Location Information',
      additionalDetails: 'Additional Details',
      social: 'Social Media',
      servicesPackages: 'Services & Packages',
      faq: 'FAQ Section',
      gallery: 'Gallery & Media',
      availability: 'Availability & Scheduling',
      stripe: 'Stripe Payouts'
    };
    return labelMap[key] || key;
  };

  const handleDismiss = () => {
    const dismissKey = `vv_hideSetupReminderUntilComplete_${currentUser.id}`;
    localStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  };

  const handleContinue = () => {
    // Navigate to BecomeVendorPage instead of opening dashboard
    navigate('/become-vendor');
  };

  const handleSectionClick = (stepKey) => {
    // Map backend step keys to BecomeVendorPage step IDs
    const stepMapping = {
      'basics': 'categories',
      'location': 'location',
      'additionalDetails': 'business-details',
      'social': 'social-media',
      'servicesPackages': 'services',
      'faq': 'policies',
      'gallery': 'gallery',
      'availability': 'business-hours',
      'stripe': 'policies'
    };
    
    const targetStep = stepMapping[stepKey];
    if (targetStep) {
      navigate('/become-vendor', { state: { targetStep } });
    } else {
      navigate('/become-vendor');
    }
  };

  if (!setupStatus || dismissed || setupStatus.isComplete) return null;

  const incompleteSteps = setupStatus.incompleteSteps || [];
  const completedSteps = setupStatus.completedSteps || [];
  const totalSteps = setupStatus.totalSteps || 0;

  const stepLabels = {
    basics: 'Business Basics',
    location: 'Location Information',
    services: 'Services & Packages',
    servicesPackages: 'Services & Packages',
    additionalDetails: 'Additional Details',
    availability: 'Availability & Scheduling',
    gallery: 'Gallery & Media',
    social: 'Social Media',
    faq: 'FAQ Section',
    stripe: 'Stripe Payouts'
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      padding: '16px',
      background: '#fffbeb',
      border: '1px solid #fde68a',
      borderRadius: '8px',
      margin: '1rem 0'
    }}>
      <div style={{ fontSize: '20px', lineHeight: 1, color: '#D97706' }}>
        <i className="fas fa-triangle-exclamation"></i>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>Setup Incomplete</div>
            <div style={{ fontSize: '.9rem', color: '#92400e' }}>
              Your profile will not be visible to clients until all required steps are complete.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '.5rem .9rem' }}
              onClick={handleContinue}
            >
              Complete Profile
            </button>
            <button 
              className="btn btn-outline" 
              style={{ padding: '.5rem .9rem' }}
              onClick={handleDismiss}
            >
              Dismiss
            </button>
          </div>
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
                    onClick={() => handleSectionClick(stepKey)}
                    title={`Click to complete: ${step.label || stepLabels[stepKey] || stepKey}`}
                  >
                    <i className="fas fa-circle-xmark"></i>
                    {step.label || stepLabels[stepKey] || stepKey}
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
                  onClick={() => handleSectionClick(stepKey)}
                  title={`Review: ${step.label || stepLabels[stepKey] || stepKey}`}
                >
                  <i className="fas fa-circle-check"></i>
                  {step.label || stepLabels[stepKey] || stepKey}
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
