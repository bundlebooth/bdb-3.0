const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const http = require('http');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const { poolPromise } = require('./config/db');

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

// Make io accessible to routes
app.set('io', io);

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
const messagesRouter = require('./routes/messages');
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
app.use('/api/vendorDashboard', vendorDashboardRouter);

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

// Handle Socket.IO connections
require('./routes/messages').handleSocketIO(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
