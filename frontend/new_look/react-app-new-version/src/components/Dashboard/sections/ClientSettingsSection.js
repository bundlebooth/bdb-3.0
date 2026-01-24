import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../hooks/useTranslation';
import PersonalDetailsPanel from '../panels/PersonalDetailsPanel';
import CommunicationPreferencesPanel from '../panels/CommunicationPreferencesPanel';
import SecurityPanel from '../panels/SecurityPanel';
import LocationPanel from '../panels/LocationPanel';
import DeleteAccountPanel from '../panels/DeleteAccountPanel';
import LanguageCurrencyPanel from '../panels/LanguageCurrencyPanel';
import ProfileEditPanel from '../panels/ProfileEditPanel';
import PrivacySettingsPanel from '../panels/PrivacySettingsPanel';

function ClientSettingsSection() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [activePanel, setActivePanel] = useState(null);

  // Close any open panel when user changes
  useEffect(() => {
    setActivePanel(null);
  }, [currentUser?.id]);

  const settingsCards = [
    { 
      id: 'profile-edit', 
      icon: 'fa-id-card', 
      title: 'Your Profile', 
      description: 'Add personal details, interests, and fun facts to help others get to know you',
      category: 'personal'
    },
    { 
      id: 'personal-details', 
      icon: 'fa-user', 
      title: t('settings.personalDetails'), 
      description: t('settings.personalDetailsDesc'),
      category: 'personal'
    },
    { 
      id: 'location', 
      icon: 'fa-map-marker-alt', 
      title: t('settings.location'), 
      description: t('settings.locationDesc'),
      category: 'personal'
    },
    { 
      id: 'communication-preferences', 
      icon: 'fa-envelope', 
      title: t('settings.communicationPreferences'), 
      description: t('settings.communicationPreferencesDesc'),
      category: 'personal'
    },
    { 
      id: 'language-currency', 
      icon: 'fa-globe', 
      title: t('settings.languageCurrency'), 
      description: t('settings.languageCurrencyDesc'),
      category: 'personal'
    },
    { 
      id: 'privacy-settings', 
      icon: 'fa-eye-slash', 
      title: 'Privacy Settings', 
      description: 'Control what activities are visible on your public profile',
      category: 'personal'
    },
    { 
      id: 'security', 
      icon: 'fa-shield-alt', 
      title: t('settings.security'), 
      description: t('settings.securityDesc'),
      category: 'account'
    },
    { 
      id: 'delete-account', 
      icon: 'fa-trash-alt', 
      title: t('settings.deleteAccount'), 
      description: t('settings.deleteAccountDesc'),
      category: 'account',
      danger: true
    }
  ];

  const renderPanel = () => {
    const userId = currentUser?.id;
    
    switch (activePanel) {
      case 'profile-edit':
        return <ProfileEditPanel key={userId} onClose={() => setActivePanel(null)} onSave={() => setActivePanel(null)} />;
      case 'personal-details':
        return <PersonalDetailsPanel key={userId} onBack={() => setActivePanel(null)} />;
      case 'location':
        return <LocationPanel key={userId} onBack={() => setActivePanel(null)} />;
      case 'communication-preferences':
        return <CommunicationPreferencesPanel key={userId} onBack={() => setActivePanel(null)} />;
      case 'security':
        return <SecurityPanel key={userId} onBack={() => setActivePanel(null)} />;
      case 'delete-account':
        return <DeleteAccountPanel key={userId} onBack={() => setActivePanel(null)} />;
      case 'language-currency':
        return <LanguageCurrencyPanel key={userId} onBack={() => setActivePanel(null)} />;
      case 'privacy-settings':
        return <PrivacySettingsPanel key={userId} onBack={() => setActivePanel(null)} />;
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
