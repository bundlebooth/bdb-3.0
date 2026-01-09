import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { PageLayout } from '../components/PageWrapper';
import { buildInvoiceUrl } from '../utils/urlHelpers';
import './PaymentSuccessPage.css';

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [bookingDetails, setBookingDetails] = useState(null);
  const [error, setError] = useState(null);

  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    const verifyPayment = async () => {
      // Check if session_id is the placeholder (page accessed directly, not via Stripe)
      const isPlaceholder = !sessionId || sessionId === '{CHECKOUT_SESSION_ID}' || sessionId.includes('CHECKOUT_SESSION_ID');
      
      if (isPlaceholder) {
        // If we have a booking_id, try to fetch booking status directly using the payments endpoint (no access control)
        if (bookingId) {
          try {
            const statusResp = await fetch(`${API_BASE_URL}/payments/booking/${bookingId}/status`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (statusResp.ok) {
              const statusData = await statusResp.json();
              
              // Check if booking is already paid
              if (statusData.isPaid || statusData.status === 'confirmed' || statusData.status === 'paid') {
                setBookingDetails(statusData.booking);
                setStatus('success');
                return;
              }
            }
          } catch (e) {
            console.warn('Could not fetch booking status:', e);
          }
        }
        
        setStatus('error');
        setError('This page must be accessed after completing payment through Stripe. Please check your booking status in the dashboard.');
        return;
      }

      try {
        // Verify the session with the backend
        const response = await fetch(
          `${API_BASE_URL}/payments/verify-session?session_id=${encodeURIComponent(sessionId)}${bookingId ? `&booking_id=${bookingId}` : ''}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }
        );

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          
          // Use booking details from verify-session response
          if (data.booking) {
            setBookingDetails(data.booking);
          }
        } else {
          setStatus('error');
          setError(data.message || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('error');
        setError('Unable to verify payment. Please check your booking status in the dashboard.');
      }
    };

    verifyPayment();
  }, [sessionId, bookingId, currentUser]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (status === 'verifying') {
    return (
      <div className="payment-success-page">
        <div className="payment-card verifying">
          <div className="spinner-large"></div>
          <h2>Verifying Payment...</h2>
          <p>Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="payment-success-page">
        <div className="payment-card error">
          <div className="icon-circle error">
            <i className="fas fa-times"></i>
          </div>
          <h2>Payment Verification Issue</h2>
          <p>{error}</p>
          <div className="action-buttons">
            <Link to="/dashboard?section=bookings" className="btn-primary">
              View My Bookings
            </Link>
            <button onClick={() => navigate(-1)} className="btn-secondary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout variant="narrow" pageClassName="payment-success-page-layout">
      <div className="payment-success-page">
      <div className="payment-card success">
        <div className="icon-circle success">
          <i className="fas fa-check"></i>
        </div>
        <h2>Payment Successful!</h2>
        <p className="success-message">
          Thank you for your payment. Your booking has been confirmed.
        </p>

        {bookingDetails && (
          <div className="booking-summary">
            <h3>Booking Details</h3>
            <div className="summary-grid">
              {bookingDetails.VendorName && (
                <div className="summary-item">
                  <span className="label">Vendor</span>
                  <span className="value">{bookingDetails.VendorName}</span>
                </div>
              )}
              {bookingDetails.ServiceName && (
                <div className="summary-item">
                  <span className="label">Service</span>
                  <span className="value">{bookingDetails.ServiceName}</span>
                </div>
              )}
              {bookingDetails.EventDate && (
                <div className="summary-item">
                  <span className="label">Event Date</span>
                  <span className="value">{formatDate(bookingDetails.EventDate)}</span>
                </div>
              )}
              {bookingDetails.EventLocation && (
                <div className="summary-item">
                  <span className="label">Location</span>
                  <span className="value">{bookingDetails.EventLocation}</span>
                </div>
              )}
              {bookingDetails.TotalAmount && (
                <div className="summary-item total">
                  <span className="label">Amount Paid</span>
                  <span className="value">{formatCurrency(bookingDetails.TotalAmount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="confirmation-note">
          <i className="fas fa-envelope"></i>
          <p>A confirmation email with your invoice has been sent to your email address.</p>
        </div>

        <div className="action-buttons">
          <Link to="/dashboard?section=bookings" className="btn-primary">
            View My Bookings
          </Link>
          {(bookingDetails?.BookingID || bookingDetails?.bookingPublicId || bookingId) && (
            <Link 
              to={buildInvoiceUrl(bookingDetails?.BookingID || bookingId, true)} 
              className="btn-secondary"
            >
              View Invoice
            </Link>
          )}
          <Link to="/" className="btn-outline">
            Back to Home
          </Link>
        </div>

        <div className="support-note">
          <p>
            Questions about your booking? 
            <button onClick={() => {
              // Open messaging widget
              const event = new CustomEvent('openMessagingWidget', { detail: { view: 'support' } });
              window.dispatchEvent(event);
            }} className="link-btn">
              Contact Support
            </button>
          </p>
        </div>
      </div>
      </div>
    </PageLayout>
  );
}

export default PaymentSuccessPage;
