const express = require('express');
const { getUsers, updateUserRole } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);

module.exports = router;
