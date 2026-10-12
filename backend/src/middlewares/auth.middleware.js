const { verifyToken } = require('../utils/token');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    const error = new Error('Not authorized to access this route');
    error.code = 'UNAUTHORIZED';
    res.status(401);
    return next(error);
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      const error = new Error('Not authorized to access this route');
      error.code = 'UNAUTHORIZED';
      res.status(401);
      return next(error);
    }

    if (!user.isActive) {
      const error = new Error('User account is deactivated');
      error.code = 'FORBIDDEN';
      res.status(403);
      return next(error);
    }

    req.user = user;
    next();
  } catch (err) {
    const error = new Error('Not authorized to access this route');
    error.code = 'UNAUTHORIZED';
    res.status(401);
    return next(error);
  }
};

module.exports = { protect };
