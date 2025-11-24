import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

function SetupIncompleteBanner({ onContinueSetup }) {
  const { currentUser } = useAuth();
  const [setupStatus, setSetupStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!currentUser?.vendorProfileId) {
      console.log('No vendor profile ID, hiding banner');
      return;
    }
    
    // Check if banner was dismissed
    const dismissKey = `vv_hideSetupReminderUntilComplete_${currentUser.id}`;
    if (localStorage.getItem(dismissKey)) {
      console.log('Banner was dismissed, hiding');
      setDismissed(true);
      return;
    }

    console.log('Loading setup status for vendor:', currentUser.vendorProfileId);
    loadSetupStatus();
  }, [currentUser]);

  const loadSetupStatus = async () => {
    try {
      // CORRECT API: /vendor/{userId}/setup-status (from original code line 1333)
      const response = await fetch(`${API_BASE_URL}/vendor/${currentUser.id}/setup-status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('Setup status response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Setup status data:', data);
        setSetupStatus(data);
      } else {
        console.error('Setup status API error:', response.status);
        // Show default incomplete status if API fails
        setSetupStatus({
          isComplete: false,
          incompleteSteps: [
            { key: 'basics', label: 'Business Basics' },
            { key: 'location', label: 'Location Information' },
            { key: 'services', label: 'Services & Packages' }
          ],
          completedSteps: [],
          totalSteps: 8
        });
      }
    } catch (error) {
      console.error('Failed to load setup status:', error);
      // Show default incomplete status if API fails
      setSetupStatus({
        isComplete: false,
        incompleteSteps: [
          { key: 'basics', label: 'Business Basics' },
          { key: 'location', label: 'Location Information' },
          { key: 'services', label: 'Services & Packages' }
        ],
        completedSteps: [],
        totalSteps: 8
      });
    }
  };

  const handleDismiss = () => {
    const dismissKey = `vv_hideSetupReminderUntilComplete_${currentUser.id}`;
    localStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  };

  const handleContinue = () => {
    if (onContinueSetup) {
      onContinueSetup();
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
    stripe: 'Stripe Payout'
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
              Continue setup
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
            <div style={{ fontWeight: 600, color: '#7c2d12', marginBottom: '6px' }}>Incomplete</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {incompleteSteps.slice(0, 6).map((step) => (
                <span
                  key={step.key || step}
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
                  title={`Open ${stepLabels[step.key || step] || step} settings`}
                >
                  <i className="fas fa-circle-xmark"></i>
                  {step.label || stepLabels[step.key || step] || step}
                </span>
              ))}
              {incompleteSteps.length > 6 && (
                <span style={{ fontSize: '.85rem', color: '#7c2d12' }}>
                  +{incompleteSteps.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontWeight: 600, color: '#166534', marginBottom: '6px' }}>
            Completed ({completedSteps.length}/{totalSteps})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {completedSteps.slice(0, 6).map((step) => (
              <span
                key={step.key || step}
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
                  whiteSpace: 'nowrap'
                }}
              >
                <i className="fas fa-circle-check"></i>
                {step.label || stepLabels[step.key || step] || step}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetupIncompleteBanner;
