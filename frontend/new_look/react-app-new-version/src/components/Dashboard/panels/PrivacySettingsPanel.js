import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function PrivacySettingsPanel({ onBack }) {
  const { currentUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    showReviews: true,
    showForumPosts: true,
    showForumComments: true,
    showFavorites: true,
    showOnlineStatus: true
  });

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/privacy-settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          showReviews: data.ShowReviews !== false,
          showForumPosts: data.ShowForumPosts !== false,
          showForumComments: data.ShowForumComments !== false,
          showFavorites: data.ShowFavorites !== false,
          showOnlineStatus: data.ShowOnlineStatus !== false
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/privacy-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          showReviews: settings.showReviews,
          showForumPosts: settings.showForumPosts,
          showForumComments: settings.showForumComments,
          showFavorites: settings.showFavorites,
          showOnlineStatus: settings.showOnlineStatus
        })
      });

      if (response.ok) {
        showBanner('Privacy settings saved successfully', 'success');
        // Update user context if needed
        if (updateUser) {
          updateUser({ ...currentUser, privacySettings: settings });
        }
      } else {
        showBanner('Failed to save privacy settings', 'error');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      showBanner('Failed to save privacy settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="settings-panel">
        <div className="settings-panel-header">
          <button className="back-button" onClick={onBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2>Privacy Settings</h2>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '100%', height: '60px', marginBottom: '1rem' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '60px', marginBottom: '1rem' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '60px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <button className="back-button" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Privacy Settings</h2>
      </div>

      <div className="settings-panel-content" style={{ padding: '1.5rem' }}>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Control what activities are visible to others on your public profile.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Show Reviews */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div>
              <div style={{ fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                <i className="fas fa-star" style={{ marginRight: '8px', color: '#f59e0b' }}></i>
                Reviews Given
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Show reviews you've written for vendors
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showReviews}
                onChange={() => toggleSetting('showReviews')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Show Forum Posts */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div>
              <div style={{ fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                <i className="fas fa-comments" style={{ marginRight: '8px', color: '#3b82f6' }}></i>
                Forum Discussions
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Show discussions you've started in the forum
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showForumPosts}
                onChange={() => toggleSetting('showForumPosts')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Show Forum Comments */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div>
              <div style={{ fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                <i className="fas fa-reply" style={{ marginRight: '8px', color: '#8b5cf6' }}></i>
                Forum Replies
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Show your replies to forum discussions
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showForumComments}
                onChange={() => toggleSetting('showForumComments')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Show Favorites */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div>
              <div style={{ fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                <i className="fas fa-heart" style={{ marginRight: '8px', color: '#ec4899' }}></i>
                Favorited Vendors
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Show vendors you've added to favorites
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showFavorites}
                onChange={() => toggleSetting('showFavorites')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Show Online Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div>
              <div style={{ fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                <i className="fas fa-circle" style={{ marginRight: '8px', color: '#22c55e' }}></i>
                Online Status
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Show when you're online to other users
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.showOnlineStatus}
                onChange={() => toggleSetting('showOnlineStatus')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px',
            marginTop: '2rem',
            background: saving ? '#ccc' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </button>
      </div>

      <style>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 28px;
          flex-shrink: 0;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.3s;
          border-radius: 28px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        .toggle-switch input:checked + .toggle-slider {
          background-color: var(--primary);
        }
        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(22px);
        }
      `}</style>
    </div>
  );
}

export default PrivacySettingsPanel;
