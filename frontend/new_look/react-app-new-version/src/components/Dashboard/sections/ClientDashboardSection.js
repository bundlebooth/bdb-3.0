import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import { apiGet } from '../../../utils/api';

function ClientDashboardSection({ data, loading, onSectionChange, onPayNow }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
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

  // Load bookings from the same endpoint as Bookings page
  useEffect(() => {
    const loadBookings = async () => {
      if (!currentUser?.id) return;
      setLoadingBookings(true);
      try {
        const resp = await apiGet(`/users/${currentUser.id}/bookings/all`);
        if (resp.ok) {
          const data = await resp.json();
          const bookings = Array.isArray(data) ? data : [];
          // Normalize status like Bookings page does
          const normalized = bookings.map(b => ({ 
            ...b, 
            Status: b.Status || 'pending'
          }));
          // Sort by event date and take first 5
          normalized.sort((a, b) => new Date(b.EventDate || 0) - new Date(a.EventDate || 0));
          setRecentBookings(normalized.slice(0, 5));
        }
      } catch (e) {
        console.error('Failed to load bookings:', e);
      } finally {
        setLoadingBookings(false);
      }
    };
    loadBookings();
  }, [currentUser]);

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
          const conversations = (msgData.conversations || []).map(conv => {
            const rawTs = conv.lastMessageCreatedAt || conv.LastMessageCreatedAt || conv.createdAt || conv.CreatedAt;
            const parsedTs = rawTs ? new Date(rawTs) : null;
            const isValidTs = parsedTs && !isNaN(parsedTs.getTime());
            return {
              id: conv.id || conv.ConversationID,
              name: conv.OtherPartyName || conv.userName || 'Unknown',
              last: conv.lastMessageContent || conv.LastMessageContent || '',
              ts: isValidTs ? parsedTs : null,
              profilePicUrl: conv.OtherPartyAvatar || conv.OtherPartyLogo || null
            };
          }).sort((a,b) => (b.ts || new Date(0)) - (a.ts || new Date(0)));
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
    const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1 || 
                   booking.PaymentStatus === 'paid' || booking.PaymentStatus === 'completed' ||
                   (booking.Status || '').toLowerCase() === 'paid';
    const isDepositOnly = !isPaid && (booking.DepositPaid === true || booking.DepositPaid === 1);
    const s = (booking.Status || '').toString().toLowerCase();
    
    // Safely parse date
    const rawDate = booking.EventDate || booking.eventDate;
    const eventDate = rawDate ? new Date(rawDate) : null;
    const isValidDate = eventDate && !isNaN(eventDate.getTime());
    
    const month = isValidDate ? eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'TBD';
    const day = isValidDate ? eventDate.getDate() : '--';
    const weekday = isValidDate ? eventDate.toLocaleDateString('en-US', { weekday: 'short' }) : '';

    // Status configuration
    const getStatusConfig = () => {
      if ((s === 'confirmed' || s === 'accepted' || s === 'approved') && !isPaid) {
        return { icon: 'fa-check-circle', bg: '#ecfdf5', color: '#10b981', label: 'Awaiting Payment', borderStyle: 'dashed' };
      }
      if (isPaid) {
        return { icon: 'fa-check-circle', bg: '#ecfdf5', color: '#10b981', label: 'Paid', borderStyle: 'solid' };
      }
      const statusMap = {
        pending:   { icon: 'fa-clock', bg: '#fef3c7', color: '#f59e0b', label: 'Pending', borderStyle: 'dashed' },
        confirmed: { icon: 'fa-check-circle', bg: '#ecfdf5', color: '#10b981', label: 'Confirmed', borderStyle: 'dashed' },
        accepted:  { icon: 'fa-check-circle', bg: '#ecfdf5', color: '#10b981', label: 'Confirmed', borderStyle: 'dashed' },
        approved:  { icon: 'fa-check-circle', bg: '#ecfdf5', color: '#10b981', label: 'Confirmed', borderStyle: 'dashed' },
        declined:  { icon: 'fa-times-circle', bg: '#fef2f2', color: '#ef4444', label: 'Declined', borderStyle: 'dashed' },
        cancelled: { icon: 'fa-ban', bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled', borderStyle: 'dashed' },
        expired:   { icon: 'fa-clock', bg: '#f3f4f6', color: '#6b7280', label: 'Expired', borderStyle: 'dashed' }
      };
      return statusMap[s] || statusMap.pending;
    };
    const statusCfg = getStatusConfig();

    return (
      <div 
        key={booking.BookingID || booking.BookingRequestId} 
        className="dashboard-booking-card" 
        onClick={() => onSectionChange && onSectionChange('bookings')}
        style={{
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
      >
        {/* Date Section */}
        <div style={{
          textAlign: 'center',
          minWidth: '50px',
          padding: '8px 0',
          borderRight: '1px solid #e2e8f0',
          paddingRight: '16px',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
            {month}
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
            {day}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
            {weekday}
          </div>
        </div>
        {/* Booking Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <div style={{ fontWeight: 600, color: '#111827', fontSize: '15px' }}>
              {booking.VendorName || 'Vendor'}
            </div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px', 
              padding: '4px 10px', 
              borderRadius: '999px', 
              fontSize: '11px', 
              background: statusCfg.bg, 
              color: statusCfg.color, 
              border: `1px ${statusCfg.borderStyle || 'solid'} ${statusCfg.color}`,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              <i className={`fas ${statusCfg.icon}`} style={{ fontSize: '10px' }}></i>
              <span>{statusCfg.label}</span>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '4px' }}>
            {booking.ServiceName || 'Service'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
            {booking.TotalAmount != null && Number(booking.TotalAmount) > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-dollar-sign" style={{ fontSize: '11px' }}></i>
                ${Number(booking.TotalAmount).toLocaleString()} CAD
              </span>
            )}
            {(booking.Location || booking.EventLocation) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                <i className="fas fa-map-marker-alt" style={{ fontSize: '11px', flexShrink: 0 }}></i>
                {booking.Location || booking.EventLocation}
              </span>
            )}
          </div>
        </div>
        {/* Arrow indicator */}
        <i className="fas fa-chevron-right" style={{ color: '#9ca3af', fontSize: '14px', flexShrink: 0 }}></i>
      </div>
    );
  };

  const renderMessageItem = (message) => {
    const initials = (message.name || 'U').trim().charAt(0).toUpperCase();
    const isValidTs = message.ts && !isNaN(message.ts.getTime());
    const timeStr = isValidTs ? message.ts.toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
    const profilePic = message.profilePicUrl || message.ProfilePicUrl || message.userProfilePic;
    
    // Avatar style matching Messages section exactly - circular blue
    const avatarStyle = {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#5e72e4',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600,
      fontSize: '15px',
      flexShrink: 0
    };
    
    return (
      <div 
        key={message.id} 
        className="message-preview-item"
        onClick={() => handleKPIClick('messages')}
        style={{ cursor: 'pointer' }}
      >
        {profilePic ? (
          <img 
            src={profilePic} 
            alt={message.name || 'User'} 
            style={{ ...avatarStyle, objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div style={{ ...avatarStyle, display: profilePic ? 'none' : 'flex' }}>
          {initials}
        </div>
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
        {/* Skeleton Loading for KPI Cards */}
        <div className="vendor-stats stats-top-grid" id="client-stats">
          <div className="kpi-grid two-col">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="kpi-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '60px', height: '28px', marginBottom: '8px', borderRadius: '6px' }}></div>
                    <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="kpi-card calendar-tile full-height" style={{ padding: '1.25rem' }}>
            <div className="skeleton" style={{ width: '120px', height: '20px', marginBottom: '1rem', borderRadius: '4px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div className="skeleton" style={{ width: '80px', height: '16px', margin: '0 auto 0.5rem', borderRadius: '4px' }}></div>
              <div className="skeleton" style={{ width: '60px', height: '48px', margin: '0 auto', borderRadius: '8px' }}></div>
            </div>
          </div>
        </div>
        
        {/* Skeleton Loading for Cards */}
        <div className="overview-grid">
          <div className="dashboard-card">
            <div className="skeleton" style={{ width: '150px', height: '20px', marginBottom: '1.5rem', borderRadius: '4px' }}></div>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <div className="skeleton" style={{ width: '50px', height: '60px', borderRadius: '8px' }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '80%', height: '14px', marginBottom: '8px', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '60%', height: '12px', marginBottom: '6px', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '40%', height: '12px', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="dashboard-card">
            <div className="skeleton" style={{ width: '150px', height: '20px', marginBottom: '1.5rem', borderRadius: '4px' }}></div>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '70%', height: '14px', marginBottom: '8px', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '90%', height: '12px', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
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
            {loadingBookings ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : recentBookings && recentBookings.length > 0 ? (
              recentBookings.slice(0, 3).map(renderBookingItem)
            ) : (
              <div className="empty-state">No upcoming bookings.</div>
            )}
          </div>
        </div>
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Recent Messages</h2>
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
