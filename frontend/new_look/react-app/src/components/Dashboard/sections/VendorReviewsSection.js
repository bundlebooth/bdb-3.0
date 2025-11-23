import React from 'react';

function VendorReviewsSection() {
  return (
    <div id="vendor-reviews-section">
      <div className="dashboard-card">
        <h2 className="dashboard-card-title">Reviews</h2>
        <div id="vendor-reviews">
          <div className="empty-state">
            <i className="fas fa-star" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
            <p>No reviews yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorReviewsSection;
