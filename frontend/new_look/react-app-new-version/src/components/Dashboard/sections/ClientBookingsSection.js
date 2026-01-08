import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { showBanner } from '../../../utils/banners';
import { API_BASE_URL } from '../../../config';
import { buildInvoiceUrl } from '../../../utils/urlHelpers';
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

  const loadBookings = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/users/${currentUser.id}/bookings/all`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!resp.ok) throw new Error('Failed to fetch bookings');
      const data = await resp.json();
      const bookings = Array.isArray(data) ? data : [];
      
      // Normalize status
      const normalized = bookings.map(b => ({ 
        ...b, 
        _status: ((b.Status || '').toString().toLowerCase()) 
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

  const getFilteredBookings = () => {
    const acceptedStatuses = new Set(['accepted', 'approved', 'confirmed', 'paid']);
    
    let filtered;
    if (activeTab === 'all') filtered = allBookings;
    else if (activeTab === 'pending') filtered = allBookings.filter(b => b._status === 'pending');
    else if (activeTab === 'accepted') filtered = allBookings.filter(b => acceptedStatuses.has(b._status));
    else if (activeTab === 'declined') filtered = allBookings.filter(b => b._status === 'declined');
    else if (activeTab === 'expired') filtered = allBookings.filter(b => b._status === 'expired');
    else filtered = allBookings;
    
    return sortBookings(filtered);
  };

  // Get detailed status label for client view
  const getDetailedStatus = (booking) => {
    const s = booking._status;
    const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1 || 
                   booking.PaymentStatus === 'paid' || booking.PaymentStatus === 'completed' ||
                   booking._status === 'paid';
    const isDepositOnly = !isPaid && (booking.DepositPaid === true || booking.DepositPaid === 1);
    
    if (isPaid) {
      return { label: 'Paid', icon: 'fa-check-circle', color: '#10b981', borderStyle: 'solid' };
    }
    if (s === 'pending') {
      return { label: 'Awaiting Vendor Approval', icon: 'fa-clock', color: '#f59e0b', borderStyle: 'dashed' };
    }
    if (s === 'confirmed' || s === 'accepted' || s === 'approved') {
      if (isDepositOnly) {
        return { label: 'Balance Due', icon: 'fa-hourglass-half', color: '#8b5cf6', borderStyle: 'dashed' };
      }
      return { label: 'Approved', icon: 'fa-check', color: '#10b981', borderStyle: 'dashed' };
    }
    if (s === 'declined') {
      return { label: 'Declined by Vendor', icon: 'fa-times-circle', color: '#ef4444', borderStyle: 'dashed' };
    }
    if (s === 'expired') {
      return { label: 'Expired', icon: 'fa-clock', color: '#6b7280', borderStyle: 'dashed' };
    }
    if (s === 'cancelled') {
      return { label: 'Cancelled', icon: 'fa-times-circle', color: '#ef4444', borderStyle: 'dashed' };
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
      const response = await fetch(`${API_BASE_URL}/invoices/booking/${bookingId}?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
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
            vendorProfileId: booking.VendorProfileID,
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
      const startTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const endTime = new Date(eventDate.getTime() + 90 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      timeStr = `${startTime} - ${endTime}`;
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
              <span className="booking-time">{timeStr}</span>
            </div>
          )}
          {booking.TotalAmount != null && booking.TotalAmount !== '' && (
            <div className="booking-price-row">
              <i className="fas fa-dollar-sign" style={{ color: '#6b7280', fontSize: '12px' }}></i>
              <span className="booking-price">${Number(booking.TotalAmount).toLocaleString()}</span>
            </div>
          )}
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
      />
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
            Accepted
          </button>
          <button 
            className={`booking-tab ${activeTab === 'declined' ? 'active' : ''}`} 
            data-tab="declined"
            onClick={() => setActiveTab('declined')}
          >
            Declined
          </button>
          <button 
            className={`booking-tab ${activeTab === 'expired' ? 'active' : ''}`} 
            data-tab="expired"
            onClick={() => setActiveTab('expired')}
          >
            Expired
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
