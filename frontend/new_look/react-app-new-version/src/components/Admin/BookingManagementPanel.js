import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const BookingManagementPanel = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view', 'edit', 'refund', 'dispute'
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchBookings();
  }, [filter, pagination.page]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/admin/bookings?status=${filter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`;
      if (dateRange.start) url += `&startDate=${dateRange.start}`;
      if (dateRange.end) url += `&endDate=${dateRange.end}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showBanner('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        showBanner('Booking cancelled', 'success');
        fetchBookings();
        setSelectedBooking(null);
        setModalType(null);
      }
    } catch (error) {
      showBanner('Failed to cancel booking', 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/bookings/export?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        showBanner('Export downloaded', 'success');
      }
    } catch (error) {
      showBanner('Failed to export data', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Pending': { class: 'badge-warning', icon: 'fa-clock' },
      'Confirmed': { class: 'badge-info', icon: 'fa-check' },
      'Completed': { class: 'badge-success', icon: 'fa-check-circle' },
      'Cancelled': { class: 'badge-danger', icon: 'fa-times-circle' },
      'Disputed': { class: 'badge-dark', icon: 'fa-exclamation-triangle' }
    };
    const config = statusMap[status] || { class: 'badge-secondary', icon: 'fa-question' };
    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fas ${config.icon}`}></i> {status}
      </span>
    );
  };

  return (
    <div className="admin-panel booking-management">
      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'disputed'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <div className="date-range">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              placeholder="Start Date"
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              placeholder="End Date"
            />
          </div>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchBookings()}
            />
          </div>
          <button className="btn-secondary" onClick={handleExportCSV}>
            <i className="fas fa-download"></i> Export
          </button>
          <button className="btn-primary" onClick={fetchBookings}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="data-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-check"></i>
            <h3>No bookings found</h3>
            <p>Try adjusting your filters or search term</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Client</th>
                <th>Vendor</th>
                <th>Service</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.BookingID}>
                  <td>
                    <strong>#{booking.BookingID}</strong>
                  </td>
                  <td>
                    <div className="client-cell">
                      <span>{booking.ClientName}</span>
                      <small>{booking.ClientEmail}</small>
                    </div>
                  </td>
                  <td>
                    <div className="vendor-cell">
                      <span>{booking.VendorName}</span>
                      <small>{booking.VendorEmail}</small>
                    </div>
                  </td>
                  <td>{booking.ServiceName || 'N/A'}</td>
                  <td>
                    <div className="datetime-cell">
                      <span>{new Date(booking.BookingDate).toLocaleDateString()}</span>
                      <small>{booking.StartTime} - {booking.EndTime}</small>
                    </div>
                  </td>
                  <td>
                    <strong>${booking.TotalAmount?.toFixed(2) || '0.00'}</strong>
                  </td>
                  <td>{getStatusBadge(booking.Status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        title="View Details"
                        onClick={() => { setSelectedBooking(booking); setModalType('view'); }}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="action-btn edit"
                        title="Edit Booking"
                        onClick={() => { setSelectedBooking(booking); setModalType('edit'); }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {booking.Status !== 'Cancelled' && booking.Status !== 'Completed' && (
                        <button
                          className="action-btn reject"
                          title="Cancel Booking"
                          onClick={() => { setSelectedBooking(booking); setModalType('cancel'); }}
                        >
                          
                        </button>
                      )}
                      {(booking.Status === 'Completed' || booking.Status === 'Cancelled') && (
                        <button
                          className="action-btn refund"
                          title="Issue Refund"
                          onClick={() => { setSelectedBooking(booking); setModalType('refund'); }}
                        >
                          <i className="fas fa-undo"></i>
                        </button>
                      )}
                      {booking.Status === 'Disputed' && (
                        <button
                          className="action-btn dispute"
                          title="Resolve Dispute"
                          onClick={() => { setSelectedBooking(booking); setModalType('dispute'); }}
                        >
                          <i className="fas fa-gavel"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedBooking && modalType === 'view' && (
        <BookingViewModal
          booking={selectedBooking}
          onClose={() => { setSelectedBooking(null); setModalType(null); }}
        />
      )}

      {selectedBooking && modalType === 'edit' && (
        <BookingEditModal
          booking={selectedBooking}
          onClose={() => { setSelectedBooking(null); setModalType(null); }}
          onSave={() => { fetchBookings(); setSelectedBooking(null); setModalType(null); }}
        />
      )}

      {selectedBooking && modalType === 'cancel' && (
        <CancelBookingModal
          booking={selectedBooking}
          onClose={() => { setSelectedBooking(null); setModalType(null); }}
          onCancel={(reason) => handleCancelBooking(selectedBooking.BookingID, reason)}
        />
      )}

      {selectedBooking && modalType === 'refund' && (
        <RefundModal
          booking={selectedBooking}
          onClose={() => { setSelectedBooking(null); setModalType(null); }}
          onRefund={() => { fetchBookings(); setSelectedBooking(null); setModalType(null); }}
        />
      )}

      {selectedBooking && modalType === 'dispute' && (
        <DisputeModal
          booking={selectedBooking}
          onClose={() => { setSelectedBooking(null); setModalType(null); }}
          onResolve={() => { fetchBookings(); setSelectedBooking(null); setModalType(null); }}
        />
      )}
    </div>
  );
};

// Booking View Modal
const BookingViewModal = ({ booking, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Booking #{booking.BookingID}</h2>
          <button className="modal-close" onClick={onClose}>
            
          </button>
        </div>
        <div className="modal-body">
          <div className="booking-detail-grid">
            <div className="detail-section">
              <h3>Booking Information</h3>
              <div className="detail-row">
                <label>Status:</label>
                <span>{booking.Status}</span>
              </div>
              <div className="detail-row">
                <label>Date:</label>
                <span>{new Date(booking.BookingDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <label>Time:</label>
                <span>{booking.StartTime} - {booking.EndTime}</span>
              </div>
              <div className="detail-row">
                <label>Service:</label>
                <span>{booking.ServiceName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Guests:</label>
                <span>{booking.GuestCount || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Client Information</h3>
              <div className="detail-row">
                <label>Name:</label>
                <span>{booking.ClientName}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{booking.ClientEmail}</span>
              </div>
              <div className="detail-row">
                <label>Phone:</label>
                <span>{booking.ClientPhone || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Vendor Information</h3>
              <div className="detail-row">
                <label>Business:</label>
                <span>{booking.VendorName}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{booking.VendorEmail}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Payment Information</h3>
              <div className="detail-row">
                <label>Total Amount:</label>
                <span>${booking.TotalAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="detail-row">
                <label>Deposit Paid:</label>
                <span>${booking.DepositAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="detail-row">
                <label>Payment Status:</label>
                <span>{booking.PaymentStatus || 'N/A'}</span>
              </div>
            </div>
          </div>

          {booking.Notes && (
            <div className="detail-section full-width">
              <h3>Notes</h3>
              <p>{booking.Notes}</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Booking Edit Modal
const BookingEditModal = ({ booking, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    BookingDate: booking.BookingDate?.split('T')[0] || '',
    StartTime: booking.StartTime || '',
    EndTime: booking.EndTime || '',
    TotalAmount: booking.TotalAmount || 0,
    Status: booking.Status || 'Pending',
    Notes: booking.Notes || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/admin/bookings/${booking.BookingID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showBanner('Booking updated successfully', 'success');
        onSave();
      }
    } catch (error) {
      showBanner('Failed to update booking', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Booking #{booking.BookingID}</h2>
          <button className="modal-close" onClick={onClose}>
            
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.BookingDate}
              onChange={e => setFormData({ ...formData, BookingDate: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                value={formData.StartTime}
                onChange={e => setFormData({ ...formData, StartTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                value={formData.EndTime}
                onChange={e => setFormData({ ...formData, EndTime: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Total Amount ($)</label>
              <input
                type="number"
                value={formData.TotalAmount}
                onChange={e => setFormData({ ...formData, TotalAmount: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.Status}
                onChange={e => setFormData({ ...formData, Status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.Notes}
              onChange={e => setFormData({ ...formData, Notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Cancel Booking Modal
const CancelBookingModal = ({ booking, onClose, onCancel }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cancel Booking #{booking.BookingID}</h2>
          <button className="modal-close" onClick={onClose}>
            
          </button>
        </div>
        <div className="modal-body">
          <div className="warning-box">
            <i className="fas fa-exclamation-triangle"></i>
            <p>This action will cancel the booking and notify both the client and vendor.</p>
          </div>
          <div className="form-group">
            <label>Cancellation Reason</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              rows={4}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Keep Booking</button>
          <button
            className="btn-danger"
            onClick={() => onCancel(reason)}
            disabled={!reason.trim()}
          >
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
};

// Refund Modal
const RefundModal = ({ booking, onClose, onRefund }) => {
  const [refundAmount, setRefundAmount] = useState(booking.TotalAmount || 0);
  const [refundType, setRefundType] = useState('full');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleRefund = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`${API_BASE_URL}/admin/bookings/${booking.BookingID}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: refundType === 'full' ? booking.TotalAmount : refundAmount,
          reason
        })
      });

      if (response.ok) {
        showBanner('Refund processed successfully', 'success');
        onRefund();
      }
    } catch (error) {
      showBanner('Failed to process refund', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Issue Refund - Booking #{booking.BookingID}</h2>
          <button className="modal-close" onClick={onClose}>
            
          </button>
        </div>
        <div className="modal-body">
          <div className="info-box">
            <p><strong>Original Amount:</strong> ${booking.TotalAmount?.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> {booking.PaymentMethod || 'Stripe'}</p>
          </div>
          <div className="form-group">
            <label>Refund Type</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="full"
                  checked={refundType === 'full'}
                  onChange={() => setRefundType('full')}
                />
                Full Refund (${booking.TotalAmount?.toFixed(2)})
              </label>
              <label>
                <input
                  type="radio"
                  value="partial"
                  checked={refundType === 'partial'}
                  onChange={() => setRefundType('partial')}
                />
                Partial Refund
              </label>
            </div>
          </div>
          {refundType === 'partial' && (
            <div className="form-group">
              <label>Refund Amount ($)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={e => setRefundAmount(parseFloat(e.target.value))}
                max={booking.TotalAmount}
                min={0}
              />
            </div>
          )}
          <div className="form-group">
            <label>Reason for Refund</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Please provide a reason..."
              rows={3}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleRefund}
            disabled={processing || !reason.trim()}
          >
            {processing ? 'Processing...' : 'Process Refund'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Dispute Modal
const DisputeModal = ({ booking, onClose, onResolve }) => {
  const [resolution, setResolution] = useState('');
  const [action, setAction] = useState('refund_client');
  const [processing, setProcessing] = useState(false);

  const handleResolve = async () => {
    try {
      setProcessing(true);
      const response = await fetch(`${API_BASE_URL}/admin/bookings/${booking.BookingID}/resolve-dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ resolution, action })
      });

      if (response.ok) {
        showBanner('Dispute resolved', 'success');
        onResolve();
      }
    } catch (error) {
      showBanner('Failed to resolve dispute', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Resolve Dispute - Booking #{booking.BookingID}</h2>
          <button className="modal-close" onClick={onClose}>
            
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Resolution Action</label>
            <select value={action} onChange={e => setAction(e.target.value)}>
              <option value="refund_client">Full Refund to Client</option>
              <option value="partial_refund">Partial Refund to Client</option>
              <option value="favor_vendor">Rule in Favor of Vendor</option>
              <option value="split">Split Resolution</option>
            </select>
          </div>
          <div className="form-group">
            <label>Resolution Notes</label>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              placeholder="Describe the resolution and reasoning..."
              rows={4}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleResolve}
            disabled={processing || !resolution.trim()}
          >
            {processing ? 'Resolving...' : 'Resolve Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingManagementPanel;
