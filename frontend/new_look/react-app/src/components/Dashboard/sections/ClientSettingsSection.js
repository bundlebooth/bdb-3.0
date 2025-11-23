import React, { useState } from 'react';

function ClientSettingsSection() {
  const [selectedModal, setSelectedModal] = useState(null);

  const settingsCards = [
    {
      id: 'personal-details',
      icon: 'fa-user',
      title: 'Personal details',
      description: 'Contact information, password, authentication methods and your active sessions.'
    },
    {
      id: 'communication-preferences',
      icon: 'fa-envelope',
      title: 'Communication preferences',
      description: 'Customise the emails, SMS, and push notifications you receive.'
    },
    {
      id: 'security',
      icon: 'fa-shield-alt',
      title: 'Security',
      description: 'Manage your account security, authorised apps, and shared resources.'
    }
  ];

  const handleCardClick = (cardId) => {
    setSelectedModal(cardId);
    // In a full implementation, this would open a modal with the settings form
    console.log('Opening settings modal:', cardId);
  };

  return (
    <div id="settings-section">
      <div className="settings-category">
        <h2 className="settings-category-title">Personal settings</h2>
        <div className="settings-grid">
          {settingsCards.slice(0, 2).map(card => (
            <div 
              key={card.id}
              className="settings-card" 
              data-settings-modal={card.id}
              onClick={() => handleCardClick(card.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="settings-card-icon">
                <i className={`fas ${card.icon}`}></i>
              </div>
              <h3 className="settings-card-title">{card.title}</h3>
              <p className="settings-card-description">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="settings-category">
        <h2 className="settings-category-title">Account settings</h2>
        <div className="settings-grid">
          {settingsCards.slice(2).map(card => (
            <div 
              key={card.id}
              className="settings-card" 
              data-settings-modal={card.id}
              onClick={() => handleCardClick(card.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="settings-card-icon">
                <i className={`fas ${card.icon}`}></i>
              </div>
              <h3 className="settings-card-title">{card.title}</h3>
              <p className="settings-card-description">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClientSettingsSection;
