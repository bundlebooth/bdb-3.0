import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function StripeSetupPanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [stripeStatus, setStripeStatus] = useState({
    connected: false,
    accountId: null,
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false
  });

  useEffect(() => {
    if (vendorProfileId) {
      loadStripeStatus();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadStripeStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/payments/connect/status/${vendorProfileId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
      }
    } catch (error) {
      console.error('Error loading Stripe status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/connect/onboard/${vendorProfileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authUrl || data.url) {
          window.location.href = data.authUrl || data.url;
        }
      } else {
        throw new Error('Failed to start onboarding');
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      showBanner('Failed to connect Stripe', 'error');
    }
  };

  const handleManageStripe = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/connect/dashboard/${vendorProfileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.dashboardUrl || data.url) {
          window.open(data.dashboardUrl || data.url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error opening Stripe dashboard:', error);
      showBanner('Failed to open Stripe dashboard', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
        </button>
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
      </button>
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
              alt="Stripe" 
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />
          </span>
          Stripe Setup
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Connect your Stripe account to accept payments from customers.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        {!stripeStatus.connected ? (
          <div>
            {/* Status Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)', 
              border: '1px solid #e5e7eb', 
              borderRadius: 'var(--radius)', 
              padding: '1.5rem', 
              marginBottom: '1.5rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: '#f3f4f6', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className="fas fa-link" style={{ fontSize: '1.25rem', color: '#9ca3af' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#374151' }}>
                    Not Connected
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Connect your Stripe account to start accepting payments
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <i className="fas fa-credit-card" style={{ color: '#635bff', marginTop: '2px' }}></i>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Accept Payments</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Credit cards, debit cards & more</p>
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <i className="fas fa-shield-alt" style={{ color: '#635bff', marginTop: '2px' }}></i>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Secure & PCI Compliant</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Industry-standard security</p>
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <i className="fas fa-university" style={{ color: '#635bff', marginTop: '2px' }}></i>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Automatic Payouts</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Direct to your bank account</p>
                </div>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <i className="fas fa-chart-line" style={{ color: '#635bff', marginTop: '2px' }}></i>
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Transaction Reports</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>Detailed analytics & insights</p>
                </div>
              </div>
            </div>

            {/* Connect Button */}
            <button 
              onClick={handleConnectStripe} 
              style={{ 
                padding: '0.75rem 2rem',
                background: '#635bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
                alt="Stripe" 
                style={{ width: '16px', height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
              Connect Stripe Account
            </button>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.75rem', lineHeight: '1.5' }}>
              You'll be redirected to Stripe to complete the setup process.
            </p>
          </div>
        ) : (
          <div>
            {/* Status Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)', 
              border: `1px solid ${stripeStatus.detailsSubmitted ? '#86efac' : '#fbbf24'}`, 
              borderRadius: 'var(--radius)', 
              padding: '1.5rem', 
              marginBottom: '1.5rem' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: stripeStatus.detailsSubmitted ? '#dcfce7' : '#fef3c7', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className={`fas ${stripeStatus.detailsSubmitted ? 'fa-check-circle' : 'fa-exclamation-triangle'}`} 
                     style={{ fontSize: '1.25rem', color: stripeStatus.detailsSubmitted ? '#16a34a' : '#d97706' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: stripeStatus.detailsSubmitted ? '#16a34a' : '#d97706' }}>
                    {stripeStatus.detailsSubmitted ? 'Connected' : 'Setup Incomplete'}
                  </h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    {stripeStatus.detailsSubmitted 
                      ? 'Your Stripe account is active and ready to receive payments' 
                      : 'Complete your Stripe setup to start accepting payments'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Details Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Account ID</p>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#374151', fontFamily: 'monospace' }}>
                  {stripeStatus.accountId?.slice(0, 12)}...
                </p>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Details Submitted</p>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: stripeStatus.detailsSubmitted ? '#16a34a' : '#dc2626' }}>
                  {stripeStatus.detailsSubmitted ? '✓ Complete' : '✗ Incomplete'}
                </p>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Charges Enabled</p>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: stripeStatus.chargesEnabled ? '#16a34a' : '#dc2626' }}>
                  {stripeStatus.chargesEnabled ? '✓ Enabled' : '✗ Disabled'}
                </p>
              </div>
              <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Payouts Enabled</p>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: stripeStatus.payoutsEnabled ? '#16a34a' : '#dc2626' }}>
                  {stripeStatus.payoutsEnabled ? '✓ Enabled' : '✗ Disabled'}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <button 
              onClick={handleManageStripe}
              style={{ 
                padding: '0.75rem 2rem',
                background: '#635bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-external-link-alt"></i>
              {stripeStatus.detailsSubmitted ? 'Manage Stripe Account' : 'Complete Stripe Setup'}
            </button>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.75rem', lineHeight: '1.5' }}>
              {stripeStatus.detailsSubmitted 
                ? 'View your Stripe dashboard to manage payouts and settings.'
                : 'You\'ll be redirected to Stripe to complete the remaining steps.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StripeSetupPanel;
