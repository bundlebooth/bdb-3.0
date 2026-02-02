import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';
import { encodeUserId } from '../../../utils/hashIds';
import { getProfileLocation } from '../../../utils/locationUtils';
import UniversalModal from '../../UniversalModal';
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
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLanguagesModal, setShowLanguagesModal] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  
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
    loadLanguages();
  }, []);

  // Initialize Google Places Autocomplete when location modal opens
  useEffect(() => {
    if (showLocationModal && inputRef.current && window.google?.maps?.places) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)']
      });
      
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.address_components) {
          let city = '', state = '', country = '';
          place.address_components.forEach(component => {
            if (component.types.includes('locality')) city = component.long_name;
            if (component.types.includes('administrative_area_level_1')) state = component.short_name;
            if (component.types.includes('country')) country = component.long_name;
          });
          setFormData(prev => ({ ...prev, city, state, country }));
          setLocationSearch(place.formatted_address || `${city}, ${state}, ${country}`);
        }
      });
    }
    
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [showLocationModal]);

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
        
        // Parse languages from comma-separated string
        if (profile.Languages) {
          setSelectedLanguages(profile.Languages.split(',').map(l => l.trim()).filter(Boolean));
        }
        
        // Set location search display using centralized utility
        const locationDisplay = getProfileLocation(profile);
        if (locationDisplay) {
          setLocationSearch(locationDisplay);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLanguages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/languages`);
      if (response.ok) {
        const data = await response.json();
        setAvailableLanguages(data.languages || []);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const loadInterestOptions = async () => {
    setInterestsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/interest-options`);
      if (response.ok) {
        const data = await response.json();
        setInterestOptions(data.grouped || {});
      }
    } catch (error) {
      console.error('Error loading interest options:', error);
    } finally {
      setInterestsLoading(false);
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

  const toggleLanguage = (langName) => {
    setSelectedLanguages(prev => {
      if (prev.includes(langName)) {
        return prev.filter(l => l !== langName);
      } else {
        return [...prev, langName];
      }
    });
  };

  const saveLanguages = () => {
    setFormData(prev => ({ ...prev, languages: selectedLanguages.join(', ') }));
    setShowLanguagesModal(false);
  };

  const saveLocation = () => {
    setShowLocationModal(false);
  };

  const viewProfile = () => {
    window.open(`/host/${encodeUserId(currentUser?.id)}`, '_blank');
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
    { id: 'city', icon: 'globe', label: 'Where I live', placeholder: 'Where I live', modal: 'location' },
    { id: 'languages', icon: 'language', label: 'Languages I speak', placeholder: 'Languages I speak', modal: 'languages' },
  ];

  const getFieldValue = (field) => {
    if (field.id === 'city') {
      return locationSearch || '';
    }
    if (field.id === 'languages') {
      return selectedLanguages.length > 0 ? selectedLanguages.join(', ') : '';
    }
    const actualField = field.field || field.id;
    return formData[actualField] || '';
  };

  const handleFieldClick = (field) => {
    if (field.modal === 'location') {
      setShowLocationModal(true);
    } else if (field.modal === 'languages') {
      setShowLanguagesModal(true);
    } else {
      setEditingField(field.id);
    }
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
                      onClick={() => handleFieldClick(field)}
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
        <button className="airbnb-view-profile-btn" onClick={viewProfile}>
          <i className="fas fa-external-link-alt"></i> View Profile
        </button>
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
              {interestsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
                </div>
              ) : Object.keys(interestOptions).length === 0 ? (
                <p className="no-options">No interests available</p>
              ) : (
                Object.entries(interestOptions).map(([category, interests]) => (
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
                ))
              )}
            </div>
            <div className="airbnb-modal-footer">
              <button className="airbnb-modal-done" onClick={() => setShowInterestsModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="airbnb-modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="airbnb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="airbnb-modal-header">
              <h2>Where do you live?</h2>
              <button className="airbnb-modal-close" onClick={() => setShowLocationModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="airbnb-modal-content">
              <div className="location-input-wrapper">
                <i className="fas fa-search"></i>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for a city..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="location-search-input"
                />
              </div>
              {formData.city && (
                <div className="location-preview">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{getProfileLocation(formData)}</span>
                </div>
              )}
            </div>
            <div className="airbnb-modal-footer">
              <button className="airbnb-modal-done" onClick={saveLocation}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Languages Modal */}
      {showLanguagesModal && (
        <div className="airbnb-modal-overlay" onClick={() => setShowLanguagesModal(false)}>
          <div className="airbnb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="airbnb-modal-header">
              <h2>Languages you speak</h2>
              <button className="airbnb-modal-close" onClick={() => setShowLanguagesModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="airbnb-modal-content">
              <div className="languages-grid">
                {availableLanguages.map(lang => {
                  const isSelected = selectedLanguages.includes(lang.Name);
                  return (
                    <button
                      key={lang.LanguageID}
                      type="button"
                      className={`language-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleLanguage(lang.Name)}
                    >
                      <span className="lang-name">{lang.Name}</span>
                      {lang.NativeName && lang.NativeName !== lang.Name && (
                        <span className="lang-native">{lang.NativeName}</span>
                      )}
                      {isSelected && <i className="fas fa-check"></i>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="airbnb-modal-footer">
              <button className="airbnb-modal-done" onClick={saveLanguages}>
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
