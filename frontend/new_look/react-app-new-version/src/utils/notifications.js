import { API_BASE_URL } from '../config';

// Update page title with notification count
export function updatePageTitle(notificationCount) {
  const baseTitle = 'PlanBeau - Event Booking Platform';
  if (notificationCount > 0) {
    document.title = `(${notificationCount}) ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
}

// Create notification via API
export async function createNotification(notificationData) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(notificationData)
    });
    
    if (response.ok) {
      return true;
    }
    
    // Fallback: Create notification locally
    createLocalNotification(notificationData.userId, notificationData.type, notificationData.title, notificationData.message);
    return false;
  } catch (error) {
    createLocalNotification(notificationData.userId, notificationData.type, notificationData.title, notificationData.message);
    return false;
  }
}

// Fallback function to create notifications locally
export function createLocalNotification(userId, type, title, message) {
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  
  const newNotification = {
    id: `notif_${Date.now()}`,
    userId: userId,
    type: type,
    title: title,
    message: message,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.push(newNotification);
  localStorage.setItem('notifications', JSON.stringify(notifications));
  
  return newNotification;
}

// Get unread notification count
export async function getUnreadNotificationCount(userId) {
  try {
    if (!userId) return 0;
    
    // Try API first
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/unread-count`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.unreadCount || 0;
    }
    
    // Fallback to local notifications
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter(n => n.userId === userId && !n.isRead && !n.read).length;
  } catch (error) {
    // Fallback to local notifications
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter(n => n.userId === userId && !n.isRead && !n.read).length;
  }
}

// Get all notifications for a user
export async function getUserNotifications(userId) {
  try {
    if (!userId) return [];
    
    // Try API first
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      let notifications = data.notifications || data || [];
      
      // Ensure notifications is an array
      if (!Array.isArray(notifications)) {
        notifications = [];
      }
      
      // Process and normalize notification data - matching original code structure
      notifications = notifications.map(notif => {
        // Handle different API response formats (prioritize original code field names)
        const notification = {
          id: notif.NotificationID || notif.id || notif.notification_id,
          userId: notif.UserID || notif.userId || notif.user_id,
          type: notif.Type || notif.type || notif.notification_type || 'notification',
          title: notif.Title || notif.title || notif.notification_title || 'New Notification',
          message: notif.Message || notif.message || notif.notification_message || notif.content || notif.Content || 'You have a new notification',
          isRead: notif.IsRead || notif.isRead || notif.is_read || notif.read || false,
          read: notif.Read || notif.read || notif.IsRead || notif.isRead || false,
          createdAt: notif.CreatedAt || notif.createdAt || notif.created_at || notif.timestamp || new Date().toISOString(),
          // Preserve additional fields for potential use
          relatedType: notif.RelatedType || notif.relatedType,
          relatedId: notif.RelatedID || notif.relatedId,
          actionUrl: notif.ActionURL || notif.actionUrl
        };
        
        return notification;
      });
      
      // Sort by creation date (newest first)
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return notifications;
    }
    
    // Fallback to local notifications
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter(n => n.userId === userId).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Fallback to local notifications
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter(n => n.userId === userId).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId, userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      return true;
    }
    
    // Fallback to local
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      notification.read = true;
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
    return false;
  } catch (error) {
    // Fallback to local
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      notification.read = true;
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
    return false;
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      return true;
    }
    
    // Fallback to local
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.forEach(n => {
      if (n.userId === userId) {
        n.isRead = true;
        n.read = true;
      }
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    return false;
  } catch (error) {
    // Fallback to local
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.forEach(n => {
      if (n.userId === userId) {
        n.isRead = true;
        n.read = true;
      }
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    return false;
  }
}

// Create sample notifications for testing (can be called from console)
export function createSampleNotifications(userId) {
  const sampleNotifications = [
    {
      id: `notif_${Date.now()}_1`,
      userId: userId,
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from Vu99',
      isRead: false,
      createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString() // 17h ago
    },
    {
      id: `notif_${Date.now()}_2`,
      userId: userId,
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from Vu99',
      isRead: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3d ago
    },
    {
      id: `notif_${Date.now()}_3`,
      userId: userId,
      type: 'booking_approved',
      title: 'Booking Approved',
      message: 'Your booking request has been approved by Elite Catering',
      isRead: true,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4d ago
    },
    {
      id: `notif_${Date.now()}_4`,
      userId: userId,
      type: 'booking_request',
      title: 'New Booking Request',
      message: 'You have a new booking request from Sarah Johnson',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5d ago
    },
    {
      id: `notif_${Date.now()}_5`,
      userId: userId,
      type: 'payment',
      title: 'Payment Received',
      message: 'Payment of $500 has been received for booking #12345',
      isRead: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7d ago
    }
  ];
  
  localStorage.setItem('notifications', JSON.stringify(sampleNotifications));
  return sampleNotifications;
}
