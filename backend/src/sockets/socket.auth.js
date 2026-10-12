const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getToken = (cookieString) => {
  if (!cookieString) return null;
  const match = cookieString.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

const socketAuth = async (socket, next) => {
  try {
    const cookiesHeader = socket.handshake.headers.cookie;
    if (!cookiesHeader) {
      return next(new Error('Authentication error: No cookies provided'));
    }

    const token = getToken(cookiesHeader);

    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing!');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id role email');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket Auth Error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuth;
