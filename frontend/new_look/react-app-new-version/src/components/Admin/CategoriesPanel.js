import React, { useState, useEffect } from 'react';
import { showBanner } from '../../utils/helpers';
import { apiGet, apiPost, apiDelete } from '../../utils/api';
import { API_BASE_URL } from '../../config';
import UniversalModal from '../UniversalModal';
import { LoadingState, EmptyState } from '../common/AdminComponents';
import { ActionButtonGroup, ActionButton as IconActionButton, EditButton, DeleteButton } from '../common/UIComponents';

const CategoriesPanel = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalType, setModalType] = useState(null); // 'add', 'edit', 'services', 'addons'
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(null); // Track which action is loading

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/admin/categories');
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
    setActionLoading(`visibility-${categoryId}`);
    try {
      const response = await apiPost(`/admin/categories/${categoryId}/visibility`, { visible: !currentVisibility });
      if (response.ok) {
        showBanner(`Category ${currentVisibility ? 'hidden' : 'now visible'}`, 'success');
        // Update local state immediately for better UX
        setCategories(prev => prev.map(cat => 
          cat.CategoryID === categoryId ? { ...cat, IsVisible: !currentVisibility } : cat
        ));
      } else {
        const error = await response.json();
        showBanner(error.error || 'Failed to update visibility', 'error');
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      showBanner('Failed to update visibility', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    const category = categories.find(c => c.CategoryID === categoryId);
    if (category?.VendorCount > 0) {
      showBanner(`Cannot delete "${categoryName}" - it has ${category.VendorCount} vendors assigned. Please reassign vendors first.`, 'error');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) return;

    setActionLoading(`delete-${categoryId}`);
    try {
      const response = await apiDelete(`/admin/categories/${categoryId}`);

      if (response.ok) {
        showBanner('Category deleted successfully', 'success');
        // Remove from local state immediately
        setCategories(prev => prev.filter(cat => cat.CategoryID !== categoryId));
      } else {
        const error = await response.json();
        showBanner(error.error || 'Failed to delete category', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showBanner('Failed to delete category', 'error');
    } finally {
      setActionLoading(null);
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

      {/* Categories Table */}
      <div className="data-table-container">
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
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Icon</th>
                <th>Category Name</th>
                <th>Vendors</th>
                <th>Subcategories</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.CategoryID}>
                  <td>
                    <div 
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: category.Color || '#5e72e4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      <i className={category.Icon || 'fas fa-tag'}></i>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#1f2937' }}>{category.CategoryName}</strong>
                    {category.Description && (
                      <small style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem' }}>
                        {category.Description.substring(0, 50)}{category.Description.length > 50 ? '...' : ''}
                      </small>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                      background: '#dbeafe', 
                      color: '#2563eb', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {category.VendorCount || 0}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                      background: '#f3f4f6', 
                      color: '#6b7280', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px',
                      fontSize: '0.85rem'
                    }}>
                      {category.SubcategoryCount || 0}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`visibility-toggle ${category.IsVisible ? 'visible' : 'hidden'}`}
                      onClick={() => handleToggleVisibility(category.CategoryID, category.IsVisible)}
                      title={category.IsVisible ? 'Click to hide' : 'Click to show'}
                      disabled={actionLoading === `visibility-${category.CategoryID}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', opacity: actionLoading === `visibility-${category.CategoryID}` ? 0.5 : 1 }}
                    >
                      <i className={`fas ${actionLoading === `visibility-${category.CategoryID}` ? 'fa-spinner fa-spin' : (category.IsVisible ? 'fa-eye' : 'fa-eye-slash')}`}></i>
                      <span style={{ marginLeft: '0.35rem' }}>{category.IsVisible ? 'Visible' : 'Hidden'}</span>
                    </button>
                  </td>
                  <td>
                    <ActionButtonGroup>
                      <EditButton onClick={() => { setSelectedCategory(category); setModalType('edit'); }} />
                      <IconActionButton action="services" onClick={() => { setSelectedCategory(category); setModalType('services'); }} title="Services" />
                      <DeleteButton onClick={() => handleDeleteCategory(category.CategoryID, category.CategoryName)} disabled={actionLoading === `delete-${category.CategoryID}`} />
                    </ActionButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    if (!formData.CategoryName.trim()) {
      showBanner('Category name is required', 'error');
      return;
    }
    
    try {
      setSaving(true);
      const url = category
        ? `${API_BASE_URL}/admin/categories/${category.CategoryID}`
        : `${API_BASE_URL}/admin/categories`;
      
      // Map frontend field names to backend expected names
      const payload = {
        name: formData.CategoryName,
        CategoryName: formData.CategoryName,
        description: formData.Description,
        Description: formData.Description,
        iconClass: formData.Icon,
        Icon: formData.Icon,
        Color: formData.Color,
        isActive: formData.IsVisible,
        IsActive: formData.IsVisible,
        IsVisible: formData.IsVisible
      };
      
      const response = await fetch(url, {
        method: category ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showBanner(`Category ${category ? 'updated' : 'created'} successfully`, 'success');
        onSave();
      } else {
        const error = await response.json();
        showBanner(error.error || `Failed to ${category ? 'update' : 'create'} category`, 'error');
      }
    } catch (error) {
      console.error('Error saving category:', error);
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
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Add Category'}
      size="medium"
      primaryAction={{
        label: saving ? 'Saving...' : (category ? 'Update' : 'Create'),
        onClick: handleSave,
        loading: saving,
        disabled: !formData.CategoryName.trim()
      }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      <div className="form-group">
        <label>Category Name</label>
        <input type="text" value={formData.CategoryName} onChange={e => setFormData({ ...formData, CategoryName: e.target.value })} placeholder="e.g., Catering, Photography" />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea value={formData.Description} onChange={e => setFormData({ ...formData, Description: e.target.value })} placeholder="Brief description of this category..." rows={3} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Icon</label>
          <div className="icon-picker" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {iconOptions.map(icon => (
              <button key={icon} type="button" className={`icon-option ${formData.Icon === icon ? 'selected' : ''}`} onClick={() => setFormData({ ...formData, Icon: icon })} style={{ width: '36px', height: '36px', border: formData.Icon === icon ? '2px solid #222' : '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                <i className={icon}></i>
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Color</label>
          <input type="color" value={formData.Color} onChange={e => setFormData({ ...formData, Color: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" checked={formData.IsVisible} onChange={e => setFormData({ ...formData, IsVisible: e.target.checked })} />
          Visible to users
        </label>
      </div>
    </UniversalModal>
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
      const response = await apiGet(`/admin/categories/${category.CategoryID}/services`);

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
      const response = await apiPost(`/admin/categories/${category.CategoryID}/services`, newService);

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
      const response = await apiDelete(`/admin/services/${serviceId}`);

      if (response.ok) {
        showBanner('Service deleted', 'success');
        fetchServices();
      }
    } catch (error) {
      showBanner('Failed to delete service', 'error');
    }
  };

  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={`Service Templates: ${category.CategoryName}`}
      size="large"
      footer={<button className="um-btn um-btn-secondary" onClick={onClose}>Close</button>}
    >
      <div className="add-service-form" style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 12px' }}>Add Service Template</h4>
        <div className="form-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Service Name" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} style={{ flex: 1, minWidth: '150px' }} />
          <input type="text" placeholder="Description" value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} style={{ flex: 2, minWidth: '200px' }} />
          <input type="number" placeholder="Default Price" value={newService.defaultPrice} onChange={e => setNewService({ ...newService, defaultPrice: e.target.value })} style={{ width: '120px' }} />
          <button className="um-btn um-btn-primary" onClick={handleAddService}><i className="fas fa-plus"></i> Add</button>
        </div>
      </div>

      <div className="services-list">
        <h4 style={{ margin: '0 0 12px' }}>Existing Service Templates</h4>
        {loading ? (
          <div className="loading-state"><div className="spinner"></div></div>
        ) : services.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No service templates defined</p>
        ) : (
          <table className="data-table compact" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Service Name</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Default Price</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.ServiceID} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px' }}>{service.ServiceName}</td>
                  <td style={{ padding: '8px' }}>{service.Description || '-'}</td>
                  <td style={{ padding: '8px' }}>${service.DefaultPrice || '0'}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <DeleteButton onClick={() => handleDeleteService(service.ServiceID)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </UniversalModal>
  );
};

export default CategoriesPanel;
