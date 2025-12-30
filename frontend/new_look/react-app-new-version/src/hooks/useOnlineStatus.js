import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config';

// Global cache to prevent duplicate API calls across components
const vendorStatusCache = {
  data: {},
  lastFetch: 0,
  pendingRequest: null,
  subscribers: new Set()
};

const CACHE_TTL = 60000; // 1 minute cache TTL
const MIN_FETCH_INTERVAL = 30000; // Minimum 30 seconds between fetches
const POLLING_INTERVAL = 300000; // Poll every 5 minutes

/**
 * Hook to fetch and track online status for vendors
 * Uses global cache to prevent duplicate API calls
 */
export function useVendorOnlineStatus(vendorProfileIds, options = {}) {
  const { enabled = true } = options;
  const [statuses, setStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!enabled || !vendorProfileIds) return;

    const ids = Array.isArray(vendorProfileIds) ? vendorProfileIds : [vendorProfileIds];
    if (ids.length === 0) return;

    const now = Date.now();
    
    // Check if we have fresh cached data
    if (now - vendorStatusCache.lastFetch < MIN_FETCH_INTERVAL && Object.keys(vendorStatusCache.data).length > 0) {
      // Use cached data
      const cachedStatuses = {};
      ids.forEach(id => {
        if (vendorStatusCache.data[id]) {
          cachedStatuses[id] = vendorStatusCache.data[id];
        }
      });
      if (Object.keys(cachedStatuses).length > 0 && mountedRef.current) {
        setStatuses(cachedStatuses);
      }
      return;
    }

    // If there's already a pending request, wait for it
    if (vendorStatusCache.pendingRequest) {
      try {
        await vendorStatusCache.pendingRequest;
        const cachedStatuses = {};
        ids.forEach(id => {
          if (vendorStatusCache.data[id]) {
            cachedStatuses[id] = vendorStatusCache.data[id];
          }
        });
        if (mountedRef.current) {
          setStatuses(cachedStatuses);
        }
      } catch (e) { /* ignore */ }
      return;
    }

    setIsLoading(true);

    // Create the fetch promise
    const fetchPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/vendors/online-status/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vendorProfileIds: ids })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Update global cache
            vendorStatusCache.data = { ...vendorStatusCache.data, ...data.statuses };
            vendorStatusCache.lastFetch = Date.now();
            return data.statuses;
          }
        }
      } catch (err) {
        // Silently fail - online status is not critical
      }
      return null;
    })();

    vendorStatusCache.pendingRequest = fetchPromise;

    try {
      const result = await fetchPromise;
      if (result && mountedRef.current) {
        setStatuses(result);
      }
    } finally {
      vendorStatusCache.pendingRequest = null;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [vendorProfileIds, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    fetchStatus();

    // Single global polling interval - only one component needs to poll
    const intervalId = setInterval(fetchStatus, POLLING_INTERVAL);
    
    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchStatus]);

  return { statuses, isLoading, error: null, refresh: fetchStatus };
}

// Global cache for user online status
const userStatusCache = {
  data: {},
  lastFetch: 0,
  pendingRequest: null
};

/**
 * Hook to fetch and track online status for users
 * Uses global cache to prevent duplicate API calls
 */
export function useUserOnlineStatus(userIds, options = {}) {
  const { enabled = true } = options;
  const [statuses, setStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!enabled || !userIds) return;

    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) return;

    const now = Date.now();
    
    // Check if we have fresh cached data
    if (now - userStatusCache.lastFetch < MIN_FETCH_INTERVAL && Object.keys(userStatusCache.data).length > 0) {
      const cachedStatuses = {};
      ids.forEach(id => {
        if (userStatusCache.data[id]) {
          cachedStatuses[id] = userStatusCache.data[id];
        }
      });
      if (Object.keys(cachedStatuses).length > 0 && mountedRef.current) {
        setStatuses(cachedStatuses);
      }
      return;
    }

    // If there's already a pending request, wait for it
    if (userStatusCache.pendingRequest) {
      try {
        await userStatusCache.pendingRequest;
        const cachedStatuses = {};
        ids.forEach(id => {
          if (userStatusCache.data[id]) {
            cachedStatuses[id] = userStatusCache.data[id];
          }
        });
        if (mountedRef.current) {
          setStatuses(cachedStatuses);
        }
      } catch (e) { /* ignore */ }
      return;
    }

    setIsLoading(true);

    const fetchPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/online-status/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: ids })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            userStatusCache.data = { ...userStatusCache.data, ...data.statuses };
            userStatusCache.lastFetch = Date.now();
            return data.statuses;
          }
        }
      } catch (err) {
        // Silently fail
      }
      return null;
    })();

    userStatusCache.pendingRequest = fetchPromise;

    try {
      const result = await fetchPromise;
      if (result && mountedRef.current) {
        setStatuses(result);
      }
    } finally {
      userStatusCache.pendingRequest = null;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userIds, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    fetchStatus();

    const intervalId = setInterval(fetchStatus, POLLING_INTERVAL);
    
    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchStatus]);

  return { statuses, isLoading, error: null, refresh: fetchStatus };
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
