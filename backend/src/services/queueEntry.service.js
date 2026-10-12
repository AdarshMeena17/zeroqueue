const QueueEntry = require('../models/QueueEntry');
const Queue = require('../models/Queue');

const calculateEstimates = async (queueId, tokenNumber, avgServiceTime) => {
  const peopleAhead = await QueueEntry.countDocuments({
    queue: queueId,
    status: 'waiting',
    tokenNumber: { $lt: tokenNumber }
  });

  return {
    position: peopleAhead + 1,
    peopleAhead,
    estimatedWaitTime: peopleAhead * avgServiceTime
  };
};

const {
  emitQueueState,
  emitWaitingUsersUpdate,
  emitUserSpecificUpdate,
  emitQueueEntryUpdated
} = require('../sockets/queue.socket');

const joinQueue = async (queueId, userId) => {
  const queue = await Queue.findById(queueId).populate('department', 'isActive');
  if (!queue) {
    const error = new Error('Queue not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (!queue.department || !queue.department.isActive) {
    const error = new Error('Queue not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (queue.status !== 'active') {
    const error = new Error('Queue is not active');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const existingActive = await QueueEntry.findOne({
    queue: queueId,
    user: userId,
    status: { $in: ['waiting', 'serving'] }
  });

  if (existingActive) {
    const error = new Error('You are already active in this queue');
    error.code = 'CONFLICT';
    throw error;
  }

  const updatedQueue = await Queue.findByIdAndUpdate(
    queueId,
    { $inc: { lastIssuedToken: 1 } },
    { new: true }
  );

  const tokenNumber = updatedQueue.lastIssuedToken;

  const entry = await QueueEntry.create({
    queue: queueId,
    user: userId,
    tokenNumber,
    status: 'waiting'
  });

  const estimates = await calculateEstimates(queueId, tokenNumber, queue.averageServiceTime);
  entry.estimatedWaitTime = estimates.estimatedWaitTime;
  await entry.save();

  const response = {
    entryId: entry._id,
    queueId: queue._id,
    tokenNumber,
    displayToken: `${queue.prefix}-${tokenNumber}`,
    status: entry.status,
    position: estimates.position,
    peopleAhead: estimates.peopleAhead,
    estimatedWaitTime: estimates.estimatedWaitTime
  };

  // Socket emissions
  emitQueueState(queueId);
  emitUserSpecificUpdate(userId, queueId, response);

  return response;
};

const getMyEntry = async (queueId, userId) => {
  const entry = await QueueEntry.findOne({
    queue: queueId,
    user: userId,
    status: { $in: ['waiting', 'serving'] }
  });

  if (!entry) {
    const error = new Error('No active entry found in this queue');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const queue = await Queue.findById(queueId);
  
  if (entry.status === 'serving') {
    return {
      entryId: entry._id,
      tokenNumber: entry.tokenNumber,
      displayToken: `${queue.prefix}-${entry.tokenNumber}`,
      status: entry.status,
      position: 0,
      peopleAhead: 0,
      estimatedWaitTime: 0
    };
  }

  const estimates = await calculateEstimates(queueId, entry.tokenNumber, queue.averageServiceTime);

  return {
    entryId: entry._id,
    tokenNumber: entry.tokenNumber,
    displayToken: `${queue.prefix}-${entry.tokenNumber}`,
    status: entry.status,
    position: estimates.position,
    peopleAhead: estimates.peopleAhead,
    estimatedWaitTime: estimates.estimatedWaitTime
  };
};

const getMyHistory = async (queueId, userId) => {
  const entries = await QueueEntry.find({
    queue: queueId,
    user: userId
  }).sort({ joinedAt: -1 });

  return entries;
};

const leaveQueue = async (queueId, userId) => {
  const entry = await QueueEntry.findOne({
    queue: queueId,
    user: userId,
    status: 'waiting'
  });

  if (!entry) {
    const error = new Error('No waiting entry found to cancel');
    error.code = 'NOT_FOUND';
    throw error;
  }

  entry.status = 'cancelled';
  entry.completedAt = new Date();
  await entry.save();

  // Socket emissions
  emitQueueState(queueId);
  emitWaitingUsersUpdate(queueId);

  return entry;
};

const getQueueStatus = async (queueId, userRole) => {
  const queue = await Queue.findById(queueId).populate('department', 'isActive');
  if (!queue) {
    const error = new Error('Queue not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (!queue.department || (!queue.department.isActive && userRole !== 'admin')) {
    const error = new Error('Queue not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const waitingCount = await QueueEntry.countDocuments({ queue: queueId, status: 'waiting' });
  const servingEntry = await QueueEntry.findOne({ queue: queueId, status: 'serving' });

  return {
    queueId: queue._id,
    status: queue.status,
    currentToken: queue.currentToken,
    currentDisplayToken: queue.currentToken ? `${queue.prefix}-${queue.currentToken}` : null,
    servingEntryId: servingEntry ? servingEntry._id : null,
    waitingCount,
    averageServiceTime: queue.averageServiceTime
  };
};

const verifyStaffAuthorization = async (queueId, user) => {
  const queue = await Queue.findById(queueId).populate('department');
  if (!queue || !queue.department) return false;
  if (!queue.department.isActive) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'staff') return false;

  return queue.department.staff.some((staffId) => String(staffId) === String(user._id));
};

const getEntries = async (queueId, user) => {
  const isAuth = await verifyStaffAuthorization(queueId, user);
  if (!isAuth) {
    const error = new Error('Not authorized to manage this queue');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const queue = await Queue.findById(queueId);

  const entries = await QueueEntry.find({
    queue: queueId
  }).populate({
    path: 'user',
    select: 'name email role isActive'
  }).sort({ status: -1, tokenNumber: 1 }); 
  
  const serving = entries.filter(e => e.status === 'serving');
  const waiting = entries.filter(e => e.status === 'waiting').sort((a,b) => a.tokenNumber - b.tokenNumber);
  const history = entries.filter(e => !['serving', 'waiting'].includes(e.status)).sort((a,b) => b.completedAt - a.completedAt);
  
  for (let i = 0; i < waiting.length; i++) {
    waiting[i] = waiting[i].toObject();
    waiting[i].position = i + 1;
    waiting[i].estimatedWaitTime = i * queue.averageServiceTime;
  }

  return [...serving, ...waiting, ...history];
};

const callNext = async (queueId, user) => {
  const isAuth = await verifyStaffAuthorization(queueId, user);
  if (!isAuth) {
    const error = new Error('Not authorized to manage this queue');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const queue = await Queue.findById(queueId);
  if (!queue) {
    const error = new Error('Queue not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  if (queue.status !== 'active') {
    const error = new Error('Queue must be active to call next');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const currentServing = await QueueEntry.findOne({ queue: queueId, status: 'serving' });
  if (currentServing) {
    const error = new Error('A user is already serving');
    error.code = 'CONFLICT';
    throw error;
  }

  const nextEntry = await QueueEntry.findOneAndUpdate(
    { queue: queueId, status: 'waiting' },
    { status: 'serving', calledAt: new Date() },
    { sort: { tokenNumber: 1 }, new: true }
  );

  if (!nextEntry) {
    const error = new Error('No waiting users in queue');
    error.code = 'NOT_FOUND';
    throw error;
  }

  queue.currentToken = nextEntry.tokenNumber;
  await queue.save();

  // Socket emissions
  emitQueueState(queueId);
  emitQueueEntryUpdated(queueId);
  emitWaitingUsersUpdate(queueId); // update positions of everyone else
  const myUpdate = await getMyEntry(queueId, nextEntry.user);
  emitUserSpecificUpdate(nextEntry.user, queueId, myUpdate);

  return nextEntry;
};

const completeCurrent = async (queueId, user) => {
  const isAuth = await verifyStaffAuthorization(queueId, user);
  if (!isAuth) {
    const error = new Error('Not authorized to manage this queue');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const currentServing = await QueueEntry.findOne({ queue: queueId, status: 'serving' });
  if (!currentServing) {
    const error = new Error('No serving entry exists');
    error.code = 'CONFLICT';
    throw error;
  }

  currentServing.status = 'completed';
  currentServing.completedAt = new Date();
  await currentServing.save();

  // Socket emissions
  emitQueueState(queueId);
  emitQueueEntryUpdated(queueId);
  emitUserSpecificUpdate(currentServing.user, queueId, { status: 'completed' });

  return currentServing;
};

const skipCurrent = async (queueId, user) => {
  const isAuth = await verifyStaffAuthorization(queueId, user);
  if (!isAuth) {
    const error = new Error('Not authorized to manage this queue');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const currentServing = await QueueEntry.findOne({ queue: queueId, status: 'serving' });
  if (!currentServing) {
    const error = new Error('No serving entry exists');
    error.code = 'CONFLICT';
    throw error;
  }

  currentServing.status = 'skipped';
  currentServing.completedAt = new Date();
  await currentServing.save();

  // Socket emissions
  emitQueueState(queueId);
  emitQueueEntryUpdated(queueId);
  emitUserSpecificUpdate(currentServing.user, queueId, { status: 'skipped' });

  return currentServing;
};

const recallCurrent = async (queueId, user) => {
  const isAuth = await verifyStaffAuthorization(queueId, user);
  if (!isAuth) {
    const error = new Error('Not authorized to manage this queue');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const currentServing = await QueueEntry.findOne({ queue: queueId, status: 'serving' });
  if (!currentServing) {
    const error = new Error('No serving entry exists to recall');
    error.code = 'CONFLICT';
    throw error;
  }

  currentServing.calledAt = new Date();
  await currentServing.save();

  // Socket emissions
  emitQueueState(queueId);
  emitQueueEntryUpdated(queueId);
  const myUpdate = await getMyEntry(queueId, currentServing.user);
  emitUserSpecificUpdate(currentServing.user, queueId, myUpdate);

  return currentServing;
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
