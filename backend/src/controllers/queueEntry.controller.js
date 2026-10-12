const queueEntryService = require('../services/queueEntry.service');

const joinQueue = async (req, res, next) => {
  try {
    const data = await queueEntryService.joinQueue(req.params.queueId, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Joined queue successfully',
      data
    });
  } catch (error) {
    if (error.code === 'BAD_REQUEST') res.status(400);
    else if (error.code === 'NOT_FOUND') res.status(404);
    else if (error.code === 'FORBIDDEN') res.status(403);
    else if (error.code === 'CONFLICT') res.status(409);
    // MongoDB duplicate key error for partial active unique index
    else if (error.code === 11000) {
      res.status(409);
      error.message = 'You are already active in this queue or token conflict';
    }
    next(error);
  }
};

const getMyEntry = async (req, res, next) => {
  try {
    const data = await queueEntryService.getMyEntry(req.params.queueId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Current entry retrieved',
      data
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') res.status(404);
    next(error);
  }
};

const getMyHistory = async (req, res, next) => {
  try {
    const data = await queueEntryService.getMyHistory(req.params.queueId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Queue history retrieved',
      data
    });
  } catch (error) {
    next(error);
  }
};

const leaveQueue = async (req, res, next) => {
  try {
    const data = await queueEntryService.leaveQueue(req.params.queueId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Left queue successfully',
      data
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') res.status(404);
    next(error);
  }
};

const getQueueStatus = async (req, res, next) => {
  try {
    const data = await queueEntryService.getQueueStatus(req.params.queueId, req.user.role);
    res.status(200).json({
      success: true,
      message: 'Queue status retrieved',
      data
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') res.status(404);
    next(error);
  }
};

const getEntries = async (req, res, next) => {
  try {
    const data = await queueEntryService.getEntries(req.params.queueId, req.user);
    res.status(200).json({
      success: true,
      message: 'Queue entries retrieved',
      data
    });
  } catch (error) {
    if (error.code === 'FORBIDDEN') res.status(403);
    else if (error.code === 'NOT_FOUND') res.status(404);
    next(error);
  }
};

const callNext = async (req, res, next) => {
  try {
    const data = await queueEntryService.callNext(req.params.queueId, req.user);
    res.status(200).json({
      success: true,
      message: 'Called next user',
      data
    });
  } catch (error) {
    if (error.code === 'FORBIDDEN') res.status(403);
    else if (error.code === 'NOT_FOUND') res.status(404);
    else if (error.code === 'CONFLICT') res.status(409);
    // Handle mongodb duplicate index on { queue: 1, status: 'serving' }
    else if (error.code === 11000) {
      res.status(409);
      error.message = 'A user is already serving';
    }
    next(error);
  }
};

const completeCurrent = async (req, res, next) => {
  try {
    const data = await queueEntryService.completeCurrent(req.params.queueId, req.user);
    res.status(200).json({
      success: true,
      message: 'User completed',
      data
    });
  } catch (error) {
    if (error.code === 'FORBIDDEN') res.status(403);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

const skipCurrent = async (req, res, next) => {
  try {
    const data = await queueEntryService.skipCurrent(req.params.queueId, req.user);
    res.status(200).json({
      success: true,
      message: 'User skipped',
      data
    });
  } catch (error) {
    if (error.code === 'FORBIDDEN') res.status(403);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

const recallCurrent = async (req, res, next) => {
  try {
    const data = await queueEntryService.recallCurrent(req.params.queueId, req.user);
    res.status(200).json({
      success: true,
      message: 'User recalled',
      data
    });
  } catch (error) {
    if (error.code === 'FORBIDDEN') res.status(403);
    else if (error.code === 'CONFLICT') res.status(409);
    next(error);
  }
};

module.exports = {
  joinQueue,
  getMyEntry,
  getMyHistory,
  leaveQueue,
  getQueueStatus,
  getEntries,
  callNext,
  completeCurrent,
  skipCurrent,
  recallCurrent
};
