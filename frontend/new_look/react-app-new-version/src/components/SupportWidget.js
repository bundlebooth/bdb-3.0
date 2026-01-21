import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import './SupportWidget.css';

function SupportWidget() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'messages', 'help'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Help Center State
  const [helpView, setHelpView] = useState('collections'); // 'collections', 'articles', 'article'
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [faqs, setFaqs] = useState([]);
  
  // Messages/Tickets State
  const [messagesView, setMessagesView] = useState('list'); // 'list', 'new', 'detail'
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', category: 'general' });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(null);
  
  // Article expanded state (for collapsible view)
  const [expandedArticle, setExpandedArticle] = useState(null);
  
  const widgetRef = useRef(null);

  // Sample collections data (you can replace with API call)
  useEffect(() => {
    setCollections([
      { id: 1, name: 'Most Frequently Asked', articleCount: 15, icon: '⭐' },
      { id: 2, name: 'General', articleCount: 29, icon: '📋' },
      { id: 3, name: 'Help with Hosting', articleCount: 62, icon: '🏠' },
      { id: 4, name: 'For Renters', articleCount: 47, icon: '👤' },
      { id: 5, name: 'Trust & Safety', articleCount: 4, icon: '🛡️' },
    ]);
  }, []);

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

  // Load user tickets
  const loadTickets = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/support/tickets/user/${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && currentUser?.id) {
      loadTickets();
    }
  }, [isOpen, currentUser, loadTickets]);

  // Listen for external events to open/close widget (for MobileBottomNav compatibility)
  useEffect(() => {
    const handleOpenWidget = (event) => {
      const { showHome } = event.detail || {};
      setIsOpen(true);
      if (showHome) {
        setActiveTab('home');
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
  }, []);

  // Toggle widget
  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setActiveTab('home');
      setHelpView('collections');
      setMessagesView('list');
      setSelectedCollection(null);
      setSelectedArticle(null);
    }
  };

  // Close widget
  const closeWidget = () => {
    setIsOpen(false);
  };

  // Switch tab
  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'help') {
      setHelpView('collections');
      setSelectedCollection(null);
      setSelectedArticle(null);
    }
    if (tab === 'messages') {
      setMessagesView('list');
      loadTickets();
    }
  };

  // Open collection
  const openCollection = (collection) => {
    setSelectedCollection(collection);
    setHelpView('articles');
    // Load articles for this collection (using FAQs as articles for now)
    const collectionArticles = faqs.map(faq => ({
      id: faq.FAQID,
      title: faq.Question,
      content: faq.Answer,
      author: 'Support Team',
      updatedAt: faq.UpdatedAt
    }));
    setArticles(collectionArticles);
  };

  // Open article detail
  const openArticle = (article) => {
    setSelectedArticle(article);
    setHelpView('article');
  };

  // Go back in help view
  const goBackHelp = () => {
    if (helpView === 'article') {
      setHelpView('articles');
      setSelectedArticle(null);
    } else if (helpView === 'articles') {
      setHelpView('collections');
      setSelectedCollection(null);
    }
  };

  // Submit support ticket
  const submitTicket = async () => {
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
          priority: 'medium',
          source: 'widget'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTicketSuccess(data.ticketNumber);
        setTicketForm({ subject: '', description: '', category: 'general' });
        setTimeout(() => {
          setMessagesView('list');
          setTicketSuccess(null);
          loadTickets();
        }, 2000);
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

  // Filter FAQs by search
  const filteredFaqs = faqs.filter(faq => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return faq.Question?.toLowerCase().includes(query) || faq.Answer?.toLowerCase().includes(query);
  });

  // Get user's first name
  const firstName = currentUser?.name?.split(' ')[0] || 'there';

  return (
    <div className="support-widget-wrapper">
      {/* Floating Action Button */}
      <button 
        className={`support-widget-fab ${isOpen ? 'open' : ''}`}
        onClick={toggleWidget}
        aria-label="Toggle support widget"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Widget Panel */}
      {isOpen && (
        <div className="support-widget-panel" ref={widgetRef}>
          {/* Header */}
          {activeTab === 'help' && helpView === 'article' ? (
            <div className="support-widget-header article-header">
              <button className="back-btn" onClick={goBackHelp}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="header-actions">
                <button className="expand-btn" title="Expand">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 3H21V9M9 21H3V15M21 3L14 10M3 21L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="close-btn" onClick={closeWidget}>×</button>
              </div>
            </div>
          ) : activeTab === 'help' && helpView === 'articles' ? (
            <div className="support-widget-header">
              <button className="back-btn" onClick={goBackHelp}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="header-title">Help</span>
              <button className="close-btn" onClick={closeWidget}>×</button>
            </div>
          ) : activeTab === 'help' ? (
            <div className="support-widget-header">
              <span className="header-title">Help</span>
              <button className="close-btn" onClick={closeWidget}>×</button>
            </div>
          ) : activeTab === 'messages' && messagesView === 'new' ? (
            <div className="support-widget-header">
              <button className="back-btn" onClick={() => setMessagesView('list')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="header-title">New Message</span>
              <button className="close-btn" onClick={closeWidget}>×</button>
            </div>
          ) : (
            <div className="support-widget-header home-header">
              <div className="header-brand">Planbeau</div>
              <button className="close-btn" onClick={closeWidget}>×</button>
            </div>
          )}

          {/* Content */}
          <div className="support-widget-content">
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <div className="home-view">
                <div className="home-greeting">
                  <h2>Hi {firstName} 👋</h2>
                  <p>How can we help?</p>
                </div>

                {/* Ask a Question Card */}
                <div className="action-card primary" onClick={() => { setActiveTab('messages'); setMessagesView('new'); }}>
                  <div className="action-card-content">
                    <span className="action-title">Ask a question</span>
                    <span className="action-subtitle">AI Agent and team can help</span>
                  </div>
                  <div className="action-card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="19" cy="5" r="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="5" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="19" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 9V5M12 15V19M9 12H5M15 12H19" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <svg className="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Search */}
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search for help"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>

                {/* FAQ List */}
                <div className="faq-list">
                  {filteredFaqs.slice(0, 4).map((faq) => (
                    <div 
                      key={faq.FAQID} 
                      className="faq-item"
                      onClick={() => {
                        setSelectedArticle({
                          id: faq.FAQID,
                          title: faq.Question,
                          content: faq.Answer,
                          author: 'Support Team',
                          updatedAt: faq.UpdatedAt
                        });
                        setActiveTab('help');
                        setHelpView('article');
                      }}
                    >
                      <span className="faq-question">{faq.Question}</span>
                      <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES TAB */}
            {activeTab === 'messages' && messagesView === 'list' && (
              <div className="messages-view">
                <div className="messages-header-section">
                  <h3>Messages</h3>
                  <button className="new-message-btn" onClick={() => setMessagesView('new')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    New
                  </button>
                </div>
                
                {tickets.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>No messages yet</p>
                    <span>Start a conversation with our support team</span>
                  </div>
                ) : (
                  <div className="tickets-list">
                    {tickets.map((ticket) => (
                      <div key={ticket.TicketID} className="ticket-item" onClick={() => { setSelectedTicket(ticket); setMessagesView('detail'); }}>
                        <div className="ticket-info">
                          <span className="ticket-subject">{ticket.Subject}</span>
                          <span className="ticket-date">{new Date(ticket.CreatedAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`ticket-status ${ticket.Status?.toLowerCase()}`}>{ticket.Status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && messagesView === 'new' && (
              <div className="new-message-view">
                {ticketSuccess ? (
                  <div className="success-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2"/>
                      <path d="M9 12L11 14L15 10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h4>Message Sent!</h4>
                    <p>Ticket #{ticketSuccess}</p>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Subject</label>
                      <input
                        type="text"
                        placeholder="What do you need help with?"
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={ticketForm.category}
                        onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      >
                        <option value="general">General Inquiry</option>
                        <option value="booking">Booking Issue</option>
                        <option value="payment">Payment Problem</option>
                        <option value="vendor">Vendor Related</option>
                        <option value="technical">Technical Issue</option>
                        <option value="account">Account Help</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Message</label>
                      <textarea
                        placeholder="Describe your issue in detail..."
                        rows={5}
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                      />
                    </div>
                    
                    <button 
                      className="submit-btn"
                      onClick={submitTicket}
                      disabled={ticketSubmitting}
                    >
                      {ticketSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </>
                )}
              </div>
            )}

            {activeTab === 'messages' && messagesView === 'detail' && selectedTicket && (
              <div className="ticket-detail-view">
                <div className="ticket-detail-header">
                  <h4>{selectedTicket.Subject}</h4>
                  <span className={`ticket-status ${selectedTicket.Status?.toLowerCase()}`}>{selectedTicket.Status}</span>
                </div>
                <div className="ticket-detail-meta">
                  <span>Created: {new Date(selectedTicket.CreatedAt).toLocaleDateString()}</span>
                  <span>Category: {selectedTicket.Category}</span>
                </div>
                <div className="ticket-detail-content">
                  <p>{selectedTicket.Description}</p>
                </div>
                {selectedTicket.Response && (
                  <div className="ticket-response">
                    <h5>Response from Support</h5>
                    <p>{selectedTicket.Response}</p>
                  </div>
                )}
              </div>
            )}

            {/* HELP TAB */}
            {activeTab === 'help' && helpView === 'collections' && (
              <div className="help-view">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search for help"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>

                <div className="collections-count">{collections.length} collections</div>

                <div className="collections-list">
                  {collections.map((collection) => (
                    <div 
                      key={collection.id} 
                      className="collection-item"
                      onClick={() => openCollection(collection)}
                    >
                      <div className="collection-info">
                        <span className="collection-name">{collection.name}</span>
                        <span className="collection-count">{collection.articleCount} articles</span>
                      </div>
                      <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'help' && helpView === 'articles' && selectedCollection && (
              <div className="articles-view">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search for help"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>

                <div className="collection-header">
                  <h3>{selectedCollection.name}</h3>
                  <span className="article-count">{articles.length} articles</span>
                </div>

                <div className="articles-list">
                  {articles.map((article) => (
                    <div key={article.id} className="article-item-wrapper">
                      <div 
                        className="article-item"
                        onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                      >
                        <span className="article-title">{article.title}</span>
                        <svg 
                          className={`chevron ${expandedArticle === article.id ? 'expanded' : ''}`} 
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                        >
                          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {expandedArticle === article.id && (
                        <div className="article-preview">
                          <p>{article.content}</p>
                          <button className="read-more-btn" onClick={() => openArticle(article)}>
                            Read full article
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'help' && helpView === 'article' && selectedArticle && (
              <div className="article-detail-view">
                <h2>{selectedArticle.title}</h2>
                <div className="article-meta">
                  <span>Written by {selectedArticle.author}</span>
                  <span>Updated {selectedArticle.updatedAt ? new Date(selectedArticle.updatedAt).toLocaleDateString() : 'recently'}</span>
                </div>
                <div className="article-content">
                  <p>{selectedArticle.content}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="support-widget-nav">
            <button 
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => switchTab('home')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Home</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => switchTab('messages')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Messages</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'help' ? 'active' : ''}`}
              onClick={() => switchTab('help')}
            >
              <div className="help-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="17" r="1" fill="currentColor"/>
                </svg>
              </div>
              <span>Help</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportWidget;
