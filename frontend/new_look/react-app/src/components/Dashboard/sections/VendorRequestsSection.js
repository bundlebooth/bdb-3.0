import React, { useState } from 'react';

function VendorRequestsSection() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div id="vendor-requests-section">
      <div className="dashboard-card">
        <div className="requests-filter-tabs" id="vendor-requests-tabs" style={{ marginBottom: '.8rem' }}>
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} 
            data-status="all"
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} 
            data-status="pending"
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button 
            className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`} 
            data-status="approved"
            onClick={() => setActiveTab('approved')}
          >
            Accepted
          </button>
          <button 
            className={`tab-btn ${activeTab === 'declined' ? 'active' : ''}`} 
            data-status="declined"
            onClick={() => setActiveTab('declined')}
          >
            Declined
          </button>
          <button 
            className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`} 
            data-status="expired"
            onClick={() => setActiveTab('expired')}
          >
            Expired
          </button>
        </div>
        <div id="vendor-pending-requests">
          <div className="empty-state">No booking requests yet.</div>
        </div>
      </div>
    </div>
  );
}

export default VendorRequestsSection;
