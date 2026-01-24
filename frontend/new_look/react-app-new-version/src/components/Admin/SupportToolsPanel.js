import React, { useState, useEffect, useRef, useCallback } from 'react';
import { showBanner } from '../../utils/helpers';
import { apiGet, apiPost } from '../../utils/api';
import { API_BASE_URL, GIPHY_API_KEY } from '../../config';
import UniversalModal from '../UniversalModal';
import { LoadingState, EmptyState } from '../common/AdminComponents';

// Quick replies - SAME AS DASHBOARD
const quickReplies = ['Hi! 👋', 'Hello!', 'Thanks!', 'Great! 👍', 'Sounds good!', 'Perfect!'];

// Emoji categories - SAME AS DASHBOARD
const emojiCategories = {
  smileys: { icon: '😀', name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'] },
  gestures: { icon: '👋', name: 'Gestures', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'] },
  hearts: { icon: '❤️', name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌', '💋', '😻', '😽', '🫶'] },
  celebration: { icon: '🎉', name: 'Celebration', emojis: ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🥳', '🥂', '🍾', '✨', '🌟', '⭐', '💫', '🔥', '💥', '🎆', '🎇', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️', '🎯', '🎪', '🎭', '🎨'] },
  nature: { icon: '🌸', name: 'Nature', emojis: ['🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍', '🌎', '🌏', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☀️', '🌝', '🌞', '⭐', '🌟', '🌠', '☁️', '⛅', '🌈', '☔', '❄️', '🌊'] },
  food: { icon: '🍕', name: 'Food', emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥖', '🥨', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🫔', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉'] }
};

// GIPHY_API_KEY imported from config.js

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
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState('smileys');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [gifs, setGifs] = useState([]);
  const [gifsLoading, setGifsLoading] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Get filtered emojis - SAME AS DASHBOARD
  const getFilteredEmojis = () => {
    if (!emojiSearch) return emojiCategories[emojiCategory].emojis;
    const allEmojis = Object.values(emojiCategories).flatMap(cat => cat.emojis);
    return allEmojis;
  };
  
  // Fetch GIFs - SAME AS DASHBOARD
  const fetchGifs = async (query = '') => {
    setGifsLoading(true);
    try {
      const endpoint = query 
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=g`;
      const response = await fetch(endpoint);
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setGifs(data.data.map(gif => ({
          id: gif.id,
          url: gif.images.fixed_height.url,
          preview: gif.images.fixed_height_still?.url || gif.images.fixed_height.url,
          alt: gif.title || 'GIF'
        })));
      } else {
        setGifs([]);
      }
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      setGifs([]);
    }
    setGifsLoading(false);
  };
  
  // Load trending GIFs when picker opens - SAME AS DASHBOARD
  useEffect(() => {
    if (showGifPicker) {
      fetchGifs();
    }
  }, [showGifPicker]);
  
  // Handle sending GIF - SAME AS DASHBOARD
  const handleSendGif = async (gifUrl) => {
    if (!selectedSupportConv) return;
    setShowGifPicker(false);
    
    // Optimistic update
    const newMsg = {
      MessageID: Date.now(),
      Content: gifUrl,
      IsFromSupport: true,
      CreatedAt: new Date().toISOString()
    };
    setSupportMessages(prev => [...prev, newMsg]);
    setTimeout(() => scrollToBottom(), 100);
    
    try {
      await apiPost(`/admin/support/conversations/${selectedSupportConv.ConversationID}/reply`, { content: gifUrl });
    } catch (error) {
      console.error('Error sending GIF:', error);
    }
  };
  
  // Handle quick reply - SAME AS DASHBOARD
  const handleQuickReply = async (reply) => {
    if (!selectedSupportConv) return;
    
    // Optimistic update
    const newMsg = {
      MessageID: Date.now(),
      Content: reply,
      IsFromSupport: true,
      CreatedAt: new Date().toISOString()
    };
    setSupportMessages(prev => [...prev, newMsg]);
    setTimeout(() => scrollToBottom(), 100);
    
    try {
      await apiPost(`/admin/support/conversations/${selectedSupportConv.ConversationID}/reply`, { content: reply });
    } catch (error) {
      console.error('Error sending quick reply:', error);
    }
  };
  
  // Handle send message - SAME AS DASHBOARD (optimistic update, no refresh)
  const handleSendMessage = async () => {
    if (!supportReply.trim() || !selectedSupportConv) return;
    
    const content = supportReply.trim();
    setSupportReply(''); // Clear input immediately
    
    // Optimistic update - add message to UI immediately
    const newMsg = {
      MessageID: Date.now(),
      Content: content,
      IsFromSupport: true,
      CreatedAt: new Date().toISOString()
    };
    setSupportMessages(prev => [...prev, newMsg]);
    setTimeout(() => scrollToBottom(), 100);
    
    try {
      await apiPost(`/admin/support/conversations/${selectedSupportConv.ConversationID}/reply`, { content });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

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
    setHasNewMessages(false);
    setIsAtBottom(true);
  };

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Send typing status
  const sendTypingStatus = useCallback(async (isTyping) => {
    if (!selectedSupportConv) return;
    // Typing status sent silently
    try {
      const response = await fetch(`${API_BASE_URL}/messages/typing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: selectedSupportConv.ConversationID,
          userId: 0, // Admin/support user
          isTyping
        })
      });
      await response.json();
    } catch (error) {
      console.error('[ADMIN TYPING] Error:', error);
    }
  }, [selectedSupportConv]);

  // Check typing status
  const checkTypingStatus = useCallback(async () => {
    if (!selectedSupportConv) return;
    try {
      const response = await fetch(`${API_BASE_URL}/messages/typing/${selectedSupportConv.ConversationID}?userId=0`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOtherUserTyping(data.isTyping || false);
      }
    } catch (error) {
      // Silently fail
    }
  }, [selectedSupportConv]);

  // Handle typing
  const handleTyping = useCallback(() => {
    try {
      sendTypingStatus(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2000);
    } catch (e) {
      // Ignore
    }
  }, [sendTypingStatus]);

  // Poll for new messages and typing status - runs every 3 seconds
  useEffect(() => {
    if (!selectedSupportConv) return;
    
    // Immediate check on conversation select
    checkTypingStatus();
    
    const pollInterval = setInterval(async () => {
      // Check for new messages
      try {
        const response = await apiGet(`/admin/support/conversations/${selectedSupportConv.ConversationID}/messages`);
        if (response.ok) {
          const data = await response.json();
          const newMessages = data.messages || [];
          
          // Check scroll position
          const chatContainer = chatContainerRef.current;
          const atBottom = chatContainer 
            ? chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 50
            : true;
          
          setSupportMessages(prev => {
            // Compare by message count and last message ID
            const prevLastId = prev.length > 0 ? prev[prev.length - 1].MessageID : 0;
            const newLastId = newMessages.length > 0 ? newMessages[newMessages.length - 1].MessageID : 0;
            
            if (newMessages.length > prev.length || newLastId !== prevLastId) {
              // New messages arrived
              if (atBottom) {
                setTimeout(scrollToBottom, 100);
              } else {
                setHasNewMessages(true);
              }
            }
            return newMessages;
          });
        }
      } catch (error) {
        // Silently fail
      }
      
      // Check typing status
      checkTypingStatus();
    }, 3000);
    
    return () => clearInterval(pollInterval);
  }, [selectedSupportConv, scrollToBottom, checkTypingStatus]);

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

            {/* Chat Area - Using ChatView Component */}
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

                  {/* Messages container - EXACT SAME AS DASHBOARD */}
                  <div 
                    ref={chatContainerRef}
                    onScroll={(e) => {
                      const { scrollTop, scrollHeight, clientHeight } = e.target;
                      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
                      setIsAtBottom(atBottom);
                      if (atBottom) setHasNewMessages(false);
                    }}
                    style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', backgroundColor: '#fafafa', position: 'relative' }}
                  >
                    {messagesLoading ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
                    ) : supportMessages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                        <p style={{ margin: 0 }}>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <>
                        {supportMessages.map((msg, index, allMsgs) => {
                          const isSent = msg.IsFromSupport;
                          const isGif = msg.Content && (msg.Content.includes('giphy.com') || msg.Content.match(/\.(gif)$/i));
                          const currentDate = msg.CreatedAt ? new Date(msg.CreatedAt).toDateString() : '';
                          const prevMessage = index > 0 ? allMsgs[index - 1] : null;
                          const prevDate = prevMessage?.CreatedAt ? new Date(prevMessage.CreatedAt).toDateString() : '';
                          const showDayDivider = currentDate && currentDate !== prevDate;
                          
                          const formatDayDivider = (dateStr) => {
                            if (!dateStr) return '';
                            const date = new Date(dateStr);
                            if (isNaN(date.getTime())) return '';
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(yesterday.getDate() - 1);
                            if (date.toDateString() === today.toDateString()) return 'Today';
                            if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
                            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                          };
                          
                          return (
                            <React.Fragment key={msg.MessageID || index}>
                              {showDayDivider && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0', gap: '12px' }}>
                                  <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                                  <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, padding: '4px 12px', backgroundColor: '#f3f4f6', borderRadius: '12px' }}>
                                    {formatDayDivider(msg.CreatedAt)}
                                  </span>
                                  <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                                </div>
                              )}
                              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: isSent ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                  padding: isGif ? '4px' : '8px 12px',
                                  borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                  backgroundColor: isGif ? 'transparent' : (isSent ? '#5e72e4' : '#f0f0f0'),
                                  color: isSent ? 'white' : '#1a1a1a',
                                  maxWidth: '70%',
                                  boxShadow: isGif ? 'none' : '0 1px 2px rgba(0,0,0,0.08)'
                                }}>
                                  {isGif ? (
                                    <img src={msg.Content} alt="GIF" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '12px', display: 'block' }} />
                                  ) : (
                                    <div style={{ marginBottom: '3px', wordBreak: 'break-word', fontSize: '13px' }}>{msg.Content}</div>
                                  )}
                                  <div style={{ fontSize: '10px', opacity: 0.7, textAlign: isSent ? 'right' : 'left' }}>
                                    {msg.CreatedAt ? new Date(msg.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                        
                        {otherUserTyping && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0s' }}></div>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }}></div>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9ca3af', animation: 'typingBounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }}></div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                        
                        {hasNewMessages && !isAtBottom && (
                          <div onClick={() => { scrollToBottom(); setHasNewMessages(false); setIsAtBottom(true); }}
                            style={{ position: 'sticky', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: '#5e72e4', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 10, width: 'fit-content', margin: '0 auto' }}>
                            <i className="fas fa-arrow-down" style={{ fontSize: '11px' }}></i>
                            New messages
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <style>{`@keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }`}</style>
                  
                  {/* Message input - EXACT SAME AS DASHBOARD */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e5e5', backgroundColor: 'white', position: 'relative' }}>
                    {/* Quick replies */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {quickReplies.map((reply, idx) => (
                        <button key={idx} onClick={() => handleQuickReply(reply)}
                          style={{ padding: '5px 10px', borderRadius: '14px', border: '1px solid #e5e7eb', background: 'white', fontSize: '12px', color: '#374151', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                        >{reply}</button>
                      ))}
                    </div>
                    
                    {/* Emoji picker - EXACT SAME AS DASHBOARD */}
                    {showEmojiPicker && (
                      <div style={{ position: 'absolute', bottom: '100%', left: '16px', marginBottom: '8px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '10px', boxShadow: '0 -4px 12px rgba(0,0,0,0.15)', zIndex: 100, width: '300px', maxWidth: 'calc(100vw - 48px)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Emojis</span>
                          <button onClick={() => setShowEmojiPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px', padding: '4px' }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '2px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {Object.entries(emojiCategories).map(([key, cat]) => (
                            <button key={key} onClick={() => setEmojiCategory(key)}
                              style={{ padding: '4px 6px', border: 'none', background: emojiCategory === key ? '#e5e7eb' : 'transparent', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
                              title={cat.name}>{cat.icon}</button>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px', maxHeight: '180px', overflowY: 'auto' }}>
                          {getFilteredEmojis().map((emoji, idx) => (
                            <button key={idx} onClick={() => { setSupportReply(prev => prev + emoji); }}
                              style={{ padding: '4px', border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.15s', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >{emoji}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* GIF picker - EXACT SAME AS DASHBOARD */}
                    {showGifPicker && (
                      <div style={{ position: 'absolute', bottom: '100%', left: '16px', marginBottom: '8px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px', boxShadow: '0 -4px 12px rgba(0,0,0,0.15)', zIndex: 100, width: '340px', maxWidth: 'calc(100vw - 48px)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>GIFs</span>
                          <button onClick={() => setShowGifPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '14px', padding: '4px' }}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                          <input type="text" placeholder="Search GIFs..." value={gifSearchQuery} onChange={(e) => setGifSearchQuery(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') fetchGifs(gifSearchQuery); }}
                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                          <button onClick={() => fetchGifs(gifSearchQuery)} style={{ padding: '8px 12px', background: '#5e72e4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Search</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                          {gifsLoading ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                              <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Loading GIFs...
                            </div>
                          ) : gifs.length > 0 ? (
                            gifs.map((gif) => (
                              <button key={gif.id} onClick={() => handleSendGif(gif.url)}
                                style={{ padding: 0, border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', cursor: 'pointer', overflow: 'hidden', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={gif.url} alt={gif.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                              </button>
                            ))
                          ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#6b7280' }}>No GIFs match your search</div>
                          )}
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>Powered by GIPHY</div>
                      </div>
                    )}
                    
                    {/* Input row - EXACT SAME AS DASHBOARD */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e5e7eb', backgroundColor: showEmojiPicker ? '#f3f4f6' : 'white', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}
                        title="Emojis">😊</button>
                      <button onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e5e7eb', backgroundColor: showGifPicker ? '#f3f4f6' : 'white', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}
                        title="GIFs">GIF</button>
                      <input type="text" placeholder="Type your message..." value={supportReply}
                        onChange={(e) => { setSupportReply(e.target.value); handleTyping(); }}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                        style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e5e5', borderRadius: '20px', outline: 'none', fontSize: '14px', minWidth: 0 }} />
                      <button onClick={handleSendMessage} disabled={!supportReply.trim()}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: supportReply.trim() ? '#5e72e4' : '#ddd', color: 'white', cursor: supportReply.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="fas fa-paper-plane" style={{ fontSize: '14px' }}></i>
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
