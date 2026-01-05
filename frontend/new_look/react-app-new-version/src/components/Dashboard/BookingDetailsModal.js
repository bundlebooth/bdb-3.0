import React from 'react';
import './BookingDetailsModal.css';

function BookingDetailsModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  // Parse event date
  const eventDate = booking.EventDate ? new Date(booking.EventDate) : null;
  const formattedDate = eventDate ? eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'N/A';

  // Parse times
  let startTime = 'N/A';
  let endTime = 'N/A';
  if (eventDate) {
    startTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    // Calculate end time (default 90 min if no EndTime provided)
    const endDateTime = booking.EndTime ? new Date(booking.EndTime) : new Date(eventDate.getTime() + 90 * 60000);
    endTime = endDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  // Parse requested date
  const requestedDate = booking.CreatedAt || booking.RequestedAt;
  const formattedRequestedDate = requestedDate 
    ? new Date(requestedDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) 
    : 'N/A';

  // Status badge
  const s = (booking._status || booking.Status || 'pending').toString().toLowerCase();
  const isPaid = booking.FullAmountPaid === true || booking.FullAmountPaid === 1 || s === 'paid';
  const statusMap = {
    pending:   { icon: 'fa-clock', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', label: 'Pending', borderStyle: 'dashed' },
    confirmed: { icon: 'fa-check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', label: 'Confirmed', borderStyle: 'dashed' },
    accepted:  { icon: 'fa-check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', label: 'Confirmed', borderStyle: 'dashed' },
    approved:  { icon: 'fa-check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', label: 'Confirmed', borderStyle: 'dashed' },
    paid:      { icon: 'fa-check-circle', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Paid', borderStyle: 'solid' },
    cancelled: { icon: 'fa-times-circle', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', label: 'Cancelled', borderStyle: 'dashed' },
    declined:  { icon: 'fa-times-circle', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', label: 'Declined', borderStyle: 'dashed' },
    expired:   { icon: 'fa-clock', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.08)', label: 'Expired', borderStyle: 'dashed' }
  };
  const status = isPaid ? 'paid' : s;
  const statusCfg = statusMap[status] || statusMap.pending;

  return (
    <div className="booking-details-modal-overlay" onClick={onClose}>
      <div className="booking-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="booking-details-header">
          <h2>Booking Details</h2>
          <button className="booking-details-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="booking-details-content">
          {/* Status Badge */}
          <div className="booking-details-status">
            <div 
              className="status-badge-large"
              style={{ 
                background: statusCfg.bg, 
                color: statusCfg.color,
                border: `1px ${statusCfg.borderStyle || 'solid'} ${statusCfg.color}`
              }}
            >
              <i className={`fas ${statusCfg.icon}`}></i>
              <span>{statusCfg.label}</span>
            </div>
            {/* Decline Reason */}
            {s === 'declined' && booking.DeclineReason && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444', textAlign: 'center' }}>
                Reason: {booking.DeclineReason}
              </div>
            )}
          </div>

          {/* Main Info Grid */}
          <div className="booking-details-grid">
            {/* Event Name */}
            {(booking.EventName || booking.ServiceName) && (
              <div className="booking-detail-item">
                <div className="detail-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Event Name</span>
                  <span className="detail-value">{booking.EventName || booking.ServiceName}</span>
                </div>
              </div>
            )}

            {/* Event Type */}
            {booking.EventType && (
              <div className="booking-detail-item">
                <div className="detail-icon">
                  <i className="fas fa-tag"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Event Type</span>
                  <span className="detail-value">{booking.EventType}</span>
                </div>
              </div>
            )}

            {/* Service */}
            {booking.ServiceName && booking.EventName && (
              <div className="booking-detail-item">
                <div className="detail-icon">
                  <i className="fas fa-concierge-bell"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Service</span>
                  <span className="detail-value">{booking.ServiceName}</span>
                </div>
              </div>
            )}

            {/* Client/Vendor Name */}
            {(booking.ClientName || booking.VendorName) && (
              <div className="booking-detail-item">
                <div className="detail-icon">
                  <i className={`fas ${booking.ClientName ? 'fa-user' : 'fa-store'}`}></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">{booking.ClientName ? 'Client' : 'Vendor'}</span>
                  <span className="detail-value">{booking.ClientName || booking.VendorName}</span>
                </div>
              </div>
            )}

            {/* Attendees */}
            {booking.AttendeeCount && (
              <div className="booking-detail-item">
                <div className="detail-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Attendees</span>
                  <span className="detail-value">{booking.AttendeeCount} people</span>
                </div>
              </div>
            )}

            {/* Location */}
            {booking.Location && (
              <div className="booking-detail-item full-width">
                <div className="detail-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{booking.Location}</span>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="booking-detail-item">
              <div className="detail-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="detail-content">
                <span className="detail-label">Date</span>
                <span className="detail-value">{formattedDate}</span>
              </div>
            </div>

            {/* Time */}
            <div className="booking-detail-item">
              <div className="detail-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="detail-content">
                <span className="detail-label">Time</span>
                <span className="detail-value">{startTime} - {endTime}</span>
              </div>
            </div>

            {/* Total Amount */}
            {booking.TotalAmount != null && booking.TotalAmount !== '' && Number(booking.TotalAmount) > 0 && (
              <div className="booking-detail-item">
                <div className="detail-icon">
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Total Amount</span>
                  <span className="detail-value price">${Number(booking.TotalAmount).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Deposit Info */}
            {booking.DepositAmount != null && booking.DepositAmount !== '' && Number(booking.DepositAmount) > 0 && (
              <div className="booking-detail-item">
                <div className="detail-icon">
                  <i className="fas fa-receipt"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Deposit</span>
                  <span className="detail-value">
                    ${Number(booking.DepositAmount).toLocaleString()}
                    {booking.DepositPaid && <span className="paid-badge">Paid</span>}
                  </span>
                </div>
              </div>
            )}

            {/* Requested On */}
            <div className="booking-detail-item full-width">
              <div className="detail-icon">
                <i className="fas fa-paper-plane"></i>
              </div>
              <div className="detail-content">
                <span className="detail-label">Requested On</span>
                <span className="detail-value">{formattedRequestedDate}</span>
              </div>
            </div>

            {/* Special Requests */}
            {booking.SpecialRequests && (
              <div className="booking-detail-item full-width">
                <div className="detail-icon">
                  <i className="fas fa-comment-alt"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Special Requests</span>
                  <span className="detail-value notes">{booking.SpecialRequests}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            {booking.Notes && (
              <div className="booking-detail-item full-width">
                <div className="detail-icon">
                  <i className="fas fa-sticky-note"></i>
                </div>
                <div className="detail-content">
                  <span className="detail-label">Notes</span>
                  <span className="detail-value notes">{booking.Notes}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="booking-details-footer">
          <button className="btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailsModal;
