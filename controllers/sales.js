const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
exports.getSales = asyncHandler(async (req, res, next) => {
  console.log('Getting all sales...');
  
  try {
    const sales = await Sale.find().populate('items.product');
    
    console.log(`Found ${sales.length} sales`);
    console.log('Sales data:', JSON.stringify(sales, null, 2));
    
    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return next(new ErrorResponse('Error fetching sales', 500));
  }
});

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
exports.getSale = asyncHandler(async (req, res, next) => {
  const sale = await Sale.findById(req.params.id).populate('items.product');

  if (!sale) {
    return next(new ErrorResponse(`Sale not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: sale
  });
});

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
exports.createSale = asyncHandler(async (req, res, next) => {
  try {
    console.log('Creating new sale...');
    console.log('Request body:', req.body);

    // First verify and update inventory quantities
    for (const item of req.body.items) {
      const inventory = await Inventory.findById(item.product);
      
      if (!inventory) {
        return next(new ErrorResponse(`Inventory item ${item.product} not found`, 404));
      }

      // Check if enough quantity is available
      if (inventory.quantity < item.quantity) {
        return next(new ErrorResponse(`Insufficient quantity for ${inventory.name}. Available: ${inventory.quantity}`, 400));
      }

      // Update inventory quantity
      inventory.quantity -= item.quantity;
      await inventory.save();
    }

    // Add user to request body
    req.body.user = req.user.id;

    // Calculate total
    req.body.total = req.body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create sale
    const sale = await Sale.create(req.body);

    // Populate product details
    await sale.populate('items.product');

    res.status(201).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    return next(new ErrorResponse('Error creating sale', 500));
  }
});

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private
exports.updateSale = asyncHandler(async (req, res, next) => {
  let sale = await Sale.findById(req.params.id);

  if (!sale) {
    return next(new ErrorResponse(`Sale not found with id of ${req.params.id}`, 404));
  }

  sale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: sale
  });
});

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private
exports.deleteSale = asyncHandler(async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return next(new ErrorResponse(`Sale not found with id of ${req.params.id}`, 404));
    }

    // Restore inventory quantities
    for (const item of sale.items) {
      const inventory = await Inventory.findById(item.product);
      if (inventory) {
        inventory.quantity += item.quantity;
        await inventory.save();
      }
    }

    // Delete the sale
    await Sale.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting sale:', error);
    return next(new ErrorResponse('Error deleting sale', 500));
  }
}); 