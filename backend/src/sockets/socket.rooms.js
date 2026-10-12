const Queue = require('../models/Queue');

const socketRooms = (io, socket) => {
  socket.on('joinQueueRoom', async (data) => {
    try {
      const queueId = data?.queueId;
      if (typeof queueId !== 'string' || !/^[0-9a-fA-F]{24}$/.test(queueId)) {
        return socket.emit('queue:error', { success: false, message: 'Invalid queue ID' });
      }

      const queue = await Queue.findById(queueId).populate('department', 'isActive');
      if (!queue || !queue.department) {
        return socket.emit('queue:error', { success: false, message: 'Queue not found' });
      }
      if (!queue.department.isActive && socket.user.role !== 'admin') {
        return socket.emit('queue:error', { success: false, message: 'Queue not found' });
      }

      const roomName = `queue:${queue._id}`;
      socket.join(roomName);
    } catch (error) {
      socket.emit('queue:error', { success: false, message: 'Server error joining room' });
    }
  });

  socket.on('leaveQueueRoom', (data) => {
    const queueId = data?.queueId;
    if (typeof queueId === 'string' && /^[0-9a-fA-F]{24}$/.test(queueId)) {
      socket.leave(`queue:${queueId.toLowerCase()}`);
    }
  });
};

module.exports = socketRooms;
