const express = require('express');
const {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  assignStaff,
  removeStaff
} = require('../controllers/department.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

// Apply protect middleware to all department routes
router.use(protect);

router.post('/', authorize('admin'), createDepartment);
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.patch('/:id', authorize('admin'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

router.post('/:departmentId/staff/:userId', authorize('admin'), assignStaff);
router.delete('/:departmentId/staff/:userId', authorize('admin'), removeStaff);

module.exports = router;
