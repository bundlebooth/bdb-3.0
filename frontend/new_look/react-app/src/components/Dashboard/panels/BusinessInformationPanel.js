import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function BusinessInformationPanel({ onBack, vendorProfileId }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    businessName: '',
    displayName: '',
    email: '',
    phone: '',
    website: '',
    yearsInBusiness: 0,
    description: '',
    tagline: '',
    category: '',
    additionalCategories: [],
    priceLevel: '$$'
  });

  useEffect(() => {
    loadCategories();
    if (vendorProfileId) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.filter(c => c.id !== 'all'));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/profile-details`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const profile = await response.json();
        const categoriesArray = profile.Categories ? profile.Categories.split(',').map(c => c.trim()) : [];
        
        setFormData({
          businessName: profile.BusinessName || '',
          displayName: profile.DisplayName || profile.BusinessName || '',
          email: profile.BusinessEmail || '',
          phone: profile.BusinessPhone || '',
          website: profile.Website || '',
          yearsInBusiness: profile.YearsInBusiness || 0,
          description: profile.BusinessDescription || '',
          tagline: profile.Tagline || '',
          category: categoriesArray[0] || '',
          additionalCategories: categoriesArray.slice(1),
          priceLevel: profile.PriceLevel || '$$'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const allCategories = [formData.category, ...formData.additionalCategories].filter(Boolean).join(',');
      
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/profile-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          BusinessName: formData.businessName,
          DisplayName: formData.displayName,
          BusinessEmail: formData.email,
          BusinessPhone: formData.phone,
          Website: formData.website,
          YearsInBusiness: formData.yearsInBusiness,
          BusinessDescription: formData.description,
          Tagline: formData.tagline,
          Categories: allCategories,
          PriceLevel: formData.priceLevel
        })
      });
      
      if (response.ok) {
        showBanner('Profile updated successfully!', 'success');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showBanner('Failed to save changes', 'error');
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      additionalCategories: prev.additionalCategories.includes(categoryId)
        ? prev.additionalCategories.filter(c => c !== categoryId)
        : [...prev.additionalCategories, categoryId]
    }));
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

  return (
    <div>
      <button className="btn btn-outline back-to-menu-btn" style={{ marginBottom: '1rem' }} onClick={onBack}>
        <i className="fas fa-arrow-left"></i> Back to Business Profile Menu
      </button>
      <div className="dashboard-card">
        <h2 className="dashboard-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}>
            <i className="fas fa-building"></i>
          </span>
          Business Information
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Update your business name, categories, and pricing to help clients find your services.
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />
        
        <form id="vendor-profile-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-name">Business Name <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  id="vendor-name"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-display-name">Display Name (for public listing)</label>
                <input
                  type="text"
                  id="vendor-display-name"
                  placeholder="Public listing name"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-email">Business Email <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="email"
                  id="vendor-email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-phone">Business Phone <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="tel"
                  id="vendor-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-website">Website URL</label>
                <input
                  type="url"
                  id="vendor-website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-years-in-business">Years in Business</label>
                <input
                  type="number"
                  id="vendor-years-in-business"
                  min="0"
                  value={formData.yearsInBusiness}
                  onChange={(e) => setFormData({ ...formData, yearsInBusiness: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="vendor-description">Business Description <span style={{ color: 'red' }}>*</span></label>
            <textarea
              id="vendor-description"
              rows="4"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-tagline">Tagline (short description)</label>
                <input
                  type="text"
                  id="vendor-tagline"
                  placeholder="Short description"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                />
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-category">Primary Category <span style={{ color: 'red' }}>*</span></label>
                <select
                  id="vendor-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label>Additional Categories</label>
                <div id="vendor-additional-categories" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: '#fafbfc', maxHeight: '180px', overflowY: 'auto' }}>
                  {categories.map(cat => (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.5rem', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <input
                        type="checkbox"
                        checked={formData.additionalCategories.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{cat.name}</span>
                    </label>
                  ))}
                </div>
                <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                  Select all categories that apply to your business
                </small>
              </div>
            </div>
            <div className="form-col">
              <div className="form-group">
                <label htmlFor="vendor-price-level">Price Range <span style={{ color: 'red' }}>*</span></label>
                <select
                  id="vendor-price-level"
                  value={formData.priceLevel}
                  onChange={(e) => setFormData({ ...formData, priceLevel: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'white' }}
                >
                  <option value="">Select price range</option>
                  <option value="$">$ - Inexpensive</option>
                  <option value="$$">$$ - Moderate</option>
                  <option value="$$$">$$$ - Expensive</option>
                  <option value="$$$$">$$$$ - Luxury</option>
                </select>
                <small style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  This helps clients find services that match their budget
                </small>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default BusinessInformationPanel;
