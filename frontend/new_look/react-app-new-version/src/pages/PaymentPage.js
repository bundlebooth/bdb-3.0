import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { decodeBookingId, isPublicId } from '../utils/hashIds';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { getProvinceFromLocation, getTaxInfoForProvince } from '../utils/taxCalculations';
import { PageLayout } from '../components/PageWrapper';
import Header from '../components/Header';
import './PaymentPage.css';

function CheckoutForm({ onSuccess, onCancel, clientProvince, total, isProcessing, setIsProcessing }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');

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
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        try {
          await apiGet(`/payments/verify-intent?paymentIntentId=${paymentIntent.id}`);
        } catch (verifyErr) {
          console.error('Payment verification error:', verifyErr);
        }
        onSuccess(paymentIntent);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  const taxInfo = getTaxInfoForProvince(clientProvince);

  return (
    <form onSubmit={handleSubmit} className="payment-checkout-form">
      <div className="payment-element-wrapper">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && (
        <div className="payment-error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="payment-tax-info">
        <i className="fas fa-info-circle"></i>
        <span>Tax calculated based on event location: <strong>{taxInfo.label}</strong></span>
      </div>

      <div className="payment-form-actions">
        <button 
          type="button" 
          onClick={onCancel}
          disabled={isProcessing}
          className="btn btn-outline payment-btn-cancel"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Cancel</span>
        </button>
        <button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="btn btn-primary payment-btn-submit"
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <i className="fas fa-lock"></i>
              <span>Pay {formatCurrency(total)}</span>
            </>
          )}
        </button>
      </div>

      <div className="payment-secure-footer">
        <div className="secure-badge">
          <i className="fas fa-lock"></i>
          <span>Secured by</span>
          <span className="stripe-text">Stripe</span>
        </div>
        <div className="payment-cards">
          <i className="fab fa-cc-visa"></i>
          <i className="fab fa-cc-mastercard"></i>
          <i className="fab fa-cc-amex"></i>
        </div>
      </div>
    </form>
  );
}

function PaymentPage() {
  const { bookingId: encodedBookingId } = useParams();
  
  // Decode the booking ID from URL (supports both encoded and plain numeric IDs)
  const bookingId = isPublicId(encodedBookingId) 
    ? decodeBookingId(encodedBookingId) 
    : parseInt(encodedBookingId, 10);
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [breakdown, setBreakdown] = useState(null);
  const [clientProvince, setClientProvince] = useState('Ontario');
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !currentUser) {
      sessionStorage.setItem('postLoginRedirect', `/payment/${bookingId}`);
      navigate('/', { state: { showLogin: true } });
    }
  }, [currentUser, authLoading, navigate, bookingId]);

  // Load booking data
  useEffect(() => {
    if (!currentUser?.id || !bookingId) return;

    const loadBookingAndInitPayment = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch all bookings and find the one we need
        const resp = await apiGet(`/users/${currentUser.id}/bookings/all`);
        if (!resp.ok) throw new Error('Failed to fetch bookings');
        
        const bookings = await resp.json();
        const foundBooking = bookings.find(b => 
          String(b.BookingID) === String(bookingId) || 
          String(b.RequestID) === String(bookingId) ||
          String(b.bookingPublicId) === String(bookingId)
        );

        if (!foundBooking) {
          throw new Error('Booking not found');
        }

        setBooking(foundBooking);

        // Get province from event location
        const eventLocation = foundBooking.EventLocation || foundBooking.Location || '';
        const province = getProvinceFromLocation(eventLocation);
        setClientProvince(province);

        // Create payment intent - use GrandTotal from stored values, NOT TotalAmount
        // The frontend calculated and stored these values, so use them directly
        const amountToCharge = foundBooking.GrandTotal || foundBooking.TotalAmount || 0;
        
        const paymentResp = await apiPost('/payments/payment-intent', {
          bookingId: foundBooking.BookingID || null,
          requestId: foundBooking.RequestID || null,
          vendorProfileId: foundBooking.VendorProfileID,
          amount: amountToCharge,
          currency: 'cad',
          description: `Payment for ${foundBooking.ServiceName || 'Booking'} with ${foundBooking.VendorName || 'Vendor'}`,
          clientProvince: province,
          // Pass stored breakdown values to avoid recalculation
          subtotal: foundBooking.Subtotal,
          platformFee: foundBooking.PlatformFee,
          taxAmount: foundBooking.TaxAmount,
          taxPercent: foundBooking.TaxPercent,
          taxLabel: foundBooking.TaxLabel,
          processingFee: foundBooking.ProcessingFee,
          grandTotal: foundBooking.GrandTotal
        });

        const paymentData = await paymentResp.json();
        if (!paymentResp.ok) throw new Error(paymentData.message || 'Failed to initialize payment');
        if (!paymentData.clientSecret) throw new Error('No client secret received');

        if (paymentData.breakdown) {
          setBreakdown(paymentData.breakdown);
        }

        // Load Stripe
        const configRes = await apiGet('/payments/config');
        const configData = await configRes.json();
        if (!configData.publishableKey) throw new Error('Stripe is not configured');

        const stripe = await loadStripe(configData.publishableKey);
        setStripePromise(stripe);
        setClientSecret(paymentData.clientSecret);

      } catch (err) {
        console.error('Payment page error:', err);
        setError(err.message || 'Failed to load payment');
      } finally {
        setLoading(false);
      }
    };

    loadBookingAndInitPayment();
  }, [currentUser, bookingId]);

  const handleSuccess = (paymentIntent) => {
    navigate(`/payment-success?payment_intent=${paymentIntent.id}&booking_id=${bookingId}`);
  };

  const handleCancel = () => {
    navigate('/dashboard?section=bookings');
  };

  if (authLoading) {
    return (
      <div className="payment-page-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  // Use stored values from booking record - NO recalculation
  // Priority: breakdown from payment-intent response > stored booking values > fallback
  const taxInfo = getTaxInfoForProvince(clientProvince);
  const subtotal = breakdown?.subtotal || booking?.Subtotal || booking?.TotalAmount || 0;
  const taxAmount = breakdown?.tax || booking?.TaxAmount || 0;
  const platformFee = breakdown?.platformFee || booking?.PlatformFee || 0;
  const processingFee = breakdown?.processingFee || booking?.ProcessingFee || 0;
  const total = breakdown?.total || booking?.GrandTotal || (subtotal + taxAmount + platformFee + processingFee);

  const formatTime = (t) => {
    if (!t) return '';
    const parts = t.toString().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <PageLayout variant="fullWidth" pageClassName="payment-page-layout">
      <Header 
        onSearch={() => {}}
        onProfileClick={() => {}}
        onWishlistClick={() => {}}
        onChatClick={() => {}}
        onNotificationsClick={() => {}}
      />
      <div className="payment-page">
        <div className="page-wrapper">
          <div className="payment-page-container">
          {/* Page Header */}
          <div className="payment-page-header">
            <button className="payment-back-btn" onClick={handleCancel}>
              <i className="fas fa-arrow-left"></i>
              <span>Back to Bookings</span>
            </button>
            <h1 className="payment-page-title">
              <i className="fas fa-lock"></i>
              Complete Secure Payment
            </h1>
          </div>

          {loading ? (
            <div className="payment-loading-state">
              <div className="spinner"></div>
              <p>Loading payment details...</p>
            </div>
          ) : error ? (
            <div className="payment-error-state">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Unable to Load Payment</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={handleCancel}>
                Back to Bookings
              </button>
            </div>
          ) : booking ? (
            <div className="payment-content-grid">
              {/* Left Column - Booking Summary */}
              <div className="payment-summary-card">
                <h2 className="payment-card-title">Booking Summary</h2>
                
                {/* Vendor Info */}
                <div className="payment-vendor-info">
                  <div className="vendor-avatar">
                    {booking.VendorLogo ? (
                      <img src={booking.VendorLogo} alt={booking.VendorName} />
                    ) : (
                      <i className="fas fa-store"></i>
                    )}
                  </div>
                  <div className="vendor-details">
                    <h3>{booking.VendorName || 'Vendor'}</h3>
                    <span>{booking.ServiceCategory || booking.ServiceName || 'Service'}</span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="payment-event-info">
                  <div className="event-detail">
                    <i className="fas fa-calendar-alt"></i>
                    <span>
                      {booking.EventDate ? new Date(booking.EventDate).toLocaleDateString('en-CA', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'Date TBD'}
                    </span>
                  </div>
                  
                  {(booking.StartTime || booking.EventTime) && (
                    <div className="event-detail">
                      <i className="fas fa-clock"></i>
                      <span>
                        {formatTime(booking.StartTime || booking.EventTime)}
                        {booking.EndTime && ` → ${formatTime(booking.EndTime)}`}
                      </span>
                    </div>
                  )}
                  
                  {booking.AttendeeCount && (
                    <div className="event-detail">
                      <i className="fas fa-users"></i>
                      <span>{booking.AttendeeCount} guests</span>
                    </div>
                  )}
                  
                  {(booking.EventLocation || booking.Location) && (
                    <div className="event-detail">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{booking.EventLocation || booking.Location}</span>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="payment-price-section">
                  <div className="price-row">
                    <span>{booking.ServiceName || 'Service'}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="price-divider"></div>
                  
                  <div className="price-row subtotal">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {platformFee > 0 && (
                    <div className="price-row fee">
                      <span>Platform Service Fee</span>
                      <span>{formatCurrency(platformFee)}</span>
                    </div>
                  )}
                  
                  <div className="price-row fee">
                    <span>Tax ({taxInfo.label})</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  
                  {processingFee > 0 && (
                    <div className="price-row fee">
                      <span>Payment Processing Fee</span>
                      <span>{formatCurrency(processingFee)}</span>
                    </div>
                  )}
                  
                  <div className="price-divider thick"></div>
                  
                  <div className="price-row total">
                    <span>Total</span>
                    <span className="total-amount">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Payment Form */}
              <div className="payment-form-card">
                <h2 className="payment-card-title">
                  <i className="fas fa-lock"></i>
                  Payment Details
                </h2>
                
                {clientSecret && stripePromise ? (
                  <Elements 
                    stripe={stripePromise} 
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#222222',
                          colorBackground: '#ffffff',
                          colorText: '#222222',
                          colorTextSecondary: '#6b7280',
                          colorDanger: '#dc2626',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          fontSizeBase: '15px',
                          borderRadius: '6px',
                          spacingUnit: '4px'
                        },
                        rules: {
                          '.Input': {
                            border: '1px solid #e5e7eb',
                            boxShadow: 'none',
                            padding: '12px 14px',
                            backgroundColor: '#ffffff'
                          },
                          '.Input:focus': {
                            border: '1px solid #222222',
                            boxShadow: '0 0 0 1px #222222',
                            outline: 'none'
                          },
                          '.Input--invalid': {
                            border: '1px solid #dc2626',
                            boxShadow: 'none'
                          },
                          '.Label': {
                            fontWeight: '500',
                            marginBottom: '6px',
                            fontSize: '14px',
                            color: '#222222'
                          },
                          '.Tab': {
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            boxShadow: 'none'
                          },
                          '.Tab:hover': {
                            backgroundColor: '#f9fafb',
                            border: '1px solid #d1d5db'
                          },
                          '.Tab--selected': {
                            border: '1px solid #222222',
                            backgroundColor: '#ffffff',
                            boxShadow: 'none',
                            color: '#222222'
                          },
                          '.TabLabel': {
                            color: '#374151'
                          },
                          '.TabLabel--selected': {
                            color: '#222222',
                            fontWeight: '600'
                          },
                          '.TabIcon': {
                            fill: '#6b7280'
                          },
                          '.TabIcon--selected': {
                            fill: '#222222'
                          },
                          '.Error': {
                            fontSize: '13px',
                            color: '#dc2626'
                          }
                        }
                      }
                    }}
                  >
                    <CheckoutForm 
                      onSuccess={handleSuccess}
                      onCancel={handleCancel}
                      clientProvince={clientProvince}
                      total={total}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </Elements>
                ) : (
                  <div className="payment-loading-state">
                    <div className="spinner"></div>
                    <p>Initializing secure payment...</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default PaymentPage;
