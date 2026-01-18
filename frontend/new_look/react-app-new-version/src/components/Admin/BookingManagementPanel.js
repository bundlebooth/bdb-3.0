import React, { useState, useEffect } from 'react';
import { showBanner, formatCurrency } from '../../utils/helpers';
import { apiGet, apiPost, apiPut } from '../../utils/api';
import UniversalModal, { FormModal, ConfirmationModal } from '../UniversalModal';
import { LoadingState, EmptyState, StatusBadge } from '../common/AdminComponents';
import { ActionButtonGroup, ActionButton as IconActionButton, ViewButton, EditButton } from '../common/UIComponents';

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
      let url = `/admin/bookings?status=${filter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`;
      if (dateRange.start) url += `&startDate=${dateRange.start}`;
      if (dateRange.end) url += `&endDate=${dateRange.end}`;
      const response = await apiGet(url);
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

  const handleCancelBooking = async (bookingId, reason, cancelledBy = 'admin', processRefund = true, refundPercent = null) => {
    try {
      const response = await apiPost(`/admin/bookings/${bookingId}/cancel`, { 
        reason,
        cancelledBy,
        processRefund,
        refundPercent
      });

      if (response.ok) {
        const data = await response.json();
        if (data.refund) {
          showBanner(`Booking cancelled. Refund of $${data.refund.amount?.toFixed(2) || 0} processed.`, 'success');
        } else {
          showBanner('Booking cancelled', 'success');
        }
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
      const response = await apiGet(`/admin/bookings/export?status=${filter}`);

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
    const normalizedStatus = status?.toLowerCase() || '';
    const statusMap = {
      'pending': { class: 'badge-warning', icon: 'fa-clock', label: 'Pending' },
      'confirmed': { class: 'badge-info', icon: 'fa-check', label: 'Confirmed' },
      'completed': { class: 'badge-success', icon: 'fa-check-circle', label: 'Completed' },
      'cancelled': { class: 'badge-danger', icon: 'fa-times-circle', label: 'Cancelled' },
      'cancelled_by_client': { class: 'badge-danger', icon: 'fa-user-times', label: 'Cancelled by Client' },
      'cancelled_by_vendor': { class: 'badge-danger', icon: 'fa-store-slash', label: 'Cancelled by Vendor' },
      'cancelled_by_admin': { class: 'badge-danger', icon: 'fa-user-shield', label: 'Cancelled by Admin' },
      'refunded': { class: 'badge-secondary', icon: 'fa-undo', label: 'Refunded' },
      'disputed': { class: 'badge-dark', icon: 'fa-exclamation-triangle', label: 'Disputed' },
      'payment_failed': { class: 'badge-danger', icon: 'fa-credit-card', label: 'Payment Failed' }
    };
    const config = statusMap[normalizedStatus] || { class: 'badge-secondary', icon: 'fa-question', label: status };
    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fas ${config.icon}`}></i> {config.label}
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
                    <div className="client-cell" style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>{booking.ClientName}</span>
                      <small style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{booking.ClientEmail}</small>
                    </div>
                  </td>
                  <td>
                    <div className="vendor-cell" style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>{booking.VendorName}</span>
                      <small style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{booking.VendorEmail}</small>
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
                    <ActionButtonGroup>
                      <ViewButton onClick={() => { setSelectedBooking(booking); setModalType('view'); }} />
                      <EditButton onClick={() => { setSelectedBooking(booking); setModalType('edit'); }} />
                      {booking.Status !== 'Cancelled' && booking.Status !== 'Completed' && (
                        <IconActionButton action="reject" onClick={() => { setSelectedBooking(booking); setModalType('cancel'); }} title="Cancel" />
                      )}
                      {(booking.Status === 'Completed' || booking.Status === 'Cancelled') && (
                        <IconActionButton action="refund" onClick={() => { setSelectedBooking(booking); setModalType('refund'); }} />
                      )}
                      {booking.Status === 'Disputed' && (
                        <IconActionButton action="approve" onClick={() => { setSelectedBooking(booking); setModalType('dispute'); }} title="Resolve" />
                      )}
                    </ActionButtonGroup>
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
          onCancel={(reason, cancelledBy, processRefund, refundPercent) => 
            handleCancelBooking(selectedBooking.BookingID, reason, cancelledBy, processRefund, refundPercent)
          }
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
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={`Booking #${booking.BookingID}`}
      size="large"
      showFooter={true}
      footer={
        <button className="um-btn um-btn-secondary" onClick={onClose}>Close</button>
      }
    >
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
    </UniversalModal>
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
      const response = await apiPut(`/admin/bookings/${booking.BookingID}`, formData);

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
    <FormModal
      isOpen={true}
      onClose={onClose}
      title={`Edit Booking #${booking.BookingID}`}
      onSave={handleSave}
      saving={saving}
      saveLabel="Save Changes"
    >
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
    </FormModal>
  );
};

// Cancel Booking Modal
const CancelBookingModal = ({ booking, onClose, onCancel }) => {
  const [reason, setReason] = useState('');
  const [cancelledBy, setCancelledBy] = useState('admin');
  const [processRefund, setProcessRefund] = useState(true);
  const [refundType, setRefundType] = useState('policy'); // 'policy', 'full', 'partial', 'none'
  const [customRefundPercent, setCustomRefundPercent] = useState(50);

  const handleCancel = () => {
    let refundPercent = null;
    if (refundType === 'full') refundPercent = 100;
    else if (refundType === 'partial') refundPercent = customRefundPercent;
    else if (refundType === 'none') refundPercent = 0;
    // 'policy' leaves it null to use vendor's cancellation policy
    
    onCancel(reason, cancelledBy, processRefund, refundPercent);
  };

  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={`Cancel Booking #${booking.BookingID}`}
      size="medium"
      footer={
        <>
          <button className="um-btn um-btn-secondary" onClick={onClose}>Keep Booking</button>
          <button
            className="um-btn um-btn-primary"
            style={{ background: '#ef4444' }}
            onClick={handleCancel}
            disabled={!reason.trim()}
          >
            Cancel Booking
          </button>
        </>
      }
    >
      <div className="warning-box" style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b' }}></i>
        <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>This action will cancel the booking and notify both the client and vendor.</p>
      </div>
      
      <div className="form-group">
        <label>Cancelled By</label>
        <select value={cancelledBy} onChange={e => setCancelledBy(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="client">Client Request</option>
          <option value="vendor">Vendor Request</option>
        </select>
      </div>

      <div className="form-group">
        <label>Cancellation Reason</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Please provide a reason for cancellation..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={processRefund}
            onChange={e => setProcessRefund(e.target.checked)}
          />
          Process Stripe Refund (excludes platform fee)
        </label>
      </div>

      {processRefund && (
        <div className="form-group" style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
          <label style={{ marginBottom: '12px', display: 'block' }}>Refund Amount</label>
          <div className="radio-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="radio" value="policy" checked={refundType === 'policy'} onChange={() => setRefundType('policy')} />
              Use Vendor's Cancellation Policy
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="radio" value="full" checked={refundType === 'full'} onChange={() => setRefundType('full')} />
              Full Refund (100%)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="radio" value="partial" checked={refundType === 'partial'} onChange={() => setRefundType('partial')} />
              Custom Partial Refund
              {refundType === 'partial' && (
                <input type="number" value={customRefundPercent} onChange={e => setCustomRefundPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} min={0} max={100} style={{ width: '60px', marginLeft: '8px' }} />
              )}
              {refundType === 'partial' && <span>%</span>}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="radio" value="none" checked={refundType === 'none'} onChange={() => setRefundType('none')} />
              No Refund (0%)
            </label>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px', marginBottom: 0 }}>
            <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
            Platform fee is never refunded and goes to Planbeau.
          </p>
        </div>
      )}
    </UniversalModal>
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
      const response = await apiPost(`/admin/bookings/${booking.BookingID}/refund`, {
        amount: refundType === 'full' ? booking.TotalAmount : refundAmount,
        reason
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
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={`Issue Refund - Booking #${booking.BookingID}`}
      size="medium"
      primaryAction={{
        label: processing ? 'Processing...' : 'Process Refund',
        onClick: handleRefund,
        loading: processing,
        disabled: !reason.trim()
      }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      <div className="info-box" style={{ background: '#f3f4f6', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 4px' }}><strong>Original Amount:</strong> ${booking.TotalAmount?.toFixed(2)}</p>
        <p style={{ margin: 0 }}><strong>Payment Method:</strong> {booking.PaymentMethod || 'Stripe'}</p>
      </div>
      <div className="form-group">
        <label>Refund Type</label>
        <div className="radio-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="radio" value="full" checked={refundType === 'full'} onChange={() => setRefundType('full')} />
            Full Refund (${booking.TotalAmount?.toFixed(2)})
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="radio" value="partial" checked={refundType === 'partial'} onChange={() => setRefundType('partial')} />
            Partial Refund
          </label>
        </div>
      </div>
      {refundType === 'partial' && (
        <div className="form-group">
          <label>Refund Amount ($)</label>
          <input type="number" value={refundAmount} onChange={e => setRefundAmount(parseFloat(e.target.value))} max={booking.TotalAmount} min={0} />
        </div>
      )}
      <div className="form-group">
        <label>Reason for Refund</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Please provide a reason..." rows={3} />
      </div>
    </UniversalModal>
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
      const response = await apiPost(`/admin/bookings/${booking.BookingID}/resolve-dispute`, { resolution, action });

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
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={`Resolve Dispute - Booking #${booking.BookingID}`}
      size="medium"
      primaryAction={{
        label: processing ? 'Resolving...' : 'Resolve Dispute',
        onClick: handleResolve,
        loading: processing,
        disabled: !resolution.trim()
      }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
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
    </UniversalModal>
  );
};

export default BookingManagementPanel;
