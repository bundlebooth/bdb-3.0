/**
 * Support Section - Admin Dashboard
 * Support tickets and customer support management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { formatDate, formatRelativeTime } from '../../../utils/formatUtils';
import { useDebounce } from '../../../hooks/useApi';
import adminApi from '../../../services/adminApi';
import UniversalModal from '../../UniversalModal';
import { DetailRow, DetailSection } from '../../common/FormComponents';
import { GIPHY_API_KEY } from '../../../config';

function SupportSection() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [quickSearch, setQuickSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [supportReply, setSupportReply] = useState('');
  
  // Chat enhancements - emoji/GIF picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [gifsLoading, setGifsLoading] = useState(false);
  
  // Quick reply suggestions
  const quickReplies = ['Hi! 👋', 'Hello!', 'Thanks!', 'Great! 👍', 'Sounds good!', 'Perfect!'];
  
  // Common emojis for quick access
  const commonEmojis = ['😊', '👍', '❤️', '🎉', '✨', '🙏', '👋', '😄', '🔥', '💯', '✅', '⭐'];
  
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

  const debouncedSearch = useDebounce(search, 300);
  const debouncedQuickSearch = useDebounce(quickSearch, 300);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter })
      };
      const data = await adminApi.getSupportTickets(params);
      // Ensure tickets is always an array
      const ticketsArray = Array.isArray(data?.tickets) ? data.tickets : Array.isArray(data) ? data : [];
      setTickets(ticketsArray);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, priorityFilter]);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSupportConversations();
      // Ensure conversations is always an array
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
    if (activeTab === 'tickets') fetchTickets();
    else if (activeTab === 'conversations') fetchConversations();
  }, [activeTab, fetchTickets, fetchConversations]);

  useEffect(() => {
    if (activeTab === 'tickets') fetchTickets();
  }, [page, debouncedSearch, statusFilter, priorityFilter]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedQuickSearch || debouncedQuickSearch.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const data = await adminApi.searchUsers(debouncedQuickSearch);
        setSearchResults(data.results || data || []);
      } catch (err) {
        console.error('Error searching:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };
    searchUsers();
  }, [debouncedQuickSearch]);

  const handleViewTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.Status || ticket.status || '');
    setShowTicketModal(true);
    try {
      const data = await adminApi.getTicketMessages(ticket.TicketID || ticket.id);
      setTicketMessages(data.messages || data || []);
    } catch (err) {
      console.error('Error fetching ticket messages:', err);
      setTicketMessages([]);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      await adminApi.updateTicket(selectedTicket.TicketID || selectedTicket.id, {
        status: newStatus
      });
      fetchTickets();
    } catch (err) {
      console.error('Error updating ticket:', err);
      alert('Failed to update ticket: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyContent) return;
    setActionLoading(true);
    try {
      await adminApi.addTicketMessage(selectedTicket.TicketID || selectedTicket.id, {
        content: replyContent,
        isAdminReply: true
      });
      setReplyContent('');
      const data = await adminApi.getTicketMessages(selectedTicket.TicketID || selectedTicket.id);
      setTicketMessages(data.messages || data || []);
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send reply: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'high' || p === 'urgent') return <span className="admin-badge admin-badge-danger">{priority}</span>;
    if (p === 'medium') return <span className="admin-badge admin-badge-warning">{priority}</span>;
    return <span className="admin-badge admin-badge-neutral">{priority || 'Normal'}</span>;
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'open' || s === 'new') return <span className="admin-badge admin-badge-info">{status}</span>;
    if (s === 'in_progress' || s === 'pending') return <span className="admin-badge admin-badge-warning">{status}</span>;
    if (s === 'resolved' || s === 'closed') return <span className="admin-badge admin-badge-success">{status}</span>;
    return <span className="admin-badge admin-badge-neutral">{status}</span>;
  };

  const totalPages = Math.ceil(total / limit);

  const renderTickets = () => (
    <>
      <div className="admin-filter-bar">
        <div className="admin-search-input">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="admin-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          className="admin-filter-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button className="admin-btn admin-btn-secondary" onClick={fetchTickets}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Support Tickets ({total})</h3>
        </div>
        
        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fas fa-ticket-alt"></i>
            <h3>No Tickets Found</h3>
            <p>No support tickets match your criteria</p>
          </div>
        ) : (
          <>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject</th>
                    <th>User</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.TicketID || ticket.id}>
                      <td>
                        <span style={{ fontWeight: 500 }}>#{ticket.TicketID || ticket.id}</span>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ticket.Subject || ticket.subject}
                      </td>
                      <td>{ticket.UserName || ticket.userName || ticket.email}</td>
                      <td>{ticket.Category || ticket.category || '-'}</td>
                      <td>{getPriorityBadge(ticket.Priority || ticket.priority)}</td>
                      <td>{getStatusBadge(ticket.Status || ticket.status)}</td>
                      <td>{formatRelativeTime(ticket.CreatedAt || ticket.createdAt)}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          <i className="fas fa-eye"></i> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="admin-pagination">
                <div className="admin-pagination-info">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}
                </div>
                <div className="admin-pagination-buttons">
                  <button className="admin-pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button className="admin-pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  const renderQuickSearch = () => (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Quick Search</h3>
      </div>
      <div className="admin-card-body">
        <div className="admin-search-input" style={{ maxWidth: '100%', marginBottom: '1rem' }}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search users, vendors, bookings..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
          />
        </div>

        {searching ? (
          <div className="admin-loading" style={{ padding: '2rem' }}>
            <div className="admin-loading-spinner"></div>
            <p>Searching...</p>
          </div>
        ) : quickSearch.length < 2 ? (
          <div className="admin-empty-state" style={{ padding: '2rem' }}>
            <i className="fas fa-search"></i>
            <p>Enter at least 2 characters to search</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '2rem' }}>
            <i className="fas fa-search"></i>
            <h3>No Results</h3>
            <p>No matches found for "{quickSearch}"</p>
          </div>
        ) : (
          <div>
            {searchResults.map((result, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{result.name || result.Name || result.email}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {result.type || result.Type} • {result.email || result.Email}
                  </div>
                </div>
                <span className={`admin-badge ${
                  result.type === 'vendor' ? 'admin-badge-info' : 
                  result.type === 'booking' ? 'admin-badge-warning' : 
                  'admin-badge-neutral'
                }`}>
                  {result.type || result.Type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

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

  const renderConversations = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: '600px' }}>
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
            <div className="admin-empty-state" style={{ padding: '2rem' }}><i className="fas fa-comments"></i><p>No conversations</p></div>
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
            <div><i className="fas fa-comments" style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '1rem' }}></i><h3>Select a Conversation</h3><p>Choose a conversation from the list to view messages</p></div>
          </div>
        ) : (
          <>
            <div className="admin-card-header" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <h3 className="admin-card-title" style={{ marginBottom: '0.125rem' }}>{selectedConversation.UserName || 'User'}</h3>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{selectedConversation.UserEmail || selectedConversation.email || ''}</span>
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
            <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
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
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'relative' }}>
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
  );

  const [impersonateSearch, setImpersonateSearch] = useState('');
  const [impersonateResults, setImpersonateResults] = useState([]);
  const [impersonating, setImpersonating] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Load users when impersonate tab is selected
  useEffect(() => {
    if (activeTab === 'impersonate' && !usersLoaded) {
      loadAllUsers();
    }
  }, [activeTab, usersLoaded]);

  const loadAllUsers = async () => {
    setSearching(true);
    try {
      // Search with common letter to get users
      const data = await adminApi.searchUsers('');
      console.log('All users loaded:', data);
      const results = data.results || data || [];
      if (results.length === 0) {
        // Try with 'a' if empty search returns nothing
        const dataA = await adminApi.searchUsers('a');
        setImpersonateResults(dataA.results || dataA || []);
      } else {
        setImpersonateResults(results);
      }
      setUsersLoaded(true);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleImpersonateSearch = async () => {
    if (!impersonateSearch || impersonateSearch.length < 1) {
      loadAllUsers();
      return;
    }
    setSearching(true);
    try {
      const data = await adminApi.searchUsers(impersonateSearch);
      console.log('Search results:', data);
      setImpersonateResults(data.results || data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      alert('Failed to search users: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleImpersonate = async (userId) => {
    if (!window.confirm('Are you sure you want to impersonate this user? All actions will be logged.')) return;
    setImpersonating(true);
    try {
      const result = await adminApi.impersonateUser(userId);
      if (result.success && result.token) {
        // Store original token and user session
        localStorage.setItem('originalToken', localStorage.getItem('token'));
        localStorage.setItem('originalUserSession', localStorage.getItem('userSession'));
        
        // Set impersonation token and user session
        localStorage.setItem('token', result.token);
        localStorage.setItem('isImpersonating', 'true');
        
        // Update user session with impersonated user data
        const impersonatedUserSession = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          firstName: result.user.firstName || result.user.name?.split(' ')[0] || '',
          lastName: result.user.lastName || result.user.name?.split(' ').slice(1).join(' ') || '',
          isVendor: result.user.isVendor || false,
          isAdmin: false,
          vendorProfileId: result.user.vendorProfileId || null,
          isImpersonating: true
        };
        localStorage.setItem('userSession', JSON.stringify(impersonatedUserSession));
        
        alert(`Now impersonating ${result.user.email}. You will be redirected to the explore page.`);
        window.location.href = '/explore';
      }
    } catch (err) {
      alert('Failed to impersonate user: ' + err.message);
    } finally {
      setImpersonating(false);
    }
  };

  const renderImpersonate = () => (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title"><i className="fas fa-user-secret" style={{ marginRight: '0.5rem' }}></i>Impersonate User or Vendor</h3>
      </div>
      <div className="admin-card-body">
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e' }}>
            <i className="fas fa-exclamation-triangle"></i>
            <strong>Important:</strong> Impersonation allows you to see exactly what the user sees. Do not make changes to their account unless necessary. All actions are logged for security.
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Filter users by email or name..."
            value={impersonateSearch}
            onChange={(e) => setImpersonateSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleImpersonateSearch()}
            style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          <button className="admin-btn admin-btn-primary" onClick={handleImpersonateSearch} disabled={searching}>
            <i className="fas fa-search" style={{ marginRight: '0.5rem' }}></i>
            {searching ? 'Searching...' : 'Search'}
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={loadAllUsers} disabled={searching}>
            <i className="fas fa-sync-alt" style={{ marginRight: '0.5rem' }}></i> Refresh
          </button>
        </div>

        {searching ? (
          <div className="admin-loading" style={{ padding: '2rem' }}>
            <div className="admin-loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : impersonateResults.length > 0 ? (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {impersonateResults.map((user) => (
                  <tr key={user.id || user.UserID}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#5086E8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                          {(user.name || user.Name || 'U')[0].toUpperCase()}
                        </div>
                        <span>{user.name || user.Name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>{user.email || user.Email}</td>
                    <td>
                      {(user.accountType === 'Vendor' || user.IsVendor) ? (
                        <span className="admin-badge admin-badge-info">Vendor</span>
                      ) : (user.accountType === 'Admin' || user.IsAdmin) ? (
                        <span className="admin-badge admin-badge-warning">Admin</span>
                      ) : (
                        <span className="admin-badge admin-badge-secondary">User</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="admin-btn admin-btn-sm admin-btn-primary"
                        onClick={() => handleImpersonate(user.id || user.UserID)}
                        disabled={impersonating || user.accountType === 'Admin' || user.IsAdmin}
                        title={(user.accountType === 'Admin' || user.IsAdmin) ? 'Cannot impersonate admin users' : 'Impersonate this user'}
                      >
                        <i className="fas fa-sign-in-alt"></i> Impersonate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state" style={{ padding: '2rem' }}>
            <i className="fas fa-users"></i>
            <p>No users found. Click Refresh to load users.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="admin-section">
      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
          <i className="fas fa-ticket-alt" style={{ marginRight: '0.5rem' }}></i>Support Tickets
        </button>
        <button className={`admin-tab ${activeTab === 'conversations' ? 'active' : ''}`} onClick={() => setActiveTab('conversations')}>
          <i className="fas fa-comments" style={{ marginRight: '0.5rem' }}></i>Live Chat
        </button>
        <button className={`admin-tab ${activeTab === 'impersonate' ? 'active' : ''}`} onClick={() => setActiveTab('impersonate')}>
          <i className="fas fa-user-secret" style={{ marginRight: '0.5rem' }}></i>Impersonate User
        </button>
        <button className={`admin-tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
          <i className="fas fa-search" style={{ marginRight: '0.5rem' }}></i>Quick Search
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tickets' && renderTickets()}
      {activeTab === 'conversations' && renderConversations()}
      {activeTab === 'impersonate' && renderImpersonate()}
      {activeTab === 'search' && renderQuickSearch()}

      {/* Ticket Detail Modal */}
      <UniversalModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        title={`Ticket #${selectedTicket?.TicketID || selectedTicket?.id}`}
        size="large"
        showFooter={false}
      >
        {selectedTicket && (
          <div>
            <DetailSection title="Ticket Information">
              <DetailRow label="Subject" value={selectedTicket.Subject || selectedTicket.subject} />
              <DetailRow label="User" value={selectedTicket.UserName || selectedTicket.userName} />
              <DetailRow label="Email" value={selectedTicket.Email || selectedTicket.email} />
              <DetailRow label="Category" value={selectedTicket.Category || selectedTicket.category} />
              <DetailRow label="Priority" value={getPriorityBadge(selectedTicket.Priority || selectedTicket.priority)} />
              <DetailRow label="Created" value={formatDate(selectedTicket.CreatedAt || selectedTicket.createdAt)} />
            </DetailSection>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="admin-filter-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button 
                  className="admin-btn admin-btn-primary"
                  onClick={handleUpdateTicket}
                  disabled={actionLoading}
                >
                  Update
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Messages</h4>
              <div style={{ 
                maxHeight: '250px', 
                overflowY: 'auto', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                padding: '0.5rem'
              }}>
                {ticketMessages.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>No messages</p>
                ) : (
                  ticketMessages.map((msg, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        background: msg.IsAdminReply || msg.isAdminReply ? '#e8f0fc' : '#f9fafb',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#6b7280', 
                        marginBottom: '0.25rem',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontWeight: 500 }}>
                          {msg.IsAdminReply || msg.isAdminReply ? 'Admin' : (msg.SenderName || msg.senderName || 'User')}
                        </span>
                        <span>{formatRelativeTime(msg.CreatedAt || msg.createdAt)}</span>
                      </div>
                      <div>{msg.Content || msg.content || msg.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: '0.5rem' }}>Reply</h4>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  resize: 'vertical'
                }}
              />
              <button 
                className="admin-btn admin-btn-primary"
                onClick={handleSendReply}
                disabled={!replyContent || actionLoading}
              >
                {actionLoading ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        )}
      </UniversalModal>
    </div>
  );
}

export default SupportSection;
