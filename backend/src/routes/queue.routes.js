const express = require('express');
const {
  createQueue,
  getQueues,
  getQueueById,
  updateQueue,
  pauseQueue,
  resumeQueue,
  closeQueue
} = require('../controllers/queue.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin'), createQueue);
router.get('/', getQueues);
router.get('/:id', getQueueById);
router.patch('/:id', authorize('admin'), updateQueue);

router.post('/:id/pause', authorize('admin'), pauseQueue);
router.post('/:id/resume', authorize('admin'), resumeQueue);
router.post('/:id/close', authorize('admin'), closeQueue);

// QueueEntry / User endpoints
const {
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
} = require('../controllers/queueEntry.controller');

router.post('/:queueId/join', joinQueue);
router.get('/:queueId/my-entry', getMyEntry);
router.get('/:queueId/my-history', getMyHistory);
router.post('/:queueId/leave', leaveQueue);
router.get('/:queueId/status', getQueueStatus);

// Staff endpoints
router.get('/:queueId/entries', getEntries);
router.post('/:queueId/next', callNext);
router.post('/:queueId/complete', completeCurrent);
router.post('/:queueId/skip', skipCurrent);
router.post('/:queueId/recall', recallCurrent);

module.exports = router;
