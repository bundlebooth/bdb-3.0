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

// Simple Rich Text Toolbar Component
const RichTextToolbar = ({ onFormat, onInsert }) => {
  const toolbarStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    padding: '8px 12px',
    background: '#f8f9fa',
    borderRadius: '8px 8px 0 0',
    border: '1px solid #e0e0e0',
    borderBottom: 'none'
  };

  const buttonStyle = {
    padding: '6px 10px',
    background: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const separatorStyle = {
    width: '1px',
    height: '24px',
    background: '#d1d5db',
    margin: '0 4px'
  };

  return (
    <div style={toolbarStyle}>
      <button type="button" style={buttonStyle} onClick={() => onFormat('h2')} title="Heading 2">
        <i className="fas fa-heading"></i> H2
      </button>
      <button type="button" style={buttonStyle} onClick={() => onFormat('h3')} title="Heading 3">
        <i className="fas fa-heading"></i> H3
      </button>
      <div style={separatorStyle}></div>
      <button type="button" style={buttonStyle} onClick={() => onFormat('bold')} title="Bold">
        <i className="fas fa-bold"></i>
      </button>
      <button type="button" style={buttonStyle} onClick={() => onFormat('italic')} title="Italic">
        <i className="fas fa-italic"></i>
      </button>
      <button type="button" style={buttonStyle} onClick={() => onFormat('underline')} title="Underline">
        <i className="fas fa-underline"></i>
      </button>
      <div style={separatorStyle}></div>
      <button type="button" style={buttonStyle} onClick={() => onFormat('ul')} title="Bullet List">
        <i className="fas fa-list-ul"></i>
      </button>
      <button type="button" style={buttonStyle} onClick={() => onFormat('ol')} title="Numbered List">
        <i className="fas fa-list-ol"></i>
      </button>
      <div style={separatorStyle}></div>
      <button type="button" style={buttonStyle} onClick={() => onFormat('blockquote')} title="Quote">
        <i className="fas fa-quote-left"></i>
      </button>
      <button type="button" style={buttonStyle} onClick={() => onFormat('link')} title="Link">
        <i className="fas fa-link"></i>
      </button>
      <button type="button" style={buttonStyle} onClick={() => onFormat('image')} title="Image">
        <i className="fas fa-image"></i>
      </button>
      <div style={separatorStyle}></div>
      <button type="button" style={buttonStyle} onClick={() => onInsert('paragraph')} title="New Paragraph">
        <i className="fas fa-paragraph"></i> P
      </button>
      <button type="button" style={buttonStyle} onClick={() => onInsert('hr')} title="Horizontal Line">
        <i className="fas fa-minus"></i> HR
      </button>
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
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' or 'html'
  const contentRef = React.useRef(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'title' && !blog) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleFormat = (format) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end) || 'Your text here';
    let newText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'h2':
        newText = `<h2>${selectedText}</h2>`;
        cursorOffset = 4;
        break;
      case 'h3':
        newText = `<h3>${selectedText}</h3>`;
        cursorOffset = 4;
        break;
      case 'bold':
        newText = `<strong>${selectedText}</strong>`;
        cursorOffset = 8;
        break;
      case 'italic':
        newText = `<em>${selectedText}</em>`;
        cursorOffset = 4;
        break;
      case 'underline':
        newText = `<u>${selectedText}</u>`;
        cursorOffset = 3;
        break;
      case 'ul':
        newText = `<ul>\n  <li>${selectedText}</li>\n</ul>`;
        cursorOffset = 10;
        break;
      case 'ol':
        newText = `<ol>\n  <li>${selectedText}</li>\n</ol>`;
        cursorOffset = 10;
        break;
      case 'blockquote':
        newText = `<blockquote>${selectedText}</blockquote>`;
        cursorOffset = 12;
        break;
      case 'link':
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          newText = `<a href="${url}">${selectedText}</a>`;
          cursorOffset = 9 + url.length;
        } else {
          return;
        }
        break;
      case 'image':
        const imgUrl = prompt('Enter image URL:', 'https://');
        if (imgUrl) {
          newText = `<img src="${imgUrl}" alt="${selectedText}" style="max-width: 100%; border-radius: 8px;" />`;
          cursorOffset = 0;
        } else {
          return;
        }
        break;
      default:
        return;
    }

    const newContent = formData.content.substring(0, start) + newText + formData.content.substring(end);
    handleChange('content', newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + selectedText.length);
    }, 0);
  };

  const handleInsert = (type) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    let insertText = '';

    switch (type) {
      case 'paragraph':
        insertText = '\n<p>Your paragraph text here...</p>\n';
        break;
      case 'hr':
        insertText = '\n<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />\n';
        break;
      default:
        return;
    }

    const newContent = formData.content.substring(0, start) + insertText + formData.content.substring(start);
    handleChange('content', newContent);
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

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const contentStyle = {
    background: 'white',
    borderRadius: '12px',
    width: '95%',
    maxWidth: '1100px',
    maxHeight: '95vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{blog ? 'Edit Blog Post' : 'Create New Blog Post'}</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={() => setPreviewMode(!previewMode)}
              style={{
                padding: '8px 16px',
                background: previewMode ? '#5e72e4' : '#f3f4f6',
                color: previewMode ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              <i className={`fas fa-${previewMode ? 'edit' : 'eye'}`} style={{ marginRight: '6px' }}></i>
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {previewMode ? (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', background: '#f0f4ff', color: '#5e72e4', borderRadius: '20px', fontSize: '12px', marginBottom: '12px' }}>
                  {formData.category}
                </span>
                <h1 style={{ fontSize: '32px', margin: '0 0 12px 0', color: '#1f2937' }}>{formData.title || 'Untitled'}</h1>
                <p style={{ fontSize: '18px', color: '#6b7280', margin: '0 0 16px 0' }}>{formData.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#9ca3af', fontSize: '14px' }}>
                  <span><i className="fas fa-user" style={{ marginRight: '6px' }}></i>{formData.author}</span>
                </div>
              </div>
              {formData.featuredImageUrl && (
                <img src={formData.featuredImageUrl} alt="" style={{ width: '100%', borderRadius: '12px', marginBottom: '24px' }} />
              )}
              <div 
                style={{ fontSize: '16px', lineHeight: '1.8', color: '#374151' }}
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Basic Info Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => handleChange('title', e.target.value)}
                    placeholder="Enter blog title"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={e => handleChange('category', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  >
                    {categories.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => handleChange('status', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* URL Slug */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>URL Slug</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
                  <span style={{ padding: '10px 12px', background: '#f3f4f6', color: '#6b7280', fontSize: '14px' }}>/blog/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="url-slug"
                    style={{ flex: 1, padding: '10px 12px', border: 'none', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Excerpt <span style={{ fontWeight: '400', color: '#9ca3af' }}>(Short description shown in previews)</span>
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={e => handleChange('excerpt', e.target.value)}
                  placeholder="Brief summary of the blog post..."
                  rows={2}
                  maxLength={500}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                />
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{formData.excerpt.length}/500 characters</div>
              </div>

              {/* Featured Image */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Featured Image URL</label>
                <input
                  type="text"
                  value={formData.featuredImageUrl}
                  onChange={e => handleChange('featuredImageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
                {formData.featuredImageUrl && (
                  <div style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderRadius: '8px', display: 'inline-block' }}>
                    <img src={formData.featuredImageUrl} alt="Preview" style={{ maxHeight: '120px', borderRadius: '6px' }} />
                  </div>
                )}
              </div>

              {/* Content Editor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Content *</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('visual')}
                      style={{
                        padding: '4px 12px',
                        background: activeTab === 'visual' ? '#5e72e4' : '#f3f4f6',
                        color: activeTab === 'visual' ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Visual
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('html')}
                      style={{
                        padding: '4px 12px',
                        background: activeTab === 'html' ? '#5e72e4' : '#f3f4f6',
                        color: activeTab === 'html' ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      HTML
                    </button>
                  </div>
                </div>
                
                {activeTab === 'visual' && (
                  <RichTextToolbar onFormat={handleFormat} onInsert={handleInsert} />
                )}
                
                <textarea
                  ref={contentRef}
                  value={formData.content}
                  onChange={e => handleChange('content', e.target.value)}
                  placeholder={activeTab === 'visual' 
                    ? "Start typing your content... Use the toolbar above to format text."
                    : "<h2>Introduction</h2>\n<p>Your content here...</p>"}
                  rows={14}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: activeTab === 'visual' ? '0 0 6px 6px' : '6px',
                    fontSize: '14px',
                    fontFamily: activeTab === 'html' ? 'monospace' : 'inherit',
                    resize: 'vertical',
                    lineHeight: '1.6'
                  }}
                />
                {activeTab === 'visual' && (
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px', padding: '8px 12px', background: '#f9fafb', borderRadius: '6px' }}>
                    <strong>Quick Tips:</strong> Select text and click a toolbar button to format it. Use H2/H3 for headings, lists for bullet points, and the quote button for testimonials.
                  </div>
                )}
              </div>

              {/* Author Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={e => handleChange('author', e.target.value)}
                    placeholder="Author name"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => handleChange('tags', e.target.value)}
                    placeholder="wedding, planning, tips"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '12px 16px', background: '#f9fafb', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={e => handleChange('isFeatured', e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '14px' }}><i className="fas fa-star" style={{ color: '#f59e0b', marginRight: '6px' }}></i>Featured Post</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            onClick={onClose}
            style={{ padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
          >
            Cancel
          </button>
          <button 
            onClick={() => handleSave(false)} 
            disabled={saving}
            style={{ padding: '10px 20px', background: 'white', color: '#5e72e4', border: '1px solid #5e72e4', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button 
            onClick={() => handleSave(true)} 
            disabled={saving}
            style={{ padding: '10px 20px', background: '#5e72e4', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
          >
            {saving ? 'Publishing...' : (blog?.Status === 'published' ? 'Update' : 'Publish')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogManagementPanel;
