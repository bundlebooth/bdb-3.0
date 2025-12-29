import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { showBanner } from '../../../utils/banners';
import { API_BASE_URL } from '../../../config';
import { buildInvoiceUrl } from '../../../utils/urlHelpers';

function ClientBookingsSection({ onPayNow }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDetails, setExpandedDetails] = useState({});

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
      
      // Normalize status and sort by date
      const normalized = bookings.map(b => ({ 
        ...b, 
        _status: ((b.Status || '').toString().toLowerCase()) 
      }));
      normalized.sort((a, b) => new Date(a.EventDate) - new Date(b.EventDate));
      
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

  const getFilteredBookings = () => {
    const acceptedStatuses = new Set(['accepted', 'approved', 'confirmed', 'paid']);
    
    if (activeTab === 'all') return allBookings;
    if (activeTab === 'pending') return allBookings.filter(b => b._status === 'pending');
    if (activeTab === 'accepted') return allBookings.filter(b => acceptedStatuses.has(b._status));
    if (activeTab === 'declined') return allBookings.filter(b => b._status === 'declined');
    if (activeTab === 'expired') return allBookings.filter(b => b._status === 'expired');
    return allBookings;
  };

  const toggleDetails = (bookingId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
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
      // Use public ID from booking if available, otherwise use internal ID
      const bookingId = booking.bookingPublicId || booking.BookingID;
      const response = await fetch(`${API_BASE_URL}/invoices/booking/${bookingId}`, {
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
        showBanner('Could not load invoice', 'error');
      }
    } catch (error) {
      console.error('Invoice error:', error);
      showBanner('Failed to load invoice', 'error');
    }
  };

  const renderBookingItem = (booking) => {
    const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1 || booking._status === 'paid';
    const isDepositOnly = !isPaid && (booking.DepositPaid === true || booking.DepositPaid === 1);
    
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

    // Status badge
    const s = booking._status || 'pending';
    const statusMap = {
      pending:  { icon: 'fa-clock', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', label: 'Pending' },
      confirmed:{ icon: 'fa-check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Confirmed' },
      accepted: { icon: 'fa-check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Accepted' },
      approved: { icon: 'fa-check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Accepted' },
      paid:     { icon: 'fa-check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Paid' },
      cancelled:{ icon: 'fa-times-circle', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'Cancelled' },
      declined: { icon: 'fa-times-circle', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'Declined' }
    };
    const status = isPaid ? 'paid' : s;
    const statusCfg = statusMap[status] || statusMap.pending;

    const isExpanded = expandedDetails[booking.BookingID];

    return (
      <div key={booking.BookingID} className="booking-item has-details">
        <div className="booking-date-section">
          <div className="booking-month">{month}</div>
          <div className="booking-day">{day}</div>
          <div className="booking-weekday">{weekday}</div>
        </div>
        <div className="booking-info">
          <div className="booking-client" style={{ gap: '6px', marginBottom: 0 }}>
            <span className="booking-client-name" style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
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
          {booking.TotalAmount && (
            <div className="booking-price-row">
              <i className="fas fa-dollar-sign" style={{ color: '#6b7280', fontSize: '12px' }}></i>
              <span className="booking-price">${Number(booking.TotalAmount).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="booking-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', paddingRight: '10px' }}>
          <div className="status-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', margin: '8px 10px 8px 0', padding: '2px 0' }}>
            <div className="request-status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', background: statusCfg.bg, color: '#111827', border: `1px solid ${statusCfg.color}` }}>
              <i className={`fas ${statusCfg.icon}`} style={{ color: statusCfg.color }}></i>
              <span>{statusCfg.label}</span>
            </div>
          </div>
          <button className="link-btn" onClick={() => toggleDetails(booking.BookingID)} style={{ marginTop: '2px' }}>
            {isExpanded ? 'Less info' : 'More info'}
          </button>
          <div className="actions-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {(s === 'confirmed' || s === 'accepted' || s === 'approved') && !isPaid && (
              <button 
                className="btn-pay-now" 
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }}
                onClick={() => handlePayNow(booking)}
              >
                {isDepositOnly ? 'Pay Balance' : 'Pay Now'}
              </button>
            )}
            {(s === 'confirmed' || s === 'accepted' || s === 'approved' || isPaid) && (
              <>
                {booking.ConversationID && (
                  <button className="btn btn-outline" style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }}>
                    Chat
                  </button>
                )}
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }}
                  onClick={() => handleViewInvoice(booking)}
                >
                  Invoice
                </button>
              </>
            )}
          </div>
        </div>
        {isExpanded && (
          <div className="request-details" style={{ gridColumn: '1 / -1', padding: '1rem', background: '#f9fafb', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {booking.EventName && (
                <div className="request-detail-row">
                  <span className="request-detail-label">Event Name</span>
                  <span className="request-detail-value">{booking.EventName}</span>
                </div>
              )}
              {booking.EventType && (
                <div className="request-detail-row">
                  <span className="request-detail-label">Event</span>
                  <span className="request-detail-value">{booking.EventType}</span>
                </div>
              )}
              {booking.AttendeeCount && (
                <div className="request-detail-row">
                  <span className="request-detail-label">Attendees</span>
                  <span className="request-detail-value">{booking.AttendeeCount}</span>
                </div>
              )}
              {booking.SpecialRequests && (
                <div className="request-detail-row" style={{ gridColumn: 'span 2' }}>
                  <span className="request-detail-label">Special Requests</span>
                  <span className="request-detail-value">{booking.SpecialRequests}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div id="bookings-section">
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
                <div className="empty-state">No items.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientBookingsSection;
