import React from 'react';

function VendorAnalyticsSection() {
  return (
    <div id="vendor-analytics-section">
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">Analytics</h2>
        <div id="analytics-charts" className="analytics-charts">
          <div className="empty-state">
            <i className="fas fa-chart-line" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p>Analytics data will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorAnalyticsSection;
