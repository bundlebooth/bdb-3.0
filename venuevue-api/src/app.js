const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
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

app.use('/api/users', usersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/vendor', vendorDashboardRouter);

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
                GROUP BY c.ConversationID, c.CreatedAt, u.UserID, u.Name, u.Email, m.Content, m.CreatedAt
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
