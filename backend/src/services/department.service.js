const Department = require('../models/Department');

const createDepartment = async (departmentData) => {
  const { name, description } = departmentData;

  if (!name) {
    const error = new Error('Department name is required');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const existingDept = await Department.findOne({ name: name.trim() });
  if (existingDept) {
    const error = new Error('Department name already exists');
    error.code = 'CONFLICT';
    throw error;
  }

  const department = await Department.create({
    name,
    description,
  });

  return department;
};

const getDepartments = async (userRole) => {
  const query = {};
  
  // Only Admin can see inactive departments
  if (userRole !== 'admin') {
    query.isActive = true;
  }

  const departments = await Department.find(query).populate({
    path: 'staff',
    select: 'name email role department isActive' // strictly exclude password and sensitive fields
  });
  
  return departments;
};

const getDepartmentById = async (id, userRole) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    const error = new Error('Invalid department ID');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const department = await Department.findById(id).populate({
    path: 'staff',
    select: 'name email role department isActive'
  });

  if (!department) {
    const error = new Error('Department not found');
    error.code = 'NOT_FOUND';
    throw error;
  }
  
  // Optionally restrict access to inactive department if not admin
  // (the prompt didn't explicitly demand it for getById but usually is a good practice)
  if (!department.isActive && userRole !== 'admin') {
    const error = new Error('Department is not active');
    error.code = 'NOT_FOUND'; // Keep it opaque for non-admins
    throw error;
  }

  return department;
};

const updateDepartment = async (id, updateData) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    const error = new Error('Invalid department ID');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const department = await Department.findById(id);
  if (!department) {
    const error = new Error('Department not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Only allow updating name, description, isActive
  if (updateData.name !== undefined) {
    const existingDept = await Department.findOne({ name: updateData.name.trim(), _id: { $ne: id } });
    if (existingDept) {
      const error = new Error('Department name already exists');
      error.code = 'CONFLICT';
      throw error;
    }
    department.name = updateData.name.trim();
  }
  
  if (updateData.description !== undefined) {
    department.description = updateData.description.trim();
  }
  
  if (updateData.isActive !== undefined) {
    department.isActive = updateData.isActive;
  }

  await department.save();
  return department;
};

const deleteDepartment = async (id) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    const error = new Error('Invalid department ID');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const department = await Department.findById(id);
  if (!department) {
    const error = new Error('Department not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  department.isActive = false;
  await department.save();
  return department;
};

const assignStaff = async (departmentId, userId) => {
  if (!departmentId.match(/^[0-9a-fA-F]{24}$/) || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    const error = new Error('Invalid ID');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    const error = new Error('Department not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const User = require('../models/User'); // inline require to avoid circular deps if any
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (user.role !== 'staff') {
    const error = new Error('Only staff members can be assigned to departments');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  if (department.staff.some((staffId) => String(staffId) === userId.toLowerCase())) {
    const error = new Error('User is already assigned to this department');
    error.code = 'CONFLICT';
    throw error;
  }

  department.staff.push(userId);
  await department.save();
  return department;
};

const removeStaff = async (departmentId, userId) => {
  if (!departmentId.match(/^[0-9a-fA-F]{24}$/) || !userId.match(/^[0-9a-fA-F]{24}$/)) {
    const error = new Error('Invalid ID');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    const error = new Error('Department not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const initialLength = department.staff.length;
  department.staff = department.staff.filter(id => id.toString() !== userId.toLowerCase());
  
  if (department.staff.length === initialLength) {
    const error = new Error('User is not assigned to this department');
    error.code = 'NOT_FOUND';
    throw error;
  }

  await department.save();
  return department;
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
