const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/', dashboardController.getDashboardData);

// @route   GET /api/dashboard/sales-by-period
// @desc    Get sales data by period
// @access  Private
router.get('/sales-by-period', dashboardController.getSalesByPeriod);

// @route   GET /api/dashboard/inventory-status
// @desc    Get inventory status
// @access  Private
router.get('/inventory-status', dashboardController.getInventoryStatus);

module.exports = router; 