import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { showBanner } from '../../../utils/banners';
import { apiGet, apiPost } from '../../../utils/api';
import { buildInvoiceUrl } from '../../../utils/urlHelpers';
import { getBookingStatusConfig } from '../../../utils/bookingStatus';
import BookingDetailsModal from '../BookingDetailsModal';

function ClientBookingsSection({ onPayNow, onOpenChat }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortBy, setSortBy] = useState('eventDate'); // 'eventDate', 'requestedOn', 'vendor'
  const [openActionMenu, setOpenActionMenu] = useState(null); // Track which booking's action menu is open
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [refundPreview, setRefundPreview] = useState(null);

  const loadBookings = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const resp = await apiGet(`/users/${currentUser.id}/bookings/all`);
      
      if (!resp.ok) throw new Error('Failed to fetch bookings');
      const data = await resp.json();
      const bookings = Array.isArray(data) ? data : [];
      
      // Status is now unified from backend - just normalize to lowercase for consistency
      const normalized = bookings.map(b => ({ 
        ...b, 
        _status: ((b.Status || '').toString().toLowerCase()),
        _statusCategory: (b.StatusCategory || '').toString().toLowerCase(),
        _statusLabel: b.StatusLabel || b.Status || 'Unknown'
      }));
      
      setAllBookings(normalized);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Sort bookings based on selected sort option
  const sortBookings = (bookings) => {
    const sorted = [...bookings];
    switch (sortBy) {
      case 'eventDate':
        sorted.sort((a, b) => new Date(b.EventDate || 0) - new Date(a.EventDate || 0));
        break;
      case 'requestedOn':
        sorted.sort((a, b) => new Date(b.CreatedAt || 0) - new Date(a.CreatedAt || 0));
        break;
      case 'vendor':
        sorted.sort((a, b) => (a.VendorName || '').localeCompare(b.VendorName || ''));
        break;
      default:
        sorted.sort((a, b) => new Date(b.EventDate || 0) - new Date(a.EventDate || 0));
    }
    return sorted;
  };

  // Check if event date has passed
  const isEventPast = (booking) => {
    const eventDate = booking.EventDate || booking.eventDate;
    if (!eventDate) return false;
    return new Date(eventDate) < new Date();
  };

  const getFilteredBookings = () => {
    // Use StatusCategory from backend for consistent filtering
    // StatusCategory values: 'pending', 'upcoming', 'completed', 'cancelled', 'declined', 'expired'
    let filtered;
    if (activeTab === 'all') {
      filtered = allBookings;
    } else if (activeTab === 'pending') {
      filtered = allBookings.filter(b => b._statusCategory === 'pending');
    } else if (activeTab === 'accepted') {
      // 'accepted' tab shows upcoming bookings (approved or paid, event not passed)
      filtered = allBookings.filter(b => b._statusCategory === 'upcoming');
    } else if (activeTab === 'completed') {
      filtered = allBookings.filter(b => b._statusCategory === 'completed');
    } else if (activeTab === 'cancelled') {
      filtered = allBookings.filter(b => b._statusCategory === 'cancelled');
    } else if (activeTab === 'declined') {
      filtered = allBookings.filter(b => b._statusCategory === 'declined');
    } else if (activeTab === 'expired') {
      filtered = allBookings.filter(b => b._statusCategory === 'expired');
    } else {
      filtered = allBookings;
    }
    
    return sortBookings(filtered);
  };

  // Get detailed status label for client view - uses shared utility
  const getDetailedStatus = (booking) => {
    return getBookingStatusConfig(booking, false); // false = client view
  };

  const handleShowDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };

  // Handle Pay Now - Navigate to payment section in dashboard
  const handlePayNow = (booking) => {
    if (onPayNow) {
      onPayNow(booking);
    }
  };

  // Handle View Invoice - uses public IDs
  const handleViewInvoice = async (booking) => {
    try {
      if (!currentUser?.id) {
        showBanner('Please log in to view invoice', 'error');
        return;
      }
      
      // Use public ID from booking if available, otherwise use internal ID
      const bookingId = booking.bookingPublicId || booking.BookingID;
      const response = await apiGet(`/invoices/booking/${bookingId}?userId=${currentUser.id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.invoice?.InvoiceID) {
          // Use buildInvoiceUrl to generate public ID URL
          window.open(buildInvoiceUrl(data.invoice.InvoiceID, false), '_blank');
        } else {
          showBanner('Invoice not available yet', 'info');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        showBanner(errorData.message || 'Could not load invoice', 'error');
      }
    } catch (error) {
      console.error('Invoice error:', error);
      showBanner('Failed to load invoice', 'error');
    }
  };

  // Handle Cancel Booking - show modal with refund preview
  const handleCancelBooking = async (booking) => {
    // Use BookingID if available, otherwise use RequestID
    const bookingId = booking.BookingID || booking.RequestID || booking.bookingId || booking.requestId;
    if (!bookingId) {
      showBanner('Unable to cancel: Booking ID not found', 'error');
      return;
    }
    
    setCancellingBooking({ ...booking, _resolvedBookingId: bookingId });
    setShowCancelModal(true);
    setCancelReason('');
    setRefundPreview(null);
    
    // Fetch refund preview
    try {
      const response = await apiGet(`/bookings/${bookingId}/cancel-preview`);
      if (response.ok) {
        const data = await response.json();
        setRefundPreview(data);
      }
    } catch (error) {
      console.error('Error fetching refund preview:', error);
    }
  };

  const confirmCancelBooking = async () => {
    if (!cancellingBooking) return;
    
    const bookingId = cancellingBooking._resolvedBookingId || cancellingBooking.BookingID || cancellingBooking.RequestID;
    if (!bookingId) {
      showBanner('Unable to cancel: Booking ID not found', 'error');
      return;
    }
    
    setCancelling(true);
    try {
      const response = await apiPost(`/bookings/${bookingId}/client-cancel`, { reason: cancelReason });

      if (response.ok) {
        const data = await response.json();
        if (data.refund?.amount > 0) {
          showBanner(`Booking cancelled. Refund of $${data.refund.amount.toFixed(2)} will be processed.`, 'success');
        } else {
          showBanner('Booking cancelled successfully', 'success');
        }
        setShowCancelModal(false);
        setCancellingBooking(null);
        loadBookings();
      } else {
        const error = await response.json();
        showBanner(error.message || 'Failed to cancel booking', 'error');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showBanner('Failed to cancel booking', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Chat - navigate to Messages section and open conversation
  const handleOpenChat = async (booking) => {
    // If no conversation exists, create one first
    if (!booking.ConversationID) {
      try {
        const response = await apiPost('/messages/conversations', {
          userId: currentUser.id,
          vendorProfileId: booking.VendorProfileID,
          subject: `Booking: ${booking.EventName || booking.ServiceName || 'Service Request'}`,
          bookingId: booking.BookingID || booking.RequestID
        });
        
        if (!response.ok) {
          showBanner('Could not start conversation', 'error');
          return;
        }
        
        const data = await response.json();
        booking.ConversationID = data.conversationId;
        loadBookings();
      } catch (error) {
        console.error('Error starting conversation:', error);
        showBanner('Could not start conversation', 'error');
        return;
      }
    }
    
    // Navigate to Messages section with conversation ID
    window.dispatchEvent(new CustomEvent('navigateToMessages', { 
      detail: { 
        conversationId: booking.ConversationID,
        otherPartyName: booking.VendorName
      } 
    }));
  };

  const renderBookingItem = (booking) => {
    const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1 || 
                   booking.PaymentStatus === 'paid' || booking.PaymentStatus === 'completed' ||
                   booking._status === 'paid';
    const isDepositOnly = !isPaid && (booking.DepositPaid === true || booking.DepositPaid === 1);
    const s = booking._status || 'pending';
    
    // Safely parse date - check for valid date
    const rawDate = booking.EventDate || booking.eventDate;
    const eventDate = rawDate ? new Date(rawDate) : null;
    const isValidDate = eventDate && !isNaN(eventDate.getTime());
    
    let month = 'TBD', day = '--', weekday = '', timeStr = 'Time TBD';
    if (isValidDate) {
      month = eventDate.toLocaleDateString('en-US', { month: 'short' });
      day = eventDate.getDate();
      weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Use StartTime/EndTime if available, otherwise fallback to EventDate
      const formatTime = (timeVal) => {
        if (!timeVal) return '';
        const timeStrVal = typeof timeVal === 'string' ? timeVal : timeVal.toString();
        const parts = timeStrVal.split(':');
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
      };
      
      if (booking.StartTime || booking.EndTime) {
        const startFormatted = formatTime(booking.StartTime);
        const endFormatted = formatTime(booking.EndTime);
        timeStr = startFormatted && endFormatted 
          ? `${startFormatted} - ${endFormatted}` 
          : startFormatted || endFormatted;
      } else {
        const startTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const endDateTime = new Date(eventDate.getTime() + 90 * 60000);
        const endTime = endDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        timeStr = `${startTime} - ${endTime}`;
      }
    }

    // Get detailed status
    const statusCfg = getDetailedStatus(booking);

    // Use RequestID for approved requests, BookingID for confirmed bookings
    const itemId = booking.RequestID || booking.BookingID;
    const isMenuOpen = openActionMenu === itemId;

    return (
      <div key={itemId} className="booking-item" style={{ padding: '10px 12px', marginBottom: '8px' }}>
        <div className="booking-date-section" style={{ minWidth: '40px' }}>
          <div className="booking-month">{month}</div>
          <div className="booking-day">{day}</div>
          <div className="booking-weekday">{weekday}</div>
        </div>
        <div className="booking-info" style={{ gap: '2px' }}>
          <div className="booking-client" style={{ gap: '6px', marginBottom: 0 }}>
            <span className="booking-client-name" style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
              {booking.VendorName || 'Vendor'}
            </span>
          </div>
          <div className="booking-service-row">
            <span className="booking-service">{booking.ServiceName || 'Booking'}</span>
          </div>
          {booking.Location && (
            <div className="booking-location-row">
              <i className="fas fa-map-marker-alt" style={{ color: '#6b7280', fontSize: '12px' }}></i>
              <span className="booking-location" style={{ maxWidth: '520px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {booking.Location}
              </span>
            </div>
          )}
          {eventDate && (
            <div className="booking-date-row">
              <i className="fas fa-calendar-alt" style={{ color: '#6b7280', fontSize: '12px' }}></i>
              <span className="booking-date">{eventDate.toLocaleDateString()}</span>
            </div>
          )}
          {timeStr && (
            <div className="booking-time-row">
              <i className="fas fa-clock" style={{ color: '#6b7280', fontSize: '12px' }}></i>
              <span className="booking-time">{timeStr}{booking.Timezone ? ` (${booking.Timezone})` : ''}</span>
            </div>
          )}
          {booking.TotalAmount != null && booking.TotalAmount !== '' && Number(booking.TotalAmount) > 0 && (
            <div className="booking-price-row">
              <i className="fas fa-dollar-sign" style={{ color: '#6b7280', fontSize: '12px' }}></i>
              <span className="booking-price">${Number(booking.TotalAmount).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="booking-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', paddingRight: '10px' }}>
          <div className="status-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div className="request-status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', background: statusCfg.bg, color: statusCfg.color, border: `1px ${statusCfg.borderStyle || 'solid'} ${statusCfg.color}` }}>
              <i className={`fas ${statusCfg.icon}`} style={{ fontSize: '11px' }}></i>
              <span>{statusCfg.label}</span>
            </div>
            {s === 'declined' && booking.DeclineReason && (
              <div style={{ fontSize: '11px', color: '#ef4444', textAlign: 'right', maxWidth: '180px' }}>
                Reason: {booking.DeclineReason}
              </div>
            )}
          </div>
          <div className="actions-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {(s === 'confirmed' || s === 'accepted' || s === 'approved') && !isPaid && (
              <span 
                onClick={() => handlePayNow(booking)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 18px',
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <i className="fas fa-check" style={{ fontSize: '10px' }}></i>
                {isDepositOnly ? 'Pay Balance' : 'Pay Now'}
              </span>
            )}
            {/* Cancel Booking button - only show if event hasn't passed and not already cancelled/completed */}
            {(s === 'pending' || s === 'confirmed' || s === 'accepted' || s === 'approved' || s === 'paid') && 
             !isEventPast(booking) && 
             !['cancelled', 'cancelled_by_client', 'cancelled_by_vendor', 'completed'].includes(s) && (
              <span 
                onClick={() => handleCancelBooking(booking)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  background: 'white',
                  color: '#ef4444',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: '1px solid #fecaca'
                }}
              >
                <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                Cancel
              </span>
            )}
            <span 
              onClick={() => handleShowDetails(booking)} 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 18px', 
                borderRadius: '6px', 
                fontSize: '13px', 
                fontWeight: 500, 
                background: 'white', 
                color: '#374151', 
                border: '1px solid #d1d5db', 
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              More info
            </span>
            {/* Three-dot action menu */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenActionMenu(isMenuOpen ? null : itemId)}
                style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '14px', background: 'white', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer' }}
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
              {isMenuOpen && (
                <div style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '100%', 
                  marginTop: '4px',
                  background: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                  zIndex: 100,
                  minWidth: '150px',
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={() => { handleOpenChat(booking); setOpenActionMenu(null); }}
                    style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'white', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#374151' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <i className="fas fa-comment" style={{ color: '#6b7280', width: '16px' }}></i>
                    Message Vendor
                  </button>
                  {isPaid && (
                    <button
                      onClick={() => { handleViewInvoice(booking); setOpenActionMenu(null); }}
                      style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'white', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#374151', borderTop: '1px solid #f3f4f6' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <i className="fas fa-file-invoice" style={{ color: '#6b7280', width: '16px' }}></i>
                      View Invoice
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div id="bookings-section">
      <BookingDetailsModal 
        isOpen={showDetailsModal} 
        onClose={handleCloseDetails} 
        booking={selectedBooking}
        isVendorView={false}
      />
      
      {/* Cancel Booking Modal */}
      {showCancelModal && cancellingBooking && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '450px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Cancel Booking</h3>
              <button 
                onClick={() => setShowCancelModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#6b7280' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', marginTop: '0.15rem' }}></i>
                <div>
                  <strong style={{ color: '#991b1b' }}>Are you sure you want to cancel?</strong>
                  <p style={{ margin: '0.5rem 0 0', color: '#991b1b', fontSize: '0.9rem' }}>
                    This action cannot be undone. The vendor will be notified of your cancellation.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>
                <strong>Booking:</strong> {cancellingBooking.ServiceName || 'Service'} with {cancellingBooking.VendorName}
              </div>
              {cancellingBooking.EventDate && (
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  <strong>Date:</strong> {new Date(cancellingBooking.EventDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Refund Preview */}
            {refundPreview && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <i className="fas fa-info-circle" style={{ color: '#16a34a' }}></i>
                  <strong style={{ color: '#166534' }}>Refund Information</strong>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#166534' }}>
                  {refundPreview.refundPercent === 100 ? (
                    <p style={{ margin: 0 }}>You will receive a <strong>full refund</strong> of ${refundPreview.refundAmount?.toFixed(2) || '0.00'}</p>
                  ) : refundPreview.refundPercent > 0 ? (
                    <p style={{ margin: 0 }}>Based on the vendor's cancellation policy, you will receive a <strong>{refundPreview.refundPercent}% refund</strong> (${refundPreview.refundAmount?.toFixed(2) || '0.00'})</p>
                  ) : (
                    <p style={{ margin: 0, color: '#dc2626' }}>Based on the vendor's cancellation policy, <strong>no refund</strong> is available at this time.</p>
                  )}
                  {refundPreview.policyType && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                      Policy: {refundPreview.policyType.charAt(0).toUpperCase() + refundPreview.policyType.slice(1)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let the vendor know why you're cancelling..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  color: '#374151'
                }}
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancelBooking}
                disabled={cancelling}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  opacity: cancelling ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {cancelling ? (
                  <><i className="fas fa-spinner fa-spin"></i> Cancelling...</>
                ) : (
                  <><i className="fas fa-times"></i> Cancel Booking</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="dashboard-card">
        <div className="booking-tabs">
          <button 
            className={`booking-tab ${activeTab === 'all' ? 'active' : ''}`} 
            data-tab="all"
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`booking-tab ${activeTab === 'pending' ? 'active' : ''}`} 
            data-tab="pending"
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button 
            className={`booking-tab ${activeTab === 'accepted' ? 'active' : ''}`} 
            data-tab="accepted"
            onClick={() => setActiveTab('accepted')}
          >
            Upcoming
          </button>
          <button 
            className={`booking-tab ${activeTab === 'completed' ? 'active' : ''}`} 
            data-tab="completed"
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
          <button 
            className={`booking-tab ${activeTab === 'cancelled' ? 'active' : ''}`} 
            data-tab="cancelled"
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled
          </button>
          <button 
            className={`booking-tab ${activeTab === 'declined' ? 'active' : ''}`} 
            data-tab="declined"
            onClick={() => setActiveTab('declined')}
          >
            Declined
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : (
          <>
            {/* Sort dropdown - below tabs */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', color: '#374151', background: 'white', cursor: 'pointer' }}
                >
                  <option value="eventDate">Event Date</option>
                  <option value="requestedOn">Requested On</option>
                  <option value="vendor">Vendor Name</option>
                </select>
              </div>
            </div>
            <div className="booking-content">
              <div id={`${activeTab}-bookings`} className="booking-tab-content active">
                <div className="booking-count">
                  {filteredBookings.length} {activeTab === 'pending' ? 'requests' : 'bookings'}
                </div>
                <div id={`${activeTab}-bookings-list`}>
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map(renderBookingItem)
                  ) : (
                    <div className="empty-state">No items.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ClientBookingsSection;
