const { Server } = require('socket.io');
const socketAuth = require('./socket.auth');
const socketRooms = require('./socket.rooms');

let io;

const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(socketAuth);

  io.on('connection', (socket) => {
    // Automatically join private user room
    socket.join(`user:${socket.user._id}`);

    // Register room event handlers
    socketRooms(io, socket);

    socket.on('disconnect', () => {
      // automatic cleanup
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  initSocketServer,
  getIO
};
