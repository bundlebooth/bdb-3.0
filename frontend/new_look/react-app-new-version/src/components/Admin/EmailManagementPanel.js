import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const EmailManagementPanel = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('templates'); // templates, logs
  const categories = ['booking', 'payment', 'vendor', 'user', 'review', 'system'];

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'logs') {
      fetchEmailLogs();
    }
  }, [activeTab, filter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Use the existing notifications/templates endpoint which uses admin.sp_GetEmailTemplates
      const response = await fetch(`${API_BASE_URL}/admin/notifications/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching email templates:', error);
      showBanner('Failed to load email templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/notifications/logs?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEmailLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this email template?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/emails/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showBanner('Email template deleted', 'success');
        fetchTemplates();
      }
    } catch (error) {
      showBanner('Failed to delete email template', 'error');
    }
  };

  const handleSendTest = async (templateId) => {
    const email = prompt('Enter email address to send test:');
    if (!email) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/emails/${templateId}/send-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipientEmail: email })
      });

      if (response.ok) {
        showBanner('Test email sent', 'success');
      }
    } catch (error) {
      showBanner('Failed to send test email', 'error');
    }
  };

  // Filter templates - use 'name' field from SP output
  const filteredTemplates = templates.filter(t => {
    const name = t.name || t.TemplateName || '';
    const subject = t.subject || t.Subject || '';
    const category = t.category || t.Category || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || category.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="admin-panel email-management">
      {/* Tabs */}
      <div className="panel-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'templates' ? '#5e72e4' : '#f3f4f6',
            color: activeTab === 'templates' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <i className="fas fa-file-alt" style={{ marginRight: '8px' }}></i>
          Email Templates
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'logs' ? '#5e72e4' : '#f3f4f6',
            color: activeTab === 'logs' ? 'white' : '#374151',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <i className="fas fa-history" style={{ marginRight: '8px' }}></i>
          Email Logs
        </button>
      </div>

      {activeTab === 'templates' && (
        <>
          {/* Toolbar */}
          <div className="panel-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="toolbar-left">
              <div className="filter-tabs" style={{ display: 'flex', gap: '4px' }}>
                <button
                  className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                  style={{
                    padding: '6px 12px',
                    background: filter === 'all' ? '#5e72e4' : 'white',
                    color: filter === 'all' ? 'white' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`filter-tab ${filter === cat ? 'active' : ''}`}
                    onClick={() => setFilter(cat)}
                    style={{
                      padding: '6px 12px',
                      background: filter === cat ? '#5e72e4' : 'white',
                      color: filter === cat ? 'white' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="toolbar-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="search-box" style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}></i>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '8px 12px 8px 36px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', width: '200px' }}
                />
              </div>
              <button className="btn-secondary" onClick={fetchTemplates} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="templates-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '20px'
          }}>
            {loading ? (
              <div className="loading-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <div className="spinner"></div>
                <p>Loading email templates...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-envelope" style={{ fontSize: '48px', color: '#5e72e4', marginBottom: '16px', display: 'block' }}></i>
                <h3>No email templates found</h3>
                <p style={{ color: '#6b7280' }}>Templates are configured in the database</p>
              </div>
            ) : (
              filteredTemplates.map(template => {
                const templateId = template.id || template.TemplateID;
                const templateName = template.name || template.TemplateName;
                const templateKey = template.templateKey || template.TemplateKey;
                const templateSubject = template.subject || template.Subject;
                const templateCategory = template.category || template.Category || 'General';
                const isActive = template.isActive !== false && template.IsActive !== false;
                
                return (
                  <div key={templateId} className="template-card" style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{templateName}</h3>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '2px 8px',
                          background: '#f0f4ff',
                          color: '#5e72e4',
                          borderRadius: '4px',
                          fontSize: '11px',
                          marginTop: '4px',
                          textTransform: 'capitalize'
                        }}>
                          {templateCategory}
                        </span>
                      </div>
                      <span style={{
                        padding: '4px 8px',
                        background: isActive ? '#d1fae5' : '#fee2e2',
                        color: isActive ? '#059669' : '#dc2626',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Subject:</div>
                      <div style={{ fontSize: '14px', color: '#111827' }}>{templateSubject}</div>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
                      Key: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{templateKey}</code>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { setSelectedTemplate(template); setModalType('edit'); }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#5e72e4',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {activeTab === 'logs' && (
        <div className="email-logs">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner"></div>
              <p>Loading email logs...</p>
            </div>
          ) : emailLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px', display: 'block' }}></i>
              <h3>No email logs found</h3>
              <p style={{ color: '#6b7280' }}>Email send history will appear here</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Recipient</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Subject</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Template</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log, idx) => (
                    <tr key={log.id || idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{log.recipientEmail}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{log.subject}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}><code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{log.templateKey}</code></td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: log.status === 'sent' ? '#d1fae5' : '#fee2e2',
                          color: log.status === 'sent' ? '#059669' : '#dc2626'
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                        {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Email Editor Modal */}
      {modalType && (
        <EmailEditorModal
          template={selectedTemplate}
          categories={categories}
          onClose={() => { setSelectedTemplate(null); setModalType(null); }}
          onSave={() => { fetchTemplates(); setSelectedTemplate(null); setModalType(null); }}
        />
      )}
    </div>
  );
};

// Email Editor Modal Component
const EmailEditorModal = ({ template, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    templateName: template?.TemplateName || '',
    templateKey: template?.TemplateKey || '',
    subject: template?.Subject || '',
    htmlContent: template?.HtmlContent || getDefaultTemplate(),
    textContent: template?.TextContent || '',
    category: template?.Category || 'General',
    variables: template?.Variables || '{{name}}, {{email}}, {{booking_id}}',
    isActive: template?.IsActive !== false
  });
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  function getDefaultTemplate() {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">PlanBeau</h1>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Hello {{name}},</h2>
    
    <p>Your email content goes here...</p>
    
    <p style="margin-top: 30px;">
      <a href="{{action_url}}" style="display: inline-block; padding: 12px 24px; background: #5e72e4; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Take Action
      </a>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      © 2024 PlanBeau. All rights reserved.
    </p>
  </div>
</body>
</html>`;
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'templateName' && !template) {
      const key = value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '');
      setFormData(prev => ({ ...prev, templateKey: key }));
    }
  };

  const handleSave = async () => {
    if (!formData.templateName.trim() || !formData.templateKey.trim() || !formData.subject.trim()) {
      showBanner('Template name, key, and subject are required', 'error');
      return;
    }

    try {
      setSaving(true);
      const url = template 
        ? `${API_BASE_URL}/admin/emails/${template.TemplateID}`
        : `${API_BASE_URL}/admin/emails`;
      
      const response = await fetch(url, {
        method: template ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showBanner(template ? 'Template updated' : 'Template created', 'success');
        onSave();
      } else {
        const error = await response.json();
        showBanner(error.message || 'Failed to save template', 'error');
      }
    } catch (error) {
      showBanner('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('email-html-content');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.htmlContent;
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      handleChange('htmlContent', newText);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
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
    }}>
      <div className="modal-content email-editor-modal" onClick={e => e.stopPropagation()} style={{
        background: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="modal-header" style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{template ? 'Edit Email Template' : 'Create Email Template'}</h2>
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
              <i className={`fas fa-${previewMode ? 'edit' : 'eye'}`}></i> {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {previewMode ? (
            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <strong>Subject:</strong> {formData.subject}
              </div>
              <div 
                style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Template Name *</label>
                  <input
                    type="text"
                    value={formData.templateName}
                    onChange={e => handleChange('templateName', e.target.value)}
                    placeholder="e.g., Welcome Email"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Template Key *</label>
                  <input
                    type="text"
                    value={formData.templateKey}
                    onChange={e => handleChange('templateKey', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="welcome_email"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={e => handleChange('category', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500' }}>Subject Line *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => handleChange('subject', e.target.value)}
                  placeholder="Your Booking is Confirmed!"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500' }}>HTML Content *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Insert variable:</span>
                    {['name', 'email', 'booking_id', 'vendor_name', 'event_date'].map(v => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        style={{
                          padding: '2px 8px',
                          background: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  id="email-html-content"
                  value={formData.htmlContent}
                  onChange={e => handleChange('htmlContent', e.target.value)}
                  placeholder="<html>...</html>"
                  rows={15}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px', 
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => handleChange('isActive', e.target.checked)}
                  />
                  <span style={{ fontSize: '14px' }}>Active</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: '#5e72e4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailManagementPanel;
