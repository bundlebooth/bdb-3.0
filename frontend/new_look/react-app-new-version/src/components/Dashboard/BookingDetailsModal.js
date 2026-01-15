import React from 'react';
import { getBookingStatusConfig, formatTimeValue } from '../../utils/bookingStatus';
import { COLORS, MODAL_STYLES, BUTTON_STYLES, TYPOGRAPHY, getStatusBadgeStyle } from '../../utils/uiConstants';

function BookingDetailsModal({ isOpen, onClose, booking, isVendorView = false }) {
  if (!isOpen || !booking) return null;

  // Parse event date
  const eventDate = booking.EventDate ? new Date(booking.EventDate) : null;
  const formattedDate = eventDate ? eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'TBD';

  // Parse times - use StartTime/EndTime if available
  let timeDisplay = 'TBD';
  if (booking.StartTime) {
    const startFormatted = formatTimeValue(booking.StartTime);
    const endFormatted = booking.EndTime ? formatTimeValue(booking.EndTime) : '';
    timeDisplay = endFormatted ? `${startFormatted} - ${endFormatted}` : startFormatted;
  } else if (eventDate) {
    const startTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const endDateTime = new Date(eventDate.getTime() + 90 * 60000);
    const endTime = endDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    timeDisplay = `${startTime} - ${endTime}`;
  }
  
  // Add timezone if available
  if (booking.Timezone || booking.VendorTimezone) {
    timeDisplay += ` (${booking.Timezone || booking.VendorTimezone})`;
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

  // Use shared status config - isVendorView is passed as prop
  const statusCfg = getBookingStatusConfig(booking, isVendorView);

  const s = (booking._status || booking.Status || 'pending').toString().toLowerCase();

  return (
    <div 
      style={MODAL_STYLES.overlay}
      onClick={onClose}
    >
      <div 
        style={MODAL_STYLES.container}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={MODAL_STYLES.header}>
          <h2 style={MODAL_STYLES.title}>Booking Details</h2>
          <button 
            onClick={onClose}
            style={MODAL_STYLES.closeButton}
            onMouseOver={(e) => {
              e.currentTarget.style.background = COLORS.bgGray;
              e.currentTarget.style.color = COLORS.textPrimary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = COLORS.textSecondary;
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={MODAL_STYLES.content}>
          {/* Status Badge */}
          <div style={{ marginBottom: '20px' }}>
            <span style={getStatusBadgeStyle(statusCfg.color, statusCfg.bg, statusCfg.borderStyle)}>
              <i className={`fas ${statusCfg.icon}`} style={{ fontSize: '11px' }}></i>
              {statusCfg.label}
            </span>
            {s === 'declined' && booking.DeclineReason && (
              <div style={{ marginTop: '8px', fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.error }}>
                Reason: {booking.DeclineReason}
              </div>
            )}
          </div>

          {/* Details List - Clean style matching app */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Event Name */}
            {(booking.EventName || booking.ServiceName) && (
              <div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>Event Name</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.medium }}>{booking.EventName || booking.ServiceName}</div>
              </div>
            )}

            {/* Event Type */}
            {booking.EventType && (
              <div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>Event Type</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.medium }}>{booking.EventType}</div>
              </div>
            )}

            {/* Service */}
            {booking.ServiceName && booking.EventName && (
              <div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>Service</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.medium }}>{booking.ServiceName}</div>
              </div>
            )}

            {/* Client/Vendor Name */}
            {(booking.ClientName || booking.VendorName) && (
              <div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>
                  {booking.ClientName ? 'Client' : 'Vendor'}
                </div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.medium }}>{booking.ClientName || booking.VendorName}</div>
              </div>
            )}

            {/* Attendees */}
            {booking.AttendeeCount && (
              <div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>Attendees</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.medium }}>{booking.AttendeeCount} people</div>
              </div>
            )}

            {/* Location */}
            {booking.Location && (
              <div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>Location</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.medium }}>{booking.Location}</div>
              </div>
            )}

            {/* Date */}
            <div>
              <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
              <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.medium }}>{formattedDate}</div>
            </div>

            {/* Time */}
            <div>
              <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>Time</div>
              <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.medium }}>{timeDisplay}</div>
            </div>

            {/* Total Amount */}
            {booking.TotalAmount != null && booking.TotalAmount !== '' && Number(booking.TotalAmount) > 0 && (
              <div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.price, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>${Number(booking.TotalAmount).toLocaleString()}</div>
              </div>
            )}

            {/* Requested On */}
            <div>
              <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>Requested On</div>
              <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.medium }}>{formattedRequestedDate}</div>
            </div>

            {/* Special Requests */}
            {booking.SpecialRequests && (
              <div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium, textTransform: 'uppercase', marginBottom: '4px' }}>Special Requests</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.base, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.normal, lineHeight: TYPOGRAPHY.lineHeight.normal }}>{booking.SpecialRequests}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ ...MODAL_STYLES.footer, justifyContent: 'center' }}>
          <button 
            onClick={onClose}
            style={BUTTON_STYLES.primary}
            onMouseOver={(e) => e.currentTarget.style.background = COLORS.primaryHover}
            onMouseOut={(e) => e.currentTarget.style.background = COLORS.primary}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailsModal;
