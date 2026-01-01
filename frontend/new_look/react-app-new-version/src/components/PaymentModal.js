import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { API_BASE_URL } from '../config';
import { showBanner } from '../utils/helpers';
import './PaymentModal.css';

// Canadian province tax rates (2024)
const PROVINCE_TAX_RATES = {
  'Alberta': { rate: 5, type: 'GST', label: 'GST 5%' },
  'British Columbia': { rate: 12, type: 'GST+PST', label: 'GST 5% + PST 7%' },
  'Manitoba': { rate: 12, type: 'GST+PST', label: 'GST 5% + PST 7%' },
  'New Brunswick': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Newfoundland and Labrador': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Northwest Territories': { rate: 5, type: 'GST', label: 'GST 5%' },
  'Nova Scotia': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Nunavut': { rate: 5, type: 'GST', label: 'GST 5%' },
  'Ontario': { rate: 13, type: 'HST', label: 'HST 13%' },
  'Prince Edward Island': { rate: 15, type: 'HST', label: 'HST 15%' },
  'Quebec': { rate: 14.975, type: 'GST+QST', label: 'GST 5% + QST 9.975%' },
  'Saskatchewan': { rate: 11, type: 'GST+PST', label: 'GST 5% + PST 6%' },
  'Yukon': { rate: 5, type: 'GST', label: 'GST 5%' }
};

// Get tax info for a province
export function getTaxInfoForProvince(province) {
  const normalized = province?.trim();
  return PROVINCE_TAX_RATES[normalized] || { rate: 13, type: 'HST', label: 'HST 13%' }; // Default to Ontario HST
}

// Checkout Form Component (inside Elements provider)
function CheckoutForm({ booking, onSuccess, onCancel, clientProvince }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?booking_id=${booking.BookingID}`,
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded without redirect
        // Verify the payment on the backend
        try {
          await fetch(`${API_BASE_URL}/payments/verify-intent?payment_intent=${paymentIntent.id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
        } catch (verifyErr) {
          console.warn('Verify intent call failed, webhook will handle it:', verifyErr);
        }
        
        showBanner('Payment successful!', 'success');
        onSuccess(paymentIntent);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // 3D Secure or other action required - Stripe will handle redirect
        setErrorMessage('Additional authentication required. Please complete the verification.');
      } else {
        setErrorMessage('Payment status unknown. Please check your booking status.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  const taxInfo = getTaxInfoForProvince(clientProvince);

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-element-container">
        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />
      </div>

      {errorMessage && (
        <div className="payment-error">
          <i className="fas fa-exclamation-circle"></i>
          {errorMessage}
        </div>
      )}

      <div className="payment-tax-notice">
        <i className="fas fa-info-circle"></i>
        <span>Tax calculated for {clientProvince || 'your location'}: {taxInfo.label}</span>
      </div>

      <div className="payment-actions">
        <button 
          type="button" 
          className="btn btn-outline" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Processing...
            </>
          ) : (
            <>
              <i className="fas fa-lock"></i>
              Pay Now
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Main Payment Modal Component
function PaymentModal({ isOpen, onClose, booking, onPaymentSuccess }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [breakdown, setBreakdown] = useState(null);
  const [clientProvince, setClientProvince] = useState('Ontario');

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !booking) return;

    const initializePayment = async () => {
      setLoading(true);
      setError('');
      setClientSecret('');

      try {
        // Get client's province from their profile or booking first
        let province = booking.ClientProvince || booking.Province || 'Ontario';
        
        // Try to get from user profile (non-blocking)
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
            bookingId: booking.BookingID,
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

        // Set breakdown if available
        if (data.breakdown) {
          setBreakdown(data.breakdown);
        }

        // Get Stripe config and publishable key
        const configRes = await fetch(`${API_BASE_URL}/payments/config`);
        const configData = await configRes.json();

        if (!configData.publishableKey) {
          throw new Error('Stripe is not configured. Please contact support.');
        }

        // Load Stripe
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
  }, [isOpen, booking]);

  const handleSuccess = (paymentIntent) => {
    onPaymentSuccess?.(paymentIntent);
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount || 0);
  };

  if (!isOpen) return null;

  const taxInfo = getTaxInfoForProvince(clientProvince);
  
  // Calculate fallback values if breakdown not available from API
  const subtotal = breakdown?.subtotal || booking?.TotalAmount || 0;
  const taxAmount = breakdown?.tax || (subtotal * taxInfo.rate / 100);
  const platformFee = breakdown?.platformFee || 0;
  const processingFee = breakdown?.processingFee || 0;
  const total = breakdown?.total || (subtotal + taxAmount + platformFee + processingFee);

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>
            <i className="fas fa-credit-card"></i>
            Complete Payment
          </h2>
          <span className="close-btn" onClick={onClose}>&times;</span>
        </div>

        <div className="payment-modal-body">
          <div className="payment-modal-inner">
          {/* Booking Summary */}
          <div className="payment-summary">
            <h3><i className="fas fa-receipt"></i> Booking Summary</h3>
            <div className="summary-item">
              <span className="label">Service:</span>
              <span className="value">{booking?.ServiceName || 'Booking'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Vendor:</span>
              <span className="value">{booking?.VendorName || 'Vendor'}</span>
            </div>
            {booking?.EventDate && (
              <div className="summary-item">
                <span className="label">Event Date:</span>
                <span className="value">
                  {new Date(booking.EventDate).toLocaleDateString('en-CA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
            
            <hr />

            {/* Price Breakdown */}
            <div className="price-breakdown">
              <div className="breakdown-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {platformFee > 0 && (
                <div className="breakdown-row">
                  <span>Platform Fee</span>
                  <span>{formatCurrency(platformFee)}</span>
                </div>
              )}
              <div className="breakdown-row">
                <span>Tax ({taxInfo.label})</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              {processingFee > 0 && (
                <div className="breakdown-row">
                  <span>Processing Fee</span>
                  <span>{formatCurrency(processingFee)}</span>
                </div>
              )}
              <div className="breakdown-row total">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="payment-form-container">
            {loading ? (
              <div className="payment-loading">
                <div className="spinner"></div>
                <p>Initializing secure payment...</p>
              </div>
            ) : error ? (
              <div className="payment-error-state">
                <i className="fas fa-exclamation-triangle"></i>
                <p>{error}</p>
                <button className="btn btn-outline" onClick={onClose}>
                  Close
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
                      colorDanger: '#ff6b6b',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                      borderRadius: '12px'
                    }
                  }
                }}
              >
                <CheckoutForm 
                  booking={booking}
                  onSuccess={handleSuccess}
                  onCancel={onClose}
                  clientProvince={clientProvince}
                />
              </Elements>
            ) : (
              <div className="payment-error-state">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Unable to load payment form</p>
                <button className="btn btn-outline" onClick={onClose}>
                  Close
                </button>
              </div>
            )}
          </div>
          </div>
        </div>

        <div className="payment-modal-footer">
          <div className="secure-badge">
            <i className="fas fa-lock"></i>
            <span>Secured by</span>
            <svg className="stripe-logo" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" width="50" height="20">
              <path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.4 10.4 0 0 1-4.56 1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.58zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-5.13L32.37 0v3.77l-4.13.88V.44zm-4.32 9.35v10.22H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.45-3.32.43zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.67-2.99.67-2.98 0-4.26-1.58-4.26-4.29V9.5H9.14V5.57h2.1l.58-3.77 3.54-.75v4.52h3.12V9.5h-3.12v4.99l.01.02zM6.49 13.28c0-4.66-6.4-3.89-6.4-5.6 0-.57.49-.79 1.28-.79.96 0 2.17.32 3.13.89V4.5A10.14 10.14 0 0 0 1.4 3.8C.5 3.8 0 4.55 0 5.8c0 4.54 6.39 3.82 6.39 5.63 0 .68-.59.9-1.42.9-1.23 0-2.81-.5-4.06-1.18v3.32c1.38.59 2.78.92 4.06.92 3.34 0 5.52-1.64 5.52-4.11z"/>
            </svg>
          </div>
          <div className="payment-methods">
            <i className="fab fa-cc-visa"></i>
            <i className="fab fa-cc-mastercard"></i>
            <i className="fab fa-cc-amex"></i>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
