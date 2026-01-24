import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';
import './ProfileEditPanel.css';

/**
 * ProfileEditPanel - Airbnb-style profile editing component
 * Clean, visual layout matching Airbnb's profile editor
 */
const ProfileEditPanel = ({ onClose, onSave }) => {
  const { currentUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [interestOptions, setInterestOptions] = useState([]);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    bio: '',
    work: '',
    city: '',
    state: '',
    country: '',
    languages: '',
    decadeBorn: '',
    school: '',
    obsessedWith: '',
    pets: '',
    spendTimeDoing: '',
    funFact: '',
    uselessSkill: '',
    biographyTitle: '',
    favoriteQuote: '',
    phone: ''
  });
  
  const [selectedInterests, setSelectedInterests] = useState([]);

  useEffect(() => {
    loadProfile();
    loadInterestOptions();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/user-profile`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const user = data.user || {};
        const profile = data.profile || {};
        
        setFormData({
          firstName: user.FirstName || '',
          lastName: user.LastName || '',
          displayName: profile.DisplayName || '',
          bio: profile.Bio || '',
          work: profile.Work || '',
          city: profile.City || '',
          state: profile.State || '',
          country: profile.Country || '',
          languages: profile.Languages || '',
          decadeBorn: profile.DecadeBorn || '',
          school: profile.School || '',
          obsessedWith: profile.ObsessedWith || '',
          pets: profile.Pets || '',
          spendTimeDoing: profile.SpendTimeDoing || '',
          funFact: profile.FunFact || '',
          uselessSkill: profile.UselessSkill || '',
          biographyTitle: profile.BiographyTitle || '',
          favoriteQuote: profile.FavoriteQuote || '',
          phone: user.Phone || ''
        });
        
        setSelectedInterests(data.interests || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInterestOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/interest-options`);
      if (response.ok) {
        const data = await response.json();
        setInterestOptions(data.grouped || {});
      }
    } catch (error) {
      console.error('Error loading interest options:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest, category) => {
    setSelectedInterests(prev => {
      const exists = prev.find(i => (i.Interest || i.interest || i) === interest);
      if (exists) {
        return prev.filter(i => (i.Interest || i.interest || i) !== interest);
      } else {
        return [...prev, { interest, category }];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const profileResponse = await fetch(`${API_BASE_URL}/users/${currentUser.id}/user-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!profileResponse.ok) throw new Error('Failed to save profile');
      
      const interestsResponse = await fetch(`${API_BASE_URL}/users/${currentUser.id}/interests`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ interests: selectedInterests })
      });
      
      if (!interestsResponse.ok) throw new Error('Failed to save interests');
      
      showBanner('Profile updated successfully!', 'success');
      if (refreshUser) refreshUser();
      if (onSave) onSave();
      
    } catch (error) {
      console.error('Error saving profile:', error);
      showBanner('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Profile field definitions - Airbnb style
  const profileFields = [
    { id: 'decadeBorn', icon: 'map-marker-alt', label: 'Decade I was born', placeholder: 'Decade I was born' },
    { id: 'favoriteDestination', icon: 'plane', label: "Where I've always wanted to go", placeholder: "Where I've always wanted to go", field: 'favoriteQuote' },
    { id: 'work', icon: 'briefcase', label: 'My work', placeholder: 'My work' },
    { id: 'pets', icon: 'paw', label: 'Pets', placeholder: 'Pets' },
    { id: 'school', icon: 'graduation-cap', label: 'Where I went to school', placeholder: 'Where I went to school' },
    { id: 'uselessSkill', icon: 'pencil-alt', label: 'My most useless skill', placeholder: 'My most useless skill' },
    { id: 'spendTimeDoing', icon: 'clock', label: 'I spend too much time', placeholder: 'I spend too much time' },
    { id: 'funFact', icon: 'lightbulb', label: 'My fun fact', placeholder: 'My fun fact' },
    { id: 'biographyTitle', icon: 'book', label: 'My biography title would be', placeholder: 'My biography title would be' },
    { id: 'obsessedWith', icon: 'heart', label: 'My obsession', placeholder: 'My obsession' },
    { id: 'city', icon: 'globe', label: 'Where I live', placeholder: 'Where I live' },
    { id: 'languages', icon: 'language', label: 'Languages I speak', placeholder: 'Languages I speak' },
  ];

  const getFieldValue = (field) => {
    const actualField = field.field || field.id;
    return formData[actualField] || '';
  };

  const setFieldValue = (field, value) => {
    const actualField = field.field || field.id;
    handleChange(actualField, value);
  };

  if (loading) {
    return (
      <div className="airbnb-profile-panel">
        <div className="airbnb-profile-loading">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="airbnb-profile-panel">
      {/* Two Column Layout */}
      <div className="airbnb-profile-layout">
        {/* Left Column - Avatar */}
        <div className="airbnb-profile-avatar-section">
          <div className="airbnb-avatar-container">
            <div className="airbnb-avatar">
              {currentUser?.profileImageURL ? (
                <img src={currentUser.profileImageURL} alt={formData.firstName} />
              ) : (
                <span className="airbnb-avatar-letter">
                  {(formData.firstName || currentUser?.firstName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button className="airbnb-avatar-add-btn">
              <i className="fas fa-camera"></i> Add
            </button>
          </div>
        </div>

        {/* Right Column - Profile Content */}
        <div className="airbnb-profile-content">
          <div className="airbnb-profile-header">
            <h1>My profile</h1>
            <p className="airbnb-profile-subtitle">
              Hosts and guests can see your profile, and it may appear across Planbeau to help us build trust in our community. <a href="#">Learn more</a>
            </p>
          </div>

          {/* Profile Fields Grid */}
          <div className="airbnb-profile-fields">
            {profileFields.map((field) => {
              const value = getFieldValue(field);
              const isEditing = editingField === field.id;
              
              return (
                <div key={field.id} className="airbnb-profile-field">
                  {isEditing ? (
                    <div className="airbnb-field-edit">
                      <i className={`fas fa-${field.icon}`}></i>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setFieldValue(field, e.target.value)}
                        placeholder={field.placeholder}
                        autoFocus
                        onBlur={() => setEditingField(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                      />
                    </div>
                  ) : (
                    <div 
                      className={`airbnb-field-display ${value ? 'has-value' : ''}`}
                      onClick={() => setEditingField(field.id)}
                    >
                      <i className={`fas fa-${field.icon}`}></i>
                      <span className={value ? 'field-value' : 'field-placeholder'}>
                        {value || field.placeholder}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* About Me Section */}
          <div className="airbnb-about-section">
            <h2>About me</h2>
            <div 
              className="airbnb-about-box"
              onClick={() => setEditingField('bio')}
            >
              {editingField === 'bio' ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Write something fun and punchy."
                  autoFocus
                  onBlur={() => setEditingField(null)}
                  maxLength={500}
                />
              ) : (
                <>
                  {formData.bio ? (
                    <p className="about-text">{formData.bio}</p>
                  ) : (
                    <p className="about-placeholder">
                      Write something fun and punchy.<br />
                      <span className="add-link">Add intro</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* My Interests Section */}
          <div className="airbnb-interests-section">
            <h2>My interests</h2>
            <p className="airbnb-interests-subtitle">
              Find common ground with other guests and hosts by adding interests to your profile.
            </p>
            
            <div className="airbnb-interests-display">
              {selectedInterests.length > 0 ? (
                <div className="airbnb-interest-tags">
                  {selectedInterests.map((interest, idx) => (
                    <span key={idx} className="airbnb-interest-tag">
                      {interest.Interest || interest.interest || interest}
                      <button 
                        type="button"
                        onClick={() => toggleInterest(interest.Interest || interest.interest || interest, interest.Category || interest.category)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="airbnb-interest-placeholders">
                  <div className="interest-placeholder-circle"><i className="fas fa-plus"></i></div>
                  <div className="interest-placeholder-circle"><i className="fas fa-plus"></i></div>
                  <div className="interest-placeholder-circle"><i className="fas fa-plus"></i></div>
                  <div className="interest-placeholder-circle"><i className="fas fa-plus"></i></div>
                </div>
              )}
            </div>
            
            <button 
              className="airbnb-add-interests-btn"
              onClick={() => setShowInterestsModal(true)}
            >
              Add interests
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="airbnb-profile-footer">
        <button className="airbnb-done-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Done'}
        </button>
      </div>

      {/* Interests Modal */}
      {showInterestsModal && (
        <div className="airbnb-modal-overlay" onClick={() => setShowInterestsModal(false)}>
          <div className="airbnb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="airbnb-modal-header">
              <h2>Add interests</h2>
              <button className="airbnb-modal-close" onClick={() => setShowInterestsModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="airbnb-modal-content">
              {Object.entries(interestOptions).map(([category, interests]) => (
                <div key={category} className="airbnb-interest-category">
                  <h3>{category}</h3>
                  <div className="airbnb-interest-options">
                    {interests.map(opt => {
                      const isSelected = selectedInterests.some(
                        i => (i.Interest || i.interest || i) === opt.Interest
                      );
                      return (
                        <button
                          key={opt.InterestOptionID}
                          type="button"
                          className={`airbnb-interest-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleInterest(opt.Interest, category)}
                        >
                          {opt.Icon && <i className={`fas fa-${opt.Icon}`}></i>}
                          {opt.Interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="airbnb-modal-footer">
              <button className="airbnb-modal-done" onClick={() => setShowInterestsModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEditPanel;
