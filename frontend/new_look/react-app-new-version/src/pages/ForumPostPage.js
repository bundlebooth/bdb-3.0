import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileModal from '../components/ProfileModal';
import DashboardModal from '../components/DashboardModal';
import MessagingWidget from '../components/MessagingWidget';

function ForumPostPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { currentUser } = useAuth();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState('dashboard');

  // Load post and comments
  const loadPost = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentUser?.id) params.append('userId', currentUser.id);
      
      const response = await fetch(`${API_BASE_URL}/forum/posts/${slug}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPost(data.post);
        setComments(data.comments || []);
      } else {
        navigate('/forum');
      }
    } catch (err) {
      console.error('Failed to load post:', err);
      navigate('/forum');
    } finally {
      setLoading(false);
    }
  }, [slug, currentUser?.id, navigate]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  // Handle vote on post
  const handlePostVote = async (voteType) => {
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
          postId: post.PostID,
          voteType
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPost(prev => ({
          ...prev,
          UpvoteCount: data.UpvoteCount,
          DownvoteCount: data.DownvoteCount,
          Score: data.Score,
          UserVote: voteType === 0 ? null : voteType
        }));
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Handle vote on comment
  const handleCommentVote = async (commentId, voteType) => {
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
          commentId,
          voteType
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setComments(comments.map(c => 
          c.CommentID === commentId 
            ? { ...c, UpvoteCount: data.UpvoteCount, DownvoteCount: data.DownvoteCount, Score: data.Score, UserVote: voteType === 0 ? null : voteType }
            : c
        ));
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Submit comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setProfileModalOpen(true);
      return;
    }
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forum/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.PostID,
          authorId: currentUser.id,
          content: newComment,
          parentCommentId: replyTo?.CommentID || null
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setNewComment('');
        setReplyTo(null);
        loadPost(); // Reload to get updated comments
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmitting(false);
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

  // Render comment with nested replies
  const renderComment = (comment, level = 0) => {
    const childComments = comments.filter(c => c.ParentCommentID === comment.CommentID);
    
    return (
      <div key={comment.CommentID} style={{ marginLeft: level > 0 ? '2rem' : 0, marginTop: '1rem' }}>
        <div style={{
          background: level > 0 ? '#f8f9fa' : 'white',
          borderRadius: '8px',
          padding: '1rem',
          borderLeft: level > 0 ? '3px solid #e5e7eb' : 'none'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {/* Vote buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem' }}>
              <button
                onClick={() => handleCommentVote(comment.CommentID, comment.UserVote === 1 ? 0 : 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: comment.UserVote === 1 ? '#f97316' : '#999',
                  fontSize: '0.875rem',
                  padding: '0.25rem'
                }}
              >
                <i className="fas fa-arrow-up"></i>
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: comment.Score > 0 ? '#f97316' : comment.Score < 0 ? '#6366f1' : '#666' }}>
                {comment.Score}
              </span>
              <button
                onClick={() => handleCommentVote(comment.CommentID, comment.UserVote === -1 ? 0 : -1)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: comment.UserVote === -1 ? '#6366f1' : '#999',
                  fontSize: '0.875rem',
                  padding: '0.25rem'
                }}
              >
                <i className="fas fa-arrow-down"></i>
              </button>
            </div>

            {/* Comment content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {comment.AuthorAvatar ? (
                  <img src={comment.AuthorAvatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-user" style={{ fontSize: '0.625rem', color: '#999' }}></i>
                  </div>
                )}
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{comment.AuthorName}</span>
                <span style={{ color: '#999', fontSize: '0.75rem' }}>• {formatTimeAgo(comment.CreatedAt)}</span>
              </div>
              <p style={{ color: '#333', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                {comment.IsDeleted ? <em style={{ color: '#999' }}>[deleted]</em> : comment.Content}
              </p>
              {!comment.IsDeleted && (
                <button
                  onClick={() => setReplyTo(comment)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  <i className="fas fa-reply" style={{ marginRight: '0.25rem' }}></i>
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
        {childComments.map(child => renderComment(child, level + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Header onSearch={() => {}} onProfileClick={() => {}} onWishlistClick={() => {}} onChatClick={() => {}} onNotificationsClick={() => {}} />
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const topLevelComments = comments.filter(c => !c.ParentCommentID);

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
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
      
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/forum')}
          style={{
            background: 'none',
            border: 'none',
            color: '#6366f1',
            cursor: 'pointer',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <i className="fas fa-arrow-left"></i>
          Back to Forum
        </button>

        {/* Post */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Vote buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '50px' }}>
              <button
                onClick={() => handlePostVote(post.UserVote === 1 ? 0 : 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: post.UserVote === 1 ? '#f97316' : '#999',
                  fontSize: '1.5rem'
                }}
              >
                <i className="fas fa-arrow-up"></i>
              </button>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: post.Score > 0 ? '#f97316' : post.Score < 0 ? '#6366f1' : '#666' }}>
                {post.Score}
              </span>
              <button
                onClick={() => handlePostVote(post.UserVote === -1 ? 0 : -1)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: post.UserVote === -1 ? '#6366f1' : '#999',
                  fontSize: '1.5rem'
                }}
              >
                <i className="fas fa-arrow-down"></i>
              </button>
            </div>

            {/* Post content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span
                  onClick={() => navigate(`/forum/${post.CategorySlug}`)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: `${post.CategoryColor}15`,
                    color: post.CategoryColor,
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  <i className={`fas ${post.CategoryIcon}`} style={{ marginRight: '0.25rem' }}></i>
                  {post.CategoryName}
                </span>
                <span style={{ color: '#999', fontSize: '0.8rem' }}>
                  Posted by
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {post.AuthorAvatar ? (
                    <img src={post.AuthorAvatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#e5e7eb' }}></div>
                  )}
                  <span style={{ fontWeight: 500, fontSize: '0.8rem' }}>{post.AuthorName}</span>
                </div>
                <span style={{ color: '#999', fontSize: '0.8rem' }}>
                  • {formatTimeAgo(post.CreatedAt)}
                </span>
              </div>
              
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#222', marginBottom: '1rem' }}>
                {post.Title}
              </h1>
              
              <div style={{ color: '#333', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {post.Content}
              </div>

              {post.ImageURL && (
                <img 
                  src={post.ImageURL} 
                  alt="" 
                  style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '1rem' }}
                />
              )}

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', color: '#666', fontSize: '0.875rem' }}>
                <span><i className="fas fa-comment" style={{ marginRight: '0.5rem' }}></i>{post.CommentCount} comments</span>
                <span><i className="fas fa-eye" style={{ marginRight: '0.5rem' }}></i>{post.ViewCount} views</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comment form */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            {replyTo ? `Replying to ${replyTo.AuthorName}` : 'Add a comment'}
          </h3>
          {replyTo && (
            <div style={{ 
              background: '#f3f4f6', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>
                {replyTo.Content.length > 100 ? replyTo.Content.substring(0, 100) + '...' : replyTo.Content}
              </p>
              <button
                onClick={() => setReplyTo(null)}
                style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={currentUser ? "What are your thoughts?" : "Please log in to comment"}
              disabled={!currentUser || post.IsLocked}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '0.9rem',
                resize: 'vertical',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={!currentUser || !newComment.trim() || submitting || post.IsLocked}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: (!currentUser || !newComment.trim() || submitting) ? 'not-allowed' : 'pointer',
                  opacity: (!currentUser || !newComment.trim() || submitting) ? 0.5 : 1
                }}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>

        {/* Comments */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Comments ({post.CommentCount})
          </h3>
          
          {topLevelComments.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            topLevelComments.map(comment => renderComment(comment))
          )}
        </div>
      </div>

      <Footer />
      {currentUser && <MessagingWidget />}
    </div>
  );
}

export default ForumPostPage;
