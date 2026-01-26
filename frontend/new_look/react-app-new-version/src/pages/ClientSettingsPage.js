import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import './ClientSettingsPage.css';

function ClientSettingsPage() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('personal');
  
  const settingsItems = [
    { id: 'personal', label: 'Personal information', icon: 'far fa-user' },
    { id: 'security', label: 'Login & security', icon: 'fas fa-lock' },
    { id: 'privacy', label: 'Privacy', icon: 'fas fa-hand-paper' },
    { id: 'notifications', label: 'Notifications', icon: 'far fa-bell' },
    { id: 'location', label: 'Taxes', icon: 'fas fa-file-invoice-dollar' },
    { id: 'payments', label: 'Payments', icon: 'far fa-credit-card' },
    { id: 'language', label: 'Languages & currency', icon: 'fas fa-globe' },
  ];

  const handleItemClick = (id) => {
    setActiveItem(id);
    // Navigate to the specific settings page
    navigate(`/client/settings/${id}`);
  };

  return (
    <div className="settings-page">
      <Header />
      <div className="settings-page-container">
        <aside className="settings-page-sidebar">
          <h1 className="settings-page-title">Account settings</h1>
          <nav className="settings-page-nav">
            {settingsItems.map(item => (
              <button
                key={item.id}
                className={`settings-nav-item ${activeItem === item.id ? 'active' : ''}`}
                onClick={() => handleItemClick(item.id)}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main className="settings-page-main">
          <div className="settings-page-content">
            <h2 className="settings-content-title">Personal information</h2>
            
            <div className="settings-field">
              <div className="settings-field-info">
                <div className="settings-field-label">Legal name</div>
                <div className="settings-field-value">Not provided</div>
              </div>
              <button className="settings-field-action">Edit</button>
            </div>
            
            <div className="settings-field">
              <div className="settings-field-info">
                <div className="settings-field-label">Preferred first name</div>
                <div className="settings-field-value">Not provided</div>
              </div>
              <button className="settings-field-action">Add</button>
            </div>
            
            <div className="settings-field">
              <div className="settings-field-info">
                <div className="settings-field-label">Email address</div>
                <div className="settings-field-value">Not provided</div>
              </div>
              <button className="settings-field-action">Edit</button>
            </div>
            
            <div className="settings-field">
              <div className="settings-field-info">
                <div className="settings-field-label">Phone numbers</div>
                <div className="settings-field-value">Add a number so confirmed guests and vendors can get in touch.</div>
              </div>
              <button className="settings-field-action">Add</button>
            </div>
            
            <div className="settings-field">
              <div className="settings-field-info">
                <div className="settings-field-label">Identity verification</div>
                <div className="settings-field-value">Not started</div>
              </div>
              <button className="settings-field-action">Start</button>
            </div>
            
            <div className="settings-field">
              <div className="settings-field-info">
                <div className="settings-field-label">Address</div>
                <div className="settings-field-value">Not provided</div>
              </div>
              <button className="settings-field-action">Add</button>
            </div>
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default ClientSettingsPage;
