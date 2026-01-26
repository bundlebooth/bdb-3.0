import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import { useTranslation } from '../hooks/useTranslation';
import './ClientPage.css';
import './ClientSettingsPage.css';

function ClientSettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/client/bookings', label: 'My Bookings', icon: 'fas fa-calendar-check' },
    { path: '/client/messages', label: 'Messages', icon: 'fas fa-comments' },
    { path: '/client/favorites', label: 'Favorites', icon: 'fas fa-heart' },
    { path: '/client/reviews', label: 'Reviews', icon: 'fas fa-star' },
    { path: '/client/invoices', label: 'Invoices', icon: 'fas fa-file-invoice' },
    { path: '/client/settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  const settingsCards = [
    { 
      id: 'profile', 
      icon: 'fa-id-card', 
      title: 'Your Profile', 
      description: 'Add personal details, interests, and fun facts to help others get to know you',
      category: 'personal',
      route: '/client/settings/profile'
    },
    { 
      id: 'personal', 
      icon: 'fa-user', 
      title: t('settings.personalDetails'), 
      description: t('settings.personalDetailsDesc'),
      category: 'personal',
      route: '/client/settings/personal'
    },
    { 
      id: 'location', 
      icon: 'fa-map-marker-alt', 
      title: 'Location & Tax', 
      description: 'Set your province for accurate tax calculation on payments.',
      category: 'personal',
      route: '/client/settings/location'
    },
    { 
      id: 'communication', 
      icon: 'fa-envelope', 
      title: t('settings.communicationPreferences'), 
      description: t('settings.communicationPreferencesDesc'),
      category: 'personal',
      route: '/client/settings/communication'
    },
    { 
      id: 'language', 
      icon: 'fa-globe', 
      title: t('settings.languageCurrency'), 
      description: t('settings.languageCurrencyDesc'),
      category: 'personal',
      route: '/client/settings/language'
    },
    { 
      id: 'privacy', 
      icon: 'fa-eye-slash', 
      title: 'Privacy Settings', 
      description: 'Control what activities are visible on your public profile',
      category: 'personal',
      route: '/client/settings/privacy'
    },
    { 
      id: 'security', 
      icon: 'fa-shield-alt', 
      title: t('settings.security'), 
      description: t('settings.securityDesc'),
      category: 'account',
      route: '/client/settings/security'
    },
    { 
      id: 'delete', 
      icon: 'fa-trash-alt', 
      title: t('settings.deleteAccount'), 
      description: t('settings.deleteAccountDesc'),
      category: 'account',
      danger: true,
      route: '/client/settings/delete'
    }
  ];

  const personalCards = settingsCards.filter(c => c.category === 'personal');
  const accountCards = settingsCards.filter(c => c.category === 'account');

  return (
    <div className="client-page">
      <Header />
      <div className="client-page-container">
        <aside className="client-page-sidebar">
          <h1 className="client-page-sidebar-title">Settings</h1>
          <nav className="client-page-sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.path}
                className={`client-page-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <i className={item.icon}></i>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="client-page-main">
          <div className="client-page-content">
            {/* Personal Settings Category */}
            <div className="settings-category">
              <h2 className="settings-category-title">Personal settings</h2>
              <div className="settings-grid">
                {personalCards.map(card => (
                  <div 
                    key={card.id}
                    className="settings-card" 
                    onClick={() => navigate(card.route)}
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
                    className={`settings-card ${card.danger ? 'danger' : ''}`}
                    onClick={() => navigate(card.route)}
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
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default ClientSettingsPage;
