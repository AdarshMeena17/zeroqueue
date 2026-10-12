const authService = require('../services/auth.service');
const { sendTokenResponse } = require('../utils/token');

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    sendTokenResponse(user, 201, res);
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'UNAUTHORIZED') res.status(401);
    else if (error.code === 'FORBIDDEN') res.status(403);
    next(error);
  }
};

const logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: {},
  });
};

const getMe = async (req, res, next) => {
  try {
    // req.user is attached by auth middleware
    res.status(200).json({
      success: true,
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        isActive: req.user.isActive,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
