import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    // First check localStorage for userSession (matches original)
    const storedUser = localStorage.getItem('userSession');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUser(userData);
        window.currentUser = userData;
        
        // Also fetch vendor status if user is a vendor
        if (userData.isVendor && !userData.vendorProfileId) {
          try {
            const response = await fetch(`${API_BASE_URL}/vendors/status?userId=${userData.id}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
              const vendorData = await response.json();
              if (vendorData.vendorProfileId) {
                const updatedUser = { ...userData, vendorProfileId: vendorData.vendorProfileId };
                setCurrentUser(updatedUser);
                window.currentUser = updatedUser;
                localStorage.setItem('userSession', JSON.stringify(updatedUser));
              }
            }
          } catch (error) {
            console.error('Failed to fetch vendor status:', error);
          }
        }
        
        setLoading(false);
        return;
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('userSession');
      }
    }
    
    // Fallback: check token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/verify-token`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const userData = {
            id: data.userId,
            userId: data.userId,
            name: data.name || data.email?.split('@')[0] || 'User',
            email: data.email,
            userType: data.isVendor ? 'vendor' : 'client',
            isVendor: data.isVendor || false,
            vendorProfileId: data.vendorProfileId
          };
          setCurrentUser(userData);
          window.currentUser = userData;
          localStorage.setItem('userSession', JSON.stringify(userData));
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }

  function simulateLogin(user) {
    const userData = {
      ...user,
      userId: user.id,
      isVendor: user.isVendor || false
    };
    setCurrentUser(userData);
    window.currentUser = userData;
    localStorage.setItem('userSession', JSON.stringify(userData));
    
    // Update UI elements
    updateUserInterface(userData);
    
    console.log('✅ User logged in:', userData);
  }

  function updateUserInterface(user) {
    // Update profile button
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn && user.name) {
      profileBtn.textContent = user.name.charAt(0).toUpperCase();
      profileBtn.style.backgroundColor = 'var(--primary)';
      profileBtn.style.color = 'white';
    }
  }

  async function handleGoogleLogin(credential) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/social-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential })
      });

      if (!response.ok) {
        throw new Error('Google login failed');
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
        isVendor: data.isVendor || false
      };
      
      setCurrentUser(userData);
      updateUserInterface(userData);
      
      return userData;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userSession');
    setCurrentUser(null);
    window.currentUser = null;
    
    // Reset UI
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
      profileBtn.textContent = 'S';
      profileBtn.style.backgroundColor = 'var(--primary)';
    }
  }

  async function getVendorProfileId() {
    if (currentUser?.vendorProfileId) {
      return currentUser.vendorProfileId;
    }
    
    if (!currentUser?.id) {
      throw new Error('User not logged in');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/status?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch vendor status');
      
      const data = await response.json();
      if (data.isVendor && data.vendorProfileId) {
        setCurrentUser(prev => ({
          ...prev,
          vendorProfileId: data.vendorProfileId
        }));
        return data.vendorProfileId;
      } else {
        throw new Error('Vendor profile not found');
      }
    } catch (error) {
      console.error('Error fetching vendor status:', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    setCurrentUser,
    simulateLogin,
    handleGoogleLogin,
    logout,
    getVendorProfileId,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
