import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';

function VendorInvoicesSection() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/invoices/vendor/${currentUser.vendorProfileId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      paid: { backgroundColor: '#d1fae5', color: '#065f46' },
      pending: { backgroundColor: '#fef3c7', color: '#92400e' },
      overdue: { backgroundColor: '#fee2e2', color: '#991b1b' }
    };
    return styles[status?.toLowerCase()] || styles.pending;
  };

  if (loading) {
    return (
      <div id="vendor-invoices-section">
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="vendor-invoices-section">
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">Invoices</h2>
        <div id="vendor-invoices-list">
          {invoices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {invoices.map(invoice => (
                <div key={invoice.InvoiceID} style={{
                  padding: '1.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  backgroundColor: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                        Invoice #{invoice.InvoiceNumber}
                      </div>
                      <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        {invoice.ClientName || 'Client'}
                      </div>
                    </div>
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      ...getStatusBadgeStyle(invoice.Status)
                    }}>
                      {invoice.Status || 'Pending'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-light)', marginBottom: '0.25rem' }}>Amount</div>
                      <div style={{ fontWeight: 600, color: 'var(--primary)' }}>${parseFloat(invoice.GrandTotal || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-light)', marginBottom: '0.25rem' }}>Issue Date</div>
                      <div>{new Date(invoice.IssueDate || invoice.CreatedAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-light)', marginBottom: '0.25rem' }}>Event Date</div>
                      <div>{invoice.EventDate ? new Date(invoice.EventDate).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-file-invoice" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
              <p>No invoices yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VendorInvoicesSection;
