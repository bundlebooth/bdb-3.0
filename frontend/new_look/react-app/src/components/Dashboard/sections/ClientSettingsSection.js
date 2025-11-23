import React from 'react';

function ClientSettingsSection() {
  const handleCardClick = (cardId) => {
    console.log('Opening settings modal:', cardId);
    // In full implementation, this would open a modal
  };

  return (
    <div id="settings-section">
      {/* Personal Settings Category */}
      <div className="settings-category">
        <h2 className="settings-category-title">Personal settings</h2>
        <div className="settings-grid">
          <div 
            className="settings-card" 
            data-settings-modal="personal-details"
            onClick={() => handleCardClick('personal-details')}
            style={{ cursor: 'pointer' }}
          >
            <div className="settings-card-icon">
              <i className="fas fa-user"></i>
            </div>
            <h3 className="settings-card-title">Personal details</h3>
            <p className="settings-card-description">
              Contact information, password, authentication methods and your active sessions.
            </p>
          </div>
          <div 
            className="settings-card" 
            data-settings-modal="communication-preferences"
            onClick={() => handleCardClick('communication-preferences')}
            style={{ cursor: 'pointer' }}
          >
            <div className="settings-card-icon">
              <i className="fas fa-envelope"></i>
            </div>
            <h3 className="settings-card-title">Communication preferences</h3>
            <p className="settings-card-description">
              Customise the emails, SMS, and push notifications you receive.
            </p>
          </div>
        </div>
      </div>

      {/* Account Settings Category */}
      <div className="settings-category">
        <h2 className="settings-category-title">Account settings</h2>
        <div className="settings-grid">
          <div 
            className="settings-card" 
            data-settings-modal="security"
            onClick={() => handleCardClick('security')}
            style={{ cursor: 'pointer' }}
          >
            <div className="settings-card-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 className="settings-card-title">Security</h3>
            <p className="settings-card-description">
              Manage your account security, authorised apps, and shared resources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientSettingsSection;
