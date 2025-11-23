import React from 'react';

function ClientDashboardSection({ data, loading, onSectionChange }) {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const day = now.getDate();
  const year = now.getFullYear();
  const weekday = now.toLocaleString('en-US', { weekday: 'long' });

  const upcomingCount = data?.upcomingBookings?.length || 0;
  const pendingRequests = data?.pendingRequests || 0;
  const favorites = data?.favoritesCount || 0;
  const unreadMessages = data?.unreadMessages || 0;

  const handleKPIClick = (section, kpi) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  const renderBookingItem = (booking) => {
    const eventDate = new Date(booking.EventDate);
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
    const day = eventDate.getDate();
    const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
    const startTime = eventDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const endTime = new Date(eventDate.getTime() + 90 * 60000).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });

    return (
      <div key={booking.BookingRequestId} className="booking-item">
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
            <span className="booking-time">{startTime} - {endTime}</span>
          </div>
          {booking.TotalAmount && (
            <div className="booking-price-row">
              <i className="fas fa-dollar-sign" style={{ color: '#6b7280', fontSize: '12px' }}></i>
              <span className="booking-price">${Number(booking.TotalAmount).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="booking-actions">
          {booking.Status === 'confirmed' && (
            <button className="btn-pay-now">Pay Now</button>
          )}
        </div>
      </div>
    );
  };

  const renderMessageItem = (message) => {
    return (
      <div key={message.id} className="message-preview-item">
        <div className="preview-avatar">
          {message.from.substring(0, 2).toUpperCase()}
        </div>
        <div className="preview-content">
          <div className="preview-name">{message.from}</div>
          <div className="preview-message">{message.message}</div>
          <div className="preview-time">{message.date}</div>
        </div>
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
      <div className="vendor-stats" id="client-stats">
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
            {data?.recentMessages && data.recentMessages.length > 0 ? (
              data.recentMessages.map(renderMessageItem)
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
