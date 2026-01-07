import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const BlogManagementPanel = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, [filter, pagination.page]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/admin/blogs?page=${pagination.page}&limit=${pagination.limit}`;
      if (filter !== 'all') url += `&status=${filter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      showBanner('Failed to load blogs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/blog-categories`, {
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
    }
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showBanner('Blog post deleted', 'success');
        fetchBlogs();
      }
    } catch (error) {
      showBanner('Failed to delete blog post', 'error');
    }
  };

  const handlePublish = async (blogId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/blogs/${blogId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showBanner('Blog post published', 'success');
        fetchBlogs();
      }
    } catch (error) {
      showBanner('Failed to publish blog post', 'error');
    }
  };

  const handleUnpublish = async (blogId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/blogs/${blogId}/unpublish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showBanner('Blog post unpublished', 'success');
        fetchBlogs();
      }
    } catch (error) {
      showBanner('Failed to unpublish blog post', 'error');
    }
  };

  const handleToggleFeatured = async (blogId, currentFeatured) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/blogs/${blogId}/feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ featured: !currentFeatured })
      });

      if (response.ok) {
        showBanner(currentFeatured ? 'Blog unfeatured' : 'Blog featured', 'success');
        fetchBlogs();
      }
    } catch (error) {
      showBanner('Failed to update featured status', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'published': { class: 'badge-success', icon: 'fa-check-circle' },
      'draft': { class: 'badge-warning', icon: 'fa-edit' },
      'archived': { class: 'badge-secondary', icon: 'fa-archive' }
    };
    const config = statusMap[status] || { class: 'badge-secondary', icon: 'fa-question' };
    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fas ${config.icon}`}></i> {status}
      </span>
    );
  };

  return (
    <div className="admin-panel blog-management">
      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {['all', 'published', 'draft', 'archived'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => { setFilter(status); setPagination(p => ({ ...p, page: 1 })); }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchBlogs()}
            />
          </div>
          <button className="btn-primary" onClick={() => { setSelectedBlog(null); setModalType('add'); }}>
            <i className="fas fa-plus"></i> New Blog Post
          </button>
        </div>
      </div>

      {/* Blog Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading blog posts...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-newspaper"></i>
            <h3>No blog posts found</h3>
            <p>Create your first blog post to get started</p>
            <button className="btn-primary" onClick={() => { setSelectedBlog(null); setModalType('add'); }}>
              <i className="fas fa-plus"></i> Create Blog Post
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Views</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map(blog => (
                <tr key={blog.BlogID}>
                  <td>
                    <div className="blog-title-cell">
                      {blog.FeaturedImageURL && (
                        <img 
                          src={blog.FeaturedImageURL} 
                          alt="" 
                          className="blog-thumbnail"
                        />
                      )}
                      <div>
                        <strong>{blog.Title}</strong>
                        <small className="blog-slug">/{blog.Slug}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{blog.Category}</span>
                  </td>
                  <td>{blog.Author}</td>
                  <td>{getStatusBadge(blog.Status)}</td>
                  <td>
                    <button
                      className={`feature-btn ${blog.IsFeatured ? 'featured' : ''}`}
                      onClick={() => handleToggleFeatured(blog.BlogID, blog.IsFeatured)}
                      title={blog.IsFeatured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <i className={`fas fa-star`}></i>
                    </button>
                  </td>
                  <td>{blog.ViewCount || 0}</td>
                  <td>{formatDate(blog.PublishedAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={() => window.open(`/blog/${blog.Slug}`, '_blank')}
                        title="Preview"
                      >
                        <i className="fas fa-external-link-alt"></i>
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={() => { setSelectedBlog(blog); setModalType('edit'); }}
                        title="Edit"
                      >
                        <i className="fas fa-pen"></i>
                      </button>
                      {blog.Status === 'draft' ? (
                        <button
                          className="action-btn publish"
                          onClick={() => handlePublish(blog.BlogID)}
                          title="Publish"
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      ) : blog.Status === 'published' ? (
                        <button
                          className="action-btn unpublish"
                          onClick={() => handleUnpublish(blog.BlogID)}
                          title="Unpublish"
                        >
                          <i className="fas fa-eye-slash"></i>
                        </button>
                      ) : null}
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(blog.BlogID)}
                        title="Delete"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Blog Editor Modal */}
      {modalType && (
        <BlogEditorModal
          blog={selectedBlog}
          categories={categories}
          onClose={() => { setSelectedBlog(null); setModalType(null); }}
          onSave={() => { fetchBlogs(); setSelectedBlog(null); setModalType(null); }}
        />
      )}
    </div>
  );
};

// Blog Editor Modal Component
const BlogEditorModal = ({ blog, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: blog?.Title || '',
    slug: blog?.Slug || '',
    excerpt: blog?.Excerpt || '',
    content: blog?.Content || '',
    featuredImageUrl: blog?.FeaturedImageURL || '',
    category: blog?.Category || 'General',
    tags: blog?.Tags || '',
    author: blog?.Author || 'PlanBeau Team',
    authorImageUrl: blog?.AuthorImageURL || '',
    status: blog?.Status || 'draft',
    isFeatured: blog?.IsFeatured || false
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from title
    if (field === 'title' && !blog) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSave = async (publishNow = false) => {
    if (!formData.title.trim()) {
      showBanner('Title is required', 'error');
      return;
    }
    if (!formData.content.trim()) {
      showBanner('Content is required', 'error');
      return;
    }

    try {
      setSaving(true);
      const url = blog 
        ? `${API_BASE_URL}/admin/blogs/${blog.BlogID}`
        : `${API_BASE_URL}/admin/blogs`;
      
      const payload = {
        ...formData,
        status: publishNow ? 'published' : formData.status
      };

      const response = await fetch(url, {
        method: blog ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showBanner(blog ? 'Blog updated' : 'Blog created', 'success');
        onSave();
      } else {
        const error = await response.json();
        showBanner(error.error || 'Failed to save blog', 'error');
      }
    } catch (error) {
      showBanner('Failed to save blog', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content blog-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{blog ? 'Edit Blog Post' : 'Create New Blog Post'}</h2>
          <div className="header-actions">
            <button 
              className={`preview-toggle ${previewMode ? 'active' : ''}`}
              onClick={() => setPreviewMode(!previewMode)}
            >
              <i className={`fas fa-${previewMode ? 'edit' : 'eye'}`}></i>
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button className="modal-close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="modal-body">
          {previewMode ? (
            <div className="blog-preview">
              <div className="preview-header">
                <span className="preview-category">{formData.category}</span>
                <h1>{formData.title || 'Untitled'}</h1>
                <p className="preview-excerpt">{formData.excerpt}</p>
                <div className="preview-meta">
                  <span>{formData.author}</span>
                </div>
              </div>
              {formData.featuredImageUrl && (
                <img src={formData.featuredImageUrl} alt="" className="preview-image" />
              )}
              <div 
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            </div>
          ) : (
            <div className="blog-form">
              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => handleChange('title', e.target.value)}
                    placeholder="Enter blog title"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={e => handleChange('category', e.target.value)}
                  >
                    {categories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-2">
                  <label>URL Slug</label>
                  <div className="slug-input">
                    <span>/blog/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={e => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="url-slug"
                    />
                  </div>
                </div>
                <div className="form-group flex-1">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Excerpt (Short Description)</label>
                <textarea
                  value={formData.excerpt}
                  onChange={e => handleChange('excerpt', e.target.value)}
                  placeholder="Brief summary of the blog post..."
                  rows={2}
                  maxLength={500}
                />
                <small>{formData.excerpt.length}/500 characters</small>
              </div>

              <div className="form-group">
                <label>Featured Image URL</label>
                <input
                  type="text"
                  value={formData.featuredImageUrl}
                  onChange={e => handleChange('featuredImageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {formData.featuredImageUrl && (
                  <div className="image-preview">
                    <img src={formData.featuredImageUrl} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Content (HTML) *</label>
                <textarea
                  value={formData.content}
                  onChange={e => handleChange('content', e.target.value)}
                  placeholder="<h2>Introduction</h2><p>Your content here...</p>"
                  rows={12}
                  className="content-editor"
                />
                <small>Use HTML tags for formatting: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;blockquote&gt;, etc.</small>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={e => handleChange('author', e.target.value)}
                    placeholder="Author name"
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Author Image URL</label>
                  <input
                    type="text"
                    value={formData.authorImageUrl}
                    onChange={e => handleChange('authorImageUrl', e.target.value)}
                    placeholder="https://example.com/author.jpg"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-2">
                  <label>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => handleChange('tags', e.target.value)}
                    placeholder="wedding, planning, tips"
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={e => handleChange('isFeatured', e.target.checked)}
                    />
                    Featured Post
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn-secondary" 
            onClick={() => handleSave(false)} 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => handleSave(true)} 
            disabled={saving}
          >
            {saving ? 'Publishing...' : (blog?.Status === 'published' ? 'Update' : 'Publish')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogManagementPanel;
