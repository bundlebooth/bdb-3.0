import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/banners';
import { buildInvoiceUrl } from '../../../utils/urlHelpers';
import BookingDetailsModal from '../BookingDetailsModal';

function VendorRequestsSection() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorProfileId, setVendorProfileId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortBy, setSortBy] = useState('eventDate'); // 'eventDate', 'requestedOn', 'client'
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [processingAction, setProcessingAction] = useState(null); // Track which button is processing: 'approve-{id}' or 'decline-{id}'
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Fetch vendor profile ID first
  useEffect(() => {
    getVendorProfileId();
  }, [currentUser]);

  // Load bookings when vendorProfileId is available
  useEffect(() => {
    if (vendorProfileId) {
      loadBookings();
    }
  }, [vendorProfileId]);

  const getVendorProfileId = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    
    // First check if vendorProfileId is already on currentUser
    if (currentUser?.vendorProfileId) {
      setVendorProfileId(currentUser.vendorProfileId);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/profile?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVendorProfileId(data.vendorProfileId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error getting vendor profile:', error);
      setLoading(false);
    }
  };

  const loadBookings = useCallback(async () => {
    if (!vendorProfileId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/bookings/all`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch bookings');
      }
      
      const data = await resp.json();
      const bookings = Array.isArray(data) ? data : [];
      
      // Normalize status
      const normalized = bookings.map(b => ({ 
        ...b, 
        _status: ((b.Status || '').toString().toLowerCase()) 
      }))
      
      setAllBookings(normalized);
    } catch (error) {
      console.error('Error loading vendor bookings:', error);
      setAllBookings([]);
    } finally {
      setLoading(false);
    }
  }, [vendorProfileId]);

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
      case 'client':
        sorted.sort((a, b) => (a.ClientName || '').localeCompare(b.ClientName || ''));
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
    const acceptedStatuses = new Set(['accepted', 'approved', 'confirmed', 'paid']);
    const cancelledStatuses = new Set(['cancelled', 'cancelled_by_client', 'cancelled_by_vendor', 'cancelled_by_admin']);
    
    let filtered;
    if (activeTab === 'all') {
      filtered = allBookings;
    } else if (activeTab === 'pending') {
      filtered = allBookings.filter(b => b._status === 'pending' && !isEventPast(b));
    } else if (activeTab === 'approved') {
      filtered = allBookings.filter(b => acceptedStatuses.has(b._status) && !isEventPast(b) && !cancelledStatuses.has(b._status));
    } else if (activeTab === 'completed') {
      filtered = allBookings.filter(b => b._status === 'completed' || (acceptedStatuses.has(b._status) && isEventPast(b)));
    } else if (activeTab === 'cancelled') {
      filtered = allBookings.filter(b => cancelledStatuses.has(b._status));
    } else if (activeTab === 'declined') {
      filtered = allBookings.filter(b => b._status === 'declined');
    } else {
      filtered = allBookings;
    }
    
    return sortBookings(filtered);
  };

  // Get detailed status label for vendor view
  const getDetailedStatus = (booking) => {
    const s = booking._status;
    const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1;
    const isDepositOnly = !isPaid && (booking.DepositPaid === true || booking.DepositPaid === 1);
    const eventPast = isEventPast(booking);
    
    // Completed - event has passed
    if (s === 'completed' || (eventPast && (isPaid || s === 'confirmed' || s === 'accepted' || s === 'approved'))) {
      return { label: 'Completed', icon: 'fa-check-double', color: '#059669', borderStyle: 'solid' };
    }
    // Cancelled statuses
    if (s === 'cancelled' || s === 'cancelled_by_client' || s === 'cancelled_by_vendor' || s === 'cancelled_by_admin') {
      return { label: 'Cancelled', icon: 'fa-times-circle', color: '#ef4444', borderStyle: 'solid' };
    }
    if (isPaid) {
      return { label: 'Paid', icon: 'fa-check-circle', color: '#10b981', borderStyle: 'solid' };
    }
    if (s === 'pending') {
      return { label: 'Awaiting Your Approval', icon: 'fa-clock', color: '#f59e0b', borderStyle: 'dashed' };
    }
    if (s === 'confirmed' || s === 'accepted' || s === 'approved') {
      if (isDepositOnly) {
        return { label: 'Awaiting Client Balance', icon: 'fa-credit-card', color: '#3b82f6', borderStyle: 'dashed' };
      }
      return { label: 'Awaiting Client Payment', icon: 'fa-credit-card', color: '#3b82f6', borderStyle: 'dashed' };
    }
    if (s === 'declined') {
      return { label: 'Declined', icon: 'fa-times-circle', color: '#ef4444', borderStyle: 'dashed' };
    }
    if (s === 'expired') {
      return { label: 'Expired', icon: 'fa-clock', color: '#6b7280', borderStyle: 'dashed' };
    }
    return { label: 'Pending', icon: 'fa-clock', color: '#f59e0b', borderStyle: 'dashed' };
  };

  const handleShowDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };

  const handleApproveRequest = async (requestId) => {
    setProcessingAction(`approve-${requestId}`);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ vendorProfileId })
      });
      
      if (response.ok) {
        // Update the booking status locally without full reload
        setAllBookings(prev => prev.map(b => 
          b.RequestID === requestId ? { ...b, _status: 'approved', Status: 'approved' } : b
        ));
        showBanner('Request approved successfully', 'success');
      } else {
        const data = await response.json();
        showBanner(data.message || 'Failed to approve request', 'error');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      showBanner('Failed to approve request', 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    setProcessingAction(`decline-${requestId}`);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/requests/${requestId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ vendorProfileId })
      });
      
      if (response.ok) {
        // Update the booking status locally without full reload
        setAllBookings(prev => prev.map(b => 
          b.RequestID === requestId ? { ...b, _status: 'declined', Status: 'declined' } : b
        ));
        showBanner('Request declined', 'info');
      } else {
        const data = await response.json();
        showBanner(data.message || 'Failed to decline request', 'error');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      showBanner('Failed to decline request', 'error');
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle Vendor Cancel Booking - full refund to client
  const handleCancelBooking = (booking) => {
    const bookingId = booking.BookingID || booking.RequestID;
    if (!bookingId) {
      showBanner('Unable to cancel: Booking ID not found', 'error');
      return;
    }
    setCancellingBooking({ ...booking, _resolvedBookingId: bookingId });
    setShowCancelModal(true);
    setCancelReason('');
  };

  const confirmCancelBooking = async () => {
    if (!cancellingBooking) return;
    
    const bookingId = cancellingBooking._resolvedBookingId;
    if (!bookingId) {
      showBanner('Unable to cancel: Booking ID not found', 'error');
      return;
    }
    
    setCancelling(true);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/vendor-cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: cancelReason, vendorProfileId })
      });

      if (response.ok) {
        const data = await response.json();
        showBanner('Booking cancelled. Full refund issued to client.', 'success');
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

  // Handle View Invoice - uses public IDs
  const handleViewInvoice = async (booking) => {
    try {
      if (!currentUser?.id) {
        showBanner('Please log in to view invoice', 'error');
        return;
      }
      
      const bookingId = booking.bookingPublicId || booking.BookingID;
      const response = await fetch(`${API_BASE_URL}/invoices/booking/${bookingId}?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.invoice?.InvoiceID) {
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

  // Handle Chat - navigate to Messages section and open conversation
  const handleOpenChat = async (booking) => {
    // If no conversation exists, create one first
    if (!booking.ConversationID) {
      try {
        const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: currentUser.id,
            vendorProfileId: vendorProfileId,
            clientUserId: booking.ClientUserID,
            subject: `Booking: ${booking.EventName || booking.ServiceName || 'Service Request'}`,
            bookingId: booking.BookingID || booking.RequestID
          })
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
        otherPartyName: booking.ClientName
      } 
    }));
  };

  const renderBookingItem = (booking) => {
    const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1 || booking._status === 'paid';
    const isDepositOnly = !isPaid && (booking.DepositPaid === true || booking.DepositPaid === 1);
    const eventDate = booking.EventDate ? new Date(booking.EventDate) : null;
    
    let month = '', day = '', weekday = '', timeStr = '';
    if (eventDate) {
      month = eventDate.toLocaleDateString('en-US', { month: 'short' });
      day = eventDate.getDate();
      weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Use StartTime and EndTime from the booking if available
      if (booking.StartTime || booking.EndTime) {
        const formatTime = (timeVal) => {
          if (!timeVal) return '';
          // Handle time string format (HH:MM:SS.nnnnnnn or HH:MM:SS or HH:MM)
          const timeStr = typeof timeVal === 'string' ? timeVal : timeVal.toString();
          const parts = timeStr.split(':');
          const hours = parseInt(parts[0], 10) || 0;
          const minutes = parseInt(parts[1], 10) || 0;
          const hour12 = hours % 12 || 12;
          const ampm = hours >= 12 ? 'PM' : 'AM';
          return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
        };
        const startTimeFormatted = formatTime(booking.StartTime);
        const endTimeFormatted = formatTime(booking.EndTime);
        timeStr = startTimeFormatted && endTimeFormatted 
          ? `${startTimeFormatted} - ${endTimeFormatted}` 
          : startTimeFormatted || endTimeFormatted;
      } else {
        // Fallback to event date time
        const startTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        timeStr = startTime;
      }
    }

    // Get detailed status
    const s = booking._status || 'pending';
    const statusCfg = getDetailedStatus(booking);

    // Use RequestID for pending requests, BookingID for confirmed bookings
    const itemId = booking.RequestID || booking.BookingID;
    const isRequest = !!booking.RequestID;
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
              {booking.ClientName || 'Client'}
            </span>
          </div>
          <div className="booking-service-row">
            <span className="booking-service">
              {(() => {
                // Parse ServicesJson to show all services
                if (booking.ServicesJson) {
                  try {
                    const services = typeof booking.ServicesJson === 'string' 
                      ? JSON.parse(booking.ServicesJson) 
                      : booking.ServicesJson;
                    if (Array.isArray(services) && services.length > 0) {
                      return services.map(s => s.name || s.ServiceName || s.serviceName).filter(Boolean).join(', ') || booking.ServiceName || 'Booking';
                    }
                  } catch (e) { /* fallback to ServiceName */ }
                }
                return booking.ServiceName || 'Booking';
              })()}
            </span>
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
              <span className="booking-time">{timeStr}</span>
            </div>
          )}
          {(booking.TotalAmount != null && booking.TotalAmount !== '' && Number(booking.TotalAmount) > 0) || (booking.Budget != null && booking.Budget !== '' && Number(booking.Budget) > 0) ? (
            <div className="booking-price-row">
              <i className="fas fa-dollar-sign" style={{ color: '#6b7280', fontSize: '12px' }}></i>
              <span className="booking-price">${Number(booking.TotalAmount || booking.Budget || 0).toLocaleString()}</span>
            </div>
          ) : null}
        </div>
        <div className="booking-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', paddingRight: '10px' }}>
          <div className="status-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div className="request-status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', background: `${statusCfg.color}10`, color: '#111827', border: `1px ${statusCfg.borderStyle || 'solid'} ${statusCfg.color}` }}>
              <i className={`fas ${statusCfg.icon}`} style={{ color: statusCfg.color }}></i>
              <span>{statusCfg.label}</span>
            </div>
            {s === 'declined' && booking.DeclineReason && (
              <div style={{ fontSize: '11px', color: '#ef4444', textAlign: 'right', maxWidth: '180px' }}>
                Reason: {booking.DeclineReason}
              </div>
            )}
          </div>
          <div className="actions-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {s === 'pending' && isRequest && (
              <>
                <span 
                  onClick={() => !processingAction && handleApproveRequest(booking.RequestID)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '7px 18px',
                    background: processingAction === `approve-${booking.RequestID}` ? '#059669' : '#10b981',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: processingAction ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    opacity: processingAction && processingAction !== `approve-${booking.RequestID}` ? 0.6 : 1,
                    minWidth: '90px'
                  }}
                >
                  {processingAction === `approve-${booking.RequestID}` ? (
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '12px' }}></i>
                  ) : (
                    <>
                      <i className="fas fa-check" style={{ fontSize: '10px' }}></i>
                      Approve
                    </>
                  )}
                </span>
                <span 
                  onClick={() => !processingAction && handleDeclineRequest(booking.RequestID)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '7px 18px',
                    background: processingAction === `decline-${booking.RequestID}` ? '#dc2626' : '#ef4444',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: processingAction ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    opacity: processingAction && processingAction !== `decline-${booking.RequestID}` ? 0.6 : 1,
                    minWidth: '85px'
                  }}
                >
                  {processingAction === `decline-${booking.RequestID}` ? (
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '12px' }}></i>
                  ) : (
                    <>
                      <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                      Decline
                    </>
                  )}
                </span>
              </>
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
                    Message Client
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
            {/* Cancel button - only for active bookings that haven't passed */}
            {(s === 'confirmed' || s === 'accepted' || s === 'approved' || s === 'paid') && 
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
          </div>
        </div>
      </div>
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div id="vendor-requests-section">
      <BookingDetailsModal 
        isOpen={showDetailsModal} 
        onClose={handleCloseDetails} 
        booking={selectedBooking} 
      />
      
      {/* Cancel Booking Modal - Vendor gets full refund warning */}
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
                    As the vendor, cancelling this booking will issue a <strong>full refund</strong> to the client.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>
                <strong>Booking:</strong> {cancellingBooking.ServiceName || 'Service'} for {cancellingBooking.ClientName || 'Client'}
              </div>
              {cancellingBooking.EventDate && (
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  <strong>Date:</strong> {new Date(cancellingBooking.EventDate).toLocaleDateString()}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
                Reason for cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Let the client know why you're cancelling..."
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
                  <><i className="fas fa-times"></i> Cancel & Refund</>
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
            className={`booking-tab ${activeTab === 'approved' ? 'active' : ''}`} 
            data-tab="approved"
            onClick={() => setActiveTab('approved')}
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
                  <option value="client">Client Name</option>
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
                    <div className="empty-state">No booking requests yet.</div>
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

export default VendorRequestsSection;
