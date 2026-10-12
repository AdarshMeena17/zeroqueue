const userService = require('../services/user.service');

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getManageableUsers();
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const user = await userService.updateUserRole(req.params.id, req.body.role);
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    else if (error.code === 'FORBIDDEN') res.status(403);
    next(error);
  }
};

module.exports = { getUsers, updateUserRole };
