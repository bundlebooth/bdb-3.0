import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function ClientInvoicesSection() {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/invoices/client/${currentUser.id}`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        console.error('Failed to load invoices');
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      showBanner('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const renderInvoiceItem = (invoice) => {
    const invoiceDate = new Date(invoice.InvoiceDate);
    const formattedDate = invoiceDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const statusClass = invoice.PaymentStatus?.toLowerCase() || 'pending';
    const statusBadge = {
      'paid': { text: 'Paid', class: 'status-paid' },
      'pending': { text: 'Pending', class: 'status-pending' },
      'overdue': { text: 'Overdue', class: 'status-overdue' },
      'cancelled': { text: 'Cancelled', class: 'status-cancelled' }
    }[statusClass] || { text: 'Pending', class: 'status-pending' };

    return (
      <div key={invoice.InvoiceId} className="invoice-item">
        <div className="invoice-header">
          <div className="invoice-number">
            <i className="fas fa-file-invoice"></i>
            <span>Invoice #{invoice.InvoiceNumber || invoice.InvoiceId}</span>
          </div>
          <span className={`status-badge ${statusBadge.class}`}>
            {statusBadge.text}
          </span>
        </div>
        <div className="invoice-details">
          <div className="invoice-detail-row">
            <span className="invoice-label">Vendor:</span>
            <span className="invoice-value">{invoice.VendorName || 'N/A'}</span>
          </div>
          <div className="invoice-detail-row">
            <span className="invoice-label">Date:</span>
            <span className="invoice-value">{formattedDate}</span>
          </div>
          <div className="invoice-detail-row">
            <span className="invoice-label">Amount:</span>
            <span className="invoice-value invoice-amount">
              ${Number(invoice.TotalAmount || 0).toLocaleString()}
            </span>
          </div>
          {invoice.DueDate && (
            <div className="invoice-detail-row">
              <span className="invoice-label">Due Date:</span>
              <span className="invoice-value">
                {new Date(invoice.DueDate).toLocaleDateString('en-US')}
              </span>
            </div>
          )}
        </div>
        <div className="invoice-actions">
          <button className="btn btn-outline btn-sm">
            <i className="fas fa-download"></i> Download
          </button>
          {invoice.PaymentStatus !== 'paid' && (
            <button className="btn btn-primary btn-sm">
              <i className="fas fa-credit-card"></i> Pay Now
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="invoices-section">
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">Invoices</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : invoices.length > 0 ? (
          <div id="client-invoices-list" className="invoices-list">
            {invoices.map(renderInvoiceItem)}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-file-invoice" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p>No invoices yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientInvoicesSection;
