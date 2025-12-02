import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function VendorQuestionnairePanel({ onBack, vendorProfileId }) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState(new Set());
  const [vendorCategories, setVendorCategories] = useState([]);

  useEffect(() => {
    if (vendorProfileId) {
      loadQuestionnaire();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      
      // Load vendor profile to get categories
      const profileRes = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (profileRes.ok) {
        const result = await profileRes.json();
        console.log('Profile result:', result);
        
        // Handle nested structure from /vendors/:id endpoint
        const profile = result.data?.profile || result.profile || result;
        const categories = result.data?.categories || result.categories || [];
        
        // Get category names from categories array or fallback to Categories string
        let catArray = [];
        if (Array.isArray(categories) && categories.length > 0) {
          catArray = categories.map(cat => cat.Category || cat.CategoryName || cat);
        } else if (profile.Categories) {
          catArray = profile.Categories.split(',').map(c => c.trim()).filter(Boolean);
        }
        
        setVendorCategories(catArray);
        console.log('Vendor categories:', catArray);
      }
      
      // Fetch all features grouped by category
      const response = await fetch(`${API_BASE_URL}/vendor-features/all-grouped`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to load questionnaire');
      
      const data = await response.json();
      const allCategories = data.categories || [];
      setCategories(allCategories);
      console.log('Loaded feature categories:', allCategories.length);
      
      // Load vendor's existing selections
      if (vendorProfileId) {
        const selectionsResponse = await fetch(`${API_BASE_URL}/vendor-features/vendor/${vendorProfileId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (selectionsResponse.ok) {
          const selectionsData = await selectionsResponse.json();
          const selectedIds = new Set(
            selectionsData.selectedFeatures.map(f => f.FeatureID)
          );
          setSelectedFeatureIds(selectedIds);
          console.log('Loaded selected features:', selectedIds.size);
        }
      }
    } catch (error) {
      console.error('Error loading questionnaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatureSelection = (featureId) => {
    setSelectedFeatureIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    try {
      if (!vendorProfileId) {
        throw new Error('Vendor profile ID not found');
      }
      
      const response = await fetch(`${API_BASE_URL}/vendor-features/vendor/${vendorProfileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          featureIds: Array.from(selectedFeatureIds)
        })
      });
      
      if (response.ok) {
        showBanner('Features saved successfully!', 'success');
      } else {
        throw new Error('Failed to save features');
      }
    } catch (error) {
      console.error('Error saving features:', error);
      showBanner('Failed to save changes: ' + error.message, 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
        </button>
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const getFeatureIcon = (iconName) => {
    if (!iconName) return 'check';
    
    const iconMap = {
      'church': 'church',
      'chef-hat': 'hat-chef',
      'accessibility': 'wheelchair',
      'car-front': 'car',
      'speaker': 'volume-up',
      'wifi': 'wifi',
      'trees': 'tree',
      'eye': 'eye',
      'disc': 'circle',
      'presentation': 'chalkboard',
      'door-closed': 'door-closed',
      'bed': 'bed',
      'plane': 'plane',
      'users': 'users',
      'camera-off': 'camera',
      'zap': 'bolt',
      'heart': 'heart',
      'file': 'file',
      'images': 'images',
      'printer': 'print',
      'book-open': 'book-open',
      'video': 'video',
      'film': 'film',
      'radio': 'broadcast-tower',
      'mic': 'microphone',
      'volume-2': 'volume-up',
      'lightbulb': 'lightbulb',
      'glass-water': 'glass-martini',
      'list-music': 'list',
      'guitar': 'guitar',
      'mic-vocal': 'microphone-alt',
      'lamp': 'lamp',
      'cloud': 'cloud',
      'truck': 'truck',
      'badge-check': 'check-circle',
      'leaf': 'leaf',
      'wheat-off': 'ban',
      'utensils-crossed': 'utensils',
      'wine': 'wine-glass',
      'arrow-right-circle': 'arrow-circle-right',
      'beer': 'beer',
      'scroll-text': 'scroll',
      'cake': 'birthday-cake',
      'coffee': 'coffee',
      'flower': 'flower',
      'hexagon': 'hexagon',
      'rainbow': 'rainbow',
      'trending-up': 'arrow-up',
      'armchair': 'couch',
      'layers': 'layer-group',
      'lamp-desk': 'lamp',
      'wallpaper': 'image',
      'signpost': 'sign',
      'flame': 'fire',
      'circle': 'circle',
      'drama': 'theater-masks',
      'wand': 'magic',
      'flame-kindling': 'fire-alt',
      'person-standing': 'walking',
      'baby': 'baby',
      'gamepad-2': 'gamepad',
      'bus': 'bus',
      'bus-front': 'bus',
      'key-round': 'key',
      'move': 'arrows-alt',
      'palette': 'palette',
      'scissors': 'cut',
      'spray-can': 'spray-can',
      'calendar-check': 'calendar-check',
      'map-pin': 'map-marker-alt',
      'users-round': 'users',
      'hand': 'hand-paper',
      'clipboard-check': 'clipboard-check',
      'clipboard-list': 'clipboard-list',
      'calendar-days': 'calendar-alt',
      'handshake': 'handshake',
      'dollar-sign': 'dollar-sign',
      'clock': 'clock'
    };
    
    return iconMap[iconName] || iconName.replace('fa-', '').replace('fas ', '').replace('far ', '');
  };
  
  const getCategoryIcon = (icon) => {
    if (!icon) return 'list';
    return icon.replace('fa-', '').replace('fas ', '').replace('far ', '');
  };
  
  // Filter categories based on vendor's selected categories
  const getFilteredCategories = () => {
    if (!vendorCategories || vendorCategories.length === 0) {
      // Show categories marked as 'all' only
      return categories.filter(cat => 
        !cat.applicableVendorCategories || cat.applicableVendorCategories === 'all'
      );
    }
    
    return categories.filter(category => {
      if (!category.applicableVendorCategories) return true;
      if (category.applicableVendorCategories === 'all') return true;
      
      const applicableList = category.applicableVendorCategories.split(',').map(c => c.trim().toLowerCase());
      const hasMatch = vendorCategories.some(vendorCat => 
        applicableList.includes(vendorCat.toLowerCase())
      );
      
      return hasMatch;
    });
  };
  
  const filteredCategories = getFilteredCategories();

  return (
    <div>
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
      </button>
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-clipboard-check"></i>
          </span>
          Vendor Setup Questionnaire
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Select the features and services that apply to your business. This helps clients understand what you offer.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        <div id="vendor-questionnaire-container" style={{ marginBottom: '2rem' }}>
          {filteredCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
              <i className="fas fa-info-circle" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '1rem', display: 'block' }}></i>
              <p>No questionnaire features available {vendorCategories.length > 0 ? `for your selected categories (${vendorCategories.join(', ')})` : 'for your profile'}.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Please make sure you have set your primary category in Business Information.</p>
            </div>
          ) : (
            filteredCategories.map(category => {
              if (!category.features || category.features.length === 0) return null;
              
              return (
                <div key={category.categoryName} className="questionnaire-category" style={{ marginBottom: '2rem' }}>
                  <div className="questionnaire-category-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="questionnaire-category-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <i className={`fas fa-${getCategoryIcon(category.categoryIcon)}`}></i>
                    </div>
                    <h3 className="questionnaire-category-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{category.categoryName}</h3>
                  </div>
                  <div className="questionnaire-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem 1.5rem' }}>
                    {category.features.map(feature => {
                      const isSelected = selectedFeatureIds.has(feature.featureID);
                      return (
                        <div
                          key={feature.featureID}
                          className={`feature-tile ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleFeatureSelection(feature.featureID)}
                          style={{
                            padding: '0.5rem 0.625rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.625rem',
                            position: 'relative'
                          }}
                        >
                          <i className={`fas fa-${getFeatureIcon(feature.featureIcon)} feature-tile-icon`} style={{ color: 'var(--primary)', fontSize: '1rem', flexShrink: 0 }}></i>
                          <span className="feature-tile-name" style={{ fontSize: '0.9rem', color: '#4a5568', flex: 1 }}>{feature.featureName}</span>
                          {isSelected && (
                            <i className="fas fa-check feature-tile-checkmark" style={{ color: 'var(--primary)', fontSize: '0.9rem', marginLeft: 'auto' }}></i>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {filteredCategories.length > 0 && (
          <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '2px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
              <i className="fas fa-info-circle" style={{ color: 'var(--primary)' }}></i>
              {' '}
              <span>{selectedFeatureIds.size} features selected</span>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
            >
              <i className="fas fa-check"></i> Save Selections
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorQuestionnairePanel;
