const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error('User role is not authorized to access this route');
      error.code = 'FORBIDDEN';
      res.status(403);
      return next(error);
    }
    next();
  };
};

module.exports = { authorize };
