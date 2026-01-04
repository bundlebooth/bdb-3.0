import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';

function UnifiedMessagesSection({ onSectionChange }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [allConversations, setAllConversations] = useState({ client: [], vendor: [] });
  const [messageRole, setMessageRole] = useState('client'); // 'client' or 'vendor' - for desktop tabs
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [vendorProfileId, setVendorProfileId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatView, setShowChatView] = useState(false); // For mobile: show chat instead of list
  const messagesEndRef = useRef(null);
  const prevRoleRef = useRef(messageRole);
  
  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = () => {
    // Scroll within the messages container only, not the whole page
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
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

  // Load all conversations (both as client and vendor)
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
            type: 'client'
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
              type: 'vendor'
            }));
          }
        } catch (e) {
          console.error('Error loading vendor conversations:', e);
        }
      }
      
      // Store both lists separately for desktop tabs
      setAllConversations({ client: clientConvs, vendor: vendorConvs });
      
      // For mobile: combine all, for desktop: use role-based
      if (isMobile) {
        const allConvs = [...clientConvs, ...vendorConvs].sort((a, b) => {
          const dateA = new Date(a.lastMessageCreatedAt || 0);
          const dateB = new Date(b.lastMessageCreatedAt || 0);
          return dateB - dateA;
        });
        setConversations(allConvs);
      } else {
        const currentConvs = messageRole === 'vendor' ? vendorConvs : clientConvs;
        setConversations(currentConvs);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, vendorProfileId, isMobile, messageRole]);

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

  // Update displayed conversations when role changes on desktop
  useEffect(() => {
    if (!isMobile) {
      const currentConvs = messageRole === 'vendor' ? allConversations.vendor : allConversations.client;
      setConversations(currentConvs);
      
      // Clear selection if role changed
      if (prevRoleRef.current !== messageRole) {
        setSelectedConversation(null);
        setMessages([]);
        prevRoleRef.current = messageRole;
      }
    }
  }, [messageRole, allConversations, isMobile]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id, selectedConversation.type);
      // On mobile, show chat view when conversation is selected
      if (isMobile) {
        setShowChatView(true);
      }
    }
  }, [selectedConversation, loadMessages, isMobile]);
  
  // Handle selecting a conversation
  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
  };
  
  // Handle going back to conversation list on mobile
  const handleBackToList = () => {
    setShowChatView(false);
    setSelectedConversation(null);
    setMessages([]);
  };

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
        onClick={() => handleSelectConversation(conv)}
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
          backgroundColor: isSelected ? '#f5f5f5' : 'white',
          transition: 'background-color 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? '#f5f5f5' : 'white'; }}
      >
        {/* Avatar */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#5e72e4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 600,
          fontSize: '18px',
          flexShrink: 0
        }}>
          {(conv.userName || 'U').charAt(0).toUpperCase()}
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: hasUnread ? 600 : 500, color: '#222', fontSize: '15px' }}>
              {conv.userName || 'Unknown User'}
            </span>
            <span style={{ fontSize: '12px', color: '#999' }}>
              {formatTimeAgo(conv.lastMessageCreatedAt)}
            </span>
          </div>
          
          <div style={{ 
            fontSize: '14px', 
            color: hasUnread ? '#444' : '#888',
            fontWeight: hasUnread ? 500 : 400,
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap'
          }}>
            {conv.lastMessageContent || 'No messages yet'}
          </div>
        </div>
        
        {/* Unread badge */}
        {hasUnread && (
          <div style={{
            width: '22px',
            height: '22px',
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
            {(() => {
              if (!message.CreatedAt) return '';
              const date = new Date(message.CreatedAt);
              if (isNaN(date.getTime())) return '';
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            })() || ''}
          </div>
        </div>
      </div>
    );
  };

  // Render conversation list (sidebar on desktop, full screen on mobile)
  const renderConversationList = () => (
    <div style={{ 
      width: isMobile ? '100%' : '350px', 
      borderRight: isMobile ? 'none' : '1px solid #e5e5e5',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white',
      height: '100%'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid #e5e5e5'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: '#222' }}>
          Messages
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#666' }}>
          {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Role Tabs - Only show on desktop if user is a vendor */}
      {!isMobile && currentUser?.isVendor && (
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e5e5',
          padding: '0 16px',
          background: 'white'
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
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e5e5' }}>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            fontSize: '15px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>
      
      {/* Conversations list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>Loading...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <i className="fas fa-comments" style={{ fontSize: '48px', color: '#ddd', marginBottom: '16px', display: 'block' }}></i>
            <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          filteredConversations.map(renderConversationItem)
        )}
      </div>
    </div>
  );

  // Render chat area
  const renderChatArea = () => (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: 'white',
      height: '100%'
    }}>
      {/* Chat header */}
      <div style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Back button for mobile */}
        {isMobile && (
          <button
            onClick={handleBackToList}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className="fas fa-arrow-left" style={{ fontSize: '18px', color: '#222' }}></i>
          </button>
        )}
        
        {selectedConversation ? (
          <>
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
              fontSize: '16px'
            }}>
              {(selectedConversation.userName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#222', fontSize: '16px' }}>
                {selectedConversation.userName || 'Unknown'}
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: '#666', fontSize: '15px' }}>Select a conversation</div>
        )}
      </div>
      
      {/* Messages container */}
      <div style={{ 
        flex: 1, 
        padding: '20px 24px', 
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
            color: '#888'
          }}>
            <i className="fas fa-comments" style={{ fontSize: '64px', color: '#ddd', marginBottom: '16px' }}></i>
            <p style={{ fontSize: '16px', margin: 0 }}>Select a conversation to start messaging</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
            <p style={{ margin: 0 }}>No messages yet. Start the conversation!</p>
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
          padding: '16px 24px', 
          borderTop: '1px solid #e5e5e5',
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
                padding: '14px 18px', 
                border: '1px solid #e5e5e5', 
                borderRadius: '24px',
                outline: 'none',
                fontSize: '15px'
              }}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              style={{ 
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: newMessage.trim() ? '#5e72e4' : '#ddd',
                color: 'white',
                cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className="unified-messages-section" 
      style={{ 
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'white',
        height: '100%'
      }}
    >
      {/* Mobile: Show either list or chat */}
      {isMobile ? (
        showChatView ? renderChatArea() : renderConversationList()
      ) : (
        /* Desktop: Show both side by side */
        <>
          {renderConversationList()}
          {renderChatArea()}
        </>
      )}
    </div>
  );
}

export default UnifiedMessagesSection;
