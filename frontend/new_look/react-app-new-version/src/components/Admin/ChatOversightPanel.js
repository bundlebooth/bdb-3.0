import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

// Content moderation patterns
const MODERATION_PATTERNS = {
  swearing: /\b(fuck|shit|damn|ass|bitch|bastard|crap|hell|piss)\b/gi,
  soliciting: /\b(venmo|paypal|cashapp|zelle|cash\s*app|pay\s*me|send\s*money|wire\s*transfer|western\s*union|bitcoin|crypto|btc|eth)\b/gi,
  contactInfo: /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)|(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)|(\b\d{10,11}\b)|(@[a-zA-Z0-9_]{3,})/gi
};

const FLAG_REASONS = [
  { key: 'swearing', label: 'Inappropriate Language', icon: 'fa-language', color: '#ef4444' },
  { key: 'soliciting', label: 'Soliciting Payment', icon: 'fa-dollar-sign', color: '#f59e0b' },
  { key: 'contactInfo', label: 'Sharing Contact Info', icon: 'fa-phone', color: '#8b5cf6' },
  { key: 'harassment', label: 'Harassment', icon: 'fa-exclamation-triangle', color: '#dc2626' },
  { key: 'spam', label: 'Spam', icon: 'fa-ban', color: '#6b7280' },
  { key: 'other', label: 'Other Violation', icon: 'fa-flag', color: '#3b82f6' }
];

const detectViolations = (content) => {
  const violations = [];
  if (MODERATION_PATTERNS.swearing.test(content)) violations.push('swearing');
  if (MODERATION_PATTERNS.soliciting.test(content)) violations.push('soliciting');
  if (MODERATION_PATTERNS.contactInfo.test(content)) violations.push('contactInfo');
  return violations;
};

const ChatOversightPanel = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [systemMessage, setSystemMessage] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [showFlagModal, setShowFlagModal] = useState(null);
  const [selectedFlagReason, setSelectedFlagReason] = useState('');
  const [customFlagNote, setCustomFlagNote] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [filter, pagination.page]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/chats?filter=${filter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      showBanner('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/chats/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.ConversationID);
  };

  const handleFlagMessage = async (messageId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/chats/messages/${messageId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        showBanner('Message flagged', 'success');
        fetchMessages(selectedConversation.ConversationID);
      }
    } catch (error) {
      showBanner('Failed to flag message', 'error');
    }
  };

  const handleAddAdminNote = async () => {
    if (!adminNote.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/chats/${selectedConversation.ConversationID}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ note: adminNote })
      });

      if (response.ok) {
        showBanner('Note added', 'success');
        setAdminNote('');
        fetchMessages(selectedConversation.ConversationID);
      }
    } catch (error) {
      showBanner('Failed to add note', 'error');
    }
  };

  const handleSendSystemMessage = async () => {
    if (!systemMessage.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/chats/${selectedConversation.ConversationID}/system-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: systemMessage })
      });

      if (response.ok) {
        showBanner('System message sent', 'success');
        setSystemMessage('');
        fetchMessages(selectedConversation.ConversationID);
      }
    } catch (error) {
      showBanner('Failed to send message', 'error');
    }
  };

  const handleFlagConversation = async (conversationId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/chats/${conversationId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason: reason || 'Manual flag by admin' })
      });

      if (response.ok) {
        showBanner('Conversation flagged', 'success');
        fetchConversations();
      }
    } catch (error) {
      showBanner('Failed to flag conversation', 'error');
    }
  };

  const handleFlagMessageWithReason = async () => {
    if (!showFlagModal || !selectedFlagReason) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/chats/messages/${showFlagModal}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          reason: selectedFlagReason,
          note: customFlagNote 
        })
      });

      if (response.ok) {
        showBanner('Message flagged successfully', 'success');
        fetchMessages(selectedConversation.ConversationID);
        setShowFlagModal(null);
        setSelectedFlagReason('');
        setCustomFlagNote('');
      }
    } catch (error) {
      showBanner('Failed to flag message', 'error');
    }
  };

  const getViolationBadges = (content) => {
    const violations = detectViolations(content);
    return violations.map(v => {
      const reason = FLAG_REASONS.find(r => r.key === v);
      return reason ? (
        <span 
          key={v} 
          className="violation-badge"
          style={{ 
            background: reason.color + '20', 
            color: reason.color,
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            marginLeft: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <i className={`fas ${reason.icon}`} style={{ fontSize: '9px' }}></i>
          {reason.label}
        </span>
      ) : null;
    });
  };

  return (
    <div className="admin-panel chat-oversight" style={{ height: 'calc(100vh - 180px)' }}>
      <div style={{ display: 'flex', height: '100%', gap: '20px' }}>
        {/* Conversations List */}
        <div style={{ 
          width: '380px', 
          background: 'white', 
          borderRadius: '12px', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Conversations</h3>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ 
                padding: '6px 12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                fontSize: '13px',
                background: 'white'
              }}
            >
              <option value="all">All</option>
              <option value="flagged">Flagged</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: '#f3f4f6', 
              borderRadius: '8px',
              padding: '8px 12px'
            }}>
              <i className="fas fa-search" style={{ color: '#9ca3af', marginRight: '8px' }}></i>
              <input
                type="text"
                placeholder="Search by user, vendor, or booking..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchConversations()}
                style={{ 
                  border: 'none', 
                  background: 'transparent', 
                  outline: 'none',
                  width: '100%',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div className="spinner"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                <i className="fas fa-comments" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                <p>No conversations found</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.ConversationID}
                  onClick={() => handleSelectConversation(conv)}
                  style={{ 
                    padding: '14px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: selectedConversation?.ConversationID === conv.ConversationID ? '#eff6ff' : 'white',
                    borderLeft: conv.IsFlagged ? '3px solid #ef4444' : selectedConversation?.ConversationID === conv.ConversationID ? '3px solid #5e72e4' : '3px solid transparent',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedConversation?.ConversationID !== conv.ConversationID) {
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedConversation?.ConversationID !== conv.ConversationID) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>{conv.ClientName}</span>
                      <i className="fas fa-exchange-alt" style={{ color: '#9ca3af', fontSize: '10px' }}></i>
                      <span style={{ color: '#5e72e4', fontSize: '14px' }}>{conv.VendorName}</span>
                    </div>
                    {conv.IsFlagged && (
                      <span style={{ 
                        background: '#fee2e2', 
                        color: '#dc2626', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <i className="fas fa-flag"></i> Flagged
                      </span>
                    )}
                  </div>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '13px', 
                    color: '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {conv.LastMessage?.substring(0, 60) || 'No messages yet'}...
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {conv.LastMessageAt ? new Date(conv.LastMessageAt).toLocaleDateString() : 'Invalid Date'}
                    </span>
                    {conv.BookingID && (
                      <span style={{ 
                        background: '#dbeafe', 
                        color: '#2563eb', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        Booking #{conv.BookingID}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages Panel */}
        <div style={{ 
          flex: 1, 
          background: 'white', 
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          {selectedConversation ? (
            <>
              {/* Header */}
              <div style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f9fafb'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                    {selectedConversation.ClientName} <span style={{ color: '#9ca3af', margin: '0 8px' }}>↔</span> {selectedConversation.VendorName}
                  </h3>
                  {selectedConversation.BookingID && (
                    <span style={{ fontSize: '13px', color: '#5e72e4' }}>Booking #{selectedConversation.BookingID}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleFlagConversation(selectedConversation.ConversationID, 'Manual review')}
                    style={{ 
                      padding: '8px 16px',
                      background: selectedConversation.IsFlagged ? '#fee2e2' : '#f3f4f6',
                      color: selectedConversation.IsFlagged ? '#dc2626' : '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-flag"></i>
                    {selectedConversation.IsFlagged ? 'Flagged' : 'Flag'}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '20px',
                background: '#f8fafc'
              }}>
                {messagesLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <div className="spinner"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <i className="fas fa-comments" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                    <p>No messages in this conversation</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {messages.map((msg, index) => {
                      const violations = detectViolations(msg.Content || '');
                      const hasViolations = violations.length > 0;
                      const isClient = msg.SenderType === 'client';
                      const isSystem = msg.IsSystem;
                      const isAdminNote = msg.IsAdminNote;
                      
                      return (
                        <div
                          key={index}
                          style={{ 
                            maxWidth: isSystem || isAdminNote ? '100%' : '75%',
                            alignSelf: isSystem || isAdminNote ? 'center' : isClient ? 'flex-start' : 'flex-end'
                          }}
                        >
                          <div style={{
                            background: isSystem ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                                      : isAdminNote ? '#fef3c7'
                                      : hasViolations ? '#fee2e2'
                                      : isClient ? 'white' : '#5e72e4',
                            color: isSystem ? 'white' 
                                 : isAdminNote ? '#92400e'
                                 : isClient ? '#1f2937' : 'white',
                            padding: '12px 16px',
                            borderRadius: isSystem || isAdminNote ? '8px' : isClient ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: hasViolations && !isSystem && !isAdminNote ? '2px solid #ef4444' : 'none',
                            position: 'relative'
                          }}>
                            {/* Header */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              marginBottom: '6px',
                              fontSize: '12px',
                              opacity: 0.8
                            }}>
                              <span style={{ fontWeight: '600' }}>
                                {isSystem ? '🛡️ PlanBeau Support' 
                                 : isAdminNote ? '📝 Admin Note (Internal)' 
                                 : msg.SenderName}
                              </span>
                              <span>{msg.SentAt ? new Date(msg.SentAt).toLocaleString() : ''}</span>
                            </div>
                            
                            {/* Content */}
                            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                              {msg.Content}
                            </div>
                            
                            {/* Violation badges */}
                            {hasViolations && !isSystem && !isAdminNote && (
                              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {getViolationBadges(msg.Content)}
                              </div>
                            )}
                            
                            {/* Flag indicator */}
                            {msg.IsFlagged && (
                              <div style={{ 
                                marginTop: '8px', 
                                padding: '4px 8px', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <i className="fas fa-flag"></i> Flagged by admin
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          {!isSystem && !isAdminNote && (
                            <div style={{ 
                              marginTop: '4px', 
                              display: 'flex', 
                              gap: '8px',
                              justifyContent: isClient ? 'flex-start' : 'flex-end'
                            }}>
                              <button
                                onClick={() => setShowFlagModal(msg.MessageID)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: msg.IsFlagged ? '#dc2626' : '#9ca3af',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <i className="fas fa-flag"></i> {msg.IsFlagged ? 'Flagged' : 'Flag'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div style={{ 
                padding: '16px 20px', 
                borderTop: '1px solid #e5e7eb',
                background: 'white'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Admin Note */}
                  <div>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      <i className="fas fa-sticky-note" style={{ color: '#f59e0b' }}></i>
                      Add Admin Note (Internal)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Internal note visible only to admins..."
                        style={{ 
                          flex: 1,
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      <button 
                        onClick={handleAddAdminNote}
                        disabled={!adminNote.trim()}
                        style={{ 
                          padding: '10px 16px',
                          background: adminNote.trim() ? '#f59e0b' : '#e5e7eb',
                          color: adminNote.trim() ? 'white' : '#9ca3af',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: adminNote.trim() ? 'pointer' : 'not-allowed',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                  
                  {/* System Message */}
                  <div>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      <i className="fas fa-headset" style={{ color: '#5e72e4' }}></i>
                      Send System Message
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={systemMessage}
                        onChange={(e) => setSystemMessage(e.target.value)}
                        placeholder="Message from PlanBeau Support..."
                        style={{ 
                          flex: 1,
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      <button 
                        onClick={handleSendSystemMessage}
                        disabled={!systemMessage.trim()}
                        style={{ 
                          padding: '10px 16px',
                          background: systemMessage.trim() ? '#5e72e4' : '#e5e7eb',
                          color: systemMessage.trim() ? 'white' : '#9ca3af',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: systemMessage.trim() ? 'pointer' : 'not-allowed',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#9ca3af'
            }}>
              <i className="fas fa-comments" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
              <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>Select a Conversation</h3>
              <p>Choose a conversation from the list to view messages</p>
            </div>
          )}
        </div>
      </div>

      {/* Flag Message Modal */}
      {showFlagModal && (
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
          onClick={() => setShowFlagModal(null)}
        >
          <div 
            style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '24px',
              width: '400px',
              maxWidth: '90%'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Flag Message</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Select a reason for flagging this message:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {FLAG_REASONS.map(reason => (
                <label 
                  key={reason.key}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '10px 12px',
                    border: selectedFlagReason === reason.key ? `2px solid ${reason.color}` : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedFlagReason === reason.key ? reason.color + '10' : 'white'
                  }}
                >
                  <input
                    type="radio"
                    name="flagReason"
                    value={reason.key}
                    checked={selectedFlagReason === reason.key}
                    onChange={() => setSelectedFlagReason(reason.key)}
                    style={{ display: 'none' }}
                  />
                  <i className={`fas ${reason.icon}`} style={{ color: reason.color }}></i>
                  <span style={{ fontSize: '14px' }}>{reason.label}</span>
                </label>
              ))}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
                Additional Notes (optional)
              </label>
              <textarea
                value={customFlagNote}
                onChange={(e) => setCustomFlagNote(e.target.value)}
                placeholder="Add any additional context..."
                rows={2}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'none'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowFlagModal(null);
                  setSelectedFlagReason('');
                  setCustomFlagNote('');
                }}
                style={{ 
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFlagMessageWithReason}
                disabled={!selectedFlagReason}
                style={{ 
                  padding: '10px 20px',
                  background: selectedFlagReason ? '#ef4444' : '#e5e7eb',
                  color: selectedFlagReason ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedFlagReason ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Flag Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatOversightPanel;
