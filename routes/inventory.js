const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require('../controllers/inventory');

// Routes
router.route('/')
  .get(protect, getInventoryItems)
  .post(protect, createInventoryItem);

router.route('/:id')
  .get(protect, getInventoryItem)
  .put(protect, updateInventoryItem)
  .delete(protect, deleteInventoryItem);

module.exports = router; 