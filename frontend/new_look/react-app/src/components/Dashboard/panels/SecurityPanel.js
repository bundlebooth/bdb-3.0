import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function SecurityPanel({ onBack }) {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, [currentUser]);

  const loadSecurityData = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Load active sessions
      const sessionsResp = await fetch(`${API_BASE_URL}/users/${currentUser.id}/sessions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (sessionsResp.ok) {
        const data = await sessionsResp.json();
        setSessions(data.sessions || []);
      }
      
      // Load 2FA status
      const securityResp = await fetch(`${API_BASE_URL}/users/${currentUser.id}/security`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (securityResp.ok) {
        const data = await securityResp.json();
        setTwoFactorEnabled(data.twoFactorEnabled || false);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        showBanner('Session revoked successfully', 'success');
      } else {
        throw new Error('Failed to revoke session');
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      showBanner('Failed to revoke session', 'error');
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!window.confirm('This will log you out of all devices. Continue?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/sessions/revoke-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        showBanner('All sessions revoked. You will be logged out.', 'success');
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        throw new Error('Failed to revoke sessions');
      }
    } catch (error) {
      console.error('Error revoking sessions:', error);
      showBanner('Failed to revoke sessions', 'error');
    }
  };

  const handleToggle2FA = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/security/2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ enabled: !twoFactorEnabled })
      });
      
      if (response.ok) {
        setTwoFactorEnabled(!twoFactorEnabled);
        showBanner(
          twoFactorEnabled ? 'Two-factor authentication disabled' : 'Two-factor authentication enabled',
          'success'
        );
      } else {
        throw new Error('Failed to update 2FA settings');
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      showBanner('Failed to update security settings', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    const doubleConfirmed = window.confirm(
      'This will permanently delete all your data including bookings, messages, and favorites. Type "DELETE" to confirm.'
    );
    
    if (!doubleConfirmed) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        showBanner('Account deleted successfully', 'success');
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showBanner('Failed to delete account', 'error');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            <i className="fas fa-shield-alt"></i>
          </span>
          Security
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Manage your account security, authorised apps, and shared resources.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />

        {/* Two-Factor Authentication */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-lock" style={{ color: 'var(--primary)' }}></i>
            Two-Factor Authentication
          </h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '0.25rem' }}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                Add an extra layer of security to your account
              </div>
            </div>
            <button 
              className={`btn ${twoFactorEnabled ? 'btn-outline' : 'btn-primary'}`}
              onClick={handleToggle2FA}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              {twoFactorEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Active Sessions */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <i className="fas fa-desktop" style={{ color: 'var(--primary)' }}></i>
              Active Sessions
            </h3>
            {sessions.length > 1 && (
              <button 
                className="btn btn-outline"
                onClick={handleRevokeAllSessions}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#ef4444', borderColor: '#ef4444' }}
              >
                Sign out all devices
              </button>
            )}
          </div>
          
          {sessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessions.map((session, idx) => (
                <div 
                  key={session.id || idx}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '1rem',
                    background: session.current ? '#f0f9ff' : '#f9fafb',
                    borderRadius: '8px',
                    border: session.current ? '1px solid #3b82f6' : '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <i className={`fas ${session.device?.includes('Mobile') ? 'fa-mobile-alt' : 'fa-desktop'}`} style={{ fontSize: '1.5rem', color: 'var(--text-light)' }}></i>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '0.25rem' }}>
                        {session.device || 'Unknown Device'}
                        {session.current && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                            Current
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        {session.location || 'Unknown location'} • Last active: {formatDate(session.lastActive)}
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <button 
                      className="btn btn-outline"
                      onClick={() => handleRevokeSession(session.id)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      Sign out
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              background: '#f9fafb', 
              borderRadius: '8px',
              color: 'var(--text-light)'
            }}>
              <i className="fas fa-desktop" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
              <p>No active sessions found</p>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-exclamation-triangle"></i>
            Danger Zone
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '1rem' }}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button 
            className="btn"
            onClick={handleDeleteAccount}
            style={{ 
              background: '#ef4444', 
              color: 'white', 
              border: 'none',
              padding: '0.5rem 1rem', 
              fontSize: '0.9rem' 
            }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default SecurityPanel;
