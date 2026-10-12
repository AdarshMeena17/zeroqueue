require('dotenv').config();
const app = require('./app');
const http = require('http');
const connectDB = require('./config/db');
const { initSocketServer } = require('./sockets/socket.server');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocketServer(server);

// Connect to database then start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});
