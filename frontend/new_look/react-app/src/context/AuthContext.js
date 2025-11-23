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
          // Backend returns user data directly
          setCurrentUser({
            id: data.userId,
            userId: data.userId,
            name: data.name || data.email?.split('@')[0] || 'User',
            email: data.email,
            userType: data.isVendor ? 'vendor' : 'client',
            isVendor: data.isVendor || false
          });
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
      userId: user.id
    };
    setCurrentUser(userData);
    
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
    setCurrentUser(null);
    
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
      {!loading && children}
    </AuthContext.Provider>
  );
}
