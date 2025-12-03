import React, { useState, useEffect } from 'react';
import PersonalDetailsPanel from '../panels/PersonalDetailsPanel';
import CommunicationPreferencesPanel from '../panels/CommunicationPreferencesPanel';
import SecurityPanel from '../panels/SecurityPanel';
import BusinessInformationPanel from '../panels/BusinessInformationPanel';
import { useAuth } from '../../../context/AuthContext';

function VendorSettingsSection() {
  const { currentUser } = useAuth();
  const [activePanel, setActivePanel] = useState(null);

  // Close any open panel when user changes
  useEffect(() => {
    setActivePanel(null);
  }, [currentUser?.id, currentUser?.vendorProfileId]);

  const settingsCards = [
    { 
      id: 'personal-details', 
      icon: 'fa-user', 
      title: 'Personal details', 
      description: 'Contact information, password, and profile picture.',
      category: 'personal'
    },
    { 
      id: 'business-information', 
      icon: 'fa-building', 
      title: 'Business information', 
      description: 'Business name, logo, categories, and pricing information.',
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
    const userId = currentUser?.id;
    const vendorId = currentUser?.vendorProfileId;
    
    switch (activePanel) {
      case 'personal-details':
        return <PersonalDetailsPanel key={userId} onBack={() => setActivePanel(null)} />;
      case 'business-information':
        return <BusinessInformationPanel key={vendorId} onBack={() => setActivePanel(null)} vendorProfileId={vendorId} />;
      case 'communication-preferences':
        return <CommunicationPreferencesPanel key={userId} onBack={() => setActivePanel(null)} />;
      case 'security':
        return <SecurityPanel key={userId} onBack={() => setActivePanel(null)} />;
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

export default VendorSettingsSection;
