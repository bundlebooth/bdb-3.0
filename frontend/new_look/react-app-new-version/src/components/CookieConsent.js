import React, { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'planbeau_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'planbeau_cookie_preferences';

// Google Analytics Measurement ID - should be configured in environment
const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: true
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences and initialize analytics if accepted
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setPreferences(prefs);
        if (prefs.analytics) {
          initializeGoogleAnalytics();
        }
      }
    }
  }, []);

  const initializeGoogleAnalytics = () => {
    if (typeof window === 'undefined' || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      console.log('[CookieConsent] Google Analytics not configured');
      return;
    }

    // Check if already loaded
    if (window.gtag) {
      console.log('[CookieConsent] Google Analytics already initialized');
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
      console.log('[CookieConsent] Google Analytics initialized');
    };
  };

  const disableGoogleAnalytics = () => {
    // Set opt-out cookie
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
    
    // Remove GA cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_ga') || name.startsWith('_gid') || name.startsWith('_gat')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  };

  // Save consent to backend database
  const saveConsentToBackend = async (prefs) => {
    try {
      const sessionId = localStorage.getItem('planbeau_session_id') || 
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('planbeau_session_id', sessionId);
      
      await fetch('/api/users/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          necessary: prefs.necessary,
          analytics: prefs.analytics,
          marketing: prefs.marketing,
          functional: prefs.functional
        })
      });
    } catch (error) {
      console.warn('[CookieConsent] Failed to save consent to backend:', error);
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    setPreferences(allAccepted);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
    initializeGoogleAnalytics();
    saveConsentToBackend(allAccepted);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: true
    };
    setPreferences(onlyNecessary);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(onlyNecessary));
    disableGoogleAnalytics();
    saveConsentToBackend(onlyNecessary);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'custom');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    
    if (preferences.analytics) {
      initializeGoogleAnalytics();
    } else {
      disableGoogleAnalytics();
    }
    
    saveConsentToBackend(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      {!showPreferences && (
        <div style={{
          position: 'fixed',
          bottom: 'env(safe-area-inset-bottom, 70px)',
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          marginBottom: '70px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B68F4" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="8" cy="9" r="1" fill="#5B68F4"/>
                <circle cx="15" cy="8" r="1" fill="#5B68F4"/>
                <circle cx="10" cy="14" r="1" fill="#5B68F4"/>
                <circle cx="16" cy="13" r="1" fill="#5B68F4"/>
                <circle cx="12" cy="17" r="1" fill="#5B68F4"/>
              </svg>
              <span style={{ fontWeight: '600', fontSize: '15px', color: '#1f2937' }}>
                We use cookies
              </span>
            </div>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '13px', 
              lineHeight: '1.4',
              margin: '0 0 12px 0'
            }}>
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
              By clicking "Accept All", you consent to our use of cookies. You can manage your preferences anytime.
            </p>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'nowrap',
              alignItems: 'center',
              justifyContent: 'flex-start'
            }}>
              <button
                onClick={() => setShowPreferences(true)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flex: '0 0 auto'
                }}
              >
                Preferences
              </button>
              <button
                onClick={handleRejectAll}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flex: '0 0 auto'
                }}
              >
                Reject
              </button>
              <button
                onClick={handleAcceptAll}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4F86E8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  whiteSpace: 'nowrap',
                  flex: '0 0 auto'
                }}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ padding: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                  Cookie Preferences
                </h2>
                <button
                  onClick={() => setShowPreferences(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#9ca3af'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
                Manage your cookie preferences below. Some cookies are essential for the website to function properly.
              </p>

              {/* Cookie Categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Necessary Cookies */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        Necessary Cookies
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        Required for the website to function. Cannot be disabled.
                      </div>
                    </div>
                    <div style={{
                      width: '44px',
                      minWidth: '44px',
                      height: '24px',
                      backgroundColor: '#4F86E8',
                      borderRadius: '12px',
                      position: 'relative',
                      opacity: 0.6,
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}/>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        Analytics Cookies
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        Help us understand how visitors interact with our website (Google Analytics).
                      </div>
                    </div>
                    <button
                      onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                      style={{
                        width: '44px',
                        minWidth: '44px',
                        height: '24px',
                        backgroundColor: preferences.analytics ? '#4F86E8' : '#d1d5db',
                        borderRadius: '12px',
                        position: 'relative',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        flexShrink: 0
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: preferences.analytics ? '22px' : '2px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'left 0.2s'
                      }}/>
                    </button>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        Marketing Cookies
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        Used to deliver personalized advertisements and track ad performance.
                      </div>
                    </div>
                    <button
                      onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                      style={{
                        width: '44px',
                        minWidth: '44px',
                        height: '24px',
                        backgroundColor: preferences.marketing ? '#4F86E8' : '#d1d5db',
                        borderRadius: '12px',
                        position: 'relative',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        flexShrink: 0
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: preferences.marketing ? '22px' : '2px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'left 0.2s'
                      }}/>
                    </button>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        Functional Cookies
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        Enable enhanced functionality like remembering your preferences.
                      </div>
                    </div>
                    <button
                      onClick={() => setPreferences(p => ({ ...p, functional: !p.functional }))}
                      style={{
                        width: '44px',
                        minWidth: '44px',
                        height: '24px',
                        backgroundColor: preferences.functional ? '#4F86E8' : '#d1d5db',
                        borderRadius: '12px',
                        position: 'relative',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        flexShrink: 0
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: preferences.functional ? '22px' : '2px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'left 0.2s'
                      }}/>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '24px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={handleRejectAll}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '12px 20px',
                    backgroundColor: 'transparent',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                >
                  Reject All
                </button>
                <button
                  onClick={handleSavePreferences}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '12px 20px',
                    backgroundColor: '#5B68F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#4A56E2'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#5B68F4'}
                >
                  Save Preferences
                </button>
              </div>

              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginTop: '16px',
                textAlign: 'center'
              }}>
                Learn more in our <a href="/privacy-policy" style={{ color: '#5B68F4' }}>Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CookieConsent;
