/**
 * Chat Section - Admin Dashboard
 * Real-time communication oversight and live chat management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { formatRelativeTime } from '../../../utils/formatUtils';
import adminApi from '../../../services/adminApi';
import { GIPHY_API_KEY } from '../../../config';

function ChatSection() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [supportReply, setSupportReply] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Chat enhancements - emoji/GIF picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [gifsLoading, setGifsLoading] = useState(false);
  
  // Quick reply suggestions
  const quickReplies = ['Hi! 👋', 'Hello!', 'Thanks!', 'Great! 👍', 'Sounds good!', 'Perfect!', 'How can I help?', 'Let me check that for you.'];
  
  // Common emojis for quick access
  const commonEmojis = ['😊', '👍', '❤️', '🎉', '✨', '🙏', '👋', '😄', '🔥', '💯', '✅', '⭐', '💬', '📞', '📧', '🎯'];
  
  // Fetch GIFs from Giphy
  const fetchGifs = async (query) => {
    if (!GIPHY_API_KEY) return;
    setGifsLoading(true);
    try {
      const endpoint = query 
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setGifs(data.data || []);
    } catch (err) {
      console.error('Error fetching GIFs:', err);
    } finally {
      setGifsLoading(false);
    }
  };
  
  const handleGifSelect = (gif) => {
    const gifUrl = gif.images?.fixed_height?.url || gif.images?.original?.url;
    if (gifUrl) {
      setSupportReply(prev => prev + ` ${gifUrl} `);
    }
    setShowGifPicker(false);
  };
  
  const handleEmojiSelect = (emoji) => {
    setSupportReply(prev => prev + emoji);
  };
  
  const handleQuickReply = (text) => {
    setSupportReply(text);
  };

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSupportConversations();
      const convsArray = Array.isArray(data?.conversations) ? data.conversations : Array.isArray(data) ? data : [];
      setConversations(convsArray);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleViewConversation = async (conv) => {
    setSelectedConversation(conv);
    try {
      const data = await adminApi.getSupportConversationMessages(conv.ConversationID || conv.id);
      const msgs = Array.isArray(data?.messages) ? data.messages : Array.isArray(data) ? data : [];
      setConversationMessages(msgs);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setConversationMessages([]);
    }
  };

  const handleSendSupportReply = async () => {
    if (!selectedConversation || !supportReply.trim()) return;
    setActionLoading(true);
    try {
      await adminApi.sendSupportReply(selectedConversation.ConversationID || selectedConversation.id, supportReply);
      setSupportReply('');
      const data = await adminApi.getSupportConversationMessages(selectedConversation.ConversationID || selectedConversation.id);
      setConversationMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: '650px' }}>
        {/* Conversations List */}
        <div className="admin-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title">Conversations</h3>
            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={fetchConversations}>
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
          <div className="admin-card-body" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
            {loading ? (
              <div className="admin-loading"><div className="admin-loading-spinner"></div></div>
            ) : conversations.length === 0 ? (
              <div className="admin-empty-state" style={{ padding: '2rem' }}>
                <i className="fas fa-comments"></i>
                <p>No conversations</p>
              </div>
            ) : (
              conversations.map((conv, idx) => (
                <div
                  key={conv.ConversationID || conv.id || idx}
                  onClick={() => handleViewConversation(conv)}
                  style={{
                    padding: '0.875rem 1rem',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: selectedConversation?.id === conv.id || selectedConversation?.ConversationID === conv.ConversationID ? 'rgba(80, 134, 232, 0.08)' : 'transparent',
                    borderLeft: selectedConversation?.id === conv.id || selectedConversation?.ConversationID === conv.ConversationID ? '3px solid #5086E8' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{conv.UserName || conv.userName || 'User'}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formatRelativeTime(conv.LastMessageAt || conv.updatedAt)}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.LastMessage || conv.lastMessage || 'No messages'}
                  </div>
                  {(conv.UnreadCount || conv.unreadCount) > 0 && (
                    <span className="admin-badge admin-badge-danger" style={{ marginTop: '0.25rem' }}>{conv.UnreadCount || conv.unreadCount} new</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="admin-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {!selectedConversation ? (
            <div className="admin-empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div>
                <i className="fas fa-comments" style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }}></i>
                <h3>Select a Conversation</h3>
                <p>Choose a conversation from the list to view messages</p>
              </div>
            </div>
          ) : (
            <>
              <div className="admin-card-header" style={{ borderBottom: '1px solid #e5e7eb' }}>
                <div>
                  <h3 className="admin-card-title" style={{ marginBottom: '0.125rem' }}>{selectedConversation.UserName || 'User'}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{selectedConversation.UserEmail || selectedConversation.email || ''}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => handleViewConversation(selectedConversation)}>
                    <i className="fas fa-sync-alt"></i> Refresh
                  </button>
                </div>
              </div>
              <div className="admin-card-body" style={{ flex: 1, overflowY: 'auto', background: '#f9fafb', padding: '1rem' }}>
                {conversationMessages.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#9ca3af' }}>No messages yet</p>
                ) : (
                  conversationMessages.map((msg, idx) => {
                    const isFromSupport = msg.IsFromSupport || msg.isFromSupport || msg.IsAdmin || msg.isAdmin || msg.SenderType === 'admin' || msg.SenderType === 'support';
                    return (
                      <div key={idx} style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: isFromSupport ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%',
                          padding: '0.75rem 1rem',
                          borderRadius: isFromSupport ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          background: isFromSupport ? '#5086E8' : '#fff',
                          color: isFromSupport ? '#fff' : '#1f2937',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ fontSize: '0.9rem' }}>{msg.Content || msg.content || msg.message}</div>
                          <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', opacity: 0.7 }}>{formatRelativeTime(msg.CreatedAt || msg.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Quick Replies */}
              <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickReply(reply)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
                    onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
                  >
                    {reply}
                  </button>
                ))}
              </div>
              
              {/* Chat Input with Emoji/GIF */}
              <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', position: 'relative' }}>
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '100%', 
                    left: '1rem',
                    background: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px', 
                    padding: '0.75rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxWidth: '280px' }}>
                      {commonEmojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => { handleEmojiSelect(emoji); setShowEmojiPicker(false); }}
                          style={{ 
                            fontSize: '1.5rem', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '4px'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                          onMouseOut={(e) => e.target.style.background = 'none'}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* GIF Picker */}
                {showGifPicker && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '100%', 
                    left: '1rem',
                    right: '1rem',
                    background: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px', 
                    padding: '0.75rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    marginBottom: '0.5rem',
                    maxHeight: '300px',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="text"
                      placeholder="Search GIFs..."
                      value={gifSearchQuery}
                      onChange={(e) => { setGifSearchQuery(e.target.value); fetchGifs(e.target.value); }}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '0.5rem' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                      {gifsLoading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', color: '#6b7280' }}>Loading...</div>
                      ) : gifs.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', color: '#6b7280' }}>
                          {gifSearchQuery ? 'No GIFs found' : 'Search for GIFs'}
                        </div>
                      ) : (
                        gifs.map((gif) => (
                          <img
                            key={gif.id}
                            src={gif.images?.fixed_height_small?.url || gif.images?.preview_gif?.url}
                            alt={gif.title}
                            onClick={() => handleGifSelect(gif)}
                            style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                    style={{ 
                      padding: '0.5rem', 
                      background: showEmojiPicker ? '#5086E8' : '#f3f4f6', 
                      color: showEmojiPicker ? 'white' : '#6b7280',
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      fontSize: '1.1rem'
                    }}
                    title="Emoji"
                  >
                    😊
                  </button>
                  <button
                    onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); if (!showGifPicker && gifs.length === 0) fetchGifs(''); }}
                    style={{ 
                      padding: '0.5rem 0.75rem', 
                      background: showGifPicker ? '#5086E8' : '#f3f4f6', 
                      color: showGifPicker ? 'white' : '#6b7280',
                      border: 'none', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                    title="GIF"
                  >
                    GIF
                  </button>
                  <input
                    type="text"
                    value={supportReply}
                    onChange={(e) => setSupportReply(e.target.value)}
                    placeholder="Type your message..."
                    style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendSupportReply()}
                    onFocus={() => { setShowEmojiPicker(false); setShowGifPicker(false); }}
                  />
                  <button 
                    className="admin-btn admin-btn-primary" 
                    onClick={handleSendSupportReply} 
                    disabled={!supportReply.trim() || actionLoading}
                    style={{ padding: '0.75rem 1rem' }}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatSection;
