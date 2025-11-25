import React, { useState } from 'react';
import PersonalDetailsPanel from '../panels/PersonalDetailsPanel';
import CommunicationPreferencesPanel from '../panels/CommunicationPreferencesPanel';
import SecurityPanel from '../panels/SecurityPanel';

function ClientSettingsSection() {
  const [activePanel, setActivePanel] = useState(null);

  const settingsCards = [
    { 
      id: 'personal-details', 
      icon: 'fa-user', 
      title: 'Personal details', 
      description: 'Contact information, password, authentication methods and your active sessions.',
      category: 'personal'
    },
    { 
      id: 'communication-preferences', 
      icon: 'fa-envelope', 
      title: 'Communication preferences', 
      description: 'Customise the emails, SMS, and push notifications you receive.',
      category: 'personal'
    },
    { 
      id: 'security', 
      icon: 'fa-shield-alt', 
      title: 'Security', 
      description: 'Manage your account security, authorised apps, and shared resources.',
      category: 'account'
    }
  ];

  const renderPanel = () => {
    switch (activePanel) {
      case 'personal-details':
        return <PersonalDetailsPanel onBack={() => setActivePanel(null)} />;
      case 'communication-preferences':
        return <CommunicationPreferencesPanel onBack={() => setActivePanel(null)} />;
      case 'security':
        return <SecurityPanel onBack={() => setActivePanel(null)} />;
      default:
        return null;
    }
  };

  const personalCards = settingsCards.filter(c => c.category === 'personal');
  const accountCards = settingsCards.filter(c => c.category === 'account');

  return (
    <div id="settings-section">
      {!activePanel ? (
        <>
          {/* Personal Settings Category */}
          <div className="settings-category">
            <h2 className="settings-category-title">Personal settings</h2>
            <div className="settings-grid">
              {personalCards.map(card => (
                <div 
                  key={card.id}
                  className="settings-card" 
                  data-settings-modal={card.id}
                  onClick={() => setActivePanel(card.id)}
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

          {/* Account Settings Category */}
          <div className="settings-category">
            <h2 className="settings-category-title">Account settings</h2>
            <div className="settings-grid">
              {accountCards.map(card => (
                <div 
                  key={card.id}
                  className="settings-card" 
                  data-settings-modal={card.id}
                  onClick={() => setActivePanel(card.id)}
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
        </>
      ) : (
        renderPanel()
      )}
    </div>
  );
}

export default ClientSettingsSection;
