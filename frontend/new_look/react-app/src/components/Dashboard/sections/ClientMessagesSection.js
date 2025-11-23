import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { showBanner } from '../../../utils/helpers';

function ClientMessagesSection({ onSectionChange }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/messages/conversations/user/${currentUser.id}`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        console.error('Failed to load conversations');
        // Try localStorage fallback like vanilla JS
        const localConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        setConversations(localConversations.filter(c => c.userId === currentUser.id));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      showBanner('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversation/${conversationId}`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.ConversationId);
    }
  }, [selectedConversation, loadMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversationId: selectedConversation.ConversationId,
          senderId: currentUser.id,
          message: newMessage.trim()
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        loadMessages(selectedConversation.ConversationId);
      } else {
        showBanner('Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showBanner('Failed to send message', 'error');
    }
  };

  const renderConversationItem = (conversation) => {
    const lastMessageDate = conversation.LastMessageDate 
      ? new Date(conversation.LastMessageDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      : '';

    return (
      <div 
        key={conversation.ConversationId} 
        className={`conversation-item ${selectedConversation?.ConversationId === conversation.ConversationId ? 'active' : ''}`}
        onClick={() => setSelectedConversation(conversation)}
      >
        <div className="conversation-avatar">
          {conversation.OtherUserName?.substring(0, 2).toUpperCase() || 'V'}
        </div>
        <div className="conversation-content">
          <div className="conversation-name">{conversation.OtherUserName || 'Vendor'}</div>
          <div className="conversation-preview">{conversation.LastMessage || 'No messages yet'}</div>
        </div>
        <div className="conversation-meta">
          <div className="conversation-time">{lastMessageDate}</div>
          {conversation.UnreadCount > 0 && (
            <span className="unread-badge">{conversation.UnreadCount}</span>
          )}
        </div>
      </div>
    );
  };

  const renderMessage = (message) => {
    const isOwn = message.SenderId === currentUser.id;
    const messageTime = new Date(message.SentAt).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });

    return (
      <div key={message.MessageId} className={`chat-message ${isOwn ? 'own' : 'other'}`}>
        <div className="message-content">
          <div className="message-text">{message.MessageText}</div>
          <div className="message-time">{messageTime}</div>
        </div>
      </div>
    );
  };

  return (
    <div id="messages-section">
      <div className="dashboard-card">
        <div className="chat-container" style={{ height: '600px' }}>
          {!selectedConversation ? (
            <div className="conversations-list-view">
              <div className="conversations-header">
                <h3>Messages</h3>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                </div>
              ) : conversations.length > 0 ? (
                <div className="conversations-list">
                  {conversations.map(renderConversationItem)}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-comments" style={{ fontSize: '3rem', color: 'var(--text-light)', marginBottom: '1rem' }}></i>
                  <p>No conversations yet.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="chat-header">
                <button 
                  className="back-button"
                  onClick={() => setSelectedConversation(null)}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="chat-user-info">
                  <div className="chat-user-avatar">
                    {selectedConversation.OtherUserName?.substring(0, 2).toUpperCase() || 'V'}
                  </div>
                  <span className="chat-user-name">{selectedConversation.OtherUserName || 'Vendor'}</span>
                </div>
              </div>
              <div className="chat-messages" id="dashboard-chat-messages">
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-input" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  id="dashboard-chat-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" id="dashboard-send-btn">
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientMessagesSection;
