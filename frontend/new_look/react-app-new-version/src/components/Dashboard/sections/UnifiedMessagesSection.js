import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';

function UnifiedMessagesSection({ onSectionChange }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [allConversations, setAllConversations] = useState({ client: [], vendor: [] });
  const [messageRole, setMessageRole] = useState('client'); // 'client' or 'vendor' - like widget
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [vendorProfileId, setVendorProfileId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const prevRoleRef = useRef(messageRole);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get vendor profile ID if user is a vendor
  useEffect(() => {
    const getVendorProfileId = async () => {
      if (!currentUser?.id || !currentUser?.isVendor) return;
      try {
        const response = await fetch(`${API_BASE_URL}/vendors/profile?userId=${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setVendorProfileId(data.vendorProfileId);
        }
      } catch (error) {
        console.error('Error getting vendor profile:', error);
      }
    };
    getVendorProfileId();
  }, [currentUser]);

  // Load all conversations (both as client and vendor) - like widget
  const loadConversations = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      let clientConvs = [];
      let vendorConvs = [];
      
      // Load client conversations
      try {
        const clientUrl = `${API_BASE_URL}/messages/conversations/user/${currentUser.id}`;
        const clientResponse = await fetch(clientUrl, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (clientResponse.ok) {
          const clientData = await clientResponse.json();
          clientConvs = (clientData.conversations || []).map(conv => ({
            id: conv.id || conv.ConversationID,
            userName: conv.OtherPartyName || conv.userName || 'Unknown User',
            OtherPartyName: conv.OtherPartyName || conv.userName || 'Unknown User',
            OtherPartyAvatar: conv.OtherPartyAvatar || conv.OtherPartyLogo,
            lastMessageContent: conv.lastMessageContent || conv.LastMessageContent || 'No messages yet',
            lastMessageCreatedAt: conv.lastMessageCreatedAt || conv.LastMessageCreatedAt || conv.createdAt,
            lastMessageSenderId: conv.lastMessageSenderId || conv.LastMessageSenderID,
            unreadCount: conv.unreadCount || conv.UnreadCount || 0,
            type: 'client',
            typeLabel: 'As Client'
          }));
        }
      } catch (e) {
        console.error('Error loading client conversations:', e);
      }
      
      // Load vendor conversations if user is a vendor
      if (vendorProfileId) {
        try {
          const vendorUrl = `${API_BASE_URL}/messages/conversations/vendor/${vendorProfileId}`;
          const vendorResponse = await fetch(vendorUrl, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          
          if (vendorResponse.ok) {
            const vendorData = await vendorResponse.json();
            vendorConvs = (vendorData.conversations || []).map(conv => ({
              id: conv.id || conv.ConversationID,
              userName: conv.OtherPartyName || conv.userName || 'Unknown User',
              OtherPartyName: conv.OtherPartyName || conv.userName || 'Unknown User',
              OtherPartyAvatar: conv.OtherPartyAvatar || conv.OtherPartyLogo,
              lastMessageContent: conv.lastMessageContent || conv.LastMessageContent || 'No messages yet',
              lastMessageCreatedAt: conv.lastMessageCreatedAt || conv.LastMessageCreatedAt || conv.createdAt,
              lastMessageSenderId: conv.lastMessageSenderId || conv.LastMessageSenderID,
              unreadCount: conv.unreadCount || conv.UnreadCount || 0,
              type: 'vendor',
              typeLabel: 'As Vendor'
            }));
          }
        } catch (e) {
          console.error('Error loading vendor conversations:', e);
        }
      }
      
      // Store both lists separately like widget does
      setAllConversations({ client: clientConvs, vendor: vendorConvs });
      
      // Set current view's conversations based on role
      const currentConvs = messageRole === 'vendor' ? vendorConvs : clientConvs;
      setConversations(currentConvs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, vendorProfileId, messageRole]);

  const loadMessages = useCallback(async (conversationId, conversationType) => {
    if (!conversationId) return;
    
    try {
      const queryParam = conversationType === 'vendor' 
        ? `vendorProfileId=${vendorProfileId}` 
        : `userId=${currentUser?.id}`;
      
      const response = await fetch(`${API_BASE_URL}/messages/conversation/${conversationId}?${queryParam}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to load messages');
      
      const data = await response.json();
      setMessages(data.messages || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  }, [currentUser?.id, vendorProfileId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Update displayed conversations when role changes - like widget
  useEffect(() => {
    const currentConvs = messageRole === 'vendor' ? allConversations.vendor : allConversations.client;
    setConversations(currentConvs);
    
    // Only clear selection if role actually changed (not on initial load)
    if (prevRoleRef.current !== messageRole) {
      setSelectedConversation(null);
      setMessages([]);
      prevRoleRef.current = messageRole;
    }
  }, [messageRole, allConversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id, selectedConversation.type);
    }
  }, [selectedConversation, loadMessages]);

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = conv.OtherPartyName?.toLowerCase() || '';
    const lastMessage = conv.lastMessageContent?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || lastMessage.includes(query);
  });

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    
    // Determine sender ID based on conversation type
    const senderId = selectedConversation.type === 'vendor' ? vendorProfileId : currentUser?.id;
    
    try {
      if (window.socket) {
        window.socket.emit('send-message', {
          conversationId: selectedConversation.id,
          senderId: senderId,
          content: newMessage.trim()
        });
        setNewMessage('');
        setTimeout(() => loadMessages(selectedConversation.id, selectedConversation.type), 500);
      } else {
        const response = await fetch(`${API_BASE_URL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            conversationId: selectedConversation.id,
            senderId: senderId,
            content: newMessage.trim()
          })
        });
        
        if (response.ok) {
          setNewMessage('');
          loadMessages(selectedConversation.id, selectedConversation.type);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderConversationItem = (conv) => {
    const isSelected = selectedConversation?.id === conv.id;
    const hasUnread = conv.unreadCount > 0;
    
    return (
      <div 
        key={conv.id}
        onClick={() => setSelectedConversation(conv)}
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
          backgroundColor: isSelected ? '#e8f4fd' : 'white',
          transition: 'background-color 0.15s ease',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = isSelected ? '#e8f4fd' : 'white'; }}
      >
        {/* Avatar - Blue like the widget */}
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#5e72e4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 600,
          fontSize: '16px',
          flexShrink: 0
        }}>
          {(conv.userName || 'U').charAt(0).toUpperCase()}
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: hasUnread ? 700 : 500, color: '#1a1a1a', fontSize: '14px' }}>
              {conv.userName || 'Unknown User'}
            </span>
            <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
              {formatTimeAgo(conv.lastMessageCreatedAt)}
            </span>
          </div>
          
          <div style={{ 
            fontSize: '13px', 
            color: hasUnread ? '#1a1a1a' : '#666',
            fontWeight: hasUnread ? 500 : 400,
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            marginBottom: '4px'
          }}>
            {conv.lastMessageContent || 'No messages yet'}
          </div>
          
          {/* Type badge */}
          <span style={{
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: conv.type === 'vendor' ? '#e8e4fd' : '#d4f5e4',
            color: conv.type === 'vendor' ? '#5e72e4' : '#2dce89',
            fontWeight: 500
          }}>
            {conv.typeLabel}
          </span>
        </div>
        
        {/* Unread badge */}
        {hasUnread && (
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#5e72e4',
            color: 'white',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
          </div>
        )}
      </div>
    );
  };

  const renderMessage = (message) => {
    const isOwnMessage = message.SenderID === currentUser?.id || 
                         (selectedConversation?.type === 'vendor' && message.SenderID === vendorProfileId);
    
    return (
      <div 
        key={message.MessageID || message.id} 
        style={{ 
          marginBottom: '12px',
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
        }}
      >
        <div style={{ 
          padding: '10px 14px', 
          borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          backgroundColor: isOwnMessage ? '#5e72e4' : '#f0f0f0',
          color: isOwnMessage ? 'white' : '#1a1a1a',
          maxWidth: '70%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
        }}>
          <div style={{ marginBottom: '4px', wordBreak: 'break-word' }}>{message.Content}</div>
          <div style={{ 
            fontSize: '11px', 
            opacity: 0.7,
            textAlign: isOwnMessage ? 'right' : 'left'
          }}>
            {new Date(message.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="unified-messages-section">
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ 
          display: 'flex', 
          height: '600px',
          border: '1px solid #e8e8e8',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'white'
        }}>
          {/* Conversations sidebar */}
          <div style={{ 
            width: '320px', 
            borderRight: '1px solid #e8e8e8',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fafafa'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid #e8e8e8',
              backgroundColor: 'white'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
                Messages
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#8c8c8c' }}>
                {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Role Tabs - Only show if user is a vendor (like widget) */}
            {currentUser?.isVendor && (
              <div style={{ 
                display: 'flex', 
                borderBottom: '1px solid #e0e0e0',
                padding: '0 16px',
                background: '#fafafa'
              }}>
                <button
                  onClick={() => setMessageRole('client')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: messageRole === 'client' ? 600 : 400,
                    color: messageRole === 'client' ? '#5e72e4' : '#666',
                    borderBottom: messageRole === 'client' ? '2px solid #5e72e4' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  As Client
                  {allConversations.client.length > 0 && (
                    <span style={{ 
                      marginLeft: '6px', 
                      background: messageRole === 'client' ? '#5e72e4' : '#e0e0e0',
                      color: messageRole === 'client' ? 'white' : '#666',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '11px'
                    }}>
                      {allConversations.client.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setMessageRole('vendor')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: messageRole === 'vendor' ? 600 : 400,
                    color: messageRole === 'vendor' ? '#5e72e4' : '#666',
                    borderBottom: messageRole === 'vendor' ? '2px solid #5e72e4' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  As Vendor
                  {allConversations.vendor.length > 0 && (
                    <span style={{ 
                      marginLeft: '6px', 
                      background: messageRole === 'vendor' ? '#5e72e4' : '#e0e0e0',
                      color: messageRole === 'vendor' ? 'white' : '#666',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '11px'
                    }}>
                      {allConversations.vendor.length}
                    </span>
                  )}
                </button>
              </div>
            )}
            
            {/* Search */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8', background: 'white' }}>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#5e72e4'}
                onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
              />
            </div>
            
            {/* Conversations list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                  <p style={{ marginTop: '12px', color: '#8c8c8c', fontSize: '14px' }}>Loading messages...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <i className="fas fa-comments" style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '12px' }}></i>
                  <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
                    {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                filteredConversations.map(renderConversationItem)
              )}
            </div>
          </div>
          
          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
            {/* Chat header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid #e8e8e8',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {selectedConversation ? (
                <>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#5e72e4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600
                  }}>
                    {(selectedConversation.userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1a1a1a' }}>
                      {selectedConversation.userName || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {selectedConversation.typeLabel}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ color: '#8c8c8c' }}>Select a conversation</div>
              )}
            </div>
            
            {/* Messages container */}
            <div style={{ 
              flex: 1, 
              padding: '16px 20px', 
              overflowY: 'auto',
              backgroundColor: '#fafafa'
            }}>
              {!selectedConversation ? (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#8c8c8c'
                }}>
                  <i className="fas fa-comments" style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }}></i>
                  <p style={{ fontSize: '16px' }}>Select a conversation to start messaging</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '24px' }}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <>
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            
            {/* Message input */}
            {selectedConversation && (
              <div style={{ 
                padding: '16px 20px', 
                borderTop: '1px solid #e8e8e8',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                    style={{ 
                      flex: 1, 
                      padding: '12px 16px', 
                      border: '1px solid #e8e8e8', 
                      borderRadius: '24px',
                      outline: 'none',
                      fontSize: '14px',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#5e72e4'}
                    onBlur={(e) => e.target.style.borderColor = '#e8e8e8'}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    style={{ 
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: newMessage.trim() ? '#5e72e4' : '#d9d9d9',
                      color: 'white',
                      cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnifiedMessagesSection;
