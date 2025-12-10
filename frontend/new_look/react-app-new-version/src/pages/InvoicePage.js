import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { decodeInvoiceId, decodeBookingId, isPublicId } from '../utils/hashIds';
import './InvoicePage.css';

function InvoicePage() {
  const { invoiceId: rawInvoiceId, bookingId: rawBookingId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Decode public IDs to internal IDs for API calls
  // The backend middleware will also handle this, but we decode here for consistency
  const invoiceId = rawInvoiceId;
  const bookingId = rawBookingId;

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!currentUser?.id) {
        setError('Please log in to view this invoice');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let url;
        
        // Use the raw public IDs in the URL - backend will decode them
        if (invoiceId) {
          url = `${API_BASE_URL}/invoices/${invoiceId}?userId=${currentUser.id}`;
        } else if (bookingId) {
          url = `${API_BASE_URL}/invoices/booking/${bookingId}?userId=${currentUser.id}`;
        } else {
          throw new Error('No invoice or booking ID provided');
        }

        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to load invoice');
        }

        const data = await response.json();
        setInvoice(data.invoice);
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, bookingId, currentUser]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // For now, just print - PDF generation would require a backend service
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="invoice-page">
        <div className="invoice-loading">
          <div className="spinner"></div>
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-page">
        <div className="invoice-error">
          <i className="fas fa-exclamation-circle"></i>
          <h2>Unable to Load Invoice</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            <i className="fas fa-arrow-left"></i> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="invoice-page">
        <div className="invoice-error">
          <i className="fas fa-file-invoice"></i>
          <h2>Invoice Not Found</h2>
          <p>The requested invoice could not be found.</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            <i className="fas fa-arrow-left"></i> Go Back
          </button>
        </div>
      </div>
    );
  }

  const isPaid = invoice.Status === 'paid' || invoice.PaymentStatus === 'paid';
  const booking = invoice.booking || {};

  return (
    <div className="invoice-page">
      <div className="invoice-actions no-print">
        <button onClick={() => navigate(-1)} className="btn-back">
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <div className="action-buttons">
          <button onClick={handlePrint} className="btn-print">
            <i className="fas fa-print"></i> Print
          </button>
          <button onClick={handleDownloadPDF} className="btn-download">
            <i className="fas fa-download"></i> Download PDF
          </button>
        </div>
      </div>

      <div className="invoice-container">
        <div className="invoice-header">
          <div className="invoice-branding">
            <h1 className="company-name">VenueVue</h1>
            <p className="company-tagline">Event Booking Platform</p>
          </div>
          <div className="invoice-title-section">
            <h2 className="invoice-title">INVOICE</h2>
            <div className="invoice-number">#{invoice.InvoiceNumber || `INV-${invoice.InvoiceID}`}</div>
            <div className={`invoice-status ${isPaid ? 'paid' : 'pending'}`}>
              {isPaid ? 'PAID' : 'PENDING'}
            </div>
          </div>
        </div>

        <div className="invoice-parties">
          <div className="party-section">
            <h3>Bill To</h3>
            <p className="party-name">{booking.ClientName || invoice.ClientName || 'Client'}</p>
            <p className="party-email">{booking.ClientEmail || invoice.ClientEmail || ''}</p>
          </div>
          <div className="party-section">
            <h3>Service Provider</h3>
            <p className="party-name">{booking.VendorName || invoice.VendorName || 'Vendor'}</p>
          </div>
          <div className="party-section">
            <h3>Invoice Details</h3>
            <p><strong>Issue Date:</strong> {formatDate(invoice.IssueDate)}</p>
            <p><strong>Due Date:</strong> {formatDate(invoice.DueDate || invoice.IssueDate)}</p>
            {isPaid && invoice.PaidAt && (
              <p><strong>Paid On:</strong> {formatDate(invoice.PaidAt)}</p>
            )}
          </div>
        </div>

        {booking.EventDate && (
          <div className="event-details">
            <h3>Event Details</h3>
            <div className="event-grid">
              {booking.EventName && (
                <div className="event-item">
                  <span className="label">Event:</span>
                  <span className="value">{booking.EventName}</span>
                </div>
              )}
              {booking.EventType && (
                <div className="event-item">
                  <span className="label">Type:</span>
                  <span className="value">{booking.EventType}</span>
                </div>
              )}
              <div className="event-item">
                <span className="label">Date:</span>
                <span className="value">{formatDate(booking.EventDate)}</span>
              </div>
              {booking.EventLocation && (
                <div className="event-item">
                  <span className="label">Location:</span>
                  <span className="value">{booking.EventLocation}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="invoice-items">
          <h3>Services & Charges</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="item-title">{item.Title || item.ServiceName || 'Service'}</div>
                      {item.Description && <div className="item-desc">{item.Description}</div>}
                    </td>
                    <td className="text-center">{item.Quantity || 1}</td>
                    <td className="text-right">{formatCurrency(item.UnitPrice)}</td>
                    <td className="text-right">{formatCurrency(item.Amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>Service</td>
                  <td className="text-center">1</td>
                  <td className="text-right">{formatCurrency(invoice.Subtotal)}</td>
                  <td className="text-right">{formatCurrency(invoice.Subtotal)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="invoice-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.Subtotal)}</span>
          </div>
          {invoice.PlatformFee > 0 && (
            <div className="summary-row">
              <span>Platform Service Fee</span>
              <span>{formatCurrency(invoice.PlatformFee)}</span>
            </div>
          )}
          {invoice.TaxAmount > 0 && (
            <div className="summary-row">
              <span>Tax (HST 13%)</span>
              <span>{formatCurrency(invoice.TaxAmount)}</span>
            </div>
          )}
          {invoice.StripeFee > 0 && (
            <div className="summary-row">
              <span>Payment Processing Fee</span>
              <span>{formatCurrency(invoice.StripeFee)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatCurrency(invoice.TotalAmount)}</span>
          </div>
          {isPaid && (
            <div className="summary-row paid">
              <span>Amount Paid</span>
              <span>{formatCurrency(invoice.TotalAmount)}</span>
            </div>
          )}
          {!isPaid && (
            <div className="summary-row due">
              <span>Amount Due</span>
              <span>{formatCurrency(invoice.TotalAmount)}</span>
            </div>
          )}
        </div>

        {invoice.payments && invoice.payments.length > 0 && (
          <div className="payment-history">
            <h3>Payment History</h3>
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment, idx) => (
                  <tr key={idx}>
                    <td>{formatDate(payment.CreatedAt)}</td>
                    <td>Stripe</td>
                    <td className="reference">{payment.StripeChargeID || '-'}</td>
                    <td className="text-right">{formatCurrency(payment.Amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="invoice-footer">
          <div className="footer-note">
            <p>Thank you for your business!</p>
            <p className="small">This invoice was generated by VenueVue. For questions, please contact support.</p>
          </div>
          {invoice.StripeSessionId && (
            <div className="stripe-reference">
              <span className="label">Payment Reference:</span>
              <span className="value">{invoice.StripeSessionId}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InvoicePage;
