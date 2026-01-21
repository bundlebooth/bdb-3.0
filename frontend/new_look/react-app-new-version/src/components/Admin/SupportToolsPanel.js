import React, { useState, useEffect } from 'react';
import { showBanner } from '../../utils/helpers';
import { apiGet, apiPost } from '../../utils/api';
import { API_BASE_URL } from '../../config';
import UniversalModal from '../UniversalModal';
import { LoadingState, EmptyState } from '../common/AdminComponents';

const SupportToolsPanel = () => {
  const [activeTab, setActiveTab] = useState('messages'); // messages, impersonate, tickets, notes
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Support Messages state
  const [supportConversations, setSupportConversations] = useState([]);
  const [selectedSupportConv, setSelectedSupportConv] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportReply, setSupportReply] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    }
    if (activeTab === 'messages') {
      fetchSupportConversations();
    }
  }, [activeTab]);
  
  // Fetch support conversations
  const fetchSupportConversations = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/admin/support/conversations');
      if (response.ok) {
        const data = await response.json();
        setSupportConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching support conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch messages for a support conversation
  const fetchSupportMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      const response = await apiGet(`/admin/support/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setSupportMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching support messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };
  
  // Send reply to support conversation
  const sendSupportReply = async () => {
    if (!supportReply.trim() || !selectedSupportConv) return;
    
    try {
      setSendingReply(true);
      const response = await apiPost(`/admin/support/conversations/${selectedSupportConv.ConversationID}/reply`, {
        content: supportReply
      });
      
      if (response.ok) {
        setSupportReply('');
        fetchSupportMessages(selectedSupportConv.ConversationID);
        showBanner('Reply sent successfully', 'success');
      } else {
        showBanner('Failed to send reply', 'error');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      showBanner('Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };
  
  // Handle selecting a support conversation
  const handleSelectSupportConv = (conv) => {
    setSelectedSupportConv(conv);
    fetchSupportMessages(conv.ConversationID);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      setSearching(true);
      const response = await apiGet(`/admin/support/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleImpersonate = async (userId, userType) => {
    if (!window.confirm(`Are you sure you want to impersonate this ${userType}? This action will be logged.`)) {
      return;
    }

    try {
      const response = await apiPost('/admin/support/impersonate', { userId, userType });

      if (response.ok) {
        const data = await response.json();
        // Store admin token for later restoration
        localStorage.setItem('adminToken', localStorage.getItem('token'));
        localStorage.setItem('token', data.impersonationToken);
        showBanner(`Now viewing as ${userType}. Click "Exit Impersonation" to return.`, 'info');
        // Redirect to appropriate page
        window.location.href = userType === 'vendor' ? '/become-a-vendor' : '/';
      }
    } catch (error) {
      showBanner('Failed to impersonate user', 'error');
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/admin/support/tickets');

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      } else {
        // Mock tickets
        setTickets([
          { id: 1, subject: 'Payment not received', user: 'vendor@example.com', status: 'open', priority: 'high', createdAt: new Date().toISOString() },
          { id: 2, subject: 'Cannot update profile', user: 'user@example.com', status: 'in_progress', priority: 'medium', createdAt: new Date(Date.now() - 86400000).toISOString() },
          { id: 3, subject: 'Booking cancellation issue', user: 'client@example.com', status: 'open', priority: 'low', createdAt: new Date(Date.now() - 172800000).toISOString() }
        ]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'open': { class: 'badge-warning', label: 'Open' },
      'in_progress': { class: 'badge-info', label: 'In Progress' },
      'resolved': { class: 'badge-success', label: 'Resolved' },
      'closed': { class: 'badge-secondary', label: 'Closed' }
    };
    const config = statusMap[status] || { class: 'badge-secondary', label: status };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      'high': { class: 'priority-high', label: 'High' },
      'medium': { class: 'priority-medium', label: 'Medium' },
      'low': { class: 'priority-low', label: 'Low' }
    };
    const config = priorityMap[priority] || { class: '', label: priority };
    return <span className={`priority-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="admin-panel support-tools">
      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <i className="fas fa-comments"></i> Support Messages
        </button>
        <button
          className={`tab ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <i className="fas fa-ticket-alt"></i> Support Tickets
        </button>
        <button
          className={`tab ${activeTab === 'impersonate' ? 'active' : ''}`}
          onClick={() => setActiveTab('impersonate')}
        >
          <i className="fas fa-user-secret"></i> Impersonate User
        </button>
        <button
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <i className="fas fa-sticky-note"></i> Internal Notes
        </button>
      </div>

      {/* Support Messages Tab */}
      {activeTab === 'messages' && (
        <div className="support-messages-section">
          <div style={{ display: 'flex', height: 'calc(100vh - 250px)', gap: '20px' }}>
            {/* Conversations List */}
            <div style={{ width: '350px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  <i className="fas fa-inbox" style={{ marginRight: '8px', color: '#5e72e4' }}></i>
                  Support Inbox
                </h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="spinner"></div>
                  </div>
                ) : supportConversations.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
                    <i className="fas fa-inbox" style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px', display: 'block' }}></i>
                    <p style={{ margin: 0 }}>No support conversations</p>
                  </div>
                ) : (
                  supportConversations.map(conv => (
                    <div
                      key={conv.ConversationID}
                      onClick={() => handleSelectSupportConv(conv)}
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        background: selectedSupportConv?.ConversationID === conv.ConversationID ? '#f0f4ff' : 'white',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#5e72e4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 600
                        }}>
                          {(conv.UserName || 'U')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>
                            {conv.UserName || 'Unknown User'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.LastMessage || 'No messages yet'}
                          </div>
                        </div>
                        {conv.UnreadCount > 0 && (
                          <span style={{
                            background: '#ef4444',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '2px 8px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {conv.UnreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button className="btn-secondary" onClick={fetchSupportConversations} style={{ width: '100%' }}>
                  <i className="fas fa-sync-alt"></i> Refresh
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {selectedSupportConv ? (
                <>
                  {/* Chat Header */}
                  <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#5e72e4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 600
                    }}>
                      {(selectedSupportConv.UserName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px', color: '#111' }}>
                        {selectedSupportConv.UserName || 'Unknown User'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {selectedSupportConv.UserEmail || 'No email'}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9fafb' }}>
                    {messagesLoading ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="spinner"></div>
                      </div>
                    ) : supportMessages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        <p>No messages in this conversation</p>
                      </div>
                    ) : (
                      supportMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: msg.IsFromSupport ? 'flex-end' : 'flex-start',
                            marginBottom: '12px'
                          }}
                        >
                          <div style={{
                            maxWidth: '70%',
                            padding: '12px 16px',
                            borderRadius: msg.IsFromSupport ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: msg.IsFromSupport ? '#5e72e4' : 'white',
                            color: msg.IsFromSupport ? 'white' : '#111',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.Content}</div>
                            <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.7 }}>
                              {new Date(msg.CreatedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Reply Input */}
                  <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', background: 'white' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <textarea
                        value={supportReply}
                        onChange={(e) => setSupportReply(e.target.value)}
                        placeholder="Type your reply..."
                        rows={2}
                        style={{
                          flex: 1,
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          resize: 'none',
                          outline: 'none'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendSupportReply();
                          }
                        }}
                      />
                      <button
                        className="btn-primary"
                        onClick={sendSupportReply}
                        disabled={sendingReply || !supportReply.trim()}
                        style={{ alignSelf: 'flex-end', padding: '12px 24px' }}
                      >
                        {sendingReply ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane"></i> Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  <div style={{ textAlign: 'center' }}>
                    <i className="fas fa-comments" style={{ fontSize: '64px', opacity: 0.3, marginBottom: '16px', display: 'block' }}></i>
                    <h3 style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Select a conversation</h3>
                    <p style={{ margin: 0, fontSize: '14px' }}>Choose a support conversation from the list to view and reply</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Impersonate Tab */}
      {activeTab === 'impersonate' && (
        <div className="impersonate-section">
          <div className="section-card">
            <h3><i className="fas fa-user-secret"></i> Impersonate User or Vendor</h3>
            <p className="section-description">
              View the platform as a specific user or vendor to troubleshoot issues. All impersonation actions are logged.
            </p>

            <div className="warning-box">
              <i className="fas fa-exclamation-triangle"></i>
              <div>
                <strong>Important:</strong> Impersonation allows you to see exactly what the user sees. 
                Do not make changes to their account unless necessary. All actions are logged for security.
              </div>
            </div>

            <div className="search-section">
              <div className="search-box large">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by email, name, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn-primary" onClick={handleSearch} disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                <h4>Search Results</h4>
                <div className="results-list">
                  {searchResults.map(result => (
                    <div key={`${result.type}-${result.id}`} className="result-item">
                      <div className="result-avatar">
                        <i className={`fas fa-${result.type === 'vendor' ? 'store' : 'user'}`}></i>
                      </div>
                      <div className="result-info">
                        <strong>{result.name}</strong>
                        <span>{result.email}</span>
                        <span className={`account-type ${result.accountType.toLowerCase()}`}>
                          {result.accountType}
                        </span>
                      </div>
                      <button
                        className="btn-primary"
                        onClick={() => handleImpersonate(result.id, result.type)}
                      >
                        <i className="fas fa-sign-in-alt"></i> Impersonate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="tickets-section">
          <div className="panel-toolbar">
            <div className="toolbar-left">
              <div className="filter-tabs">
                <button className="filter-tab active">All</button>
                <button className="filter-tab">Open</button>
                <button className="filter-tab">In Progress</button>
                <button className="filter-tab">Resolved</button>
              </div>
            </div>
            <div className="toolbar-right">
              <button className="btn-primary" onClick={() => setSelectedTicket({ isNew: true })}>
                <i className="fas fa-plus"></i> Create Ticket
              </button>
            </div>
          </div>

          <div className="tickets-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-ticket-alt"></i>
                <h3>No Support Tickets</h3>
                <p>There are no support tickets at this time</p>
              </div>
            ) : (
              <div className="tickets-list">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="ticket-item" onClick={() => setSelectedTicket(ticket)}>
                    <div className="ticket-priority">
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <div className="ticket-info">
                      <h4>{ticket.subject}</h4>
                      <div className="ticket-meta">
                        <span><i className="fas fa-user"></i> {ticket.user}</span>
                        <span><i className="fas fa-clock"></i> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="ticket-status">
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <InternalNotesSection />
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onSave={() => { fetchTickets(); setSelectedTicket(null); }}
        />
      )}
    </div>
  );
};

// Internal Notes Section
const InternalNotesSection = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', relatedTo: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await apiGet('/admin/support/notes');

      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      } else {
        // Mock notes
        setNotes([
          { id: 1, title: 'Vendor onboarding issue', content: 'User reported issues with Stripe connection. Need to follow up.', relatedTo: 'vendor@example.com', createdAt: new Date().toISOString(), author: 'Admin' },
          { id: 2, title: 'Payment dispute resolution', content: 'Refund issued for booking #1234. Client satisfied with resolution.', relatedTo: 'Booking #1234', createdAt: new Date(Date.now() - 86400000).toISOString(), author: 'Admin' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      showBanner('Please fill in all fields', 'error');
      return;
    }

    try {
      const response = await apiPost('/admin/support/notes', newNote);

      if (response.ok) {
        showBanner('Note added', 'success');
        setNewNote({ title: '', content: '', relatedTo: '' });
        fetchNotes();
      }
    } catch (error) {
      showBanner('Failed to add note', 'error');
    }
  };

  return (
    <div className="notes-section">
      <div className="section-card">
        <h3><i className="fas fa-plus"></i> Add Internal Note</h3>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={newNote.title}
            onChange={e => setNewNote({ ...newNote, title: e.target.value })}
            placeholder="Note title..."
          />
        </div>
        <div className="form-group">
          <label>Related To (User/Vendor/Booking)</label>
          <input
            type="text"
            value={newNote.relatedTo}
            onChange={e => setNewNote({ ...newNote, relatedTo: e.target.value })}
            placeholder="e.g., user@example.com or Booking #1234"
          />
        </div>
        <div className="form-group">
          <label>Content</label>
          <textarea
            value={newNote.content}
            onChange={e => setNewNote({ ...newNote, content: e.target.value })}
            placeholder="Note content..."
            rows={4}
          />
        </div>
        <button className="btn-primary" onClick={handleAddNote}>
          <i className="fas fa-save"></i> Save Note
        </button>
      </div>

      <div className="section-card">
        <h3><i className="fas fa-sticky-note"></i> Recent Notes</h3>
        {loading ? (
          <div className="loading-state small">
            <div className="spinner"></div>
          </div>
        ) : notes.length === 0 ? (
          <p className="no-data">No internal notes yet</p>
        ) : (
          <div className="notes-list">
            {notes.map(note => (
              <div key={note.id} className="note-item">
                <div className="note-header">
                  <h4>{note.title}</h4>
                  <span className="note-date">{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                {note.relatedTo && (
                  <div className="note-related">
                    <i className="fas fa-link"></i> {note.relatedTo}
                  </div>
                )}
                <p className="note-content">{note.content}</p>
                <div className="note-footer">
                  <span className="note-author">By {note.author}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Ticket Modal
const TicketModal = ({ ticket, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    subject: ticket?.subject || '',
    user: ticket?.user || '',
    priority: ticket?.priority || 'medium',
    status: ticket?.status || 'open',
    description: ticket?.description || '',
    response: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = ticket?.isNew
        ? `${API_BASE_URL}/admin/support/tickets`
        : `${API_BASE_URL}/admin/support/tickets/${ticket.id}`;

      const response = await fetch(url, {
        method: ticket?.isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showBanner(`Ticket ${ticket?.isNew ? 'created' : 'updated'}`, 'success');
        onSave();
      }
    } catch (error) {
      showBanner('Failed to save ticket', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={ticket?.isNew ? 'Create Support Ticket' : `Ticket #${ticket.id}`}
      size="large"
      primaryAction={{
        label: saving ? 'Saving...' : (ticket?.isNew ? 'Create Ticket' : 'Update Ticket'),
        onClick: handleSave,
        loading: saving
      }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      <div className="form-row">
        <div className="form-group">
          <label>Subject</label>
          <input type="text" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
        </div>
        <div className="form-group">
          <label>User Email</label>
          <input type="text" value={formData.user} onChange={e => setFormData({ ...formData, user: e.target.value })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Priority</label>
          <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} />
      </div>
      {!ticket?.isNew && (
        <div className="form-group">
          <label>Response</label>
          <textarea value={formData.response} onChange={e => setFormData({ ...formData, response: e.target.value })} placeholder="Add a response to this ticket..." rows={4} />
        </div>
      )}
      <div className="form-group">
        <label>Attachments</label>
        <div className="file-upload">
          <input type="file" multiple onChange={handleFileUpload} id="ticket-attachments" style={{ display: 'none' }} />
          <label htmlFor="ticket-attachments" className="file-upload-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#f3f4f6', borderRadius: '6px', cursor: 'pointer' }}>
            <i className="fas fa-paperclip"></i> Add Files
          </label>
        </div>
        {attachments.length > 0 && (
          <div className="attachments-list" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {attachments.map((file, index) => (
              <div key={index} className="attachment-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: '#f3f4f6', borderRadius: '4px' }}>
                <i className="fas fa-file"></i>
                <span>{file.name}</span>
                <button onClick={() => setAttachments(attachments.filter((_, i) => i !== index))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </UniversalModal>
  );
};

export default SupportToolsPanel;
