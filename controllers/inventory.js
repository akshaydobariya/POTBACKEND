const Inventory = require('../models/Inventory');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
exports.getInventoryItems = asyncHandler(async (req, res, next) => {
  try {
    console.log('Getting inventory items for user:', req.user.id);
    
    // Find all inventory items for the current user
    const inventory = await Inventory.find({ user: req.user.id });
    
    console.log(`Found ${inventory.length} inventory items`);
    
    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    return next(new ErrorResponse('Error fetching inventory items', 500));
  }
});

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
exports.getInventoryItem = asyncHandler(async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return next(new ErrorResponse(`Inventory item not found with id of ${req.params.id}`, 404));
    }
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (err) {
    console.error('Error fetching inventory item:', err);
    return next(new ErrorResponse('Error fetching inventory item', 500));
  }
});

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private
exports.createInventoryItem = asyncHandler(async (req, res, next) => {
  try {
    console.log('Creating inventory item with data:', req.body);
    
    // Add user to request body
    req.body.user = req.user.id;
    
    // Create inventory item
    const inventoryItem = await Inventory.create(req.body);
    
    console.log('Inventory item created:', inventoryItem);
    
    res.status(201).json({
      success: true,
      data: inventoryItem
    });
  } catch (err) {
    console.error('Error creating inventory item:', err);
    return next(new ErrorResponse('Error creating inventory item', 500));
  }
});

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private
exports.updateInventoryItem = asyncHandler(async (req, res, next) => {
  try {
    let item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return next(new ErrorResponse(`Inventory item not found with id of ${req.params.id}`, 404));
    }
    
    // Make sure user owns the inventory item
    if (item.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this inventory item`, 401));
    }
    
    item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (err) {
    console.error('Error updating inventory item:', err);
    return next(new ErrorResponse('Error updating inventory item', 500));
  }
});

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
exports.deleteInventoryItem = asyncHandler(async (req, res, next) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return next(new ErrorResponse(`Inventory item not found with id of ${req.params.id}`, 404));
    }
    
    // Make sure user owns the inventory item
    if (item.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this inventory item`, 401));
    }
    
    // Use deleteOne instead of remove
    await Inventory.deleteOne({ _id: req.params.id });
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    return next(new ErrorResponse('Error deleting inventory item', 500));
  }
}); 