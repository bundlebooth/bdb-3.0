/**
 * Session Timeout Hook
 * Tracks user activity and automatically logs out inactive users
 * based on the session timeout setting configured in admin dashboard.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../utils/api';

// Default timeout in minutes (used if admin setting can't be fetched)
const DEFAULT_TIMEOUT_MINUTES = 60;

// Activity events to track
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click'
];

/**
 * Hook to manage session timeout based on admin settings
 * @param {boolean} enabled - Whether to enable session timeout tracking
 */
export function useSessionTimeout(enabled = true) {
  const { currentUser, logout } = useAuth();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const timeoutMinutesRef = useRef(DEFAULT_TIMEOUT_MINUTES);
  const isInitializedRef = useRef(false);

  // Fetch session timeout setting from admin API
  const fetchTimeoutSetting = useCallback(async () => {
    try {
      const response = await apiGet('/admin/security/2fa-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings && data.settings.sessionTimeout) {
          timeoutMinutesRef.current = parseInt(data.settings.sessionTimeout, 10) || DEFAULT_TIMEOUT_MINUTES;
          console.log(`[SessionTimeout] Loaded timeout setting: ${timeoutMinutesRef.current} minutes`);
        }
      }
    } catch (error) {
      console.warn('[SessionTimeout] Could not fetch timeout setting, using default:', DEFAULT_TIMEOUT_MINUTES);
    }
  }, []);

  // Handle user activity - reset the timeout
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Check if session has timed out
  const checkTimeout = useCallback(() => {
    if (!currentUser) return;

    const now = Date.now();
    const lastActivity = lastActivityRef.current;
    const timeoutMs = timeoutMinutesRef.current * 60 * 1000;
    const timeSinceActivity = now - lastActivity;

    if (timeSinceActivity >= timeoutMs) {
      console.log(`[SessionTimeout] Session timed out after ${timeoutMinutesRef.current} minutes of inactivity`);
      
      // Clear the timeout interval
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Log out the user with a reason
      logout('session_expired');
      
      // Redirect to login page
      window.location.href = '/login?reason=session_expired';
    }
  }, [currentUser, logout]);

  // Initialize session timeout tracking
  useEffect(() => {
    if (!enabled || !currentUser || isInitializedRef.current) return;

    isInitializedRef.current = true;
    console.log('[SessionTimeout] Initializing session timeout tracking');

    // Fetch the timeout setting from admin
    fetchTimeoutSetting();

    // Set up activity listeners
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check for timeout every minute
    timeoutRef.current = setInterval(checkTimeout, 60 * 1000);

    // Also check immediately on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTimeout();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [enabled, currentUser, fetchTimeoutSetting, handleActivity, checkTimeout]);

  // Reset tracking when user logs out
  useEffect(() => {
    if (!currentUser) {
      isInitializedRef.current = false;
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [currentUser]);

  return {
    resetActivity: handleActivity,
    timeoutMinutes: timeoutMinutesRef.current
  };
}

export default useSessionTimeout;
