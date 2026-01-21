import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { useVendorOnlineStatus } from '../hooks/useOnlineStatus';
import EmojiPicker from 'emoji-picker-react';
import Header from './Header';

function MessagingWidget() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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
  const [selectedCategory, setSelectedCategory] = useState(null); // For category browsing
  const [helpBreadcrumb, setHelpBreadcrumb] = useState([]); // Navigation trail: ['home'] or ['home', 'category'] or ['home', 'category', 'article']
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(false); // For expanding widget when viewing article
  const [helpSearchQuery, setHelpSearchQuery] = useState(''); // Search within help

  // FAQ Categories matching help-centre page
  const faqCategories = [
    { name: 'Most Frequently Asked', slug: 'Getting Started', icon: 'fa-star' },
    { name: 'General', slug: 'general', icon: 'fa-file-alt' },
    { name: 'Help with Booking', slug: 'Booking', icon: 'fa-calendar-check' },
    { name: 'For Vendors', slug: 'Vendors', icon: 'fa-briefcase' },
    { name: 'For Clients', slug: 'Clients', icon: 'fa-users' },
    { name: 'Payments & Billing', slug: 'Payments', icon: 'fa-credit-card' },
    { name: 'Trust & Safety', slug: 'Trust & Safety', icon: 'fa-shield-alt' },
    { name: 'Account & Profile', slug: 'Account', icon: 'fa-user-circle' },
    { name: 'Reviews & Ratings', slug: 'Reviews', icon: 'fa-star' },
    { name: 'Cancellations & Refunds', slug: 'Cancellations', icon: 'fa-undo' },
    { name: 'Messages & Communication', slug: 'Messages', icon: 'fa-comments' },
    { name: 'Technical Support', slug: 'Technical', icon: 'fa-cog' }
  ];

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const cat = faq.Category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  // Get FAQs for selected category
  const categoryFaqs = selectedCategory 
    ? faqs.filter(faq => faq.Category === selectedCategory.slug || faq.Category === selectedCategory.name)
    : [];

  // Handle category click
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedFaq(null);
    setHelpBreadcrumb(['home', 'category']);
  };

  // Handle article click
  const handleArticleClick = (faq) => {
    setSelectedFaq(faq);
    setHelpBreadcrumb(['home', 'category', 'article']);
  };

  // Handle back navigation
  const handleHelpBack = () => {
    if (selectedFaq) {
      setSelectedFaq(null);
      setIsWidgetExpanded(false); // Collapse widget when leaving article
      setHelpBreadcrumb(['home', 'category']);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setHelpBreadcrumb(['home']);
    }
  };

  // Filter FAQs by search query
  const filteredFaqCategories = helpSearchQuery.length >= 2
    ? faqCategories.filter(cat => {
        const catFaqs = faqs.filter(faq => faq.Category === cat.slug || faq.Category === cat.name);
        return catFaqs.some(faq => 
          faq.Question?.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
          faq.Answer?.toLowerCase().includes(helpSearchQuery.toLowerCase())
        );
      })
    : faqCategories;

  // Get search results across all FAQs
  const helpSearchResults = helpSearchQuery.length >= 2
    ? faqs.filter(faq => 
        faq.Question?.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
        faq.Answer?.toLowerCase().includes(helpSearchQuery.toLowerCase())
      )
    : [];

  // Reset help navigation when switching views
  const resetHelpNavigation = () => {
    setSelectedCategory(null);
    setSelectedFaq(null);
    setHelpBreadcrumb([]);
  };
  const [otherPartyVendorId, setOtherPartyVendorId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Handle resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent background scrolling when widget is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, isMobile]);

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
    if (!isOpen) {
      setMainView('home'); // Always start with home view
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  // Switch main view - also collapse widget and reset navigation
  const switchMainView = useCallback((newView) => {
    setMainView(newView);
    setIsWidgetExpanded(false); // Collapse widget when switching tabs
    setSelectedCategory(null); // Reset category navigation
    setSelectedFaq(null); // Reset article selection
    setHelpSearchQuery(''); // Clear search
    if (newView === 'messages') {
      setView('conversations');
      loadConversations();
    }
  }, [loadConversations]);

  // Start or open support conversation
  const openSupportChat = useCallback(async () => {
    if (!currentUser?.id) {
      console.log('No current user, cannot open support chat');
      return;
    }
    
    try {
      // Create or get support conversation from API
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
        console.log('Support conversation response:', data);
        
        if (data.conversationId) {
          // Create conversation object for the chat view
          const supportConversation = {
            id: data.conversationId,
            ConversationID: data.conversationId,
            OtherPartyName: 'Planbeau Support',
            ConversationType: 'support'
          };
          
          // Set the conversation and switch to chat view
          setCurrentConversation(supportConversation);
          setMainView('messages'); // Must set mainView to 'messages' for chat to render
          setView('chat');
          loadMessages(data.conversationId);
          
          // Reload conversations in background
          loadConversations();
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to create support conversation:', errorData);
        alert('Unable to start support chat. Please try again.');
      }
    } catch (error) {
      console.error('Failed to start support chat:', error);
      alert('Unable to start support chat. Please check your connection.');
    }
  }, [currentUser, loadConversations, loadMessages]);

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

  // State for booking info to display at top of chat
  const [activeBookingInfo, setActiveBookingInfo] = useState(null);

  // Listen for openMessagingWidget events from other components
  useEffect(() => {
    const handleOpenWidget = async (event) => {
      const { conversationId, vendorProfileId, vendorName, showHome, bookingInfo } = event.detail || {};
      
      // Store booking info if provided
      if (bookingInfo) {
        setActiveBookingInfo(bookingInfo);
      }
      
      // Open the widget
      setIsOpen(true);
      
      // If showHome is true or no specific conversation requested, show home view
      if (showHome || (!conversationId && !vendorProfileId)) {
        setMainView('home');
        setActiveBookingInfo(null);
        return;
      }
      
      setMainView('messages');
      
      // If we have a conversationId, open that conversation
      if (conversationId) {
        await loadConversations();
        const conv = conversations.find(c => c.id === conversationId || c.ConversationID === conversationId);
        if (conv) {
          openConversation(conv);
        } else {
          // Try to open by ID directly
          openConversation({ id: conversationId, OtherPartyName: vendorName || 'Vendor' });
        }
      } else if (vendorProfileId) {
        // Load conversations and find one with this vendor
        await loadConversations();
        const existingConv = conversations.find(c => c.VendorProfileID === vendorProfileId);
        if (existingConv) {
          openConversation(existingConv);
        }
      }
    };
    
    const handleCloseWidget = () => {
      setIsOpen(false);
    };
    
    window.addEventListener('openMessagingWidget', handleOpenWidget);
    window.addEventListener('closeMessagingWidget', handleCloseWidget);
    return () => {
      window.removeEventListener('openMessagingWidget', handleOpenWidget);
      window.removeEventListener('closeMessagingWidget', handleCloseWidget);
    };
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
    <div className={`messaging-widget ${isOpen ? 'widget-open' : ''}`} style={{
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

      {/* Mobile: Full-screen page layout (not a popup - treated as a page like Forum) */}
      {isOpen && isMobile && (
        <div 
          className="messages-mobile-page"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            background: 'white',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Header 
            onSearch={() => {}} 
            onProfileClick={() => {}} 
            onWishlistClick={() => {}} 
            onChatClick={() => {}} 
            onNotificationsClick={() => {}} 
          />
          
          {/* Ticket Form Overlay - Shows when creating a support ticket */}
          {showTicketForm && (
            <div style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'white', 
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto'
            }}>
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '16px', 
                borderBottom: '1px solid #e5e7eb',
                background: 'white'
              }}>
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
              
              <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
                {ticketSuccess ? (
                  <div style={{
                    background: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '12px',
                    padding: '24px',
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
                          outline: 'none',
                          boxSizing: 'border-box'
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
                          background: 'white',
                          boxSizing: 'border-box'
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
                        rows={5}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    
                    <button
                      onClick={submitSupportTicket}
                      disabled={ticketSubmitting}
                      style={{
                        background: ticketSubmitting ? '#ccc' : '#5e72e4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '14px 24px',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: ticketSubmitting ? 'not-allowed' : 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      {ticketSubmitting ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Navigation Bar - Shows back button when in category/article view */}
          {(selectedCategory || selectedFaq) && mainView === 'home' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'white',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <button
                onClick={handleHelpBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Help</span>
              <div style={{ width: '36px' }}></div>
            </div>
          )}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Home/Help Center View - Like Image 2 */}
          {mainView === 'home' && !selectedCategory && !selectedFaq && (
            <div style={{ flex: 1, overflow: 'auto', background: 'white', padding: '20px' }}>
              {/* Avatar Stack */}
              <div style={{ display: 'flex', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#5e72e4', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 600, marginLeft: '0' }}>PB</div>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#10b981', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 600, marginLeft: '-12px' }}>S</div>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#f59e0b', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 600, marginLeft: '-12px' }}>T</div>
              </div>

              {/* Greeting */}
              <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 600, color: '#111' }}>
                Hi {currentUser?.firstName || 'there'} 👋
              </h2>
              <p style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#111', fontWeight: 600 }}>
                How can we help?
              </p>

              {/* Ask a Question Card */}
              <div 
                onClick={() => openSupportChat()}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '16px', color: '#111', marginBottom: '2px' }}>Ask a question</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Our team can help</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="6" cy="6" r="2" fill="#5e72e4"/>
                    <circle cx="12" cy="6" r="2" fill="#5e72e4"/>
                    <circle cx="18" cy="6" r="2" fill="#5e72e4"/>
                    <circle cx="6" cy="12" r="2" fill="#5e72e4"/>
                    <circle cx="12" cy="12" r="2" fill="#5e72e4"/>
                    <circle cx="18" cy="12" r="2" fill="#5e72e4"/>
                  </svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#5e72e4' }}>
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Create Support Ticket */}
              <div 
                onClick={() => setShowTicketForm(true)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '16px', color: '#111', marginBottom: '2px' }}>Create support ticket</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Submit a detailed request</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 18V12" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 15H15" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#5e72e4' }}>
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Search for Help */}
              <div style={{ 
                position: 'relative', 
                marginBottom: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'white'
              }}>
                <input
                  type="text"
                  placeholder="Search for help"
                  value={helpSearchQuery}
                  onChange={(e) => setHelpSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && helpSearchQuery.length >= 2) {
                      const match = faqs.find(faq => 
                        faq.Question?.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                        faq.Answer?.toLowerCase().includes(helpSearchQuery.toLowerCase())
                      );
                      if (match) {
                        const cat = faqCategories.find(c => c.slug === match.Category || c.name === match.Category);
                        if (cat) setSelectedCategory(cat);
                        setSelectedFaq(match);
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 44px 14px 16px',
                    border: 'none',
                    fontSize: '16px',
                    outline: 'none',
                    background: 'white'
                  }}
                />
                <svg 
                  width="18" height="18" viewBox="0 0 24 24" fill="none" 
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#5e72e4' }}
                >
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>

              {/* Search Results */}
              {helpSearchQuery.length >= 2 && (
                <div style={{ marginBottom: '16px' }}>
                  {faqs.filter(faq => 
                    faq.Question?.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                    faq.Answer?.toLowerCase().includes(helpSearchQuery.toLowerCase())
                  ).slice(0, 5).map(faq => (
                    <div 
                      key={faq.FAQID}
                      onClick={() => {
                        const cat = faqCategories.find(c => c.slug === faq.Category || c.name === faq.Category);
                        if (cat) setSelectedCategory(cat);
                        setSelectedFaq(faq);
                        setHelpSearchQuery('');
                      }}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '14px 0', 
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ color: '#111', fontSize: '15px' }}>{faq.Question}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '12px', color: '#5e72e4' }}>
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ))}
                </div>
              )}

              {/* Most Viewed Articles - sorted by ViewCount */}
              {helpSearchQuery.length < 2 && (
                <>
                  {[...faqs].sort((a, b) => (b.ViewCount || 0) - (a.ViewCount || 0)).slice(0, 4).map(faq => (
                    <div 
                      key={faq.FAQID}
                      onClick={() => {
                        const cat = faqCategories.find(c => c.slug === faq.Category || c.name === faq.Category);
                        if (cat) setSelectedCategory(cat);
                        setSelectedFaq(faq);
                      }}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '14px 0', 
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ color: '#111', fontSize: '15px', lineHeight: '1.4' }}>{faq.Question}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '12px', color: '#5e72e4' }}>
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Category/Article View for Mobile */}
          {mainView === 'home' && (selectedCategory || selectedFaq) && (
            <div style={{ flex: 1, overflow: 'auto', background: 'white', padding: '20px' }}>
              {/* Article Detail View */}
              {selectedFaq ? (
                <div style={{ paddingBottom: '80px' }}>
                  {/* Article Title */}
                  <h2 style={{ 
                    fontSize: '22px', 
                    fontWeight: 700, 
                    color: '#111', 
                    marginBottom: '16px',
                    lineHeight: '1.3'
                  }}>
                    {selectedFaq.Question}
                  </h2>
                  
                  {/* Author/Updated info */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ 
                      width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: '#5e72e4', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#fff', 
                        fontSize: '12px', 
                        fontWeight: '600' 
                      }}>PB</div>
                      <div>
                        <div style={{ color: '#111', fontWeight: '500', fontSize: '14px' }}>Written by Planbeau Team</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          Updated {selectedFaq.UpdatedAt ? new Date(selectedFaq.UpdatedAt).toLocaleDateString() : 'recently'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Article Content */}
                    <div 
                      className="widget-article-content"
                      style={{ 
                        fontSize: '15px', 
                        lineHeight: '1.75', 
                        color: '#374151'
                      }}
                      dangerouslySetInnerHTML={{ __html: selectedFaq.Answer }}
                    />
                  </div>
                ) : selectedCategory ? (
                  /* Category Articles List - Like Image 2 */
                  <div style={{ paddingBottom: '80px' }}>
                    {/* Category Header with avatars */}
                    <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111' }}>{selectedCategory.name}</h3>
                          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                            {categoryFaqs.length} articles
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                            By Planbeau Team
                          </p>
                        </div>
                        {/* Avatar stack */}
                        <div style={{ display: 'flex', marginLeft: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#5e72e4', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 600 }}>PB</div>
                        </div>
                      </div>
                    </div>

                    {/* Articles List - Simple rows */}
                    {categoryFaqs.length > 0 ? categoryFaqs.map((faq) => (
                      <div 
                        key={faq.FAQID}
                        onClick={() => handleArticleClick(faq)}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '14px 0', 
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ color: '#111', fontSize: '15px', lineHeight: '1.4' }}>{faq.Question}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '12px', color: '#5e72e4' }}>
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )) : (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                        No articles found in this category.
                      </div>
                    )}
                  </div>
                ) : null}
            </div>
          )}

          {/* Messages View - Support Only (Show intro only when not in chat) */}
          {mainView === 'messages' && view !== 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', padding: '20px' }}>
              {/* Support Chat Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: '#5e72e4', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 16px',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 600
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#111' }}>Support Chat</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Chat with our support team</p>
              </div>

              {/* Start Chat Button */}
              <div 
                onClick={() => openSupportChat()}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '16px 24px',
                  background: '#5e72e4',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  gap: '10px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>Start a Conversation</span>
              </div>

              {/* Info */}
              <div style={{ 
                background: '#f9fafb', 
                borderRadius: '12px', 
                padding: '16px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <circle cx="12" cy="12" r="10" stroke="#5e72e4" strokeWidth="2"/>
                    <path d="M12 16V12" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="8" r="1" fill="#5e72e4"/>
                  </svg>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111', marginBottom: '4px' }}>How it works</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                      Start a chat and our support team will respond as soon as possible. You'll receive notifications when we reply.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#10b981" strokeWidth="2"/>
                    <path d="M9 12L11 14L15 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111', marginBottom: '4px' }}>Response time</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                      We typically respond within a few hours during business hours.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hidden - Old conversations view for reference */}
          {false && mainView === 'messages-old' && view === 'conversations' && (
            <div className="widget-view">
              <div className="conversations-list">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                  </div>
                ) : (
                  <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#666' }}>
                    <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Support Only</p>
                  </div>
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
              
              {/* Booking Info Banner */}
              {activeBookingInfo && (
                <div style={{
                  padding: '10px 16px',
                  background: '#f0f4ff',
                  borderBottom: '1px solid #e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className="fas fa-calendar-check" style={{ color: '#5e72e4', fontSize: '14px' }}></i>
                  <div style={{ flex: 1, fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      {activeBookingInfo.eventName || 'Booking'}
                    </span>
                    {activeBookingInfo.eventDate && (
                      <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                        {new Date(activeBookingInfo.eventDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: activeBookingInfo.status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    color: activeBookingInfo.status === 'paid' ? '#10b981' : '#f59e0b',
                    border: `1px ${activeBookingInfo.status === 'paid' ? 'solid' : 'dashed'} ${activeBookingInfo.status === 'paid' ? '#10b981' : '#f59e0b'}`
                  }}>
                    {activeBookingInfo.status === 'paid' ? 'Paid' : activeBookingInfo.status === 'pending' ? 'Pending' : 'Confirmed'}
                  </span>
                </div>
              )}
              
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

          {/* Bottom Navigation - hide on mobile since we use the app's bottom nav */}
          {!isMobile && (
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
          )}
          </div>
        </div>
      )}

      {/* Desktop: Widget popup container */}
      {isOpen && !isMobile && (
        <div className="widget-container" style={{ 
          display: 'flex',
          flexDirection: 'column',
          width: isWidgetExpanded ? '700px' : '380px',
          height: isWidgetExpanded ? '85vh' : '600px',
          maxHeight: isWidgetExpanded ? '800px' : '600px',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          background: 'white',
          position: 'absolute',
          bottom: '80px',
          right: '0',
          border: '1px solid rgba(0,0,0,0.1)',
          transition: 'width 0.3s ease, height 0.3s ease, max-height 0.3s ease'
        }}>
          {/* Header like Image 1 - back button left, expand/collapse and X right */}
          <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'white',
            borderBottom: selectedFaq ? 'none' : '1px solid #e5e7eb',
            minHeight: '48px'
          }}>
            {/* Left side - Back button (only when navigating) */}
            <div style={{ width: '40px' }}>
              {(selectedCategory || selectedFaq || mainView === 'help' || mainView === 'messages') && (
                <button 
                  onClick={() => {
                    if (selectedFaq) {
                      handleHelpBack();
                    } else if (selectedCategory) {
                      handleHelpBack();
                    } else {
                      switchMainView('home');
                      setSelectedCategory(null);
                      setSelectedFaq(null);
                    }
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#111'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            
            {/* Right side - Expand/Collapse and Close buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Expand/Collapse button - always show when viewing article */}
              {selectedFaq && (
                <button 
                  onClick={() => setIsWidgetExpanded(!isWidgetExpanded)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#111'
                  }}
                  title={isWidgetExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 3H21V9M9 21H3V15M21 3L14 10M3 21L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              {/* Close button - styled X */}
              <button 
                onClick={toggleWidget}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#111'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </header>

          {/* Desktop content - same views as mobile */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Home/Help Center View - Like Image 2 */}
            {mainView === 'home' && !selectedCategory && !selectedFaq && (
              <div style={{ flex: 1, overflow: 'auto', background: 'white', padding: '20px' }}>
                {/* Avatar Stack */}
                <div style={{ display: 'flex', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#5e72e4', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 600, marginLeft: '0' }}>PB</div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 600, marginLeft: '-12px' }}>S</div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f59e0b', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 600, marginLeft: '-12px' }}>T</div>
                </div>

                {/* Greeting */}
                <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 600, color: '#111' }}>
                  Hi {currentUser?.firstName || 'there'} 👋
                </h2>
                <p style={{ margin: '0 0 24px 0', fontSize: '22px', color: '#111', fontWeight: 600 }}>
                  How can we help?
                </p>

                {/* Ask a Question Card */}
                <div 
                  onClick={() => openSupportChat()}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: '#111', marginBottom: '2px' }}>Ask a question</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Our team can help</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="6" cy="6" r="2" fill="#5e72e4"/>
                      <circle cx="12" cy="6" r="2" fill="#5e72e4"/>
                      <circle cx="18" cy="6" r="2" fill="#5e72e4"/>
                      <circle cx="6" cy="12" r="2" fill="#5e72e4"/>
                      <circle cx="12" cy="12" r="2" fill="#5e72e4"/>
                      <circle cx="18" cy="12" r="2" fill="#5e72e4"/>
                    </svg>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#5e72e4' }}>
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Create Support Ticket */}
                <div 
                  onClick={() => setShowTicketForm(true)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: '#111', marginBottom: '2px' }}>Create support ticket</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Submit a detailed request</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 18V12" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 15H15" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#5e72e4' }}>
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Search for Help */}
                <div style={{ 
                  position: 'relative', 
                  marginBottom: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'white'
                }}>
                  <input
                    type="text"
                    placeholder="Search for help"
                    value={helpSearchQuery}
                    onChange={(e) => setHelpSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && helpSearchQuery.length >= 2) {
                        // Find first matching FAQ and show it
                        const match = faqs.find(faq => 
                          faq.Question?.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                          faq.Answer?.toLowerCase().includes(helpSearchQuery.toLowerCase())
                        );
                        if (match) {
                          const cat = faqCategories.find(c => c.slug === match.Category || c.name === match.Category);
                          if (cat) setSelectedCategory(cat);
                          setSelectedFaq(match);
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 44px 14px 16px',
                      border: 'none',
                      fontSize: '15px',
                      outline: 'none',
                      background: 'white'
                    }}
                  />
                  <svg 
                    width="18" height="18" viewBox="0 0 24 24" fill="none" 
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#5e72e4' }}
                  >
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>

                {/* Search Results */}
                {helpSearchQuery.length >= 2 && (
                  <div style={{ marginBottom: '16px' }}>
                    {faqs.filter(faq => 
                      faq.Question?.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                      faq.Answer?.toLowerCase().includes(helpSearchQuery.toLowerCase())
                    ).slice(0, 5).map(faq => (
                      <div 
                        key={faq.FAQID}
                        onClick={() => {
                          const cat = faqCategories.find(c => c.slug === faq.Category || c.name === faq.Category);
                          if (cat) setSelectedCategory(cat);
                          setSelectedFaq(faq);
                          setHelpSearchQuery('');
                        }}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '12px 0', 
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ color: '#111', fontSize: '14px' }}>{faq.Question}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '12px', color: '#5e72e4' }}>
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ))}
                  </div>
                )}

                {/* Most Viewed Articles - sorted by ViewCount */}
                {helpSearchQuery.length < 2 && (
                  <>
                    {[...faqs].sort((a, b) => (b.ViewCount || 0) - (a.ViewCount || 0)).slice(0, 4).map(faq => (
                      <div 
                        key={faq.FAQID}
                        onClick={() => {
                          const cat = faqCategories.find(c => c.slug === faq.Category || c.name === faq.Category);
                          if (cat) setSelectedCategory(cat);
                          setSelectedFaq(faq);
                        }}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '14px 0', 
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ color: '#111', fontSize: '14px', lineHeight: '1.4' }}>{faq.Question}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '12px', color: '#5e72e4' }}>
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Category/Article View */}
            {mainView === 'home' && (selectedCategory || selectedFaq) && (
              <div style={{ flex: 1, overflow: 'auto', background: 'white', padding: '20px' }}>

                  {/* Article Detail View */}
                  {selectedFaq ? (
                    <div style={{ paddingBottom: '60px' }}>
                      {/* Article Title */}
                      <h2 style={{ 
                        fontSize: isWidgetExpanded ? '24px' : '18px', 
                        fontWeight: 700, 
                        color: '#111', 
                        marginBottom: '16px',
                        lineHeight: '1.3'
                      }}>
                        {selectedFaq.Question}
                      </h2>
                      
                      {/* Author/Updated info */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        marginBottom: '20px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          background: '#5e72e4', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: '#fff', 
                          fontSize: '12px', 
                          fontWeight: '600' 
                        }}>PB</div>
                        <div>
                          <div style={{ color: '#111', fontWeight: '500', fontSize: '14px' }}>Written by Planbeau Team</div>
                          <div style={{ fontSize: '13px', color: '#6b7280' }}>
                            Updated {selectedFaq.UpdatedAt ? new Date(selectedFaq.UpdatedAt).toLocaleDateString() : 'recently'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Article Content */}
                      <div 
                        className="widget-article-content"
                        style={{ 
                          fontSize: isWidgetExpanded ? '15px' : '14px', 
                          lineHeight: '1.75', 
                          color: '#374151'
                        }}
                        dangerouslySetInnerHTML={{ __html: selectedFaq.Answer }}
                      />
                    </div>
                  ) : selectedCategory ? (
                    /* Category Articles List - Like Image 2 */
                    <div style={{ paddingBottom: '60px' }}>
                      {/* Category Header with avatars */}
                      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111' }}>{selectedCategory.name}</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                              {categoryFaqs.length} articles
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                              By Planbeau Team
                            </p>
                          </div>
                          {/* Avatar stack */}
                          <div style={{ display: 'flex', marginLeft: '12px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#5e72e4', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 600 }}>PB</div>
                          </div>
                        </div>
                      </div>

                      {/* Articles List - Simple rows */}
                      {categoryFaqs.length > 0 ? categoryFaqs.map((faq) => (
                        <div 
                          key={faq.FAQID}
                          onClick={() => handleArticleClick(faq)}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '14px 0', 
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ color: '#111', fontSize: '14px', lineHeight: '1.4' }}>{faq.Question}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '12px', color: '#5e72e4' }}>
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )) : (
                        <div style={{ padding: '20px 0', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                          No articles found in this category.
                        </div>
                      )}
                    </div>
                  ) : null}
              </div>
            )}

            {/* Messages View - Support Only (Desktop) */}
            {mainView === 'messages' && view === 'conversations' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', padding: '20px' }}>
                {/* Support Chat Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    background: '#5e72e4', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 16px',
                    color: 'white'
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#111' }}>Support Chat</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Chat with our support team</p>
                </div>

                {/* Start Chat Button */}
                <div 
                  onClick={() => openSupportChat()}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '16px 24px',
                    background: '#5e72e4',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    gap: '10px'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>Start a Conversation</span>
                </div>

                {/* Info */}
                <div style={{ 
                  background: '#f9fafb', 
                  borderRadius: '12px', 
                  padding: '16px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <circle cx="12" cy="12" r="10" stroke="#5e72e4" strokeWidth="2"/>
                      <path d="M12 16V12" stroke="#5e72e4" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="1" fill="#5e72e4"/>
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#111', marginBottom: '4px' }}>How it works</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                        Start a chat and our support team will respond as soon as possible.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#10b981" strokeWidth="2"/>
                      <path d="M9 12L11 14L15 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#111', marginBottom: '4px' }}>Response time</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                        We typically respond within a few hours during business hours.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Chat View */}
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
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#5e72e4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 600
                    }}>
                      {(currentConversation.OtherPartyName || 'S')[0].toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: '16px', color: '#222' }}>
                        {currentConversation.OtherPartyName || 'Support'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Messages Area */}
                <div 
                  style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                      <div className="spinner"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', padding: '40px 20px' }}>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div 
                        key={msg.MessageID || index}
                        style={{
                          display: 'flex',
                          justifyContent: msg.SenderID === currentUser?.id ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: msg.SenderID === currentUser?.id ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: msg.SenderID === currentUser?.id ? '#5e72e4' : '#f0f0f0',
                          color: msg.SenderID === currentUser?.id ? 'white' : '#222'
                        }}>
                          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{msg.Content}</p>
                          <span style={{ 
                            fontSize: '11px', 
                            opacity: 0.7,
                            display: 'block',
                            marginTop: '4px'
                          }}>
                            {new Date(msg.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #e0e0e0',
                  display: 'flex',
                  gap: '12px',
                  background: 'white'
                }}>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '24px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    style={{
                      padding: '12px 20px',
                      background: messageInput.trim() ? '#5e72e4' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '24px',
                      cursor: messageInput.trim() ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Help View - show FAQs and support options */}
            {mainView === 'help' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                  {/* Search Bar */}
                  <div style={{ 
                    position: 'relative', 
                    marginBottom: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="text"
                      placeholder="Search for help"
                      value={helpSearchQuery}
                      onChange={(e) => setHelpSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 36px 10px 12px',
                        border: 'none',
                        fontSize: '13px',
                        outline: 'none',
                        background: 'white'
                      }}
                    />
                    <svg 
                      width="16" height="16" viewBox="0 0 24 24" fill="none" 
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5e72e4' }}
                    >
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Search Results - show when searching */}
                  {helpSearchQuery.length >= 2 ? (
                    <div>
                      <div style={{ marginBottom: '12px', color: '#6b7280', fontSize: '12px' }}>
                        {faqs.filter(faq => 
                          faq.Question?.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                          faq.Answer?.toLowerCase().includes(helpSearchQuery.toLowerCase())
                        ).length} results for "{helpSearchQuery}"
                      </div>
                      {faqs.filter(faq => 
                        faq.Question?.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                        faq.Answer?.toLowerCase().includes(helpSearchQuery.toLowerCase())
                      ).map(faq => (
                        <div 
                          key={faq.FAQID}
                          onClick={() => {
                            const cat = faqCategories.find(c => c.slug === faq.Category || c.name === faq.Category);
                            if (cat) setSelectedCategory(cat);
                            setSelectedFaq(faq);
                            setHelpSearchQuery('');
                          }}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '12px 0', 
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ color: '#111', fontSize: '13px' }}>{faq.Question}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '8px', color: '#5e72e4' }}>
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ))}
                      {faqs.filter(faq => 
                        faq.Question?.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                        faq.Answer?.toLowerCase().includes(helpSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <div style={{ padding: '20px 0', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                          No articles found matching "{helpSearchQuery}"
                        </div>
                      )}
                    </div>
                  ) : selectedFaq ? (
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '12px', lineHeight: '1.4' }}>
                        {selectedFaq.Question}
                      </h2>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#5e72e4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600' }}>PB</div>
                        <div>
                          <div style={{ color: '#111', fontWeight: '500', fontSize: '12px' }}>Written by Planbeau Team</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>Updated recently</div>
                        </div>
                      </div>
                      
                      <div 
                        className="widget-article-content"
                        style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151' }}
                        dangerouslySetInnerHTML={{ __html: selectedFaq.Answer }}
                      />
                    </div>
                  ) : selectedCategory ? (
                    <div>
                      {/* Category Header */}
                      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111' }}>{selectedCategory.name}</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>{categoryFaqs.length} articles</p>
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>By Planbeau Team</p>
                          </div>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#5e72e4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 600 }}>PB</div>
                        </div>
                      </div>

                      {/* Articles List */}
                      {categoryFaqs.length > 0 ? categoryFaqs.map((faq) => (
                        <div 
                          key={faq.FAQID}
                          onClick={() => handleArticleClick(faq)}
                          style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                            padding: '12px 0', 
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ color: '#111', fontSize: '13px' }}>{faq.Question}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: '8px', color: '#5e72e4' }}>
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )) : (
                        <div style={{ padding: '16px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>No articles found.</div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Collection count */}
                      <div style={{ marginBottom: '12px', color: '#6b7280', fontSize: '13px' }}>
                        {faqCategories.filter(cat => groupedFaqs[cat.slug]?.length > 0).length} collections
                      </div>
                      
                      {/* Category rows - simple list */}
                      {faqCategories.filter(cat => groupedFaqs[cat.slug]?.length > 0).map(category => (
                        <div 
                          key={category.slug}
                          onClick={() => handleCategoryClick(category)}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '14px 0', 
                            borderBottom: '1px solid #f0f0f0',
                            cursor: 'pointer'
                          }}
                        >
                          <div>
                            <div style={{ color: '#111', fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>{category.name}</div>
                            <div style={{ color: '#6b7280', fontSize: '12px' }}>{groupedFaqs[category.slug]?.length || 0} articles</div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: '#5e72e4' }}>
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Bottom Navigation */}
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

      {/* Styles for article content within widget */}
      <style>{`
        .widget-article-content h2 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #111;
          margin: 1.25rem 0 0.75rem;
        }
        .widget-article-content h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #111;
          margin: 1rem 0 0.5rem;
        }
        .widget-article-content h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #374151;
          margin: 0.75rem 0 0.5rem;
        }
        .widget-article-content p {
          margin-bottom: 0.875rem;
        }
        .widget-article-content ul,
        .widget-article-content ol {
          margin-bottom: 0.875rem;
          padding-left: 1.5rem;
        }
        .widget-article-content li {
          margin-bottom: 0.4rem;
          line-height: 1.6;
        }
        .widget-article-content strong {
          color: #111;
          font-weight: 600;
        }
        .widget-article-content a {
          color: #5e72e4;
          text-decoration: underline;
        }
        .widget-article-content a:hover {
          color: #4c60d3;
        }
        .widget-article-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 0.85rem;
        }
        .widget-article-content table th,
        .widget-article-content table td {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          text-align: left;
        }
        .widget-article-content table th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #111;
        }
        .widget-article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.75rem 0;
        }
        .widget-article-content blockquote {
          border-left: 3px solid #5e72e4;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
          font-style: italic;
        }
        .widget-article-content code {
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.85em;
          font-family: monospace;
        }
        .widget-article-content pre {
          background: #f3f4f6;
          padding: 0.75rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0.75rem 0;
        }
        .widget-article-content pre code {
          background: none;
          padding: 0;
        }
      `}</style>
    </div>
  );
}

export default MessagingWidget;
