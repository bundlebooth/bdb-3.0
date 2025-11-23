import React from 'react';

function VendorDashboardSection({ data, loading, onSectionChange }) {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const day = now.getDate();
  const year = now.getFullYear();
  const weekday = now.toLocaleString('en-US', { weekday: 'long' });

  const totalBookings = data?.totalBookings || 0;
  const pendingRequests = data?.pendingRequests || 0;
  const totalRevenue = data?.totalRevenue || 0;
  const unreadMessages = data?.unreadMessages || 0;

  const handleKPIClick = (section) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  if (loading) {
    return (
      <div id="vendor-dashboard-section">
        <div className="vendor-stats">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="vendor-dashboard-section">
      <div className="vendor-stats" id="vendor-stats">
        <div className="kpi-grid two-col">
          <div 
            className="kpi-card kpi-click" 
            onClick={() => handleKPIClick('vendor-requests')}
            style={{ cursor: 'pointer' }}
          >
            <div className="kpi-icon bookings">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{totalBookings}</div>
              <div className="kpi-label">Total Bookings</div>
            </div>
          </div>
          <div 
            className="kpi-card kpi-click" 
            onClick={() => handleKPIClick('vendor-requests')}
            style={{ cursor: 'pointer' }}
          >
            <div className="kpi-icon requests">
              <i className="fas fa-clock"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{pendingRequests}</div>
              <div className="kpi-label">Pending Requests</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon revenue">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="kpi-content">
              <div className="kpi-value">${totalRevenue.toLocaleString()}</div>
              <div className="kpi-label">Total Revenue</div>
            </div>
          </div>
          <div 
            className="kpi-card kpi-click" 
            onClick={() => handleKPIClick('vendor-messages')}
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
        <div className="kpi-card calendar-tile full-height">
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
          <div id="vendor-recent-bookings" className="dashboard-fixed-list">
            {data?.recentBookings && data.recentBookings.length > 0 ? (
              data.recentBookings.map(booking => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-info">
                    <div className="booking-client-name">{booking.clientName}</div>
                    <div className="booking-service">{booking.serviceName}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No recent bookings.</div>
            )}
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-title-row">
            <h2 className="dashboard-card-title">Recent Messages</h2>
            <button 
              className="btn btn-outline" 
              style={{ padding: '.5rem .9rem' }}
              onClick={() => handleKPIClick('vendor-messages')}
            >
              Open Messages
            </button>
          </div>
          <div id="vendor-recent-messages" className="message-preview-list dashboard-fixed-list">
            {data?.recentMessages && data.recentMessages.length > 0 ? (
              data.recentMessages.map(msg => (
                <div key={msg.id} className="message-preview-item">
                  <div className="preview-avatar">
                    {msg.from.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="preview-content">
                    <div className="preview-name">{msg.from}</div>
                    <div className="preview-message">{msg.message}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No recent messages.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboardSection;
