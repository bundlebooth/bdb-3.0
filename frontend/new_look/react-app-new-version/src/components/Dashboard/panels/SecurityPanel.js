import React, { useState } from 'react';

function SecurityPanel({ onBack, embedded = false }) {
  const [loading] = useState(false);

  if (loading) {
    return (
      <div>
        <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Settings
        </button>
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!embedded && (
        <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Settings
        </button>
      )}
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-shield-alt"></i>
          </span>
          Security
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Manage your account security settings.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        {/* Password Security Info */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-lock" style={{ color: 'var(--primary)' }}></i>
            Password
          </h3>
          <div style={{ 
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
              Your password was last updated when you created your account.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
              To change your password, go to <strong>Personal Details</strong> in Settings.
            </p>
          </div>
        </div>

        {/* Account Security Tips */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-info-circle" style={{ color: 'var(--primary)' }}></i>
            Security Tips
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.8 }}>
            <li>Use a strong, unique password for your account</li>
            <li>Never share your password with anyone</li>
            <li>Log out when using shared devices</li>
            <li>Keep your email address up to date for account recovery</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

export default SecurityPanel;
