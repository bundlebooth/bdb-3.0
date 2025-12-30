import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const ChatOversightPanel = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, flagged, active, archived
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [systemMessage, setSystemMessage] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

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

  const handleFlagConversation = async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/chats/${conversationId}/flag`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showBanner('Conversation flagged', 'success');
        fetchConversations();
      }
    } catch (error) {
      showBanner('Failed to flag conversation', 'error');
    }
  };

  return (
    <div className="admin-panel chat-oversight">
      <div className="chat-layout">
        {/* Conversations List */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h3>Conversations</h3>
            <div className="filter-dropdown">
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="flagged">Flagged</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by user, vendor, or booking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchConversations()}
            />
          </div>

          <div className="conversations-list">
            {loading ? (
              <div className="loading-state small">
                <div className="spinner"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="empty-state small">
                <i className="fas fa-comments"></i>
                <p>No conversations found</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.ConversationID}
                  className={`conversation-item ${selectedConversation?.ConversationID === conv.ConversationID ? 'active' : ''} ${conv.IsFlagged ? 'flagged' : ''}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="conv-header">
                    <div className="conv-participants">
                      <span className="client-name">{conv.ClientName}</span>
                      <i className="fas fa-exchange-alt"></i>
                      <span className="vendor-name">{conv.VendorName}</span>
                    </div>
                    {conv.IsFlagged && <i className="fas fa-flag flag-icon"></i>}
                  </div>
                  <div className="conv-preview">
                    {conv.LastMessage?.substring(0, 50)}...
                  </div>
                  <div className="conv-meta">
                    <span className="conv-time">
                      {new Date(conv.LastMessageAt).toLocaleDateString()}
                    </span>
                    {conv.BookingID && (
                      <span className="conv-booking">Booking #{conv.BookingID}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages Panel */}
        <div className="messages-panel">
          {selectedConversation ? (
            <>
              <div className="messages-header">
                <div className="header-info">
                  <h3>{selectedConversation.ClientName} ↔ {selectedConversation.VendorName}</h3>
                  {selectedConversation.BookingID && (
                    <span className="booking-ref">Booking #{selectedConversation.BookingID}</span>
                  )}
                </div>
                <div className="header-actions">
                  <button
                    className={`action-btn ${selectedConversation.IsFlagged ? 'flagged' : ''}`}
                    onClick={() => handleFlagConversation(selectedConversation.ConversationID)}
                    title={selectedConversation.IsFlagged ? 'Unflag' : 'Flag Conversation'}
                  >
                    <i className="fas fa-flag"></i>
                  </button>
                </div>
              </div>

              <div className="messages-container">
                {messagesLoading ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`message-item ${msg.SenderType} ${msg.IsFlagged ? 'flagged' : ''} ${msg.IsSystem ? 'system' : ''} ${msg.IsAdminNote ? 'admin-note' : ''}`}
                      >
                        <div className="message-header">
                          <span className="sender-name">
                            {msg.IsSystem ? 'PlanBeau Support' : msg.IsAdminNote ? 'Admin Note' : msg.SenderName}
                          </span>
                          <span className="message-time">
                            {new Date(msg.SentAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="message-content">
                          {msg.Content}
                        </div>
                        {!msg.IsSystem && !msg.IsAdminNote && (
                          <div className="message-actions">
                            <button
                              className="flag-btn"
                              onClick={() => handleFlagMessage(msg.MessageID, 'Inappropriate content')}
                              title="Flag Message"
                            >
                              <i className="fas fa-flag"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-actions-panel">
                <div className="action-section">
                  <h4><i className="fas fa-sticky-note"></i> Add Admin Note (Internal)</h4>
                  <div className="input-group">
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add internal note..."
                      rows={2}
                    />
                    <button className="btn-secondary" onClick={handleAddAdminNote}>
                      Add Note
                    </button>
                  </div>
                </div>

                <div className="action-section">
                  <h4><i className="fas fa-headset"></i> Send System Message</h4>
                  <div className="input-group">
                    <textarea
                      value={systemMessage}
                      onChange={(e) => setSystemMessage(e.target.value)}
                      placeholder="Send message as PlanBeau Support..."
                      rows={2}
                    />
                    <button className="btn-primary" onClick={handleSendSystemMessage}>
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <i className="fas fa-comments"></i>
              <h3>Select a Conversation</h3>
              <p>Choose a conversation from the list to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatOversightPanel;
