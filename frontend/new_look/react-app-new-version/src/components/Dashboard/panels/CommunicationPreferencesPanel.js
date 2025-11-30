import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function CommunicationPreferencesPanel({ onBack }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailBookingConfirmations: true,
    emailBookingReminders: true,
    emailMessages: true,
    emailPromotions: false,
    emailNewsletter: false,
    smsBookingConfirmations: false,
    smsBookingReminders: false,
    smsMessages: false,
    pushNotifications: true,
    pushMessages: true,
    pushBookingUpdates: true
  });

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  const loadPreferences = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/preferences`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(prev => ({
            ...prev,
            ...data.preferences
          }));
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ preferences })
      });
      
      if (response.ok) {
        showBanner('Communication preferences updated!', 'success');
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showBanner('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1rem 0',
      borderBottom: '1px solid #f3f4f6'
    }}>
      <div>
        <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '0.25rem' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{description}</div>
        )}
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? '#5e72e4' : '#E5E7EB',
          borderRadius: '24px',
          transition: 'background-color 0.3s'
        }}>
          <span style={{
            position: 'absolute',
            height: '20px',
            width: '20px',
            left: checked ? '22px' : '2px',
            top: '2px',
            backgroundColor: 'white',
            borderRadius: '50%',
            transition: 'left 0.3s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}></span>
        </span>
      </label>
    </div>
  );

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
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Settings
      </button>
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-envelope"></i>
          </span>
          Communication Preferences
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Customise the emails, SMS, and push notifications you receive.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        <form onSubmit={handleSubmit}>
          {/* Email Notifications */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-envelope" style={{ color: 'var(--primary)' }}></i>
            Email Notifications
          </h3>
          
          <ToggleSwitch
            checked={preferences.emailBookingConfirmations}
            onChange={() => handleToggle('emailBookingConfirmations')}
            label="Booking Confirmations"
            description="Receive email confirmations when bookings are made or updated"
          />
          <ToggleSwitch
            checked={preferences.emailBookingReminders}
            onChange={() => handleToggle('emailBookingReminders')}
            label="Booking Reminders"
            description="Get reminded about upcoming bookings"
          />
          <ToggleSwitch
            checked={preferences.emailMessages}
            onChange={() => handleToggle('emailMessages')}
            label="New Messages"
            description="Receive email notifications for new messages"
          />
          <ToggleSwitch
            checked={preferences.emailPromotions}
            onChange={() => handleToggle('emailPromotions')}
            label="Promotions & Offers"
            description="Receive special offers and promotional content"
          />
          <ToggleSwitch
            checked={preferences.emailNewsletter}
            onChange={() => handleToggle('emailNewsletter')}
            label="Newsletter"
            description="Receive our monthly newsletter with tips and updates"
          />

          {/* SMS Notifications */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '2rem 0 0.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-mobile-alt" style={{ color: 'var(--primary)' }}></i>
            SMS Notifications
          </h3>
          
          <ToggleSwitch
            checked={preferences.smsBookingConfirmations}
            onChange={() => handleToggle('smsBookingConfirmations')}
            label="Booking Confirmations"
            description="Receive SMS confirmations for bookings"
          />
          <ToggleSwitch
            checked={preferences.smsBookingReminders}
            onChange={() => handleToggle('smsBookingReminders')}
            label="Booking Reminders"
            description="Get SMS reminders before your bookings"
          />
          <ToggleSwitch
            checked={preferences.smsMessages}
            onChange={() => handleToggle('smsMessages')}
            label="New Messages"
            description="Receive SMS alerts for new messages"
          />

          {/* Push Notifications */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '2rem 0 0.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-bell" style={{ color: 'var(--primary)' }}></i>
            Push Notifications
          </h3>
          
          <ToggleSwitch
            checked={preferences.pushNotifications}
            onChange={() => handleToggle('pushNotifications')}
            label="Enable Push Notifications"
            description="Allow push notifications in your browser"
          />
          <ToggleSwitch
            checked={preferences.pushMessages}
            onChange={() => handleToggle('pushMessages')}
            label="New Messages"
            description="Get notified when you receive new messages"
          />
          <ToggleSwitch
            checked={preferences.pushBookingUpdates}
            onChange={() => handleToggle('pushBookingUpdates')}
            label="Booking Updates"
            description="Get notified about booking status changes"
          />

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommunicationPreferencesPanel;
