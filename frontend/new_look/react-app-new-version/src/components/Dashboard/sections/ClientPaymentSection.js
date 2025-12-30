import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_BASE_URL } from '../../../config';

// Canadian province tax rates
const PROVINCE_TAX_RATES = {
  'Alberta': { rate: 5, type: 'GST', label: 'GST 5%' },
  'British Columbia': { rate: 12, type: 'GST+PST', label: 'GST+PST 12%' },
  'Manitoba': { rate: 12, type: 'GST+PST', label: 'GST+PST 12%' },
  'New Brunswick': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Newfoundland and Labrador': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Northwest Territories': { rate: 5, type: 'GST', label: 'GST 5%' },
  'Nova Scotia': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Nunavut': { rate: 5, type: 'GST', label: 'GST 5%' },
  'Ontario': { rate: 13, type: 'HST', label: 'HST 13%' },
  'Prince Edward Island': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Quebec': { rate: 14.975, type: 'GST+QST', label: 'GST+QST 14.975%' },
  'Saskatchewan': { rate: 11, type: 'GST+PST', label: 'GST+PST 11%' },
  'Yukon': { rate: 5, type: 'GST', label: 'GST 5%' }
};

const getTaxInfoForProvince = (province) => {
  const normalizedProvince = Object.keys(PROVINCE_TAX_RATES).find(
    key => key.toLowerCase() === (province || '').toLowerCase()
  );
  return PROVINCE_TAX_RATES[normalizedProvince] || PROVINCE_TAX_RATES['Ontario'];
};

// Checkout Form Component
function CheckoutForm({ onSuccess, onCancel, clientProvince, total }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError('');

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required'
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed. Please try again.');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Verify payment and create booking record on backend
        try {
          const verifyResponse = await fetch(`${API_BASE_URL}/payments/verify-intent?paymentIntentId=${paymentIntent.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok) {
            console.warn('Payment verification warning:', verifyData.message);
          }
        } catch (verifyErr) {
          console.warn('Payment verification error:', verifyErr);
        }
        onSuccess(paymentIntent);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const taxInfo = getTaxInfoForProvince(clientProvince);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount || 0);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement 
        options={{
          layout: 'tabs'
        }}
      />

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          fontSize: '0.875rem',
          marginTop: '1rem'
        }}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        background: 'var(--secondary)',
        borderRadius: '8px',
        color: 'var(--primary)',
        fontSize: '0.85rem',
        marginTop: '1rem'
      }}>
        <i className="fas fa-info-circle"></i>
        <span>Tax calculated based on your location: <strong>{taxInfo.label}</strong></span>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        marginTop: '1.5rem'
      }}>
        <button 
          type="button" 
          onClick={onCancel}
          disabled={isProcessing}
          className="btn btn-outline"
          style={{ flex: 1 }}
        >
          <i className="fas fa-arrow-left"></i> Cancel
        </button>
        <button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="btn btn-primary"
          style={{ 
            flex: 2,
            opacity: (!stripe || isProcessing) ? 0.6 : 1
          }}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Processing...
            </>
          ) : (
            <>
              <i className="fas fa-lock"></i> Pay {formatCurrency(total)}
            </>
          )}
        </button>
      </div>

      {/* Stripe Footer */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.8rem',
        color: 'var(--text-light)'
      }}>
        <i className="fas fa-lock" style={{ color: '#22c55e', fontSize: '0.75rem' }}></i>
        <span>Secured by</span>
        <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" width="40" height="16" style={{ marginLeft: '2px' }}>
          <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.4 10.4 0 0 1-4.56 1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.58zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-5.13L32.37 0v3.77l-4.13.88V.44zm-4.32 9.35v10.22H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.45-3.32.43zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.67-2.99.67-2.98 0-4.26-1.58-4.26-4.29V9.5H9.14V5.57h2.1l.58-3.77 3.54-.75v4.52h3.12V9.5h-3.12v4.99l.01.02zM6.49 13.28c0-4.66-6.4-3.89-6.4-5.6 0-.57.49-.79 1.28-.79.96 0 2.17.32 3.13.89V4.5A10.14 10.14 0 0 0 1.4 3.8C.5 3.8 0 4.55 0 5.8c0 4.54 6.39 3.82 6.39 5.63 0 .68-.59.9-1.42.9-1.23 0-2.81-.5-4.06-1.18v3.32c1.38.59 2.78.92 4.06.92 3.34 0 5.52-1.64 5.52-4.11z"/>
        </svg>
        <span style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem', color: '#94a3b8', fontSize: '1.25rem' }}>
          <i className="fab fa-cc-visa"></i>
          <i className="fab fa-cc-mastercard"></i>
          <i className="fab fa-cc-amex"></i>
        </span>
      </div>
    </form>
  );
}

// Main Payment Section Component
function ClientPaymentSection({ booking, onBack, onPaymentSuccess }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [breakdown, setBreakdown] = useState(null);
  const [clientProvince, setClientProvince] = useState('Ontario');

  useEffect(() => {
    if (!booking) return;

    const initializePayment = async () => {
      setLoading(true);
      setError('');
      setClientSecret('');

      try {
        // Get client's province from their profile first
        let province = 'Ontario';
        
        try {
          const userRes = await fetch(`${API_BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.province || userData.state) {
              province = userData.province || userData.state;
            }
          }
        } catch (e) {
          console.warn('Could not fetch user profile for province:', e);
        }

        setClientProvince(province);

        // Create payment intent with province for tax calculation
        const response = await fetch(`${API_BASE_URL}/payments/payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            bookingId: booking.BookingID || null,
            requestId: booking.RequestID || null,
            vendorProfileId: booking.VendorProfileID,
            amount: booking.TotalAmount,
            currency: 'cad',
            description: `Payment for ${booking.ServiceName || 'Booking'} with ${booking.VendorName || 'Vendor'}`,
            clientProvince: province
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to initialize payment');
        }

        if (!data.clientSecret) {
          throw new Error('No client secret received from server');
        }

        if (data.breakdown) {
          setBreakdown(data.breakdown);
        }

        const configRes = await fetch(`${API_BASE_URL}/payments/config`);
        const configData = await configRes.json();

        if (!configData.publishableKey) {
          throw new Error('Stripe is not configured. Please contact support.');
        }

        const stripe = await loadStripe(configData.publishableKey);
        setStripePromise(stripe);
        setClientSecret(data.clientSecret);

      } catch (err) {
        console.error('Payment initialization error:', err);
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [booking]);

  const handleSuccess = (paymentIntent) => {
    onPaymentSuccess?.(paymentIntent);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount || 0);
  };

  if (!booking) {
    return (
      <div>
        <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Bookings
        </button>
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: '#d97706', marginBottom: '1rem' }}></i>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text)' }}>No Booking Selected</h3>
          <p style={{ color: 'var(--text-light)', margin: 0 }}>Please select a booking to proceed with payment.</p>
        </div>
      </div>
    );
  }

  const taxInfo = getTaxInfoForProvince(clientProvince);
  const subtotal = breakdown?.subtotal || booking?.TotalAmount || 0;
  const taxAmount = breakdown?.tax || (subtotal * taxInfo.rate / 100);
  const platformFee = breakdown?.platformFee || 0;
  const processingFee = breakdown?.processingFee || 0;
  const total = breakdown?.total || (subtotal + taxAmount + platformFee + processingFee);

  return (
    <div>
      {/* Back Button */}
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Bookings
      </button>

      {/* Main Card */}
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-credit-card"></i>
          </span>
          Payment
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Complete your payment for this booking.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
          {/* Left - Booking Summary */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-receipt" style={{ color: 'var(--primary)' }}></i>
              Booking Summary
            </h3>

            {/* Booking Info Card */}
            <div style={{
              background: 'var(--secondary)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
                {booking?.VendorName || 'Vendor'}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                {booking?.ServiceName || 'Booking'}
              </div>
              {booking?.EventDate && (
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--text-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)'
                }}>
                  <i className="fas fa-calendar" style={{ color: 'var(--primary)' }}></i>
                  {new Date(booking.EventDate).toLocaleDateString('en-CA', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-light)' }}>Subtotal</span>
                <span style={{ color: 'var(--text)' }}>{formatCurrency(subtotal)}</span>
              </div>
              {platformFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>Platform Fee</span>
                  <span style={{ color: 'var(--text)' }}>{formatCurrency(platformFee)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-light)' }}>Tax ({taxInfo.label})</span>
                <span style={{ color: 'var(--text)' }}>{formatCurrency(taxAmount)}</span>
              </div>
              {processingFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-light)' }}>Processing Fee</span>
                  <span style={{ color: 'var(--text)' }}>{formatCurrency(processingFee)}</span>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                marginTop: '0.5rem',
                borderTop: '2px solid var(--border)'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Total</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Right - Payment Form */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fas fa-lock" style={{ color: 'var(--primary)' }}></i>
              Payment Details
            </h3>

            {loading ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '3rem',
                color: 'var(--text-light)'
              }}>
                <div className="spinner" style={{ marginBottom: '1rem' }}></div>
                <p style={{ margin: 0 }}>Initializing secure payment...</p>
              </div>
            ) : error ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: '2rem', 
                textAlign: 'center',
                background: '#fef2f2',
                borderRadius: '12px'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#dc2626', marginBottom: '1rem' }}></i>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text)' }}>Payment Error</h4>
                <p style={{ color: 'var(--text-light)', margin: '0 0 1rem', fontSize: '0.9rem' }}>{error}</p>
                <button className="btn btn-outline" onClick={onBack}>
                  <i className="fas fa-arrow-left"></i> Back to Bookings
                </button>
              </div>
            ) : clientSecret && stripePromise ? (
              <Elements 
                stripe={stripePromise} 
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#5e72e4',
                      colorBackground: '#ffffff',
                      colorText: '#2d3748',
                      colorDanger: '#dc2626',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                      borderRadius: '8px',
                      spacingUnit: '4px'
                    },
                    rules: {
                      '.Input': {
                        border: '1px solid #e2e8f0',
                        boxShadow: 'none'
                      },
                      '.Input:focus': {
                        border: '1px solid #5e72e4',
                        boxShadow: '0 0 0 1px #5e72e4'
                      },
                      '.Label': {
                        fontWeight: '500',
                        marginBottom: '6px'
                      }
                    }
                  }
                }}
              >
                <CheckoutForm 
                  onSuccess={handleSuccess}
                  onCancel={onBack}
                  clientProvince={clientProvince}
                  total={total}
                />
              </Elements>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: '2rem', 
                textAlign: 'center',
                background: '#fef3c7',
                borderRadius: '12px'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#d97706', marginBottom: '1rem' }}></i>
                <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text)' }}>Unable to Load Payment</h4>
                <p style={{ color: 'var(--text-light)', margin: '0 0 1rem', fontSize: '0.9rem' }}>Please try again later.</p>
                <button className="btn btn-outline" onClick={onBack}>
                  <i className="fas fa-arrow-left"></i> Back to Bookings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientPaymentSection;
