const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please add a quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  minimumStockLevel: {
    type: Number,
    required: [true, 'Please add a minimum stock level'],
    min: [0, 'Minimum stock level cannot be negative']
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for better search performance
InventoryItemSchema.index({ name: 'text', description: 'text', category: 'text' });

// Check if stock is low
InventoryItemSchema.methods.isLowStock = function() {
  return this.quantity <= this.minimumStockLevel;
};

module.exports = mongoose.model('InventoryItem', InventoryItemSchema); 