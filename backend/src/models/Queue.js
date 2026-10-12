const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  prefix: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  currentToken: {
    type: Number,
    default: 0,
  },
  lastIssuedToken: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active',
    index: true,
  },
  averageServiceTime: {
    type: Number,
    default: 5,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

// Prevent duplicate queue names within the same department
queueSchema.index({ department: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Queue', queueSchema);
