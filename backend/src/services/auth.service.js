const User = require('../models/User');
const bcrypt = require('bcryptjs');

const registerUser = async (userData) => {
  const { name, email, password } = userData;

  if (!name || !email || !password) {
    const error = new Error('Please provide name, email and password');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('Email already exists');
    error.code = 'CONFLICT';
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Always create as 'user', ignoring any role sent in request
  const user = await User.create({
    name,
    email, // User model automatically lowercases this
    password: hashedPassword,
    role: 'user', 
  });

  return user;
};

const loginUser = async (email, password) => {
  if (!email || !password) {
    const error = new Error('Please provide email and password');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  // Find user and explicitly select password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    const error = new Error('Invalid credentials');
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Your account has been deactivated');
    error.code = 'FORBIDDEN';
    throw error;
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
};
