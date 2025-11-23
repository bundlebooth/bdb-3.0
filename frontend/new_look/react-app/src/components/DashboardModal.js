import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { showBanner } from '../utils/helpers';

function DashboardModal({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userMode, setUserMode] = useState('client'); // 'client' or 'vendor'
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [messages, setMessages] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('all');

  const isVendor = currentUser?.userType === 'vendor' || currentUser?.isVendor;
  
  // Initialize userMode based on user type
  useEffect(() => {
    if (currentUser) {
      setUserMode(isVendor ? 'vendor' : 'client');
    }
  }, [currentUser, isVendor]);

  const loadDashboardData = useCallback(async () => {
    if (!currentUser) return;
    try {
      // Load bookings
      const bookingsRes = await fetch(`${API_BASE_URL}/bookings/user/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings || []);
      }

      // Load favorites
      const favoritesRes = await fetch(`${API_BASE_URL}/favorites/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (favoritesRes.ok) {
        const data = await favoritesRes.json();
        setFavorites(data.favorites || []);
      }
      
      // Load messages (mock data for now)
      setMessages([
        { id: 1, from: 'Vu99', message: 'test', date: 'Nov 20, 03...' },
        { id: 2, from: 'Vu99', message: 'Test', date: 'Nov 18, 11:0...' }
      ]);

      // Load invoices
      const invoicesRes = await fetch(`${API_BASE_URL}/invoices/user/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadDashboardData();
    }
  }, [isOpen, currentUser, loadDashboardData]);

  const handleLogout = () => {
    logout();
    onClose();
    showBanner('Logged out successfully', 'success');
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const filterBookings = (status) => {
    setBookingFilter(status);
  };

  const getFilteredBookings = () => {
    if (bookingFilter === 'all') return bookings;
    return bookings.filter(b => b.Status?.toLowerCase() === bookingFilter);
  };

  if (!isOpen) return null;

  const dashboardTitle = userMode === 'vendor' 
    ? `Vendor Dashboard - ${activeSection.replace('vendor-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
    : `Dashboard - ${activeSection.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content" style={{ maxWidth: '95%', width: '1200px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3>{dashboardTitle}</h3>
          <span className="close-modal" onClick={onClose}>×</span>
        </div>
        <div className="modal-body" style={{ padding: 0, overflow: 'hidden', flexGrow: 1 }}>
          
          {/* CLIENT Dashboard Container */}
          {userMode === 'client' && (
            <div className="dashboard-container" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', height: '100%', minHeight: 0 }}>
            {/* Sidebar */}
            <aside className="dashboard-sidebar" style={{ overflowY: 'auto', maxHeight: '100%' }}>
              <div className="logo" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2L4 8V16C4 24 16 30 16 30C16 30 28 24 28 16V8L16 2Z" fill="#5e72e4"/>
                  <path d="M16 10L12 12V16C12 18 16 20 16 20C16 20 20 18 20 16V12L16 10Z" fill="white"/>
                </svg>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>PlanHive</span>
              </div>
              
              {/* CLIENT Section */}
              <div style={{ padding: '1rem 0' }}>
                <div style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CLIENT
                </div>
                <ul className="dashboard-menu">
                  <li>
                    <button 
                      type="button"
                      className={userMode === 'client' && activeSection === 'dashboard' ? 'active' : ''}
                      onClick={() => { setUserMode('client'); handleSectionChange('dashboard'); }}
                    >
                      <i className="fas fa-tachometer-alt"></i>Dashboard
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button"
                      className={userMode === 'client' && activeSection === 'bookings' ? 'active' : ''}
                      onClick={() => { setUserMode('client'); handleSectionChange('bookings'); }}
                    >
                      <i className="fas fa-calendar-check"></i>Bookings
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button"
                      className={userMode === 'client' && activeSection === 'invoices' ? 'active' : ''}
                      onClick={() => { setUserMode('client'); handleSectionChange('invoices'); }}
                    >
                      <i className="fas fa-file-invoice"></i>Invoices
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button"
                      className={userMode === 'client' && activeSection === 'favorites' ? 'active' : ''}
                      onClick={() => { setUserMode('client'); handleSectionChange('favorites'); }}
                    >
                      <i className="fas fa-heart"></i>Favorites
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button"
                      className={userMode === 'client' && activeSection === 'messages' ? 'active' : ''}
                      onClick={() => { setUserMode('client'); handleSectionChange('messages'); }}
                    >
                      <i className="fas fa-comments"></i>Messages
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button"
                      className={userMode === 'client' && activeSection === 'reviews' ? 'active' : ''}
                      onClick={() => { setUserMode('client'); handleSectionChange('reviews'); }}
                    >
                      <i className="fas fa-star"></i>My Reviews
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button"
                      className={userMode === 'client' && activeSection === 'settings' ? 'active' : ''}
                      onClick={() => { setUserMode('client'); handleSectionChange('settings'); }}
                    >
                      <i className="fas fa-cog"></i>Settings
                    </button>
                  </li>
                </ul>
              </div>
              
              {/* Logout */}
              <ul className="dashboard-menu" style={{ marginTop: 'auto' }}>
                <li>
                  <button type="button" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>Log Out
                  </button>
                </li>
              </ul>
            </aside>

            {/* Main Content */}
            <main className="dashboard-content" style={{ overflowY: 'auto', flex: 1, height: '100%', minHeight: 0, background: 'var(--secondary)' }}>
              <div className="dashboard-header">
                <h1 className="dashboard-title">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
              </div>

              {/* Dashboard Section */}
              {activeSection === 'dashboard' && (
                <div style={{ padding: '1rem 0' }}>
                  {/* Stats Cards - Legacy Structure */}
                  <div className="vendor-stats stats-top-grid">
                    <div className="kpi-grid two-col">
                      <div className="kpi-card kpi-click" data-target="bookings" data-kpi="upcoming">
                        <div className="kpi-icon bookings"><i className="fas fa-calendar-check"></i></div>
                        <div className="kpi-content">
                          <div className="kpi-value">{bookings.filter(b => b.Status !== 'declined' && b.Status !== 'expired').length}</div>
                          <div className="kpi-label">Upcoming Bookings</div>
                        </div>
                      </div>
                      <div className="kpi-card kpi-click" data-target="bookings" data-kpi="pending">
                        <div className="kpi-icon requests"><i className="fas fa-paper-plane"></i></div>
                        <div className="kpi-content">
                          <div className="kpi-value">{bookings.filter(b => b.Status === 'pending').length}</div>
                          <div className="kpi-label">Pending Requests</div>
                        </div>
                      </div>
                      <div className="kpi-card kpi-click" data-target="favorites" data-kpi="favorites">
                        <div className="kpi-icon favorites"><i className="fas fa-heart"></i></div>
                        <div className="kpi-content">
                          <div className="kpi-value">{favorites.length}</div>
                          <div className="kpi-label">Favorites Saved</div>
                        </div>
                      </div>
                      <div className="kpi-card kpi-click" data-target="messages" data-kpi="messages">
                        <div className="kpi-icon messages"><i className="fas fa-envelope"></i></div>
                        <div className="kpi-content">
                          <div className="kpi-value">{messages.length}</div>
                          <div className="kpi-label">Unread Messages</div>
                        </div>
                      </div>
                    </div>
                    <div className="kpi-card calendar-tile full-height">
                      <div className="cal-header">{new Date().toLocaleString('en-US', { month: 'long' })} {new Date().getFullYear()}</div>
                      <div className="cal-body">
                        <div className="cal-day">{new Date().toLocaleString('en-US', { weekday: 'long' })}</div>
                        <div className="cal-date">{new Date().getDate()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Content Grid - Legacy Structure */}
                  <div className="overview-grid">
                    {/* Recent Bookings */}
                    <div className="dashboard-card">
                      <h2 className="dashboard-card-title">Recent Bookings</h2>
                      <div className="dashboard-fixed-list">
                        {bookings.slice(0, 3).map(booking => {
                          const eventDate = new Date(booking.EventDate);
                          const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
                          const day = eventDate.getDate();
                          const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
                          const startTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                          const endTime = new Date(eventDate.getTime() + 90 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                          
                          return (
                            <div key={booking.BookingID} className="booking-item">
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
                        })}
                        {bookings.length === 0 && (
                          <div className="empty-state">No upcoming bookings.</div>
                        )}
                      </div>
                    </div>

                    {/* Recent Messages */}
                    <div className="dashboard-card">
                      <div className="dashboard-card-title-row">
                        <h2 className="dashboard-card-title">Recent Messages</h2>
                        <button className="btn btn-outline" style={{ padding: '0.5rem 0.9rem' }}>Open Messages</button>
                      </div>
                      <div className="message-preview-list dashboard-fixed-list">
                        {messages.map(msg => (
                          <div key={msg.id} className="message-preview-item">
                            <div className="preview-avatar">{msg.from.substring(0, 2).toUpperCase()}</div>
                            <div className="preview-content">
                              <div className="preview-name">{msg.from}</div>
                              <div className="preview-message">{msg.message}</div>
                              <div className="preview-time">{msg.date}</div>
                            </div>
                          </div>
                        ))}
                        {messages.length === 0 && (
                          <div className="empty-state">No messages yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Section */}
              {activeSection === 'bookings' && (
                <div className="dashboard-card">
                  <div className="booking-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border)' }}>
                    <button 
                      className={`booking-tab ${bookingFilter === 'all' ? 'active' : ''}`}
                      onClick={() => filterBookings('all')}
                      style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: bookingFilter === 'all' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      All
                    </button>
                    <button 
                      className={`booking-tab ${bookingFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => filterBookings('pending')}
                      style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: bookingFilter === 'pending' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Pending
                    </button>
                    <button 
                      className={`booking-tab ${bookingFilter === 'accepted' ? 'active' : ''}`}
                      onClick={() => filterBookings('accepted')}
                      style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: bookingFilter === 'accepted' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Accepted
                    </button>
                    <button 
                      className={`booking-tab ${bookingFilter === 'declined' ? 'active' : ''}`}
                      onClick={() => filterBookings('declined')}
                      style={{ padding: '0.75rem 1.5rem', background: 'none', border: 'none', borderBottom: bookingFilter === 'declined' ? '3px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                      Declined
                    </button>
                  </div>
                  <div className="booking-count" style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
                    {getFilteredBookings().length} items
                  </div>
                  <div>
                    {getFilteredBookings().length > 0 ? (
                      getFilteredBookings().map((booking, index) => (
                        <div key={index} className="booking-card" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{booking.VendorName || 'Vendor'}</div>
                            <div style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', background: booking.Status === 'pending' ? '#fef3c7' : booking.Status === 'accepted' ? '#d1fae5' : '#fee2e2', color: booking.Status === 'pending' ? '#92400e' : booking.Status === 'accepted' ? '#065f46' : '#991b1b' }}>
                              {booking.Status}
                            </div>
                          </div>
                          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                            <div><i className="fas fa-calendar"></i> {new Date(booking.EventDate).toLocaleDateString()}</div>
                            <div><i className="fas fa-users"></i> {booking.GuestCount || 0} guests</div>
                            {booking.EventType && <div><i className="fas fa-tag"></i> {booking.EventType}</div>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>No bookings found</p>
                    )}
                  </div>
                </div>
              )}

              {/* Invoices Section */}
              {activeSection === 'invoices' && (
                <div className="dashboard-card">
                  <div>
                    {invoices.length > 0 ? (
                      invoices.map((invoice, index) => (
                        <div key={index} className="invoice-card" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>Invoice #{invoice.InvoiceNumber || index + 1}</div>
                              <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                                {new Date(invoice.CreatedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                                ${parseFloat(invoice.TotalAmount || 0).toFixed(2)}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: invoice.Status === 'paid' ? '#10b981' : '#f59e0b' }}>
                                {invoice.Status || 'pending'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>No invoices yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* Favorites Section */}
              {activeSection === 'favorites' && !isVendor && (
                <div className="dashboard-card">
                  <div className="vendor-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {favorites.length > 0 ? (
                      favorites.map((vendorId, index) => (
                        <div key={index} className="vendor-card" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                          <div style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Vendor {vendorId}</div>
                            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Saved vendor</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', gridColumn: '1 / -1' }}>No favorites yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Section */}
              {activeSection === 'messages' && (
                <div className="dashboard-card">
                  <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>Messages feature coming soon</p>
                </div>
              )}

              {/* Reviews Section */}
              {activeSection === 'reviews' && (
                <div className="dashboard-card">
                  <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>Reviews feature coming soon</p>
                </div>
              )}

              {/* Settings Section */}
              {activeSection === 'settings' && (
                <div className="dashboard-card">
                  <h3 style={{ marginBottom: '1.5rem' }}>Account Settings</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Email</div>
                      <div style={{ color: 'var(--text-light)' }}>{currentUser?.email}</div>
                    </div>
                    <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Account Type</div>
                      <div style={{ color: 'var(--text-light)' }}>{isVendor ? 'Vendor' : 'Client'}</div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default DashboardModal;
