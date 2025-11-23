import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function ClientBookingsSection() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/bookings/all`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to load bookings');
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      showBanner('Failed to load bookings', 'error');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filterBookings = (status) => {
    if (status === 'all') return bookings;
    return bookings.filter(b => b.Status?.toLowerCase() === status.toLowerCase());
  };

  const renderBookingItem = (booking) => {
    const eventDate = new Date(booking.EventDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });

    const statusClass = booking.Status?.toLowerCase() || 'pending';
    const statusBadge = {
      'pending': { text: 'Pending', class: 'status-pending' },
      'accepted': { text: 'Accepted', class: 'status-accepted' },
      'confirmed': { text: 'Confirmed', class: 'status-confirmed' },
      'declined': { text: 'Declined', class: 'status-declined' },
      'expired': { text: 'Expired', class: 'status-expired' }
    }[statusClass] || { text: 'Pending', class: 'status-pending' };

    return (
      <div key={booking.BookingRequestId} className="booking-list-item">
        <div className="booking-list-header">
          <div className="booking-list-vendor">
            <i className="fas fa-store"></i>
            <span>{booking.VendorName || 'Vendor'}</span>
          </div>
          <span className={`status-badge ${statusBadge.class}`}>
            {statusBadge.text}
          </span>
        </div>
        <div className="booking-list-details">
          <div className="booking-detail-row">
            <i className="fas fa-calendar"></i>
            <span>{formattedDate}</span>
          </div>
          <div className="booking-detail-row">
            <i className="fas fa-clock"></i>
            <span>{formattedTime}</span>
          </div>
          {booking.ServiceName && (
            <div className="booking-detail-row">
              <i className="fas fa-briefcase"></i>
              <span>{booking.ServiceName}</span>
            </div>
          )}
          {booking.TotalAmount && (
            <div className="booking-detail-row">
              <i className="fas fa-dollar-sign"></i>
              <span>${Number(booking.TotalAmount).toLocaleString()}</span>
            </div>
          )}
        </div>
        {booking.Notes && (
          <div className="booking-list-notes">
            <strong>Notes:</strong> {booking.Notes}
          </div>
        )}
        <div className="booking-list-actions">
          <button className="btn btn-outline btn-sm">View Details</button>
          {booking.Status === 'confirmed' && (
            <button className="btn btn-primary btn-sm">Pay Now</button>
          )}
        </div>
      </div>
    );
  };

  const filteredBookings = filterBookings(activeTab);

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
          <div className="booking-count">
            {filteredBookings.length} {filteredBookings.length === 1 ? 'item' : 'items'}
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div id="all-bookings-list">
              {filteredBookings.map(renderBookingItem)}
            </div>
          ) : (
            <p>No {activeTab !== 'all' ? activeTab : ''} bookings.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientBookingsSection;
