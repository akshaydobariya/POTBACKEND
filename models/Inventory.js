const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  sku: {
    type: String,
    trim: true,
    maxlength: [50, 'SKU cannot be more than 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Electronics', 'Furniture', 'Office Supplies', 'Clothing', 'Food', 'Beverages', 'Other'],
    default: 'Other'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Please add a quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    default: 'piece',
    enum: ['piece', 'kg', 'liter', 'box', 'pack', 'set', 'pair', 'meter', 'unit']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    default: 0
  },
  supplier: {
    type: String,
    maxlength: [100, 'Supplier name cannot be more than 100 characters']
  },
  reorderLevel: {
    type: Number,
    default: 0,
    min: [0, 'Reorder level cannot be negative']
  },
  minStockLevel: {
    type: Number,
    default: 0,
    min: [0, 'Minimum stock level cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Inventory', InventorySchema); 