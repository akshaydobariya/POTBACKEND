const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes below this middleware are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', userController.getUsers);

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/:id', userController.getUser);

// @route   POST /api/users
// @desc    Create user
// @access  Private/Admin
router.post('/', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('role', 'Role is required').not().isEmpty()
], userController.createUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', userController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', userController.deleteUser);

module.exports = router; 