const Queue = require('../models/Queue');
const Department = require('../models/Department');

const createQueue = async (queueData, adminId) => {
  const { departmentId, name, prefix } = queueData;

  if (!departmentId || !name || !prefix) {
    const error = new Error('departmentId, name, and prefix are required');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  if (!departmentId.match(/^[0-9a-fA-F]{24}$/)) {
    const error = new Error('Invalid department ID');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    const error = new Error('Department not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (!department.isActive) {
    const error = new Error('Cannot create queue in an inactive department');
    error.code = 'CONFLICT';
    throw error;
  }

  const existingQueue = await Queue.findOne({ department: departmentId, name: name.trim() });
  if (existingQueue) {
    const error = new Error('A queue with this name already exists in the department');
    error.code = 'CONFLICT';
    throw error;
  }

  const queue = await Queue.create({
    department: departmentId,
    name,
    prefix,
    createdBy: adminId,
  });

  return queue;
};

const getQueues = async (filters, userRole) => {
  const query = {};

  if (filters.departmentId) {
    query.department = filters.departmentId;
  }
  
  if (filters.status) {
    query.status = filters.status;
  }

  // Normal users & staff see active queues mainly, though query filter can override if valid. 
  // Wait, prompt says: "Normal users should primarily see active queues. Admin may optionally see paused/closed queues as well."
  // If a user queries without status, default to active for non-admins, unless they specifically query, but let's just restrict non-admins from seeing closed/paused queues if appropriate or just default.
  // Actually, non-admins should probably just see 'active' queues unless we want them to see paused ones (so they know it's paused). Prompt says: "Admin may optionally see paused/closed queues as well."
  if (userRole !== 'admin') {
    const activeDepartmentIds = await Department.distinct('_id', { isActive: true });
    query.department = {
      $in: filters.departmentId
        ? activeDepartmentIds.filter((id) => String(id) === String(filters.departmentId))
        : activeDepartmentIds,
    };

    if (!filters.status) {
      query.status = { $in: ['active', 'paused'] }; // Assuming users should see paused queues so they don't think it vanished, but maybe just active? "Normal users should primarily see active queues"
    } else if (filters.status === 'closed') {
      // Don't let non-admins query closed queues just in case
      query.status = 'active'; 
    }
  }

  const queues = await Queue.find(query).populate({
    path: 'department',
    select: 'name isActive'
  });

  return queues;
};

const getQueueById = async (id, userRole) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    const error = new Error('Invalid queue ID');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const queue = await Queue.findById(id).populate({
    path: 'department',
    select: 'name isActive'
  });

  if (!queue) {
    const error = new Error('Queue not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (!queue.department) {
    const error = new Error('Queue department not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (!queue.department.isActive && userRole !== 'admin') {
    const error = new Error('Queue not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (queue.status === 'closed' && userRole !== 'admin') {
    const error = new Error('Queue is closed');
    error.code = 'NOT_FOUND';
    throw error;
  }

  return queue;
};

const updateQueue = async (id, updateData) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    const error = new Error('Invalid queue ID');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const queue = await Queue.findById(id);
  if (!queue) {
    const error = new Error('Queue not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (updateData.name !== undefined) {
    const existingQueue = await Queue.findOne({ 
      department: queue.department, 
      name: updateData.name.trim(), 
      _id: { $ne: id } 
    });
    if (existingQueue) {
      const error = new Error('A queue with this name already exists in the department');
      error.code = 'CONFLICT';
      throw error;
    }
    queue.name = updateData.name.trim();
  }

  if (updateData.prefix !== undefined) {
    queue.prefix = updateData.prefix.trim().toUpperCase();
  }

  if (updateData.averageServiceTime !== undefined) {
    queue.averageServiceTime = updateData.averageServiceTime;
  }

  await queue.save();
  return queue;
};

const setQueueStatus = async (id, status) => {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    const error = new Error('Invalid queue ID');
    error.code = 'BAD_REQUEST';
    throw error;
  }

  const queue = await Queue.findById(id);
  if (!queue) {
    const error = new Error('Queue not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (queue.status === 'closed') {
    const error = new Error('Cannot change status of a closed queue');
    error.code = 'CONFLICT';
    throw error;
  }
  
  if (status === 'resume') {
    if (queue.status === 'active') {
      const error = new Error('Queue is already active');
      error.code = 'CONFLICT';
      throw error;
    }
    queue.status = 'active';
  } else if (status === 'pause') {
    if (queue.status === 'paused') {
      const error = new Error('Queue is already paused');
      error.code = 'CONFLICT';
      throw error;
    }
    queue.status = 'paused';
  } else if (status === 'close') {
    queue.status = 'closed';
  }

  await queue.save();

  try {
    const { getIO } = require('../sockets/socket.server');
    const io = getIO();
    io.to(`queue:${queue._id}`).emit('queue:status:updated', { queueId: queue._id, status: queue.status });
    io.to(`queue:${queue._id}`).emit('queue:updated', { queue });
  } catch (err) {
    // Socket not initialized or error emitting, safe to ignore for HTTP response
  }

  return queue;
};

module.exports = {
  createQueue,
  getQueues,
  getQueueById,
  updateQueue,
  setQueueStatus
};
