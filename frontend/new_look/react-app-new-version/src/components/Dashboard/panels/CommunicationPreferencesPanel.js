import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { showBanner } from '../../../utils/helpers';
import { apiGet, apiPut } from '../../../utils/api';
import { API_BASE_URL } from '../../../config';
import pushService from '../../../services/pushNotificationService';

function CommunicationPreferencesPanel({ onBack }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [preferences, setPreferences] = useState({
    email: {
      bookingConfirmations: true,
      bookingReminders: true,
      bookingUpdates: true,
      messages: true,
      payments: true,
      promotions: false,
      newsletter: false
    },
    push: {
      bookingUpdates: true,
      messages: true,
      promotions: false
    }
  });

  useEffect(() => {
    loadPreferences();
    checkPushStatus();
  }, [currentUser]);

  const checkPushStatus = async () => {
    const supported = pushService.isPushSupported();
    setPushSupported(supported);
    
    if (supported) {
      setPushPermission(pushService.getPermissionStatus());
      const subscribed = await pushService.isSubscribed();
      setPushSubscribed(subscribed);
    }
  };

  const loadPreferences = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/notification-preferences`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(prev => ({
            email: { ...prev.email, ...data.preferences.email },
            push: { ...prev.push, ...data.preferences.push }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnablePush = async () => {
    if (!currentUser?.id) return;
    
    const token = localStorage.getItem('token');
    const result = await pushService.subscribeToPush(currentUser.id, token);
    
    if (result.success) {
      setPushSubscribed(true);
      setPushPermission('granted');
      showBanner('Push notifications enabled!', 'success');
    } else if (result.permission === 'denied') {
      setPushPermission('denied');
      showBanner('Push notifications blocked. Please enable in browser settings.', 'error');
    } else {
      showBanner(result.error || 'Failed to enable push notifications', 'error');
    }
  };

  const handleDisablePush = async () => {
    if (!currentUser?.id) return;
    
    const token = localStorage.getItem('token');
    await pushService.unsubscribeFromPush(currentUser.id, token);
    setPushSubscribed(false);
    showBanner('Push notifications disabled', 'success');
  };

  const handleTestPush = async () => {
    const success = await pushService.showLocalNotification('Test Notification', {
      body: 'This is a test push notification from Planbeau!',
      tag: 'test'
    });
    if (!success) {
      showBanner('Could not show test notification', 'error');
    }
  };

  const handleToggle = (category, key) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(preferences)
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
          Customise the email and push notifications you receive.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        <form onSubmit={handleSubmit}>
          {/* Email Notifications */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-envelope" style={{ color: 'var(--primary)' }}></i>
            Email Notifications
          </h3>
          
          <ToggleSwitch
            checked={preferences.email.bookingConfirmations}
            onChange={() => handleToggle('email', 'bookingConfirmations')}
            label="Booking Confirmations"
            description="Receive email confirmations when bookings are made or updated"
          />
          <ToggleSwitch
            checked={preferences.email.bookingReminders}
            onChange={() => handleToggle('email', 'bookingReminders')}
            label="Booking Reminders"
            description="Get reminded about upcoming bookings"
          />
          <ToggleSwitch
            checked={preferences.email.bookingUpdates}
            onChange={() => handleToggle('email', 'bookingUpdates')}
            label="Booking Updates"
            description="Get notified when bookings are accepted, rejected, or cancelled"
          />
          <ToggleSwitch
            checked={preferences.email.messages}
            onChange={() => handleToggle('email', 'messages')}
            label="New Messages"
            description="Receive email notifications for new messages"
          />
          <ToggleSwitch
            checked={preferences.email.payments}
            onChange={() => handleToggle('email', 'payments')}
            label="Payment Notifications"
            description="Receive payment confirmations and invoices"
          />
          <ToggleSwitch
            checked={preferences.email.promotions}
            onChange={() => handleToggle('email', 'promotions')}
            label="Promotions & Offers"
            description="Receive special offers and promotional content"
          />
          <ToggleSwitch
            checked={preferences.email.newsletter}
            onChange={() => handleToggle('email', 'newsletter')}
            label="Newsletter"
            description="Receive our monthly newsletter with tips and updates"
          />

          {/* Push Notifications */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '2rem 0 0.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-bell" style={{ color: 'var(--primary)' }}></i>
            Browser Push Notifications
          </h3>
          
          {!pushSupported ? (
            <ToggleSwitch
              checked={false}
              onChange={() => {}}
              label="Push Notifications"
              description="Push notifications are not supported in this browser"
            />
          ) : pushPermission === 'denied' ? (
            <ToggleSwitch
              checked={false}
              onChange={() => {}}
              label="Push Notifications"
              description="Blocked - please enable in browser settings"
            />
          ) : (
            <>
              <ToggleSwitch
                checked={pushSubscribed}
                onChange={pushSubscribed ? handleDisablePush : handleEnablePush}
                label="Enable Push Notifications"
                description="Receive instant browser notifications"
              />
              {pushSubscribed && (
                <>
                  <ToggleSwitch
                    checked={preferences.push.messages}
                    onChange={() => handleToggle('push', 'messages')}
                    label="New Messages"
                    description="Get notified when you receive new messages"
                  />
                  <ToggleSwitch
                    checked={preferences.push.bookingUpdates}
                    onChange={() => handleToggle('push', 'bookingUpdates')}
                    label="Booking Updates"
                    description="Get notified about booking status changes"
                  />
                  <ToggleSwitch
                    checked={preferences.push.promotions}
                    onChange={() => handleToggle('push', 'promotions')}
                    label="Promotions"
                    description="Get notified about special offers"
                  />
                </>
              )}
            </>
          )}

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommunicationPreferencesPanel;
