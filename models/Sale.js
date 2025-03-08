const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  customer: {
    type: String,
    required: [true, 'Please add a customer name']
  },
  items: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Inventory',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],
  total: {
    type: Number,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: [true, 'Please add a payment method'],
    enum: ['Cash', 'Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer']
  },
  status: {
    type: String,
    required: [true, 'Please add a status'],
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total before saving
SaleSchema.pre('save', function(next) {
  this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  next();
});

module.exports = mongoose.model('Sale', SaleSchema); 