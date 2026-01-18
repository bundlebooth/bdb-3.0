import React, { useState, useEffect } from 'react';
import { showBanner } from '../../utils/helpers';
import { apiGet, apiPost, apiDelete } from '../../utils/api';
import { API_BASE_URL } from '../../config';
import UniversalModal from '../UniversalModal';
import { LoadingState, EmptyState } from '../common/AdminComponents';
import { ActionButtonGroup, ActionButton as IconActionButton, ViewButton, EditButton, DeleteButton } from '../common/UIComponents';

const ContentManagementPanel = () => {
  const [activeTab, setActiveTab] = useState('banners'); // banners, pages, announcements
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/admin/content/${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      showBanner('Failed to load content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await apiDelete(`/admin/content/${activeTab}/${itemId}`);
      if (response.ok) {
        showBanner('Item deleted', 'success');
        fetchContent();
      }
    } catch (error) {
      showBanner('Failed to delete item', 'error');
    }
  };

  const handleToggleActive = async (itemId, currentStatus) => {
    try {
      const response = await apiPost(`/admin/content/${activeTab}/${itemId}/toggle`, { active: !currentStatus });

      if (response.ok) {
        showBanner(`Item ${currentStatus ? 'deactivated' : 'activated'}`, 'success');
        fetchContent();
      }
    } catch (error) {
      showBanner('Failed to update status', 'error');
    }
  };

  return (
    <div className="admin-panel content-management">
      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'banners' ? 'active' : ''}`}
          onClick={() => setActiveTab('banners')}
        >
          <i className="fas fa-image"></i> Homepage Banners
        </button>
        <button
          className={`tab ${activeTab === 'pages' ? 'active' : ''}`}
          onClick={() => setActiveTab('pages')}
        >
          <i className="fas fa-file-alt"></i> Static Pages
        </button>
        <button
          className={`tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <i className="fas fa-bullhorn"></i> Announcements
        </button>
        <button
          className={`tab ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          <i className="fas fa-question-circle"></i> FAQ
        </button>
      </div>

      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <h3>
            {activeTab === 'banners' && 'Homepage Banners'}
            {activeTab === 'pages' && 'Static Pages'}
            {activeTab === 'announcements' && 'Announcements & Pop-ups'}
            {activeTab === 'faq' && 'FAQ Management'}
          </h3>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={() => { setSelectedItem(null); setModalType('add'); }}>
            <i className="fas fa-plus"></i> Add New
          </button>
          <button className="btn-secondary" onClick={fetchContent}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Content Display */}
      <div className="content-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading content...</p>
          </div>
        ) : content.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-file-alt"></i>
            <h3>No content found</h3>
            <p>Create your first {activeTab.slice(0, -1)} to get started</p>
          </div>
        ) : activeTab === 'banners' ? (
          <BannersGrid
            banners={content}
            onEdit={(item) => { setSelectedItem(item); setModalType('edit'); }}
            onDelete={handleDelete}
            onToggle={handleToggleActive}
          />
        ) : activeTab === 'pages' ? (
          <PagesTable
            pages={content}
            onEdit={(item) => { setSelectedItem(item); setModalType('edit'); }}
            onDelete={handleDelete}
          />
        ) : activeTab === 'announcements' ? (
          <AnnouncementsTable
            announcements={content}
            onEdit={(item) => { setSelectedItem(item); setModalType('edit'); }}
            onDelete={handleDelete}
            onToggle={handleToggleActive}
          />
        ) : (
          <FAQTable
            faqs={content}
            onEdit={(item) => { setSelectedItem(item); setModalType('edit'); }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modals */}
      {modalType === 'add' && (
        <ContentModal
          type={activeTab}
          item={null}
          onClose={() => setModalType(null)}
          onSave={() => { fetchContent(); setModalType(null); }}
        />
      )}

      {modalType === 'edit' && selectedItem && (
        <ContentModal
          type={activeTab}
          item={selectedItem}
          onClose={() => { setSelectedItem(null); setModalType(null); }}
          onSave={() => { fetchContent(); setSelectedItem(null); setModalType(null); }}
        />
      )}
    </div>
  );
};

// Banners Grid
const BannersGrid = ({ banners, onEdit, onDelete, onToggle }) => {
  return (
    <div className="banners-grid">
      {banners.map(banner => (
        <div key={banner.BannerID} className={`banner-card ${banner.IsActive ? 'active' : 'inactive'}`}>
          <div className="banner-preview">
            {banner.ImageURL ? (
              <img src={banner.ImageURL} alt={banner.Title} />
            ) : (
              <div className="banner-placeholder">
                <i className="fas fa-image"></i>
              </div>
            )}
            <div className="banner-overlay">
              <h4>{banner.Title}</h4>
              {banner.Subtitle && <p>{banner.Subtitle}</p>}
            </div>
          </div>
          <div className="banner-info">
            <div className="banner-meta">
              <span className={`status-badge ${banner.IsActive ? 'badge-success' : 'badge-secondary'}`}>
                {banner.IsActive ? 'Active' : 'Inactive'}
              </span>
              <span className="banner-position">Position: {banner.Position || 1}</span>
            </div>
            <ActionButtonGroup>
              <EditButton onClick={() => onEdit(banner)} />
              <IconActionButton action={banner.IsActive ? 'view' : 'activate'} onClick={() => onToggle(banner.BannerID, banner.IsActive)} title={banner.IsActive ? 'Hide' : 'Show'} />
              <DeleteButton onClick={() => onDelete(banner.BannerID)} />
            </ActionButtonGroup>
          </div>
        </div>
      ))}
    </div>
  );
};

// Pages Table
const PagesTable = ({ pages, onEdit, onDelete }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Page Title</th>
          <th>Slug</th>
          <th>Last Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {pages.map(page => (
          <tr key={page.PageID}>
            <td><strong>{page.Title}</strong></td>
            <td><code>/{page.Slug}</code></td>
            <td>{new Date(page.UpdatedAt).toLocaleDateString()}</td>
            <td>
              <ActionButtonGroup>
                <ViewButton onClick={() => window.open(`/${page.Slug}`, '_blank')} title="Open" />
                <EditButton onClick={() => onEdit(page)} />
                <DeleteButton onClick={() => onDelete(page.PageID)} />
              </ActionButtonGroup>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Announcements Table
const AnnouncementsTable = ({ announcements, onEdit, onDelete, onToggle }) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {announcements.map(ann => (
          <tr key={ann.AnnouncementID}>
            <td><strong>{ann.Title}</strong></td>
            <td>
              <span className={`type-badge ${ann.Type}`}>
                {ann.Type === 'popup' ? 'Pop-up' : ann.Type === 'banner' ? 'Banner' : 'Toast'}
              </span>
            </td>
            <td>{new Date(ann.StartDate).toLocaleDateString()}</td>
            <td>{ann.EndDate ? new Date(ann.EndDate).toLocaleDateString() : 'No end'}</td>
            <td>
              <span className={`status-badge ${ann.IsActive ? 'badge-success' : 'badge-secondary'}`}>
                {ann.IsActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>
              <ActionButtonGroup>
                <EditButton onClick={() => onEdit(ann)} />
                <IconActionButton action={ann.IsActive ? 'suspend' : 'activate'} onClick={() => onToggle(ann.AnnouncementID, ann.IsActive)} title={ann.IsActive ? 'Pause' : 'Play'} />
                <DeleteButton onClick={() => onDelete(ann.AnnouncementID)} />
              </ActionButtonGroup>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// FAQ Table
const FAQTable = ({ faqs, onEdit, onDelete }) => {
  return (
    <div className="faq-list">
      {faqs.map((faq, index) => (
        <div key={faq.FAQID} className="faq-item">
          <div className="faq-header">
            <span className="faq-order">{index + 1}</span>
            <div className="faq-content">
              <h4>{faq.Question}</h4>
              <p>{faq.Answer?.substring(0, 150)}...</p>
            </div>
            <ActionButtonGroup>
              <EditButton onClick={() => onEdit(faq)} />
              <DeleteButton onClick={() => onDelete(faq.FAQID)} />
            </ActionButtonGroup>
          </div>
        </div>
      ))}
    </div>
  );
};

// Content Modal
const ContentModal = ({ type, item, onClose, onSave }) => {
  const [formData, setFormData] = useState(item || getDefaultFormData(type));
  const [saving, setSaving] = useState(false);

  function getDefaultFormData(contentType) {
    switch (contentType) {
      case 'banners':
        return { Title: '', Subtitle: '', ImageURL: '', LinkURL: '', Position: 1, IsActive: true };
      case 'pages':
        return { Title: '', Slug: '', Content: '', MetaDescription: '' };
      case 'announcements':
        return { Title: '', Message: '', Type: 'banner', StartDate: '', EndDate: '', IsActive: true };
      case 'faq':
        return { Question: '', Answer: '', Category: 'General', Order: 1 };
      default:
        return {};
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = item
        ? `${API_BASE_URL}/admin/content/${type}/${item[Object.keys(item)[0]]}`
        : `${API_BASE_URL}/admin/content/${type}`;

      const response = await fetch(url, {
        method: item ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showBanner(`${type.slice(0, -1)} ${item ? 'updated' : 'created'} successfully`, 'success');
        onSave();
      }
    } catch (error) {
      showBanner(`Failed to ${item ? 'update' : 'create'} ${type.slice(0, -1)}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderFormFields = () => {
    switch (type) {
      case 'banners':
        return (
          <>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.Title}
                onChange={e => setFormData({ ...formData, Title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Subtitle</label>
              <input
                type="text"
                value={formData.Subtitle}
                onChange={e => setFormData({ ...formData, Subtitle: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input
                type="text"
                value={formData.ImageURL}
                onChange={e => setFormData({ ...formData, ImageURL: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Link URL</label>
              <input
                type="text"
                value={formData.LinkURL}
                onChange={e => setFormData({ ...formData, LinkURL: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Position</label>
                <input
                  type="number"
                  value={formData.Position}
                  onChange={e => setFormData({ ...formData, Position: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.IsActive}
                    onChange={e => setFormData({ ...formData, IsActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>
          </>
        );
      case 'pages':
        return (
          <>
            <div className="form-group">
              <label>Page Title</label>
              <input
                type="text"
                value={formData.Title}
                onChange={e => setFormData({ ...formData, Title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>URL Slug</label>
              <input
                type="text"
                value={formData.Slug}
                onChange={e => setFormData({ ...formData, Slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="e.g., terms-of-service"
              />
            </div>
            <div className="form-group">
              <label>Content (HTML)</label>
              <textarea
                value={formData.Content}
                onChange={e => setFormData({ ...formData, Content: e.target.value })}
                rows={10}
              />
            </div>
            <div className="form-group">
              <label>Meta Description</label>
              <textarea
                value={formData.MetaDescription}
                onChange={e => setFormData({ ...formData, MetaDescription: e.target.value })}
                rows={2}
              />
            </div>
          </>
        );
      case 'announcements':
        return (
          <>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.Title}
                onChange={e => setFormData({ ...formData, Title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea
                value={formData.Message}
                onChange={e => setFormData({ ...formData, Message: e.target.value })}
                rows={4}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={formData.Type}
                onChange={e => setFormData({ ...formData, Type: e.target.value })}
              >
                <option value="banner">Banner</option>
                <option value="popup">Pop-up</option>
                <option value="toast">Toast Notification</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={formData.StartDate?.split('T')[0] || ''}
                  onChange={e => setFormData({ ...formData, StartDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Date (optional)</label>
                <input
                  type="date"
                  value={formData.EndDate?.split('T')[0] || ''}
                  onChange={e => setFormData({ ...formData, EndDate: e.target.value })}
                />
              </div>
            </div>
          </>
        );
      case 'faq':
        return (
          <>
            <div className="form-group">
              <label>Question</label>
              <input
                type="text"
                value={formData.Question}
                onChange={e => setFormData({ ...formData, Question: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Answer</label>
              <textarea
                value={formData.Answer}
                onChange={e => setFormData({ ...formData, Answer: e.target.value })}
                rows={6}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.Category}
                  onChange={e => setFormData({ ...formData, Category: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Booking">Booking</option>
                  <option value="Payments">Payments</option>
                  <option value="Vendors">For Vendors</option>
                </select>
              </div>
              <div className="form-group">
                <label>Order</label>
                <input
                  type="number"
                  value={formData.Order}
                  onChange={e => setFormData({ ...formData, Order: parseInt(e.target.value) })}
                  min={1}
                />
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={`${item ? 'Edit' : 'Add'} ${type.slice(0, -1)}`}
      size="large"
      primaryAction={{
        label: saving ? 'Saving...' : (item ? 'Update' : 'Create'),
        onClick: handleSave,
        loading: saving
      }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      {renderFormFields()}
    </UniversalModal>
  );
};

export default ContentManagementPanel;
