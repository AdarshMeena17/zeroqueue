const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  queue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenNumber: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'serving', 'completed', 'skipped', 'cancelled'],
    default: 'waiting',
    index: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  calledAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  estimatedWaitTime: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

// Database-level concurrency protections
// 1. A token number must be strictly unique within a queue
queueEntrySchema.index({ queue: 1, tokenNumber: 1 }, { unique: true });

// 2. A user can only have ONE active entry (waiting or serving) per queue
queueEntrySchema.index(
  { queue: 1, user: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['waiting', 'serving'] } } }
);

// 3. A queue can only have ONE currently serving entry at a time
queueEntrySchema.index(
  { queue: 1 },
  { unique: true, partialFilterExpression: { status: 'serving' } }
);

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
