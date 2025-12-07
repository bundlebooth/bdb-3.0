import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

function MessagingWidget() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mainView, setMainView] = useState('home'); // 'home', 'messages', 'help'
  const [view, setView] = useState('conversations'); // 'conversations' or 'chat'
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversations/user/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const conversations = data.conversations || [];
        setConversations(conversations);
        
        // Calculate unread count
        const unread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [currentUser]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId || !currentUser?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversation/${conversationId}?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
        
        // Reload conversations to update unread count
        loadConversations();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadConversations]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !currentConversation) return;
    
    const messageText = messageInput.trim();
    setMessageInput('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          senderId: currentUser.id,
          content: messageText
        })
      });
      
      if (response.ok) {
        // Reload messages
        loadMessages(currentConversation.id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [messageInput, currentConversation, currentUser, loadMessages]);

  // Open conversation
  const openConversation = useCallback((conversation) => {
    setCurrentConversation(conversation);
    setView('chat');
    loadMessages(conversation.id);
  }, [loadMessages]);

  // Back to conversations
  const backToConversations = useCallback(() => {
    setView('conversations');
    setCurrentConversation(null);
    setMessages([]);
    loadConversations();
  }, [loadConversations]);

  // Toggle widget
  const toggleWidget = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setMainView('home'); // Always start with home view
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  // Switch main view
  const switchMainView = useCallback((newView) => {
    setMainView(newView);
    if (newView === 'messages') {
      setView('conversations');
      loadConversations();
    }
  }, [loadConversations]);

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = conv.OtherPartyName?.toLowerCase() || '';
    const lastMessage = conv.lastMessageContent?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || lastMessage.includes(query);
  });

  // Poll for new messages when widget is open
  useEffect(() => {
    if (isOpen && currentUser?.id) {
      loadConversations();
      
      // Poll every 10 seconds
      pollingIntervalRef.current = setInterval(() => {
        loadConversations();
        if (currentConversation) {
          loadMessages(currentConversation.id);
        }
      }, 10000);
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isOpen, currentUser, currentConversation, loadConversations, loadMessages]);

  // Poll for unread count even when closed
  useEffect(() => {
    if (currentUser?.id && !isOpen) {
      loadConversations();
      
      const interval = setInterval(() => {
        loadConversations();
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [currentUser, isOpen, loadConversations]);

  // Handle Enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!currentUser) return null;

  return (
    <div className="messaging-widget" style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999
    }}>
      {/* Chat Button - Smaller with Custom Icon */}
      <div className="chat-button" onClick={toggleWidget} style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: '#5e72e4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(94, 114, 228, 0.3), 0 2px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(94, 114, 228, 0.4), 0 3px 8px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(94, 114, 228, 0.3), 0 2px 6px rgba(0,0,0,0.1)';
      }}>
        {/* Simple Chat Bubble Icon - Outlined Style */}
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#ff385c',
            color: 'white',
            borderRadius: '8px',
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: '700',
            border: '1.5px solid white',
            padding: '0 3px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      {/* Widget Container - Improved Positioning */}
      {isOpen && (
        <div className="widget-container" style={{ 
          display: 'flex',
          flexDirection: 'column',
          width: '380px',
          height: '600px',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          background: 'white',
          position: 'absolute',
          bottom: '80px',
          right: '0',
          border: '1px solid rgba(0,0,0,0.1)'
        }}>
          <div className="widget-header" style={{
            background: 'white',
            color: '#222',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {mainView === 'home' && (
                <div style={{ display: 'flex', gap: '8px' }}>
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
                  }}>PH</div>
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
                    fontWeight: 600,
                    marginLeft: '-12px'
                  }}>VV</div>
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
                    fontWeight: 600,
                    marginLeft: '-12px'
                  }}>CS</div>
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                  {mainView === 'home' ? '' : mainView === 'messages' ? 'Messages' : 'Help Center'}
                </h3>
                {mainView !== 'home' && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                    {mainView === 'messages' ? 'Chat with vendors' : 'Get support'}
                  </p>
                )}
              </div>
            </div>
            <button className="widget-close" onClick={toggleWidget} style={{
              background: '#f0f0f0',
              border: 'none',
              color: '#222',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}>&times;</button>
          </div>

          {/* Home/Help Center View */}
          {mainView === 'home' && (
            <div style={{ flex: 1, overflow: 'auto', background: 'white' }}>
              <div style={{ padding: '24px 20px' }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600, color: '#222' }}>
                  Hi there 👋
                </h2>
                <p style={{ margin: 0, fontSize: '18px', color: '#222', fontWeight: 500 }}>
                  How can we help?
                </p>
              </div>

              {/* Ask a Question Card */}
              <div style={{ padding: '0 20px 16px' }}>
                <div style={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => switchMainView('messages')}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#222' }}>
                      Ask a question
                    </div>
                    <div style={{ fontSize: '13px', color: '#717171' }}>
                      AI Agent and team can help
                    </div>
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Search for Help */}
              <div style={{ padding: '0 20px 16px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search for help"
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#5e72e4'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}>
                    <circle cx="11" cy="11" r="8" stroke="#10b981" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* Help Articles */}
              <div style={{ padding: '0 20px 80px' }}>
                {[
                  'What is the cancellation and refund policy for renters and hosts?',
                  'Vendor Location Agreement',
                  'A Host\'s Guide to PlanHive',
                  'How do I cancel a booking?'
                ].map((article, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px 0',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: '14px', color: '#222' }}>{article}</div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="#717171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages View */}
          {mainView === 'messages' && view === 'conversations' && (
            <div className="widget-view">
              <div className="conversations-header">
                <input
                  type="text"
                  className="conversation-search"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="conversations-list">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#666' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 1rem', opacity: 0.3 }}>
                      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#ddd"/>
                    </svg>
                    <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>No conversations yet</p>
                    <p style={{ fontSize: '14px', opacity: 0.7 }}>Start chatting with vendors</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="conversation-item"
                      onClick={() => openConversation(conv)}
                      style={{ 
                        cursor: 'pointer',
                        padding: '16px',
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      {conv.OtherPartyAvatar || conv.OtherPartyLogo ? (
                        <img
                          src={conv.OtherPartyAvatar || conv.OtherPartyLogo}
                          alt={conv.OtherPartyName}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#5e72e4',
                        display: conv.OtherPartyAvatar || conv.OtherPartyLogo ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {(conv.OtherPartyName || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px', color: '#222' }}>
                          {conv.OtherPartyName || 'Unknown'}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#717171',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conv.lastMessageContent || 'No messages yet'}
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span style={{
                          background: '#ff385c',
                          color: 'white',
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat View */}
          {mainView === 'messages' && view === 'chat' && currentConversation && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="chat-header" style={{
                padding: '16px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                background: 'white'
              }}>
                <button className="back-button" onClick={backToConversations} style={{
                  background: 'none',
                  border: 'none',
                  color: '#222',
                  cursor: 'pointer',
                  padding: '8px',
                  marginRight: '12px',
                  fontSize: '18px'
                }}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {currentConversation.OtherPartyAvatar || currentConversation.OtherPartyLogo ? (
                    <img
                      src={currentConversation.OtherPartyAvatar || currentConversation.OtherPartyLogo}
                      alt={currentConversation.OtherPartyName}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#5e72e4',
                    display: currentConversation.OtherPartyAvatar || currentConversation.OtherPartyLogo ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 600
                  }}>
                    {(currentConversation.OtherPartyName || 'U')[0].toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '16px', color: '#222' }}>
                    {currentConversation.OtherPartyName || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="chat-messages-container" style={{
                flex: 1,
                overflow: 'auto',
                padding: '20px',
                background: 'white'
              }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.SenderID === currentUser.id;
                    return (
                      <div
                        key={msg.MessageID}
                        style={{
                          display: 'flex',
                          justifyContent: isSent ? 'flex-end' : 'flex-start',
                          marginBottom: '12px'
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: '18px',
                          background: isSent ? '#5e72e4' : '#f0f0f0',
                          color: isSent ? 'white' : '#222',
                          wordWrap: 'break-word'
                        }}>
                          <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{msg.Content || msg.MessageText}</div>
                          <div style={{ 
                            fontSize: '11px', 
                            marginTop: '4px',
                            opacity: 0.7,
                            textAlign: 'right'
                          }}>
                            {new Date(msg.CreatedAt || msg.SentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-container" style={{
                padding: '16px',
                borderTop: '1px solid #e0e0e0',
                background: 'white',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  className="widget-chat-input"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '24px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button className="widget-send-button" onClick={sendMessage} style={{
                  background: '#5e72e4',
                  border: 'none',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '16px',
                  transition: 'background 0.2s'
                }}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          )}

          {/* Help View */}
          {mainView === 'help' && (
            <div style={{ flex: 1, overflow: 'auto', background: 'white', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Help Center</h3>
              <p style={{ color: '#717171', fontSize: '14px', lineHeight: '1.6' }}>
                Browse our help articles or contact support for assistance.
              </p>
            </div>
          )}

          {/* Bottom Navigation */}
          <div style={{
            display: 'flex',
            borderTop: '1px solid #e0e0e0',
            background: 'white',
            padding: '8px 0'
          }}>
            <button
              onClick={() => switchMainView('home')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: mainView === 'home' ? '#5e72e4' : '#717171',
                transition: 'color 0.2s'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '12px', fontWeight: mainView === 'home' ? 600 : 400 }}>Home</span>
            </button>
            <button
              onClick={() => switchMainView('messages')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: mainView === 'messages' ? '#5e72e4' : '#717171',
                transition: 'color 0.2s',
                position: 'relative'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '12px', fontWeight: mainView === 'messages' ? 600 : 400 }}>Messages</span>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '50%',
                  transform: 'translateX(12px)',
                  background: '#ff385c',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => switchMainView('help')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: mainView === 'help' ? '#5e72e4' : '#717171',
                transition: 'color 0.2s'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="17" r="1" fill="currentColor"/>
              </svg>
              <span style={{ fontSize: '12px', fontWeight: mainView === 'help' ? 600 : 400 }}>Help</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagingWidget;
