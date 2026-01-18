import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner, formatDateTime } from '../../utils/helpers';
import SetupIncompleteBanner from '../SetupIncompleteBanner';

function AccountStep({ currentUser, setFormData, formData, onAccountCreated, isExistingVendor, steps, isStepCompleted, setCurrentStep, profileStatus, rejectionReason, submittedAt, reviewedAt }) {
  const [mode, setMode] = useState('signup'); // 'signup' or 'login'
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  // Check if user is an existing vendor (either from state or from currentUser data)
  const isVendorWithProfile = isExistingVendor || (currentUser?.isVendor && currentUser?.vendorProfileId);

  if (currentUser) {
    const formatDate = formatDateTime;

    // Show pending review message if profile is submitted
    if (profileStatus === 'pending_review') {
      return (
        <div className="account-step" style={{ width: '100%' }}>
          {/* Icon */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <i className="fas fa-clock" style={{ color: '#3b82f6', fontSize: '1.5rem' }}></i>
          </div>
          
          {/* Title */}
          <h3 style={{ margin: '0 0 0.5rem', color: '#1e40af', fontSize: '1.25rem', fontWeight: 600 }}>
            Profile Under Review
          </h3>
          
          {/* Description */}
          <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Your vendor profile has been submitted and is currently being reviewed by our support team. 
            This process typically takes <strong>1-2 business days</strong>. You'll receive an email when your profile is reviewed.
          </p>
          
          {/* Timestamps at bottom */}
          {formatDate(submittedAt) && (
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Submitted: <strong style={{ color: '#1e40af' }}>{formatDate(submittedAt)}</strong>
            </div>
          )}
        </div>
      );
    }

    // Show approved message if profile is approved
    if (profileStatus === 'approved') {
      return (
        <div className="account-step" style={{ width: '100%' }}>
          {/* Icon */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <i className="fas fa-check" style={{ color: '#10b981', fontSize: '1.5rem' }}></i>
          </div>
          
          {/* Title */}
          <h3 style={{ margin: '0 0 0.5rem', color: '#166534', fontSize: '1.25rem', fontWeight: 600 }}>
            Profile Approved
          </h3>
          
          {/* Description */}
          <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Congratulations! Your vendor profile has been approved and is now live. 
            Clients can find and book your services.
          </p>
          
          {/* Timestamps at bottom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: '#6b7280' }}>
            {formatDate(submittedAt) && (
              <div>Submitted: <strong style={{ color: '#166534' }}>{formatDate(submittedAt)}</strong></div>
            )}
            {formatDate(reviewedAt) && (
              <div>Approved: <strong style={{ color: '#166534' }}>{formatDate(reviewedAt)}</strong></div>
            )}
          </div>
        </div>
      );
    }

    // Show rejected message if profile needs changes
    if (profileStatus === 'rejected') {
      return (
        <div className="account-step" style={{ width: '100%' }}>
          {/* Icon */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <i className="fas fa-times" style={{ color: '#ef4444', fontSize: '1.5rem' }}></i>
          </div>
          
          {/* Title */}
          <h3 style={{ margin: '0 0 0.5rem', color: '#991b1b', fontSize: '1.25rem', fontWeight: 600 }}>
            Changes Requested
          </h3>
          
          {/* Description */}
          <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Our team has reviewed your profile and requested some changes. 
            Please review the feedback below and update your profile accordingly.
          </p>

          {/* Rejection Reason Section */}
          {rejectionReason && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                Feedback from our team:
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {rejectionReason}
              </div>
            </div>
          )}
          
          {/* Timestamps at bottom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: '#6b7280' }}>
            {formatDate(submittedAt) && (
              <div>Submitted: <strong style={{ color: '#991b1b' }}>{formatDate(submittedAt)}</strong></div>
            )}
            {formatDate(reviewedAt) && (
              <div>Reviewed: <strong style={{ color: '#991b1b' }}>{formatDate(reviewedAt)}</strong></div>
            )}
          </div>
        </div>
      );
    }

    // Default: Show normal step progress for draft profiles
    return (
      <div className="account-step" style={{ width: '100%' }}>
        <div style={{ width: '100%' }}>

          {/* Section Progress Indicators - Using shared SetupIncompleteBanner component */}
          {isVendorWithProfile && steps && (
            <SetupIncompleteBanner
              steps={steps}
              isStepCompleted={isStepCompleted}
              onStepClick={(stepKey) => {
                const stepIndex = steps.findIndex(s => s.id === stepKey);
                if (stepIndex !== -1) {
                  setCurrentStep(stepIndex);
                }
              }}
              hideButtons={true}
              showAllSteps={true}
            />
          )}

          {!isVendorWithProfile && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#5e72e4',
                marginBottom: '1rem'
              }}>
                <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', color: 'white' }}></i>
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1f2937', fontWeight: '600' }}>Welcome, {currentUser.name}!</h2>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Let's set up your vendor profile and start getting bookings.</p>
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                borderRadius: '8px',
                color: '#6b7280',
                fontSize: '0.9rem'
              }}>
                <i className="fas fa-envelope"></i>
                <span>{currentUser.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === 'signup') {
      if (accountData.password !== accountData.confirmPassword) {
        showBanner('Passwords do not match', 'error');
        return;
      }
      if (accountData.password.length < 6) {
        showBanner('Password must be at least 6 characters', 'error');
        return;
      }
    }

    try {
      setLoading(true);
      const endpoint = mode === 'signup' ? '/users/register' : '/users/login';
      
      const payload = mode === 'signup' 
        ? {
            name: accountData.name,
            email: accountData.email,
            password: accountData.password,
            isVendor: true,
            accountType: 'vendor'
          }
        : {
            email: accountData.email,
            password: accountData.password
          };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `${mode === 'signup' ? 'Registration' : 'Login'} failed`);
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem('token', data.token);
      
      // Create user object - check if user is already a vendor from API response
      const existingVendorProfileId = data.vendorProfileId || data.user?.vendorProfileId;
      const isExistingVendorUser = data.isVendor || data.user?.isVendor || !!existingVendorProfileId;
      
      const userData = {
        id: data.userId || data.user?.id,
        userId: data.userId || data.user?.id,
        name: accountData.name || data.user?.name || data.name,
        email: accountData.email || data.user?.email || data.email,
        userType: isExistingVendorUser ? 'vendor' : 'client',
        isVendor: isExistingVendorUser,
        vendorProfileId: existingVendorProfileId
      };
      
      // Store user session
      localStorage.setItem('userSession', JSON.stringify(userData));
      
      // Update form data with email
      setFormData(prev => ({ ...prev, email: accountData.email }));
      
      showBanner(`${mode === 'signup' ? 'Account created' : 'Logged in'} successfully!`, 'success');
      
      // Call callback to update auth and move to next step
      if (onAccountCreated) {
        onAccountCreated(userData);
      }

    } catch (error) {
      console.error('Account error:', error);
      showBanner(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Consistent modal-style login matching ProfileModal
  return (
    <div className="account-step">
      <div style={{ 
        maxWidth: '440px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '0',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1F2937',
            margin: 0
          }}>
            Welcome to Planbeau
          </h3>
        </div>
        
        <div style={{ padding: '24px' }}>
          {mode === 'login' ? (
            <form onSubmit={handleAccountSubmit}>
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
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
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
                  value={accountData.password}
                  onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  width: '100%', 
                  padding: '14px',
                  backgroundColor: '#222222',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ color: '#6B7280', fontSize: '14px' }}>Don't have an account? </span>
                <button 
                  type="button" 
                  onClick={() => setMode('signup')} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#222222', 
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
                <button
                  type="button"
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
                <button
                  type="button"
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
          ) : (
            <form onSubmit={handleAccountSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Full Name *</label>
                <input
                  type="text"
                  value={accountData.name}
                  onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                  placeholder="John Doe"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Email *</label>
                <input
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  placeholder="your@email.com"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Password *</label>
                <input
                  type="password"
                  value={accountData.password}
                  onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                  minLength="6"
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#374151'
                }}>Confirm Password *</label>
                <input
                  type="password"
                  value={accountData.confirmPassword}
                  onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                  minLength="6"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                style={{ 
                  width: '100%', 
                  padding: '14px',
                  backgroundColor: '#222222',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account & Continue'}
              </button>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ color: '#6B7280', fontSize: '14px' }}>Already have an account? </span>
                <button 
                  type="button" 
                  onClick={() => setMode('login')} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#222222', 
                    fontSize: '14px', 
                    cursor: 'pointer', 
                    padding: 0, 
                    fontFamily: 'inherit',
                    fontWeight: '500'
                  }}
                >
                  Log in
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
        </div>
      </div>
    </div>
  );
}

export default AccountStep;
