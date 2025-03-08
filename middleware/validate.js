// Find the inventory validation middleware and update it
exports.validateInventoryItem = [
  // Other validation rules...
  
  // Replace this:
  check('minStockLevel')
    .notEmpty()
    .withMessage('Minimum stock level is required')
    .isNumeric()
    .withMessage('Minimum stock level must be a number'),
  
  // With this:
  check('reorderLevel')
    .optional()
    .isNumeric()
    .withMessage('Reorder level must be a number'),
  
  // Rest of the validation...
]; 