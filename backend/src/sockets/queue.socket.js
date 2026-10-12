const { getIO } = require('./socket.server');
const QueueEntry = require('../models/QueueEntry');
const Queue = require('../models/Queue');

// We need calculateEstimates to reuse the existing logic, so we require it dynamically or duplicate?
// Wait, prompt said: "Reuse the existing queueEntry.service.js logic. Do NOT create a second position calculation algorithm."
// So we require it dynamically to avoid circular dependencies if queueEntry.service requires us.

const emitQueueState = async (queueId) => {
  try {
    const io = getIO();
    const queueEntryService = require('../services/queueEntry.service');
    
    const queueStatus = await queueEntryService.getQueueStatus(queueId);
    io.to(`queue:${queueId}`).emit('queue:updated', queueStatus);
  } catch (error) {
    // ignore
  }
};

const emitWaitingUsersUpdate = async (queueId) => {
  try {
    const io = getIO();
    const queueEntryService = require('../services/queueEntry.service');
    
    const queue = await Queue.findById(queueId);
    if (!queue) return;

    const waitingEntries = await QueueEntry.find({ queue: queueId, status: 'waiting' });
    
    // Instead of duplicating calculation logic, we use getMyEntry, but that requires user ID.
    // getMyEntry is perfect because it returns exactly what we need to emit.
    for (const entry of waitingEntries) {
      try {
        const userUpdate = await queueEntryService.getMyEntry(queueId, entry.user);
        io.to(`user:${entry.user}`).emit('user:queue:updated', userUpdate);
      } catch (err) {
        // user might not have active entry anymore in edge cases
      }
    }
  } catch (error) {
    // ignore
  }
};

const emitUserSpecificUpdate = async (userId, queueId, payload) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('user:queue:updated', payload);
  } catch (error) {
    // ignore
  }
};

const emitQueueEntryUpdated = async (queueId) => {
  try {
    const io = getIO();
    io.to(`queue:${queueId}`).emit('queue:entry:updated', { queueId });
  } catch (error) {
    // ignore
  }
};

module.exports = {
  emitQueueState,
  emitWaitingUsersUpdate,
  emitUserSpecificUpdate,
  emitQueueEntryUpdated
};
