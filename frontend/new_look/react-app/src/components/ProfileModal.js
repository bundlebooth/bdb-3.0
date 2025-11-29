import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { showBanner } from '../utils/helpers';

function ProfileModal({ isOpen, onClose }) {
  const { currentUser, handleGoogleLogin, logout, setCurrentUser } = useAuth();
  const [view, setView] = useState('login'); // 'login', 'signup', 'twofa', 'loggedIn'
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

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setView('loggedIn');
      } else {
        setView('login');
      }
    }
  }, [isOpen, currentUser]);

  const handleGoogleResponse = useCallback(async (response) => {
    try {
      setLoading(true);
      await handleGoogleLogin(response.credential);
      showBanner('Successfully logged in with Google!', 'success');
      onClose();
    } catch (error) {
      console.error('Google login error:', error);
      showBanner('Failed to login with Google', 'error');
    } finally {
      setLoading(false);
    }
  }, [handleGoogleLogin, onClose]);

  useEffect(() => {
    // Initialize Google Sign-In
    if (window.google && isOpen) {
      try {
        window.google.accounts.id.initialize({
          client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with actual client ID
          callback: handleGoogleResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: '100%' }
        );
      } catch (error) {
        console.error('Google Sign-In initialization error:', error);
      }
    }
  }, [isOpen, handleGoogleResponse]);

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
        vendorProfileId: data.vendorProfileId || null
      };
      
      setCurrentUser(userData);
      window.currentUser = userData;
      localStorage.setItem('userSession', JSON.stringify(userData));
      
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
        vendorProfileId: data.vendorProfileId || null
      };
      
      setCurrentUser(userData);
      window.currentUser = userData;
      localStorage.setItem('userSession', JSON.stringify(userData));
      
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
        vendorProfileId: data.vendorProfileId || null
      };
      
      setCurrentUser(userData);
      window.currentUser = userData;
      localStorage.setItem('userSession', JSON.stringify(userData));
      
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
    <div className="modal" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="profile-modal-title">
            {view === 'login' && 'Log In'}
            {view === 'signup' && 'Create Account'}
            {view === 'twofa' && 'Verify Your Account'}
            {view === 'loggedIn' && 'My Account'}
          </h3>
          <span className="close-modal" onClick={onClose}>×</span>
        </div>
        
        <div className="modal-body">
          {/* Login Form */}
          {view === 'login' && (
            <form id="login-form" onSubmit={handleLogin}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  required
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <button type="button" onClick={() => setView('signup')} style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  Don't have an account? Sign up
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                <div style={{ padding: '0 1rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>OR</div>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div id="google-signin-button"></div>
              </div>
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
              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  Already have an account? Log in
                </button>
              </div>
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
