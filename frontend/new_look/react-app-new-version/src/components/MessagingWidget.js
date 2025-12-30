import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { useVendorOnlineStatus } from '../hooks/useOnlineStatus';
import EmojiPicker from 'emoji-picker-react';

function MessagingWidget() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [mainView, setMainView] = useState('home'); // 'home', 'messages', 'help'
  const [view, setView] = useState('conversations'); // 'conversations' or 'chat'
  const [messageRole, setMessageRole] = useState('client'); // 'client' or 'vendor'
  const [conversations, setConversations] = useState([]);
  const [allConversations, setAllConversations] = useState({ client: [], vendor: [] });
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', category: 'general', priority: 'medium', attachments: [] });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(null);
  const [userTickets, setUserTickets] = useState([]);
  const fileInputRef = useRef(null);
  const [faqs, setFaqs] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedFaq, setSelectedFaq] = useState(null); // For full FAQ detail view
  const [faqFeedbackSubmitted, setFaqFeedbackSubmitted] = useState({});
  const [otherPartyVendorId, setOtherPartyVendorId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Quick reply suggestions
  const quickReplies = [
    "Hi! 👋",
    "Thank you!",
    "Sounds good!",
    "I'm interested",
    "Can we discuss?",
    "Perfect! ✨"
  ];

  // Handle emoji selection
  const onEmojiClick = (emojiData) => {
    setMessageInput(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle quick reply click
  const handleQuickReply = (reply) => {
    setMessageInput(reply);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get online status for the other party (vendor) in the conversation
  const { statuses: vendorOnlineStatuses } = useVendorOnlineStatus(
    otherPartyVendorId ? [otherPartyVendorId] : [],
    { enabled: !!otherPartyVendorId, refreshInterval: 180000 } // 3 minutes
  );
  const otherPartyOnlineStatus = otherPartyVendorId ? vendorOnlineStatuses[otherPartyVendorId] : null;

  // Load FAQs from API
  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/public/faqs`);
        if (response.ok) {
          const data = await response.json();
          setFaqs(data.faqs || []);
        }
      } catch (error) {
        console.error('Failed to load FAQs:', error);
      }
    };
    loadFaqs();
  }, []);

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
        const allConvs = data.conversations || [];
        
        // Split conversations by role
        // Client conversations: where user is the client (initiated the conversation)
        // Vendor conversations: where user is the vendor (receiving inquiries)
        const clientConvs = allConvs.filter(c => c.OtherPartyType === 'vendor' || c.isClientRole);
        const vendorConvs = allConvs.filter(c => c.OtherPartyType === 'user' || c.isVendorRole);
        
        setAllConversations({ client: clientConvs, vendor: vendorConvs });
        
        // Set current view's conversations based on role
        const currentConvs = messageRole === 'vendor' ? vendorConvs : clientConvs;
        setConversations(currentConvs);
        
        // Calculate total unread count
        const unread = allConvs.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, [currentUser, messageRole]);

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
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

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
    // Set vendor profile ID for online status tracking
    if (conversation.VendorProfileID) {
      setOtherPartyVendorId(conversation.VendorProfileID);
    }
  }, [loadMessages]);

  // Back to conversations
  const backToConversations = useCallback(() => {
    setView('conversations');
    setCurrentConversation(null);
    setMessages([]);
    setOtherPartyVendorId(null);
    loadConversations();
  }, [loadConversations]);

  // Toggle widget
  const toggleWidget = useCallback(() => {
    setIsOpen(prev => !prev);
    // Reset mobile fullscreen when closing
    if (isOpen) {
      setIsMobileFullscreen(false);
    }
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

  // Start or open support conversation
  const openSupportChat = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      // Check if there's an existing support conversation
      const existingSupport = conversations.find(conv => 
        conv.ConversationType === 'support' || 
        conv.OtherPartyName?.toLowerCase().includes('support')
      );
      
      if (existingSupport) {
        // Open existing support conversation
        setMainView('messages');
        openConversation(existingSupport);
        return;
      }
      
      // Create new support conversation
      const response = await fetch(`${API_BASE_URL}/messages/conversations/support`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          subject: 'Support Request'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Reload conversations and open the new one
        await loadConversations();
        setMainView('messages');
        if (data.conversationId) {
          openConversation({ id: data.conversationId, OtherPartyName: 'Support Team' });
        } else {
          setView('conversations');
        }
      } else {
        // Fallback: just switch to messages view
        setMainView('messages');
        setView('conversations');
      }
    } catch (error) {
      console.error('Failed to start support chat:', error);
      // Fallback: just switch to messages view
      setMainView('messages');
      setView('conversations');
    }
  }, [currentUser, conversations, loadConversations, openConversation]);

  // Submit FAQ feedback
  const submitFaqFeedback = useCallback(async (faqId, rating) => {
    try {
      await fetch(`${API_BASE_URL}/public/faqs/${faqId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          rating: rating, // 'helpful', 'neutral', 'not_helpful'
          faqId: faqId
        })
      });
      setFaqFeedbackSubmitted(prev => ({ ...prev, [faqId]: rating }));
    } catch (error) {
      console.error('Failed to submit FAQ feedback:', error);
    }
  }, [currentUser]);

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

  // Update displayed conversations when role changes
  useEffect(() => {
    const currentConvs = messageRole === 'vendor' ? allConversations.vendor : allConversations.client;
    setConversations(currentConvs);
  }, [messageRole, allConversations]);

  // Listen for openMessagingWidget events from other components
  useEffect(() => {
    const handleOpenWidget = async (event) => {
      const { conversationId, vendorProfileId, vendorName, mobileFullscreen } = event.detail || {};
      
      // Enable mobile fullscreen if requested
      if (mobileFullscreen) {
        setIsMobileFullscreen(true);
      }
      
      // Open the widget and set to messages view
      setIsOpen(true);
      setMainView('messages');
      setView('conversations'); // Show conversations list
      
      // Always load conversations when opening
      await loadConversations();
      
      // If we have a conversationId, open that conversation
      if (conversationId) {
        const conv = conversations.find(c => c.id === conversationId || c.ConversationID === conversationId);
        if (conv) {
          openConversation(conv);
        } else {
          // Try to open by ID directly
          openConversation({ id: conversationId, OtherPartyName: vendorName || 'Vendor' });
        }
      } else if (vendorProfileId) {
        // Find conversation with this vendor
        const existingConv = conversations.find(c => c.VendorProfileID === vendorProfileId);
        if (existingConv) {
          openConversation(existingConv);
        }
      }
    };
    
    window.addEventListener('openMessagingWidget', handleOpenWidget);
    return () => window.removeEventListener('openMessagingWidget', handleOpenWidget);
  }, [conversations, loadConversations, openConversation]);

  // Handle Enter key to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Submit support ticket
  const submitSupportTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    setTicketSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/support/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          subject: ticketForm.subject,
          description: ticketForm.description,
          category: ticketForm.category,
          priority: ticketForm.priority,
          source: 'chat'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTicketSuccess(data.ticketNumber);
        setTicketForm({ subject: '', description: '', category: 'general', priority: 'medium' });
        setTimeout(() => {
          setShowTicketForm(false);
          setTicketSuccess(null);
        }, 3000);
      } else {
        alert('Failed to submit ticket. Please try again.');
      }
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      alert('Failed to submit ticket. Please try again.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  // Show widget for all users - non-signed-in users can still access Help/FAQs
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
        {/* Chat Icon using Font Awesome */}
        <i className="fas fa-comment" style={{ 
          fontSize: '24px', 
          color: 'white'
        }}></i>
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
        <div className={`widget-container ${isMobileFullscreen ? 'mobile-fullscreen' : ''}`} style={{ 
          display: 'flex',
          flexDirection: 'column',
          width: isMobileFullscreen ? '100vw' : '380px',
          height: isMobileFullscreen ? '100vh' : '600px',
          borderRadius: isMobileFullscreen ? '0' : '16px',
          boxShadow: isMobileFullscreen ? 'none' : '0 12px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          background: 'white',
          position: isMobileFullscreen ? 'fixed' : 'absolute',
          top: isMobileFullscreen ? '0' : 'auto',
          left: isMobileFullscreen ? '0' : 'auto',
          bottom: isMobileFullscreen ? '0' : '80px',
          right: isMobileFullscreen ? '0' : '0',
          border: isMobileFullscreen ? 'none' : '1px solid rgba(0,0,0,0.1)',
          zIndex: isMobileFullscreen ? 1000001 : 'auto'
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

              {/* Connect with Support Team */}
              <div style={{ padding: '0 20px 16px' }}>
                <div style={{
                  background: '#5e72e4',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(94, 114, 228, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(94, 114, 228, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(94, 114, 228, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => openSupportChat()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', color: 'white' }}>
                        Connect with Support Team
                      </div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                        Get help from our team
                      </div>
                    </div>
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* View My Tickets */}
              <div style={{ padding: '0 20px 16px' }}>
                <div style={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9f9f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
                onClick={() => switchMainView('messages')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="9" y="3" width="6" height="4" rx="1" stroke="#5e72e4" strokeWidth="2"/>
                      <path d="M9 12H15" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M9 16H13" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontWeight: 500, fontSize: '14px', color: '#222' }}>View My Messages</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="#717171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* FAQ Section */}
              <div style={{ padding: '0 20px 80px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#222' }}>Frequently Asked Questions</h4>
                {faqs.length > 0 ? faqs.map((faq) => (
                  <div key={faq.FAQID} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <div 
                      onClick={() => setExpandedFaq(expandedFaq === faq.FAQID ? null : faq.FAQID)}
                      style={{
                        padding: '14px 0',
                        fontSize: '14px',
                        color: '#222',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{faq.Question}</span>
                      <svg 
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        style={{ transform: expandedFaq === faq.FAQID ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}
                      >
                        <path d="M6 9L12 15L18 9" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {expandedFaq === faq.FAQID && (
                      <div style={{ padding: '0 0 14px 0', fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                        {faq.Answer}
                      </div>
                    )}
                  </div>
                )) : (
                  <p style={{ color: '#999', fontSize: '13px' }}>Loading FAQs...</p>
                )}
              </div>
            </div>
          )}

          {/* Messages View */}
          {mainView === 'messages' && view === 'conversations' && (
            <div className="widget-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Show login prompt if not logged in */}
              {!currentUser ? (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#666', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 1rem', opacity: 0.3 }}>
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#ddd"/>
                  </svg>
                  <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Sign in to view messages</p>
                  <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '16px' }}>Log in to chat with vendors</p>
                  <button
                    onClick={() => {
                      toggleWidget();
                      // Trigger login modal
                      window.dispatchEvent(new CustomEvent('openProfileModal'));
                    }}
                    style={{
                      padding: '12px 24px',
                      background: '#5e72e4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Sign In
                  </button>
                </div>
              ) : (
              <>
              {/* Role Tabs - Only show if user is a vendor */}
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
              </>
              )}
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
                  <div style={{ position: 'relative' }}>
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
                    {/* Online status dot on avatar */}
                    {otherPartyOnlineStatus && (
                      <span style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: otherPartyOnlineStatus.isOnline ? '#22c55e' : '#9ca3af',
                        border: '2px solid white'
                      }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontSize: '16px', color: '#222' }}>
                      {currentConversation.OtherPartyName || 'Unknown'}
                    </span>
                    {/* Online status text */}
                    {otherPartyOnlineStatus && (
                      <span style={{ 
                        fontSize: '12px', 
                        color: otherPartyOnlineStatus.isOnline ? '#22c55e' : '#666'
                      }}>
                        {otherPartyOnlineStatus.isOnline ? 'Online' : otherPartyOnlineStatus.lastActiveText || 'Offline'}
                      </span>
                    )}
                  </div>
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
                  messages.map((msg, index) => {
                    const isSent = msg.SenderID === currentUser.id;
                    const isRead = msg.IsRead === true || msg.IsRead === 1;
                    // Only show read receipt on the last sent message
                    const isLastSentMessage = isSent && !messages.slice(index + 1).some(m => m.SenderID === currentUser.id);
                    return (
                      <div
                        key={msg.MessageID}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isSent ? 'flex-end' : 'flex-start',
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
                            {(() => {
                              const dateStr = msg.CreatedAt || msg.SentAt;
                              if (!dateStr) return '';
                              const date = new Date(dateStr);
                              if (isNaN(date.getTime())) return '';
                              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            })()}
                          </div>
                        </div>
                        {/* Read receipt - shown outside message bubble for last sent message */}
                        {isLastSentMessage && isRead && msg.ReadAt && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#666',
                            marginTop: '4px',
                            paddingRight: '4px'
                          }}>
                            Seen on: {(() => {
                              const date = new Date(msg.ReadAt);
                              if (isNaN(date.getTime())) return '';
                              return date.toLocaleString([], { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit', 
                                minute: '2-digit' 
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              {/* Quick Reply Buttons */}
              {messages.length > 0 && !messageInput && (
                <div style={{
                  padding: '8px 16px',
                  borderTop: '1px solid #e0e0e0',
                  background: '#f8f9fa',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickReply(reply)}
                      style={{
                        padding: '6px 12px',
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '16px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#555',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#5e72e4';
                        e.target.style.color = 'white';
                        e.target.style.borderColor = '#5e72e4';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#555';
                        e.target.style.borderColor = '#e0e0e0';
                      }}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
              <div className="chat-input-container" style={{
                padding: '16px',
                borderTop: '1px solid #e0e0e0',
                background: 'white',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                position: 'relative'
              }}>
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div 
                    ref={emojiPickerRef}
                    style={{
                      position: 'absolute',
                      bottom: '70px',
                      left: '16px',
                      zIndex: 1000
                    }}
                  >
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick}
                      width={300}
                      height={350}
                      searchDisabled={false}
                      skinTonesDisabled
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: showEmojiPicker ? '#5e72e4' : '#666',
                    padding: '8px'
                  }}
                >
                  <i className="far fa-smile"></i>
                </button>
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
              {/* FAQ Detail View */}
              {selectedFaq ? (
                <div>
                  {/* Back button */}
                  <button 
                    onClick={() => setSelectedFaq(null)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      padding: '8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#666',
                      marginBottom: '16px'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: '14px' }}>Back</span>
                  </button>
                  
                  {/* FAQ Title */}
                  <h2 style={{ 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: '#222', 
                    marginBottom: '16px',
                    lineHeight: '1.4'
                  }}>
                    {selectedFaq.Question}
                  </h2>
                  
                  {/* Author/Updated info */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '20px',
                    color: '#666',
                    fontSize: '13px'
                  }}>
                    <span>Updated {selectedFaq.UpdatedAt ? new Date(selectedFaq.UpdatedAt).toLocaleDateString() : 'recently'}</span>
                  </div>
                  
                  {/* FAQ Answer */}
                  <div style={{ 
                    fontSize: '15px', 
                    lineHeight: '1.7', 
                    color: '#333',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedFaq.Answer}
                  </div>
                  
                  {/* Feedback Section */}
                  <div style={{ 
                    marginTop: '32px', 
                    paddingTop: '24px', 
                    borderTop: '1px solid #e0e0e0',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                      Did this answer your question?
                    </p>
                    {faqFeedbackSubmitted[selectedFaq.FAQID] ? (
                      <p style={{ color: '#28a745', fontSize: '14px' }}>Thank you for your feedback!</p>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        <button 
                          onClick={() => submitFaqFeedback(selectedFaq.FAQID, 'not_helpful')}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontSize: '28px',
                            padding: '8px',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          title="Not helpful"
                        >
                          😞
                        </button>
                        <button 
                          onClick={() => submitFaqFeedback(selectedFaq.FAQID, 'neutral')}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontSize: '28px',
                            padding: '8px',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          title="Somewhat helpful"
                        >
                          😐
                        </button>
                        <button 
                          onClick={() => submitFaqFeedback(selectedFaq.FAQID, 'helpful')}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontSize: '28px',
                            padding: '8px',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          title="Very helpful"
                        >
                          🙂
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : !showTicketForm ? (
                <>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Help Center</h3>
                  <p style={{ color: '#717171', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
                    Browse our help articles or contact support for assistance.
                  </p>
                  
                  {/* Connect with Support Team Button */}
                  <div 
                    onClick={() => openSupportChat()}
                    style={{
                      background: '#5e72e4',
                      color: 'white',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '20px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#4c60d3'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#5e72e4'}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>Connect with Support Team</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>Get help from our team</div>
                    </div>
                  </div>
                  
                  {/* FAQ Section */}
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#222' }}>Frequently Asked Questions</h4>
                    {faqs.length > 0 ? faqs.map((faq) => (
                      <div 
                        key={faq.FAQID} 
                        onClick={() => setSelectedFaq(faq)}
                        style={{ 
                          borderBottom: '1px solid #f0f0f0',
                          padding: '12px 0',
                          fontSize: '14px',
                          color: '#222',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>{faq.Question}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18L15 12L9 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )) : (
                      <p style={{ color: '#999', fontSize: '13px' }}>Loading FAQs...</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Ticket Form */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <button 
                      onClick={() => { setShowTicketForm(false); setTicketSuccess(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginRight: '8px' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M12 19L5 12L12 5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Create Support Ticket</h3>
                  </div>
                  
                  {ticketSuccess ? (
                    <div style={{
                      background: '#d4edda',
                      border: '1px solid #c3e6cb',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 12px' }}>
                        <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2"/>
                        <path d="M9 12L11 14L15 10" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <h4 style={{ margin: '0 0 8px 0', color: '#155724' }}>Ticket Submitted!</h4>
                      <p style={{ margin: 0, color: '#155724', fontSize: '14px' }}>
                        Your ticket number is: <strong>{ticketSuccess}</strong>
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#222' }}>
                          Subject *
                        </label>
                        <input
                          type="text"
                          value={ticketForm.subject}
                          onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                          placeholder="Brief description of your issue"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#222' }}>
                          Category
                        </label>
                        <select
                          value={ticketForm.category}
                          onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            background: 'white'
                          }}
                        >
                          <option value="general">General Inquiry</option>
                          <option value="booking">Booking Issue</option>
                          <option value="payment">Payment Problem</option>
                          <option value="vendor">Vendor Related</option>
                          <option value="technical">Technical Issue</option>
                          <option value="account">Account Help</option>
                        </select>
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#222' }}>
                          Description *
                        </label>
                        <textarea
                          value={ticketForm.description}
                          onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                          placeholder="Please describe your issue in detail..."
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      {/* Attachments */}
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#222' }}>
                          Attachments (optional)
                        </label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          multiple
                          accept="image/*,.pdf,.txt,.log"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setTicketForm({ ...ticketForm, attachments: [...ticketForm.attachments, ...files] });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px dashed #e0e0e0',
                            borderRadius: '8px',
                            background: '#f9f9f9',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            color: '#666',
                            fontSize: '14px'
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59718 21.9983 8.005 21.9983C6.41282 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42975 14.0991 2.00129 15.1608 2.00129C16.2226 2.00129 17.241 2.42975 17.9917 3.18C18.7419 3.93063 19.1704 4.94905 19.1704 6.01083C19.1704 7.07261 18.7419 8.09103 17.9917 8.84167L9.41 17.42C9.03472 17.7953 8.52551 18.0048 7.995 18.0048C7.46449 18.0048 6.95528 17.7953 6.58 17.42C6.20472 17.0447 5.99529 16.5355 5.99529 16.005C5.99529 15.4745 6.20472 14.9653 6.58 14.59L15.07 6.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Add Screenshots or Files
                        </button>
                        {ticketForm.attachments.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {ticketForm.attachments.map((file, idx) => (
                              <div key={idx} style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', 
                                background: '#e7f1ff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' 
                              }}>
                                <span>{file.name}</span>
                                <button 
                                  onClick={() => setTicketForm({ 
                                    ...ticketForm, 
                                    attachments: ticketForm.attachments.filter((_, i) => i !== idx) 
                                  })}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f5365c', padding: '2px' }}
                                >×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Helpful Tips */}
                      <div style={{ 
                        background: '#fff8e6', 
                        border: '1px solid #ffeeba', 
                        borderRadius: '8px', 
                        padding: '12px', 
                        fontSize: '13px',
                        color: '#856404'
                      }}>
                        <strong style={{ display: 'block', marginBottom: '6px' }}>💡 Tips for faster resolution:</strong>
                        <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: '1.6' }}>
                          <li>Include a screenshot of the issue</li>
                          <li>If you see an error, copy it from the browser console (F12 → Console tab)</li>
                          <li>Mention the page/feature where the issue occurred</li>
                        </ul>
                      </div>
                      
                      <button
                        onClick={submitSupportTicket}
                        disabled={ticketSubmitting}
                        style={{
                          background: ticketSubmitting ? '#ccc' : '#5e72e4',
                          color: 'white',
                          border: 'none',
                          padding: '14px',
                          borderRadius: '8px',
                          fontSize: '15px',
                          fontWeight: 600,
                          cursor: ticketSubmitting ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        {ticketSubmitting ? 'Submitting...' : 'Submit Ticket'}
                      </button>
                    </div>
                  )}
                </>
              )}
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
