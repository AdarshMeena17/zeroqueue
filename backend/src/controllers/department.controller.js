const departmentService = require('../services/department.service');

const createDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.createDepartment(req.body);
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const departments = await departmentService.getDepartments(req.user.role);
    res.status(200).json({
      success: true,
      message: 'Departments retrieved successfully',
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id, req.user.role);
    res.status(200).json({
      success: true,
      message: 'Department retrieved successfully',
      data: department
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    // We only pass explicitly allowed fields from req.body to avoid arbitrary updates
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      isActive: req.body.isActive
    };
    
    // Remove undefined fields so we don't accidentally blank out existing values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const department = await departmentService.updateDepartment(req.params.id, updateData);
    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.deleteDepartment(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Department deleted (deactivated) successfully',
      data: department
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    next(error);
  }
};

const assignStaff = async (req, res, next) => {
  try {
    const department = await departmentService.assignStaff(req.params.departmentId, req.params.userId);
    res.status(200).json({
      success: true,
      message: 'Staff assigned successfully',
      data: department
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

const removeStaff = async (req, res, next) => {
  try {
    const department = await departmentService.removeStaff(req.params.departmentId, req.params.userId);
    res.status(200).json({
      success: true,
      message: 'Staff removed successfully',
      data: department
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    next(error);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  assignStaff,
  removeStaff
};
