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
const { responseTransformer } = require('./middlewares/responseTransformer');
const { resolvePublicIds } = require('./middlewares/publicIdMiddleware'); 

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

// Regular body parsers - increased limit to handle base64 images
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Public ID middleware - resolves public IDs in requests and transforms responses
app.use(resolvePublicIds);
app.use(responseTransformer());

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
const { router: messagesRouter, handleSocketIO } = require('./routes/messages');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');
const dashboardRouter = require('./routes/dashboard');
const uploadRouter = require('./routes/upload');
const invoicesRouter = require('./routes/invoices');
const analyticsRouter = require('./routes/analytics');
const adminRouter = require('./routes/admin');
const publicRouter = require('./routes/public');
const forumRouter = require('./routes/forum');
const geoRouter = require('./routes/geo');
const pushRouter = require('./routes/push');
app.use('/api/users', usersRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/vendor', dashboardRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);
app.use('/api/forum', forumRouter);
app.use('/api/geo', geoRouter);
app.use('/api/push', pushRouter);

// Backward compatibility: Favorites routes now in users.js
app.use('/api/favorites', (req, res, next) => {
  req.url = '/favorites' + req.url;
  usersRouter(req, res, next);
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
});

module.exports = app;
