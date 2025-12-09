import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const NotificationsPanel = () => {
  const [activeTab, setActiveTab] = useState('templates'); // templates, send, automation
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
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
      console.error('Error fetching templates:', error);
      showBanner('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel notifications-panel">
      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <i className="fas fa-file-alt"></i> Email Templates
        </button>
        <button
          className={`tab ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          <i className="fas fa-paper-plane"></i> Send Notification
        </button>
        <button
          className={`tab ${activeTab === 'automation' ? 'active' : ''}`}
          onClick={() => setActiveTab('automation')}
        >
          <i className="fas fa-robot"></i> Automation Rules
        </button>
      </div>

      {/* Content */}
      {activeTab === 'templates' && (
        <TemplatesSection
          templates={templates}
          loading={loading}
          onEdit={(template) => { setSelectedTemplate(template); setModalType('edit'); }}
          onRefresh={fetchTemplates}
        />
      )}

      {activeTab === 'send' && (
        <SendNotificationSection />
      )}

      {activeTab === 'automation' && (
        <AutomationSection />
      )}

      {/* Modals */}
      {modalType === 'edit' && selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          onClose={() => { setSelectedTemplate(null); setModalType(null); }}
          onSave={() => { fetchTemplates(); setSelectedTemplate(null); setModalType(null); }}
        />
      )}
    </div>
  );
};

// Templates Section
const TemplatesSection = ({ templates, loading, onEdit, onRefresh }) => {
  const templateCategories = [
    { key: 'booking', label: 'Booking', icon: 'fa-calendar-check' },
    { key: 'payment', label: 'Payment', icon: 'fa-credit-card' },
    { key: 'vendor', label: 'Vendor', icon: 'fa-store' },
    { key: 'user', label: 'User', icon: 'fa-user' },
    { key: 'review', label: 'Review', icon: 'fa-star' }
  ];

  const defaultTemplates = [
    { id: 1, name: 'Booking Confirmation', category: 'booking', type: 'email', subject: 'Your booking is confirmed!' },
    { id: 2, name: 'Booking Reminder', category: 'booking', type: 'email', subject: 'Reminder: Your booking is tomorrow' },
    { id: 3, name: 'Booking Cancelled', category: 'booking', type: 'email', subject: 'Your booking has been cancelled' },
    { id: 4, name: 'Payment Received', category: 'payment', type: 'email', subject: 'Payment received - Thank you!' },
    { id: 5, name: 'Payment Failed', category: 'payment', type: 'email', subject: 'Payment failed - Action required' },
    { id: 6, name: 'Vendor Approved', category: 'vendor', type: 'email', subject: 'Congratulations! Your profile is approved' },
    { id: 7, name: 'Vendor Rejected', category: 'vendor', type: 'email', subject: 'Profile review update' },
    { id: 8, name: 'Welcome Email', category: 'user', type: 'email', subject: 'Welcome to PlanHive!' },
    { id: 9, name: 'Password Reset', category: 'user', type: 'email', subject: 'Reset your password' },
    { id: 10, name: 'Review Request', category: 'review', type: 'email', subject: 'How was your experience?' }
  ];

  const displayTemplates = templates.length > 0 ? templates : defaultTemplates;

  return (
    <div className="templates-section">
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <h3>Email & SMS Templates</h3>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary" onClick={() => {}}>
            <i className="fas fa-plus"></i> Add Template
          </button>
          <button className="btn-secondary" onClick={onRefresh}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading templates...</p>
        </div>
      ) : (
        <div className="templates-grid">
          {templateCategories.map(category => (
            <div key={category.key} className="template-category">
              <h4>
                <i className={`fas ${category.icon}`}></i> {category.label} Templates
              </h4>
              <div className="template-list">
                {displayTemplates
                  .filter(t => t.category === category.key)
                  .map(template => (
                    <div key={template.id} className="template-item">
                      <div className="template-info">
                        <span className="template-name">{template.name}</span>
                        <span className="template-subject">{template.subject}</span>
                      </div>
                      <div className="template-actions">
                        <span className={`type-badge ${template.type}`}>
                          {template.type === 'email' ? 'Email' : 'SMS'}
                        </span>
                        <button className="action-btn edit" onClick={() => onEdit(template)}>
                          <i className="fas fa-edit"></i>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Send Notification Section
const SendNotificationSection = () => {
  const [notificationType, setNotificationType] = useState('email');
  const [recipientType, setRecipientType] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      showBanner('Please fill in all fields', 'error');
      return;
    }

    try {
      setSending(true);
      const response = await fetch(`${API_BASE_URL}/admin/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: notificationType,
          recipientType,
          subject,
          message
        })
      });

      if (response.ok) {
        showBanner('Notification sent successfully', 'success');
        setSubject('');
        setMessage('');
      }
    } catch (error) {
      showBanner('Failed to send notification', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="send-notification-section">
      <div className="section-card">
        <h3><i className="fas fa-paper-plane"></i> Send Manual Notification</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Notification Type</label>
            <div className="radio-group horizontal">
              <label>
                <input
                  type="radio"
                  value="email"
                  checked={notificationType === 'email'}
                  onChange={() => setNotificationType('email')}
                />
                <i className="fas fa-envelope"></i> Email
              </label>
              <label>
                <input
                  type="radio"
                  value="sms"
                  checked={notificationType === 'sms'}
                  onChange={() => setNotificationType('sms')}
                />
                <i className="fas fa-sms"></i> SMS
              </label>
              <label>
                <input
                  type="radio"
                  value="push"
                  checked={notificationType === 'push'}
                  onChange={() => setNotificationType('push')}
                />
                <i className="fas fa-bell"></i> Push
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Recipients</label>
            <select value={recipientType} onChange={e => setRecipientType(e.target.value)}>
              <option value="all">All Users</option>
              <option value="vendors">All Vendors</option>
              <option value="clients">All Clients</option>
              <option value="specific">Specific User(s)</option>
            </select>
          </div>
        </div>

        {recipientType === 'specific' && (
          <div className="form-group">
            <label>User Email(s) - comma separated</label>
            <input type="text" placeholder="user1@example.com, user2@example.com" />
          </div>
        )}

        <div className="form-group">
          <label>Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Notification subject..."
          />
        </div>

        <div className="form-group">
          <label>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows={6}
          />
        </div>

        <div className="form-actions">
          <button className="btn-secondary">
            <i className="fas fa-eye"></i> Preview
          </button>
          <button className="btn-primary" onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Automation Section
const AutomationSection = () => {
  const automationRules = [
    {
      id: 1,
      name: 'Booking Reminder',
      trigger: '24 hours before booking',
      action: 'Send reminder email to client',
      enabled: true
    },
    {
      id: 2,
      name: 'Review Request',
      trigger: '2 days after booking completion',
      action: 'Send review request email',
      enabled: true
    },
    {
      id: 3,
      name: 'Payment Failure Follow-up',
      trigger: 'When payment fails',
      action: 'Send payment retry email',
      enabled: true
    },
    {
      id: 4,
      name: 'Vendor Inactivity Alert',
      trigger: 'Vendor inactive for 30 days',
      action: 'Send re-engagement email',
      enabled: false
    },
    {
      id: 5,
      name: 'New Booking Alert',
      trigger: 'When new booking is made',
      action: 'Send notification to vendor',
      enabled: true
    }
  ];

  const handleToggle = (ruleId) => {
    // Toggle automation rule
    showBanner('Automation rule updated', 'success');
  };

  return (
    <div className="automation-section">
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <h3>Automation Rules</h3>
        </div>
        <div className="toolbar-right">
          <button className="btn-primary">
            <i className="fas fa-plus"></i> Add Rule
          </button>
        </div>
      </div>

      <div className="automation-list">
        {automationRules.map(rule => (
          <div key={rule.id} className={`automation-item ${rule.enabled ? 'enabled' : 'disabled'}`}>
            <div className="automation-icon">
              <i className="fas fa-robot"></i>
            </div>
            <div className="automation-info">
              <h4>{rule.name}</h4>
              <div className="automation-details">
                <span className="trigger">
                  <i className="fas fa-clock"></i> {rule.trigger}
                </span>
                <span className="action">
                  <i className="fas fa-arrow-right"></i> {rule.action}
                </span>
              </div>
            </div>
            <div className="automation-controls">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggle(rule.id)}
                />
                <span className="toggle-slider"></span>
              </label>
              <button className="action-btn edit">
                <i className="fas fa-edit"></i>
              </button>
              <button className="action-btn delete">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Template Modal
const TemplateModal = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    body: template?.body || '',
    type: template?.type || 'email'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/admin/notifications/templates/${template?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showBanner('Template updated', 'success');
        onSave();
      }
    } catch (error) {
      showBanner('Failed to update template', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Template: {template?.name}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Template Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Subject Line</label>
            <input
              type="text"
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email Body (HTML)</label>
            <textarea
              value={formData.body}
              onChange={e => setFormData({ ...formData, body: e.target.value })}
              rows={12}
              placeholder="Enter HTML content..."
            />
          </div>
          <div className="variables-help">
            <h4>Available Variables:</h4>
            <div className="variables-list">
              <code>{'{{user_name}}'}</code>
              <code>{'{{vendor_name}}'}</code>
              <code>{'{{booking_date}}'}</code>
              <code>{'{{booking_time}}'}</code>
              <code>{'{{amount}}'}</code>
              <code>{'{{service_name}}'}</code>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
