const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

const authRoutes = require('./routes/auth.routes');
const departmentRoutes = require('./routes/department.routes');
const queueRoutes = require('./routes/queue.routes');
const userRoutes = require('./routes/user.routes');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/users', userRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'QueueZero API is running' });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
