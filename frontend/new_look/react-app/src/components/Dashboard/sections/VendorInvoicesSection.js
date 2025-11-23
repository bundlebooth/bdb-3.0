import React from 'react';

function VendorInvoicesSection() {
  return (
    <div id="vendor-invoices-section">
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">Invoices</h2>
        <div id="vendor-invoices-list">
          <div className="empty-state">
            <i className="fas fa-file-invoice" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p>No invoices yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorInvoicesSection;
