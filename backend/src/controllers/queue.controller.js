const queueService = require('../services/queue.service');

const createQueue = async (req, res, next) => {
  try {
    const queue = await queueService.createQueue(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Queue created successfully',
      data: queue
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'CONFLICT') res.status(409);
    else if (error.code === 'NOT_FOUND') res.status(404);
    next(error);
  }
};

const getQueues = async (req, res, next) => {
  try {
    const filters = {
      departmentId: req.query.departmentId,
      status: req.query.status
    };
    
    // Clean up undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const queues = await queueService.getQueues(filters, req.user.role);
    res.status(200).json({
      success: true,
      message: 'Queues retrieved successfully',
      data: queues
    });
  } catch (error) {
    next(error);
  }
};

const getQueueById = async (req, res, next) => {
  try {
    const queue = await queueService.getQueueById(req.params.id, req.user.role);
    res.status(200).json({
      success: true,
      message: 'Queue retrieved successfully',
      data: queue
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    next(error);
  }
};

const updateQueue = async (req, res, next) => {
  try {
    const updateData = {
      name: req.body.name,
      prefix: req.body.prefix,
      averageServiceTime: req.body.averageServiceTime
    };

    // Clean up undefined updates
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const queue = await queueService.updateQueue(req.params.id, updateData);
    res.status(200).json({
      success: true,
      message: 'Queue updated successfully',
      data: queue
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

const pauseQueue = async (req, res, next) => {
  try {
    const queue = await queueService.setQueueStatus(req.params.id, 'pause');
    res.status(200).json({
      success: true,
      message: 'Queue paused successfully',
      data: queue
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

const resumeQueue = async (req, res, next) => {
  try {
    const queue = await queueService.setQueueStatus(req.params.id, 'resume');
    res.status(200).json({
      success: true,
      message: 'Queue resumed successfully',
      data: queue
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

const closeQueue = async (req, res, next) => {
  try {
    const queue = await queueService.setQueueStatus(req.params.id, 'close');
    res.status(200).json({
      success: true,
      message: 'Queue closed successfully',
      data: queue
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

module.exports = {
  createQueue,
  getQueues,
  getQueueById,
  updateQueue,
  pauseQueue,
  resumeQueue,
  closeQueue
};
