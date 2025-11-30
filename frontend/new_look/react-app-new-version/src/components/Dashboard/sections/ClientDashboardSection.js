import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config';
import { useAuth } from '../../../context/AuthContext';

function ClientDashboardSection({ data, loading, onSectionChange }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const day = now.getDate();
  const year = now.getFullYear();
  const weekday = now.toLocaleString('en-US', { weekday: 'long' });

  const upcomingCount = Array.isArray(data?.upcomingBookings) ? data.upcomingBookings.length : 0;
  const pendingRequests = data?.pendingRequests || 0;
  const favorites = data?.favoritesCount || 0;
  const unreadMessages = data?.unreadMessages || 0;

  const handleKPIClick = (section, kpi) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  // Load messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentUser?.id) return;
      setLoadingMessages(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/messages/conversations/user/${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (resp.ok) {
          const msgData = await resp.json();
          const conversations = (msgData.conversations || []).map(conv => ({
            id: conv.id || conv.ConversationID,
            name: conv.OtherPartyName || conv.userName || 'Unknown',
            last: conv.lastMessageContent || conv.LastMessageContent || '',
            ts: new Date(conv.lastMessageCreatedAt || conv.LastMessageCreatedAt || conv.createdAt || Date.now())
          })).sort((a,b) => b.ts - a.ts);
          setMessages(conversations.slice(0, 5));
        }
      } catch (e) {
        console.error('Failed to load messages:', e);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [currentUser]);

  const renderBookingItem = (booking) => {
    const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1;
    const isDepositOnly = !isPaid && (booking.DepositPaid === true || booking.DepositPaid === 1);
    const eventDate = new Date(booking.EventDate);
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
    const day = eventDate.getDate();
    const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
    const startTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = new Date(eventDate.getTime() + 90 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const timeStr = `${startTime} - ${endTime}`;

    let actionButtons = '';
    if (booking.Status === 'confirmed') {
      if (isPaid) {
        actionButtons = '<button class="btn-paid">✓ Paid</button>';
      } else if (isDepositOnly) {
        actionButtons = `<button class="btn-pay-now">Pay Balance</button>`;
      } else {
        actionButtons = '<button class="btn-pay-now">Pay Now</button>';
      }
    } else if ((booking.Status || '').toString().toLowerCase() === 'paid') {
      actionButtons = '<button class="btn-paid">✓ Paid</button>';
    }
    if (booking.Status === 'confirmed' || (booking.Status || '').toString().toLowerCase() === 'paid') {
      actionButtons += '<a href="#" class="link-btn" style="margin-left: 10px;">Invoice</a>';
    }

    return (
      <div key={booking.BookingID || booking.BookingRequestId} className="booking-item">
        <div className="booking-date-section">
          <div className="booking-month">{month}</div>
          <div className="booking-day">{day}</div>
          <div className="booking-weekday">{weekday}</div>
        </div>
        <div className="booking-info">
          <div className="booking-client">
            <i className="fas fa-store" style={{ color: '#6b7280', fontSize: '12px' }}></i>
            <span className="booking-client-name">{booking.VendorName || 'Vendor'}</span>
          </div>
          <div className="booking-service-row">
            <span className="booking-service">{booking.ServiceName || 'Confirmed Booking'}</span>
          </div>
          <div className="booking-time-row">
            <i className="fas fa-clock" style={{ color: '#6b7280', fontSize: '12px' }}></i>
            <span className="booking-time">{timeStr}</span>
          </div>
          {booking.TotalAmount && (
            <div className="booking-price-row">
              <i className="fas fa-dollar-sign" style={{ color: '#6b7280', fontSize: '12px' }}></i>
              <span className="booking-price">${Number(booking.TotalAmount).toLocaleString()}</span>
            </div>
          )}
          {booking.Location && (
            <div className="booking-location-row">
              <i className="fas fa-map-marker-alt" style={{ color: '#6b7280', fontSize: '12px' }}></i>
              <span className="booking-location">{booking.Location}</span>
            </div>
          )}
        </div>
        <div className="booking-actions" dangerouslySetInnerHTML={{ __html: actionButtons }}></div>
      </div>
    );
  };

  const renderMessageItem = (message) => {
    const initials = (message.name || 'U').trim().charAt(0).toUpperCase();
    const timeStr = message.ts ? message.ts.toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
    
    return (
      <div 
        key={message.id} 
        className="message-preview-item"
        onClick={() => handleKPIClick('messages')}
        style={{ cursor: 'pointer' }}
      >
        <div className="preview-avatar">{initials}</div>
        <div className="preview-content">
          <div className="preview-name">{message.name}</div>
          <div className="preview-snippet">{message.last}</div>
        </div>
        <div className="preview-time">{timeStr}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div id="dashboard-section">
        <div className="vendor-stats">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard-section">
      <div className="vendor-stats stats-top-grid" id="client-stats">
        <div className="kpi-grid two-col">
          <div 
            className="kpi-card kpi-click" 
            data-target="bookings" 
            data-kpi="upcoming"
            onClick={() => handleKPIClick('bookings', 'upcoming')}
            style={{ cursor: 'pointer' }}
          >
            <div className="kpi-icon bookings">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{upcomingCount}</div>
              <div className="kpi-label">Upcoming Bookings</div>
            </div>
          </div>
          <div 
            className="kpi-card kpi-click" 
            data-target="bookings" 
            data-kpi="pending"
            onClick={() => handleKPIClick('bookings', 'pending')}
            style={{ cursor: 'pointer' }}
          >
            <div className="kpi-icon requests">
              <i className="fas fa-paper-plane"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{pendingRequests}</div>
              <div className="kpi-label">Pending Requests</div>
            </div>
          </div>
          <div 
            className="kpi-card kpi-click" 
            data-target="favorites" 
            data-kpi="favorites"
            onClick={() => handleKPIClick('favorites', 'favorites')}
            style={{ cursor: 'pointer' }}
          >
            <div className="kpi-icon favorites">
              <i className="fas fa-heart"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{favorites}</div>
              <div className="kpi-label">Favorites Saved</div>
            </div>
          </div>
          <div 
            className="kpi-card kpi-click" 
            data-target="messages" 
            data-kpi="messages"
            onClick={() => handleKPIClick('messages', 'messages')}
            style={{ cursor: 'pointer' }}
          >
            <div className="kpi-icon messages">
              <i className="fas fa-envelope"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{unreadMessages}</div>
              <div className="kpi-label">Unread Messages</div>
            </div>
          </div>
        </div>
        <div className="kpi-card calendar-tile full-height" id="client-mini-calendar">
          <div className="cal-header">{month} {year}</div>
          <div className="cal-body">
            <div className="cal-day">{weekday}</div>
            <div className="cal-date">{day}</div>
          </div>
        </div>
      </div>
      <div className="overview-grid">
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Recent Bookings</h2>
          <div id="upcoming-bookings" className="dashboard-fixed-list">
            {data?.upcomingBookings && data.upcomingBookings.length > 0 ? (
              data.upcomingBookings.slice(0, 3).map(renderBookingItem)
            ) : (
              <div className="empty-state">No upcoming bookings.</div>
            )}
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-title-row">
            <h2 className="dashboard-card-title">Recent Messages</h2>
            <button 
              className="btn btn-outline" 
              id="open-all-messages-btn-client" 
              style={{ padding: '.5rem .9rem' }}
              onClick={() => handleKPIClick('messages')}
            >
              Open Messages
            </button>
          </div>
          <div id="client-recent-messages" className="message-preview-list dashboard-fixed-list">
            {loadingMessages ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map(renderMessageItem)
            ) : (
              <div className="empty-state">No recent messages.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboardSection;
