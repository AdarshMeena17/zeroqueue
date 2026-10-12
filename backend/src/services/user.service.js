const User = require('../models/User');
const Department = require('../models/Department');

const MANAGEABLE_ROLES = ['user', 'staff'];
const USER_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const USER_FIELDS = 'name email role department isActive createdAt';

const getManageableUsers = async () => User.find({
  role: { $in: MANAGEABLE_ROLES },
})
  .select(USER_FIELDS)
  .sort({ name: 1, email: 1 });

const updateUserRole = async (id, role) => {
  if (!USER_ID_PATTERN.test(id)) {
    const error = new Error('Invalid user ID');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  if (!MANAGEABLE_ROLES.includes(role)) {
    const error = new Error('Role must be either user or staff');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const user = await User.findById(id).select(USER_FIELDS);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (!MANAGEABLE_ROLES.includes(user.role)) {
    const error = new Error('Admin accounts cannot be changed here');
    error.code = 'FORBIDDEN';
    throw error;
  }

  user.role = role;
  await user.save();
  if (role === 'user') {
    await Department.updateMany({ staff: user._id }, { $pull: { staff: user._id } });
  }
  return user;
};

module.exports = { getManageableUsers, updateUserRole };
