import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { showBanner } from '../utils/helpers';

function ProfileModal({ isOpen, onClose }) {
  const { currentUser, handleGoogleLogin, logout, setCurrentUser } = useAuth();
  const [view, setView] = useState('login'); // 'login', 'signup', 'twofa', 'loggedIn', 'googleAccountType'
  const [loading, setLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [accountType, setAccountType] = useState('client');
  const [twofaCode, setTwofaCode] = useState(['', '', '', '', '', '']);
  const [twofaEmail, setTwofaEmail] = useState('');
  
  // Google Sign-In states
  const [googleAccountType, setGoogleAccountType] = useState('client');
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setView('loggedIn');
      } else {
        setView('login');
      }
    }
  }, [isOpen, currentUser]);

  // Decode Google JWT to get user info
  const decodeGoogleJwt = (credential) => {
    try {
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding Google JWT:', error);
      return null;
    }
  };

  const handleGoogleResponse = useCallback(async (response) => {
    try {
      // Decode the credential to check if user exists
      const decoded = decodeGoogleJwt(response.credential);
      if (!decoded) {
        showBanner('Failed to process Google login', 'error');
        return;
      }

      // Check if user already exists in our system
      const checkResponse = await fetch(`${API_BASE_URL}/users/check-email?email=${encodeURIComponent(decoded.email)}`);
      const checkData = await checkResponse.json();

      if (checkData.exists) {
        // User exists, proceed with login directly
        setLoading(true);
        const userData = await handleGoogleLogin(response.credential);
        localStorage.setItem('userSession', JSON.stringify(userData));
        showBanner('Successfully logged in with Google!', 'success');
        onClose();
        setLoading(false);
      } else {
        // New user - show account type selection
        setPendingGoogleCredential(response.credential);
        setView('googleAccountType');
      }
    } catch (error) {
      console.error('Google login error:', error);
      // If check fails, show account type selection as fallback
      setPendingGoogleCredential(response.credential);
      setView('googleAccountType');
    }
  }, [handleGoogleLogin, onClose]);

  // Handle Google Sign-In after account type selection
  const handleGoogleSignInWithAccountType = async () => {
    if (!pendingGoogleCredential) {
      showBanner('Please try signing in with Google again', 'error');
      setView('login');
      return;
    }

    try {
      setLoading(true);
      
      // Decode the credential to get user info
      const decoded = decodeGoogleJwt(pendingGoogleCredential);
      if (!decoded) {
        throw new Error('Failed to decode Google credential');
      }

      // Call social-login with account type
      const response = await fetch(`${API_BASE_URL}/users/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: decoded.email,
          name: decoded.name,
          authProvider: 'google',
          avatar: decoded.picture,
          accountType: googleAccountType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google sign-in failed');
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      const userData = {
        id: data.userId,
        userId: data.userId,
        name: data.name || data.email?.split('@')[0] || 'User',
        email: data.email,
        userType: data.isVendor ? 'vendor' : 'client',
        isVendor: data.isVendor || false,
        isAdmin: data.isAdmin || false,
        vendorProfileId: data.vendorProfileId || null
      };

      setCurrentUser(userData);
      window.currentUser = userData;
      localStorage.setItem('userSession', JSON.stringify(userData));
      
      // Clear the setup banner dismiss flag so it shows on every login
      if (userData.id) {
        localStorage.removeItem(`vv_hideSetupReminderUntilComplete_${userData.id}`);
      }

      showBanner('Successfully signed in with Google!', 'success');
      onClose();

      // If vendor account and new user, redirect to become-a-vendor page
      if (userData.isVendor && data.isNewUser) {
        setTimeout(() => {
          window.location.href = '/become-a-vendor';
        }, 500);
      }

      // Clear pending credential
      setPendingGoogleCredential(null);
      setGoogleAccountType('client');

    } catch (error) {
      console.error('Google sign-in error:', error);
      showBanner(error.message || 'Failed to sign in with Google', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Google Client ID - Set this in your .env file as REACT_APP_GOOGLE_CLIENT_ID
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const [googleInitialized, setGoogleInitialized] = useState(false);

  // Initialize Google Sign-In when modal opens and render button
  useEffect(() => {
    if (window.google && isOpen && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup'
        });
        setGoogleInitialized(true);
        
        // Render the Google button after a short delay to ensure DOM is ready
        setTimeout(() => {
          const buttonContainer = document.getElementById('google-signin-btn-container');
          if (buttonContainer && window.google) {
            buttonContainer.innerHTML = ''; // Clear previous button
            window.google.accounts.id.renderButton(
              buttonContainer,
              { 
                type: 'standard',
                theme: 'outline', 
                size: 'large', 
                width: 380,
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left'
              }
            );
          }
        }, 100);
      } catch (error) {
        console.error('Google Sign-In initialization error:', error);
        setGoogleInitialized(false);
      }
    }
  }, [isOpen, view, handleGoogleResponse, GOOGLE_CLIENT_ID]);

  // Fallback trigger for custom button (if rendered button doesn't work)
  const triggerGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      showBanner('Google Sign-In is not configured. Please use email/password to sign up.', 'info');
      return;
    }
    // The Google rendered button should handle this, but as fallback:
    showBanner('Please use the Google button that appears below.', 'info');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      showBanner('Please enter email and password', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Check if 2FA is required
      if (data.twoFactorRequired) {
        setTwofaEmail(loginEmail);
        setView('twofa');
        showBanner('Verification code sent to your email', 'info');
        return;
      }

      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Backend returns user data directly, not wrapped in data.user
      const userData = {
        id: data.userId,
        userId: data.userId,
        name: data.name || data.email?.split('@')[0] || 'User',
        email: data.email,
        userType: data.isVendor ? 'vendor' : 'client',
        isVendor: data.isVendor || false,
        isAdmin: data.isAdmin || false,
        vendorProfileId: data.vendorProfileId || null
      };
      
      setCurrentUser(userData);
      window.currentUser = userData;
      localStorage.setItem('userSession', JSON.stringify(userData));
      
      // Clear the setup banner dismiss flag so it shows on every login
      if (userData.id) {
        localStorage.removeItem(`vv_hideSetupReminderUntilComplete_${userData.id}`);
      }
      
      showBanner('Successfully logged in!', 'success');
      onClose();
    } catch (error) {
      console.error('Login error:', error);
      showBanner(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!signupName || !signupEmail || !signupPassword) {
      showBanner('Please fill in all fields', 'error');
      return;
    }

    if (signupPassword.length < 6) {
      showBanner('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          accountType: accountType
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Backend returns user data directly
      const userData = {
        id: data.userId,
        userId: data.userId,
        name: data.name || data.email?.split('@')[0] || 'User',
        email: data.email,
        userType: data.isVendor ? 'vendor' : 'client',
        isVendor: data.isVendor || false,
        isAdmin: data.isAdmin || false,
        vendorProfileId: data.vendorProfileId || null
      };
      
      setCurrentUser(userData);
      window.currentUser = userData;
      localStorage.setItem('userSession', JSON.stringify(userData));
      
      // Clear the setup banner dismiss flag so it shows on every login
      if (userData.id) {
        localStorage.removeItem(`vv_hideSetupReminderUntilComplete_${userData.id}`);
      }
      
      showBanner('Account created successfully!', 'success');
      onClose();
      
      // If vendor account, trigger dashboard modal for setup
      if (userData.isVendor) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openDashboard', { 
            detail: { section: 'vendor-settings' } 
          }));
        }, 500);
      }
    } catch (error) {
      console.error('Signup error:', error);
      showBanner(error.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFAVerify = async () => {
    const code = twofaCode.join('');
    
    if (code.length !== 6) {
      showBanner('Please enter the 6-digit code', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: twofaEmail, code })
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      const userData = {
        id: data.userId,
        userId: data.userId,
        name: data.name || data.email?.split('@')[0] || 'User',
        email: data.email,
        userType: data.isVendor ? 'vendor' : 'client',
        isVendor: data.isVendor || false,
        isAdmin: data.isAdmin || false,
        vendorProfileId: data.vendorProfileId || null
      };
      
      setCurrentUser(userData);
      window.currentUser = userData;
      localStorage.setItem('userSession', JSON.stringify(userData));
      
      // Clear the setup banner dismiss flag so it shows on every login
      if (userData.id) {
        localStorage.removeItem(`vv_hideSetupReminderUntilComplete_${userData.id}`);
      }
      
      showBanner('Successfully verified!', 'success');
      onClose();
    } catch (error) {
      console.error('2FA verification error:', error);
      showBanner('Invalid verification code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend2FA = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/resend-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: twofaEmail })
      });
      showBanner('Verification code resent', 'success');
    } catch (error) {
      showBanner('Failed to resend code', 'error');
    }
  };

  const handleTwoFAInput = (index, value) => {
    if (value.length > 1) value = value.slice(0, 1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...twofaCode];
    newCode[index] = value;
    setTwofaCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelectorAll('.otp-digit')[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  const handleLogout = () => {
    logout();
    setView('login');
    onClose();
    showBanner('Successfully logged out', 'success');
  };

  const handleViewDashboard = () => {
    onClose();
    // Trigger dashboard open event instead of using hash
    window.dispatchEvent(new CustomEvent('openDashboard'));
  };

  if (!isOpen) return null;

  return (
    <div className="modal profile-modal" id="profile-modal" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-content profile-modal-content" style={{ 
        maxWidth: '440px',
        borderRadius: '16px',
        padding: '0',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
      }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 id="profile-modal-title" style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1F2937',
            margin: 0
          }}>
            {view === 'login' && 'Welcome to PlanBeau'}
            {view === 'signup' && 'Create Account'}
            {view === 'twofa' && 'Verify Your Account'}
            {view === 'googleAccountType' && 'Choose Account Type'}
            {view === 'loggedIn' && 'My Account'}
          </h3>
          <button 
            onClick={onClose}
            className="modal-close-btn"
            style={{
              background: '#f3f4f6',
              border: 'none',
              fontSize: '20px',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '0',
              lineHeight: '1',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >×</button>
        </div>
        
        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Login Form */}
          {view === 'login' && (
            <form id="login-form" onSubmit={handleLogin}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#5B68F4'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#5B68F4'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  width: '100%', 
                  padding: '14px',
                  backgroundColor: '#5B68F4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                  transition: 'background-color 0.2s',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#4A56E2')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#5B68F4')}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ color: '#6B7280', fontSize: '14px' }}>Don't have an account? </span>
                <button 
                  type="button" 
                  onClick={() => setView('signup')} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#5B68F4', 
                    fontSize: '14px', 
                    cursor: 'pointer', 
                    padding: 0, 
                    fontFamily: 'inherit',
                    fontWeight: '500'
                  }}
                >
                  Sign up
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
                <div style={{ padding: '0 16px', color: '#9CA3AF', fontSize: '14px', fontWeight: '500' }}>OR</div>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
{/* Google Sign-In Button Container - Google renders its own button here */}
                <div 
                  id="google-signin-btn-container" 
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'center',
                    minHeight: '44px'
                  }}
                >
                  {/* Fallback button while Google button loads */}
                  {!googleInitialized && (
                    <button
                      type="button"
                      onClick={triggerGoogleSignIn}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'white',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                        <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {}}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>
              </div>
              <p style={{ 
                textAlign: 'center', 
                fontSize: '12px', 
                color: '#9CA3AF',
                marginTop: '16px',
                marginBottom: 0
              }}>
                By signing up, you agree to our <a href="/terms-of-service" style={{ color: '#5B68F4' }}>Terms of Service</a> and <a href="/privacy-policy" style={{ color: '#5B68F4' }}>Privacy Policy</a>
              </p>
            </form>
          )}

          {/* Signup Form */}
          {view === 'signup' && (
            <form id="signup-form" onSubmit={handleSignup}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                >
                  <option value="client">Client (I want to book vendors)</option>
                  <option value="vendor">Vendor (I provide services)</option>
                </select>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <button type="button" onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  Already have an account? Log in
                </button>
              </div>
              <p style={{ 
                textAlign: 'center', 
                fontSize: '12px', 
                color: '#9CA3AF',
                margin: 0
              }}>
                By signing up, you agree to our <a href="/terms-of-service" style={{ color: '#5B68F4' }}>Terms of Service</a> and <a href="/privacy-policy" style={{ color: '#5B68F4' }}>Privacy Policy</a>
              </p>
            </form>
          )}

          {/* Two-Factor Verification */}
          {view === 'twofa' && (
            <div id="twofa-form" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-light)', fontSize: '0.95rem' }}>
                Enter the 6-digit code we sent to your email: <strong>{twofaEmail}</strong>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Verification Code</label>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  {twofaCode.map((digit, index) => (
                    <input
                      key={index}
                      className="otp-digit"
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleTwoFAInput(index, e.target.value)}
                      style={{ width: '44px', height: '48px', textAlign: 'center', fontSize: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                    />
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleTwoFAVerify} disabled={loading} style={{ width: '100%', marginBottom: '0.75rem' }}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: 'auto' }}>
                <button className="btn btn-outline" onClick={handleResend2FA} style={{ flex: 1 }}>Resend Code</button>
                <button className="btn btn-outline" onClick={() => setView('login')} style={{ flex: 1 }}>Back</button>
              </div>
            </div>
          )}

          {/* Google Account Type Selection */}
          {view === 'googleAccountType' && (
            <div id="google-account-type-form" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#F0F9FF',
                borderRadius: '12px',
                border: '1px solid #BAE6FD'
              }}>
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ marginBottom: '12px' }}>
                  <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#4285F4"/>
                  <path d="M3 15.5l7.3 5.4C12.1 16.3 17.6 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 14.3 2 6 8.3 3 15.5z" fill="#EA4335"/>
                  <path d="M24 46c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.4C29.5 37.5 26.9 38.5 24 38.5c-6 0-11.1-4-12.9-9.5L3.5 34.5C6.9 41.3 14.8 46 24 46z" fill="#34A853"/>
                  <path d="M46 24c0-1.3-.2-2.7-.5-4H24v8.5h11.8c-.5 2.7-2 5-4.2 6.5l6.5 5.4C42.5 36.5 46 30.8 46 24z" fill="#FBBC05"/>
                </svg>
                <p style={{ 
                  color: '#0369A1', 
                  fontSize: '14px', 
                  margin: 0,
                  fontWeight: '500'
                }}>
                  Welcome! Choose how you'd like to use PlanBeau
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: '600',
                  fontSize: '15px',
                  color: '#374151'
                }}>
                  I want to join as:
                </label>
                
                {/* Client Option */}
                <div 
                  onClick={() => setGoogleAccountType('client')}
                  style={{
                    padding: '16px',
                    border: googleAccountType === 'client' ? '2px solid #5B68F4' : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    backgroundColor: googleAccountType === 'client' ? '#F5F6FF' : 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: googleAccountType === 'client' ? '6px solid #5B68F4' : '2px solid #D1D5DB',
                      backgroundColor: 'white',
                      flexShrink: 0
                    }} />
                    <div>
                      <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                        Client
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>
                        I want to discover and book vendors for my events
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vendor Option */}
                <div 
                  onClick={() => setGoogleAccountType('vendor')}
                  style={{
                    padding: '16px',
                    border: googleAccountType === 'vendor' ? '2px solid #5B68F4' : '1px solid #E5E7EB',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: googleAccountType === 'vendor' ? '#F5F6FF' : 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: googleAccountType === 'vendor' ? '6px solid #5B68F4' : '2px solid #D1D5DB',
                      backgroundColor: 'white',
                      flexShrink: 0
                    }} />
                    <div>
                      <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                        Vendor
                      </div>
                      <div style={{ fontSize: '13px', color: '#6B7280' }}>
                        I provide services and want to list my business
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {googleAccountType === 'vendor' && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#D97706" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <div style={{ fontSize: '13px', color: '#92400E' }}>
                    After signing in, you'll be redirected to complete your vendor profile setup.
                  </div>
                </div>
              )}

              <button 
                onClick={handleGoogleSignInWithAccountType}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#5B68F4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '12px',
                  opacity: loading ? 0.7 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#4A56E2')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#5B68F4')}
              >
                {loading ? 'Signing in...' : 'Continue with Google'}
              </button>

              <button 
                onClick={() => {
                  setView('login');
                  setPendingGoogleCredential(null);
                  setGoogleAccountType('client');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'white',
                  color: '#6B7280',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Back to Login
              </button>
            </div>
          )}

          {/* Logged In View */}
          {view === 'loggedIn' && currentUser && (
            <div id="logged-in-view" style={{ textAlign: 'center' }}>
              <div className="profile-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600, margin: '0 auto 1rem' }}>
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>{currentUser.name || 'User'}</h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>{currentUser.email || ''}</p>
              <button className="btn btn-primary" onClick={handleViewDashboard} style={{ width: '100%', marginBottom: '1rem' }}>
                View Dashboard
              </button>
              <button className="btn btn-outline" onClick={handleLogout} style={{ width: '100%' }}>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
