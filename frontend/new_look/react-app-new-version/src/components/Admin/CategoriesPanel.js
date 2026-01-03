import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const CategoriesPanel = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalType, setModalType] = useState(null); // 'add', 'edit', 'services', 'addons'
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showBanner('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (categoryId, currentVisibility) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}/visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ visible: !currentVisibility })
      });

      if (response.ok) {
        showBanner(`Category ${currentVisibility ? 'hidden' : 'visible'}`, 'success');
        fetchCategories();
      }
    } catch (error) {
      showBanner('Failed to update visibility', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showBanner('Category deleted', 'success');
        fetchCategories();
      }
    } catch (error) {
      showBanner('Failed to delete category', 'error');
    }
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="admin-panel categories-panel">
      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <h3>Categories & Services</h3>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={() => { setSelectedCategory(null); setModalType('add'); }}>
            <i className="fas fa-plus"></i> Add Category
          </button>
          <button className="btn-secondary" onClick={fetchCategories}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="categories-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-tags"></i>
            <h3>No categories found</h3>
            <p>Create your first category to get started</p>
          </div>
        ) : (
          <div className="categories-tree">
            {categories.map(category => (
              <div key={category.CategoryID} className="category-item">
                <div className="category-header">
                  <div className="category-info">
                    <button
                      className="expand-btn"
                      onClick={() => toggleExpand(category.CategoryID)}
                    >
                      <i className={`fas fa-chevron-${expandedCategories.has(category.CategoryID) ? 'down' : 'right'}`}></i>
                    </button>
                    <div className="category-icon" style={{ background: category.Color || '#5e72e4' }}>
                      <i className={category.Icon || 'fas fa-tag'}></i>
                    </div>
                    <div className="category-details">
                      <h4>{category.CategoryName}</h4>
                      <span className="category-meta">
                        {category.VendorCount || 0} vendors • {category.SubcategoryCount || 0} subcategories
                      </span>
                    </div>
                  </div>
                  <div className="category-actions">
                    <button
                      className={`visibility-toggle ${category.IsVisible ? 'visible' : 'hidden'}`}
                      onClick={() => handleToggleVisibility(category.CategoryID, category.IsVisible)}
                      title={category.IsVisible ? 'Hide' : 'Show'}
                    >
                      <i className={`fas fa-eye${category.IsVisible ? '' : '-slash'}`}></i>
                    </button>
                    <button
                      className="action-btn edit"
                      onClick={() => { setSelectedCategory(category); setModalType('edit'); }}
                      title="Edit"
                    >
                      <i className="fas fa-pen"></i>
                    </button>
                    <button
                      className="action-btn services"
                      onClick={() => { setSelectedCategory(category); setModalType('services'); }}
                      title="Manage Services"
                    >
                      <i className="fas fa-list"></i>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteCategory(category.CategoryID)}
                      title="Delete"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>

                {expandedCategories.has(category.CategoryID) && category.Subcategories?.length > 0 && (
                  <div className="subcategories-list">
                    {category.Subcategories.map(sub => (
                      <div key={sub.SubcategoryID} className="subcategory-item">
                        <div className="subcategory-info">
                          <span className="subcategory-name">{sub.SubcategoryName}</span>
                          <span className="subcategory-meta">{sub.VendorCount || 0} vendors</span>
                        </div>
                        <div className="subcategory-actions">
                          <button
                            className={`visibility-toggle small ${sub.IsVisible ? 'visible' : 'hidden'}`}
                            onClick={() => handleToggleVisibility(sub.SubcategoryID, sub.IsVisible)}
                          >
                            <i className={`fas fa-eye${sub.IsVisible ? '' : '-slash'}`}></i>
                          </button>
                          <button className="action-btn small edit">
                            <i className="fas fa-pen"></i>
                          </button>
                          <button className="action-btn small delete">
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing & Fees Section */}
      <div className="section-card">
        <h3><i className="fas fa-dollar-sign"></i> Marketplace Fees</h3>
        <div className="fees-grid">
          <div className="fee-item">
            <label>Platform Commission (%)</label>
            <input type="number" defaultValue="10" min="0" max="100" />
          </div>
          <div className="fee-item">
            <label>Payment Processing Fee (%)</label>
            <input type="number" defaultValue="2.9" min="0" max="10" step="0.1" />
          </div>
          <div className="fee-item">
            <label>Fixed Transaction Fee ($)</label>
            <input type="number" defaultValue="0.30" min="0" step="0.01" />
          </div>
          <div className="fee-item">
            <label>Minimum Booking Amount ($)</label>
            <input type="number" defaultValue="50" min="0" />
          </div>
        </div>
        <button className="btn-primary">
          <i className="fas fa-save"></i> Save Fee Settings
        </button>
      </div>

      {/* Modals */}
      {modalType === 'add' && (
        <CategoryModal
          category={null}
          onClose={() => setModalType(null)}
          onSave={() => { fetchCategories(); setModalType(null); }}
        />
      )}

      {modalType === 'edit' && selectedCategory && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => { setSelectedCategory(null); setModalType(null); }}
          onSave={() => { fetchCategories(); setSelectedCategory(null); setModalType(null); }}
        />
      )}

      {modalType === 'services' && selectedCategory && (
        <ServicesModal
          category={selectedCategory}
          onClose={() => { setSelectedCategory(null); setModalType(null); }}
        />
      )}
    </div>
  );
};

// Category Modal
const CategoryModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    CategoryName: category?.CategoryName || '',
    Description: category?.Description || '',
    Icon: category?.Icon || 'fas fa-tag',
    Color: category?.Color || '#5e72e4',
    IsVisible: category?.IsVisible !== false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = category
        ? `${API_BASE_URL}/admin/categories/${category.CategoryID}`
        : `${API_BASE_URL}/admin/categories`;
      
      const response = await fetch(url, {
        method: category ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showBanner(`Category ${category ? 'updated' : 'created'} successfully`, 'success');
        onSave();
      }
    } catch (error) {
      showBanner(`Failed to ${category ? 'update' : 'create'} category`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const iconOptions = [
    'fas fa-utensils', 'fas fa-camera', 'fas fa-music', 'fas fa-building',
    'fas fa-glass-cheers', 'fas fa-birthday-cake', 'fas fa-ring', 'fas fa-car',
    'fas fa-spa', 'fas fa-paint-brush', 'fas fa-video', 'fas fa-microphone'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{category ? 'Edit Category' : 'Add Category'}</h2>
          <button className="modal-close" onClick={onClose}>
            
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Category Name</label>
            <input
              type="text"
              value={formData.CategoryName}
              onChange={e => setFormData({ ...formData, CategoryName: e.target.value })}
              placeholder="e.g., Catering, Photography"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.Description}
              onChange={e => setFormData({ ...formData, Description: e.target.value })}
              placeholder="Brief description of this category..."
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Icon</label>
              <div className="icon-picker">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${formData.Icon === icon ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, Icon: icon })}
                  >
                    <i className={icon}></i>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Color</label>
              <input
                type="color"
                value={formData.Color}
                onChange={e => setFormData({ ...formData, Color: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.IsVisible}
                onChange={e => setFormData({ ...formData, IsVisible: e.target.checked })}
              />
              Visible to users
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !formData.CategoryName.trim()}>
            {saving ? 'Saving...' : (category ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Services Modal
const ServicesModal = ({ category, onClose }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: '', description: '', defaultPrice: '' });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${category.CategoryID}/services`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${category.CategoryID}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newService)
      });

      if (response.ok) {
        showBanner('Service template added', 'success');
        setNewService({ name: '', description: '', defaultPrice: '' });
        fetchServices();
      }
    } catch (error) {
      showBanner('Failed to add service', 'error');
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showBanner('Service deleted', 'success');
        fetchServices();
      }
    } catch (error) {
      showBanner('Failed to delete service', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Service Templates: {category.CategoryName}</h2>
          <button className="modal-close" onClick={onClose}>
            
          </button>
        </div>
        <div className="modal-body">
          <div className="add-service-form">
            <h4>Add Service Template</h4>
            <div className="form-row">
              <input
                type="text"
                placeholder="Service Name"
                value={newService.name}
                onChange={e => setNewService({ ...newService, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description"
                value={newService.description}
                onChange={e => setNewService({ ...newService, description: e.target.value })}
              />
              <input
                type="number"
                placeholder="Default Price"
                value={newService.defaultPrice}
                onChange={e => setNewService({ ...newService, defaultPrice: e.target.value })}
              />
              <button className="btn-primary" onClick={handleAddService}>
                <i className="fas fa-plus"></i> Add
              </button>
            </div>
          </div>

          <div className="services-list">
            <h4>Existing Service Templates</h4>
            {loading ? (
              <div className="loading-state small">
                <div className="spinner"></div>
              </div>
            ) : services.length === 0 ? (
              <p className="no-data">No service templates defined</p>
            ) : (
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Description</th>
                    <th>Default Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service.ServiceID}>
                      <td>{service.ServiceName}</td>
                      <td>{service.Description || '-'}</td>
                      <td>${service.DefaultPrice || '0'}</td>
                      <td>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteService(service.ServiceID)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPanel;
