const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../config/db');

// Get all forum categories
router.get('/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('forum.sp_GetCategories');
    
    res.json({
      success: true,
      categories: result.recordset
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// Get forum posts with filtering
router.get('/posts', async (req, res) => {
  try {
    const { category, search, sort = 'newest', page = 1, pageSize = 20, userId } = req.query;
    
    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('CategorySlug', sql.NVarChar(100), category || null);
    request.input('SearchQuery', sql.NVarChar(200), search || null);
    request.input('SortBy', sql.NVarChar(20), sort);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(pageSize));
    request.input('UserID', sql.Int, userId ? parseInt(userId) : null);
    
    const result = await request.execute('forum.sp_GetPosts');
    
    res.json({
      success: true,
      totalCount: result.recordsets[0][0]?.TotalCount || 0,
      posts: result.recordsets[1] || [],
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

// Get single post by slug
router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.query;
    
    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('Slug', sql.NVarChar(350), slug);
    request.input('UserID', sql.Int, userId ? parseInt(userId) : null);
    
    const result = await request.execute('forum.sp_GetPostBySlug');
    
    if (!result.recordsets[0] || result.recordsets[0].length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    res.json({
      success: true,
      post: result.recordsets[0][0],
      comments: result.recordsets[1] || []
    });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
});

// Create a new post
router.post('/posts', async (req, res) => {
  try {
    const { categoryId, authorId, title, content, imageUrl } = req.body;
    
    if (!categoryId || !authorId || !title || !content) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('CategoryID', sql.Int, categoryId);
    request.input('AuthorID', sql.Int, authorId);
    request.input('Title', sql.NVarChar(300), title);
    request.input('Content', sql.NVarChar(sql.MAX), content);
    request.input('ImageURL', sql.NVarChar(500), imageUrl || null);
    
    const result = await request.execute('forum.sp_CreatePost');
    
    res.json({
      success: true,
      post: result.recordset[0]
    });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

// Create a comment
router.post('/comments', async (req, res) => {
  try {
    const { postId, authorId, content, parentCommentId } = req.body;
    
    if (!postId || !authorId || !content) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('PostID', sql.Int, postId);
    request.input('AuthorID', sql.Int, authorId);
    request.input('Content', sql.NVarChar(sql.MAX), content);
    request.input('ParentCommentID', sql.Int, parentCommentId || null);
    
    const result = await request.execute('forum.sp_CreateComment');
    
    res.json({
      success: true,
      comment: result.recordset[0]
    });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create comment' });
  }
});

// Vote on a post or comment
router.post('/vote', async (req, res) => {
  try {
    const { userId, postId, commentId, voteType } = req.body;
    
    if (!userId || (voteType !== 1 && voteType !== -1 && voteType !== 0)) {
      return res.status(400).json({ success: false, message: 'Invalid vote parameters' });
    }
    
    if (!postId && !commentId) {
      return res.status(400).json({ success: false, message: 'Must specify postId or commentId' });
    }
    
    const pool = await poolPromise;
    const request = pool.request();
    
    request.input('UserID', sql.Int, userId);
    request.input('PostID', sql.Int, postId || null);
    request.input('CommentID', sql.Int, commentId || null);
    request.input('VoteType', sql.SmallInt, voteType);
    
    const result = await request.execute('forum.sp_Vote');
    
    res.json({
      success: true,
      ...result.recordset[0]
    });
  } catch (err) {
    console.error('Error voting:', err);
    res.status(500).json({ success: false, message: 'Failed to process vote' });
  }
});

// Delete a post (soft delete)
router.delete('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    const pool = await poolPromise;
    
    // Check if user is author or admin
    const checkResult = await pool.request()
      .input('PostID', sql.Int, postId)
      .query('SELECT AuthorID FROM forum.ForumPosts WHERE PostID = @PostID');
    
    if (!checkResult.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    if (checkResult.recordset[0].AuthorID !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }
    
    await pool.request()
      .input('PostID', sql.Int, postId)
      .query('UPDATE forum.ForumPosts SET IsDeleted = 1, UpdatedAt = GETDATE() WHERE PostID = @PostID');
    
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

// Delete a comment (soft delete)
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;
    
    const pool = await poolPromise;
    
    // Check if user is author
    const checkResult = await pool.request()
      .input('CommentID', sql.Int, commentId)
      .query('SELECT AuthorID, PostID FROM forum.ForumComments WHERE CommentID = @CommentID');
    
    if (!checkResult.recordset[0]) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    
    if (checkResult.recordset[0].AuthorID !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }
    
    await pool.request()
      .input('CommentID', sql.Int, commentId)
      .query('UPDATE forum.ForumComments SET IsDeleted = 1, UpdatedAt = GETDATE() WHERE CommentID = @CommentID');
    
    // Update comment count
    await pool.request()
      .input('PostID', sql.Int, checkResult.recordset[0].PostID)
      .query('UPDATE forum.ForumPosts SET CommentCount = CommentCount - 1 WHERE PostID = @PostID');
    
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
});

module.exports = router;
