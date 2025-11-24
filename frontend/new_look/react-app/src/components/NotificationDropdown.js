import React, { useState, useEffect, useRef } from 'react';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, createSampleNotifications } from '../utils/notifications';
import { useAuth } from '../context/AuthContext';

function NotificationDropdown({ isOpen, onClose, anchorEl }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentUser?.id) {
      loadNotifications();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          anchorEl && !anchorEl.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorEl]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getUserNotifications(currentUser.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId, currentUser.id);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(currentUser.id);
    loadNotifications();
  };

  const handleCreateSamples = () => {
    createSampleNotifications(currentUser.id);
    loadNotifications();
  };

  const getNotificationBadge = (type) => {
    const badges = {
      'booking_approved': { text: 'approved', color: '#10b981' },
      'booking_declined': { text: 'declined', color: '#ef4444' },
      'booking_request': { text: 'booking', color: '#3b82f6' },
      'message': { text: 'message', color: '#10b981' },
      'payment': { text: 'payment', color: '#f59e0b' },
      'new_message': { text: 'message', color: '#10b981' }
    };
    return badges[type] || { text: 'notification', color: '#6b7280' };
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    try {
      return date.toLocaleDateString();
    } catch (e) {
      return 'Recently';
    }
  };

  if (!isOpen) return null;

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead && !n.read)
    : notifications;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: anchorEl ? anchorEl.getBoundingClientRect().bottom + 8 : '60px',
        right: '20px',
        width: '400px',
        maxHeight: '550px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              background: '#5e72e4',
              border: 'none',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4c63d2'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#5e72e4'}
          >
            Mark All Read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #f3f4f6',
        backgroundColor: '#fafafa'
      }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'all' ? '3px solid #5e72e4' : '3px solid transparent',
            color: activeTab === 'all' ? '#5e72e4' : '#6b7280',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'unread' ? '3px solid #5e72e4' : '3px solid transparent',
            color: activeTab === 'unread' ? '#5e72e4' : '#6b7280',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          Unread
        </button>
      </div>

      {/* Notifications List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        maxHeight: '400px',
        backgroundColor: '#ffffff'
      }}>
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px' }}></i>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fas fa-bell-slash" style={{ fontSize: '48px', opacity: 0.3, marginBottom: '16px', display: 'block' }}></i>
            <p style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 500 }}>
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            {activeTab === 'all' && notifications.length === 0 && (
              <button
                onClick={handleCreateSamples}
                style={{
                  background: '#5e72e4',
                  border: 'none',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  marginTop: '8px'
                }}
              >
                Create Sample Notifications
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const badge = getNotificationBadge(notification.type);
            const isUnread = !notification.isRead && !notification.read;
            
            return (
              <div
                key={notification.id}
                onClick={() => isUnread && handleMarkAsRead(notification.id)}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f3f4f6',
                  borderLeft: isUnread ? '4px solid #5e72e4' : '4px solid transparent',
                  cursor: isUnread ? 'pointer' : 'default',
                  backgroundColor: isUnread ? '#f9fafb' : 'white',
                  transition: 'background-color 0.15s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (isUnread) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isUnread) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#111827',
                    lineHeight: '1.4'
                  }}>
                    {notification.title || 'New Message'}
                  </div>
                  {isUnread && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      flexShrink: 0,
                      marginLeft: '8px',
                      marginTop: '4px'
                    }}></div>
                  )}
                </div>
                
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '10px',
                  lineHeight: '1.5'
                }}>
                  {notification.message || 'You have a new notification'}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    backgroundColor: badge.color,
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    textTransform: 'lowercase'
                  }}>
                    {badge.text}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    color: '#9ca3af'
                  }}>
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          backgroundColor: '#fafafa'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#5e72e4',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
