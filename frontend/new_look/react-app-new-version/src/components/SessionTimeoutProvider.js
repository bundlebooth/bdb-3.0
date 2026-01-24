/**
 * Session Timeout Provider
 * Wraps the app to provide global session timeout tracking
 * based on admin security settings.
 */

import React from 'react';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useAuth } from '../context/AuthContext';

/**
 * Provider component that enables session timeout tracking globally
 */
export function SessionTimeoutProvider({ children }) {
  const { currentUser } = useAuth();
  
  // Enable session timeout tracking when user is logged in
  useSessionTimeout(!!currentUser);
  
  return <>{children}</>;
}

export default SessionTimeoutProvider;
