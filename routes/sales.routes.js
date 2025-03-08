const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  getSales,
  getSale,
  createSale,
  updateSale,
  deleteSale
} = require('../controllers/sales');

// @route   GET /api/sales
// @desc    Get all sales
// @access  Private
router.route('/')
  .get(protect, getSales)
  .post(protect, [
    check('customer', 'Customer name is required').not().isEmpty(),
    check('items', 'Items are required').isArray({ min: 1 }),
    check('items.*.product', 'Product ID is required for each item').not().isEmpty(),
    check('items.*.quantity', 'Quantity is required for each item').isNumeric(),
    check('items.*.price', 'Price is required for each item').isNumeric(),
    check('paymentMethod', 'Payment method is required').not().isEmpty(),
    check('total', 'Total amount is required').isNumeric()
  ], createSale);

// @route   GET /api/sales/:id
// @desc    Get single sale
// @access  Private
router.route('/:id')
  .get(protect, getSale)
  .put(protect, updateSale)
  .delete(protect, deleteSale);

module.exports = router; 