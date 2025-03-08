const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const inventoryController = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// @route   GET /api/inventory
// @desc    Get all inventory items
// @access  Private
router.get('/', inventoryController.getInventoryItems);

// @route   GET /api/inventory/categories
// @desc    Get all inventory categories
// @access  Private
router.get('/categories', inventoryController.getCategories);

// @route   GET /api/inventory/:id
// @desc    Get single inventory item
// @access  Private
router.get('/:id', inventoryController.getInventoryItem);

// @route   POST /api/inventory
// @desc    Create new inventory item
// @access  Private/Admin/Manager
router.post('/', 
  authorize('admin', 'manager'),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('sku', 'SKU is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('quantity', 'Quantity is required').isNumeric(),
    check('price', 'Price is required').isNumeric(),
    check('minStockLevel', 'Minimum stock level is required').isNumeric()
  ], 
  inventoryController.createInventoryItem
);

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private/Admin/Manager
router.put('/:id', 
  authorize('admin', 'manager'),
  inventoryController.updateInventoryItem
);

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private/Admin
router.delete('/:id', 
  authorize('admin'),
  inventoryController.deleteInventoryItem
);

module.exports = router; 