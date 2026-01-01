import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileModal from '../components/ProfileModal';
import DashboardModal from '../components/DashboardModal';
import MessagingWidget from '../components/MessagingWidget';
import MobileBottomNav from '../components/MobileBottomNav';
import EmojiPicker from 'emoji-picker-react';

function ForumPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', categoryId: '' });
  const [creating, setCreating] = useState(false);
  
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const emojiPickerRef = useRef(null);


  // Handle opening map - navigate to explore page with map open
  const handleOpenMap = () => {
    navigate('/?map=true');
  };

  // Handle emoji selection for post content
  const onEmojiClick = (emojiData) => {
    setNewPost(prev => ({ ...prev, content: prev.content + emojiData.emoji }));
    setShowEmojiPicker(false);
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
  const [dashboardSection, setDashboardSection] = useState('dashboard');

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/forum/categories`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
          // Set selected category from URL
          if (slug) {
            const cat = data.categories.find(c => c.Slug === slug);
            setSelectedCategory(cat || null);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, [slug]);

  // Load posts
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        sort: sortBy
      });
      if (selectedCategory) params.append('category', selectedCategory.Slug);
      if (searchQuery) params.append('search', searchQuery);
      if (currentUser?.id) params.append('userId', currentUser.id);
      
      const response = await fetch(`${API_BASE_URL}/forum/posts?${params}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.posts);
        setTotalCount(data.totalCount);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, selectedCategory, searchQuery, currentUser?.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setPage(1);
    // Close mobile sidebar when category is selected
    setMobileSidebarOpen(false);
    if (category) {
      navigate(`/forum/${category.Slug}`);
    } else {
      navigate('/forum');
    }
  };

  // Handle vote
  const handleVote = async (postId, voteType) => {
    if (!currentUser) {
      setProfileModalOpen(true);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/forum/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          postId,
          voteType
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(p => 
          p.PostID === postId 
            ? { ...p, UpvoteCount: data.UpvoteCount, DownvoteCount: data.DownvoteCount, Score: data.Score, UserVote: voteType === 0 ? null : voteType }
            : p
        ));
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Create post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setProfileModalOpen(true);
      return;
    }
    
    if (!newPost.title.trim() || !newPost.content.trim() || !newPost.categoryId) {
      return;
    }
    
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forum/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: parseInt(newPost.categoryId),
          authorId: currentUser.id,
          title: newPost.title,
          content: newPost.content
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreatePost(false);
        setNewPost({ title: '', content: '', categoryId: '' });
        navigate(`/forum/post/${data.post.Slug}`);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setCreating(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="forum-page" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Header 
        onSearch={() => {}} 
        onProfileClick={() => currentUser ? setDashboardModalOpen(true) : setProfileModalOpen(true)} 
        onWishlistClick={() => {
          if (currentUser) {
            setDashboardSection('favorites');
            setDashboardModalOpen(true);
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onChatClick={() => {
          if (currentUser) {
            setDashboardSection(currentUser.isVendor ? 'vendor-messages' : 'messages');
            setDashboardModalOpen(true);
          } else {
            setProfileModalOpen(true);
          }
        }} 
        onNotificationsClick={() => {}} 
      />
      <ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
      <DashboardModal isOpen={dashboardModalOpen} onClose={() => setDashboardModalOpen(false)} initialSection={dashboardSection} />

      {/* Mobile Menu Bar - Below Header */}
      <div className="mobile-menu-bar" style={{
        display: 'none',
        alignItems: 'center',
        padding: '8px 16px',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={() => setMobileSidebarOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151'
          }}
        >
          <i className="fas fa-bars" style={{ fontSize: '14px' }}></i>
          <span>Categories</span>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="forum-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1099
          }}
        />
      )}

      {/* Main Layout with Left Sidebar */}
      <div className="forum-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        {/* Left Sidebar - Categories (Reddit-style) */}
        <div className={`forum-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`} style={{
          width: '270px',
          borderRight: '1px solid #edeff1',
          background: '#fff',
          flexShrink: 0
        }}>
          {/* Mobile Header for Sidebar */}
          <div className="forum-sidebar-header" style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            background: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/images/logo.png" alt="PlanBeau" style={{ height: '28px' }} />
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Categories</span>
            </div>
          </div>
          
          <div style={{ padding: '16px' }}>
            {/* Create Post Button - at the top */}
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
                currentUser ? setShowCreatePost(true) : setProfileModalOpen(true);
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#5e72e4',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                marginBottom: '16px'
              }}
            >
              <i className="fas fa-plus"></i>
              Create Post
            </button>
            
            {/* Categories List */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#878a8c', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 12px' }}>
                Topics
              </div>
              
              <button
                onClick={() => handleCategorySelect(null)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: !selectedCategory ? '#f6f7f8' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  fontWeight: !selectedCategory ? 600 : 400,
                  color: '#1c1c1c'
                }}
              >
                <i className="fas fa-home" style={{ width: '20px', color: '#5e72e4' }}></i>
                Home
              </button>
              
              <button
                onClick={() => handleCategorySelect(null)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  color: '#1c1c1c'
                }}
              >
                <i className="fas fa-chart-line" style={{ width: '20px', color: '#46d160' }}></i>
                Popular
              </button>
            </div>
            
            <div style={{ height: '1px', background: '#edeff1', margin: '8px 0' }}></div>
            
            {/* Category List */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#878a8c', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 12px' }}>
                Categories
              </div>
              
              {categories.map(cat => (
                <button
                  key={cat.CategoryID}
                  onClick={() => handleCategorySelect(cat)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: selectedCategory?.CategoryID === cat.CategoryID ? '#f6f7f8' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: selectedCategory?.CategoryID === cat.CategoryID ? 600 : 400,
                    color: '#1c1c1c'
                  }}
                >
                  <i className={`fas ${cat.Icon}`} style={{ width: '20px', color: cat.Color, fontSize: '16px' }}></i>
                  <span style={{ flex: 1 }}>{cat.Name}</span>
                  <span style={{ fontSize: '12px', color: '#878a8c' }}>{cat.PostCount || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="forum-main-content" style={{ flex: 1, background: '#f8f9fa', padding: '20px 24px' }}>
          <div style={{ maxWidth: '100%' }}>
            {/* Sort & Search Bar */}
            <div style={{
              background: '#fff',
              borderRadius: '4px',
              padding: '10px 12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid #ccc',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['newest', 'top', 'hot'].map(sort => (
                  <button
                    key={sort}
                    onClick={() => { setSortBy(sort); setPage(1); }}
                    style={{
                      padding: '6px 12px',
                      background: sortBy === sort ? '#edeff1' : 'transparent',
                      color: sortBy === sort ? '#1c1c1c' : '#878a8c',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontWeight: sortBy === sort ? 700 : 600,
                      fontSize: '14px',
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className={`fas ${sort === 'newest' ? 'fa-clock' : sort === 'top' ? 'fa-arrow-up' : 'fa-fire'}`} style={{ fontSize: '12px' }}></i>
                    {sort === 'newest' ? 'New' : sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #edeff1',
                    borderRadius: '4px',
                    fontSize: '14px',
                    background: '#f6f7f8'
                  }}
                />
              </div>
            </div>

            {/* Posts List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
              </div>
            ) : posts.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <i className="fas fa-comments" style={{ fontSize: '3rem', color: '#ddd', marginBottom: '1rem' }}></i>
                <h3 style={{ color: '#666', marginBottom: '0.5rem' }}>No posts yet</h3>
                <p style={{ color: '#999' }}>Be the first to start a discussion!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {posts.map(post => (
                  <div
                    key={post.PostID}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      display: 'flex',
                      gap: '1rem'
                    }}
                  >
                    {/* Vote buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '40px' }}>
                      <button
                        onClick={() => handleVote(post.PostID, post.UserVote === 1 ? 0 : 1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: post.UserVote === 1 ? '#f97316' : '#999',
                          fontSize: '1.25rem'
                        }}
                      >
                        <i className="fas fa-arrow-up"></i>
                      </button>
                      <span style={{ fontWeight: 600, color: post.Score > 0 ? '#f97316' : post.Score < 0 ? '#6366f1' : '#666' }}>
                        {post.Score}
                      </span>
                      <button
                        onClick={() => handleVote(post.PostID, post.UserVote === -1 ? 0 : -1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: post.UserVote === -1 ? '#6366f1' : '#999',
                          fontSize: '1.25rem'
                        }}
                      >
                        <i className="fas fa-arrow-down"></i>
                      </button>
                    </div>

                    {/* Post content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: `${post.CategoryColor}15`,
                            color: post.CategoryColor,
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}
                        >
                          <i className={`fas ${post.CategoryIcon}`} style={{ marginRight: '0.25rem' }}></i>
                          {post.CategoryName}
                        </span>
                        <span style={{ color: '#999', fontSize: '0.8rem' }}>
                          Posted by {post.AuthorName} • {formatTimeAgo(post.CreatedAt)}
                        </span>
                      </div>
                      <h3
                        onClick={() => navigate(`/forum/post/${post.Slug}`)}
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: '#222',
                          marginBottom: '0.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        {post.Title}
                      </h3>
                      <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                        {post.Content.length > 200 ? post.Content.substring(0, 200) + '...' : post.Content}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', color: '#999', fontSize: '0.8rem' }}>
                        <span><i className="fas fa-comment" style={{ marginRight: '0.25rem' }}></i> {post.CommentCount} comments</span>
                        <span><i className="fas fa-eye" style={{ marginRight: '0.25rem' }}></i> {post.ViewCount} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalCount > 20 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.5 : 1
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: '0.5rem 1rem', color: '#666' }}>
                  Page {page} of {Math.ceil(totalCount / 20)}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(totalCount / 20)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: page >= Math.ceil(totalCount / 20) ? 'not-allowed' : 'pointer',
                    opacity: page >= Math.ceil(totalCount / 20) ? 0.5 : 1
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Create Post Modal */}
      {showCreatePost && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Create New Post</h2>
              <button onClick={() => setShowCreatePost(false)} className="modal-close-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleCreatePost}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
                <select
                  value={newPost.categoryId}
                  onChange={(e) => setNewPost({ ...newPost, categoryId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.CategoryID} value={cat.CategoryID}>{cat.Name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  required
                  maxLength={300}
                  placeholder="What's your question or topic?"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  required
                  rows={6}
                  placeholder="Share more details..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{
                      background: 'none',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: showEmojiPicker ? '#5e72e4' : '#666',
                      fontSize: '14px'
                    }}
                  >
                    <i className="far fa-smile"></i>
                    Add Emoji
                  </button>
                </div>
                {showEmojiPicker && (
                  <div 
                    ref={emojiPickerRef}
                    style={{
                      position: 'absolute',
                      bottom: '50px',
                      left: '0',
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
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreatePost(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.7 : 1
                  }}
                >
                  {creating ? 'Creating...' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
      {currentUser && <MessagingWidget />}
      <MobileBottomNav 
        onOpenDashboard={(section) => {
          if (section) {
            const sectionMap = {
              'messages': currentUser?.isVendor ? 'vendor-messages' : 'messages',
              'dashboard': 'dashboard'
            };
            setDashboardSection(sectionMap[section] || section);
          }
          setDashboardModalOpen(true);
        }}
        onCloseDashboard={() => setDashboardModalOpen(false)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenMap={handleOpenMap}
        onOpenMessages={() => {
          // Dispatch event to open messaging widget
          window.dispatchEvent(new CustomEvent('openMessagingWidget', { detail: {} }));
        }}
      />
    </div>
  );
}

export default ForumPage;
