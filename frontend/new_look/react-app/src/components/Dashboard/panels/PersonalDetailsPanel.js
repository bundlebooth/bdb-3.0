import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function PersonalDetailsPanel({ onBack }) {
  const { currentUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePicture: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showBanner('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showBanner('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('profilePicture', file);

      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.profilePictureUrl || data.url;
        setFormData(prev => ({ ...prev, profilePicture: imageUrl }));
        if (updateUser) {
          updateUser({ profilePicture: imageUrl });
        }
        showBanner('Profile picture updated successfully!', 'success');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showBanner('Failed to upload profile picture', 'error');
    } finally {
      setUploading(false);
    }
  };

  const loadUserData = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    
    // First, populate from currentUser data (from localStorage/session)
    const nameFromSession = currentUser.name || '';
    const nameParts = nameFromSession.split(' ');
    const firstNameFromSession = currentUser.firstName || nameParts[0] || '';
    const lastNameFromSession = currentUser.lastName || nameParts.slice(1).join(' ') || '';
    
    // Set initial data from session immediately
    setFormData(prev => ({
      ...prev,
      firstName: firstNameFromSession,
      lastName: lastNameFromSession,
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      profilePicture: currentUser.profilePicture || ''
    }));
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Update with API data if available (API data takes precedence)
        setFormData(prev => ({
          ...prev,
          firstName: userData.FirstName || userData.firstName || prev.firstName,
          lastName: userData.LastName || userData.lastName || prev.lastName,
          email: userData.Email || userData.email || prev.email,
          phone: userData.Phone || userData.phone || prev.phone,
          profilePicture: userData.ProfilePicture || userData.profilePicture || prev.profilePicture
        }));
      } else {
        console.warn('API returned non-OK status, using session data');
      }
    } catch (error) {
      console.error('Error loading user data from API:', error);
      // Keep the session data that was already set
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords if changing
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        showBanner('New passwords do not match', 'error');
        return;
      }
      if (formData.newPassword.length < 6) {
        showBanner('Password must be at least 6 characters', 'error');
        return;
      }
      if (!formData.currentPassword) {
        showBanner('Please enter your current password', 'error');
        return;
      }
    }
    
    try {
      setSaving(true);
      
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      };
      
      // Include password change if provided
      if (formData.newPassword && formData.currentPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        showBanner('Personal details updated successfully!', 'success');
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        // Update auth context to persist the data
        if (updateUser) {
          updateUser({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            name: `${formData.firstName} ${formData.lastName}`.trim()
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showBanner(error.message || 'Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Settings
        </button>
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Settings
      </button>
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-user"></i>
          </span>
          Personal Details
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Update your contact information and password.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        <form onSubmit={handleSubmit}>
          {/* Profile Picture */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' }}>
            Profile Picture
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              border: '3px solid var(--border)',
              background: 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {formData.profilePicture ? (
                <img 
                  src={formData.profilePicture} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <i className="fas fa-user" style={{ fontSize: '2.5rem', color: 'var(--text-light)' }}></i>
              )}
            </div>
            <div>
              <button 
                type="button"
                className="btn btn-outline"
                onClick={() => document.getElementById('profile-picture-input').click()}
                disabled={uploading}
                style={{ marginBottom: '0.5rem' }}
              >
                <i className="fas fa-upload"></i> {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
              <input
                type="file"
                id="profile-picture-input"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                style={{ display: 'none' }}
              />
              <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0 }}>
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />

          {/* Contact Information */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' }}>
            Contact Information
          </h3>
          
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="first-name">First Name</label>
                <input
                  type="text"
                  id="first-name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="last-name">Last Name</label>
                <input
                  type="text"
                  id="last-name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
                <small style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                  Email cannot be changed
                </small>
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Password Change */}
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '2rem 0' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' }}>
            Change Password
          </h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            Leave blank if you don't want to change your password.
          </p>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="current-password">Current Password</label>
                <input
                  type="password"
                  id="current-password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
            </div>
            <div className="form-col"></div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  type="password"
                  id="new-password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PersonalDetailsPanel;
