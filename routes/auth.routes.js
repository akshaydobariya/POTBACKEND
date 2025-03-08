const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/logout
// @desc    Logout user
// @access  Private
router.get('/logout', logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/update-details
// @desc    Update user details
// @access  Private
router.put('/updatedetails', protect, updateDetails);

// @route   PUT /api/auth/update-password
// @desc    Update user password
// @access  Private
router.put('/updatepassword', protect, updatePassword);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgotpassword', forgotPassword);

// @route   PUT /api/auth/reset-password/:resetToken
// @desc    Reset password
// @access  Public
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router; 