const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Sale = require('../models/Sale');

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
  console.log('Creating new sale...');
  console.log('Request body:', req.body);
  console.log('User ID:', req.user.id);
  
  // Add user to req.body
  req.body.user = req.user.id;
  
  try {
    const sale = await Sale.create(req.body);
    console.log('Sale created successfully:', sale);
    
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
  const sale = await Sale.findById(req.params.id);

  if (!sale) {
    return next(new ErrorResponse(`Sale not found with id of ${req.params.id}`, 404));
  }

  await Sale.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    data: {}
  });
}); 