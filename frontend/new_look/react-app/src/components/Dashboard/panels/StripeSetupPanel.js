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
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/stripe-status`, {
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
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/stripe-onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
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
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/stripe-dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.open(data.url, '_blank');
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
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fab fa-stripe"></i>
          </span>
          Stripe Payment Setup
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Connect your Stripe account to receive payments from clients.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        {!stripeStatus.connected ? (
          <div>
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                margin: '0 auto 1.5rem', 
                borderRadius: '50%', 
                background: '#635bff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <i className="fab fa-stripe" style={{ fontSize: '2.5rem', color: 'white' }}></i>
              </div>
              <h3 style={{ marginBottom: '1rem' }}>Connect with Stripe</h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                Stripe is a secure payment processor that allows you to accept credit cards, debit cards, and other payment methods. 
                Setting up takes just a few minutes.
              </p>
              <button className="btn btn-primary" onClick={handleConnectStripe} style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
                <i className="fab fa-stripe" style={{ marginRight: '0.5rem' }}></i>
                Connect Stripe Account
              </button>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: 'var(--radius)' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Why connect Stripe?</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-light)' }}>
                <li style={{ marginBottom: '0.5rem' }}>Accept payments directly through the platform</li>
                <li style={{ marginBottom: '0.5rem' }}>Secure and PCI-compliant payment processing</li>
                <li style={{ marginBottom: '0.5rem' }}>Automatic payouts to your bank account</li>
                <li style={{ marginBottom: '0.5rem' }}>Support for multiple payment methods</li>
                <li>Detailed transaction reporting</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ padding: '2rem', background: '#f0fdf4', borderRadius: 'var(--radius)', border: '1px solid #86efac', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '2rem', color: '#16a34a' }}></i>
                <div>
                  <h3 style={{ margin: 0, color: '#16a34a' }}>Stripe Connected</h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#15803d', fontSize: '0.9rem' }}>
                    Your Stripe account is active and ready to receive payments
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', borderRadius: 'var(--radius)' }}>
                <span style={{ fontWeight: 500 }}>Account ID:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-light)' }}>{stripeStatus.accountId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', borderRadius: 'var(--radius)' }}>
                <span style={{ fontWeight: 500 }}>Details Submitted:</span>
                <span style={{ color: stripeStatus.detailsSubmitted ? '#16a34a' : '#dc2626' }}>
                  {stripeStatus.detailsSubmitted ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', borderRadius: 'var(--radius)' }}>
                <span style={{ fontWeight: 500 }}>Charges Enabled:</span>
                <span style={{ color: stripeStatus.chargesEnabled ? '#16a34a' : '#dc2626' }}>
                  {stripeStatus.chargesEnabled ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', borderRadius: 'var(--radius)' }}>
                <span style={{ fontWeight: 500 }}>Payouts Enabled:</span>
                <span style={{ color: stripeStatus.payoutsEnabled ? '#16a34a' : '#dc2626' }}>
                  {stripeStatus.payoutsEnabled ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleManageStripe}>
              <i className="fas fa-external-link-alt" style={{ marginRight: '0.5rem' }}></i>
              Manage Stripe Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StripeSetupPanel;
