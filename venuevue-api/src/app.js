const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const expressRaw = require('express').raw;
const http = require('http');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');
const sql = require('mssql');
const { poolPromise } = require('./config/db');
const { upload } = require('./middlewares/uploadMiddleware'); 

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: ['https://bundlebooth.github.io', 'https://bdb-3-0-venuevue-api.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Stripe webhook must be mounted BEFORE JSON parser to use raw body
const { router: paymentsRouter, webhook: paymentsWebhook } = require('./routes/payments');
app.post('/api/payments/webhook', expressRaw({ type: 'application/json' }), paymentsWebhook);

// Regular body parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io and upload accessible to routes
app.set('io', io);
app.set('upload', upload);

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.userId = decoded.userId;
    socket.isVendor = decoded.isVendor || false;
    next();
  });
});

// API Routes
const vendorsRouter = require('./routes/vendors');
const bookingsRouter = require('./routes/bookings');
const favoritesRouter = require('./routes/favorites');
const { router: messagesRouter, handleSocketIO } = require('./routes/messages');
const reviewsRouter = require('./routes/reviews');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');
const vendorDashboardRouter = require('./routes/vendorDashboard');
const uploadRouter = require('./routes/upload');
const invoicesRouter = require('./routes/invoices');
const vendorFeaturesRouter = require('./routes/vendorFeatures');
const analyticsRouter = require('./routes/analytics');
const vendorDiscoveryRouter = require('./routes/vendorDiscovery');
const adminRouter = require('./routes/admin');
app.use('/api/users', usersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/vendor', vendorDashboardRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/vendor-features', vendorFeaturesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/vendor-discovery', vendorDiscoveryRouter);
app.use('/api/admin', adminRouter);

// ==================== PUBLIC ANNOUNCEMENTS (No Auth Required) ====================
// Get active announcements for homepage
app.get('/api/public/announcements', async (req, res) => {
  try {
    const { audience = 'all' } = req.query;
    const pool = await poolPromise;
    
    // Check if Announcements table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'Announcements'
    `);
    
    console.log('📢 Fetching public announcements, table exists:', tableCheck.recordset[0].cnt > 0);
    
    if (tableCheck.recordset[0].cnt > 0) {
      // First get all active announcements for debugging
      const allActive = await pool.request().query(`
        SELECT AnnouncementID, Title, StartDate, EndDate, IsActive FROM Announcements WHERE IsActive = 1
      `);
      console.log('📢 All active announcements:', allActive.recordset);
      
      const result = await pool.request()
        .input('audience', sql.NVarChar, audience)
        .query(`
          SELECT AnnouncementID, Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, IsDismissible, CreatedAt
          FROM Announcements
          WHERE IsActive = 1 
            AND (StartDate IS NULL OR CAST(StartDate AS DATE) <= CAST(GETDATE() AS DATE)) 
            AND (EndDate IS NULL OR CAST(EndDate AS DATE) >= CAST(GETDATE() AS DATE))
            AND (TargetAudience = 'all' OR TargetAudience = @audience)
          ORDER BY DisplayOrder, CreatedAt DESC
        `);
      
      console.log('📢 Filtered announcements returned:', result.recordset.length);
      res.json({ announcements: result.recordset });
    } else {
      console.log('📢 Announcements table does not exist');
      res.json({ announcements: [] });
    }
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get ALL announcements for What's New sidebar (including future ones)
app.get('/api/public/announcements/all', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'Announcements'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      const result = await pool.request().query(`
        SELECT AnnouncementID, Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, IsDismissible, StartDate, EndDate, CreatedAt
        FROM Announcements
        WHERE IsActive = 1 
          AND (EndDate IS NULL OR CAST(EndDate AS DATE) >= CAST(GETDATE() AS DATE))
        ORDER BY DisplayOrder, CreatedAt DESC
      `);
      res.json({ announcements: result.recordset });
    } else {
      res.json({ announcements: [] });
    }
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get active banners for homepage
app.get('/api/public/banners', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'ContentBanners'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      const result = await pool.request().query(`
        SELECT BannerID, Title, Subtitle, ImageURL, LinkURL, LinkText, BackgroundColor, TextColor, Position
        FROM ContentBanners
        WHERE IsActive = 1 
          AND (StartDate IS NULL OR StartDate <= GETUTCDATE()) 
          AND (EndDate IS NULL OR EndDate >= GETUTCDATE())
        ORDER BY DisplayOrder, CreatedAt DESC
      `);
      res.json({ banners: result.recordset });
    } else {
      res.json({ banners: [] });
    }
  } catch (error) {
    console.error('Error fetching public banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

// Dismiss announcement (public)
app.post('/api/public/announcements/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Announcements SET DismissCount = DismissCount + 1 WHERE AnnouncementID = @id');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing announcement:', error);
    res.status(500).json({ error: 'Failed to dismiss announcement' });
  }
});

// ==================== PUBLIC FAQs (No Auth Required) ====================
app.get('/api/public/faqs', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'FAQs'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      const result = await pool.request().query(`
        SELECT FAQID, Question, Answer, Category
        FROM FAQs
        WHERE IsActive = 1
        ORDER BY DisplayOrder, CreatedAt
      `);
      res.json({ faqs: result.recordset });
    } else {
      // Return default FAQs if table doesn't exist
      res.json({ faqs: [
        { FAQID: 1, Question: 'How do I book a vendor?', Answer: 'Browse vendors, select one, choose your date and complete the booking.', Category: 'Booking' },
        { FAQID: 2, Question: 'What is the cancellation policy?', Answer: 'Policies vary by vendor. Check the vendor profile for details.', Category: 'Booking' },
        { FAQID: 3, Question: 'How do payments work?', Answer: 'Payments are processed securely through Stripe.', Category: 'Payments' },
        { FAQID: 4, Question: 'How do I become a vendor?', Answer: 'Click Become a Vendor and complete the registration process.', Category: 'Vendors' }
      ]});
    }
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// ==================== PUBLIC COMMISSION INFO (No Auth Required) ====================
app.get('/api/public/commission-info', async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'CommissionSettings'
    `);
    
    if (tableCheck.recordset[0].cnt > 0) {
      const result = await pool.request().query(`
        SELECT SettingKey, SettingValue, Description
        FROM CommissionSettings
        WHERE IsActive = 1
      `);
      
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
          platformCommission: settings.platform_commission_rate?.value || '15',
          renterProcessingFee: settings.renter_processing_fee_rate?.value || '5',
          description: 'PlanHive takes a commission from the host\'s total payout. We also collect a processing fee from the renter to cover payment processing, platform development, customer support, and fraud prevention.'
        }
      });
    } else {
      res.json({ 
        success: true,
        commissionInfo: {
          platformCommission: '15',
          renterProcessingFee: '5',
          description: 'PlanHive takes a 15% commission from the host\'s total payout. We also collect a 5% processing fee from the renter.'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching commission info:', error);
    res.status(500).json({ error: 'Failed to fetch commission info' });
  }
});

// Fixed route to handle fetching vendor conversations with consistent data format
app.get('/api/messages/conversations/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('VendorProfileID', sql.Int, vendorId)
            .query(`
                SELECT 
                    c.ConversationID,
                    c.CreatedAt,
                    u.UserID,
                    u.Name AS UserName,
                    u.Email AS UserEmail,
                    ISNULL(m.Content, '') AS LastMessageContent,
                    ISNULL(m.CreatedAt, c.CreatedAt) AS LastMessageCreatedAt,
                    ISNULL(m.SenderID, 0) AS LastMessageSenderID,
                    ISNULL(COUNT(CASE WHEN m2.IsRead = 0 AND m2.SenderID != vp.UserID THEN 1 END), 0) AS UnreadCount
                FROM Conversations c
                INNER JOIN VendorProfiles vp ON c.VendorProfileID = vp.VendorProfileID
                INNER JOIN Users u ON c.UserID = u.UserID
                LEFT JOIN Messages m ON c.ConversationID = m.ConversationID
                    AND m.MessageID = (
                        SELECT TOP 1 MessageID 
                        FROM Messages 
                        WHERE ConversationID = c.ConversationID 
                        ORDER BY CreatedAt DESC
                    )
                LEFT JOIN Messages m2 ON c.ConversationID = m2.ConversationID
                WHERE c.VendorProfileID = @VendorProfileID
                GROUP BY c.ConversationID, c.CreatedAt, u.UserID, u.Name, u.Email, m.Content, m.CreatedAt, m.SenderID
                ORDER BY ISNULL(m.CreatedAt, c.CreatedAt) DESC
            `);

        // Format conversations to match frontend expected format
        const formattedConversations = result.recordset.map(conv => ({
            id: conv.ConversationID,
            createdAt: conv.CreatedAt,
            userId: conv.UserID,
            userName: conv.UserName,
            userEmail: conv.UserEmail,
            lastMessageContent: conv.LastMessageContent,
            lastMessageCreatedAt: conv.LastMessageCreatedAt,
            lastMessageSenderId: conv.LastMessageSenderID,
            unreadCount: conv.UnreadCount
        }));

        res.json({
            success: true,
            conversations: formattedConversations
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve conversations',
            error: err.message
        });
    }
});

// Test database connection
app.get('/ping', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT 1 as number');
    res.json({ message: 'Database connection successful', data: result.recordset });
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Initialize Socket.IO handlers
handleSocketIO(io);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
