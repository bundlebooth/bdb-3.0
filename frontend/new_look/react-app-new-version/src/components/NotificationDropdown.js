import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../utils/notifications';
import { useAuth } from '../context/AuthContext';

function NotificationDropdown({ isOpen, onClose, anchorEl, onBadgeCountChange }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const dropdownRef = useRef(null);
  
  // Update badge count whenever notifications change - only when dropdown is open
  // This prevents overwriting Header's initial count with 0 on mount
  useEffect(() => {
    if (onBadgeCountChange && isOpen && !loading) {
      const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;
      onBadgeCountChange(unreadCount);
    }
  }, [notifications, onBadgeCountChange, isOpen, loading]);

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
    // Update local state immediately for better UX
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true, read: true } : n
    ));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(currentUser.id);
    // Update local state immediately for better UX
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
  };

  // Navigate to appropriate page based on notification type
  const handleNotificationClick = async (notification) => {
    const isUnread = !notification.isRead && !notification.read;
    
    // Mark as read first
    if (isUnread) {
      await handleMarkAsRead(notification.id);
    }
    
    // Close dropdown
    onClose();
    
    // Navigate based on notification type
    const type = notification.type || notification.Type;
    const relatedId = notification.relatedId || notification.RelatedID;
    
    switch (type) {
      case 'message':
      case 'new_message':
        navigate('/dashboard?section=messages');
        break;
      case 'booking_request':
      case 'new_booking_request':
        navigate('/dashboard?section=bookings');
        break;
      case 'booking_approved':
      case 'booking_confirmed':
        navigate('/dashboard?section=bookings');
        break;
      case 'booking_declined':
      case 'booking_rejected':
      case 'booking_cancelled':
        navigate('/dashboard?section=bookings');
        break;
      case 'booking_reminder':
        navigate('/dashboard?section=bookings');
        break;
      case 'payment':
      case 'payment_received':
      case 'payment_reminder':
        navigate('/dashboard?section=payments');
        break;
      case 'invoice':
      case 'new_invoice':
        navigate('/dashboard?section=invoices');
        break;
      case 'review':
      case 'new_review':
        navigate('/dashboard?section=reviews');
        break;
      case 'promotion':
      case 'promotions':
        navigate('/');
        break;
      case 'newsletter':
        navigate('/');
        break;
      default:
        navigate('/dashboard');
        break;
    }
  };

  // Get notification badge with all types matching email notification types
  const getNotificationBadge = (type) => {
    const badges = {
      // Booking notifications
      'booking_request': { text: 'booking', color: '#3b82f6', icon: 'fa-calendar-plus' },
      'new_booking_request': { text: 'booking', color: '#3b82f6', icon: 'fa-calendar-plus' },
      'booking_approved': { text: 'approved', color: '#10b981', icon: 'fa-check-circle' },
      'booking_confirmed': { text: 'confirmed', color: '#10b981', icon: 'fa-check-circle' },
      'booking_declined': { text: 'declined', color: '#ef4444', icon: 'fa-times-circle' },
      'booking_rejected': { text: 'rejected', color: '#ef4444', icon: 'fa-times-circle' },
      'booking_cancelled': { text: 'cancelled', color: '#ef4444', icon: 'fa-ban' },
      'booking_reminder': { text: 'reminder', color: '#8b5cf6', icon: 'fa-clock' },
      'booking_update': { text: 'update', color: '#6366f1', icon: 'fa-sync' },
      
      // Message notifications
      'message': { text: 'message', color: '#10b981', icon: 'fa-comment' },
      'new_message': { text: 'message', color: '#10b981', icon: 'fa-comment' },
      
      // Payment notifications
      'payment': { text: 'payment', color: '#f59e0b', icon: 'fa-credit-card' },
      'payment_received': { text: 'payment', color: '#10b981', icon: 'fa-dollar-sign' },
      'payment_reminder': { text: 'reminder', color: '#f59e0b', icon: 'fa-exclamation-circle' },
      
      // Invoice notifications
      'invoice': { text: 'invoice', color: '#6366f1', icon: 'fa-file-invoice' },
      'new_invoice': { text: 'invoice', color: '#6366f1', icon: 'fa-file-invoice' },
      
      // Review notifications
      'review': { text: 'review', color: '#ec4899', icon: 'fa-star' },
      'new_review': { text: 'review', color: '#ec4899', icon: 'fa-star' },
      
      // Promotion notifications
      'promotion': { text: 'promo', color: '#f97316', icon: 'fa-tag' },
      'promotions': { text: 'promo', color: '#f97316', icon: 'fa-tag' },
      
      // Newsletter
      'newsletter': { text: 'news', color: '#0ea5e9', icon: 'fa-newspaper' },
      
      // General
      'notification': { text: 'notification', color: '#6b7280', icon: 'fa-bell' }
    };
    return badges[type] || { text: 'notification', color: '#6b7280', icon: 'fa-bell' };
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
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>Notifications</h3>
        {notifications.filter(n => !n.isRead && !n.read).length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              background: '#222',
              border: 'none',
              color: 'white',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#444'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#222'}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white'
      }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'all' ? '2px solid #222' : '2px solid transparent',
            color: activeTab === 'all' ? '#222' : '#9ca3af',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
          }}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'unread' ? '2px solid #222' : '2px solid transparent',
            color: activeTab === 'unread' ? '#222' : '#9ca3af',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '-1px'
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
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto' }}></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="fas fa-bell" style={{ fontSize: '32px', opacity: 0.3, marginBottom: '12px', display: 'block' }}></i>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const badge = getNotificationBadge(notification.type);
            const isUnread = !notification.isRead && !notification.read;
            
            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  backgroundColor: isUnread ? '#fafbfc' : 'white',
                  transition: 'background-color 0.15s',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isUnread ? '#fafbfc' : 'white';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: `${badge.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <i className={`fas ${badge.icon}`} style={{ color: badge.color, fontSize: '16px' }}></i>
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#111827',
                      lineHeight: '1.3'
                    }}>
                      {notification.title || 'New Notification'}
                    </div>
                    {isUnread && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        flexShrink: 0,
                        marginLeft: '8px',
                        marginTop: '4px'
                      }}></div>
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    marginBottom: '6px',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {notification.message || 'You have a new notification'}
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    {formatTime(notification.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          backgroundColor: 'white'
        }}>
          <button
            onClick={() => {
              onClose();
              navigate('/dashboard?section=notifications');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#222',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
