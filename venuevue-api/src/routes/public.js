const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { serializeDates, serializeRecords } = require('../utils/helpers');

// Default FAQs fallback
const DEFAULT_FAQS = [
  { FAQID: 1, Question: 'How do I book a vendor?', Answer: 'Browse vendors, select one, choose your date and complete the booking.', Category: 'Booking' },
  { FAQID: 2, Question: 'What is the cancellation policy?', Answer: 'Policies vary by vendor. Check the vendor profile for details.', Category: 'Booking' },
  { FAQID: 3, Question: 'How do payments work?', Answer: 'Payments are processed securely through Stripe.', Category: 'Payments' },
  { FAQID: 4, Question: 'How do I become a vendor?', Answer: 'Click Become a Vendor and complete the registration process.', Category: 'Vendors' }
];

// Default commission info fallback
const DEFAULT_COMMISSION = {
  platformCommission: '15',
  renterProcessingFee: '5',
  description: 'PlanBeau takes a 15% commission from the host\'s total payout. We also collect a 5% processing fee from the renter.'
};

// Get active announcements for homepage
router.get('/announcements', async (req, res) => {
  try {
    const { audience = 'all' } = req.query;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('Audience', sql.NVarChar(50), audience)
      .execute('admin.sp_GetPublicAnnouncements');
    
    res.json({ announcements: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    res.json({ announcements: [] });
  }
});

// Get ALL announcements for What's New sidebar
router.get('/announcements/all', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetAllPublicAnnouncements');
    res.json({ announcements: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.json({ announcements: [] });
  }
});

// Get active banners for homepage
router.get('/banners', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetPublicBanners');
    res.json({ banners: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching public banners:', error);
    res.json({ banners: [] });
  }
});

// Dismiss announcement
router.post('/announcements/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    await pool.request()
      .input('AnnouncementID', sql.Int, parseInt(id))
      .execute('admin.sp_DismissPublicAnnouncement');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing announcement:', error);
    res.status(500).json({ error: 'Failed to dismiss announcement' });
  }
});

// Get FAQs (legacy endpoint)
router.get('/faqs', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetPublicFAQs');
    
    if (result.recordset && result.recordset.length > 0) {
      res.json({ faqs: result.recordset });
    } else {
      res.json({ faqs: DEFAULT_FAQS });
    }
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.json({ faqs: DEFAULT_FAQS });
  }
});

// Track FAQ view
router.post('/faqs/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    await pool.request()
      .input('FAQID', sql.Int, parseInt(id))
      .query(`UPDATE [admin].[FAQs] SET ViewCount = ISNULL(ViewCount, 0) + 1 WHERE FAQID = @FAQID`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking FAQ view:', error);
    res.json({ success: false });
  }
});

// Submit FAQ feedback (emoji: sad, neutral, happy)
router.post('/faqs/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body; // 'sad', 'neutral', 'happy'
    const pool = await poolPromise;
    
    let updateField = '';
    if (rating === 'happy') {
      updateField = 'HelpfulCount = ISNULL(HelpfulCount, 0) + 1';
    } else if (rating === 'neutral') {
      updateField = 'NeutralCount = ISNULL(NeutralCount, 0) + 1';
    } else if (rating === 'sad') {
      updateField = 'NotHelpfulCount = ISNULL(NotHelpfulCount, 0) + 1';
    } else {
      return res.status(400).json({ error: 'Invalid rating' });
    }
    
    await pool.request()
      .input('FAQID', sql.Int, parseInt(id))
      .query(`UPDATE [admin].[FAQs] SET ${updateField} WHERE FAQID = @FAQID`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting FAQ feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// ==================== HELP CENTRE ROUTES ====================

// Get FAQ categories with article counts
router.get('/help-centre/categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    // Try stored procedure first, fallback to direct query
    try {
      const result = await pool.request().execute('admin.sp_GetFAQCategories');
      res.json({ categories: result.recordset || [] });
    } catch (spError) {
      // Fallback: direct query if SP doesn't exist
      const result = await pool.request().query(`
        SELECT 
          c.CategoryID,
          c.Name,
          c.Slug,
          c.Description,
          c.Icon,
          c.DisplayOrder,
          c.IsActive,
          (SELECT COUNT(*) FROM [admin].[FAQs] f WHERE f.CategoryID = c.CategoryID AND f.IsActive = 1) AS ArticleCount
        FROM [admin].[FAQCategories] c
        WHERE c.IsActive = 1
        ORDER BY c.DisplayOrder, c.Name
      `);
      res.json({ categories: result.recordset || [] });
    }
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    // Return default categories if table doesn't exist
    res.json({ categories: [
      { CategoryID: 1, Name: 'Getting Started', Slug: 'getting-started', Icon: 'fa-rocket', ArticleCount: 5 },
      { CategoryID: 2, Name: 'Account & Profile', Slug: 'account-profile', Icon: 'fa-user-circle', ArticleCount: 6 },
      { CategoryID: 3, Name: 'Booking & Reservations', Slug: 'booking-reservations', Icon: 'fa-calendar-check', ArticleCount: 7 },
      { CategoryID: 4, Name: 'Payments & Billing', Slug: 'payments-billing', Icon: 'fa-credit-card', ArticleCount: 7 },
      { CategoryID: 5, Name: 'For Vendors', Slug: 'for-vendors', Icon: 'fa-store', ArticleCount: 10 },
      { CategoryID: 6, Name: 'For Clients', Slug: 'for-clients', Icon: 'fa-users', ArticleCount: 5 }
    ]});
  }
});

// Get FAQs by category
router.get('/help-centre/faqs', async (req, res) => {
  try {
    const { category, search } = req.query;
    const pool = await poolPromise;
    
    let query = `
      SELECT 
        f.FAQID,
        f.Question,
        f.Answer,
        f.Category,
        f.CategoryID,
        f.DisplayOrder,
        f.ViewCount,
        f.HelpfulCount,
        f.NotHelpfulCount,
        c.Name AS CategoryName,
        c.Slug AS CategorySlug,
        c.Icon AS CategoryIcon
      FROM [admin].[FAQs] f
      LEFT JOIN [admin].[FAQCategories] c ON f.CategoryID = c.CategoryID
      WHERE f.IsActive = 1
    `;
    
    const request = pool.request();
    
    if (category) {
      query += ` AND c.Slug = @CategorySlug`;
      request.input('CategorySlug', sql.NVarChar(100), category);
    }
    
    if (search) {
      query += ` AND (f.Question LIKE @Search OR f.Answer LIKE @Search)`;
      request.input('Search', sql.NVarChar(200), `%${search}%`);
    }
    
    query += ` ORDER BY f.CategoryID, f.DisplayOrder, f.FAQID`;
    
    const result = await request.query(query);
    res.json({ faqs: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching FAQs by category:', error);
    res.json({ faqs: DEFAULT_FAQS });
  }
});

// Get single FAQ by ID
router.get('/help-centre/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('FAQID', sql.Int, parseInt(id))
      .query(`
        SELECT 
          f.FAQID,
          f.Question,
          f.Answer,
          f.Category,
          f.CategoryID,
          f.ViewCount,
          f.HelpfulCount,
          f.NotHelpfulCount,
          c.Name AS CategoryName,
          c.Slug AS CategorySlug
        FROM [admin].[FAQs] f
        LEFT JOIN [admin].[FAQCategories] c ON f.CategoryID = c.CategoryID
        WHERE f.FAQID = @FAQID AND f.IsActive = 1
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    
    // Increment view count
    await pool.request()
      .input('FAQID', sql.Int, parseInt(id))
      .query(`UPDATE [admin].[FAQs] SET ViewCount = ISNULL(ViewCount, 0) + 1 WHERE FAQID = @FAQID`);
    
    res.json({ faq: result.recordset[0] });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ' });
  }
});

// Get articles
router.get('/help-centre/articles', async (req, res) => {
  try {
    const { type, category, featured } = req.query;
    const pool = await poolPromise;
    
    let query = `
      SELECT 
        a.ArticleID,
        a.Title,
        a.Slug,
        a.Summary,
        a.Content,
        a.CategoryID,
        a.ArticleType,
        a.FeaturedImage,
        a.Author,
        a.Tags,
        a.DisplayOrder,
        a.IsFeatured,
        a.ViewCount,
        a.PublishedAt,
        c.Name AS CategoryName,
        c.Slug AS CategorySlug
      FROM [admin].[Articles] a
      LEFT JOIN [admin].[FAQCategories] c ON a.CategoryID = c.CategoryID
      WHERE a.IsActive = 1
    `;
    
    const request = pool.request();
    
    if (type) {
      query += ` AND a.ArticleType = @ArticleType`;
      request.input('ArticleType', sql.NVarChar(50), type);
    }
    
    if (category) {
      query += ` AND a.CategoryID = @CategoryID`;
      request.input('CategoryID', sql.Int, parseInt(category));
    }
    
    if (featured === 'true') {
      query += ` AND a.IsFeatured = 1`;
    }
    
    query += ` ORDER BY a.IsFeatured DESC, a.DisplayOrder, a.PublishedAt DESC`;
    
    const result = await request.query(query);
    res.json({ articles: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.json({ articles: [] });
  }
});

// Get single article by slug
router.get('/help-centre/articles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('Slug', sql.NVarChar(255), slug)
      .query(`
        SELECT 
          a.ArticleID,
          a.Title,
          a.Slug,
          a.Summary,
          a.Content,
          a.CategoryID,
          a.ArticleType,
          a.FeaturedImage,
          a.Author,
          a.Tags,
          a.IsFeatured,
          a.ViewCount,
          a.HelpfulCount,
          a.NotHelpfulCount,
          a.PublishedAt,
          c.Name AS CategoryName,
          c.Slug AS CategorySlug
        FROM [admin].[Articles] a
        LEFT JOIN [admin].[FAQCategories] c ON a.CategoryID = c.CategoryID
        WHERE a.Slug = @Slug AND a.IsActive = 1
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    // Increment view count
    await pool.request()
      .input('Slug', sql.NVarChar(255), slug)
      .query(`UPDATE [admin].[Articles] SET ViewCount = ISNULL(ViewCount, 0) + 1 WHERE Slug = @Slug`);
    
    // Get related articles
    const article = result.recordset[0];
    const relatedResult = await pool.request()
      .input('ArticleID', sql.Int, article.ArticleID)
      .input('CategoryID', sql.Int, article.CategoryID)
      .input('ArticleType', sql.NVarChar(50), article.ArticleType)
      .query(`
        SELECT TOP 3
          ArticleID, Title, Slug, Summary, FeaturedImage, Author, PublishedAt
        FROM [admin].[Articles]
        WHERE IsActive = 1 
          AND ArticleID != @ArticleID
          AND (CategoryID = @CategoryID OR ArticleType = @ArticleType)
        ORDER BY IsFeatured DESC, PublishedAt DESC
      `);
    
    res.json({ 
      article: article,
      relatedArticles: relatedResult.recordset || []
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Submit article/FAQ feedback (helpful/not helpful)
router.post('/help-centre/feedback', async (req, res) => {
  try {
    const { type, id, helpful, userId } = req.body;
    const pool = await poolPromise;
    
    if (type === 'faq') {
      const column = helpful ? 'HelpfulCount' : 'NotHelpfulCount';
      await pool.request()
        .input('FAQID', sql.Int, parseInt(id))
        .query(`UPDATE [admin].[FAQs] SET ${column} = ISNULL(${column}, 0) + 1 WHERE FAQID = @FAQID`);
    } else if (type === 'article') {
      const column = helpful ? 'HelpfulCount' : 'NotHelpfulCount';
      await pool.request()
        .input('ArticleID', sql.Int, parseInt(id))
        .query(`UPDATE [admin].[Articles] SET ${column} = ISNULL(${column}, 0) + 1 WHERE ArticleID = @ArticleID`);
    }
    
    res.json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Search FAQs and articles
router.get('/help-centre/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ faqs: [], articles: [] });
    }
    
    const pool = await poolPromise;
    const searchTerm = `%${q}%`;
    
    // Search FAQs
    const faqResult = await pool.request()
      .input('Search', sql.NVarChar(200), searchTerm)
      .query(`
        SELECT TOP 10
          f.FAQID,
          f.Question,
          f.Answer,
          f.Category,
          c.Name AS CategoryName,
          c.Slug AS CategorySlug
        FROM [admin].[FAQs] f
        LEFT JOIN [admin].[FAQCategories] c ON f.CategoryID = c.CategoryID
        WHERE f.IsActive = 1 AND (f.Question LIKE @Search OR f.Answer LIKE @Search)
        ORDER BY 
          CASE WHEN f.Question LIKE @Search THEN 0 ELSE 1 END,
          f.DisplayOrder
      `);
    
    // Search articles
    const articleResult = await pool.request()
      .input('Search', sql.NVarChar(200), searchTerm)
      .query(`
        SELECT TOP 5
          a.ArticleID,
          a.Title,
          a.Slug,
          a.Summary,
          a.ArticleType,
          c.Name AS CategoryName
        FROM [admin].[Articles] a
        LEFT JOIN [admin].[FAQCategories] c ON a.CategoryID = c.CategoryID
        WHERE a.IsActive = 1 AND (a.Title LIKE @Search OR a.Summary LIKE @Search OR a.Content LIKE @Search)
        ORDER BY 
          CASE WHEN a.Title LIKE @Search THEN 0 ELSE 1 END,
          a.IsFeatured DESC
      `);
    
    res.json({ 
      faqs: faqResult.recordset || [],
      articles: articleResult.recordset || []
    });
  } catch (error) {
    console.error('Error searching help centre:', error);
    res.json({ faqs: [], articles: [] });
  }
});

// Submit FAQ feedback
router.post('/faqs/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, rating } = req.body;
    
    const pool = await poolPromise;
    
    await pool.request()
      .input('FAQID', sql.Int, parseInt(id))
      .input('UserID', sql.Int, userId || null)
      .input('Rating', sql.NVarChar(20), rating)
      .execute('admin.sp_SubmitPublicFAQFeedback');
    
    res.json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    console.error('Error submitting FAQ feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get commission info
router.get('/commission-info', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetPublicCommissionInfo');
    
    if (result.recordset && result.recordset.length > 0) {
      const settings = {};
      result.recordset.forEach(row => {
        settings[row.SettingKey] = {
          value: row.SettingValue,
          description: row.Description
        };
      });
      
      res.json({ 
        success: true,
        commissionInfo: {
          platformCommission: settings.platform_commission_rate?.value || DEFAULT_COMMISSION.platformCommission,
          renterProcessingFee: settings.renter_processing_fee_rate?.value || DEFAULT_COMMISSION.renterProcessingFee,
          description: 'PlanBeau takes a commission from the host\'s total payout. We also collect a processing fee from the renter to cover payment processing, platform development, customer support, and fraud prevention.'
        }
      });
    } else {
      res.json({ success: true, commissionInfo: DEFAULT_COMMISSION });
    }
  } catch (error) {
    console.error('Error fetching commission info:', error);
    res.json({ success: true, commissionInfo: DEFAULT_COMMISSION });
  }
});

// ==================== BLOG ROUTES ====================

// Get published blog posts
router.get('/blogs', async (req, res) => {
  try {
    const { category, page = 1, limit = 12, featured } = req.query;
    const pool = await poolPromise;
    
    const request = pool.request();
    request.input('Category', sql.NVarChar(100), category || null);
    request.input('Search', sql.NVarChar(100), null);
    request.input('PageNumber', sql.Int, parseInt(page));
    request.input('PageSize', sql.Int, parseInt(limit));
    
    const result = await request.execute('content.sp_GetBlogs');
    
    res.json({
      blogs: result.recordsets[0] || [],
      total: result.recordsets[1]?.[0]?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching public blogs:', error);
    res.json({ blogs: [], total: 0, page: 1, limit: 12 });
  }
});

// Get featured blog posts for carousel
router.get('/blogs/featured', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const request = pool.request();
    request.input('Limit', sql.Int, 5);
    const result = await request.execute('content.sp_GetFeaturedBlogs');
    
    res.json({ blogs: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    res.json({ blogs: [] });
  }
});

// Get single blog post by slug
router.get('/blogs/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const pool = await poolPromise;
    
    // Get blog by slug
    const request = pool.request();
    request.input('Slug', sql.NVarChar(255), slug);
    const result = await request.execute('content.sp_GetBlogBySlug');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Increment view count
    const viewRequest = pool.request();
    viewRequest.input('Slug', sql.NVarChar(255), slug);
    await viewRequest.execute('content.sp_IncrementBlogViewCount');
    
    // Get related posts
    const blog = result.recordset[0];
    const relatedRequest = pool.request();
    relatedRequest.input('BlogID', sql.Int, blog.BlogID);
    relatedRequest.input('Category', sql.NVarChar(100), blog.Category);
    relatedRequest.input('Limit', sql.Int, 3);
    const relatedResult = await relatedRequest.execute('content.sp_GetRelatedBlogs');
    
    res.json({ 
      blog: blog,
      relatedPosts: relatedResult.recordset || []
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Get blog categories with post counts
router.get('/blog-categories', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request().execute('content.sp_GetBlogCategories');
    
    res.json({ categories: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.json({ categories: [] });
  }
});

module.exports = router;
