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

  const getFilteredBookings = () => {
    const acceptedStatuses = new Set(['accepted', 'approved', 'confirmed', 'paid']);
    
    let filtered;
    if (activeTab === 'all') filtered = allBookings;
    else if (activeTab === 'pending') filtered = allBookings.filter(b => b._status === 'pending');
    else if (activeTab === 'approved') filtered = allBookings.filter(b => acceptedStatuses.has(b._status));
    else if (activeTab === 'declined') filtered = allBookings.filter(b => b._status === 'declined');
    else if (activeTab === 'expired') filtered = allBookings.filter(b => b._status === 'expired');
    else filtered = allBookings;
    
    return sortBookings(filtered);
  };

  // Get detailed status label for vendor view
  const getDetailedStatus = (booking) => {
    const s = booking._status;
    const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1;
    const isDepositOnly = !isPaid && (booking.DepositPaid === true || booking.DepositPaid === 1);
    
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

  const handleApproveRequest = async (requestId) => {
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
        loadBookings();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleDeclineRequest = async (requestId) => {
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
        loadBookings();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to decline request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request');
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
      const startTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const endTime = new Date(eventDate.getTime() + 90 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      timeStr = `${startTime} - ${endTime}`;
    }

    // Get detailed status
    const s = booking._status || 'pending';
    const statusCfg = getDetailedStatus(booking);

    // Use RequestID for pending requests, BookingID for confirmed bookings
    const itemId = booking.RequestID || booking.BookingID;
    const isRequest = !!booking.RequestID;
    const isMenuOpen = openActionMenu === itemId;

    return (
      <div key={itemId} className="booking-item">
        <div className="booking-date-section">
          <div className="booking-month">{month}</div>
          <div className="booking-day">{day}</div>
          <div className="booking-weekday">{weekday}</div>
        </div>
        <div className="booking-info">
          <div className="booking-client" style={{ gap: '6px', marginBottom: 0 }}>
            <span className="booking-client-name" style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
              {booking.ClientName || 'Client'}
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
              <i className="fas fa-credit-card" style={{ color: '#6b7280', fontSize: '12px' }}></i>
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
            {s === 'pending' && isRequest && (
              <>
                <button 
                  style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleApproveRequest(booking.RequestID)}
                >
                  <i className="fas fa-check" style={{ fontSize: '11px' }}></i>
                  Approve
                </button>
                <button 
                  style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleDeclineRequest(booking.RequestID)}
                >
                  <i className="fas fa-times" style={{ fontSize: '11px' }}></i>
                  Decline
                </button>
              </>
            )}
            <button 
              className="link-btn" 
              onClick={() => handleShowDetails(booking)} 
              style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, background: 'white', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer' }}
            >
              More info
            </button>
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
      <div className="dashboard-card">
        {/* Sort dropdown */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
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
        <div className="booking-content">
          <div id={`${activeTab}-bookings`} className="booking-tab-content active">
            <div className="booking-count">
              {filteredBookings.length} {activeTab === 'pending' ? 'requests' : 'items'}
            </div>
            <div id={`${activeTab}-bookings-list`}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </div>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map(renderBookingItem)
              ) : (
                <div className="empty-state">No booking requests yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorRequestsSection;
