import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

/**
 * Hook to fetch and track online status for vendors
 * @param {number|number[]} vendorProfileIds - Single vendor ID or array of vendor IDs
 * @param {object} options - Options for the hook
 * @param {boolean} options.enabled - Whether to fetch status (default: true)
 * @param {number} options.refreshInterval - Refresh interval in ms (default: 60000 = 1 minute)
 * @returns {object} - { statuses, isLoading, error, refresh }
 */
export function useVendorOnlineStatus(vendorProfileIds, options = {}) {
  const { enabled = true, refreshInterval = 180000 } = options; // Default: 3 minutes
  const [statuses, setStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!enabled || !vendorProfileIds) return;

    const ids = Array.isArray(vendorProfileIds) ? vendorProfileIds : [vendorProfileIds];
    if (ids.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      if (ids.length === 1) {
        // Single vendor
        const response = await fetch(`${API_BASE_URL}/vendors/online-status/${ids[0]}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStatuses({ [ids[0]]: data });
          }
        }
      } else {
        // Multiple vendors - batch request
        const response = await fetch(`${API_BASE_URL}/vendors/online-status/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorProfileIds: ids })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStatuses(data.statuses);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch vendor online status:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorProfileIds, enabled]);

  useEffect(() => {
    fetchStatus();

    if (enabled && refreshInterval > 0) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, enabled, refreshInterval]);

  return { statuses, isLoading, error, refresh: fetchStatus };
}

/**
 * Hook to fetch and track online status for users
 * @param {number|number[]} userIds - Single user ID or array of user IDs
 * @param {object} options - Options for the hook
 * @returns {object} - { statuses, isLoading, error, refresh }
 */
export function useUserOnlineStatus(userIds, options = {}) {
  const { enabled = true, refreshInterval = 180000 } = options; // Default: 3 minutes
  const [statuses, setStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!enabled || !userIds) return;

    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      if (ids.length === 1) {
        // Single user
        const response = await fetch(`${API_BASE_URL}/users/online-status/${ids[0]}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStatuses({ [ids[0]]: data });
          }
        }
      } else {
        // Multiple users - batch request
        const response = await fetch(`${API_BASE_URL}/users/online-status/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: ids })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStatuses(data.statuses);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch user online status:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userIds, enabled]);

  useEffect(() => {
    fetchStatus();

    if (enabled && refreshInterval > 0) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, enabled, refreshInterval]);

  return { statuses, isLoading, error, refresh: fetchStatus };
}

/**
 * Hook to send heartbeat to keep user online status updated
 * Should be used in the main App component or layout
 */
export function useHeartbeat() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_BASE_URL}/users/heartbeat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (err) {
        // Silently fail - heartbeat is not critical
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 2 minutes
    const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);

    // Also send heartbeat on user activity
    const handleActivity = () => {
      sendHeartbeat();
    };

    // Debounce activity events
    let activityTimeout;
    const debouncedActivity = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(handleActivity, 30000); // Max once per 30 seconds
    };

    window.addEventListener('mousemove', debouncedActivity);
    window.addEventListener('keydown', debouncedActivity);
    window.addEventListener('click', debouncedActivity);
    window.addEventListener('scroll', debouncedActivity);

    return () => {
      clearInterval(interval);
      clearTimeout(activityTimeout);
      window.removeEventListener('mousemove', debouncedActivity);
      window.removeEventListener('keydown', debouncedActivity);
      window.removeEventListener('click', debouncedActivity);
      window.removeEventListener('scroll', debouncedActivity);
    };
  }, []);
}

/**
 * Online status indicator component styles
 */
export const OnlineStatusStyles = {
  dot: {
    online: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: '#22c55e',
      border: '2px solid white',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
    },
    offline: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: '#9ca3af',
      border: '2px solid white',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
    }
  },
  text: {
    online: {
      color: '#22c55e',
      fontSize: '12px',
      fontWeight: 500
    },
    offline: {
      color: '#6b7280',
      fontSize: '12px',
      fontWeight: 400
    }
  }
};

export default { useVendorOnlineStatus, useUserOnlineStatus, useHeartbeat, OnlineStatusStyles };
