import React, { useState, useEffect } from 'react';
import { showBanner } from '../../utils/helpers';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';
import { API_BASE_URL } from '../../config';
import UniversalModal from '../UniversalModal';
import { LoadingState, EmptyState } from '../common/AdminComponents';

const EmailManagementPanel = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('templates');
  const [headerFooter, setHeaderFooter] = useState({ header: '', footer: '' });
  const [testEmail, setTestEmail] = useState({ to: '', template: '', subject: '', body: '' });
  const [sendingTest, setSendingTest] = useState(false);
  const [queueItems, setQueueItems] = useState([]);
  const [queueStats, setQueueStats] = useState([]);
  const [queueFilter, setQueueFilter] = useState('all');
  const [processingQueue, setProcessingQueue] = useState(false);
  const categories = ['booking', 'payment', 'vendor', 'user', 'review', 'system'];

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'logs') {
      fetchEmailLogs();
    } else if (activeTab === 'settings') {
      fetchHeaderFooter();
    } else if (activeTab === 'queue') {
      fetchQueueItems();
      fetchQueueStats();
    }
  }, [activeTab, filter, queueFilter]);

  const fetchHeaderFooter = async () => {
    try {
      const response = await apiGet('/admin/emails/header-footer');
      if (response.ok) {
        const data = await response.json();
        setHeaderFooter({
          header: data.header || getDefaultHeader(),
          footer: data.footer || getDefaultFooter()
        });
      }
    } catch (error) {
      console.error('Error fetching header/footer:', error);
      setHeaderFooter({
        header: getDefaultHeader(),
        footer: getDefaultFooter()
      });
    }
  };

  const getDefaultHeader = () => {
    return `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
  <img src="{{logo_url}}" alt="Planbeau" style="height: 40px; margin-bottom: 10px;" />
  <h1 style="color: white; margin: 0; font-size: 24px;">Planbeau</h1>
</div>`;
  };

  const getDefaultFooter = () => {
    return `<div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
  <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">© 2024 Planbeau. All rights reserved.</p>
  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
    <a href="{{unsubscribe_url}}" style="color: #5e72e4;">Unsubscribe</a> | 
    <a href="{{privacy_url}}" style="color: #5e72e4;">Privacy Policy</a>
  </p>
</div>`;
  };

  const saveHeaderFooter = async () => {
    try {
      const response = await apiPost('/admin/emails/header-footer', headerFooter);
      if (response.ok) {
        showBanner('Header and footer saved successfully', 'success');
      } else {
        showBanner('Failed to save header/footer', 'error');
      }
    } catch (error) {
      showBanner('Failed to save header/footer', 'error');
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail.to || !testEmail.subject) {
      showBanner('Please enter recipient email and subject', 'error');
      return;
    }
    
    setSendingTest(true);
    try {
      const response = await apiPost('/admin/emails/send-test', {
        to: testEmail.to,
        subject: testEmail.subject,
        body: testEmail.body || '<p>This is a test email from Planbeau admin panel.</p>',
        templateKey: testEmail.template
      });
      
      if (response.ok) {
        showBanner(`Test email sent to ${testEmail.to}`, 'success');
        setTestEmail({ to: '', template: '', subject: '', body: '' });
      } else {
        const error = await response.json();
        showBanner(error.message || 'Failed to send test email', 'error');
      }
    } catch (error) {
      showBanner('Failed to send test email', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Use the existing notifications/templates endpoint which uses admin.sp_GetEmailTemplates
      const response = await apiGet('/admin/notifications/templates');

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
      const response = await apiGet('/admin/notifications/logs?page=1&limit=50');
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

  const fetchQueueItems = async () => {
    try {
      setLoading(true);
      const statusParam = queueFilter !== 'all' ? `?status=${queueFilter}` : '';
      const response = await apiGet(`/admin/email-queue${statusParam}`);
      if (response.ok) {
        const data = await response.json();
        setQueueItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching queue items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStats = async () => {
    try {
      const response = await apiGet('/admin/email-queue/stats');
      if (response.ok) {
        const data = await response.json();
        setQueueStats(data.stats || []);
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    }
  };

  const handleCancelQueuedEmail = async (queueId) => {
    const reason = prompt('Enter cancellation reason (optional):');
    try {
      const response = await apiPost(`/admin/email-queue/${queueId}/cancel`, { reason });
      if (response.ok) {
        showBanner('Email cancelled successfully', 'success');
        fetchQueueItems();
        fetchQueueStats();
      } else {
        showBanner('Failed to cancel email', 'error');
      }
    } catch (error) {
      showBanner('Failed to cancel email', 'error');
    }
  };

  const handleProcessQueue = async () => {
    setProcessingQueue(true);
    try {
      const response = await apiPost('/admin/email-queue/process');
      if (response.ok) {
        const data = await response.json();
        showBanner(data.message || 'Queue processed', 'success');
        fetchQueueItems();
        fetchQueueStats();
      } else {
        showBanner('Failed to process queue', 'error');
      }
    } catch (error) {
      showBanner('Failed to process queue', 'error');
    } finally {
      setProcessingQueue(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this email template?')) return;

    try {
      const response = await apiDelete(`/admin/emails/${templateId}`);

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
      const response = await apiPost(`/admin/emails/${templateId}/send-test`, { recipientEmail: email });

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
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-file-alt" style={{ color: '#2563eb', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{templates.length}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Templates</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{templates.filter(t => t.IsActive !== false).length}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Active</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-paper-plane" style={{ color: '#f59e0b', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{emailLogs.length}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Emails Sent</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-percentage" style={{ color: '#7c3aed', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                {emailLogs.length > 0 ? Math.round((emailLogs.filter(l => l.status === 'sent').length / emailLogs.length) * 100) : 100}%
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Delivery Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
        {[
          { key: 'templates', label: 'Email Templates', icon: 'fa-file-alt' },
          { key: 'queue', label: 'Email Queue', icon: 'fa-clock' },
          { key: 'logs', label: 'Email Logs', icon: 'fa-history' },
          { key: 'settings', label: 'Header & Footer', icon: 'fa-cog' },
          { key: 'test', label: 'Send Test Email', icon: 'fa-paper-plane' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab.key ? '#5e72e4' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
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
                        <i className="fas fa-pen"></i> Edit
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
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log, idx) => {
                    // Handle various date field names from backend
                    const sentDate = log.sentAt || log.SentAt || log.createdAt || log.CreatedAt || log.sent_at;
                    const recipient = log.recipientEmail || log.RecipientEmail || log.recipient || log.Recipient || log.email || log.Email;
                    const subj = log.subject || log.Subject;
                    const tplKey = log.templateKey || log.TemplateKey || log.template_key;
                    const logStatus = log.status || log.Status || 'unknown';
                    const bodyHtml = log.htmlBody || log.HtmlBody || log.body || log.Body || log.htmlContent || log.HtmlContent;
                    
                    // Format date properly
                    let formattedDate = '-';
                    if (sentDate) {
                      const dateObj = new Date(sentDate);
                      if (!isNaN(dateObj.getTime())) {
                        formattedDate = dateObj.toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      }
                    }
                    
                    return (
                      <tr key={log.id || log.LogID || idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>{recipient}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>{subj}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}><code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{tplKey}</code></td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: logStatus === 'sent' ? '#d1fae5' : '#fee2e2',
                            color: logStatus === 'sent' ? '#059669' : '#dc2626'
                          }}>
                            {logStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                          {formattedDate}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => {
                              setSelectedTemplate({ 
                                subject: subj, 
                                body: bodyHtml,
                                recipient: recipient,
                                sentAt: formattedDate
                              });
                              setModalType('preview');
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#dbeafe',
                              color: '#2563eb',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            <i className="fas fa-eye"></i> Preview
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Email Queue Tab */}
      {activeTab === 'queue' && (
        <div className="email-queue">
          {/* Queue Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {['pending', 'processing', 'sent', 'failed', 'cancelled'].map(status => {
              const stat = queueStats.find(s => s.Status === status);
              const count = stat?.Count || 0;
              const colors = {
                pending: { bg: '#fef3c7', color: '#d97706' },
                processing: { bg: '#dbeafe', color: '#2563eb' },
                sent: { bg: '#d1fae5', color: '#059669' },
                failed: { bg: '#fee2e2', color: '#dc2626' },
                cancelled: { bg: '#f3f4f6', color: '#6b7280' }
              };
              return (
                <div key={status} style={{ background: 'white', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors[status].color }}>{count}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', textTransform: 'capitalize' }}>{status}</div>
                </div>
              );
            })}
          </div>

          {/* Queue Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'pending', 'processing', 'sent', 'failed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setQueueFilter(status)}
                  style={{
                    padding: '6px 12px',
                    background: queueFilter === status ? '#5e72e4' : 'white',
                    color: queueFilter === status ? 'white' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textTransform: 'capitalize'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={fetchQueueItems} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
              <button
                onClick={handleProcessQueue}
                disabled={processingQueue}
                style={{
                  padding: '8px 16px',
                  background: processingQueue ? '#9ca3af' : '#5e72e4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: processingQueue ? 'not-allowed' : 'pointer'
                }}
              >
                <i className={`fas ${processingQueue ? 'fa-spinner fa-spin' : 'fa-play'}`}></i> Process Queue
              </button>
            </div>
          </div>

          {/* Queue Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div><p>Loading queue...</p></div>
          ) : queueItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
              <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px', display: 'block' }}></i>
              <h3>No emails in queue</h3>
              <p style={{ color: '#6b7280' }}>Scheduled emails will appear here</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Recipient</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Template</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Scheduled</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Attempts</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queueItems.map((item, idx) => {
                    const statusColors = {
                      pending: { bg: '#fef3c7', color: '#d97706' },
                      processing: { bg: '#dbeafe', color: '#2563eb' },
                      sent: { bg: '#d1fae5', color: '#059669' },
                      failed: { bg: '#fee2e2', color: '#dc2626' },
                      cancelled: { bg: '#f3f4f6', color: '#6b7280' }
                    };
                    const sc = statusColors[item.Status] || statusColors.pending;
                    return (
                      <tr key={item.QueueID || idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                          <div>{item.RecipientEmail}</div>
                          {item.RecipientName && <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.RecipientName}</div>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{item.TemplateKey}</code>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                          {item.ScheduledAt ? new Date(item.ScheduledAt).toLocaleString() : '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: sc.bg, color: sc.color, textTransform: 'capitalize' }}>
                            {item.Status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>{item.AttemptCount || 0}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {item.Status === 'pending' && (
                            <button
                              onClick={() => handleCancelQueuedEmail(item.QueueID)}
                              style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              <i className="fas fa-times"></i> Cancel
                            </button>
                          )}
                          {item.Status === 'failed' && item.ErrorMessage && (
                            <span title={item.ErrorMessage} style={{ color: '#dc2626', fontSize: '12px', cursor: 'help' }}>
                              <i className="fas fa-exclamation-circle"></i> Error
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Header & Footer Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
            <i className="fas fa-code" style={{ color: '#5e72e4', marginRight: '8px' }}></i>
            Email Header & Footer Templates
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
            Configure the default header and footer that will be applied to all email templates.
          </p>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
              Email Header HTML
            </label>
            <textarea
              value={headerFooter.header}
              onChange={(e) => setHeaderFooter(prev => ({ ...prev, header: e.target.value }))}
              style={{
                width: '100%',
                height: '200px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '13px',
                resize: 'vertical'
              }}
              placeholder="Enter header HTML..."
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
              Email Footer HTML
            </label>
            <textarea
              value={headerFooter.footer}
              onChange={(e) => setHeaderFooter(prev => ({ ...prev, footer: e.target.value }))}
              style={{
                width: '100%',
                height: '200px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '13px',
                resize: 'vertical'
              }}
              placeholder="Enter footer HTML..."
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={saveHeaderFooter}
              style={{
                padding: '12px 24px',
                background: '#5e72e4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
              Save Header & Footer
            </button>
            <button
              onClick={() => setHeaderFooter({ header: getDefaultHeader(), footer: getDefaultFooter() })}
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {/* Send Test Email Tab */}
      {activeTab === 'test' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
            <i className="fas fa-paper-plane" style={{ color: '#5e72e4', marginRight: '8px' }}></i>
            Send Test Email
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
            Test your email configuration by sending a test email.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>
                Recipient Email *
              </label>
              <input
                type="email"
                value={testEmail.to}
                onChange={(e) => setTestEmail(prev => ({ ...prev, to: e.target.value }))}
                placeholder="test@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>
                Use Template (Optional)
              </label>
              <select
                value={testEmail.template}
                onChange={(e) => setTestEmail(prev => ({ ...prev, template: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Custom Email --</option>
                {templates.map(t => (
                  <option key={t.TemplateID || t.id} value={t.TemplateKey || t.templateKey}>
                    {t.TemplateName || t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>
              Subject *
            </label>
            <input
              type="text"
              value={testEmail.subject}
              onChange={(e) => setTestEmail(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Test Email Subject"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>
              Email Body (HTML)
            </label>
            <textarea
              value={testEmail.body}
              onChange={(e) => setTestEmail(prev => ({ ...prev, body: e.target.value }))}
              placeholder="<p>Your test email content here...</p>"
              style={{
                width: '100%',
                height: '200px',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>
          
          <button
            onClick={sendTestEmail}
            disabled={sendingTest || !testEmail.to || !testEmail.subject}
            style={{
              padding: '12px 24px',
              background: sendingTest ? '#9ca3af' : '#5e72e4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: sendingTest ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className={`fas ${sendingTest ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
            {sendingTest ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      )}

      {/* Email Editor Modal */}
      {modalType === 'edit' && (
        <EmailEditorModal
          template={selectedTemplate}
          categories={categories}
          onClose={() => { setSelectedTemplate(null); setModalType(null); }}
          onSave={() => { fetchTemplates(); setSelectedTemplate(null); setModalType(null); }}
        />
      )}

      {/* Email Preview Modal */}
      {modalType === 'preview' && selectedTemplate && (
        <div 
          style={{ 
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
          }}
          onClick={() => { setSelectedTemplate(null); setModalType(null); }}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: '12px', 
              width: '700px',
              maxWidth: '90%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Email Preview</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                  To: {selectedTemplate.recipient} • Sent: {selectedTemplate.sentAt}
                </p>
              </div>
              <button
                onClick={() => { setSelectedTemplate(null); setModalType(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={{ padding: '20px', background: '#f9fafb' }}>
              <div style={{ 
                background: '#5e72e4', 
                color: 'white', 
                padding: '12px 16px',
                borderRadius: '8px 8px 0 0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Subject: {selectedTemplate.subject}
              </div>
              <div style={{ 
                background: 'white', 
                border: '1px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                padding: '20px',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                {selectedTemplate.body ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.body }} />
                ) : (
                  <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Email body not available for preview</p>
                )}
              </div>
            </div>
          </div>
        </div>
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
    <h1 style="color: white; margin: 0; font-size: 24px;">Planbeau</h1>
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
      © 2024 Planbeau. All rights reserved.
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
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={template ? 'Edit Email Template' : 'Create Email Template'}
      size="large"
      footer={
        <>
          <button className="um-btn um-btn-secondary" onClick={() => setPreviewMode(!previewMode)}>
            <i className={`fas fa-${previewMode ? 'edit' : 'eye'}`}></i> {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button className="um-btn um-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="um-btn um-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
          </button>
        </>
      }
    >
      <div style={{ minHeight: '400px' }}>
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
    </UniversalModal>
  );
};

export default EmailManagementPanel;
